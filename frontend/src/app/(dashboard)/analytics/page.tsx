"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDatasets } from "@/hooks/use-datasets";
import { cn } from "@/lib/utils";

export default function AnalyticsListPage() {
  const { data, isLoading, error } = useDatasets();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Métricas automáticas calculadas para cada dataset.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Cargando...</p>}
      {error && <p className="text-destructive">Error al cargar datasets</p>}

      {!isLoading && !data?.items.length && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Sube un dataset para ver analytics</p>
            <Link href="/datasets" className={buttonVariants()}>
              Ir a Datasets
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items
          .filter((d) => d.status === "ready")
          .map((dataset) => (
            <Card key={dataset.id}>
              <CardHeader>
                <CardTitle className="text-lg">{dataset.name}</CardTitle>
                <CardDescription>
                  {dataset.row_count.toLocaleString()} filas · {dataset.column_count} columnas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/analytics/${dataset.id}`}
                  className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Ver analytics
                </Link>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
