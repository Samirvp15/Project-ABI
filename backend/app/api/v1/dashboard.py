import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import ApiResponse
from app.schemas.dashboard import ChartBuildRequest
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/{dataset_id}", response_model=ApiResponse)
async def get_dashboard(
    dataset_id: uuid.UUID,
    date_from: str | None = Query(default=None, description="ISO date filter start"),
    date_to: str | None = Query(default=None, description="ISO date filter end"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    dashboard = await DashboardService(db).get_dashboard(
        current_user, dataset_id, date_from, date_to
    )
    return ApiResponse(success=True, data=dashboard.model_dump(mode="json"))


@router.post("/{dataset_id}/chart", response_model=ApiResponse)
async def build_chart(
    dataset_id: uuid.UUID,
    body: ChartBuildRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    widget = await DashboardService(db).build_chart(current_user, dataset_id, body)
    return ApiResponse(success=True, data=widget.model_dump(mode="json"))
