"use client";

import { FileJson, FileSpreadsheet, Sparkles, Table2 } from "lucide-react";

import { FileUploadZone } from "@/components/upload/file-upload-zone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formats = [
  {
    icon: Table2,
    label: "CSV",
    detail: "Separado por comas, ideal para exportaciones",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: FileSpreadsheet,
    label: "Excel",
    detail: ".xlsx y .xls con hojas múltiples",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: FileJson,
    label: "JSON",
    detail: "Arrays de objetos o registros anidados",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
];

interface DatasetsUploadPanelProps {
  onSuccess?: () => void;
}

export function DatasetsUploadPanel({ onSuccess }: DatasetsUploadPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="border-0 bg-card/80 shadow-sm lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Subir nuevo dataset
          </CardTitle>
          <CardDescription>
            Selecciona un archivo, revísalo y luego pulsa &quot;Procesar dataset&quot; para detectar
            el esquema y tipos de columna.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploadZone onSuccess={onSuccess} />
        </CardContent>
      </Card>

      <div className="space-y-4 lg:col-span-2">
        <Card className="border-0 bg-gradient-to-br from-primary/5 to-violet-500/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Formatos soportados</CardTitle>
            <CardDescription>Máximo 50 MB por archivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {formats.map((f) => (
              <div key={f.label} className="flex items-start gap-3 rounded-lg border bg-background/60 p-3">
                <div className={`rounded-lg p-2 ${f.bg}`}>
                  <f.icon className={`h-4 w-4 ${f.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-card/60 shadow-sm">
          <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Después de procesar</p>
            <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed">
              <li>1. Carga el archivo en la zona de subida</li>
              <li>2. Pulsa &quot;Procesar dataset&quot;</li>
              <li>3. Se infieren tipos y nulos por columna</li>
              <li>4. Analytics y gráficos quedan disponibles al estar listo</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
