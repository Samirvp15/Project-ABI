"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Columns3,
  RefreshCw,
  Rows3,
} from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";

import { AnalyticsChartsSection } from "@/components/analytics/analytics-charts-section";
import { ColumnMetricsCard } from "@/components/analytics/column-metrics-card";
import {
  DatasetFileTypeBadge,
  DatasetStatusBadge,
} from "@/components/datasets/dataset-badges";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics, useRefreshAnalytics } from "@/hooks/use-analytics";
import { useDataset } from "@/hooks/use-datasets";
import { cn } from "@/lib/utils";

const COLUMN_TYPE_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "numeric", label: "Numérico" },
  { value: "date", label: "Fecha" },
  { value: "categorical", label: "Categórico" },
  { value: "text", label: "Texto" },
  { value: "boolean", label: "Booleano" },
] as const;

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-36 animate-pulse rounded-2xl bg-muted/60" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}

export default function AnalyticsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: dataset } = useDataset(id);
  const { data: analytics, isLoading, error } = useAnalytics(id);
  const refresh = useRefreshAnalytics(id);
  const [typeFilter, setTypeFilter] = useState<(typeof COLUMN_TYPE_FILTERS)[number]["value"]>("all");

  const filteredColumns = useMemo(() => {
    if (!analytics) return [];
    if (typeFilter === "all") return analytics.columns;
    return analytics.columns.filter((c) => c.type === typeFilter);
  }, [analytics, typeFilter]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <p className="font-medium text-destructive">No se pudieron cargar los analytics</p>
        <Link href="/analytics" className={cn(buttonVariants({ variant: "link" }), "mt-2")}>
          Volver a analytics
        </Link>
      </div>
    );
  }

  const avgNullPercent =
    analytics.columns.length > 0
      ? (
          analytics.columns.reduce((acc, c) => acc + c.null_percent, 0) /
          analytics.columns.length
        ).toFixed(1)
      : "0";

  const stats = [
    { label: "Total filas", value: analytics.summary.row_count.toLocaleString(), icon: Rows3 },
    { label: "Total columnas", value: analytics.summary.column_count, icon: Columns3 },
    { label: "Nulos (prom.)", value: `${avgNullPercent}%`, icon: BarChart3 },
    {
      label: "Calculado",
      value: format(new Date(analytics.computed_at), "dd MMM yyyy", { locale: es }),
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-500/6 via-background to-primary/5 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Link
              href="/analytics"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "shrink-0 bg-background/80",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {dataset?.name ?? "Analytics"}
                </h1>
                {dataset && (
                  <>
                    <DatasetFileTypeBadge fileType={dataset.file_type} />
                    <DatasetStatusBadge status={dataset.status} />
                  </>
                )}
              </div>
              {dataset && (
                <p className="truncate text-sm text-muted-foreground">{dataset.original_filename}</p>
              )}
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Calculado el{" "}
                {format(new Date(analytics.computed_at), "dd MMM yyyy HH:mm", { locale: es })}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="shrink-0 bg-background/80"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", refresh.isPending && "animate-spin")} />
            Recalcular
          </Button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-0 bg-card/80 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-muted/80 p-3 text-violet-600 dark:text-violet-400">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold tabular-nums tracking-tight">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-card/80 shadow-sm">
        <CardContent className="p-6">
          <AnalyticsChartsSection datasetId={id} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <Card className="border-0 bg-card/80 shadow-sm">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-muted/80 p-2.5 text-primary">
                  <Columns3 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Análisis por columnas</CardTitle>
                  <CardDescription>
                    {analytics.columns.length} columnas · métricas por tipo detectado
                  </CardDescription>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COLUMN_TYPE_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  variant={typeFilter === f.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(f.value)}
                  className="h-8"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {filteredColumns.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
                No hay columnas de tipo &quot;{typeFilter}&quot; en este dataset.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredColumns.map((column) => (
                  <ColumnMetricsCard key={column.name} column={column} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
