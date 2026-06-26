"use client";

import {
  Area,
  AreaChart,
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

interface AreaChartWidgetProps {
  widget: DashboardWidget;
}

export function AreaChartWidget({ widget }: AreaChartWidgetProps) {
  const data = (widget.data as Array<{ x: string; y: number }>) ?? [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="x" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} width={56} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="y"
              stroke={FALLBACK_CHART_COLORS[2]}
              fill={FALLBACK_CHART_COLORS[2]}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
