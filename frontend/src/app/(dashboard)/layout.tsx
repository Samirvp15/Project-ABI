"use client";

import { BarChart3, Database, LayoutDashboard, LogOut, MessageSquare, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsAuthenticated } from "@/hooks/use-is-authenticated";
import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, short: "Inicio" },
  { href: "/datasets", label: "Datasets", icon: Upload, short: "Datos" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, short: "Gráficos" },
  { href: "/chat", label: "AI Chat", icon: MessageSquare, short: "Chat", disabled: false },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">ABI</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  compact,
}: {
  item: (typeof navItems)[number];
  pathname: string;
  compact?: boolean;
}) {
  const isActive =
    pathname === item.href || (item.href !== "#" && pathname.startsWith(`${item.href}/`));

  if (item.disabled) {
    return (
      <Button
        key={item.label}
        variant="ghost"
        size={compact ? "icon" : "sm"}
        disabled
        className="text-muted-foreground"
        title={item.label}
      >
        <item.icon className={cn("h-4 w-4", !compact && "mr-1.5")} />
        {!compact && item.label}
      </Button>
    );
  }

  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        buttonVariants({ variant: "ghost", size: compact ? "icon" : "sm" }),
        "relative font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <item.icon className={cn("h-4 w-4", !compact && "mr-1.5")} />
      {!compact && item.label}
      {isActive && !compact && (
        <span className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const isClient = useIsClient();
  const isAuthed = useIsAuthenticated();

  useEffect(() => {
    if (isClient && !isAuthed) {
      router.replace("/login");
    }
  }, [isClient, isAuthed, router]);

  if (!isClient) {
    return (
      <DashboardShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="animate-pulse text-muted-foreground">Cargando...</p>
        </div>
      </DashboardShell>
    );
  }

  if (!isAuthed) {
    return (
      <DashboardShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-muted-foreground">Redirigiendo al login...</p>
        </div>
      </DashboardShell>
    );
  }

  const userInitial = (user?.full_name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Database className="h-4 w-4" />
              </div>
              <span className="hidden font-bold tracking-tight sm:inline">ABI</span>
            </Link>

            <nav className="hidden items-center gap-0.5 md:flex">
              {navItems.map((item) => (
                <NavLink key={item.label} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2 border-l pl-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {userInitial}
              </div>
              {isLoading ? (
                <span className="max-w-[140px] truncate text-sm text-muted-foreground">
                  Cargando...
                </span>
              ) : (
                <span className="max-w-[160px] truncate text-sm text-muted-foreground">
                  {user?.email}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Cerrar sesión"
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex items-center justify-around border-t px-2 py-1.5 md:hidden">
          {navItems.map((item) => (
            <NavLink key={item.label} item={item} pathname={pathname} compact />
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
