"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface XAxisTagFilterProps {
  columnName: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}

export function XAxisTagFilter({
  columnName,
  options,
  value,
  onChange,
}: XAxisTagFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const available = useMemo(
    () => options.filter((opt) => !value.includes(opt)),
    [options, value],
  );

  const remove = (option: string) => {
    onChange(value.filter((item) => item !== option));
  };

  const add = (option: string) => {
    onChange([...value, option]);
    setOpen(false);
  };

  if (options.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-border/60 pt-4">
      <p className="text-sm font-medium text-foreground">
        Valores visibles en el eje X{" "}
        <span className="font-normal text-muted-foreground">(Filtro rápido)</span>
      </p>
      <div ref={containerRef} className="relative flex flex-wrap items-center gap-2">
        {value.length === 0 && (
          <span className="text-xs text-muted-foreground">Todos los valores visibles</span>
        )}
        {value.map((option) => (
          <span
            key={option}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
          >
            {option}
            <button
              type="button"
              onClick={() => remove(option)}
              className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
              aria-label={`Quitar ${option}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {available.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <Plus className="h-3 w-3" />
              Agregar
            </button>
            {open && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Cerrar"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute left-0 top-full z-50 mt-1 max-h-40 min-w-[160px] overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
                  {available.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => add(option)}
                      className="flex w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-muted"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Columna: <span className="font-medium text-foreground">{columnName}</span>
      </p>
    </div>
  );
}
