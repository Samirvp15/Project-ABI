"use client";

import { ChevronDown, Plus, X } from "lucide-react";
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

  const activeColumns = Object.keys(value).filter((col) => value[col]?.length);
  const [draftColumn, setDraftColumn] = useState("");

  const addSegment = () => {
    if (!draftColumn || value[draftColumn]) return;
    onChange({ ...value, [draftColumn]: [] });
    setDraftColumn("");
  };

  const removeSegment = (columnName: string) => {
    const next = { ...value };
    delete next[columnName];
    onChange(next);
  };

  const updateSegment = (columnName: string, values: string[]) => {
    const next = { ...value };
    if (values.length === 0) {
      delete next[columnName];
    } else {
      next[columnName] = values;
    }
    onChange(next);
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
            Opcional · limita el dataset sin cambiar el eje X
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeColumns.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {activeColumns.length} activo(s)
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t px-4 py-3">
          {activeColumns.map((columnName) => (
            <div key={columnName} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {columnName}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => removeSegment(columnName)}
                >
                  <X className="mr-1 h-3 w-3" />
                  Quitar
                </Button>
              </div>
              <ValueChipPicker
                label="Incluir solo estos valores"
                hint="Estos valores aparecerán en la etiqueta del gráfico, no en el eje X."
                options={getColumnValues(columnName, columns, analyticsColumns)}
                value={value[columnName] ?? []}
                onChange={(vals) => updateSegment(columnName, vals)}
                emptyMeansAll={false}
              />
            </div>
          ))}

          {activeColumns.length < segmentColumns.length && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label htmlFor="segment-column" className="text-xs font-medium">
                  Añadir condición
                </label>
                <select
                  id="segment-column"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={draftColumn}
                  onChange={(e) => setDraftColumn(e.target.value)}
                >
                  <option value="">Elegir columna…</option>
                  {segmentColumns
                    .filter((col) => !value[col.name])
                    .map((col) => (
                      <option key={col.name} value={col.name}>
                        {col.name}
                      </option>
                    ))}
                </select>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSegment} disabled={!draftColumn}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Añadir
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
