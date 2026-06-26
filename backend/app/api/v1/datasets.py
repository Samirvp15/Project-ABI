import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.dataset import ApiResponse
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("/upload", response_model=ApiResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    dataset = await DatasetService(db).upload(current_user, file, name)
    return ApiResponse(success=True, data=dataset.model_dump(mode="json"))


@router.get("", response_model=ApiResponse)
async def list_datasets(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    result = await DatasetService(db).list_datasets(current_user, page, page_size)
    return ApiResponse(success=True, data=result.model_dump(mode="json"))


@router.get("/{dataset_id}", response_model=ApiResponse)
async def get_dataset(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    dataset = await DatasetService(db).get_dataset(current_user, dataset_id)
    return ApiResponse(success=True, data=dataset.model_dump(mode="json"))


@router.get("/{dataset_id}/preview", response_model=ApiResponse)
async def preview_dataset(
    dataset_id: uuid.UUID,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    preview = await DatasetService(db).get_preview(current_user, dataset_id, limit)
    return ApiResponse(success=True, data=preview.model_dump(mode="json"))


@router.delete("/{dataset_id}", response_model=ApiResponse)
async def delete_dataset(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    await DatasetService(db).delete_dataset(current_user, dataset_id)
    return ApiResponse(success=True, data={"deleted": True})
