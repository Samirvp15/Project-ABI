"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { FALLBACK_CHART_COLORS } from "@/components/charts/chart-colors";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardWidget } from "@/types/dashboard";

interface HistogramChartWidgetProps {
  widget: DashboardWidget;
}

export function HistogramChartWidget({ widget }: HistogramChartWidgetProps) {
  const data = (widget.data as Array<{ x: string; y: number }>) ?? [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="x"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={70}
            />
            <YAxis tick={{ fontSize: 12 }} width={48} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="y" fill={FALLBACK_CHART_COLORS[3]} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
