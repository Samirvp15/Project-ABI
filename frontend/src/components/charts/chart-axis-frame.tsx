"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ChartAxisFrameProps {
  xLabel?: string;
  yLabel?: string;
  children: ReactNode;
  className?: string;
}

export function ChartAxisFrame({ xLabel, yLabel, children, className }: ChartAxisFrameProps) {
  if (!xLabel && !yLabel) {
    return <div className={cn("h-full min-h-0", className)}>{children}</div>;
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex min-h-0 flex-1 gap-1">
        {yLabel ? (
          <div className="flex w-7 shrink-0 items-center justify-center" aria-hidden>
            <span className="-rotate-90 whitespace-nowrap text-[11px] font-semibold leading-none text-slate-500 dark:text-slate-400">
              {yLabel}
            </span>
          </div>
        ) : null}
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>
      {xLabel ? (
        <p className="mt-1 shrink-0 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {xLabel}
        </p>
      ) : null}
    </div>
  );
}
