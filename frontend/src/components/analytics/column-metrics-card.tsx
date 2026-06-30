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
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  numeric: "Numérico",
  date: "Fecha",
  categorical: "Categórico",
  text: "Texto",
  boolean: "Booleano",
};

const TYPE_COLORS: Record<string, string> = {
  numeric: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  date: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  categorical: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  text: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  boolean: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
};

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return "—";
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <MetricTile key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}

function DateMetricsView({ metrics }: { metrics: DateMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MetricTile label="Desde" value={metrics.min ?? "—"} />
      <MetricTile label="Hasta" value={metrics.max ?? "—"} />
    </div>
  );
}

function CategoricalMetricsView({ metrics }: { metrics: CategoricalMetrics }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
        Valores únicos:{" "}
        <span className="font-semibold tabular-nums">{metrics.unique_count ?? 0}</span>
      </div>
      {metrics.top_values && metrics.top_values.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Top valores</p>
          {metrics.top_values.map((item) => (
            <div
              key={item.value}
              className="flex items-center justify-between gap-2 rounded-md border bg-background/60 px-3 py-2 text-sm"
            >
              <span className="truncate">{item.value}</span>
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {item.count}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ColumnMetricsCard({ column }: { column: ColumnAnalytics }) {
  const metrics = column.metrics as NumericMetrics & DateMetrics & CategoricalMetrics;
  const nullBarWidth = Math.min(column.null_percent, 100);

  return (
    <Card className="border-0 bg-background/60 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{column.name}</CardTitle>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              TYPE_COLORS[column.type] ?? "bg-muted text-muted-foreground",
            )}
          >
            {TYPE_LABELS[column.type] ?? column.type}
          </span>
        </div>
        <CardDescription className="space-y-2">
          <span>
            {column.null_count} nulos ({column.null_percent}%)
          </span>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500/70 transition-all"
              style={{ width: `${nullBarWidth}%` }}
            />
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {column.type === "numeric" && <NumericMetricsView metrics={metrics} />}
        {column.type === "date" && <DateMetricsView metrics={metrics} />}
        {(column.type === "categorical" ||
          column.type === "text" ||
          column.type === "boolean") && <CategoricalMetricsView metrics={metrics} />}
      </CardContent>
    </Card>
  );
}
