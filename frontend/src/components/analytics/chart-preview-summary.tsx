"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  Filter,
  LineChart,
  PieChart,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { WidgetType } from "@/types/dashboard";

const CHART_META: Record<
  WidgetType,
  { label: string; icon: typeof BarChart3 }
> = {
  bar: { label: "Barras", icon: BarChart3 },
  horizontal_bar: { label: "Barras horizontales", icon: BarChart3 },
  line: { label: "Línea temporal", icon: LineChart },
  area: { label: "Área temporal", icon: TrendingUp },
  pie: { label: "Pastel", icon: PieChart },
  donut: { label: "Dona", icon: PieChart },
  histogram: { label: "Histograma", icon: BarChart3 },
  scatter: { label: "Scatter", icon: TrendingUp },
  kpi: { label: "KPI", icon: Sparkles },
};

const AGG_LABELS: Record<string, string> = {
  sum: "Suma",
  avg: "Promedio",
  count: "Conteo",
};

export interface ChartPreviewModel {
  chartType: WidgetType;
  xColumn?: string;
  yColumn?: string;
  aggregation: string;
  xAxisValues: string[];
  segmentFilters: Record<string, string[]>;
  dateFrom?: string;
  dateTo?: string;
  needsX: boolean;
  needsY: boolean;
}

function humanize(name: string) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ChartPreviewSummary({ model }: { model: ChartPreviewModel }) {
  const meta = CHART_META[model.chartType];
  const Icon = meta.icon;

  const xFilterOnAxis =
    model.xColumn && model.xAxisValues.length > 0 ? model.xAxisValues : null;

  const segmentEntries = Object.entries(model.segmentFilters).filter(
    ([, vals]) => vals.length > 0,
  );

  const hasDate = Boolean(model.dateFrom || model.dateTo);
  const hasContent =
    model.needsX ||
    model.needsY ||
    xFilterOnAxis ||
    segmentEntries.length > 0 ||
    hasDate;

  if (!hasContent) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Configura los ejes para ver la vista previa del gráfico
        </p>
      </div>
    );
  }

  const yLabel = model.yColumn
    ? `${AGG_LABELS[model.aggregation] ?? model.aggregation} de ${humanize(model.yColumn)}`
    : model.aggregation === "count"
      ? "Cantidad de registros"
      : undefined;

  return (
    <div className="overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{meta.label}</span>
        <span className="text-xs text-muted-foreground">· Vista previa</span>
      </div>

      <div className="space-y-4 p-4">
        {(model.needsX || model.needsY) && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {model.needsX && model.xColumn && (
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Eje X
                </span>
                <span className="font-medium">{humanize(model.xColumn)}</span>
                {xFilterOnAxis && (
                  <span className="text-xs text-muted-foreground">
                    ({xFilterOnAxis.join(", ")})
                  </span>
                )}
              </div>
            )}
            {model.needsX && model.needsY && (
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            {model.needsY && (
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Eje Y
                </span>
                <span className="font-medium">
                  {model.yColumn ? humanize(model.yColumn) : "Conteo"}
                </span>
              </div>
            )}
          </div>
        )}

        {yLabel && model.chartType !== "kpi" && (
          <p className="text-xs text-muted-foreground">
            Medida: <span className="font-medium text-foreground">{yLabel}</span>
          </p>
        )}

        {(segmentEntries.length > 0 || (xFilterOnAxis && !model.needsX)) && (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Filter className="h-3 w-3" />
              Segmentación de datos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {segmentEntries.map(([col, vals]) => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-amber-200"
                >
                  <span className="text-amber-700/80 dark:text-amber-300/80">{humanize(col)}</span>
                  <span className="text-amber-600 dark:text-amber-400">=</span>
                  {vals.join(", ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasDate && (
          <div className="flex items-center gap-2 text-xs">
            <CalendarRange className="h-3.5 w-3.5 text-sky-600" />
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 font-medium text-sky-800 dark:text-sky-200">
              {model.dateFrom && model.dateTo
                ? `${model.dateFrom} → ${model.dateTo}`
                : model.dateFrom
                  ? `Desde ${model.dateFrom}`
                  : `Hasta ${model.dateTo}`}
            </span>
          </div>
        )}

        <p className={cn("text-[11px] leading-relaxed text-muted-foreground", "border-t pt-3")}>
          {xFilterOnAxis
            ? "Las categorías del eje X aparecerán en el gráfico. "
            : ""}
          {segmentEntries.length > 0
            ? "Los filtros de segmentación se muestran como etiqueta en el gráfico generado. "
            : ""}
          Pulsa <span className="font-medium text-foreground">Generar gráfico</span> para crearlo.
        </p>
      </div>
    </div>
  );
}
