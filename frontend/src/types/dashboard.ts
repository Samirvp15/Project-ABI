export type WidgetType =
  | "kpi"
  | "line"
  | "area"
  | "bar"
  | "horizontal_bar"
  | "histogram"
  | "scatter"
  | "pie"
  | "donut";

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  config: Record<string, string | null>;
  data: Record<string, unknown> | Array<Record<string, string | number>>;
}

export interface DateRange {
  min: string;
  max: string;
}

export interface DashboardProfile {
  dataset_id: string;
  dataset_name: string;
  date_column: string | null;
  date_range: DateRange | null;
  summary: {
    row_count: number;
    filtered_row_count: number;
  };
  widgets: DashboardWidget[];
}

export interface DashboardFilters {
  date_from?: string;
  date_to?: string;
}

export interface ChartBuildRequest {
  chart_type: WidgetType;
  x_column?: string;
  y_column?: string;
  aggregation?: "sum" | "avg" | "count";
  date_from?: string;
  date_to?: string;
  column_filters?: Record<string, string[]>;
}
