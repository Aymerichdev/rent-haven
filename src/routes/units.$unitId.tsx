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
  const [tenantProfile, setTenantProfile] = useState<{
    phone?: string;
    national_id?: string;
    occupation?: string;
    bio?: string | null;
    employer?: string | null;
    work_certificate_url?: string | null;
    credit_auth?: boolean | null;
    profile_photo_url?: string | null;
    photos?: string[] | null;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tenantProfileReady = Boolean(
    tenantProfile &&
      tenantProfile.phone?.trim() &&
      tenantProfile.national_id?.trim() &&
      tenantProfile.occupation?.trim() &&
      (tenantProfile.photos?.length ?? 0) > 0,
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user || user.role !== "tenant") {
        if (!cancelled) setTenantProfile(null);
        return;
      }
      const { data } = await supabase
        .from("tenant_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setTenantProfile(data as typeof tenantProfile);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const unit = units.find((u) => u.id === unitId);
  const building = buildings.find((b) => b.id === unit?.buildingId);
  const amenities = allAmenities.filter((a) => a.buildingId === building?.id);

  const incrementUnitClicks = useAppStore((s) => s.incrementUnitClicks);
  useEffect(() => {
    if (unitId) incrementUnitClicks(unitId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

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

  const openConfirm = () => {
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
    setConfirmOpen(true);
  };

  const submit = async () => {
    if (!user || !tenantProfile) return;
    setSubmitting(true);
    try {
      await createReq({
        unitId: unit.id,
        tenantId: user.id,
        ownerId: unit.ownerId,
        phone: tenantProfile.phone ?? "",
        message: msg.trim() || "Estoy interesado/a en esta unidad.",
      });
      setMsg("");
      setConfirmOpen(false);
      toast.success("Solicitud enviada. El propietario se pondrá en contacto.");
    } catch (e) {
      toast.error((e as Error).message ?? "No se pudo enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
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
                  <p>Debes completar tu perfil (con al menos una foto) antes de enviar solicitudes.</p>
                  <Link to="/tenant/profile" className="mt-2 inline-block font-medium underline">
                    Completar perfil →
                  </Link>
                </Alert>
              ) : (
                <Button
                  onClick={openConfirm}
                  className="mt-5 w-full bg-gradient-warm"
                  disabled={unit.status !== "available"}
                >
                  {unit.status === "available" ? "Solicitar alquiler" : "No disponible"}
                </Button>
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirma tu solicitud</DialogTitle>
            <DialogDescription>
              Esta información de tu perfil se enviará al propietario. Para cambiarla, edita tu perfil.
            </DialogDescription>
          </DialogHeader>

          {tenantProfile && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-xl border border-border bg-secondary/30 p-4">
                {(tenantProfile.profile_photo_url || tenantProfile.photos?.[0]) && (
                  <img
                    src={tenantProfile.profile_photo_url || tenantProfile.photos?.[0]}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <div className="font-display text-base font-semibold">{user?.name}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {tenantProfile.phone}
                    </span>
                    <span>Cédula: {tenantProfile.national_id}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {tenantProfile.occupation && (
                      <span className="inline-flex items-center gap-1">
                        <BriefcaseBusiness className="h-3 w-3" /> {tenantProfile.occupation}
                      </span>
                    )}
                    {tenantProfile.employer && <span>· {tenantProfile.employer}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tenantProfile.credit_auth && (
                      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                        ✓ Autoriza estudio crediticio
                      </Badge>
                    )}
                    {tenantProfile.work_certificate_url && (
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" /> Certificado laboral
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {tenantProfile.photos && tenantProfile.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {tenantProfile.photos.slice(0, 8).map((p, i) => (
                    <img key={i} src={p} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
                  ))}
                </div>
              )}

              <div>
                <Label htmlFor="req-msg" className="text-xs">
                  Mensaje al propietario
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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={submitting} className="bg-gradient-warm">
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
