import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, DoorOpen, Sparkles, Bed, Bath, Square } from "lucide-react";

export const Route = createFileRoute("/owner/buildings/$buildingId")({
  component: Page,
});

function Page() {
  const { buildingId } = Route.useParams();
  const buildings = useAppStore((s) => s.buildings);
  const units = useAppStore((s) => s.units);
  const amenities = useAppStore((s) => s.amenities);

  const building = useMemo(() => buildings.find((b) => b.id === buildingId), [buildings, buildingId]);
  const bUnits = useMemo(() => units.filter((u) => u.buildingId === buildingId), [units, buildingId]);
  const bAmenities = useMemo(
    () => amenities.filter((a) => a.buildingId === buildingId),
    [amenities, buildingId],
  );

  if (!building) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">Edificio no encontrado</h1>
        <Button asChild variant="outline">
          <Link to="/owner/buildings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
      </div>
    );
  }

  const available = bUnits.filter((u) => u.status === "available").length;
  const rented = bUnits.filter((u) => u.status === "rented").length;
  const maintenance = bUnits.filter((u) => u.status === "maintenance").length;
  const totalRent = bUnits.reduce((acc, u) => acc + (u.status === "rented" ? u.rent : 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/owner/buildings">
            <ArrowLeft className="mr-1 h-4 w-4" /> Edificios
          </Link>
        </Button>
        <h1 className="mt-2 font-display text-3xl font-bold">{building.name}</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" /> {building.address} · {building.city}
        </p>
      </div>

      {/* Galería */}
      <div className="grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
        <img
          src={building.images[0]}
          alt={building.name}
          className="h-full w-full object-cover sm:col-span-2 sm:row-span-2"
        />
        {building.images.slice(1, 5).map((img, i) => (
          <img
            key={i}
            src={img}
            alt=""
            loading="lazy"
            className="aspect-[4/3] h-full w-full object-cover"
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {building.description && (
            <section>
              <h2 className="font-display text-xl font-bold">Sobre el edificio</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{building.description}</p>
            </section>
          )}

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Amenidades</h2>
              <Badge variant="outline" className="ml-1">
                {bAmenities.length}
              </Badge>
            </div>
            {bAmenities.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Este edificio aún no tiene amenidades.{" "}
                <Link to="/owner/buildings" className="text-primary hover:underline">
                  Editar edificio
                </Link>
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bAmenities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-xl">
                      {a.icon}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.bookable ? "Reservable" : "Solo uso"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Unidades</h2>
              <Badge variant="outline" className="ml-1">
                {bUnits.length}
              </Badge>
            </div>
            {bUnits.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Sin unidades en este edificio.{" "}
                <Link to="/owner/units" className="text-primary hover:underline">
                  Crear unidad
                </Link>
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {bUnits.map((u) => (
                  <Link
                    key={u.id}
                    to="/units/$unitId"
                    params={{ unitId: u.id }}
                    className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-card"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={u.images[0]}
                        alt={u.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          #{u.number}
                        </span>
                        <StatusBadge status={u.status} />
                      </div>
                      <div className="mt-1 line-clamp-1 font-medium">{u.title}</div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5" /> {u.bedrooms}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5" /> {u.bathrooms}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Square className="h-3.5 w-3.5" /> {u.area}m²
                        </span>
                        <span className="ml-auto font-semibold text-foreground">
                          €{u.rent.toLocaleString("es-ES")}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-bold">Resumen</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Unidades totales" value={bUnits.length} />
              <Row label="Disponibles" value={available} accent="success" />
              <Row label="Alquiladas" value={rented} />
              <Row label="Mantenimiento" value={maintenance} accent="warning" />
              <div className="my-2 h-px bg-border" />
              <Row label="Renta mensual activa" value={`€${totalRent.toLocaleString("es-ES")}`} />
            </dl>
          </div>
          <Button asChild className="w-full bg-gradient-warm">
            <Link to="/owner/units">Gestionar unidades</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "available" | "rented" | "maintenance" }) {
  const map = {
    available: { label: "Disponible", cls: "border-success/30 text-success" },
    rented: { label: "Alquilada", cls: "" },
    maintenance: { label: "Mantenim.", cls: "border-warning/30 text-warning-foreground" },
  };
  const m = map[status];
  return (
    <Badge variant="outline" className={`text-[10px] ${m.cls}`}>
      {m.label}
    </Badge>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "success" | "warning";
}) {
  const cls =
    accent === "success" ? "text-success" : accent === "warning" ? "text-warning-foreground" : "";
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-semibold ${cls}`}>{value}</dd>
    </div>
  );
}
