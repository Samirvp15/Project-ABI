"use client";

import { Database, Rows3 } from "lucide-react";
import { useRouter } from "next/navigation";

import { DatasetsListSection } from "@/components/datasets/datasets-list-section";
import { DatasetsUploadPanel } from "@/components/datasets/datasets-upload-panel";
import { Card, CardContent } from "@/components/ui/card";
import { useDatasets } from "@/hooks/use-datasets";

function DatasetsMiniStats() {
  const { data, isLoading } = useDatasets();
  const items = data?.items ?? [];
  const totalRows = items.reduce((acc, d) => acc + d.row_count, 0);
  const readyCount = items.filter((d) => d.status === "ready").length;

  const stats = [
    { label: "Total datasets", value: items.length, icon: Database },
    { label: "Listos para analizar", value: readyCount, icon: Database },
    { label: "Filas acumuladas", value: totalRows.toLocaleString(), icon: Rows3 },
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
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
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

export default function DatasetsPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-500/8 via-background to-emerald-500/5 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative space-y-2">
          <p className="text-sm font-medium text-primary">Gestión de datos</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Datasets</h1>
          <p className="max-w-2xl text-muted-foreground">
            Importa, organiza y prepara tus archivos. Cada dataset alimenta analytics automáticos
            y el explorador de gráficos.
          </p>
        </div>
      </section>

      <DatasetsMiniStats />

      <DatasetsUploadPanel onSuccess={() => router.refresh()} />

      <DatasetsListSection />
    </div>
  );
}
