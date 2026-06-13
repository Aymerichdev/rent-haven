import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { PublicNavbar, Footer } from "@/components/site/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnitCard } from "@/components/site/UnitCard";
import { ArrowLeft, MapPin, DoorOpen, Sparkles, Building2 } from "lucide-react";

export const Route = createFileRoute("/buildings/$buildingId")({
  head: ({ params }) => ({
    meta: [
      { title: "Edificio — BR Internacional" },
      { property: "og:title", content: "Edificio — BR Internacional" },
      { property: "og:url", content: `/buildings/${params.buildingId}` },
    ],
    links: [{ rel: "canonical", href: `/buildings/${params.buildingId}` }],
  }),
  component: Page,
});

function Page() {
  const { buildingId } = Route.useParams();
  const buildings = useAppStore((s) => s.buildings);
  const units = useAppStore((s) => s.units);
  const amenities = useAppStore((s) => s.amenities);

  const building = useMemo(
    () => buildings.find((b) => b.id === buildingId),
    [buildings, buildingId],
  );
  const bUnits = useMemo(
    () => units.filter((u) => u.buildingId === buildingId),
    [units, buildingId],
  );
  const bAmenities = useMemo(
    () => amenities.filter((a) => a.buildingId === buildingId),
    [amenities, buildingId],
  );

  if (!building) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="mx-auto max-w-3xl p-12 text-center">
          <h1 className="font-display text-2xl font-bold">Edificio no encontrado</h1>
          <Button asChild className="mt-4">
            <Link to="/units">Ver propiedades</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const available = bUnits.filter((u) => u.status === "available");

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative">
        <div className="relative h-72 overflow-hidden sm:h-96">
          <img
            src={building.images[0]}
            alt={building.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/85 via-neutral-900/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-6 pb-8 text-white">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-3 -ml-2 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/units">
                <ArrowLeft className="mr-1 h-4 w-4" /> Volver a propiedades
              </Link>
            </Button>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                  <Building2 className="h-3 w-3" /> Edificio
                </span>
                <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
                  {building.name}
                </h1>
                <p className="mt-2 flex items-center gap-1 text-sm text-white/80">
                  <MapPin className="h-4 w-4" /> {building.address} · {building.city}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
                  {bUnits.length} unidades
                </Badge>
                <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
                  {available.length} disponibles
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-12">
        {building.description && (
          <section>
            <h2 className="font-display text-2xl font-bold">Sobre el edificio</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              {building.description}
            </p>
          </section>
        )}

        {/* Galería secundaria */}
        {building.images.length > 1 && (
          <section>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {building.images.slice(1, 5).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {/* Amenidades */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">Amenidades</h2>
            <Badge variant="outline" className="ml-1">
              {bAmenities.length}
            </Badge>
          </div>
          {bAmenities.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Este edificio aún no tiene amenidades registradas.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bAmenities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-xl">
                    {a.icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.bookable ? "Reservable" : "Uso libre"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Unidades */}
        <section>
          <div className="mb-6 flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">Unidades</h2>
            <Badge variant="outline" className="ml-1">
              {bUnits.length}
            </Badge>
          </div>
          {bUnits.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Sin unidades publicadas en este edificio por ahora.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bUnits.map((u) => (
                <UnitCard key={u.id} unit={u} building={building} />
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
