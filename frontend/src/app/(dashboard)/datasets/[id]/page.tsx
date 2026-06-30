"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Columns3,
  FileSpreadsheet,
  Hash,
  Rows3,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

import {
  DatasetFileTypeBadge,
  DatasetStatusBadge,
} from "@/components/datasets/dataset-badges";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDataset, useDatasetPreview } from "@/hooks/use-datasets";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  integer: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  float: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  number: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  string: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  text: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  boolean: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  datetime: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  date: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-2xl bg-muted/60" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: dataset, isLoading } = useDataset(id);
  const { data: preview } = useDatasetPreview(id);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <p className="text-destructive font-medium">Dataset no encontrado</p>
        <Link href="/datasets" className={cn(buttonVariants({ variant: "link" }), "mt-2")}>
          Volver a datasets
        </Link>
      </div>
    );
  }

  const previewColumns =
    dataset.columns.length > 0
      ? dataset.columns.map((c) => c.name)
      : preview?.rows[0]
        ? Object.keys(preview.rows[0].data)
        : [];

  const stats = [
    { label: "Filas", value: dataset.row_count.toLocaleString(), icon: Rows3 },
    { label: "Columnas", value: dataset.column_count, icon: Columns3 },
    { label: "Tipo", value: dataset.file_type.toUpperCase(), icon: FileSpreadsheet },
    {
      label: "Subido",
      value: format(new Date(dataset.created_at), "dd MMM yyyy", { locale: es }),
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/6 via-background to-blue-500/5 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Link
              href="/datasets"
              className={cn(buttonVariants({ variant: "outline", size: "icon" }), "shrink-0 bg-background/80")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{dataset.name}</h1>
                <DatasetFileTypeBadge fileType={dataset.file_type} />
                <DatasetStatusBadge status={dataset.status} />
              </div>
              <p className="truncate text-sm text-muted-foreground">{dataset.original_filename}</p>
              {dataset.error_message && (
                <p className="text-sm text-destructive">{dataset.error_message}</p>
              )}
            </div>
          </div>

          {dataset.status === "ready" && (
            <Link href={`/analytics/${id}`} className={buttonVariants({ size: "lg" })}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver analytics
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-0 bg-card/80 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-muted/80 p-3 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold tabular-nums tracking-tight">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Esquema detectado</CardTitle>
          <CardDescription>
            {dataset.columns.length} columnas con tipos inferidos automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>#</TableHead>
                  <TableHead>Columna</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Nulos</TableHead>
                  <TableHead>Muestra de valores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataset.columns.map((col, idx) => (
                  <TableRow key={col.name}>
                    <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{col.name}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          TYPE_COLORS[col.inferred_type.toLowerCase()] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {col.inferred_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{col.null_count}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {col.sample_values?.slice(0, 3).join(", ") ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {preview && preview.rows.length > 0 && (
        <Card className="border-0 bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hash className="h-5 w-5 text-muted-foreground" />
              Vista previa
            </CardTitle>
            <CardDescription>
              Primeras {preview.rows.length} de {preview.total_rows.toLocaleString()} filas
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-12">#</TableHead>
                    {previewColumns.map((col) => (
                      <TableHead key={col} className="whitespace-nowrap">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow key={row.row_index} className="even:bg-muted/20">
                      <TableCell className="text-muted-foreground tabular-nums">
                        {row.row_index + 1}
                      </TableCell>
                      {previewColumns.map((col) => (
                        <TableCell key={col} className="max-w-[200px] truncate whitespace-nowrap">
                          {String(row.data[col] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
