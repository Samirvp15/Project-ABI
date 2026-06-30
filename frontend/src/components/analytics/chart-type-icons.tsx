"use client";

import type { ReactNode } from "react";

import { FALLBACK_CHART_COLORS } from "@/components/charts/chart-colors";
import { cn } from "@/lib/utils";
import type { WidgetType } from "@/types/dashboard";

const AXIS = "stroke-current text-border";

interface ChartTypeIconProps {
  type: WidgetType;
  className?: string;
}

function MiniAxes({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 36" className="h-9 w-12" aria-hidden>
      <line x1="6" y1="4" x2="6" y2="30" className={AXIS} strokeWidth="1.2" />
      <line x1="6" y1="30" x2="44" y2="30" className={AXIS} strokeWidth="1.2" />
      {children}
    </svg>
  );
}

function BarIcon() {
  const heights = [14, 22, 17, 26, 19];
  return (
    <MiniAxes>
      {heights.map((h, i) => (
        <rect
          key={i}
          x={10 + i * 7}
          y={30 - h}
          width={5}
          height={h}
          rx={1}
          fill={FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length]}
          opacity={0.85}
        />
      ))}
    </MiniAxes>
  );
}

function HorizontalBarIcon() {
  const widths = [16, 26, 12, 22, 18];
  return (
    <MiniAxes>
      {widths.map((w, i) => (
        <rect
          key={i}
          x={8}
          y={8 + i * 5}
          width={w}
          height={3.5}
          rx={1}
          fill={FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length]}
          opacity={0.85}
        />
      ))}
    </MiniAxes>
  );
}

function LineIcon({ area }: { area?: boolean }) {
  const stroke = FALLBACK_CHART_COLORS[0];
  const path = "M 8 24 L 14 18 L 20 20 L 26 12 L 32 15 L 38 8 L 42 11";
  return (
    <MiniAxes>
      {area && (
        <path d={`${path} L 42 30 L 8 30 Z`} fill={FALLBACK_CHART_COLORS[2]} opacity={0.25} />
      )}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[8, 14, 20, 26, 32, 38, 42].map((cx, i) => (
        <circle
          key={cx}
          cx={cx}
          cy={[24, 18, 20, 12, 15, 8, 11][i]}
          r="1.8"
          fill={stroke}
        />
      ))}
    </MiniAxes>
  );
}

function PieIcon({ donut }: { donut?: boolean }) {
  const colors = FALLBACK_CHART_COLORS.slice(0, 4);

  function arc(start: number, end: number, inner: number, outer: number) {
    const s = (start - 90) * (Math.PI / 180);
    const e = (end - 90) * (Math.PI / 180);
    const cx = 24;
    const cy = 18;
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

  const slices = [
    { start: 0, end: 110 },
    { start: 110, end: 200 },
    { start: 200, end: 290 },
    { start: 290, end: 360 },
  ];

  return (
    <svg viewBox="0 0 48 36" className="h-9 w-12" aria-hidden>
      {slices.map((slice, i) => (
        <path
          key={i}
          d={arc(slice.start, slice.end, donut ? 7 : 0, 14)}
          fill={colors[i]}
          opacity={0.9}
        />
      ))}
    </svg>
  );
}

function HistogramIcon() {
  const heights = [10, 18, 24, 16, 20, 12];
  return (
    <MiniAxes>
      {heights.map((h, i) => (
        <rect
          key={i}
          x={9 + i * 5.5}
          y={30 - h}
          width={5.5}
          height={h}
          fill={FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length]}
          opacity={0.85}
        />
      ))}
    </MiniAxes>
  );
}

function ScatterIcon() {
  const points = [
    [10, 22], [14, 16], [18, 20], [22, 12], [27, 18], [31, 10], [35, 14], [39, 8],
  ];
  return (
    <MiniAxes>
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="2.2"
          fill={FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length]}
          opacity={0.85}
        />
      ))}
    </MiniAxes>
  );
}

function KpiIcon() {
  return (
    <svg viewBox="0 0 48 36" className="h-9 w-12" aria-hidden>
      <rect
        x="8"
        y="6"
        width="32"
        height="24"
        rx="4"
        className="fill-muted/60 stroke-border"
        strokeWidth="1"
      />
      <rect x="14" y="14" width="20" height="6" rx="2" fill={FALLBACK_CHART_COLORS[0]} opacity={0.85} />
      <rect x="18" y="24" width="12" height="2" rx="1" className="fill-muted-foreground/30" />
    </svg>
  );
}

export function ChartTypeIcon({ type, className }: ChartTypeIconProps) {
  const icon = (() => {
    switch (type) {
      case "bar":
        return <BarIcon />;
      case "horizontal_bar":
        return <HorizontalBarIcon />;
      case "line":
        return <LineIcon />;
      case "area":
        return <LineIcon area />;
      case "pie":
        return <PieIcon />;
      case "donut":
        return <PieIcon donut />;
      case "histogram":
        return <HistogramIcon />;
      case "scatter":
        return <ScatterIcon />;
      case "kpi":
        return <KpiIcon />;
      default:
        return <BarIcon />;
    }
  })();

  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      {icon}
    </span>
  );
}
