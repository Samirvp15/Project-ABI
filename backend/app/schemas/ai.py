from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.dashboard import DashboardWidget


class ChartHint(BaseModel):
    type: Literal["line", "bar", "pie", "none"] = "none"
    x_column: str | None = None
    y_column: str | None = None


class ChartBuildSpec(BaseModel):
    chart_type: str
    x_column: str | None = None
    y_column: str | None = None
    aggregation: str = "sum"


class ChatRequest(BaseModel):
    dataset_id: str
    session_id: str | None = None
    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    sql: str | None = None
    result: list[dict] | None = None
    chart_hint: ChartHint | None = None
    charts: list[DashboardWidget] | None = None
    tokens_used: int = 0


class ChatSessionItem(BaseModel):
    id: str
    dataset_id: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ChatMessageItem(BaseModel):
    id: str
    role: str
    content: str
    sql_generated: str | None = None
    result_json: list | dict | None = None
    chart_hint: ChartHint | None = None
    charts: list[DashboardWidget] | None = None
    tokens_used: int | None = None
    created_at: datetime


class ApiResponse(BaseModel):
    success: bool = True
    data: dict | list | None = None
    error: dict | None = None
