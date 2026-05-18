import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore, getUnitAddress, getUnitCity } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, MessageSquare, Phone, Inbox } from "lucide-react";

export const Route = createFileRoute("/tenant/requests")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const requests = useAppStore((s) => s.requests);
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);
  const users = useAppStore((s) => s.users);

  const myRequests = requests
    .filter((r) => r.tenantId === user?.id)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const counts = {
    pending: myRequests.filter((r) => r.status === "pending").length,
    approved: myRequests.filter((r) => r.status === "approved").length,
    rejected: myRequests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Mis solicitudes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estado de las solicitudes de alquiler que has enviado.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Pendientes" value={counts.pending} accent="warning" />
        <Stat label="Aprobadas" value={counts.approved} accent="success" />
        <Stat label="Rechazadas" value={counts.rejected} accent="destructive" />
      </div>

      {myRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Aún no has enviado solicitudes.</p>
          <Button asChild className="mt-4 bg-gradient-warm">
            <Link to="/units">Explorar unidades</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {myRequests.map((r) => {
            const u = units.find((x) => x.id === r.unitId);
            const b = buildings.find((x) => x.id === u?.buildingId);
            const owner = users.find((x) => x.id === r.ownerId);
            return (
              <div
                key={r.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row">
                  {u && (
                    <Link
                      to="/units/$unitId"
                      params={{ unitId: u.id }}
                      className="block shrink-0 overflow-hidden rounded-xl"
                    >
                      <img
                        src={u.images[0]}
                        alt={u.title}
                        className="h-32 w-full object-cover transition-transform hover:scale-105 sm:h-24 sm:w-32"
                      />
                    </Link>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to="/units/$unitId"
                          params={{ unitId: u?.id ?? "" }}
                          className="line-clamp-1 font-display font-semibold hover:text-primary"
                        >
                          {u?.title ?? "Unidad eliminada"}
                        </Link>
                        {u && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {getUnitAddress(u, b)} ·{" "}
                            {getUnitCity(u, b)}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Enviada el {r.createdAt}
                          {r.updatedAt && r.updatedAt !== r.createdAt && (
                            <> · Actualizada el {r.updatedAt}</>
                          )}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>

                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      <div className="rounded-md bg-secondary/50 p-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Tu mensaje
                        </div>
                        <p className="mt-0.5 line-clamp-2">{r.message}</p>
                      </div>
                      <div className="rounded-md bg-secondary/50 p-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Teléfono enviado
                        </div>
                        <p className="mt-0.5 inline-flex items-center gap-1 font-medium">
                          <Phone className="h-3 w-3" /> {r.phone}
                        </p>
                      </div>
                    </div>

                    {r.ownerResponse ? (
                      <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          <MessageSquare className="h-3 w-3" />
                          Respuesta de {owner?.name ?? "el propietario"}
                        </div>
                        <p className="mt-1 text-foreground">{r.ownerResponse}</p>
                      </div>
                    ) : r.status === "pending" ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        El propietario revisará tu solicitud y se pondrá en contacto contigo.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { label: "Pendiente", cls: "border-warning/30 text-warning-foreground bg-warning/10" },
    approved: { label: "Aprobada", cls: "border-success/30 text-success bg-success/10" },
    rejected: {
      label: "Rechazada",
      cls: "border-destructive/30 text-destructive bg-destructive/10",
    },
  } as const;
  const m = map[status];
  return (
    <Badge variant="outline" className={m.cls}>
      {m.label}
    </Badge>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "warning" | "success" | "destructive";
}) {
  const cls =
    accent === "success"
      ? "text-success"
      : accent === "warning"
        ? "text-warning-foreground"
        : "text-destructive";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}
