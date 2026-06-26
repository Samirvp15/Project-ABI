"use client";

import { BarChart3, Database, LayoutDashboard, MessageSquare, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/datasets", label: "Datasets", icon: Upload },
  { href: "#", label: "Analytics", icon: BarChart3, disabled: true },
  { href: "#", label: "AI Chat", icon: MessageSquare, disabled: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <span className="text-lg font-bold">ABI</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) =>
                item.disabled ? (
                  <Button key={item.label} variant="ghost" size="sm" disabled>
                    <span className="text-muted-foreground">{item.label}</span>
                  </Button>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      pathname === item.href && "bg-muted",
                    )}
                  >
                    <item.icon className="mr-1.5 h-4 w-4" />
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoading ? (
              <span className="text-sm text-muted-foreground">Cargando...</span>
            ) : (
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
