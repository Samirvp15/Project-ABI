"use client";

import { ChartWidgetHeader } from "@/components/charts/chart-widget-header";
import { PieChartInner } from "@/components/charts/pie-chart-inner";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardWidget } from "@/types/dashboard";

interface PieChartWidgetProps {
  widget: DashboardWidget;
}

export function PieChartWidget({ widget }: PieChartWidgetProps) {
  const data = (widget.data as Array<{ name: string; value: number }>) ?? [];

  return (
    <Card className="flex h-full flex-col">
      <ChartWidgetHeader widget={widget} />
      <CardContent className="min-h-[300px] flex-1 pb-4">
        <PieChartInner data={data} />
      </CardContent>
    </Card>
  );
}
