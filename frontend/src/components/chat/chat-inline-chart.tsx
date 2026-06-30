"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { FALLBACK_CHART_COLORS } from "@/components/charts/chart-colors";
import type { ChatChartWidget } from "@/types/ai";

const CHART_HEIGHT = 280;
const INITIAL_DIMENSION = { width: 640, height: CHART_HEIGHT };

interface ChatInlineChartProps {
  chart: ChatChartWidget;
}

type XYPoint = { x: string; y: number };
type PiePoint = { name: string; value: number };
type ScatterPoint = { x: number; y: number };

function asXYData(data: ChatChartWidget["data"]): XYPoint[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is XYPoint =>
      typeof row === "object" &&
      row !== null &&
      "x" in row &&
      "y" in row &&
      typeof row.y === "number",
  );
}

function asPieData(data: ChatChartWidget["data"]): PiePoint[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is PiePoint =>
      typeof row === "object" &&
      row !== null &&
      "name" in row &&
      "value" in row &&
      typeof row.value === "number",
  );
}

function asScatterData(data: ChatChartWidget["data"]): ScatterPoint[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is ScatterPoint =>
      typeof row === "object" &&
      row !== null &&
      "x" in row &&
      "y" in row &&
      typeof row.x === "number" &&
      typeof row.y === "number",
  );
}

function ChartShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full p-4">
      <h4 className="mb-3 text-sm font-semibold leading-snug">{title}</h4>
      <div className="w-full" style={{ height: CHART_HEIGHT }}>
        {children}
      </div>
    </div>
  );
}

function EmptyChart({ title }: { title: string }) {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">Sin datos para mostrar el gráfico</p>
    </div>
  );
}

export function ChatInlineChart({ chart }: ChatInlineChartProps) {
  const type = chart.type;

  if (type === "kpi") {
    const data = chart.data as { value?: number; label?: string };
    const value = typeof data?.value === "number" ? data.value : 0;
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">{chart.title}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums">
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        {data?.label && <p className="mt-1 text-xs text-muted-foreground">{data.label}</p>}
      </div>
    );
  }

  if (type === "pie" || type === "donut") {
    const data = asPieData(chart.data);
    if (!data.length) return <EmptyChart title={chart.title} />;
    return (
      <ChartShell title={chart.title}>
        <ResponsiveContainer
          width="100%"
          height={CHART_HEIGHT}
          initialDimension={INITIAL_DIMENSION}
          minWidth={0}
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="40%"
              cy="50%"
              innerRadius={type === "donut" ? 55 : 0}
              outerRadius={type === "donut" ? 85 : 95}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={FALLBACK_CHART_COLORS[index % FALLBACK_CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  if (type === "scatter") {
    const data = asScatterData(chart.data);
    if (!data.length) return <EmptyChart title={chart.title} />;
    return (
      <ChartShell title={chart.title}>
        <ResponsiveContainer
          width="100%"
          height={CHART_HEIGHT}
          initialDimension={INITIAL_DIMENSION}
          minWidth={0}
        >
          <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" dataKey="x" tick={{ fontSize: 12 }} />
            <YAxis type="number" dataKey="y" tick={{ fontSize: 12 }} width={56} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={data} fill={FALLBACK_CHART_COLORS[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  const xyData = asXYData(chart.data);
  if (!xyData.length) return <EmptyChart title={chart.title} />;

  if (type === "horizontal_bar") {
    return (
      <ChartShell title={chart.title}>
        <ResponsiveContainer
          width="100%"
          height={CHART_HEIGHT}
          initialDimension={INITIAL_DIMENSION}
          minWidth={0}
        >
          <BarChart
            data={xyData}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 64, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="x" tick={{ fontSize: 11 }} width={60} />
            <Tooltip />
            <Bar dataKey="y" fill={FALLBACK_CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  if (type === "line") {
    return (
      <ChartShell title={chart.title}>
        <ResponsiveContainer
          width="100%"
          height={CHART_HEIGHT}
          initialDimension={INITIAL_DIMENSION}
          minWidth={0}
        >
          <LineChart data={xyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="x" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} width={56} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="y"
              stroke={FALLBACK_CHART_COLORS[0]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  if (type === "area") {
    return (
      <ChartShell title={chart.title}>
        <ResponsiveContainer
          width="100%"
          height={CHART_HEIGHT}
          initialDimension={INITIAL_DIMENSION}
          minWidth={0}
        >
          <AreaChart data={xyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="x" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} width={56} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="y"
              stroke={FALLBACK_CHART_COLORS[2]}
              fill={FALLBACK_CHART_COLORS[2]}
              fillOpacity={0.25}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  // bar, histogram, and fallback
  return (
    <ChartShell title={chart.title}>
      <ResponsiveContainer
        width="100%"
        height={CHART_HEIGHT}
        initialDimension={INITIAL_DIMENSION}
        minWidth={0}
      >
        <BarChart data={xyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="x" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} width={56} />
          <Tooltip />
          <Bar dataKey="y" fill={FALLBACK_CHART_COLORS[1]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
