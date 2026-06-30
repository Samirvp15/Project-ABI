import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FILE_TYPE_LABELS: Record<string, string> = {
  csv: "CSV",
  xlsx: "XLSX",
  xls: "XLS",
  json: "JSON",
};

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  processing: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  pending: "bg-muted text-muted-foreground",
  error: "bg-destructive/15 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  ready: "Listo",
  processing: "Procesando",
  pending: "Pendiente",
  error: "Error",
};

export function getFileTypeLabel(fileType: string): string {
  return FILE_TYPE_LABELS[fileType] ?? fileType.toUpperCase();
}

export function DatasetStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? STATUS_STYLES.pending,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function DatasetFileTypeBadge({ fileType }: { fileType: string }) {
  return (
    <Badge variant="outline" className="text-[10px] font-normal">
      {getFileTypeLabel(fileType)}
    </Badge>
  );
}
