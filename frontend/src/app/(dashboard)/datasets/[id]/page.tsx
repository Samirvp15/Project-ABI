"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, BarChart3, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { use } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDataset, useDatasetPreview } from "@/hooks/use-datasets";

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: dataset, isLoading } = useDataset(id);
  const { data: preview } = useDatasetPreview(id);

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando...</p>;
  }

  if (!dataset) {
    return <p className="text-destructive">Dataset no encontrado</p>;
  }

  const previewColumns =
    dataset.columns.length > 0
      ? dataset.columns.map((c) => c.name)
      : preview?.rows[0]
        ? Object.keys(preview.rows[0].data)
        : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/datasets" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{dataset.name}</h1>
            <p className="text-sm text-muted-foreground">{dataset.original_filename}</p>
          </div>
        </div>
        {dataset.status === "ready" && (
          <div className="flex gap-2">
            <Link href={`/dashboard/${id}`} className={buttonVariants()}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Ver dashboard
            </Link>
            <Link href={`/analytics/${id}`} className={buttonVariants({ variant: "outline" })}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver analytics
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Filas</CardDescription>
            <CardTitle className="text-2xl">{dataset.row_count.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Columnas</CardDescription>
            <CardTitle className="text-2xl">{dataset.column_count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tipo</CardDescription>
            <CardTitle className="text-2xl uppercase">{dataset.file_type}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subido</CardDescription>
            <CardTitle className="text-lg">
              {format(new Date(dataset.created_at), "dd MMM yyyy", { locale: es })}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Esquema detectado</CardTitle>
          <CardDescription>Tipos inferidos automáticamente por columna</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Columna</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nulos</TableHead>
                <TableHead>Muestra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.columns.map((col) => (
                <TableRow key={col.name}>
                  <TableCell className="font-medium">{col.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{col.inferred_type}</Badge>
                  </TableCell>
                  <TableCell>{col.null_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {col.sample_values?.slice(0, 3).join(", ") ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {preview && preview.rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa</CardTitle>
            <CardDescription>
              Primeras {preview.rows.length} de {preview.total_rows.toLocaleString()} filas
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  {previewColumns.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row) => (
                  <TableRow key={row.row_index}>
                    <TableCell className="text-muted-foreground">{row.row_index + 1}</TableCell>
                    {previewColumns.map((col) => (
                      <TableCell key={col}>{String(row.data[col] ?? "")}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
