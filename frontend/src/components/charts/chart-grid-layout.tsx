import { cn } from "@/lib/utils";
import type { DashboardWidget, WidgetType } from "@/types/dashboard";

/** Spans for a 12-column grid on xl (2 cols on md, 1 on mobile). */
const CHART_GRID_SPAN: Record<WidgetType, string> = {
  kpi: "md:col-span-1 xl:col-span-3",
  pie: "md:col-span-1 xl:col-span-4",
  donut: "md:col-span-1 xl:col-span-4",
  bar: "md:col-span-1 xl:col-span-6",
  histogram: "md:col-span-1 xl:col-span-6",
  horizontal_bar: "md:col-span-2 xl:col-span-6",
  line: "md:col-span-2 xl:col-span-8",
  area: "md:col-span-2 xl:col-span-8",
  scatter: "md:col-span-2 xl:col-span-8",
};

export const CHARTS_GRID_CLASS =
  "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12";

export const KPI_GRID_CLASS =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";

export function getChartGridSpan(type: WidgetType): string {
  return CHART_GRID_SPAN[type] ?? "md:col-span-1 xl:col-span-6";
}

interface ChartGridItemProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  className?: string;
}

export function ChartGridItem({ widget, children, className }: ChartGridItemProps) {
  return (
    <div className={cn("min-h-[300px]", getChartGridSpan(widget.type), className)}>
      {children}
    </div>
  );
}
