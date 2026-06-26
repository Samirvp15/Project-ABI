"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Columns3, RefreshCw } from "lucide-react";
import Link from "next/link";
import { use } from "react";

import { AnalyticsChartsSection } from "@/components/analytics/analytics-charts-section";
import { ColumnMetricsCard } from "@/components/analytics/column-metrics-card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAnalytics, useRefreshAnalytics } from "@/hooks/use-analytics";
import { useDataset } from "@/hooks/use-datasets";

export default function AnalyticsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: dataset } = useDataset(id);
  const { data: analytics, isLoading, error } = useAnalytics(id);
  const refresh = useRefreshAnalytics(id);

  if (isLoading) {
    return <p className="text-muted-foreground">Calculando analytics...</p>;
  }

  if (error || !analytics) {
    return <p className="text-destructive">No se pudieron cargar los analytics</p>;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/analytics" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{dataset?.name ?? "Analytics"}</h1>
            <p className="text-sm text-muted-foreground">
              Calculado el{" "}
              {format(new Date(analytics.computed_at), "dd MMM yyyy HH:mm", { locale: es })}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`} />
          Recalcular
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total filas</CardDescription>
            <CardTitle className="text-3xl">
              {analytics.summary.row_count.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total columnas</CardDescription>
            <CardTitle className="text-3xl">{analytics.summary.column_count}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <AnalyticsChartsSection datasetId={id} />
      </div>

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-muted p-2">
            <Columns3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Análisis por columnas</h2>
            <p className="text-sm text-muted-foreground">
              Métricas detalladas por tipo: numérico, fecha, categórico y texto
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analytics.columns.map((column) => (
            <ColumnMetricsCard key={column.name} column={column} />
          ))}
        </div>
      </section>
    </div>
  );
}
