import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.data_engine.dashboard_engine import build_dashboard
from app.models.user import User
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.dataset_repository import DatasetRepository
from app.schemas.dashboard import DashboardResponse, DashboardSummary, DashboardWidget, DateRange


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.dataset_repo = DatasetRepository(db)
        self.analytics_repo = AnalyticsRepository(db)

    async def get_dashboard(
        self,
        user: User,
        dataset_id: uuid.UUID,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> DashboardResponse:
        dataset = await self.dataset_repo.get_by_id(dataset_id, user.id)
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "DATASET_NOT_FOUND", "message": "Dataset not found"},
            )
        if dataset.status != "ready":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DATASET_NOT_READY",
                    "message": "Dataset is not ready for dashboard",
                },
            )

        columns_meta = [
            {
                "name": col.name,
                "inferred_type": col.inferred_type,
                "null_count": col.null_count,
            }
            for col in sorted(dataset.columns, key=lambda c: c.position)
        ]
        rows = await self.analytics_repo.get_all_rows(dataset_id)
        payload = build_dashboard(columns_meta, rows, date_from, date_to)

        date_range = None
        if payload.get("date_range"):
            date_range = DateRange(**payload["date_range"])

        return DashboardResponse(
            dataset_id=str(dataset_id),
            dataset_name=dataset.name,
            date_column=payload.get("date_column"),
            date_range=date_range,
            summary=DashboardSummary(**payload["summary"]),
            widgets=[DashboardWidget(**widget) for widget in payload["widgets"]],
        )
