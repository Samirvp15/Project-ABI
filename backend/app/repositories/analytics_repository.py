import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import AnalyticsCache
from app.models.dataset import DatasetRow


class AnalyticsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_cache(self, dataset_id: uuid.UUID) -> AnalyticsCache | None:
        result = await self.db.execute(
            select(AnalyticsCache).where(AnalyticsCache.dataset_id == dataset_id)
        )
        return result.scalar_one_or_none()

    async def upsert_cache(self, dataset_id: uuid.UUID, profile_json: dict) -> AnalyticsCache:
        existing = await self.get_cache(dataset_id)
        now = datetime.now(UTC)

        if existing:
            existing.profile_json = profile_json
            existing.computed_at = now
            await self.db.flush()
            await self.db.refresh(existing)
            return existing

        cache = AnalyticsCache(dataset_id=dataset_id, profile_json=profile_json, computed_at=now)
        self.db.add(cache)
        await self.db.flush()
        await self.db.refresh(cache)
        return cache

    async def delete_cache(self, dataset_id: uuid.UUID) -> None:
        cache = await self.get_cache(dataset_id)
        if cache:
            await self.db.delete(cache)
            await self.db.flush()

    async def get_all_rows(self, dataset_id: uuid.UUID) -> list[dict]:
        result = await self.db.execute(
            select(DatasetRow)
            .where(DatasetRow.dataset_id == dataset_id)
            .order_by(DatasetRow.row_index)
        )
        return [row.data for row in result.scalars().all()]
