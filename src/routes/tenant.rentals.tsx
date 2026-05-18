import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore, getUnitAddress } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Bed, Bath, Square, MapPin } from "lucide-react";

export const Route = createFileRoute("/tenant/rentals")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const contracts = useAppStore((s) => s.contracts);
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);
  const tenantContracts = contracts.filter((c) => c.tenantId === user?.id && c.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Mis alquileres</h1>
        <p className="mt-1 text-sm text-muted-foreground">Unidades activas.</p>
      </div>

      {tenantContracts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Aún no tienes alquileres activos.</p>
          <Button asChild className="mt-4 bg-gradient-warm">
            <Link to="/units">Explorar unidades</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {tenantContracts.map((c) => {
          const u = units.find((x) => x.id === c.unitId);
          const b = buildings.find((x) => x.id === u?.buildingId);
          if (!u) return null;
          return (
            <div key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <img src={u.images[0]} alt="" loading="lazy" className="h-48 w-full object-cover" />
              <div className="p-5">
                <h3 className="font-display text-lg font-bold">{u.title}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {getUnitAddress(u, b)}
                </p>
                <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5" /> {u.bedrooms}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" /> {u.bathrooms}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Square className="h-3.5 w-3.5" /> {u.area} m²
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-secondary/60 p-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Inicio</div>
                    <div className="font-medium">{c.startDate}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fin</div>
                    <div className="font-medium">{c.endDate}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
