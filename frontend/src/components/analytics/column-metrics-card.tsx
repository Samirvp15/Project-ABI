import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  CategoricalMetrics,
  ColumnAnalytics,
  DateMetrics,
  NumericMetrics,
} from "@/types/analytics";

const TYPE_LABELS: Record<string, string> = {
  numeric: "Numérico",
  date: "Fecha",
  categorical: "Categórico",
  text: "Texto",
  boolean: "Booleano",
};

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return "—";
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function NumericMetricsView({ metrics }: { metrics: NumericMetrics }) {
  const items = [
    { label: "Suma", value: formatNumber(metrics.sum) },
    { label: "Promedio", value: formatNumber(metrics.avg) },
    { label: "Mínimo", value: formatNumber(metrics.min) },
    { label: "Máximo", value: formatNumber(metrics.max) },
    { label: "Conteo", value: formatNumber(metrics.count) },
    { label: "Desv. std", value: formatNumber(metrics.std_dev) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-lg font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function DateMetricsView({ metrics }: { metrics: DateMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-md bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">Desde</p>
        <p className="font-semibold">{metrics.min ?? "—"}</p>
      </div>
      <div className="rounded-md bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">Hasta</p>
        <p className="font-semibold">{metrics.max ?? "—"}</p>
      </div>
    </div>
  );
}

function CategoricalMetricsView({ metrics }: { metrics: CategoricalMetrics }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Valores únicos: <span className="font-medium text-foreground">{metrics.unique_count ?? 0}</span>
      </p>
      {metrics.top_values && metrics.top_values.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Top valores</p>
          {metrics.top_values.map((item) => (
            <div key={item.value} className="flex items-center justify-between text-sm">
              <span className="truncate pr-2">{item.value}</span>
              <Badge variant="secondary">{item.count}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ColumnMetricsCard({ column }: { column: ColumnAnalytics }) {
  const metrics = column.metrics as NumericMetrics & DateMetrics & CategoricalMetrics;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{column.name}</CardTitle>
          <Badge variant="outline">{TYPE_LABELS[column.type] ?? column.type}</Badge>
        </div>
        <CardDescription>
          {column.null_count} nulos ({column.null_percent}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {column.type === "numeric" && <NumericMetricsView metrics={metrics} />}
        {column.type === "date" && <DateMetricsView metrics={metrics} />}
        {(column.type === "categorical" || column.type === "text" || column.type === "boolean") && (
          <CategoricalMetricsView metrics={metrics} />
        )}
      </CardContent>
    </Card>
  );
}
