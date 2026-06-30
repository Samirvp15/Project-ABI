"use client";

import { ChatInlineChart } from "@/components/chat/chat-inline-chart";
import type { ChatChartWidget } from "@/types/ai";

interface ChatChartsSectionProps {
  charts: ChatChartWidget[];
}

export function ChatChartsSection({ charts }: ChatChartsSectionProps) {
  if (!charts.length) return null;

  return (
    <div className="mt-3 w-full max-w-5xl">
      {charts.length > 1 && (
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {charts.length} gráficos
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {charts.map((chart) => (
          <div
            key={chart.id}
            className="w-full rounded-xl border bg-background shadow-sm"
          >
            <ChatInlineChart chart={chart} />
          </div>
        ))}
      </div>
    </div>
  );
}
