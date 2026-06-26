"use client";

import { useRouter } from "next/navigation";

import { DatasetsTable } from "@/components/dashboard/datasets-table";
import { FileUploadZone } from "@/components/upload/file-upload-zone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DatasetsPage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Datasets</h1>
        <p className="text-muted-foreground">
          Sube y gestiona tus archivos de datos para analizarlos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir archivo</CardTitle>
          <CardDescription>Excel, CSV o JSON — se detectará el esquema automáticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploadZone onSuccess={() => router.refresh()} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mis datasets</h2>
        <DatasetsTable />
      </div>
    </div>
  );
}
