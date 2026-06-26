"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
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

interface ScatterChartWidgetProps {
  widget: DashboardWidget;
}

export function ScatterChartWidget({ widget }: ScatterChartWidgetProps) {
  const data = (widget.data as Array<{ x: number; y: number }>) ?? [];
  const xLabel = String(widget.config.x_column ?? "X");
  const yLabel = String(widget.config.y_column ?? "Y");

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              tick={{ fontSize: 12 }}
              label={{ value: xLabel, position: "insideBottom", offset: -4, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              tick={{ fontSize: 12 }}
              width={56}
              label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11 }}
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={data} fill={FALLBACK_CHART_COLORS[5]} />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
