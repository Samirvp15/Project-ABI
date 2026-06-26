"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DateRange } from "@/types/dashboard";

interface DateRangeFilterProps {
  dateRange: DateRange | null;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

export function DateRangeFilter({
  dateRange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClear,
}: DateRangeFilterProps) {
  if (!dateRange) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="date-from">Desde</Label>
        <Input
          id="date-from"
          type="date"
          min={dateRange.min}
          max={dateRange.max}
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date-to">Hasta</Label>
        <Input
          id="date-to"
          type="date"
          min={dateRange.min}
          max={dateRange.max}
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={onApply}>Aplicar filtro</Button>
        <Button variant="outline" onClick={onClear}>
          Limpiar
        </Button>
      </div>
    </div>
  );
}
