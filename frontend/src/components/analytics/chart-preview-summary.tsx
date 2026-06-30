"use client";

import { CalendarRange, Filter } from "lucide-react";

import {
  ChartPreviewPlaceholder,
  getPreviewChartTitle,
} from "@/components/analytics/chart-preview-placeholder";
import type { ChartPreviewModel } from "@/components/analytics/chart-preview-placeholder";
import { cn } from "@/lib/utils";

export type { ChartPreviewModel };

function humanize(name: string) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ChartPreviewSummaryProps {
  model: ChartPreviewModel;
  variant?: "default" | "panel";
}

export function ChartPreviewSummary({ model, variant = "default" }: ChartPreviewSummaryProps) {
  const title = getPreviewChartTitle(model);
  const xFilterOnAxis =
    model.xColumn && model.xAxisValues.length > 0 ? model.xAxisValues : null;
  const segmentEntries = Object.entries(model.segmentFilters).filter(
    ([, vals]) => vals.length > 0,
  );
  const hasDate = Boolean(model.dateFrom || model.dateTo);
  const hasFilters = Boolean(xFilterOnAxis || segmentEntries.length > 0 || hasDate);

  if (variant === "panel") {
    return (
      <div className="flex h-full flex-col">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h4 className="mb-4 text-center text-sm font-semibold text-foreground">{title}</h4>
          <ChartPreviewPlaceholder model={model} />
          {hasFilters && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 border-t pt-3">
              {xFilterOnAxis?.map((val) => (
                <span
                  key={val}
                  className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {humanize(model.xColumn!)}: {val}
                </span>
              ))}
              {segmentEntries.flatMap(([col, vals]) =>
                vals.map((val) => (
                  <span
                    key={`${col}-${val}`}
                    className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:text-amber-100"
                  >
                    <Filter className="h-2.5 w-2.5" />
                    {humanize(col)}: {val}
                  </span>
                )),
              )}
              {hasDate && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:text-sky-200">
                  <CalendarRange className="h-2.5 w-2.5" />
                  {model.dateFrom && model.dateTo
                    ? `${model.dateFrom} → ${model.dateTo}`
                    : model.dateFrom ?? model.dateTo}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/25 px-4 py-2.5">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground">Vista previa</p>
      </div>
      <div className="p-4">
        <ChartPreviewPlaceholder model={model} />
        {hasFilters && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {xFilterOnAxis?.map((val) => (
              <span
                key={val}
                className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium"
              >
                {humanize(model.xColumn!)}: {val}
              </span>
            ))}
          </div>
        )}
        <p className={cn("mt-3 text-[11px] text-muted-foreground")}>
          Así se verá tu gráfico con los ejes elegidos.
        </p>
      </div>
    </div>
  );
}
