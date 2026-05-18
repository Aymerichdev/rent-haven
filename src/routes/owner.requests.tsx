import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Home, Sparkles, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { RentalRequest } from "@/lib/types";

export const Route = createFileRoute("/owner/requests")({
  component: Page,
});

type Pending = { req: RentalRequest; action: "approved" | "rejected" } | null;
type PendingBooking = { id: string; action: "approved" | "rejected" } | null;

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const requests = useAppStore((s) => s.requests);
  const bookings = useAppStore((s) => s.bookings);
  const units = useAppStore((s) => s.units);
  const amenities = useAppStore((s) => s.amenities);
  const users = useAppStore((s) => s.users);
  const setReq = useAppStore((s) => s.setRequestStatus);
  const setBook = useAppStore((s) => s.setBookingStatus);

  const ownerRequests = requests.filter((r) => r.ownerId === user?.id);
  const ownerBookings = bookings.filter((b) => b.ownerId === user?.id);

  const [pending, setPending] = useState<Pending>(null);
  const [response, setResponse] = useState("");
  const [pendingBooking, setPendingBooking] = useState<PendingBooking>(null);
  const [bookingResponse, setBookingResponse] = useState("");

  const confirm = () => {
    if (!pending) return;
    setReq(pending.req.id, pending.action, response.trim() || undefined);
    toast.success(pending.action === "approved" ? "Solicitud aprobada" : "Solicitud rechazada");
    setPending(null);
    setResponse("");
  };

  const confirmBooking = () => {
    if (!pendingBooking) return;
    setBook(pendingBooking.id, pendingBooking.action, bookingResponse.trim() || undefined);
    toast.success(pendingBooking.action === "approved" ? "Reserva aprobada" : "Reserva rechazada");
    setPendingBooking(null);
    setBookingResponse("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Solicitudes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aprueba o rechaza solicitudes de alquiler y reservas de amenidades.
        </p>
      </div>

      <section>
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-bold">
          <Home className="h-5 w-5 text-primary" /> Alquileres ({ownerRequests.length})
        </h2>
        {ownerRequests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Sin solicitudes.
          </p>
        ) : (
          <div className="space-y-3">
            {ownerRequests.map((r) => {
              const u = units.find((x) => x.id === r.unitId);
              const tenant = users.find((x) => x.id === r.tenantId);
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex flex-1 items-start gap-4">
                    {u && (
                      <img
                        src={u.images[0]}
                        alt=""
                        className="h-20 w-24 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        {r.profilePhotoUrl || (r.photos && r.photos[0]) ? (
                          <img
                            src={r.profilePhotoUrl || r.photos?.[0]}
                            alt=""
                            className="h-14 w-14 rounded-full object-cover ring-2 ring-border"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <div className="font-medium">{u?.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {tenant?.name} · {r.createdAt}
                          </div>
                        </div>
                      </div>
                      {r.photos && r.photos.length > 1 && (
                        <div className="mt-2 flex gap-1 overflow-x-auto">
                          {r.photos.slice(0, 6).map((p, i) => (
                            <img
                              key={i}
                              src={p}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-md object-cover"
                            />
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${r.phone}`} className="font-medium text-foreground hover:text-primary">
                            {r.phone}
                          </a>
                        </span>
                        {r.creditAuth && (
                          <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                            ✓ Autoriza estudio crediticio
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 rounded-md bg-secondary/50 p-2 text-sm">
                        {r.message}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {r.nationalId ? <p><span className="font-medium text-foreground">Cédula:</span> {r.nationalId}</p> : null}
                        {r.occupation ? <p><span className="font-medium text-foreground">Ocupación:</span> {r.occupation}</p> : null}
                        {r.employer ? <p><span className="font-medium text-foreground">Empresa:</span> {r.employer}</p> : null}
                        {r.workCertificateUrl ? (
                          <p>
                            <span className="font-medium text-foreground">Certificado laboral:</span>{" "}
                            <a href={r.workCertificateUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                              Ver documento
                            </a>
                          </p>
                        ) : null}
                        {r.bio ? <p><span className="font-medium text-foreground">Bio:</span> {r.bio}</p> : null}
                        {r.recommendations ? <p><span className="font-medium text-foreground">Recomendaciones:</span> {r.recommendations}</p> : null}
                      </div>
                      {r.ownerResponse && (
                        <p className="mt-2 inline-flex items-start gap-1 rounded-md border border-primary/20 bg-primary/5 p-2 text-xs text-foreground">
                          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          <span>
                            <span className="font-semibold">Tu respuesta:</span> {r.ownerResponse}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                    <StatusBadge status={r.status} />
                    {r.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => {
                            setResponse("");
                            setPending({ req: r, action: "approved" });
                          }}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setResponse("");
                            setPending({ req: r, action: "rejected" });
                          }}
                        >
                          <X className="mr-1 h-3.5 w-3.5" /> Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-bold">
          <Sparkles className="h-5 w-5 text-primary" /> Reservas de amenidades ({ownerBookings.length})
        </h2>
        {ownerBookings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Sin reservas.
          </p>
        ) : (
          <div className="space-y-3">
            {ownerBookings.map((b) => {
              const a = amenities.find((x) => x.id === b.amenityId);
              const t = users.find((x) => x.id === b.tenantId);
              const range =
                b.startTime && b.endTime && b.startTime !== b.endTime
                  ? `${b.startTime}–${b.endTime}`
                  : (b.startTime ?? b.time ?? "");
              return (
                <div
                  key={b.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex flex-1 items-start gap-3">
                    {a?.photoUrl ? (
                      <img
                        src={a.photoUrl}
                        alt=""
                        className="h-16 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-secondary text-2xl">
                        {a?.icon}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {a?.icon} {a?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t?.name} · {b.date} · {range}
                      </div>
                      {b.notes && (
                        <p className="mt-1 rounded-md bg-secondary/50 p-2 text-xs">{b.notes}</p>
                      )}
                      {b.ownerNote && (
                        <p className="mt-1 inline-flex items-start gap-1 rounded-md border border-primary/20 bg-primary/5 p-1.5 text-xs">
                          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          <span>
                            <span className="font-semibold">Tu nota:</span> {b.ownerNote}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                    <StatusBadge status={b.status} />
                    {b.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => {
                            setBookingResponse("");
                            setPendingBooking({ id: b.id, action: "approved" });
                          }}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setBookingResponse("");
                            setPendingBooking({ id: b.id, action: "rejected" });
                          }}
                        >
                          <X className="mr-1 h-3.5 w-3.5" /> Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending?.action === "approved" ? "Aprobar solicitud" : "Rechazar solicitud"}
            </DialogTitle>
            <DialogDescription>
              Envía un mensaje al inquilino. Recuerda que tú eres quien toma la iniciativa de
              contactarlo después.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="response" className="text-xs">
                Mensaje de respuesta {pending?.action === "approved" ? "(opcional)" : "(opcional)"}
              </Label>
              <Textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder={
                  pending?.action === "approved"
                    ? "¡Genial! Te contacto al teléfono indicado para coordinar visita y contrato."
                    : "Gracias por tu interés. Lamentablemente la unidad ya no está disponible."
                }
                maxLength={500}
                className="mt-1 min-h-28"
              />
            </div>
            {pending?.req.phone && (
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> Teléfono del inquilino:{" "}
                <a href={`tel:${pending.req.phone}`} className="font-medium text-primary hover:underline">
                  {pending.req.phone}
                </a>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirm}
              className={
                pending?.action === "approved"
                  ? "bg-success text-success-foreground hover:bg-success/90"
                  : ""
              }
              variant={pending?.action === "rejected" ? "destructive" : "default"}
            >
              {pending?.action === "approved" ? "Aprobar y enviar" : "Rechazar y enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingBooking} onOpenChange={(o) => !o && setPendingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingBooking?.action === "approved" ? "Aprobar reserva" : "Rechazar reserva"}
            </DialogTitle>
            <DialogDescription>
              Puedes incluir una nota para el inquilino (opcional).
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="bnote" className="text-xs">
              Nota
            </Label>
            <Textarea
              id="bnote"
              value={bookingResponse}
              onChange={(e) => setBookingResponse(e.target.value)}
              placeholder={
                pendingBooking?.action === "approved"
                  ? "Confirmada. Recuerda llegar 5 min antes."
                  : "Lo sentimos, ese horario no está disponible."
              }
              maxLength={400}
              className="mt-1 min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingBooking(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmBooking}
              className={
                pendingBooking?.action === "approved"
                  ? "bg-success text-success-foreground hover:bg-success/90"
                  : ""
              }
              variant={pendingBooking?.action === "rejected" ? "destructive" : "default"}
            >
              {pendingBooking?.action === "approved" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { label: "Pendiente", cls: "border-warning/30 text-warning-foreground bg-warning/10" },
    approved: { label: "Aprobada", cls: "border-success/30 text-success bg-success/10" },
    rejected: { label: "Rechazada", cls: "border-destructive/30 text-destructive bg-destructive/10" },
  } as const;
  const m = map[status];
  return (
    <Badge variant="outline" className={m.cls}>
      {m.label}
    </Badge>
  );
}
