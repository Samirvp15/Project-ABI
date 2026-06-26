from datetime import datetime

from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    row_count: int
    column_count: int


class ColumnAnalytics(BaseModel):
    name: str
    type: str
    null_count: int
    null_percent: float
    metrics: dict


class AnalyticsResponse(BaseModel):
    dataset_id: str
    computed_at: datetime
    summary: AnalyticsSummary
    columns: list[ColumnAnalytics]


class ApiResponse(BaseModel):
    success: bool = True
    data: dict | list | None = None
    error: dict | None = None
