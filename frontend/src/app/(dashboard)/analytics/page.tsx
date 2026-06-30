"use client";

import { AnalyticsListSection } from "@/components/analytics/analytics-list-section";
import { AnalyticsMiniStats } from "@/components/analytics/analytics-dataset-card";

export default function AnalyticsListPage() {
  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-500/8 via-background to-primary/5 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative space-y-2">
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
            Inteligencia de datos
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Analytics</h1>
          <p className="max-w-2xl text-muted-foreground">
            Métricas automáticas por columna, KPIs y un explorador dinámico de gráficos para cada
            dataset listo.
          </p>
        </div>
      </section>

      <AnalyticsMiniStats />

      <AnalyticsListSection />
    </div>
  );
}
