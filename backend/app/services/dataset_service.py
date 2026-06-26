import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.data_engine.pandas_engine import get_extension, parse_file
from app.models.dataset import Dataset
from app.models.user import User
from app.repositories.dataset_repository import DatasetRepository
from app.schemas.dataset import (
    DatasetColumnResponse,
    DatasetListItem,
    DatasetListResponse,
    DatasetPreviewResponse,
    DatasetPreviewRow,
    DatasetResponse,
)


class DatasetService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = DatasetRepository(db)

    def _to_response(self, dataset: Dataset) -> DatasetResponse:
        columns = [
            DatasetColumnResponse(
                name=col.name,
                position=col.position,
                inferred_type=col.inferred_type,
                null_count=col.null_count,
                sample_values=col.sample_values,
            )
            for col in sorted(dataset.columns, key=lambda c: c.position)
        ]
        return DatasetResponse(
            id=str(dataset.id),
            name=dataset.name,
            original_filename=dataset.original_filename,
            file_type=dataset.file_type,
            row_count=dataset.row_count,
            column_count=dataset.column_count,
            status=dataset.status,
            file_hash=dataset.file_hash,
            error_message=dataset.error_message,
            columns=columns,
            created_at=dataset.created_at,
            updated_at=dataset.updated_at,
        )

    async def upload(self, user: User, file: UploadFile, name: str | None = None) -> DatasetResponse:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_FILE", "message": "Filename is required"},
            )

        try:
            get_extension(file.filename)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_FILE_TYPE", "message": str(exc)},
            ) from exc

        content = await file.read()
        max_bytes = settings.max_upload_size_mb * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "FILE_TOO_LARGE",
                    "message": f"File exceeds {settings.max_upload_size_mb}MB limit",
                },
            )

        dataset_name = name or file.filename.rsplit(".", 1)[0]
        dataset = await self.repo.create(
            user_id=user.id,
            name=dataset_name,
            original_filename=file.filename,
            file_type="pending",
            file_hash="",
        )

        try:
            parsed = parse_file(content, file.filename)
            dataset.file_type = parsed.file_type
            dataset.file_hash = parsed.file_hash

            await self.repo.add_columns(
                dataset.id,
                [
                    {
                        "name": col.name,
                        "position": col.position,
                        "inferred_type": col.inferred_type,
                        "null_count": col.null_count,
                        "sample_values": col.sample_values,
                    }
                    for col in parsed.columns
                ],
            )

            row_payload = [
                {"row_index": idx, "data": row} for idx, row in enumerate(parsed.rows)
            ]
            await self.repo.bulk_insert_rows(dataset.id, row_payload)

            dataset = await self.repo.update_status(
                dataset,
                status="ready",
                row_count=len(parsed.rows),
                column_count=len(parsed.columns),
            )
            dataset = await self.repo.get_by_id(dataset.id, user.id)
            if not dataset:
                raise HTTPException(status_code=500, detail="Dataset not found after upload")

            return self._to_response(dataset)

        except ValueError as exc:
            await self.repo.update_status(dataset, status="error", error_message=str(exc))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "PARSE_ERROR", "message": str(exc)},
            ) from exc
        except Exception as exc:
            await self.repo.update_status(dataset, status="error", error_message=str(exc))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": "UPLOAD_FAILED", "message": "Failed to process file"},
            ) from exc

    async def list_datasets(
        self, user: User, page: int = 1, page_size: int = 20
    ) -> DatasetListResponse:
        datasets, total = await self.repo.list_by_user(user.id, page, page_size)
        items = [
            DatasetListItem(
                id=str(d.id),
                name=d.name,
                original_filename=d.original_filename,
                file_type=d.file_type,
                row_count=d.row_count,
                column_count=d.column_count,
                status=d.status,
                created_at=d.created_at,
            )
            for d in datasets
        ]
        return DatasetListResponse(items=items, total=total, page=page, page_size=page_size)

    async def get_dataset(self, user: User, dataset_id: uuid.UUID) -> DatasetResponse:
        dataset = await self.repo.get_by_id(dataset_id, user.id)
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "DATASET_NOT_FOUND", "message": "Dataset not found"},
            )
        return self._to_response(dataset)

    async def get_preview(
        self, user: User, dataset_id: uuid.UUID, limit: int = 100
    ) -> DatasetPreviewResponse:
        dataset = await self.repo.get_by_id(dataset_id, user.id)
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "DATASET_NOT_FOUND", "message": "Dataset not found"},
            )

        rows = await self.repo.get_preview_rows(dataset_id, limit)
        return DatasetPreviewResponse(
            dataset_id=str(dataset_id),
            rows=[DatasetPreviewRow(row_index=r.row_index, data=r.data) for r in rows],
            total_rows=dataset.row_count,
        )

    async def delete_dataset(self, user: User, dataset_id: uuid.UUID) -> None:
        dataset = await self.repo.get_by_id(dataset_id, user.id)
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "DATASET_NOT_FOUND", "message": "Dataset not found"},
            )
        from datetime import UTC, datetime

        dataset.deleted_at = datetime.now(UTC)
        await self.repo.db.flush()
