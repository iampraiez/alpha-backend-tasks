from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreatedResponse, BriefingReportView, CreateBriefingDto
from app.services.briefing_service import create_briefing, get_briefing

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.post("", response_model=BriefingCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_briefing_endpoint(
    payload: CreateBriefingDto, db: Annotated[Session, Depends(get_db)]
) -> BriefingCreatedResponse:
    briefing = create_briefing(db, payload)
    return BriefingCreatedResponse(id=briefing.id)


@router.get("/{briefing_id}", response_model=BriefingReportView)
def get_briefing_endpoint(briefing_id: int, db: Annotated[Session, Depends(get_db)]) -> BriefingReportView:
    briefing = get_briefing(db, briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    
    from app.services.report_formatter import ReportFormatter
    
    formatter = ReportFormatter()
    return formatter.format_briefing(briefing)


@router.post("/{briefing_id}/generate", status_code=status.HTTP_200_OK)
def generate_briefing_html_endpoint(briefing_id: int, db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    briefing = get_briefing(db, briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")

    from app.services.briefing_service import generate_and_store_html
    generate_and_store_html(db, briefing)

    return {"status": "success"}


@router.get("/{briefing_id}/html")
def get_briefing_html_endpoint(briefing_id: int, db: Annotated[Session, Depends(get_db)]) -> HTMLResponse:
    briefing = get_briefing(db, briefing_id)
    if not briefing or not briefing.html_content:
        raise HTTPException(status_code=404, detail="HTML content not found")
    
    return HTMLResponse(content=briefing.html_content, media_type="text/html")
