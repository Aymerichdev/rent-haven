import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { Users, Building2, DoorOpen, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Page,
});

function Page() {
  const usersCount = useAppStore((s) => s.users.length);
  const unitsCount = useAppStore((s) => s.units.length);
  const buildingsCount = useAppStore((s) => s.buildings.length);
  const contractsCount = useAppStore((s) => s.contracts.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Panel de administración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vista general del sistema.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuarios" value={usersCount} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Unidades" value={unitsCount} icon={<DoorOpen className="h-5 w-5" />} />
        <StatCard label="Edificios" value={buildingsCount} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Contratos activos" value={contractsCount} icon={<FileText className="h-5 w-5" />} />
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
