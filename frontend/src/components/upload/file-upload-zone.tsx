"use client";

import { CheckCircle2, FileUp, Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadDataset } from "@/hooks/use-datasets";
import { ApiError } from "@/services/datasets";
import { cn } from "@/lib/utils";

const ACCEPTED = ".csv,.xlsx,.xls,.json";

interface FileUploadZoneProps {
  onSuccess?: () => void;
}

export function FileUploadZone({ onSuccess }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const upload = useUploadDataset();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setJustUploaded(false);
      setSelectedFile(file);
      try {
        await upload.mutateAsync({ file, name: name || undefined });
        setName("");
        setSelectedFile(null);
        setJustUploaded(true);
        onSuccess?.();
        window.setTimeout(() => setJustUploaded(false), 4000);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Error al subir el archivo");
      }
    },
    [upload, name, onSuccess],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {justUploaded && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Archivo subido correctamente. Procesando esquema…
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="dataset-name">Nombre del dataset (opcional)</Label>
        <Input
          id="dataset-name"
          placeholder="Ej: Ventas Q1 2025"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={upload.isPending}
          className="bg-background"
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-10 transition-all sm:p-12",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 bg-muted/20 hover:border-primary/40 hover:bg-muted/30",
          upload.isPending && "pointer-events-none opacity-80",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--primary)/8,transparent_55%)]" />

        <div
          className={cn(
            "relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
            dragOver ? "bg-primary/15 text-primary" : "bg-background text-muted-foreground shadow-sm",
          )}
        >
          {upload.isPending ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : selectedFile ? (
            <FileUp className="h-7 w-7 text-primary" />
          ) : (
            <Upload className="h-7 w-7" />
          )}
        </div>

        <p className="relative mb-1 text-sm font-semibold">
          {upload.isPending
            ? "Subiendo archivo…"
            : dragOver
              ? "Suelta el archivo aquí"
              : "Arrastra tu archivo aquí"}
        </p>
        <p className="relative mb-5 text-center text-xs text-muted-foreground">
          CSV, Excel (.xlsx, .xls) o JSON — máx. 50 MB
        </p>

        <label className="relative cursor-pointer">
          <span className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
            {upload.isPending ? "Subiendo…" : "Seleccionar archivo"}
          </span>
          <input
            type="file"
            accept={ACCEPTED}
            className="hidden"
            disabled={upload.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}
