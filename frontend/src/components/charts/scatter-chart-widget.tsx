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

import { chartMarginsWithLabels, getChartAxisLabels } from "@/components/charts/chart-axis-labels";
import { ChartAxisFrame } from "@/components/charts/chart-axis-frame";
import { ChartWidgetHeader } from "@/components/charts/chart-widget-header";
import { FALLBACK_CHART_COLORS } from "@/components/charts/chart-colors";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardWidget } from "@/types/dashboard";

interface ScatterChartWidgetProps {
  widget: DashboardWidget;
}

export function ScatterChartWidget({ widget }: ScatterChartWidgetProps) {
  const data = (widget.data as Array<{ x: number; y: number }>) ?? [];
  const { xLabel, yLabel } = getChartAxisLabels(widget);
  const margin = chartMarginsWithLabels(!!xLabel, !!yLabel);

  return (
    <Card className="flex h-full flex-col">
      <ChartWidgetHeader widget={widget} />
      <CardContent className="h-72 flex-1 min-h-0 pb-2">
        <ChartAxisFrame xLabel={xLabel} yLabel={yLabel}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={margin}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" dataKey="x" tick={{ fontSize: 12 }} />
              <YAxis type="number" dataKey="y" tick={{ fontSize: 12 }} width={56} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={data} fill={FALLBACK_CHART_COLORS[5]} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartAxisFrame>
      </CardContent>
    </Card>
  );
}
