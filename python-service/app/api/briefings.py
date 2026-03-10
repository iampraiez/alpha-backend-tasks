from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreatedResponse, CreateBriefingDto
from app.services.briefing_service import create_briefing

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.post("", response_model=BriefingCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_briefing_endpoint(
    payload: CreateBriefingDto, db: Annotated[Session, Depends(get_db)]
) -> BriefingCreatedResponse:
    briefing = create_briefing(db, payload)
    return BriefingCreatedResponse(id=briefing.id)
