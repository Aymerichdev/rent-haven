import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useAppStore } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home, LogOut, KeyRound } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface Props {
  brand: string;
  brandTag: string;
  items: NavItem[];
  children: ReactNode;
}

export function DashboardShell({ brand, brandTag, items, children }: Props) {
  const user = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-secondary/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-sm font-bold leading-tight">{brand}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {brandTag}
            </div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {items.map((it) => {
            const active = path === it.to || (it.to !== "/" && path.startsWith(it.to));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                {it.icon}
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <Link
            to="/change-password"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent"
          >
            <KeyRound className="h-4 w-4" /> Cambiar contraseña
          </Link>
          <div className="rounded-xl border border-sidebar-border bg-card p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-warm text-xs text-primary-foreground">
                  {user?.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user?.name}</div>
                <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={async () => {
                await logout();
                nav({ to: "/" });
              }}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" /> Salir
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-warm text-primary-foreground">
              <Home className="h-4 w-4" />
            </div>
            <span className="font-display font-bold">{brand}</span>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await logout();
              nav({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex gap-2 overflow-x-auto border-b border-border bg-background px-4 py-2 md:hidden">
          {items.map((it) => {
            const active = path === it.to || (it.to !== "/" && path.startsWith(it.to));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
