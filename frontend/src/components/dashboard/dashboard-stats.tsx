"use client";

import { BarChart3, Columns3, Database, Rows3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useDatasets } from "@/hooks/use-datasets";
import { cn } from "@/lib/utils";

const statConfig = [
  { key: "datasets", label: "Datasets", icon: Database, color: "text-blue-600 dark:text-blue-400" },
  { key: "rows", label: "Filas totales", icon: Rows3, color: "text-emerald-600 dark:text-emerald-400" },
  { key: "columns", label: "Columnas (prom.)", icon: Columns3, color: "text-violet-600 dark:text-violet-400" },
  { key: "ready", label: "Listos", icon: BarChart3, color: "text-amber-600 dark:text-amber-400" },
] as const;

function StatSkeleton() {
  return (
    <Card className="border-0 bg-card/60 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-2">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-7 w-12 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { data, isLoading } = useDatasets();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.map((s) => (
          <StatSkeleton key={s.key} />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];
  const totalRows = items.reduce((acc, d) => acc + d.row_count, 0);
  const avgColumns =
    items.length > 0
      ? Math.round(items.reduce((acc, d) => acc + d.column_count, 0) / items.length)
      : 0;
  const readyCount = items.filter((d) => d.status === "ready").length;

  const values: Record<(typeof statConfig)[number]["key"], string | number> = {
    datasets: items.length,
    rows: totalRows.toLocaleString(),
    columns: items.length ? avgColumns : "—",
    ready: readyCount,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statConfig.map(({ key, label, icon: Icon, color }) => (
        <Card
          key={key}
          className="border-0 bg-card/80 shadow-sm transition-shadow hover:shadow-md"
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className={cn("rounded-xl bg-muted/80 p-3", color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {values[key]}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
