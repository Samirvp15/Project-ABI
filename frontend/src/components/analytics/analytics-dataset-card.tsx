"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, BarChart3, Columns3, Rows3 } from "lucide-react";
import Link from "next/link";

import { DatasetFileTypeBadge } from "@/components/datasets/dataset-badges";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDatasets } from "@/hooks/use-datasets";
import type { DatasetListItem } from "@/types/dataset";
import { cn } from "@/lib/utils";

export function AnalyticsDatasetCard({ dataset }: { dataset: DatasetListItem }) {
  return (
    <Link href={`/analytics/${dataset.id}`} className="group block h-full">
      <Card className="h-full border-0 bg-card/80 shadow-sm transition-all hover:border-primary/30 hover:shadow-md group-hover:-translate-y-0.5">
        <CardContent className="flex h-full flex-col p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <DatasetFileTypeBadge fileType={dataset.file_type} />
          </div>

          <h3 className="font-semibold leading-snug group-hover:text-primary">{dataset.name}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">{dataset.original_filename}</p>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Rows3 className="h-3.5 w-3.5" />
              {dataset.row_count.toLocaleString()} filas
            </span>
            <span className="inline-flex items-center gap-1">
              <Columns3 className="h-3.5 w-3.5" />
              {dataset.column_count} cols
            </span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Actualizado{" "}
            {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true, locale: es })}
          </p>

          <span
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mt-auto w-full pt-4 group-hover:bg-primary group-hover:text-primary-foreground",
            )}
          >
            Ver analytics y gráficos
            <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export function AnalyticsMiniStats() {
  const { data, isLoading } = useDatasets();
  const items = data?.items ?? [];
  const ready = items.filter((d) => d.status === "ready");
  const totalRows = ready.reduce((acc, d) => acc + d.row_count, 0);
  const avgColumns =
    ready.length > 0
      ? Math.round(ready.reduce((acc, d) => acc + d.column_count, 0) / ready.length)
      : 0;

  const stats = [
    { label: "Listos para analizar", value: ready.length, icon: BarChart3 },
    { label: "Filas analizables", value: totalRows.toLocaleString(), icon: Rows3 },
    { label: "Columnas (prom.)", value: ready.length ? avgColumns : "—", icon: Columns3 },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="border-0 bg-card/80 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-semibold tabular-nums">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
