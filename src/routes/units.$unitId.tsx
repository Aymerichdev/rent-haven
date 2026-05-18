import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppStore, getUnitAddress, getUnitCity } from "@/lib/store";
import { PublicNavbar, Footer } from "@/components/site/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bed, Bath, Square, MapPin, Building2, Heart, Share2, Sparkles, FileText, Phone, BriefcaseBusiness } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert } from "@/components/ui/alert";

export const Route = createFileRoute("/units/$unitId")({
  component: Page,
});

function Page() {
  const { unitId } = Route.useParams();
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);
  const allAmenities = useAppStore((s) => s.amenities);
  const user = useAppStore((s) => s.currentUser);
  const createReq = useAppStore((s) => s.createRentalRequest);
  const nav = useNavigate();
  const [msg, setMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [tenantProfileReady, setTenantProfileReady] = useState(false);


  useEffect(() => {
    let cancelled = false;

    const loadTenantProfile = async () => {
      if (!user || user.role !== "tenant") {
        if (!cancelled) setTenantProfileReady(false);
        return;
      }

      const { data: tenantProfile } = await supabase
        .from("tenant_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const ready = Boolean(
        tenantProfile &&
          tenantProfile.phone?.trim() &&
          tenantProfile.national_id?.trim() &&
          tenantProfile.occupation?.trim(),
      );
      if (!cancelled) {
        setTenantProfileReady(ready);
        setPhone(tenantProfile?.phone ?? "");
      }
    };

    loadTenantProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const unit = units.find((u) => u.id === unitId);
  const building = buildings.find((b) => b.id === unit?.buildingId);
  const amenities = allAmenities.filter((a) => a.buildingId === building?.id);

  if (!unit) {
    return (
      <div className="min-h-screen">
        <PublicNavbar />
        <div className="mx-auto max-w-3xl p-12 text-center">
          <h2 className="font-display text-2xl font-bold">Unidad no encontrada</h2>
          <Button asChild className="mt-4">
            <Link to="/units">Volver al listado</Link>
          </Button>
        </div>
      </div>
    );
  }

  const submit = () => {
    if (!user) {
      toast.error("Inicia sesión para solicitar el alquiler");
      nav({ to: "/login" });
      return;
    }
    if (user.role !== "tenant") {
      toast.error("Solo inquilinos pueden solicitar alquileres");
      return;
    }
    if (!tenantProfileReady) {
      toast.error("Completa tu perfil antes de enviar solicitudes");
      return;
    }
    createReq({
      unitId: unit.id,
      tenantId: user.id,
      ownerId: unit.ownerId,
      phone: phone.trim(),
      message: msg.trim() || "Estoy interesado/a en esta unidad.",
    });
    setMsg("");
    setPhone("");
    toast.success("Solicitud enviada. El propietario se pondrá en contacto.");
  };

  const city = getUnitCity(unit, building);
  const address = getUnitAddress(unit, building);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">{unit.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {address} · {city}
            </p>
            {building && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Building2 className="h-3.5 w-3.5" />
                Forma parte del edificio <span className="font-semibold">{building.name}</span>
                <Badge variant="outline" className="border-primary/30 text-[10px] uppercase tracking-wider">
                  Rental
                </Badge>
              </div>
            )}
          </div>
          <div className="hidden gap-2 sm:flex">
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
          <img
            src={unit.images[0]}
            alt={unit.title}
            className="h-full w-full object-cover sm:col-span-2 sm:row-span-2"
          />
          {unit.images.slice(1, 5).map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              loading="lazy"
              className="aspect-[4/3] h-full w-full object-cover"
            />
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-6 border-b border-border pb-6">
              <Stat icon={<Bed className="h-4 w-4" />} label="Habitaciones" value={unit.bedrooms} />
              <Stat icon={<Bath className="h-4 w-4" />} label="Baños" value={unit.bathrooms} />
              <Stat icon={<Square className="h-4 w-4" />} label="Área" value={`${unit.area} m²`} />
              {building && (
                <Stat icon={<Building2 className="h-4 w-4" />} label="Edificio" value={building.name} />
              )}
            </div>

            <h2 className="mt-8 font-display text-xl font-bold">Sobre esta unidad</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{unit.description}</p>

            {/* Resumen del edificio (reutilizando el patrón de la vista owner) */}
            {building && (
              <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-bold">Edificio {building.name}</h2>
                  <Badge variant="outline" className="ml-1 border-primary/30 text-[10px] uppercase">
                    Rental
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {building.address} · {building.city}
                </p>

                {building.images.length > 0 && (
                  <div className="mt-4 grid gap-2 overflow-hidden rounded-xl sm:grid-cols-3">
                    {building.images.slice(0, 3).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`${building.name} ${i + 1}`}
                        loading="lazy"
                        className="aspect-[4/3] h-full w-full object-cover"
                      />
                    ))}
                  </div>
                )}

                {building.description && (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {building.description}
                  </p>
                )}

                {amenities.length > 0 && (
                  <>
                    <div className="mt-5 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                        Amenidades del edificio
                      </h3>
                      <Badge variant="outline" className="ml-1">
                        {amenities.length}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {amenities.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
                        >
                          <span className="text-xl">{a.icon}</span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{a.name}</div>
                            {a.bookable && (
                              <div className="text-[10px] uppercase tracking-wider text-primary">
                                Reservable
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold">
                  €{unit.rent.toLocaleString("es-ES")}
                </span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                El propietario se pondrá en contacto contigo tras tu solicitud.
              </p>

              {user?.role === "tenant" && !tenantProfileReady ? (
                <Alert variant="destructive" className="mt-5">
                  <p>Debes completar tu perfil antes de enviar solicitudes de alquiler.</p>
                  <Link to="/tenant/profile" className="mt-2 inline-block font-medium underline">
                    Completar perfil →
                  </Link>
                </Alert>
              ) : (
                <>
                  <div className="mt-5 space-y-3">
                    <div>
                      <Label htmlFor="req-phone" className="text-xs">
                        Teléfono de contacto *
                      </Label>
                      <Input
                        id="req-phone"
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+506 612 345 678"
                        maxLength={30}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="req-msg" className="text-xs">
                        Mensaje
                      </Label>
                      <Textarea
                        id="req-msg"
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        placeholder="Hola, me gustaría más información..."
                        maxLength={500}
                        className="mt-1 min-h-24"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={submit}
                    className="mt-4 w-full bg-gradient-warm"
                    disabled={unit.status !== "available"}
                  >
                    {unit.status === "available" ? "Solicitar alquiler" : "No disponible"}
                  </Button>
                </>
              )}
              {!user && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Inicia sesión
                  </Link>{" "}
                  para enviar tu solicitud
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold">{value}</div>
    </div>
  );
}
