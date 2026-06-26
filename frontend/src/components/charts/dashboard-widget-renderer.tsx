"use client";

import dynamic from "next/dynamic";

import { KpiWidget } from "@/components/charts/kpi-widget";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DashboardWidget, WidgetType } from "@/types/dashboard";

const LineChartWidget = dynamic(
  () => import("@/components/charts/line-chart-widget").then((m) => m.LineChartWidget),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

const AreaChartWidget = dynamic(
  () => import("@/components/charts/area-chart-widget").then((m) => m.AreaChartWidget),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

const BarChartWidget = dynamic(
  () => import("@/components/charts/bar-chart-widget").then((m) => m.BarChartWidget),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

const HorizontalBarChartWidget = dynamic(
  () =>
    import("@/components/charts/horizontal-bar-chart-widget").then(
      (m) => m.HorizontalBarChartWidget,
    ),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

const HistogramChartWidget = dynamic(
  () => import("@/components/charts/histogram-chart-widget").then((m) => m.HistogramChartWidget),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

const ScatterChartWidget = dynamic(
  () => import("@/components/charts/scatter-chart-widget").then((m) => m.ScatterChartWidget),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

const PieChartWidget = dynamic(
  () => import("@/components/charts/pie-chart-widget").then((m) => m.PieChartWidget),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

const DonutChartWidget = dynamic(
  () => import("@/components/charts/donut-chart-widget").then((m) => m.DonutChartWidget),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

function ChartPlaceholder() {
  return (
    <Card className="flex h-full min-h-[300px] flex-col">
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="h-64 flex-1 min-h-0 animate-pulse rounded bg-muted/50" />
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
    case "area":
      return <AreaChartWidget widget={widget} />;
    case "bar":
      return <BarChartWidget widget={widget} />;
    case "horizontal_bar":
      return <HorizontalBarChartWidget widget={widget} />;
    case "histogram":
      return <HistogramChartWidget widget={widget} />;
    case "scatter":
      return <ScatterChartWidget widget={widget} />;
    case "pie":
      return <PieChartWidget widget={widget} />;
    case "donut":
      return <DonutChartWidget widget={widget} />;
    default:
      return null;
  }
}

export const CHART_GROUP_LABELS: Record<string, { title: string; types: WidgetType[] }> = {
  temporal: {
    title: "Tendencias temporales",
    types: ["line", "area"],
  },
  categorical: {
    title: "Distribución categórica",
    types: ["bar", "horizontal_bar", "pie", "donut"],
  },
  numeric: {
    title: "Análisis numérico",
    types: ["histogram", "scatter"],
  },
};

export function groupChartWidgets(widgets: DashboardWidget[]) {
  const groups = Object.entries(CHART_GROUP_LABELS).map(([key, { title, types }]) => ({
    key,
    title,
    widgets: widgets.filter((w) => types.includes(w.type)),
  }));

  const groupedIds = new Set(groups.flatMap((g) => g.widgets.map((w) => w.id)));
  const other = widgets.filter((w) => !groupedIds.has(w.id));

  return { groups: groups.filter((g) => g.widgets.length > 0), other };
}
