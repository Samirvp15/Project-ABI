import { ArrowRight, BarChart3, MessageSquare, Upload } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const actions = [
  {
    title: "Subir dataset",
    description: "Importa CSV, Excel o JSON y empieza a analizar en segundos.",
    href: "/datasets",
    icon: Upload,
    accent: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    cta: "Ir a Datasets",
    active: true,
  },
  {
    title: "Analytics & gráficos",
    description: "KPIs, barras, líneas, pastel y explorador dinámico por columnas.",
    href: "/analytics",
    icon: BarChart3,
    accent: "from-violet-500/10 to-violet-600/5 border-violet-500/20",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    cta: "Ver Analytics",
    active: true,
  },
  {
    title: "AI Chat",
    description: "Pregunta en lenguaje natural sobre tus datos con SQL seguro y explicaciones.",
    href: "/chat",
    icon: MessageSquare,
    accent: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    cta: "Abrir chat",
    active: true,
  },
];

const steps = [
  { step: "1", title: "Sube", detail: "Arrastra tu archivo" },
  { step: "2", title: "Analiza", detail: "Métricas automáticas" },
  { step: "3", title: "Visualiza", detail: "Gráficos dinámicos" },
];

export function DashboardQuickActions() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Acciones rápidas</h2>
          <p className="text-sm text-muted-foreground">Empieza desde aquí</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {steps.map((s, i) => (
            <div key={s.step} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {s.step}
                </span>
                <span className="font-medium">{s.title}</span>
                <span className="text-muted-foreground">{s.detail}</span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const inner = (
            <div
              className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-all",
                action.accent,
                action.active && "hover:shadow-md hover:-translate-y-0.5",
                !action.active && "opacity-75",
              )}
            >
              <div className={cn("mb-4 inline-flex w-fit rounded-lg p-2.5", action.iconBg)}>
                <action.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{action.title}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                {action.description}
              </p>
              <span
                className={cn(
                  "mt-4 inline-flex items-center text-sm font-medium",
                  action.active ? "text-foreground group-hover:gap-2" : "text-muted-foreground",
                )}
              >
                {action.cta}
                {action.active && (
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </span>
            </div>
          );

          if (action.href && action.active) {
            return (
              <Link key={action.title} href={action.href} className="block h-full">
                {inner}
              </Link>
            );
          }

          return <div key={action.title}>{inner}</div>;
        })}
      </div>
    </div>
  );
}
