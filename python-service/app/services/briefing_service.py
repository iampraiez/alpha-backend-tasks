import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.briefing import Briefing, BriefingMetric, BriefingPoint, BriefingRisk
from app.schemas.briefing import CreateBriefingDto


def create_briefing(db: Session, payload: CreateBriefingDto) -> Briefing:
    briefing = Briefing(
        company_name=payload.company_name,
        ticker=payload.ticker,
        sector=payload.sector,
        analyst_name=payload.analyst_name,
        summary=payload.summary,
        recommendation=payload.recommendation,
        generated_at=datetime.now(timezone.utc),
    )
    
    for point in payload.points:
        briefing.points.append(BriefingPoint(point_text=point))
    
    for risk in payload.risks:
        briefing.risks.append(BriefingRisk(risk_text=risk))

    for metric in payload.metrics:
        briefing.metrics.append(BriefingMetric(name=metric.name, value=metric.value))

    db.add(briefing)
    db.commit()
    db.refresh(briefing)
    return briefing


def get_briefing(db: Session, briefing_id: int) -> Briefing | None:
    return db.query(Briefing).filter(Briefing.id == briefing_id).first()


def generate_and_store_html(db: Session, briefing: Briefing) -> None:
    from app.services.report_formatter import ReportFormatter

    formatter = ReportFormatter()
    view = formatter.format_briefing(briefing)
    
    html_content = formatter.render_briefing_html(view)
    briefing.html_content = html_content
    briefing.generated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(briefing)
