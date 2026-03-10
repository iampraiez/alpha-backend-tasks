from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

_TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class ReportFormatter:
    """Starter formatter utility for future report-generation work."""

    def __init__(self) -> None:
        self._env = Environment(
            loader=FileSystemLoader(str(_TEMPLATE_DIR)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml"), default_for_string=True),
        )

    def render_base(self, title: str, body: str) -> str:
        template = self._env.get_template("base.html")
        return template.render(title=title, body=body, generated_at=self.generated_timestamp())

    def format_briefing(self, briefing) -> "BriefingReportView":
        from app.schemas.briefing import BriefingReportView

        return BriefingReportView(
            id=briefing.id,
            title=f"Briefing: {briefing.company_name} ({briefing.ticker})",
            sector=briefing.sector,
            analyst_name=briefing.analyst_name,
            summary=briefing.summary,
            recommendation=briefing.recommendation.capitalize(),
            formatted_timestamp=briefing.generated_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
            key_points=[p.point_text for p in sorted(briefing.points, key=lambda x: x.id)],
            risks=[r.risk_text for r in sorted(briefing.risks, key=lambda x: x.id)],
            metrics={m.name: m.value for m in sorted(briefing.metrics, key=lambda x: x.name)}
        )

    @staticmethod
    def generated_timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()
