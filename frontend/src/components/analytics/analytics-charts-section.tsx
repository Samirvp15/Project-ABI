"use client";

import { BarChart3, LineChart, Loader2, Sparkles, X } from "lucide-react";
import { useCallback, useState } from "react";

import {
  ChartBuilderPanel,
  ChartSuggestionChip,
  ChartSuggestionsSkeleton,
} from "@/components/analytics/chart-builder-panel";
import { CHARTS_GRID_CLASS } from "@/components/charts/chart-grid-layout";
import { DashboardWidgetRenderer } from "@/components/charts/dashboard-widget-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBuildChart, useDashboard } from "@/hooks/use-dashboard";
import { useAnalytics } from "@/hooks/use-analytics";
import { useDataset } from "@/hooks/use-datasets";
import type { ChartBuildRequest, DashboardWidget } from "@/types/dashboard";

interface ActiveChart {
  key: string;
  widget: DashboardWidget;
}

interface AnalyticsChartsSectionProps {
  datasetId: string;
}

export function AnalyticsChartsSection({ datasetId }: AnalyticsChartsSectionProps) {
  const { data: dataset } = useDataset(datasetId);
  const { data: analytics } = useAnalytics(datasetId);
  const {
    data: dashboardMeta,
    isLoading: loadingDashboard,
    isFetching: fetchingDashboard,
  } = useDashboard(datasetId);
  const buildChart = useBuildChart(datasetId);
  const [activeCharts, setActiveCharts] = useState<ActiveChart[]>([]);
  const [builderError, setBuilderError] = useState<string | null>(null);

  const addChart = useCallback((widget: DashboardWidget) => {
    setActiveCharts((prev) => [
      ...prev,
      { key: `${widget.id}-${prev.length + 1}`, widget },
    ]);
  }, []);

  const handleGenerate = async (request: ChartBuildRequest) => {
    setBuilderError(null);
    try {
      const widget = await buildChart.mutateAsync(request);
      addChart(widget);
    } catch (err) {
      setBuilderError(err instanceof Error ? err.message : "Error al generar gráfico");
    }
  };

  const handleSuggestion = (widget: DashboardWidget) => {
    addChart(widget);
  };

  const suggestions = (dashboardMeta?.widgets ?? [])
    .filter((w) => w.type !== "kpi")
    .slice(0, 8);

  const loadingSuggestions = loadingDashboard || (fetchingDashboard && !dashboardMeta);

  return (
    <section className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600 dark:text-violet-400">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Análisis gráfico</h2>
          <p className="text-sm text-muted-foreground">
            {dashboardMeta
              ? `${dashboardMeta.summary.row_count.toLocaleString()} filas · ${activeCharts.length} gráfico(s) activo(s)`
              : "Configura y genera gráficos según las columnas que elijas"}
          </p>
        </div>
      </div>

      {dataset?.columns && (
        <ChartBuilderPanel
          columns={dataset.columns}
          analyticsColumns={analytics?.columns}
          dateRange={dashboardMeta?.date_range ?? null}
          onGenerate={handleGenerate}
          isLoading={buildChart.isPending}
          error={builderError}
        />
      )}

      {(loadingSuggestions || suggestions.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {loadingSuggestions ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-500" />
            )}
            <p className="text-sm font-medium">Sugerencias rápidas</p>
            {loadingSuggestions && (
              <span className="text-xs text-muted-foreground">Cargando gráficos sugeridos…</span>
            )}
          </div>
          {loadingSuggestions ? (
            <ChartSuggestionsSkeleton />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((widget) => (
                <ChartSuggestionChip
                  key={widget.id}
                  label={widget.title}
                  chartType={widget.type}
                  onClick={() => handleSuggestion(widget)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeCharts.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              Gráficos generados{" "}
              <span className="text-muted-foreground">({activeCharts.length})</span>
            </p>
            <Button variant="outline" size="sm" onClick={() => setActiveCharts([])}>
              Limpiar todos
            </Button>
          </div>
          <div className={CHARTS_GRID_CLASS}>
            {activeCharts.map(({ key, widget }) => (
              <div key={key} className="relative min-h-[340px]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10 h-7 w-7 bg-background/80 backdrop-blur-sm"
                  onClick={() => setActiveCharts((prev) => prev.filter((c) => c.key !== key))}
                  aria-label="Quitar gráfico"
                >
                  <X className="h-4 w-4" />
                </Button>
                <DashboardWidgetRenderer widget={widget} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border border-dashed bg-muted/20 shadow-none">
          <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <LineChart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Sin gráficos aún</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Usa el explorador para elegir columnas y tipo de gráfico, o haz clic en una
              sugerencia rápida para empezar.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
