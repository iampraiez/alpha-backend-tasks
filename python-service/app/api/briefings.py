from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreatedResponse, BriefingReportView, CreateBriefingDto
from app.services.briefing_service import create_briefing, get_briefing
from app.services.report_formatter import ReportFormatter

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
    
    formatter = ReportFormatter()
    return formatter.format_briefing(briefing)
