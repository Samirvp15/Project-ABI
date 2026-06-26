from pydantic import BaseModel


class DashboardSummary(BaseModel):
    row_count: int
    filtered_row_count: int


class DateRange(BaseModel):
    min: str
    max: str


class DashboardWidget(BaseModel):
    id: str
    type: str
    title: str
    config: dict
    data: list[dict] | dict


class DashboardResponse(BaseModel):
    dataset_id: str
    dataset_name: str
    date_column: str | None
    date_range: DateRange | None
    summary: DashboardSummary
    widgets: list[DashboardWidget]
