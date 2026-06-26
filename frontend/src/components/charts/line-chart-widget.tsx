"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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

interface LineChartWidgetProps {
  widget: DashboardWidget;
}

export function LineChartWidget({ widget }: LineChartWidgetProps) {
  const data = (widget.data as Array<{ x: string; y: number }>) ?? [];

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="x" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} width={56} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="y"
              stroke={FALLBACK_CHART_COLORS[0]}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
