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

import { chartMarginsWithLabels, getChartAxisLabels } from "@/components/charts/chart-axis-labels";
import { ChartAxisFrame } from "@/components/charts/chart-axis-frame";
import { ChartWidgetHeader } from "@/components/charts/chart-widget-header";
import { FALLBACK_CHART_COLORS } from "@/components/charts/chart-colors";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardWidget } from "@/types/dashboard";

interface LineChartWidgetProps {
  widget: DashboardWidget;
}

export function LineChartWidget({ widget }: LineChartWidgetProps) {
  const data = (widget.data as Array<{ x: string; y: number }>) ?? [];
  const { xLabel, yLabel } = getChartAxisLabels(widget);
  const margin = chartMarginsWithLabels(!!xLabel, !!yLabel);

  return (
    <Card className="flex h-full flex-col">
      <ChartWidgetHeader widget={widget} />
      <CardContent className="h-72 flex-1 min-h-0 pb-2">
        <ChartAxisFrame xLabel={xLabel} yLabel={yLabel}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={margin}>
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
        </ChartAxisFrame>
      </CardContent>
    </Card>
  );
}
