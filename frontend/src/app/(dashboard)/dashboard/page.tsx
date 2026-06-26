import { BarChart3, Database, MessageSquare, Upload } from "lucide-react";
import Link from "next/link";

import { DatasetsTable } from "@/components/dashboard/datasets-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Datasets",
    description: "Sube archivos Excel, CSV o JSON para analizarlos.",
    icon: Upload,
    status: "Activo",
    href: "/datasets",
  },
  {
    title: "Analytics",
    description: "Métricas automáticas: sum, avg, min, max.",
    icon: BarChart3,
    status: "Sprint 2",
    href: null,
  },
  {
    title: "Dashboard",
    description: "Gráficos auto-generados y KPI cards.",
    icon: Database,
    status: "Sprint 3",
    href: null,
  },
  {
    title: "AI Chat",
    description: "Pregunta en lenguaje natural sobre tus datos.",
    icon: MessageSquare,
    status: "Sprint 4",
    href: null,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Sprint 1 activo — sube tus datos para comenzar el análisis.
          </p>
        </div>
        <Link href="/datasets" className={buttonVariants()}>
          Subir dataset
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
              <feature.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">{feature.description}</CardDescription>
              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {feature.status}
              </span>
              {feature.href && (
                <Link
                  href={feature.href}
                  className={cn(buttonVariants({ variant: "link" }), "mt-2 h-auto p-0")}
                >
                  Ir →
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Datasets recientes</h2>
        <DatasetsTable />
      </div>
    </div>
  );
}
