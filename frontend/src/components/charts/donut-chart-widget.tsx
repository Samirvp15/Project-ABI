"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { FALLBACK_CHART_COLORS } from "@/components/charts/chart-colors";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardWidget } from "@/types/dashboard";

interface DonutChartWidgetProps {
  widget: DashboardWidget;
}

export function DonutChartWidget({ widget }: DonutChartWidgetProps) {
  const data = (widget.data as Array<{ name: string; value: number }>) ?? [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              label={({ name, percent }) =>
                `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={FALLBACK_CHART_COLORS[index % FALLBACK_CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
