"use client";

import dynamic from "next/dynamic";

import { KpiWidget } from "@/components/charts/kpi-widget";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DashboardWidget } from "@/types/dashboard";

const LineChartWidget = dynamic(
  () => import("@/components/charts/line-chart-widget").then((m) => m.LineChartWidget),
  {
    ssr: false,
    loading: () => <ChartPlaceholder />,
  },
);

const BarChartWidget = dynamic(
  () => import("@/components/charts/bar-chart-widget").then((m) => m.BarChartWidget),
  {
    ssr: false,
    loading: () => <ChartPlaceholder />,
  },
);

const PieChartWidget = dynamic(
  () => import("@/components/charts/pie-chart-widget").then((m) => m.PieChartWidget),
  {
    ssr: false,
    loading: () => <ChartPlaceholder />,
  },
);

function ChartPlaceholder() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="h-72 animate-pulse rounded bg-muted/50" />
    </Card>
  );
}

interface DashboardWidgetRendererProps {
  widget: DashboardWidget;
}

export function DashboardWidgetRenderer({ widget }: DashboardWidgetRendererProps) {
  switch (widget.type) {
    case "kpi":
      return <KpiWidget widget={widget} />;
    case "line":
      return <LineChartWidget widget={widget} />;
    case "bar":
      return <BarChartWidget widget={widget} />;
    case "pie":
      return <PieChartWidget widget={widget} />;
    default:
      return null;
  }
}
