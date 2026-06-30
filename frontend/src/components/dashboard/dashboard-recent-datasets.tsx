"use client";

import { ArrowRight, FileSpreadsheet, Plus } from "lucide-react";
import Link from "next/link";

import { DatasetCard } from "@/components/datasets/dataset-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDatasets } from "@/hooks/use-datasets";
import { cn } from "@/lib/utils";

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  );
}

export function DashboardRecentDatasets() {
  const { data, isLoading, error } = useDatasets();
  const recent = data?.items.slice(0, 5) ?? [];

  return (
    <Card className="border-0 bg-card/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Datasets recientes</CardTitle>
          <CardDescription>Tus últimos archivos subidos y acciones disponibles</CardDescription>
        </div>
        {recent.length > 0 && (
          <Link
            href="/datasets"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0")}
          >
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && <LoadingSkeleton />}
        {error && (
          <p className="text-sm text-destructive">No se pudieron cargar los datasets.</p>
        )}
        {!isLoading && !error && recent.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold">Aún no tienes datasets</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Sube tu primer CSV, Excel o JSON para ver métricas y gráficos automáticos.
            </p>
            <Link href="/datasets" className={cn(buttonVariants(), "mt-6")}>
              <Plus className="mr-2 h-4 w-4" />
              Subir primer dataset
            </Link>
          </div>
        )}
        {!isLoading && recent.length > 0 && (
          <div className="space-y-3">
            {recent.map((dataset) => (
              <DatasetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
