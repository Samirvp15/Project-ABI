"use client";

import { Upload } from "lucide-react";
import { useCallback, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadDataset } from "@/hooks/use-datasets";
import { ApiError } from "@/services/datasets";

const ACCEPTED = ".csv,.xlsx,.xls,.json";

interface FileUploadZoneProps {
  onSuccess?: () => void;
}

export function FileUploadZone({ onSuccess }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const upload = useUploadDataset();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        await upload.mutateAsync({ file, name: name || undefined });
        setName("");
        onSuccess?.();
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
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="dataset-name">Nombre del dataset (opcional)</Label>
        <Input
          id="dataset-name"
          placeholder="Ej: Ventas Q1 2025"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
      >
        <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
        <p className="mb-2 text-sm font-medium">Arrastra tu archivo aquí</p>
        <p className="mb-4 text-xs text-muted-foreground">CSV, Excel (.xlsx) o JSON — máx. 50 MB</p>
        <label className="cursor-pointer">
          <span className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium">
            {upload.isPending ? "Subiendo..." : "Seleccionar archivo"}
          </span>
          <input
            type="file"
            accept={ACCEPTED}
            className="hidden"
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
