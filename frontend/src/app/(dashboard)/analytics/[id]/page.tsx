"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { use } from "react";

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
    <div className="space-y-6">
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

      <div>
        <h2 className="mb-4 text-xl font-semibold">Métricas por columna</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analytics.columns.map((column) => (
            <ColumnMetricsCard key={column.name} column={column} />
          ))}
        </div>
      </div>
    </div>
  );
}
