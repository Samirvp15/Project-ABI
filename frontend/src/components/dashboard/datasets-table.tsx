"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, BarChart3, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDatasets, useDeleteDataset } from "@/hooks/use-datasets";
import type { DatasetListItem } from "@/types/dataset";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ready: "default",
    processing: "secondary",
    pending: "outline",
    error: "destructive",
  };
  const labels: Record<string, string> = {
    ready: "Listo",
    processing: "Procesando",
    pending: "Pendiente",
    error: "Error",
  };
  return <Badge variant={variants[status] ?? "outline"}>{labels[status] ?? status}</Badge>;
}

function DatasetRow({ dataset }: { dataset: DatasetListItem }) {
  const deleteMutation = useDeleteDataset();

  return (
    <TableRow>
      <TableCell className="font-medium">{dataset.name}</TableCell>
      <TableCell className="text-muted-foreground">{dataset.original_filename}</TableCell>
      <TableCell>
        <Badge variant="outline">{dataset.file_type.toUpperCase()}</Badge>
      </TableCell>
      <TableCell>{dataset.row_count.toLocaleString()}</TableCell>
      <TableCell>{dataset.column_count}</TableCell>
      <TableCell>
        <StatusBadge status={dataset.status} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(dataset.created_at), "dd MMM yyyy", { locale: es })}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {dataset.status === "ready" && (
            <Link
              href={`/analytics/${dataset.id}`}
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              title="Ver analytics y gráficos"
            >
              <BarChart3 className="h-4 w-4" />
            </Link>
          )}
          <Link
            href={`/datasets/${dataset.id}`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(dataset.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DatasetsTable() {
  const { data, isLoading, error } = useDatasets();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando datasets...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">Error al cargar datasets</p>;
  }

  if (!data?.items.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No hay datasets aún. Sube tu primer archivo.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Archivo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Filas</TableHead>
            <TableHead>Columnas</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-[120px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((dataset) => (
            <DatasetRow key={dataset.id} dataset={dataset} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
