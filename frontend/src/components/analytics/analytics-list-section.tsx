"use client";

import { BarChart3, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AnalyticsDatasetCard } from "@/components/analytics/analytics-dataset-card";
import { DatasetStatusBadge } from "@/components/datasets/dataset-badges";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDatasets } from "@/hooks/use-datasets";
import { cn } from "@/lib/utils";

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-56 animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  );
}

export function AnalyticsListSection() {
  const { data, isLoading, error } = useDatasets();
  const [search, setSearch] = useState("");

  const ready = useMemo(
    () => (data?.items ?? []).filter((d) => d.status === "ready"),
    [data?.items],
  );

  const processingCount = useMemo(
    () => (data?.items ?? []).filter((d) => d.status === "processing" || d.status === "pending").length,
    [data?.items],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ready;
    return ready.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.original_filename.toLowerCase().includes(query) ||
        d.file_type.toLowerCase().includes(query),
    );
  }, [ready, search]);

  return (
    <Card className="border-0 bg-card/80 shadow-sm">
      <CardHeader className="space-y-4 pb-4">
        <div>
          <CardTitle className="text-lg">Datasets con analytics</CardTitle>
          <CardDescription>
            {ready.length} listo{ready.length !== 1 ? "s" : ""} para explorar
            {processingCount > 0 &&
              ` · ${processingCount} en procesamiento`}
          </CardDescription>
        </div>

        {ready.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar dataset..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background pl-9"
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading && <GridSkeleton />}
        {error && (
          <p className="text-sm text-destructive">No se pudieron cargar los datasets.</p>
        )}

        {!isLoading && !error && ready.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-14 text-center">
            <div className="mb-4 rounded-full bg-violet-500/10 p-4">
              <BarChart3 className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="font-semibold">Sin analytics disponibles</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Sube un dataset y espera a que termine de procesarse para ver métricas y gráficos
              automáticos.
            </p>
            <Link href="/datasets" className={cn(buttonVariants(), "mt-6")}>
              <Plus className="mr-2 h-4 w-4" />
              Ir a Datasets
            </Link>
          </div>
        )}

        {!isLoading && ready.length > 0 && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Ningún dataset coincide con tu búsqueda.</p>
            <Button variant="link" className="mt-2" onClick={() => setSearch("")}>
              Limpiar búsqueda
            </Button>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((dataset) => (
              <AnalyticsDatasetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>
        )}

        {!isLoading && processingCount > 0 && ready.length > 0 && (
          <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {processingCount} dataset{processingCount !== 1 ? "s" : ""} aún en procesamiento. Aparecerán
            aquí cuando estén listos.
          </div>
        )}

        {!isLoading && (data?.items ?? []).some((d) => d.status !== "ready") && ready.length === 0 && (
          <div className="mt-4 space-y-2">
            {(data?.items ?? [])
              .filter((d) => d.status !== "ready")
              .map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.original_filename}</p>
                  </div>
                  <DatasetStatusBadge status={d.status} />
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
