export interface DatasetColumn {
  name: string;
  position: number;
  inferred_type: string;
  null_count: number;
  sample_values: unknown[] | null;
}

export interface Dataset {
  id: string;
  name: string;
  original_filename: string;
  file_type: string;
  row_count: number;
  column_count: number;
  status: string;
  file_hash: string | null;
  error_message: string | null;
  columns: DatasetColumn[];
  created_at: string;
  updated_at: string;
}

export interface DatasetListItem {
  id: string;
  name: string;
  original_filename: string;
  file_type: string;
  row_count: number;
  column_count: number;
  status: string;
  created_at: string;
}

export interface DatasetListResponse {
  items: DatasetListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface DatasetPreviewResponse {
  dataset_id: string;
  rows: { row_index: number; data: Record<string, unknown> }[];
  total_rows: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}
