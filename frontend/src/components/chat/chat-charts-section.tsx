"use client";

import { ChatInlineChart } from "@/components/chat/chat-inline-chart";
import type { ChatChartWidget } from "@/types/ai";

interface ChatChartsSectionProps {
  charts: ChatChartWidget[];
}

export function ChatChartsSection({ charts }: ChatChartsSectionProps) {
  if (!charts.length) return null;

  return (
    <div className="mt-3 w-full max-w-3xl space-y-4">
      {charts.map((chart) => (
        <div
          key={chart.id}
          className="w-full rounded-xl border bg-background shadow-sm"
        >
          <ChatInlineChart chart={chart} />
        </div>
      ))}
    </div>
  );
}
