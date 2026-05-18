import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, Search, LogOut, Settings, LayoutDashboard, KeyRound } from "lucide-react";

export function PublicNavbar() {
  const user = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const dashHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "owner"
        ? "/owner"
        : user?.role === "tenant"
          ? "/tenant"
          : "/login";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground shadow-card">
            <Home className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            Estate<span className="text-gradient-warm">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${path === "/" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Inicio
          </Link>
          <Link
            to="/units"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${path.startsWith("/units") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Explorar
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="rounded-full bg-gradient-warm shadow-card">
                <Link to="/register">Crear cuenta</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 shadow-sm transition hover:shadow-card">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-gradient-warm text-xs text-primary-foreground">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden pr-2 text-sm font-medium md:inline">{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={dashHref}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Mi panel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/units">
                    <Search className="mr-2 h-4 w-4" /> Explorar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/change-password">
                    <KeyRound className="mr-2 h-4 w-4" /> Cambiar contraseña
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    nav({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-warm text-primary-foreground">
              <Home className="h-4 w-4" />
            </div>
            <span className="font-display font-bold">EstateHub</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Encuentra tu próximo hogar con confianza.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Plataforma</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Propiedades</li>
            <li>Edificios</li>
            <li>Amenidades</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Soporte</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Centro de ayuda</li>
            <li>Contacto</li>
            <li>Términos</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Demo</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>admin@estate.com / admin123</li>
            <li>owner@estate.com / owner123</li>
            <li>tenant@estate.com / tenant123</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © 2025 EstateHub · Prototipo demo · <Settings className="inline h-3 w-3" />
      </div>
    </footer>
  );
}
