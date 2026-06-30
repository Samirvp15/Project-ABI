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


class ChartBuildRequest(BaseModel):
    chart_type: str
    x_column: str | None = None
    y_column: str | None = None
    aggregation: str = "sum"
    date_from: str | None = None
    date_to: str | None = None
    column_filters: dict[str, list[str]] | None = None


class DashboardResponse(BaseModel):
    dataset_id: str
    dataset_name: str
    date_column: str | None
    date_range: DateRange | None
    summary: DashboardSummary
    widgets: list[DashboardWidget]
