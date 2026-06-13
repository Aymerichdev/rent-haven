import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { Users, Building2, DoorOpen, FileText, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Page,
});

function Page() {
  const usersCount = useAppStore((s) => s.users.length);
  const units = useAppStore((s) => s.units);
  const unitsCount = units.length;
  const buildingsCount = useAppStore((s) => s.buildings.length);
  const contractsCount = useAppStore((s) => s.contracts.length);
  const totalClicks = units.reduce((acc, u) => acc + (u.clickCount ?? 0), 0);
  const topUnits = [...units]
    .sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Panel de administración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vista general del sistema.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Usuarios" value={usersCount} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Unidades" value={unitsCount} icon={<DoorOpen className="h-5 w-5" />} />
        <StatCard label="Edificios" value={buildingsCount} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Contratos activos" value={contractsCount} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Vistas a unidades" value={totalClicks} icon={<Eye className="h-5 w-5" />} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold">Unidades más vistas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Conteo de clicks/vistas en la página de detalle de cada unidad.
        </p>
        {topUnits.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Todavía no hay vistas registradas.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {topUnits.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium">{u.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">#{u.number}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" /> {u.clickCount ?? 0}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold">Acciones rápidas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona los usuarios y validación de roles desde la sección Usuarios.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
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
    </div>
  );
}
