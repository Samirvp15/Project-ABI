"use client";

import { CalendarRange, Filter } from "lucide-react";

import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardWidget } from "@/types/dashboard";

interface ChartWidgetHeaderProps {
  widget: DashboardWidget;
}

export function ChartWidgetHeader({ widget }: ChartWidgetHeaderProps) {
  const filterSummary = widget.config.filter_summary;
  const dateSummary = widget.config.date_filter_summary;

  return (
    <CardHeader className="space-y-2 pb-3">
      <CardTitle className="text-base leading-snug">{widget.title}</CardTitle>
      {(filterSummary || dateSummary) && (
        <div className="flex flex-wrap gap-1.5">
          {filterSummary && (
            <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
              <Filter className="h-3 w-3 shrink-0" />
              <span className="truncate">{filterSummary}</span>
            </span>
          )}
          {dateSummary && (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-800 dark:text-sky-300">
              <CalendarRange className="h-3 w-3 shrink-0" />
              {dateSummary}
            </span>
          )}
        </div>
      )}
      {!filterSummary && !dateSummary && widget.config.x_label && (
        <CardDescription className="text-xs">
          {widget.config.y_label
            ? `${widget.config.y_label} por ${widget.config.x_label}`
            : String(widget.config.x_label)}
        </CardDescription>
      )}
    </CardHeader>
  );
}
