import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { Amenity } from "@/lib/types";
import { buildSlots, dateToWeekDay, isSlotTaken, scheduleSummary } from "@/lib/amenity-utils";

export const Route = createFileRoute("/tenant/amenities")({
  component: Page,
});

const today = () => new Date().toISOString().slice(0, 10);

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const contracts = useAppStore((s) => s.contracts);
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);
  const amenities = useAppStore((s) => s.amenities);
  const myBookings = useAppStore((s) => s.bookings);
  const create = useAppStore((s) => s.createBooking);

  const tenantContracts = contracts.filter((c) => c.tenantId === user?.id && c.status === "active" );
  const tenantBookings = myBookings.filter((b) => b.tenantId === user?.id);

  const myBuildingIds = tenantContracts
    .map((c) => units.find((u) => u.id === c.unitId)?.buildingId)
    .filter((id): id is string => Boolean(id));
  const available = amenities.filter((a) => myBuildingIds.includes(a.buildingId) && a.bookable);

  const [selected, setSelected] = useState<Amenity | null>(null);
  const [date, setDate] = useState(today());
  const [startTime, setStartTime] = useState("");
  const [fallbackTime, setFallbackTime] = useState("18:00");
  const [notes, setNotes] = useState("");

  const slots = useMemo(
    () => (selected?.schedule ? buildSlots(selected.schedule) : []),
    [selected],
  );
  const dayMatchesSchedule = useMemo(() => {
    if (!selected?.schedule) return true;
    return selected.schedule.days.includes(dateToWeekDay(date));
  }, [selected, date]);

  const openBooking = (a: Amenity) => {
    setSelected(a);
    setDate(today());
    setStartTime("");
    setFallbackTime("18:00");
    setNotes("");
  };

  const submit = () => {
    if (!selected || !user) return;
    const building = buildings.find((b) => b.id === selected.buildingId);
    if (!building) return;

    let s = startTime;
    let e = "";
    if (selected.schedule) {
      if (!dayMatchesSchedule) return toast.error("Ese día no hay disponibilidad");
      if (!s) return toast.error("Selecciona un turno");
      const slot = slots.find((x) => x.startTime === s);
      if (!slot) return toast.error("Turno inválido");
      e = slot.endTime;
    } else {
      s = fallbackTime;
      e = fallbackTime;
    }

    create({
      amenityId: selected.id,
      tenantId: user.id,
      ownerId: building.ownerId,
      date,
      startTime: s,
      endTime: e,
      notes: notes.trim() || undefined,
    });
    toast.success("Reserva enviada");
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Reservar amenidades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Disfruta de los servicios incluidos en tu edificio.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {available.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground sm:col-span-3">
            No hay amenidades disponibles en tus edificios.
          </div>
        )}
        {available.map((a) => {
          const b = buildings.find((x) => x.id === a.buildingId);
          return (
            <div
              key={a.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              {a.photoUrl ? (
                <img src={a.photoUrl} alt={a.name} className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-secondary text-5xl">
                  {a.icon}
                </div>
              )}
              <div className="space-y-2 p-5">
                <h3 className="font-display text-lg font-bold">{a.name}</h3>
                <p className="text-xs text-muted-foreground">{b?.name}</p>
                {a.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
                )}
                <p className="text-xs text-muted-foreground">{scheduleSummary(a.schedule)}</p>
                {a.capacity && (
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" /> Cap. {a.capacity}
                  </Badge>
                )}
                <Button className="mt-2 w-full bg-gradient-warm" onClick={() => openBooking(a)}>
                  Reservar
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold">Mis reservas</h2>
        {tenantBookings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Aún no has reservado nada.
          </p>
        ) : (
          <div className="space-y-2">
            {tenantBookings.map((b) => {
              const a = amenities.find((x) => x.id === b.amenityId);
              const range =
                b.startTime && b.endTime && b.startTime !== b.endTime
                  ? `${b.startTime}–${b.endTime}`
                  : (b.startTime ?? b.time ?? "");
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{a?.icon}</span>
                    <div>
                      <div className="font-medium">{a?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.date} · {range}
                      </div>
                      {b.ownerNote && (
                        <p className="mt-1 inline-flex items-start gap-1 rounded-md border border-primary/20 bg-primary/5 p-1.5 text-xs">
                          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          <span>{b.ownerNote}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      b.status === "approved"
                        ? "border-success/30 text-success"
                        : b.status === "rejected"
                          ? "border-destructive/30 text-destructive"
                          : "border-warning/30 text-warning-foreground"
                    }
                  >
                    {b.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selected?.icon} Reservar {selected?.name}
            </DialogTitle>
            {selected?.description && (
              <DialogDescription>{selected.description}</DialogDescription>
            )}
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.photoUrl && (
                <img
                  src={selected.photoUrl}
                  alt={selected.name}
                  className="h-40 w-full rounded-lg object-cover"
                />
              )}
              {selected.capacity && (
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" /> Capacidad {selected.capacity}
                </Badge>
              )}
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  min={today()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setStartTime("");
                  }}
                />
                {selected.schedule && !dayMatchesSchedule && (
                  <p className="mt-1 text-xs text-destructive">
                    Ese día no hay disponibilidad. {scheduleSummary(selected.schedule)}
                  </p>
                )}
              </div>

              {selected.schedule ? (
                <div>
                  <Label>Turno disponible</Label>
                  {!dayMatchesSchedule ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Elige otra fecha para ver los turnos.
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">No hay turnos configurados.</p>
                  ) : (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {slots.map((s) => {
                        const taken = isSlotTaken(myBookings, selected.id, date, s.startTime);
                        const active = startTime === s.startTime;
                        return (
                          <button
                            key={s.startTime}
                            type="button"
                            disabled={taken}
                            onClick={() => setStartTime(s.startTime)}
                            className={`rounded-md border px-2 py-1.5 text-xs transition ${
                              taken
                                ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through"
                                : active
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-card hover:border-primary"
                            }`}
                          >
                            {s.startTime}–{s.endTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={fallbackTime}
                    onChange={(e) => setFallbackTime(e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Algo que el propietario deba saber…"
                  maxLength={300}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button className="bg-gradient-warm" onClick={submit}>
              Reservar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
