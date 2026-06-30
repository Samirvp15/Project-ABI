"use client";

import { DashboardWidgetRenderer } from "@/components/charts/dashboard-widget-renderer";
import type { ChatChartWidget } from "@/types/ai";
import type { DashboardWidget } from "@/types/dashboard";

interface ChatChartsSectionProps {
  charts: ChatChartWidget[];
}

export function ChatChartsSection({ charts }: ChatChartsSectionProps) {
  if (!charts.length) return null;

  return (
    <div className="mt-2 space-y-3 text-left">
      {charts.map((chart) => (
        <div
          key={chart.id}
          className="overflow-hidden rounded-xl border bg-background shadow-sm [&_.card]:border-0 [&_.card]:shadow-none"
        >
          <DashboardWidgetRenderer widget={chart as DashboardWidget} />
        </div>
      ))}
    </div>
  );
}
