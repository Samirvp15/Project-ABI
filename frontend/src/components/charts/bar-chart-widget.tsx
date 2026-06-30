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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import type { DashboardWidget } from "@/types/dashboard";

interface BarChartWidgetProps {
  widget: DashboardWidget;
}

export function BarChartWidget({ widget }: BarChartWidgetProps) {
  const data = (widget.data as Array<{ x: string; y: number }>) ?? [];
  const { xLabel, yLabel } = getChartAxisLabels(widget);
  const margin = chartMarginsWithLabels(!!xLabel, !!yLabel, { angledXTicks: true });

  return (
    <Card className="flex h-full flex-col">
      <ChartWidgetHeader widget={widget} />
      <CardContent className="h-72 flex-1 min-h-0 pb-2">
        <ChartAxisFrame xLabel={xLabel} yLabel={yLabel}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="x"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} width={56} />
              <Tooltip />
              <Bar dataKey="y" fill={FALLBACK_CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartAxisFrame>
      </CardContent>
    </Card>
  );
}
