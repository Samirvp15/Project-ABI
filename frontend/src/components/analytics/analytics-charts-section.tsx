"use client";

import { BarChart3, X } from "lucide-react";
import { useCallback, useState } from "react";

import {
  ChartBuilderPanel,
  ChartSuggestionChip,
} from "@/components/analytics/chart-builder-panel";
import { CHARTS_GRID_CLASS } from "@/components/charts/chart-grid-layout";
import { DashboardWidgetRenderer } from "@/components/charts/dashboard-widget-renderer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBuildChart, useDashboard } from "@/hooks/use-dashboard";
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
  const { data: dashboardMeta } = useDashboard(datasetId);
  const buildChart = useBuildChart(datasetId);
  const [activeCharts, setActiveCharts] = useState<ActiveChart[]>([]);
  const [builderError, setBuilderError] = useState<string | null>(null);

  const addChart = useCallback((widget: DashboardWidget) => {
    setActiveCharts((prev) => [
      ...prev,
      { key: `${widget.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, widget },
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
    addChart({ ...widget, id: `${widget.id}-suggest-${Date.now()}` });
  };

  const suggestions = (dashboardMeta?.widgets ?? [])
    .filter((w) => w.type !== "kpi")
    .slice(0, 8);

  return (
    <section className="space-y-6">
      <SectionHeader
        subtitle={
          dashboardMeta
            ? `${dashboardMeta.summary.row_count.toLocaleString()} filas · ${activeCharts.length} gráfico(s) activo(s)`
            : "Configura y genera gráficos según las columnas que elijas"
        }
      />

      {dataset?.columns && (
        <ChartBuilderPanel
          columns={dataset.columns}
          dateRange={dashboardMeta?.date_range ?? null}
          onGenerate={handleGenerate}
          isLoading={buildChart.isPending}
          error={builderError}
        />
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Sugerencias rápidas</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((widget) => (
              <ChartSuggestionChip
                key={widget.id}
                label={widget.title}
                onClick={() => handleSuggestion(widget)}
              />
            ))}
          </div>
        </div>
      )}

      {activeCharts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Gráficos generados ({activeCharts.length})
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sin gráficos aún</CardTitle>
            <CardDescription>
              Usa el explorador arriba para elegir columnas y tipo de gráfico, o haz clic en una
              sugerencia rápida.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
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
          {subtitle ?? "Gráficos dinámicos según columnas, agregación y rango de fechas"}
        </p>
      </div>
    </div>
  );
}
