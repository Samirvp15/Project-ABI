import { BarChart3, Database, MessageSquare, Upload } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Datasets",
    description: "Sube archivos Excel, CSV o JSON para analizarlos.",
    icon: Upload,
    status: "Sprint 1",
  },
  {
    title: "Analytics",
    description: "Métricas automáticas: sum, avg, min, max.",
    icon: BarChart3,
    status: "Sprint 2",
  },
  {
    title: "Dashboard",
    description: "Gráficos auto-generados y KPI cards.",
    icon: Database,
    status: "Sprint 3",
  },
  {
    title: "AI Chat",
    description: "Pregunta en lenguaje natural sobre tus datos.",
    icon: MessageSquare,
    status: "Sprint 4",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido a ABI. Sprint 0 completado — autenticación activa.
        </p>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
