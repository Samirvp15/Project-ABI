"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChartInner } from "@/components/charts/pie-chart-inner";
import type { DashboardWidget } from "@/types/dashboard";

interface DonutChartWidgetProps {
  widget: DashboardWidget;
}

export function DonutChartWidget({ widget }: DonutChartWidgetProps) {
  const data = (widget.data as Array<{ name: string; value: number }>) ?? [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base leading-snug">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[300px] flex-1 pb-4">
        <PieChartInner data={data} innerRadius={52} />
      </CardContent>
    </Card>
  );
}
