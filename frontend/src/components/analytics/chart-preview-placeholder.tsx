"use client";

import type { ReactNode } from "react";

import { FALLBACK_CHART_COLORS } from "@/components/charts/chart-colors";
import { cn } from "@/lib/utils";
import type { WidgetType } from "@/types/dashboard";

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

function humanize(name: string | undefined) {
  if (!name) return "";
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function metricLabel(yColumn: string | undefined, aggregation: string) {
  if (!yColumn) return "Cantidad de registros";
  const label = humanize(yColumn);
  if (aggregation === "avg") return `Promedio de ${label}`;
  if (aggregation === "sum") return `Suma de ${label}`;
  if (aggregation === "count") return `Conteo de ${label}`;
  return label;
}

export function getPreviewAxisLabels(model: ChartPreviewModel) {
  const { chartType, xColumn, yColumn, aggregation } = model;

  if (chartType === "kpi") {
    return {
      xLabel: undefined,
      yLabel: undefined,
      kpiLabel: yColumn ? metricLabel(yColumn, aggregation) : "Valor",
    };
  }

  if (chartType === "pie" || chartType === "donut") {
    return {
      xLabel: xColumn ? humanize(xColumn) : "Categoría",
      yLabel: yColumn ? metricLabel(yColumn, aggregation) : "Participación",
      subtitle: xColumn ? `Participación por ${humanize(xColumn)}` : undefined,
    };
  }

  if (chartType === "histogram") {
    return {
      xLabel: xColumn ? humanize(xColumn) : "Valor numérico",
      yLabel: "Frecuencia",
    };
  }

  if (chartType === "scatter") {
    return {
      xLabel: xColumn ? humanize(xColumn) : "Eje X numérico",
      yLabel: yColumn ? humanize(yColumn) : "Eje Y numérico",
    };
  }

  if (chartType === "horizontal_bar") {
    return {
      xLabel: metricLabel(yColumn, aggregation),
      yLabel: xColumn ? humanize(xColumn) : "Categoría",
    };
  }

  if (chartType === "line" || chartType === "area") {
    return {
      xLabel: xColumn ? humanize(xColumn) : "Fecha",
      yLabel: metricLabel(yColumn, aggregation),
    };
  }

  return {
    xLabel: xColumn ? humanize(xColumn) : "Categoría",
    yLabel: metricLabel(yColumn, aggregation),
  };
}

export function getPreviewChartTitle(model: ChartPreviewModel): string {
  const { chartType, xColumn, yColumn, aggregation } = model;

  if (chartType === "kpi") {
    return yColumn ? metricLabel(yColumn, aggregation) : "Indicador KPI";
  }
  if (chartType === "pie" || chartType === "donut") {
    return xColumn ? `Participación por ${humanize(xColumn)}` : "Participación";
  }
  if (chartType === "histogram") {
    return xColumn ? `Distribución de ${humanize(xColumn)}` : "Histograma";
  }
  if (chartType === "scatter") {
    return yColumn && xColumn
      ? `${humanize(yColumn)} vs ${humanize(xColumn)}`
      : "Gráfico de dispersión";
  }
  if (chartType === "horizontal_bar") {
    return xColumn
      ? `${metricLabel(yColumn, aggregation)} por ${humanize(xColumn)}`
      : metricLabel(yColumn, aggregation);
  }
  if (chartType === "line" || chartType === "area") {
    return yColumn && xColumn
      ? `${metricLabel(yColumn, aggregation)} por ${humanize(xColumn)}`
      : "Tendencia temporal";
  }
  return xColumn
    ? `${metricLabel(yColumn, aggregation)} por ${humanize(xColumn)}`
    : metricLabel(yColumn, aggregation);
}

function PreviewFrame({
  xLabel,
  yLabel,
  children,
  className,
}: {
  xLabel?: string;
  yLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-[200px] w-full flex-col", className)}>
      <div className="flex min-h-0 flex-1 gap-1">
        {yLabel && (
          <div className="flex w-6 shrink-0 items-center justify-center">
            <span className="-rotate-90 whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
              {yLabel}
            </span>
          </div>
        )}
        <div className="relative min-h-0 min-w-0 flex-1 rounded-lg border border-dashed border-border/80 bg-muted/20 p-2">
          {children}
        </div>
      </div>
      {xLabel && (
        <p className="mt-1.5 text-center text-[10px] font-semibold text-muted-foreground">
          {xLabel}
        </p>
      )}
    </div>
  );
}

function BarPlaceholder({ horizontal = false }: { horizontal?: boolean }) {
  if (horizontal) {
    const widths = [0.55, 0.85, 0.4, 0.7, 0.5];
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
        <line x1="28" y1="8" x2="28" y2="100" stroke="currentColor" className="text-border" strokeWidth="1" />
        <line x1="28" y1="100" x2="192" y2="100" stroke="currentColor" className="text-border" strokeWidth="1" />
        {widths.map((w, i) => (
          <rect
            key={i}
            x={32}
            y={16 + i * 18}
            width={w * 140}
            height={12}
            rx={3}
            fill={FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length]}
            opacity={0.85}
          />
        ))}
      </svg>
    );
  }

  const heights = [0.45, 0.75, 0.55, 0.9, 0.6];
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
      <line x1="28" y1="8" x2="28" y2="100" stroke="currentColor" className="text-border" strokeWidth="1" />
      <line x1="28" y1="100" x2="192" y2="100" stroke="currentColor" className="text-border" strokeWidth="1" />
      {heights.map((h, i) => {
        const barH = h * 72;
        return (
          <rect
            key={i}
            x={40 + i * 32}
            y={100 - barH}
            width={22}
            height={barH}
            rx={3}
            fill={FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length]}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

function LinePlaceholder({ area = false }: { area?: boolean }) {
  const path = "M 32 85 L 55 62 L 78 70 L 102 40 L 125 52 L 148 28 L 172 45 L 185 35";
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
      <line x1="28" y1="8" x2="28" y2="100" stroke="currentColor" className="text-border" strokeWidth="1" />
      <line x1="28" y1="100" x2="192" y2="100" stroke="currentColor" className="text-border" strokeWidth="1" />
      {area && (
        <path
          d={`${path} L 185 100 L 32 100 Z`}
          fill={FALLBACK_CHART_COLORS[2]}
          opacity={0.2}
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={FALLBACK_CHART_COLORS[0]}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[32, 55, 78, 102, 125, 148, 172, 185].map((cx, i) => (
        <circle
          key={cx}
          cx={cx}
          cy={[85, 62, 70, 40, 52, 28, 45, 35][i]}
          r="3"
          fill={FALLBACK_CHART_COLORS[0]}
        />
      ))}
    </svg>
  );
}

function PiePlaceholder({ donut = false }: { donut?: boolean }) {
  const slices = [
    { start: 0, end: 100, color: FALLBACK_CHART_COLORS[0] },
    { start: 100, end: 170, color: FALLBACK_CHART_COLORS[1] },
    { start: 170, end: 250, color: FALLBACK_CHART_COLORS[2] },
    { start: 250, end: 360, color: FALLBACK_CHART_COLORS[3] },
  ];

  function arc(start: number, end: number, inner: number, outer: number) {
    const s = (start - 90) * (Math.PI / 180);
    const e = (end - 90) * (Math.PI / 180);
    const cx = 72;
    const cy = 60;
    const x1 = cx + outer * Math.cos(s);
    const y1 = cy + outer * Math.sin(s);
    const x2 = cx + outer * Math.cos(e);
    const y2 = cy + outer * Math.sin(e);
    const xi1 = cx + inner * Math.cos(e);
    const yi1 = cy + inner * Math.sin(e);
    const xi2 = cx + inner * Math.cos(s);
    const yi2 = cy + inner * Math.sin(s);
    const large = end - start > 180 ? 1 : 0;
    if (inner > 0) {
      return `M ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${inner} ${inner} 0 ${large} 0 ${xi2} ${yi2} Z`;
    }
    return `M ${cx} ${cy} L ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} Z`;
  }

  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
      {slices.map((slice, i) => (
        <path
          key={i}
          d={arc(slice.start, slice.end, donut ? 28 : 0, 48)}
          fill={slice.color}
          opacity={0.9}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${128}, ${22 + i * 22})`}>
          <circle cx="0" cy="0" r="4" fill={FALLBACK_CHART_COLORS[i]} />
          <rect x="10" y="-4" width="48" height="8" rx="2" className="fill-muted" />
        </g>
      ))}
    </svg>
  );
}

function ScatterPlaceholder() {
  const points = [
    [40, 78], [52, 65], [61, 72], [70, 48], [82, 55], [95, 38], [108, 50], [120, 32],
    [132, 42], [145, 28], [158, 35], [170, 22],
  ];
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
      <line x1="28" y1="8" x2="28" y2="100" stroke="currentColor" className="text-border" strokeWidth="1" />
      <line x1="28" y1="100" x2="192" y2="100" stroke="currentColor" className="text-border" strokeWidth="1" />
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="4.5"
          fill={FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length]}
          opacity={0.8}
        />
      ))}
    </svg>
  );
}

function KpiPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="h-10 w-36 animate-pulse rounded-lg bg-primary/15" />
      <div className="h-3 w-24 rounded bg-muted" />
    </div>
  );
}

function ChartTypePlaceholder({ type }: { type: WidgetType }) {
  switch (type) {
    case "horizontal_bar":
      return <BarPlaceholder horizontal />;
    case "line":
      return <LinePlaceholder />;
    case "area":
      return <LinePlaceholder area />;
    case "pie":
      return <PiePlaceholder />;
    case "donut":
      return <PiePlaceholder donut />;
    case "histogram":
      return <BarPlaceholder />;
    case "scatter":
      return <ScatterPlaceholder />;
    case "kpi":
      return null;
    default:
      return <BarPlaceholder />;
  }
}

export function ChartPreviewPlaceholder({ model }: { model: ChartPreviewModel }) {
  const labels = getPreviewAxisLabels(model);

  if (model.chartType === "kpi") {
    return (
      <div className="h-[200px] rounded-lg border border-dashed border-border/80 bg-muted/20">
        <KpiPlaceholder label={labels.kpiLabel ?? "Valor"} />
      </div>
    );
  }

  if (model.chartType === "pie" || model.chartType === "donut") {
    return (
      <div className="space-y-2">
        {labels.subtitle && (
          <p className="text-center text-xs font-medium text-foreground">{labels.subtitle}</p>
        )}
        <PreviewFrame xLabel={labels.xLabel} yLabel={undefined}>
          <ChartTypePlaceholder type={model.chartType} />
        </PreviewFrame>
      </div>
    );
  }

  return (
    <PreviewFrame xLabel={labels.xLabel} yLabel={labels.yLabel}>
      <ChartTypePlaceholder type={model.chartType} />
    </PreviewFrame>
  );
}
