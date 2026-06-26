import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import ApiResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/{dataset_id}", response_model=ApiResponse)
async def get_analytics(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    analytics = await AnalyticsService(db).get_analytics(current_user, dataset_id)
    return ApiResponse(success=True, data=analytics.model_dump(mode="json"))


@router.post("/{dataset_id}/refresh", response_model=ApiResponse)
async def refresh_analytics(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    analytics = await AnalyticsService(db).get_analytics(
        current_user, dataset_id, force_refresh=True
    )
    return ApiResponse(success=True, data=analytics.model_dump(mode="json"))
