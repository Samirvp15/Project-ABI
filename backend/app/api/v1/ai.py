import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.ai import ApiResponse, ChatRequest
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=ApiResponse)
async def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    session_id = uuid.UUID(body.session_id) if body.session_id else None
    response = await AIService(db).chat(
        current_user,
        uuid.UUID(body.dataset_id),
        body.message.strip(),
        session_id,
    )
    return ApiResponse(success=True, data=response.model_dump(mode="json"))


@router.get("/datasets/{dataset_id}/sessions", response_model=ApiResponse)
async def list_sessions(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    sessions = await AIService(db).list_sessions(current_user, dataset_id)
    return ApiResponse(
        success=True,
        data=[s.model_dump(mode="json") for s in sessions],
    )


@router.get("/sessions/{session_id}/messages", response_model=ApiResponse)
async def get_messages(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    messages = await AIService(db).get_messages(current_user, session_id)
    return ApiResponse(
        success=True,
        data=[m.model_dump(mode="json") for m in messages],
    )
