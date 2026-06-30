export interface ChartHint {
  type: "line" | "bar" | "pie" | "none";
  x_column?: string | null;
  y_column?: string | null;
}

export interface ChatChartWidget {
  id: string;
  type: string;
  title: string;
  config: Record<string, string | null>;
  data: Record<string, unknown> | Array<Record<string, string | number>>;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  sql?: string | null;
  result?: Record<string, unknown>[] | null;
  chart_hint?: ChartHint | null;
  charts?: ChatChartWidget[] | null;
  suggestions?: string[] | null;
  tokens_used: number;
}

export interface ChatSessionItem {
  id: string;
  dataset_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sql_generated?: string | null;
  result_json?: Record<string, unknown>[] | null;
  chart_hint?: ChartHint | null;
  charts?: ChatChartWidget[] | null;
  suggestions?: string[] | null;
  tokens_used?: number | null;
  created_at: string;
}

export interface ChatRequest {
  dataset_id: string;
  session_id?: string | null;
  message: string;
}
