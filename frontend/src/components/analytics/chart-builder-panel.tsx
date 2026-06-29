"use client";

import { useMemo, useState } from "react";

import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ChartBuildRequest, DateRange, WidgetType } from "@/types/dashboard";
import type { DatasetColumn } from "@/types/dataset";

const CHART_OPTIONS: { value: WidgetType; label: string }[] = [
  { value: "bar", label: "Barras" },
  { value: "horizontal_bar", label: "Barras horizontales" },
  { value: "line", label: "Línea temporal" },
  { value: "area", label: "Área temporal" },
  { value: "pie", label: "Pastel" },
  { value: "donut", label: "Dona" },
  { value: "histogram", label: "Histograma" },
  { value: "scatter", label: "Scatter" },
  { value: "kpi", label: "KPI" },
];

const AGG_OPTIONS = [
  { value: "sum", label: "Suma" },
  { value: "avg", label: "Promedio" },
  { value: "count", label: "Conteo" },
] as const;

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

interface ChartBuilderPanelProps {
  columns: DatasetColumn[];
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
    all: columns,
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
      return {
        x: grouped.date[0]?.name ?? "",
        y: grouped.numeric[0]?.name ?? "",
      };
    default:
      return {
        x: grouped.dimension[0]?.name ?? "",
        y: grouped.numeric[0]?.name ?? "",
      };
  }
}

export function ChartBuilderPanel({
  columns,
  dateRange,
  onGenerate,
  isLoading,
  error,
}: ChartBuilderPanelProps) {
  const grouped = useMemo(() => columnsByType(columns), [columns]);
  const [chartType, setChartType] = useState<WidgetType>("bar");
  const [xColumn, setXColumn] = useState<string | null>(null);
  const [yColumn, setYColumn] = useState<string | null>(null);
  const [aggregation, setAggregation] = useState<"sum" | "avg" | "count">("sum");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const defaultX = defaultsForChart(chartType, grouped).x;
  const defaultY = defaultsForChart(chartType, grouped).y;
  const supportsCountOnly = ["bar", "horizontal_bar", "pie", "donut"].includes(chartType);

  const handleChartTypeChange = (newType: WidgetType) => {
    setChartType(newType);
    setXColumn(null);
    setYColumn(null);
  };

  const resolvedX = xColumn ?? defaultX;
  const resolvedY = yColumn ?? defaultY;
  const ySelectValue = yColumn ?? defaultY ?? "";

  const needsX = chartType !== "kpi";
  const needsY = !["histogram"].includes(chartType);
  const xOptions =
    chartType === "histogram" || chartType === "scatter"
      ? grouped.numeric
      : chartType === "line" || chartType === "area"
        ? grouped.date
        : grouped.dimension;
  const yOptions = grouped.numeric;
  const showAggregation = ["bar", "horizontal_bar", "pie", "donut", "kpi"].includes(chartType);

  const handleSubmit = () => {
    onGenerate({
      chart_type: chartType,
      x_column: resolvedX || undefined,
      y_column: resolvedY || undefined,
      aggregation,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <h3 className="font-medium">Explorador de gráficos</h3>
        <p className="text-sm text-muted-foreground">
          Elige tipo, columnas y agregación para generar visualizaciones dinámicas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="chart-type">Tipo de gráfico</Label>
          <select
            id="chart-type"
            className={selectClass}
            value={chartType}
            onChange={(e) => handleChartTypeChange(e.target.value as WidgetType)}
          >
            {CHART_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {needsX && (
          <div className="space-y-2">
            <Label htmlFor="x-column">
              {chartType === "histogram" || chartType === "scatter"
                ? "Columna X"
                : chartType === "line" || chartType === "area"
                  ? "Columna fecha (X)"
                  : "Columna categoría (X)"}
            </Label>
            <select
              id="x-column"
              className={selectClass}
              value={xColumn ?? defaultX}
              onChange={(e) => setXColumn(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {xOptions.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.inferred_type})
                </option>
              ))}
            </select>
          </div>
        )}

        {needsY && (
          <div className="space-y-2">
            <Label htmlFor="y-column">
              {chartType === "scatter" ? "Columna Y" : "Columna valor (Y)"}
            </Label>
            <select
              id="y-column"
              className={selectClass}
              value={ySelectValue}
              onChange={(e) => setYColumn(e.target.value)}
            >
              {supportsCountOnly && (
                <option value="">Conteo (sin columna Y)</option>
              )}
              {!supportsCountOnly && <option value="">Seleccionar...</option>}
              {yOptions.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.inferred_type})
                </option>
              ))}
            </select>
          </div>
        )}

        {showAggregation && (
          <div className="space-y-2">
            <Label htmlFor="aggregation">Agregación</Label>
            <select
              id="aggregation"
              className={selectClass}
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value as "sum" | "avg" | "count")}
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

      <DateRangeFilter
        dateRange={dateRange}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApply={handleSubmit}
        onClear={() => {
          setDateFrom("");
          setDateTo("");
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Generando..." : "Generar gráfico"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

export function ChartSuggestionChip({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full border bg-background px-3 py-1 text-xs transition-colors hover:bg-muted",
        disabled && "opacity-50",
      )}
    >
      {label}
    </button>
  );
}
