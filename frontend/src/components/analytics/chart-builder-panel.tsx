"use client";

import { BarChart3, ChevronDown, LineChart, PieChart, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getColumnValues,
  isDimensionColumn,
} from "@/components/analytics/chart-column-values";
import { SegmentFilter } from "@/components/analytics/segment-filter";
import { ValueChipPicker } from "@/components/analytics/value-chip-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ChartBuildRequest, DateRange, WidgetType } from "@/types/dashboard";
import type { ColumnAnalytics } from "@/types/analytics";
import type { DatasetColumn } from "@/types/dataset";

const CHART_OPTIONS: {
  value: WidgetType;
  label: string;
  icon: typeof BarChart3;
  hint: string;
}[] = [
  { value: "bar", label: "Barras", icon: BarChart3, hint: "Comparar categorías" },
  { value: "horizontal_bar", label: "H. barras", icon: BarChart3, hint: "Ranking top 10" },
  { value: "line", label: "Línea", icon: LineChart, hint: "Tendencia en el tiempo" },
  { value: "area", label: "Área", icon: TrendingUp, hint: "Volumen acumulado" },
  { value: "pie", label: "Pastel", icon: PieChart, hint: "Proporción %" },
  { value: "donut", label: "Dona", icon: PieChart, hint: "Participación" },
  { value: "histogram", label: "Histograma", icon: BarChart3, hint: "Distribución numérica" },
  { value: "scatter", label: "Scatter", icon: TrendingUp, hint: "Correlación" },
  { value: "kpi", label: "KPI", icon: Sparkles, hint: "Un solo número" },
];

const AGG_OPTIONS = [
  { value: "sum", label: "Suma" },
  { value: "avg", label: "Promedio" },
  { value: "count", label: "Conteo" },
] as const;

const DIMENSION_CHART_TYPES: WidgetType[] = ["bar", "horizontal_bar", "pie", "donut"];

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

interface ChartBuilderPanelProps {
  columns: DatasetColumn[];
  analyticsColumns?: ColumnAnalytics[];
  dateRange: DateRange | null;
  onGenerate: (request: ChartBuildRequest) => void;
  isLoading?: boolean;
  error?: string | null;
}

function columnsByType(columns: DatasetColumn[]) {
  return {
    numeric: columns.filter((c) => c.inferred_type === "numeric"),
    date: columns.filter((c) => c.inferred_type === "date"),
    dimension: columns.filter((c) =>
      ["categorical", "boolean", "text", "date"].includes(c.inferred_type),
    ),
    dimensionOnly: columns.filter((c) =>
      ["categorical", "boolean", "text"].includes(c.inferred_type),
    ),
  };
}

function defaultsForChart(
  chartType: WidgetType,
  grouped: ReturnType<typeof columnsByType>,
): { x: string; y: string } {
  switch (chartType) {
    case "kpi":
      return { x: "", y: grouped.numeric[0]?.name ?? "" };
    case "histogram":
      return { x: grouped.numeric[0]?.name ?? "", y: "" };
    case "scatter":
      return {
        x: grouped.numeric[0]?.name ?? "",
        y: grouped.numeric[1]?.name ?? grouped.numeric[0]?.name ?? "",
      };
    case "line":
    case "area":
      return { x: grouped.date[0]?.name ?? "", y: grouped.numeric[0]?.name ?? "" };
    default:
      return {
        x: grouped.dimensionOnly[0]?.name ?? grouped.dimension[0]?.name ?? "",
        y: grouped.numeric[0]?.name ?? "",
      };
  }
}

export function ChartBuilderPanel({
  columns,
  analyticsColumns,
  dateRange,
  onGenerate,
  isLoading,
  error,
}: ChartBuilderPanelProps) {
  const grouped = useMemo(() => columnsByType(columns), [columns]);
  const [chartType, setChartType] = useState<WidgetType>("bar");
  const [xColumn, setXColumn] = useState<string | null>(null);
  const [yColumn, setYColumn] = useState<string | null>(null);
  const [xAxisValues, setXAxisValues] = useState<string[]>([]);
  const [segmentFilters, setSegmentFilters] = useState<Record<string, string[]>>({});
  const [aggregation, setAggregation] = useState<"sum" | "avg" | "count">("sum");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateOpen, setDateOpen] = useState(false);

  const defaultX = defaultsForChart(chartType, grouped).x;
  const defaultY = defaultsForChart(chartType, grouped).y;
  const resolvedX = xColumn ?? defaultX;
  const resolvedY = yColumn ?? defaultY;
  const supportsCountOnly = DIMENSION_CHART_TYPES.includes(chartType);

  const handleChartTypeChange = (newType: WidgetType) => {
    setChartType(newType);
    setXColumn(null);
    setYColumn(null);
    setXAxisValues([]);
    setSegmentFilters({});
  };

  useEffect(() => {
    setXAxisValues([]);
  }, [resolvedX]);

  const needsX = chartType !== "kpi";
  const needsY = chartType !== "histogram";

  const xOptions = useMemo(() => {
    if (chartType === "histogram" || chartType === "scatter") return grouped.numeric;
    if (chartType === "line" || chartType === "area") return grouped.date;
    if (chartType === "kpi") return [];
    return grouped.dimension;
  }, [chartType, grouped]);

  const yOptions = grouped.numeric;
  const showAggregation = ["bar", "horizontal_bar", "pie", "donut", "kpi"].includes(chartType);
  const effectiveAggregation = supportsCountOnly && !resolvedY ? "count" : aggregation;

  const xColumnMeta = columns.find((col) => col.name === resolvedX);
  const xValueOptions = resolvedX
    ? getColumnValues(resolvedX, columns, analyticsColumns)
    : [];
  const showXValuePicker =
    needsX && isDimensionColumn(xColumnMeta) && xValueOptions.length > 0;

  const buildColumnFilters = (): Record<string, string[]> | undefined => {
    const filters: Record<string, string[]> = { ...segmentFilters };
    if (xAxisValues.length > 0 && resolvedX) {
      filters[resolvedX] = xAxisValues;
    }
    const active = Object.fromEntries(
      Object.entries(filters).filter(([, vals]) => vals.length > 0),
    );
    return Object.keys(active).length > 0 ? active : undefined;
  };

  const handleSubmit = () => {
    onGenerate({
      chart_type: chartType,
      x_column: resolvedX || undefined,
      y_column: resolvedY || undefined,
      aggregation: effectiveAggregation,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      column_filters: buildColumnFilters(),
    });
  };

  const previewText = useMemo(() => {
    const parts: string[] = [];
    if (needsX && resolvedX) parts.push(`eje X: ${resolvedX}`);
    if (needsY && resolvedY) parts.push(`eje Y: ${resolvedY}`);
    if (xAxisValues.length > 0) parts.push(`solo ${xAxisValues.join(", ")}`);
    const seg = Object.entries(segmentFilters).filter(([, v]) => v.length);
    if (seg.length) {
      parts.push(
        seg.map(([col, vals]) => `${col} = ${vals.join("/")}`).join(" · "),
      );
    }
    return parts.join(" · ");
  }, [needsX, needsY, resolvedX, resolvedY, xAxisValues, segmentFilters]);

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Explorador de gráficos
        </CardTitle>
        <CardDescription>
          Elige el tipo, define los ejes y genera. Los filtros de categoría se reflejan en el eje X
          o en la etiqueta del gráfico.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-5">
        {/* Paso 1 */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            1 · Tipo de gráfico
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CHART_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = chartType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChartTypeChange(opt.value)}
                  className={cn(
                    "flex min-w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-center transition-all",
                    active
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                      : "border-border bg-background hover:border-primary/30 hover:bg-muted/30",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-medium leading-tight">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Paso 2 */}
        <section className="space-y-4 rounded-xl border bg-muted/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            2 · Ejes y medida
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {needsX && (
              <div className="space-y-1.5">
                <Label htmlFor="x-column">
                  {chartType === "histogram" || chartType === "scatter"
                    ? "Eje X (numérico)"
                    : chartType === "line" || chartType === "area"
                      ? "Eje X (fecha)"
                      : "Eje X (categoría)"}
                </Label>
                <select
                  id="x-column"
                  className={selectClass}
                  value={resolvedX}
                  onChange={(e) => setXColumn(e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {xOptions.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsY && (
              <div className="space-y-1.5">
                <Label htmlFor="y-column">
                  {chartType === "scatter" ? "Eje Y (numérico)" : "Eje Y (valor)"}
                </Label>
                <select
                  id="y-column"
                  className={selectClass}
                  value={yColumn ?? defaultY ?? ""}
                  onChange={(e) => setYColumn(e.target.value)}
                >
                  {supportsCountOnly && (
                    <option value="">Conteo (sin columna Y)</option>
                  )}
                  {!supportsCountOnly && <option value="">Seleccionar…</option>}
                  {yOptions.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showAggregation && (
              <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
                <Label htmlFor="aggregation">Agregación</Label>
                <select
                  id="aggregation"
                  className={selectClass}
                  value={effectiveAggregation}
                  onChange={(e) => setAggregation(e.target.value as "sum" | "avg" | "count")}
                  disabled={supportsCountOnly && !resolvedY}
                >
                  {AGG_OPTIONS.filter((opt) => chartType !== "kpi" || opt.value !== "count").map(
                    (opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}
          </div>

          {showXValuePicker && (
            <ValueChipPicker
              label={`Valores visibles en el eje X (${resolvedX})`}
              hint="Selecciona qué categorías aparecen en el gráfico. Si no eliges ninguna, se muestran todas."
              options={xValueOptions}
              value={xAxisValues}
              onChange={setXAxisValues}
            />
          )}
        </section>

        {/* Paso 3 - opcional */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            3 · Opciones avanzadas
          </p>
          <SegmentFilter
            columns={columns}
            analyticsColumns={analyticsColumns}
            excludeColumn={resolvedX}
            value={segmentFilters}
            onChange={setSegmentFilters}
          />

          {dateRange && (
            <div className="rounded-xl border bg-background/60">
              <button
                type="button"
                onClick={() => setDateOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium">Filtrar por fecha</p>
                  <p className="text-xs text-muted-foreground">Opcional · recorta el periodo analizado</p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    dateOpen && "rotate-180",
                  )}
                />
              </button>
              {dateOpen && (
                <div className="grid gap-3 border-t px-4 py-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="date-from">Desde</Label>
                    <Input
                      id="date-from"
                      type="date"
                      min={dateRange.min}
                      max={dateRange.max}
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date-to">Hasta</Label>
                    <Input
                      id="date-to"
                      type="date"
                      min={dateRange.min}
                      max={dateRange.max}
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                  {(dateFrom || dateTo) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="sm:col-span-2 sm:justify-start"
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                    >
                      Limpiar fechas
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {previewText && (
          <p className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Vista previa: </span>
            {previewText}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isLoading || (needsX && !resolvedX)}
          >
            {isLoading ? "Generando…" : "Generar gráfico"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const CHART_TYPE_ICONS: Partial<Record<WidgetType, string>> = {
  bar: "Barras",
  horizontal_bar: "H. barras",
  line: "Línea",
  area: "Área",
  pie: "Pastel",
  donut: "Dona",
  histogram: "Histograma",
  scatter: "Scatter",
  kpi: "KPI",
};

export function ChartSuggestionChip({
  label,
  chartType,
  onClick,
  disabled,
}: {
  label: string;
  chartType?: WidgetType;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start gap-1 rounded-xl border bg-background/80 p-3 text-left transition-all hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {chartType && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {CHART_TYPE_ICONS[chartType] ?? chartType}
        </span>
      )}
      <span className="line-clamp-2 text-sm font-medium leading-snug">{label}</span>
    </button>
  );
}

export function ChartSuggestionsSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex h-[72px] animate-pulse flex-col gap-2 rounded-xl border bg-muted/40 p-3"
        >
          <div className="h-4 w-16 rounded-full bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
