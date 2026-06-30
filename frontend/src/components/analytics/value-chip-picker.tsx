"use client";

import { cn } from "@/lib/utils";

interface ValueChipPickerProps {
  label: string;
  hint?: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyMeansAll?: boolean;
}

export function ValueChipPicker({
  label,
  hint,
  options,
  value,
  onChange,
  emptyMeansAll = true,
}: ValueChipPickerProps) {
  if (options.length === 0) return null;

  const toggle = (option: string) => {
    const next = value.includes(option)
      ? value.filter((item) => item !== option)
      : [...value, option];
    onChange(next);
  };

  const selectAll = () => onChange([]);
  const allSelected = value.length === 0;

  return (
    <div className="space-y-2 rounded-lg border border-dashed bg-muted/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {!allSelected && emptyMeansAll && (
          <button
            type="button"
            onClick={selectAll}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            Mostrar todas
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isActive = value.length === 0 ? emptyMeansAll : value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {emptyMeansAll && allSelected && (
        <p className="text-[10px] text-muted-foreground">Sin selección = se muestran todos los valores.</p>
      )}
    </div>
  );
}
