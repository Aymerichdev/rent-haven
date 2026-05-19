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
import { Home, Search, LogOut, KeyRound, LayoutDashboard, Phone } from "lucide-react";

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

  const linkBase = "px-3 py-2 text-sm font-medium text-neutral-700 hover:text-[#2563eb] transition-colors";
  const linkActive = "text-[#2563eb]";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb] text-white">
            <Home className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-neutral-900">
            BR<span className="text-[#2563eb]"> Internacional</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/" className={`${linkBase} ${path === "/" ? linkActive : ""}`}>
            Inicio
          </Link>
          <Link to="/units" className={`${linkBase} ${path.startsWith("/units") ? linkActive : ""}`}>
            Propiedades
          </Link>
          <a href="/#servicios" className={linkBase}>
            Servicios
          </a>
          <a href="/#sobre-nosotros" className={linkBase}>
            Sobre nosotros
          </a>
          <a href="/#faq" className={linkBase}>
            ¿Tienes dudas?
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button aria-label="Buscar" className="hidden text-neutral-700 hover:text-[#2563eb] md:inline-flex">
            <Search className="h-4 w-4" />
          </button>
          <span className="hidden items-center gap-1 text-xs font-medium text-neutral-700 lg:inline-flex">
            <Phone className="h-3.5 w-3.5" /> +506 0000-0000
          </span>
          <span className="hidden text-xs font-medium text-neutral-700 lg:inline">Español (CR)</span>

          {!user ? (
            <>
              <Link to="/login" className="text-sm font-medium text-neutral-800 hover:text-[#2563eb]">
                Iniciar sesión
              </Link>
              <Button asChild className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800">
                <a href="/#faq">Contáctanos</a>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-1.5 hover:border-[#2563eb]">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-[#2563eb] text-xs text-white">
                      {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden pr-2 text-sm font-medium text-neutral-800 md:inline">{user.name}</span>
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
    <footer className="mt-0 bg-neutral-900 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-white">
              <Home className="h-4 w-4" />
            </div>
            <span className="font-display font-bold text-white">BR Internacional</span>
          </div>
          <p className="mt-3 text-sm">Administración moderna, humana y transparente.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Plataforma</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Propiedades</li>
            <li>Servicios</li>
            <li>Sobre nosotros</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Soporte</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Centro de ayuda</li>
            <li>Contacto</li>
            <li>Términos</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Contacto</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +506 0000-0000</li>
            <li>Costa Rica</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500">
        © 2026 BR Internacional · Todos los derechos reservados
      </div>
    </footer>
  );
}
