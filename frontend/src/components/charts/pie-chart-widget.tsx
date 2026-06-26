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

interface PieChartWidgetProps {
  widget: DashboardWidget;
}

export function PieChartWidget({ widget }: PieChartWidgetProps) {
  const data = (widget.data as Array<{ name: string; value: number }>) ?? [];

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
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
