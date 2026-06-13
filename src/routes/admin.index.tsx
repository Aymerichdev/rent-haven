import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  DoorOpen,
  FileText,
  Eye,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Page,
});

function Page() {
  const users = useAppStore((s) => s.users);
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);
  const contracts = useAppStore((s) => s.contracts);
  const amenities = useAppStore((s) => s.amenities);

  const usersCount = users.length;
  const ownersCount = users.filter((u) => u.role === "owner").length;
  const tenantsCount = users.filter((u) => u.role === "tenant").length;
  const unitsCount = units.length;
  const available = units.filter((u) => u.status === "available").length;
  const rented = units.filter((u) => u.status === "rented").length;
  const buildingsCount = buildings.length;
  const contractsCount = contracts.length;
  const totalClicks = units.reduce((acc, u) => acc + (u.clickCount ?? 0), 0);

  const topUnits = [...units]
    .sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0))
    .slice(0, 6);
  const maxClicks = Math.max(1, topUnits[0]?.clickCount ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          Panel de administración
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista general de la actividad y crecimiento de la plataforma.
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Usuarios"
          value={usersCount}
          icon={<Users className="h-5 w-5" />}
          hint={`${ownersCount} propietarios · ${tenantsCount} inquilinos`}
        />
        <StatCard
          label="Unidades"
          value={unitsCount}
          icon={<DoorOpen className="h-5 w-5" />}
          hint={`${available} disponibles · ${rented} alquiladas`}
        />
        <StatCard
          label="Edificios"
          value={buildingsCount}
          icon={<Building2 className="h-5 w-5" />}
          hint={`${amenities.length} amenidades registradas`}
        />
        <StatCard
          label="Contratos"
          value={contractsCount}
          icon={<FileText className="h-5 w-5" />}
          hint="Contratos activos en el sistema"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top unidades */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-bold">Unidades más vistas</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Conteo total de vistas: <strong>{totalClicks}</strong>
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              Top {topUnits.length}
            </Badge>
          </div>

          {topUnits.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Todavía no hay vistas registradas.
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {topUnits.map((u, i) => {
                const clicks = u.clickCount ?? 0;
                const pct = Math.round((clicks / maxClicks) * 100);
                const building = buildings.find((b) => b.id === u.buildingId);
                return (
                  <li key={u.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            i === 0
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="truncate font-medium">{u.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          #{u.number}
                          {building ? ` · ${building.name}` : ""}
                        </span>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" /> {clicks}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Acciones rápidas */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-bold">Acciones rápidas</h2>
          </div>
          <QuickAction
            to="/admin/users"
            icon={<Users className="h-5 w-5" />}
            title="Gestionar usuarios"
            description="Validar roles, propietarios e inquilinos."
          />
          <QuickAction
            to="/units"
            icon={<DoorOpen className="h-5 w-5" />}
            title="Ver propiedades"
            description="Explorar el listado público de unidades."
          />
          <QuickAction
            to="/"
            icon={<Building2 className="h-5 w-5" />}
            title="Sitio público"
            description="Ir a la página de inicio del sitio."
          />
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function QuickAction({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className="group h-auto w-full justify-start gap-3 rounded-2xl border-border bg-card p-4 text-left shadow-card hover:border-primary hover:bg-card"
    >
      <Link to={to}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block text-xs font-normal text-muted-foreground">
            {description}
          </span>
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Button>
  );
}
