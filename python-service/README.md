# InsightOps Python Service

FastAPI + SQLAlchemy service implementing the briefing report generation API for the InsightOps backend assessment.

## What This Service Does

This service exposes a REST API for creating financial briefing reports. It accepts structured briefing data (company info, key points, risks, metrics), persists it across four normalized tables, and supports rendering a styled HTML report that is stored on the briefing row for instant subsequent retrieval.

## Prerequisites

- Python 3.12
- PostgreSQL (start via Docker from repository root):

```bash
docker compose up -d postgres
```

## Setup

```bash
cd python-service
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql+psycopg://user:pass@localhost:5432/insightops` |
| `APP_ENV` | Runtime environment: `development`, `test`, or `production` |
| `APP_PORT` | Port to bind the server to (default: `8000`) |

## Run Migrations

Apply all pending migrations:

```bash
cd python-service
source .venv/bin/activate
python -m app.db.run_migrations up
```

Roll back the most recent migration:

```bash
python -m app.db.run_migrations down --steps 1
```

**How the migration runner works:**
- SQL files live in `db/migrations/`
- A `schema_migrations` table in the database tracks which files have been applied
- Up-migrations are run in sorted filename order (`001_*.sql`, `002_*.sql`, …)
- Each migration has a paired `*.down.sql` rollback file
- Already-applied migrations are skipped on re-run

## Run the Service

```bash
cd python-service
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

Interactive API docs are available at [http://localhost:8000/docs](http://localhost:8000/docs) once the server is running.

## Run Tests

```bash
cd python-service
source .venv/bin/activate
python -m pytest
```

Run a specific test file:

```bash
python -m pytest tests/test_briefings.py -v
```

The test suite uses an **in-memory SQLite database** — no running PostgreSQL instance needed for tests.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/briefings` | Create a new briefing (returns `201` with `id`) |
| `GET` | `/briefings/{id}` | Retrieve a briefing as a structured JSON view model |
| `POST` | `/briefings/{id}/generate` | Render and store the HTML report for a briefing |
| `GET` | `/briefings/{id}/html` | Return the stored HTML report (`text/html`) |

### Create Briefing — Request Body

```json
{
  "company_name": "Acme Corp",
  "ticker": "ACME",
  "sector": "Technology",
  "analyst_name": "Jane Smith",
  "summary": "Strong fundamentals with growing revenue.",
  "recommendation": "buy",
  "points": ["Revenue grew 20% YoY", "Market leader in segment"],
  "risks": ["Regulatory headwinds in EU"],
  "metrics": [
    { "name": "P/E Ratio", "value": "22.5" },
    { "name": "Revenue", "value": "$4.2B" }
  ]
}
```

**Validation rules:**
- `ticker` is automatically uppercased
- `points` requires at least 2 items
- `risks` requires at least 1 item
- `metrics` names must be unique per briefing

## Edge HTML Storage Design

`POST /briefings/{id}/generate` renders the Jinja2 template once and stores the resulting HTML string directly in the `html_content` column on the `briefings` row. `GET /briefings/{id}/html` then reads and serves that stored string directly — no re-rendering on every request. This means the HTML delivery is O(1) regardless of briefing complexity.

## Project Layout

```
python-service/
├── app/
│   ├── main.py                  # FastAPI app factory, router registration, CORS
│   ├── config.py                # Pydantic settings (reads from .env)
│   ├── api/
│   │   ├── briefings.py         # Briefing route handlers (thin controllers)
│   │   ├── health.py            # GET /health
│   │   └── sample_items.py      # Starter example routes
│   ├── db/
│   │   ├── base.py              # SQLAlchemy declarative Base
│   │   ├── session.py           # Session factory + get_db dependency
│   │   └── run_migrations.py    # Manual SQL migration runner (up/down)
│   ├── models/
│   │   ├── briefing.py          # Briefing, BriefingPoint, BriefingRisk, BriefingMetric ORM models
│   │   └── sample_item.py       # Starter SampleItem ORM model
│   ├── schemas/
│   │   ├── briefing.py          # CreateBriefingDto, BriefingReportView, BriefingCreatedResponse
│   │   └── sample_item.py       # Starter schemas
│   ├── services/
│   │   ├── briefing_service.py  # create_briefing, get_briefing, generate_and_store_html
│   │   ├── report_formatter.py  # ReportFormatter: format_briefing → view model, render_briefing_html → Jinja2
│   │   └── sample_item_service.py # Starter service
│   └── templates/
│       ├── base.html            # Base Jinja2 layout (title, body, timestamp)
│       └── report.html          # Full styled briefing report template
├── db/
│   └── migrations/
│       ├── 001_create_sample_items.sql       # Starter table
│       ├── 001_create_sample_items.down.sql
│       ├── 002_create_briefings.sql          # briefings, briefing_points, briefing_risks, briefing_metrics
│       └── 002_create_briefings.down.sql
├── tests/
│   ├── test_health.py           # Health endpoint smoke test
│   ├── test_sample_items.py     # Starter CRUD tests
│   └── test_briefings.py        # Full briefing API test suite (12 tests)
├── requirements.txt
├── pytest.ini
├── .env.example
└── NOTES.md                     # Design decisions and future improvements
```
