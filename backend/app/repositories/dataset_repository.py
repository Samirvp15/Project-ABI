import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.dataset import Dataset, DatasetColumn, DatasetRow


class DatasetRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        user_id: uuid.UUID,
        name: str,
        original_filename: str,
        file_type: str,
        file_hash: str,
    ) -> Dataset:
        dataset = Dataset(
            user_id=user_id,
            name=name,
            original_filename=original_filename,
            file_type=file_type,
            file_hash=file_hash,
            status="processing",
        )
        self.db.add(dataset)
        await self.db.flush()
        await self.db.refresh(dataset)
        return dataset

    async def get_by_id(self, dataset_id: uuid.UUID, user_id: uuid.UUID) -> Dataset | None:
        result = await self.db.execute(
            select(Dataset)
            .options(selectinload(Dataset.columns))
            .where(
                Dataset.id == dataset_id,
                Dataset.user_id == user_id,
                Dataset.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self, user_id: uuid.UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[Dataset], int]:
        base = select(Dataset).where(
            Dataset.user_id == user_id,
            Dataset.deleted_at.is_(None),
        )
        count_result = await self.db.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = count_result.scalar_one()

        offset = (page - 1) * page_size
        result = await self.db.execute(
            base.order_by(Dataset.created_at.desc()).offset(offset).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def add_columns(self, dataset_id: uuid.UUID, columns: list[dict]) -> None:
        for col in columns:
            self.db.add(DatasetColumn(dataset_id=dataset_id, **col))

    async def bulk_insert_rows(self, dataset_id: uuid.UUID, rows: list[dict]) -> None:
        batch_size = 500
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            self.db.add_all(
                [
                    DatasetRow(dataset_id=dataset_id, row_index=row["row_index"], data=row["data"])
                    for row in batch
                ]
            )
            await self.db.flush()

    async def update_status(
        self,
        dataset: Dataset,
        status: str,
        row_count: int = 0,
        column_count: int = 0,
        error_message: str | None = None,
    ) -> Dataset:
        dataset.status = status
        dataset.row_count = row_count
        dataset.column_count = column_count
        dataset.error_message = error_message
        await self.db.flush()
        await self.db.refresh(dataset)
        return dataset

    async def soft_delete(self, dataset: Dataset) -> None:
        dataset.deleted_at = func.now()
        await self.db.flush()

    async def get_preview_rows(
        self, dataset_id: uuid.UUID, limit: int = 100
    ) -> list[DatasetRow]:
        result = await self.db.execute(
            select(DatasetRow)
            .where(DatasetRow.dataset_id == dataset_id)
            .order_by(DatasetRow.row_index)
            .limit(limit)
        )
        return list(result.scalars().all())
