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

import { chartMarginsWithLabels, getChartAxisLabels } from "@/components/charts/chart-axis-labels";
import { ChartAxisFrame } from "@/components/charts/chart-axis-frame";
import { ChartWidgetHeader } from "@/components/charts/chart-widget-header";
import { FALLBACK_CHART_COLORS } from "@/components/charts/chart-colors";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardWidget } from "@/types/dashboard";

interface HorizontalBarChartWidgetProps {
  widget: DashboardWidget;
}

export function HorizontalBarChartWidget({ widget }: HorizontalBarChartWidgetProps) {
  const data = (widget.data as Array<{ x: string; y: number }>) ?? [];
  const { xLabel, yLabel } = getChartAxisLabels(widget);
  const margin = chartMarginsWithLabels(!!xLabel, !!yLabel);

  return (
    <Card className="flex h-full flex-col">
      <ChartWidgetHeader widget={widget} />
      <CardContent className="h-80 flex-1 min-h-0 pb-2">
        <ChartAxisFrame xLabel={xLabel} yLabel={yLabel}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ ...margin, right: 16, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="x" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="y" fill={FALLBACK_CHART_COLORS[4]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartAxisFrame>
      </CardContent>
    </Card>
  );
}
