"use client";

import { Sparkles, Upload } from "lucide-react";
import Link from "next/link";

import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { DashboardRecentDatasets } from "@/components/dashboard/dashboard-recent-datasets";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getDisplayName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) return fullName.split(" ")[0] ?? fullName;
  if (email) return email.split("@")[0] ?? "Usuario";
  return "Usuario";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const displayName = getDisplayName(user?.full_name, user?.email);

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/8 via-background to-violet-500/5 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Business Intelligence Assistant
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {getGreeting()}, {displayName}
              </h1>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Centraliza tus datos, revisa métricas automáticas y crea gráficos dinámicos desde
                un solo lugar.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/datasets" className={buttonVariants({ size: "lg" })}>
              <Upload className="mr-2 h-4 w-4" />
              Subir dataset
            </Link>
            <Link
              href="/analytics"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-background/80")}
            >
              Explorar analytics
            </Link>
          </div>
        </div>
      </section>

      <DashboardStats />

      <DashboardQuickActions />

      <DashboardRecentDatasets />
    </div>
  );
}
