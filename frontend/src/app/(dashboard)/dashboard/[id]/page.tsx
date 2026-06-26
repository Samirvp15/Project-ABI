"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";

import { DashboardWidgetRenderer } from "@/components/charts/dashboard-widget-renderer";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboard } from "@/hooks/use-dashboard";
import type { DashboardFilters } from "@/types/dashboard";

export default function DatasetDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>({});

  const { data: dashboard, isLoading, error } = useDashboard(id, appliedFilters);

  const { kpiWidgets, chartWidgets } = useMemo(() => {
    const widgets = dashboard?.widgets ?? [];
    return {
      kpiWidgets: widgets.filter((w) => w.type === "kpi"),
      chartWidgets: widgets.filter((w) => w.type !== "kpi"),
    };
  }, [dashboard?.widgets]);

  if (isLoading) {
    return <p className="text-muted-foreground">Generando dashboard...</p>;
  }

  if (error || !dashboard) {
    return <p className="text-destructive">No se pudo cargar el dashboard</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{dashboard.dataset_name}</h1>
          <p className="text-sm text-muted-foreground">
            Dashboard auto-generado · {dashboard.summary.filtered_row_count.toLocaleString()} de{" "}
            {dashboard.summary.row_count.toLocaleString()} filas
          </p>
        </div>
      </div>

      <DateRangeFilter
        dateRange={dashboard.date_range}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApply={() =>
          setAppliedFilters({
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
          })
        }
        onClear={() => {
          setDateFrom("");
          setDateTo("");
          setAppliedFilters({});
        }}
      />

      {kpiWidgets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiWidgets.map((widget) => (
            <DashboardWidgetRenderer key={widget.id} widget={widget} />
          ))}
        </div>
      )}

      {chartWidgets.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {chartWidgets.map((widget) => (
            <DashboardWidgetRenderer key={widget.id} widget={widget} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sin gráficos disponibles</CardTitle>
            <CardDescription>
              Este dataset no tiene columnas de fecha, numéricas o categóricas suficientes para
              generar visualizaciones automáticas.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
