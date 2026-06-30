"use client";

import { ChevronDown, Settings2, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ChartTypeIcon } from "@/components/analytics/chart-type-icons";
import {
  getColumnValues,
  isDimensionColumn,
} from "@/components/analytics/chart-column-values";
import { SegmentFilter } from "@/components/analytics/segment-filter";
import { ChartPreviewSummary } from "@/components/analytics/chart-preview-summary";
import { XAxisTagFilter } from "@/components/analytics/x-axis-tag-filter";
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
  hint: string;
}[] = [
  { value: "bar", label: "Barras", hint: "Comparar categorías" },
  { value: "horizontal_bar", label: "Barras H.", hint: "Ranking top 10" },
  { value: "line", label: "Línea", hint: "Tendencia en el tiempo" },
  { value: "area", label: "Área", hint: "Volumen acumulado" },
  { value: "pie", label: "Pastel", hint: "Proporción %" },
  { value: "donut", label: "Dona", hint: "Participación" },
  { value: "histogram", label: "Histograma", hint: "Distribución numérica" },
  { value: "scatter", label: "Dispersión", hint: "Correlación entre variables" },
  { value: "kpi", label: "KPI", hint: "Un solo número clave" },
];

const AGG_OPTIONS = [
  { value: "sum", label: "Suma" },
  { value: "avg", label: "Promedio" },
  { value: "count", label: "Conteo" },
] as const;

const DIMENSION_CHART_TYPES: WidgetType[] = ["bar", "horizontal_bar", "pie", "donut"];

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        {step}
      </span>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
    </div>
  );
}

function xAxisLabel(chartType: WidgetType) {
  if (chartType === "histogram" || chartType === "scatter") return "Eje X (Numérico)";
  if (chartType === "line" || chartType === "area") return "Eje X (Fecha)";
  return "Eje X (Dimensión)";
}

function yAxisLabel(chartType: WidgetType) {
  if (chartType === "scatter") return "Eje Y (Numérico)";
  return "Eje Y (Métrica)";
}

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
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
    const filters: Record<string, string[]> = {};
    for (const [col, vals] of Object.entries(segmentFilters)) {
      if (vals.length > 0) filters[col] = vals;
    }
    if (xAxisValues.length > 0 && resolvedX) {
      filters[resolvedX] = xAxisValues;
    }
    return Object.keys(filters).length > 0 ? filters : undefined;
  };

  const previewModel = useMemo(
    () => ({
      chartType,
      xColumn: resolvedX || undefined,
      yColumn: resolvedY || undefined,
      aggregation: effectiveAggregation,
      xAxisValues,
      segmentFilters,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      needsX,
      needsY,
    }),
    [
      chartType,
      resolvedX,
      resolvedY,
      effectiveAggregation,
      xAxisValues,
      segmentFilters,
      dateFrom,
      dateTo,
      needsX,
      needsY,
    ],
  );

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

  return (
    <Card className="overflow-hidden border border-border/80 bg-gradient-to-br from-violet-500/[0.03] via-background to-background shadow-md">
      <CardHeader className="border-b border-border/60 bg-background/80 pb-5 pt-6">
        <CardTitle className="text-xl font-bold tracking-tight">Explorador de Gráficos</CardTitle>
        <CardDescription className="text-sm">
          Configura tu visualización paso a paso.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 lg:p-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,380px)] lg:gap-10 xl:grid-cols-[1fr_400px]">
          {/* Columna izquierda — configuración */}
          <div className="space-y-8">
            {/* Paso 1 */}
            <section className="space-y-4">
              <StepHeader step={1} title="Tipo de Gráfico" />
              <div className="flex flex-wrap gap-2">
                {CHART_OPTIONS.map((opt) => {
                  const active = chartType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      title={opt.hint}
                      onClick={() => handleChartTypeChange(opt.value)}
                      className={cn(
                        "flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-xl border-2 bg-background px-2 py-2.5 transition-all",
                        active
                          ? "border-primary shadow-lg"
                          : "border-border/80 hover:border-primary/40 hover:bg-muted/30",
                      )}
                    >
                      <ChartTypeIcon type={opt.value} />
                      <span
                        className={cn(
                          "text-center text-[10px] leading-tight text-muted-foreground",
                          active ? "font-semibold text-foreground" : "font-semibold",
                        )}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {CHART_OPTIONS.find((o) => o.value === chartType)?.label} —{" "}
                {CHART_OPTIONS.find((o) => o.value === chartType)?.hint}
              </p>
            </section>

            {/* Paso 2 */}
            <section className="space-y-4">
              <StepHeader step={2} title="Configuración de Ejes" />
              <div className="space-y-4 rounded-xl border border-border/70 bg-muted/30 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {needsX && (
                    <div className="space-y-2">
                      <Label htmlFor="x-column" className="text-sm font-medium">
                        {xAxisLabel(chartType)}
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
                    <div className="space-y-2">
                      <Label htmlFor="y-column" className="text-sm font-medium">
                        {yAxisLabel(chartType)}
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
                </div>

                {showAggregation && (
                  <div className="space-y-2">
                    <Label htmlFor="aggregation" className="text-sm font-medium">
                      Agregación (Eje Y)
                    </Label>
                    <select
                      id="aggregation"
                      className={selectClass}
                      value={effectiveAggregation}
                      onChange={(e) => setAggregation(e.target.value as "sum" | "avg" | "count")}
                      disabled={supportsCountOnly && !resolvedY}
                    >
                      {AGG_OPTIONS.filter(
                        (opt) => chartType !== "kpi" || opt.value !== "count",
                      ).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {showXValuePicker && resolvedX && (
                  <XAxisTagFilter
                    columnName={resolvedX}
                    options={xValueOptions}
                    value={xAxisValues}
                    onChange={setXAxisValues}
                  />
                )}
              </div>
            </section>

            {/* Paso 3 */}
            <section className="space-y-3">
              <StepHeader step={3} title="Opciones avanzadas" />
              <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/20"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Segmentación y fechas</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      advancedOpen && "rotate-180",
                    )}
                  />
                </button>
                {advancedOpen && (
                  <div className="space-y-4 border-t border-border/60 px-4 py-4">
                    <SegmentFilter
                      columns={columns}
                      analyticsColumns={analyticsColumns}
                      excludeColumn={resolvedX}
                      value={segmentFilters}
                      onChange={setSegmentFilters}
                    />

                    {dateRange && (
                      <div className="rounded-lg border border-border/60 bg-muted/20">
                        <button
                          type="button"
                          onClick={() => setDateOpen((prev) => !prev)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                        >
                          <span className="text-sm font-medium">Filtrar por fecha</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              dateOpen && "rotate-180",
                            )}
                          />
                        </button>
                        {dateOpen && (
                          <div className="grid gap-3 border-t px-3 py-3 sm:grid-cols-2">
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
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Columna derecha — vista previa + CTA */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-4 lg:self-start">
            <div>
              <p className="text-sm font-medium text-foreground">
                Vista previa:{" "}
                <span className="font-normal text-muted-foreground">
                  Así se verá tu gráfico.
                </span>
              </p>
            </div>

            <ChartPreviewSummary model={previewModel} variant="panel" />

            <Button
              size="lg"
              className="h-12 w-full gap-2 text-base font-semibold shadow-md"
              onClick={handleSubmit}
              disabled={isLoading || (needsX && !resolvedX)}
            >
              {isLoading ? (
                "Generando…"
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generar Gráfico
                </>
              )}
            </Button>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
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
