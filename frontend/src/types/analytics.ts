export interface AnalyticsSummary {
  row_count: number;
  column_count: number;
}

export interface ColumnAnalytics {
  name: string;
  type: string;
  null_count: number;
  null_percent: number;
  metrics: Record<string, unknown>;
}

export interface AnalyticsProfile {
  dataset_id: string;
  computed_at: string;
  summary: AnalyticsSummary;
  columns: ColumnAnalytics[];
}

export interface NumericMetrics {
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  count?: number;
  std_dev?: number;
}

export interface DateMetrics {
  min?: string;
  max?: string;
  count?: number;
}

export interface CategoricalMetrics {
  unique_count?: number;
  top_values?: { value: string; count: number }[];
}
