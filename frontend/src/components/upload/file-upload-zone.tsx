"use client";

import { CheckCircle2, FileSpreadsheet, FileUp, Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadDataset } from "@/hooks/use-datasets";
import { ApiError } from "@/services/datasets";
import { cn } from "@/lib/utils";

const ACCEPTED = ".csv,.xlsx,.xls,.json";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

  const selectFile = useCallback((file: File) => {
    setError(null);
    setJustUploaded(false);
    setSelectedFile(file);
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!selectedFile) return;

    setError(null);
    setJustUploaded(false);

    try {
      await upload.mutateAsync({ file: selectedFile, name: name || undefined });
      setName("");
      setSelectedFile(null);
      setJustUploaded(true);
      onSuccess?.();
      window.setTimeout(() => setJustUploaded(false), 4000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al procesar el dataset");
    }
  }, [selectedFile, name, upload, onSuccess]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) selectFile(file);
    },
    [selectFile],
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
          Dataset procesado correctamente. Detectando esquema…
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
          if (!upload.isPending) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-10 transition-all sm:p-12",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : selectedFile
              ? "border-primary/40 bg-primary/5"
              : "border-muted-foreground/25 bg-muted/20 hover:border-primary/40 hover:bg-muted/30",
          upload.isPending && "pointer-events-none opacity-80",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--primary)/8,transparent_55%)]" />

        <div
          className={cn(
            "relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
            dragOver || selectedFile
              ? "bg-primary/15 text-primary"
              : "bg-background text-muted-foreground shadow-sm",
          )}
        >
          {upload.isPending ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : selectedFile ? (
            <FileSpreadsheet className="h-7 w-7 text-primary" />
          ) : (
            <Upload className="h-7 w-7" />
          )}
        </div>

        {selectedFile ? (
          <>
            <p className="relative mb-1 text-sm font-semibold">Archivo cargado</p>
            <div className="relative mb-1 flex max-w-full items-center gap-2 rounded-lg border bg-background/80 px-3 py-2">
              <FileUp className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              {!upload.isPending && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="ml-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Quitar archivo"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="relative mb-5 text-center text-xs text-muted-foreground">
              Revisa el archivo y pulsa &quot;Procesar dataset&quot; para continuar
            </p>
          </>
        ) : (
          <>
            <p className="relative mb-1 text-sm font-semibold">
              {dragOver ? "Suelta el archivo aquí" : "Arrastra tu archivo aquí"}
            </p>
            <p className="relative mb-5 text-center text-xs text-muted-foreground">
              CSV, Excel (.xlsx, .xls) o JSON — máx. 50 MB
            </p>
          </>
        )}

        <label className="relative cursor-pointer">
          <span className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
            {selectedFile ? "Cambiar archivo" : "Seleccionar archivo"}
          </span>
          <input
            type="file"
            accept={ACCEPTED}
            className="hidden"
            disabled={upload.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) selectFile(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={handleProcess}
          disabled={!selectedFile || upload.isPending}
          className="min-w-[160px]"
        >
          {upload.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando…
            </>
          ) : (
            "Procesar dataset"
          )}
        </Button>
        {selectedFile && !upload.isPending && (
          <Button variant="outline" onClick={clearFile}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
