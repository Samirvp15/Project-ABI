"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart3,
  Eye,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DatasetCard } from "@/components/datasets/dataset-card";
import { DatasetFileTypeBadge, DatasetStatusBadge } from "@/components/datasets/dataset-badges";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type ViewMode = "cards" | "table";
type StatusFilter = "all" | "ready" | "processing" | "pending" | "error";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "ready", label: "Listos" },
  { value: "processing", label: "Procesando" },
  { value: "pending", label: "Pendientes" },
  { value: "error", label: "Error" },
];

function TableRowActions({ dataset }: { dataset: DatasetListItem }) {
  const deleteMutation = useDeleteDataset();

  return (
    <div className="flex justify-end gap-1">
      {dataset.status === "ready" && (
        <Link
          href={`/analytics/${dataset.id}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          title="Analytics"
        >
          <BarChart3 className="h-4 w-4" />
        </Link>
      )}
      <Link
        href={`/datasets/${dataset.id}`}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
        title="Ver detalle"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => deleteMutation.mutate(dataset.id)}
        disabled={deleteMutation.isPending}
        title="Eliminar"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function ListSkeleton({ view }: { view: ViewMode }) {
  if (view === "table") {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/60" />;
  }
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  );
}

export function DatasetsListSection() {
  const { data, isLoading, error } = useDatasets();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("cards");

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    const query = search.trim().toLowerCase();

    return items.filter((d) => {
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      const matchesSearch =
        !query ||
        d.name.toLowerCase().includes(query) ||
        d.original_filename.toLowerCase().includes(query) ||
        d.file_type.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [data?.items, search, statusFilter]);

  return (
    <Card className="border-0 bg-card/80 shadow-sm">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Mis datasets</CardTitle>
            <CardDescription>
              {data?.total ?? 0} archivo{(data?.total ?? 0) !== 1 ? "s" : ""} en total
              {filtered.length !== (data?.items.length ?? 0) &&
                ` · ${filtered.length} mostrado${filtered.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            <Button
              variant={view === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("cards")}
              className="h-8 px-2.5"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
              className="h-8 px-2.5"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, archivo o tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f.value)}
                className="h-8"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && <ListSkeleton view={view} />}
        {error && (
          <p className="text-sm text-destructive">No se pudieron cargar los datasets.</p>
        )}

        {!isLoading && !error && filtered.length === 0 && (data?.items.length ?? 0) === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-14 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold">Sin datasets todavía</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Usa la zona de subida arriba para importar tu primer archivo.
            </p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (data?.items.length ?? 0) > 0 && (
          <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Ningún dataset coincide con tu búsqueda o filtro.
            </p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}

        {!isLoading && filtered.length > 0 && view === "cards" && (
          <div className="space-y-3">
            {filtered.map((dataset) => (
              <DatasetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>
        )}

        {!isLoading && filtered.length > 0 && view === "table" && (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Archivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Filas</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Cols</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((dataset) => (
                  <TableRow key={dataset.id} className="group">
                    <TableCell className="font-medium">
                      <Link
                        href={`/datasets/${dataset.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {dataset.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate text-muted-foreground md:table-cell">
                      {dataset.original_filename}
                    </TableCell>
                    <TableCell>
                      <DatasetFileTypeBadge fileType={dataset.file_type} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {dataset.row_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right tabular-nums">
                      {dataset.column_count}
                    </TableCell>
                    <TableCell>
                      <DatasetStatusBadge status={dataset.status} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {format(new Date(dataset.created_at), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <TableRowActions dataset={dataset} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
