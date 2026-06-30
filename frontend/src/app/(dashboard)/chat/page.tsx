"use client";

import { MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DatasetFileTypeBadge } from "@/components/datasets/dataset-badges";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDatasets } from "@/hooks/use-datasets";
import { cn } from "@/lib/utils";

export default function ChatListPage() {
  const { data, isLoading, error } = useDatasets();
  const [search, setSearch] = useState("");

  const ready = useMemo(
    () => (data?.items ?? []).filter((d) => d.status === "ready"),
    [data?.items],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ready;
    return ready.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.original_filename.toLowerCase().includes(q),
    );
  }, [ready, search]);

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/8 via-background to-violet-500/5 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative space-y-2">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Asistente IA</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI Chat</h1>
          <p className="max-w-2xl text-muted-foreground">
            Haz preguntas en lenguaje natural sobre tus datasets. La IA consulta tus datos de forma
            segura y te explica los resultados.
          </p>
        </div>
      </section>

      <Card className="border-0 bg-card/80 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="text-lg">Selecciona un dataset</CardTitle>
            <CardDescription>
              Solo datasets listos pueden usarse en el chat
            </CardDescription>
          </div>
          {ready.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar dataset…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background pl-9"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && <div className="h-32 animate-pulse rounded-xl bg-muted/60" />}
          {error && <p className="text-sm text-destructive">Error al cargar datasets.</p>}

          {!isLoading && ready.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <MessageSquare className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Sube y procesa un dataset primero.</p>
              <Link href="/datasets" className={cn(buttonVariants(), "mt-4")}>
                Ir a Datasets
              </Link>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((dataset) => (
                <Link
                  key={dataset.id}
                  href={`/chat/${dataset.id}`}
                  className="group rounded-xl border bg-background/60 p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <DatasetFileTypeBadge fileType={dataset.file_type} />
                  </div>
                  <p className="font-medium group-hover:text-primary">{dataset.name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {dataset.original_filename}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {dataset.row_count.toLocaleString()} filas · {dataset.column_count} columnas
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
