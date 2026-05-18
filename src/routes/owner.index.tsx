import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { Building2, DoorOpen, Inbox, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/owner/")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const buildings = useAppStore((s) => s.buildings);
  const units = useAppStore((s) => s.units);
  const requests = useAppStore((s) => s.requests);

  const ownerBuildings = buildings.filter((b) => b.ownerId === user?.id);
  const ownerUnits = units.filter((u) => u.ownerId === user?.id);
  const availableUnits = ownerUnits.filter((u) => u.status === "available");
  const pendingRequests = requests.filter((r) => r.ownerId === user?.id && r.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Hola, {user?.name} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resumen de tu portfolio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Edificios" value={ownerBuildings.length} icon={<Building2 className="h-5 w-5" />} />
        <Stat label="Unidades" value={ownerUnits.length} icon={<DoorOpen className="h-5 w-5" />} />
        <Stat label="Disponibles" value={availableUnits.length} icon={<CheckCircle2 className="h-5 w-5" />} />
        <Stat
          label="Solicitudes pendientes"
          value={pendingRequests.length}
          icon={<Inbox className="h-5 w-5" />}
          accent
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Solicitudes recientes</h2>
          {pendingRequests.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No tienes solicitudes pendientes.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pendingRequests.slice(0, 4).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm"
                >
                  <span>Solicitud #{r.id.slice(0, 5)}</span>
                  <Link to="/owner/requests" className="text-primary hover:underline">
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-gradient-warm p-6 text-primary-foreground">
          <h2 className="font-display text-lg font-bold">Publica una nueva unidad</h2>
          <p className="mt-1 text-sm text-primary-foreground/80">
            Completa la ficha y empieza a recibir solicitudes hoy.
          </p>
          <Link
            to="/owner/units"
            className="mt-4 inline-flex rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm"
          >
            Ir a unidades →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-card ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
