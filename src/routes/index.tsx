import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { PublicNavbar, Footer } from "@/components/site/PublicNavbar";
import { UnitCard } from "@/components/site/UnitCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import hero from "@/assets/hero.jpg";
import prop1 from "@/assets/prop1.jpg";
import prop2 from "@/assets/prop2.jpg";
import prop3 from "@/assets/prop3.jpg";
import prop4 from "@/assets/prop4.jpg";
import { Search, MapPin, Sparkles, ShieldCheck, Calendar, Quote, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EstateHub — Encuentra tu próximo hogar" },
      {
        name: "description",
        content:
          "Plataforma de alquileres con unidades verificadas, contratos digitales y reserva de amenidades.",
      },
      { property: "og:title", content: "EstateHub — Encuentra tu próximo hogar" },
      {
        property: "og:description",
        content: "Alquileres modernos, simples y confiables.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);
  const featured = units.filter((u) => u.featured && u.status === "available").slice(0, 3);
  const cities = Array.from(new Set(buildings.map((b) => b.city)));
  const [city, setCity] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:pb-32 lg:pt-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3 w-3 text-primary" /> Más de {units.length} unidades disponibles
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Tu próximo hogar
              <br />
              <span className="text-gradient-warm">empieza aquí.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Apartamentos, casas y estudios con todo en un solo lugar: contratos, pagos y reserva
              de amenidades.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-elegant sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  list="cities"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="¿A dónde quieres mudarte?"
                  className="border-0 px-0 shadow-none focus-visible:ring-0"
                />
                <datalist id="cities">
                  {cities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <Button asChild size="lg" className="rounded-xl bg-gradient-warm">
                <Link to="/units">
                  <Search className="mr-2 h-4 w-4" /> Buscar
                </Link>
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-success" /> Propietarios verificados
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Reserva de amenidades
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* DESTACADAS */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Unidades destacadas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selección de las mejores opciones esta semana.
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/units">Ver todas →</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((u) => (
            <UnitCard key={u.id} unit={u} building={buildings.find((b) => b.id === u.buildingId)} />
          ))}
        </div>
      </section>

      {/* CIUDADES */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <h3 className="mb-4 font-display text-xl font-bold">Explora por ciudad</h3>
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <Link
              key={c}
              to="/units"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition hover:border-primary hover:text-primary"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
