from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import (
    ApiResponse,
    TokenRefresh,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=ApiResponse)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)) -> ApiResponse:
    user = await AuthService(db).register(data)
    return ApiResponse(success=True, data=user.model_dump())


@router.post("/login", response_model=ApiResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)) -> ApiResponse:
    tokens = await AuthService(db).login(data.email, data.password)
    return ApiResponse(success=True, data=tokens.model_dump())


@router.post("/refresh", response_model=ApiResponse)
async def refresh_token(data: TokenRefresh, db: AsyncSession = Depends(get_db)) -> ApiResponse:
    tokens = await AuthService(db).refresh(data.refresh_token)
    return ApiResponse(success=True, data=tokens.model_dump())


@router.get("/me", response_model=ApiResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> ApiResponse:
    user = UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
    )
    return ApiResponse(success=True, data=user.model_dump())
