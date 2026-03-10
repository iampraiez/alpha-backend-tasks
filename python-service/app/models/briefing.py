from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Briefing(Base):
    __tablename__ = "briefings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ticker: Mapped[str] = mapped_column(String(50), nullable=False)
    sector: Mapped[str] = mapped_column(String(100), nullable=False)
    analyst_name: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(String(50), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    html_content: Mapped[str | None] = mapped_column(Text, nullable=True)

    points: Mapped[list["BriefingPoint"]] = relationship(
        back_populates="briefing", cascade="all, delete-orphan"
    )
    risks: Mapped[list["BriefingRisk"]] = relationship(
        back_populates="briefing", cascade="all, delete-orphan"
    )
    metrics: Mapped[list["BriefingMetric"]] = relationship(
        back_populates="briefing", cascade="all, delete-orphan"
    )


class BriefingPoint(Base):
    __tablename__ = "briefing_points"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    briefing_id: Mapped[int] = mapped_column(
        ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    point_text: Mapped[str] = mapped_column(Text, nullable=False)

    briefing: Mapped["Briefing"] = relationship(back_populates="points")


class BriefingRisk(Base):
    __tablename__ = "briefing_risks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    briefing_id: Mapped[int] = mapped_column(
        ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    risk_text: Mapped[str] = mapped_column(Text, nullable=False)

    briefing: Mapped["Briefing"] = relationship(back_populates="risks")


class BriefingMetric(Base):
    __tablename__ = "briefing_metrics"
    __table_args__ = (UniqueConstraint("briefing_id", "name", name="uix_briefing_metrics_briefing_id_name"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    briefing_id: Mapped[int] = mapped_column(
        ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str] = mapped_column(String(100), nullable=False)

    briefing: Mapped["Briefing"] = relationship(back_populates="metrics")
