from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BriefingMetricCreate(BaseModel):
    name: str = Field(max_length=100)
    value: str = Field(max_length=100)


class CreateBriefingDto(BaseModel):
    company_name: str = Field(max_length=255)
    ticker: str = Field(max_length=50)
    sector: str = Field(max_length=100)
    analyst_name: str = Field(max_length=255)
    summary: str
    recommendation: str = Field(max_length=50)
    points: list[str] = Field(min_length=2)
    risks: list[str] = Field(min_length=1)
    metrics: list[BriefingMetricCreate]

    @field_validator("ticker")
    @classmethod
    def wrap_ticker_in_upper(cls, v: str) -> str:
        return v.upper()

    @field_validator("metrics")
    @classmethod
    def validate_unique_metrics(cls, metrics: list[BriefingMetricCreate]) -> list[BriefingMetricCreate]:
        names = set()
        for m in metrics:
            if m.name in names:
                raise ValueError(f"Duplicate metric name encountered: {m.name}")
            names.add(m.name)
        return metrics


class BriefingCreatedResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
