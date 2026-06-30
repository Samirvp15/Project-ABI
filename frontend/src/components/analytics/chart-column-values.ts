import type { CategoricalMetrics, ColumnAnalytics } from "@/types/analytics";
import type { DatasetColumn } from "@/types/dataset";

export function getColumnValues(
  columnName: string,
  datasetColumns: DatasetColumn[],
  analyticsColumns?: ColumnAnalytics[],
): string[] {
  const analyticsCol = analyticsColumns?.find((col) => col.name === columnName);
  const topValues = (analyticsCol?.metrics as CategoricalMetrics | undefined)?.top_values;
  if (topValues?.length) {
    return topValues.map((item) => String(item.value));
  }

  const datasetCol = datasetColumns.find((col) => col.name === columnName);
  if (datasetCol?.sample_values?.length) {
    return [...new Set(datasetCol.sample_values.map((item) => String(item)))].slice(0, 40);
  }

  return [];
}

export function isDimensionColumn(column?: DatasetColumn): boolean {
  if (!column) return false;
  return ["categorical", "text", "boolean"].includes(column.inferred_type);
}
