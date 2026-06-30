"use client";

import { AlertCircle, ChevronDown, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { getColumnValues } from "@/components/analytics/chart-column-values";
import { ValueChipPicker } from "@/components/analytics/value-chip-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ColumnAnalytics } from "@/types/analytics";
import type { DatasetColumn } from "@/types/dataset";

const SEGMENT_TYPES = new Set(["categorical", "text", "boolean"]);

interface SegmentFilterProps {
  columns: DatasetColumn[];
  analyticsColumns?: ColumnAnalytics[];
  excludeColumn?: string;
  value: Record<string, string[]>;
  onChange: (filters: Record<string, string[]>) => void;
}

export function SegmentFilter({
  columns,
  analyticsColumns,
  excludeColumn,
  value,
  onChange,
}: SegmentFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftColumn, setDraftColumn] = useState("");

  const segmentColumns = useMemo(
    () =>
      columns.filter(
        (col) =>
          SEGMENT_TYPES.has(col.inferred_type) &&
          col.name !== excludeColumn &&
          getColumnValues(col.name, columns, analyticsColumns).length > 0,
      ),
    [columns, analyticsColumns, excludeColumn],
  );

  /** Columnas añadidas al panel (pueden tener 0 valores aún). */
  const addedColumns = Object.keys(value);

  /** Columnas con al menos un valor elegido (para badge del header). */
  const configuredCount = addedColumns.filter((col) => (value[col]?.length ?? 0) > 0).length;

  const availableToAdd = segmentColumns.filter((col) => !(col.name in value));

  const addSegment = () => {
    if (!draftColumn || draftColumn in value) return;
    onChange({ ...value, [draftColumn]: [] });
    setDraftColumn("");
    setOpen(true);
  };

  const removeSegment = (columnName: string) => {
    const next = { ...value };
    delete next[columnName];
    onChange(next);
  };

  const updateSegment = (columnName: string, values: string[]) => {
    onChange({ ...value, [columnName]: values });
  };

  if (segmentColumns.length === 0) return null;

  return (
    <div className="rounded-xl border bg-background/60">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium">Segmentar por otra columna</p>
          <p className="text-xs text-muted-foreground">
            Opcional · filtra filas por una columna distinta al eje X
          </p>
        </div>
        <div className="flex items-center gap-2">
          {addedColumns.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {configuredCount > 0
                ? `${configuredCount} filtro(s) activo(s)`
                : `${addedColumns.length} pendiente(s)`}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          {addedColumns.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Añade una columna categórica para limitar qué filas entran al gráfico. El filtro
              aparecerá como etiqueta en el gráfico generado.
            </p>
          )}

          {addedColumns.map((columnName) => {
            const selected = value[columnName] ?? [];
            const isPending = selected.length === 0;

            return (
              <div
                key={columnName}
                className={cn(
                  "space-y-2 rounded-lg border p-3",
                  isPending
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-border bg-muted/10",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{columnName}</p>
                    {isPending && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        Elige valores
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => removeSegment(columnName)}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Quitar
                  </Button>
                </div>

                {isPending && (
                  <p className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-200">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Selecciona al menos un valor para que este filtro se aplique al generar el
                    gráfico.
                  </p>
                )}

                <ValueChipPicker
                  label="Valores a incluir"
                  options={getColumnValues(columnName, columns, analyticsColumns)}
                  value={selected}
                  onChange={(vals) => updateSegment(columnName, vals)}
                  emptyMeansAll={false}
                  pendingHint="Haz clic en los valores que quieres incluir."
                />
              </div>
            );
          })}

          {availableToAdd.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/10 p-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label htmlFor="segment-column" className="text-xs font-medium">
                  {addedColumns.length === 0 ? "Columna a segmentar" : "Añadir otra columna"}
                </label>
                <select
                  id="segment-column"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={draftColumn}
                  onChange={(e) => setDraftColumn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSegment();
                    }
                  }}
                >
                  <option value="">Elegir columna…</option>
                  {availableToAdd.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.inferred_type})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="shrink-0"
                onClick={addSegment}
                disabled={!draftColumn}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Añadir columna
              </Button>
            </div>
          )}

          {addedColumns.length > 0 && availableToAdd.length === 0 && (
            <p className="text-center text-[11px] text-muted-foreground">
              Ya añadiste todas las columnas segmentables disponibles.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
