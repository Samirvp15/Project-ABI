import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.data_engine.analytics_engine import compute_analytics_profile
from app.models.user import User
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.dataset_repository import DatasetRepository
from app.schemas.analytics import AnalyticsResponse, AnalyticsSummary, ColumnAnalytics


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.dataset_repo = DatasetRepository(db)
        self.analytics_repo = AnalyticsRepository(db)

    def _profile_to_response(self, dataset_id: uuid.UUID, cache) -> AnalyticsResponse:
        profile = cache.profile_json
        return AnalyticsResponse(
            dataset_id=str(dataset_id),
            computed_at=cache.computed_at,
            summary=AnalyticsSummary(**profile["summary"]),
            columns=[ColumnAnalytics(**col) for col in profile["columns"]],
        )

    async def _get_ready_dataset(self, user_id: uuid.UUID, dataset_id: uuid.UUID):
        dataset = await self.dataset_repo.get_by_id(dataset_id, user_id)
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
                    "message": "Dataset is not ready for analytics",
                },
            )
        return dataset

    async def _build_and_cache(self, dataset_id: uuid.UUID, dataset) -> AnalyticsResponse:
        columns_meta = [
            {
                "name": col.name,
                "inferred_type": col.inferred_type,
                "null_count": col.null_count,
            }
            for col in sorted(dataset.columns, key=lambda c: c.position)
        ]
        rows = await self.analytics_repo.get_all_rows(dataset_id)
        profile = compute_analytics_profile(columns_meta, rows)
        cache = await self.analytics_repo.upsert_cache(dataset_id, profile)
        return self._profile_to_response(dataset_id, cache)

    async def compute_and_cache(self, user: User, dataset_id: uuid.UUID) -> AnalyticsResponse:
        dataset = await self._get_ready_dataset(user.id, dataset_id)
        return await self._build_and_cache(dataset_id, dataset)

    async def get_analytics(
        self, user: User, dataset_id: uuid.UUID, force_refresh: bool = False
    ) -> AnalyticsResponse:
        await self._get_ready_dataset(user.id, dataset_id)

        if not force_refresh:
            cache = await self.analytics_repo.get_cache(dataset_id)
            if cache:
                return self._profile_to_response(dataset_id, cache)

        return await self.compute_and_cache(user, dataset_id)

    async def compute_after_upload(self, user_id: uuid.UUID, dataset_id: uuid.UUID) -> None:
        dataset = await self.dataset_repo.get_by_id(dataset_id, user_id)
        if dataset and dataset.status == "ready":
            await self._build_and_cache(dataset_id, dataset)
