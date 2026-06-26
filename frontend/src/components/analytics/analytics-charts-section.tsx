"use client";

import { BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  CHARTS_GRID_CLASS,
  ChartGridItem,
  KPI_GRID_CLASS,
} from "@/components/charts/chart-grid-layout";
import {
  DashboardWidgetRenderer,
  groupChartWidgets,
} from "@/components/charts/dashboard-widget-renderer";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboard } from "@/hooks/use-dashboard";
import type { DashboardFilters } from "@/types/dashboard";

interface AnalyticsChartsSectionProps {
  datasetId: string;
}

export function AnalyticsChartsSection({ datasetId }: AnalyticsChartsSectionProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>({});

  const { data: dashboard, isLoading, error } = useDashboard(datasetId, appliedFilters);

  const { kpiWidgets, chartGroups, otherCharts } = useMemo(() => {
    const widgets = dashboard?.widgets ?? [];
    const kpis = widgets.filter((w) => w.type === "kpi");
    const charts = widgets.filter((w) => w.type !== "kpi");
    const { groups, other } = groupChartWidgets(charts);
    return { kpiWidgets: kpis, chartGroups: groups, otherCharts: other };
  }, [dashboard?.widgets]);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <SectionHeader />
        <p className="text-sm text-muted-foreground">Generando gráficos...</p>
      </section>
    );
  }

  if (error || !dashboard) {
    return (
      <section className="space-y-4">
        <SectionHeader />
        <p className="text-sm text-destructive">No se pudieron cargar los gráficos</p>
      </section>
    );
  }

  const hasCharts = kpiWidgets.length > 0 || chartGroups.length > 0 || otherCharts.length > 0;

  return (
    <section className="space-y-6">
      <SectionHeader
        subtitle={
          dashboard.summary.filtered_row_count !== dashboard.summary.row_count
            ? `${dashboard.summary.filtered_row_count.toLocaleString()} de ${dashboard.summary.row_count.toLocaleString()} filas (filtradas)`
            : `${dashboard.summary.row_count.toLocaleString()} filas · ${dashboard.widgets.length} visualizaciones`
        }
      />

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

      {!hasCharts ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sin gráficos disponibles</CardTitle>
            <CardDescription>
              Este dataset necesita columnas numéricas, de fecha o categóricas para generar
              visualizaciones automáticas.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className={CHARTS_GRID_CLASS}>
          {kpiWidgets.length > 0 && (
            <>
              <GridSectionTitle>Indicadores clave (KPIs)</GridSectionTitle>
              <div className={`col-span-full ${KPI_GRID_CLASS}`}>
                {kpiWidgets.map((widget) => (
                  <DashboardWidgetRenderer key={widget.id} widget={widget} />
                ))}
              </div>
            </>
          )}

          {chartGroups.map((group) => (
            <ChartGroupBlock key={group.key} title={group.title} widgets={group.widgets} />
          ))}

          {otherCharts.length > 0 && (
            <ChartGroupBlock title="Otros gráficos" widgets={otherCharts} />
          )}
        </div>
      )}
    </section>
  );
}

function GridSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="col-span-full pt-2 text-sm font-medium text-muted-foreground">{children}</h3>
  );
}

function ChartGroupBlock({
  title,
  widgets,
}: {
  title: string;
  widgets: Parameters<typeof DashboardWidgetRenderer>[0]["widget"][];
}) {
  return (
    <>
      <GridSectionTitle>{title}</GridSectionTitle>
      {widgets.map((widget) => (
        <ChartGridItem key={widget.id} widget={widget}>
          <DashboardWidgetRenderer widget={widget} />
        </ChartGridItem>
      ))}
    </>
  );
}

function SectionHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-muted p-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Análisis gráfico</h2>
        <p className="text-sm text-muted-foreground">
          {subtitle ??
            "KPIs, histogramas, barras, líneas, áreas, scatter y gráficos de pastel/dona"}
        </p>
      </div>
    </div>
  );
}
