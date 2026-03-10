from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import SampleItem
from app.models.briefing import Briefing, BriefingMetric, BriefingPoint, BriefingRisk


VALID_PAYLOAD = {
    "company_name": "Acme Corp",
    "ticker": "acme",
    "sector": "Technology",
    "analyst_name": "Jane Smith",
    "summary": "Strong fundamentals with growing revenue.",
    "recommendation": "buy",
    "points": ["Revenue grew 20% YoY", "Market leader in segment"],
    "risks": ["Regulatory headwinds in EU"],
    "metrics": [
        {"name": "P/E Ratio", "value": "22.5"},
        {"name": "Revenue", "value": "$4.2B"},
    ],
}


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_create_briefing_returns_201(client: TestClient) -> None:
    response = client.post("/briefings", json=VALID_PAYLOAD)

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert isinstance(data["id"], int)


def test_create_briefing_normalises_ticker_to_uppercase(client: TestClient) -> None:
    response = client.post("/briefings", json=VALID_PAYLOAD)

    assert response.status_code == 201
    briefing_id = response.json()["id"]

    get_response = client.get(f"/briefings/{briefing_id}")
    assert get_response.status_code == 200
    assert get_response.json()["ticker"] == "ACME"


def test_create_briefing_rejects_fewer_than_two_points(client: TestClient) -> None:
    payload = {**VALID_PAYLOAD, "points": ["Only one point"]}
    response = client.post("/briefings", json=payload)

    assert response.status_code == 422


def test_create_briefing_rejects_duplicate_metric_names(client: TestClient) -> None:
    payload = {
        **VALID_PAYLOAD,
        "metrics": [
            {"name": "P/E Ratio", "value": "22.5"},
            {"name": "P/E Ratio", "value": "23.0"},
        ],
    }
    response = client.post("/briefings", json=payload)

    assert response.status_code == 422


def test_create_briefing_rejects_empty_risks(client: TestClient) -> None:
    payload = {**VALID_PAYLOAD, "risks": []}
    response = client.post("/briefings", json=payload)

    assert response.status_code == 422


def test_get_briefing_returns_full_view_model(client: TestClient) -> None:
    create_response = client.post("/briefings", json=VALID_PAYLOAD)
    briefing_id = create_response.json()["id"]

    response = client.get(f"/briefings/{briefing_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == "Acme Corp"
    assert data["ticker"] == "ACME"
    assert data["sector"] == "Technology"
    assert data["analyst_name"] == "Jane Smith"
    assert len(data["key_points"]) == 2
    assert len(data["risks"]) == 1
    assert "P/E Ratio" in data["metrics"]


def test_get_briefing_returns_404_for_unknown_id(client: TestClient) -> None:
    response = client.get("/briefings/99999")

    assert response.status_code == 404


def test_generate_briefing_html_returns_200(client: TestClient) -> None:
    create_response = client.post("/briefings", json=VALID_PAYLOAD)
    briefing_id = create_response.json()["id"]

    response = client.post(f"/briefings/{briefing_id}/generate")

    assert response.status_code == 200
    assert response.json() == {"status": "success"}


def test_generate_briefing_html_returns_404_for_unknown_id(client: TestClient) -> None:
    response = client.post("/briefings/99999/generate")

    assert response.status_code == 404


def test_get_briefing_html_returns_html_content(client: TestClient) -> None:
    create_response = client.post("/briefings", json=VALID_PAYLOAD)
    briefing_id = create_response.json()["id"]

    client.post(f"/briefings/{briefing_id}/generate")

    response = client.get(f"/briefings/{briefing_id}/html")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Acme Corp" in response.text
    assert "ACME" in response.text


def test_get_briefing_html_returns_404_before_generate(client: TestClient) -> None:
    create_response = client.post("/briefings", json=VALID_PAYLOAD)
    briefing_id = create_response.json()["id"]

    response = client.get(f"/briefings/{briefing_id}/html")

    assert response.status_code == 404


def test_get_briefing_html_returns_404_for_unknown_id(client: TestClient) -> None:
    response = client.get("/briefings/99999/html")

    assert response.status_code == 404
