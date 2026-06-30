"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart3, Eye, FileSpreadsheet, Trash2 } from "lucide-react";
import Link from "next/link";

import { DatasetFileTypeBadge, DatasetStatusBadge } from "@/components/datasets/dataset-badges";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDeleteDataset } from "@/hooks/use-datasets";
import type { DatasetListItem } from "@/types/dataset";

export function DatasetCard({ dataset }: { dataset: DatasetListItem }) {
  const deleteMutation = useDeleteDataset();

  return (
    <div className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/datasets/${dataset.id}`}
              className="truncate font-medium hover:text-primary hover:underline"
            >
              {dataset.name}
            </Link>
            <DatasetFileTypeBadge fileType={dataset.file_type} />
            <DatasetStatusBadge status={dataset.status} />
          </div>
          <p className="truncate text-sm text-muted-foreground">{dataset.original_filename}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {dataset.row_count.toLocaleString()} filas · {dataset.column_count} columnas ·{" "}
            {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true, locale: es })}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
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
