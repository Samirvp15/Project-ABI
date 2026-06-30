import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import ChatMessage, ChatSession


class ChatRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_session(self, user_id: uuid.UUID, dataset_id: uuid.UUID) -> ChatSession:
        session = ChatSession(user_id=user_id, dataset_id=dataset_id)
        self.db.add(session)
        await self.db.flush()
        await self.db.refresh(session)
        return session

    async def get_session(
        self, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> ChatSession | None:
        result = await self.db.execute(
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_sessions(
        self, user_id: uuid.UUID, dataset_id: uuid.UUID, limit: int = 20
    ) -> list[ChatSession]:
        result = await self.db.execute(
            select(ChatSession)
            .where(ChatSession.user_id == user_id, ChatSession.dataset_id == dataset_id)
            .order_by(ChatSession.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def add_message(
        self,
        session_id: uuid.UUID,
        role: str,
        content: str,
        sql_generated: str | None = None,
        result_json: list | dict | None = None,
        chart_hint_json: dict | None = None,
        charts_json: list | None = None,
        suggestions_json: list | None = None,
        tokens_used: int | None = None,
    ) -> ChatMessage:
        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            sql_generated=sql_generated,
            result_json=result_json,
            chart_hint_json=chart_hint_json,
            charts_json=charts_json,
            suggestions_json=suggestions_json,
            tokens_used=tokens_used,
        )
        self.db.add(message)
        session = await self.db.get(ChatSession, session_id)
        if session:
            session.updated_at = datetime.now(UTC)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def get_messages(self, session_id: uuid.UUID) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list(result.scalars().all())

    async def count_user_messages_last_hour(self, user_id: uuid.UUID) -> int:
        from datetime import timedelta

        one_hour_ago = datetime.now(UTC) - timedelta(hours=1)
        result = await self.db.execute(
            select(func.count())
            .select_from(ChatMessage)
            .join(ChatSession, ChatMessage.session_id == ChatSession.id)
            .where(
                ChatSession.user_id == user_id,
                ChatMessage.role == "user",
                ChatMessage.created_at >= one_hour_ago,
            )
        )
        return int(result.scalar_one())
