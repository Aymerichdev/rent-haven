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

      {/* SERVICIOS */}
      <section id="servicios" className="mt-16">
        <div className="bg-neutral-900 py-16 text-white">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Servicios</h2>
            <p className="mt-2 text-sm text-neutral-300">
              Soluciones integrales para propietarios, inquilinos y futuros residentes.
            </p>
          </div>
        </div>

        <div className="mx-auto -mt-10 grid max-w-7xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              img: prop1,
              title: "Propietarios",
              items: [
                "Administración de condominios y propiedades individuales",
                "Gestión y cobro de mensualidades",
                "Atención a inquilinos",
                "Coordinación de mantenimiento y reparaciones",
              ],
            },
            {
              img: prop2,
              title: "Inquilinos",
              items: [
                "Solicitud de reparaciones y mantenimiento",
                "Consulta de fechas de pago",
                "Reporte de pagos en línea",
                "Comunicación directa con la administración",
              ],
            },
            {
              img: prop3,
              title: "En búsqueda de tu nuevo hogar",
              items: [
                "Propiedades disponibles para alquiler",
                "Información clara y actualizada",
                "Coordinación de visitas",
              ],
            },
          ].map((card) => (
            <div key={card.title} className="overflow-hidden rounded-2xl bg-white shadow-elegant">
              <img src={card.img} alt={card.title} className="h-48 w-full object-cover" />
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-neutral-900">{card.title}</h3>
                <ul className="mt-4 space-y-2">
                  {card.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-sm text-neutral-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#dc2626]" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-16 h-72 w-full overflow-hidden">
          <img src={prop4} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-neutral-900/70" />
          <div className="relative mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-6 text-center text-white">
            <Quote className="h-10 w-10 text-[#dc2626]" />
            <p className="mt-4 font-display text-xl leading-relaxed sm:text-2xl">
              "Alquilar con BR Internacional ha sido una experiencia increíble. Su atención al
              cliente y la calidad de sus propiedades son excepcionales."
            </p>
          </div>
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section id="sobre-nosotros">
        <div className="relative h-80 w-full overflow-hidden">
          <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-neutral-900/80" />
          <div className="relative mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-6 text-center text-white">
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Sobre Nosotros</h2>
            <p className="mt-3 text-base font-medium text-neutral-200 sm:text-lg">
              Una administración moderna, humana y transparente
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-300">
              Trabajamos para brindar tranquilidad a propietarios y bienestar a inquilinos,
              apoyándonos en procesos claros, comunicación constante y tecnología accesible.
              Nuestro compromiso es cuidar tu propiedad como si fuera nuestra y mantener relaciones
              basadas en respeto y confianza.
            </p>
          </div>
          <svg
            className="absolute bottom-0 left-0 h-12 w-full text-background"
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
          >
            <path d="M0,40 C360,100 1080,0 1440,40 L1440,80 L0,80 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl shadow-elegant">
            <img src={prop3} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-2xl font-bold text-neutral-900">Misión</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Ofrecer un servicio de administración profesional que proteja la inversión de los
                propietarios y brinde a los inquilinos un hogar confortable y bien gestionado.
              </p>
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-neutral-900">Visión</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Ser la administradora de propiedades de referencia en Costa Rica, reconocida por
                nuestra cercanía, transparencia y uso inteligente de la tecnología.
              </p>
            </div>
            <Button asChild className="rounded-full bg-[#dc2626] px-6 text-white hover:bg-[#b91c1c]">
              <Link to="/units">Más información sobre nuestras propiedades</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
            Preguntas Frecuentes
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            ¿Tienes dudas? Aquí podrías encontrar algunas respuestas
          </p>

          <Accordion type="single" collapsible className="mt-10 text-left">
            <AccordionItem value="q1">
              <AccordionTrigger>¿Cómo reporto el pago de mi alquiler?</AccordionTrigger>
              <AccordionContent>
                Desde tu panel de inquilino puedes reportar el pago en la sección de Pagos,
                adjuntando el comprobante. Recibirás confirmación una vez sea verificado.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>¿Cómo solicito una reparación?</AccordionTrigger>
              <AccordionContent>
                Usa la sección de Mensajes en tu panel para enviarnos los detalles de la
                reparación. Coordinaremos la visita técnica lo antes posible.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>¿Qué incluye la administración de condominios?</AccordionTrigger>
              <AccordionContent>
                Incluye gestión de cobros, mantenimiento de áreas comunes, atención a residentes,
                reservas de amenidades y reportes financieros periódicos.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>¿Cómo puedo alquilar una propiedad?</AccordionTrigger>
              <AccordionContent>
                Explora nuestras propiedades disponibles, crea tu cuenta de inquilino y envía una
                solicitud desde la unidad de tu interés. Te contactaremos para coordinar la visita.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
}
