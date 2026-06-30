"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  BarChart3,
  Eye,
  FileSpreadsheet,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDatasets, useDeleteDataset } from "@/hooks/use-datasets";
import type { DatasetListItem } from "@/types/dataset";
import { cn } from "@/lib/utils";

const FILE_ICONS: Record<string, string> = {
  csv: "CSV",
  xlsx: "XLS",
  xls: "XLS",
  json: "JSON",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    processing: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    pending: "bg-muted text-muted-foreground",
    error: "bg-destructive/15 text-destructive",
  };
  const labels: Record<string, string> = {
    ready: "Listo",
    processing: "Procesando",
    pending: "Pendiente",
    error: "Error",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status] ?? styles.pending,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

function RecentDatasetCard({ dataset }: { dataset: DatasetListItem }) {
  const deleteMutation = useDeleteDataset();
  const typeLabel = FILE_ICONS[dataset.file_type] ?? dataset.file_type.toUpperCase();

  return (
    <div className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{dataset.name}</p>
            <Badge variant="outline" className="text-[10px] font-normal">
              {typeLabel}
            </Badge>
            <StatusBadge status={dataset.status} />
          </div>
          <p className="truncate text-sm text-muted-foreground">{dataset.original_filename}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {dataset.row_count.toLocaleString()} filas · {dataset.column_count} columnas ·{" "}
            {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true, locale: es })}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:opacity-80 sm:group-hover:opacity-100">
        {dataset.status === "ready" && (
          <Link
            href={`/analytics/${dataset.id}`}
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <BarChart3 className="mr-1.5 h-4 w-4" />
            Analytics
          </Link>
        )}
        <Link
          href={`/datasets/${dataset.id}`}
          className={buttonVariants({ variant: "outline", size: "icon" })}
          title="Ver detalle"
        >
          <Eye className="h-4 w-4" />
        </Link>
        <Button
          variant="outline"
          size="icon"
          onClick={() => deleteMutation.mutate(dataset.id)}
          disabled={deleteMutation.isPending}
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

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
              <RecentDatasetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
