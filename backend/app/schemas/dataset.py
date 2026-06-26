from datetime import datetime

from pydantic import BaseModel, Field


class DatasetColumnResponse(BaseModel):
    name: str
    position: int
    inferred_type: str
    null_count: int
    sample_values: list | None = None


class DatasetResponse(BaseModel):
    id: str
    name: str
    original_filename: str
    file_type: str
    row_count: int
    column_count: int
    status: str
    file_hash: str | None = None
    error_message: str | None = None
    columns: list[DatasetColumnResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DatasetListItem(BaseModel):
    id: str
    name: str
    original_filename: str
    file_type: str
    row_count: int
    column_count: int
    status: str
    created_at: datetime


class DatasetPreviewRow(BaseModel):
    row_index: int
    data: dict


class DatasetPreviewResponse(BaseModel):
    dataset_id: str
    rows: list[DatasetPreviewRow]
    total_rows: int


class DatasetListResponse(BaseModel):
    items: list[DatasetListItem]
    total: int
    page: int
    page_size: int


class ApiResponse(BaseModel):
    success: bool = True
    data: dict | list | None = None
    error: dict | None = None
