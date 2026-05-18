import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImageUploader } from "@/components/site/ImageUploader";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import type { Amenity, AmenitySchedule, WeekDay } from "@/lib/types";
import { WEEK_DAYS, scheduleSummary } from "@/lib/amenity-utils";

export const Route = createFileRoute("/owner/amenities")({
  component: Page,
});

const DEFAULT_SCHEDULE: AmenitySchedule = {
  days: ["mon", "tue", "wed", "thu", "fri"],
  openTime: "08:00",
  closeTime: "20:00",
  slotDurationMinutes: 60,
};

type FormState = {
  name: string;
  icon: string;
  buildingId: string;
  bookable: boolean;
  description: string;
  photoUrl?: string;
  capacity: string;
  schedule: AmenitySchedule;
};

const emptyForm = (buildingId: string): FormState => ({
  name: "",
  icon: "🏊",
  buildingId,
  bookable: true,
  description: "",
  photoUrl: undefined,
  capacity: "",
  schedule: { ...DEFAULT_SCHEDULE },
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const buildings = useAppStore((s) => s.buildings);
  const amenities = useAppStore((s) => s.amenities);
  const add = useAppStore((s) => s.addAmenity);
  const update = useAppStore((s) => s.updateAmenity);
  const del = useAppStore((s) => s.deleteAmenity);

  const ownerBuildings = buildings.filter((b) => b.ownerId === user?.id);
  const ownerAmenities = amenities.filter((a) => ownerBuildings.some((b) => b.id === a.buildingId));

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(ownerBuildings[0]?.id ?? ""));
  

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(ownerBuildings[0]?.id ?? ""));
    setOpen(true);
  };

  const openEdit = (a: Amenity) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      icon: a.icon,
      buildingId: a.buildingId,
      bookable: a.bookable,
      description: a.description ?? "",
      photoUrl: a.photoUrl,
      capacity: a.capacity ? String(a.capacity) : "",
      schedule: a.schedule ?? { ...DEFAULT_SCHEDULE },
    });
    setOpen(true);
  };


  const toggleDay = (d: WeekDay) =>
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        days: f.schedule.days.includes(d)
          ? f.schedule.days.filter((x) => x !== d)
          : [...f.schedule.days, d],
      },
    }));

  const submit = () => {
    if (!form.name.trim() || !form.buildingId) return toast.error("Completa los campos");
    const capacityNum = form.capacity ? Number(form.capacity) : undefined;
    if (form.capacity && (!Number.isFinite(capacityNum) || (capacityNum ?? 0) <= 0))
      return toast.error("Capacidad inválida");
    const payload: Omit<Amenity, "id"> = {
      name: form.name.trim(),
      icon: form.icon || "✨",
      buildingId: form.buildingId,
      bookable: form.bookable,
      description: form.description.trim() || undefined,
      photoUrl: form.photoUrl,
      capacity: capacityNum,
      schedule: form.bookable ? form.schedule : undefined,
    };
    if (editingId) {
      update(editingId, payload);
      toast.success("Amenidad actualizada");
    } else {
      add(payload);
      toast.success("Amenidad agregada");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Amenidades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Servicios disponibles en tus edificios
          </p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-warm">
          <Plus className="mr-2 h-4 w-4" /> Nueva amenidad
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ownerAmenities.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            Aún no tienes amenidades. Crea la primera para que tus inquilinos puedan reservarla.
          </p>
        )}
        {ownerAmenities.map((a) => {
          const b = ownerBuildings.find((x) => x.id === a.buildingId);
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
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <span>{a.icon}</span>
                      <span className="truncate">{a.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{b?.name}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        del(a.id);
                        toast.success("Eliminada");
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {a.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
                )}
                {a.bookable && (
                  <p className="text-xs text-muted-foreground">{scheduleSummary(a.schedule)}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {a.bookable ? (
                    <Badge variant="outline" className="border-success/30 text-success">
                      Reservable
                    </Badge>
                  ) : (
                    <Badge variant="outline">No reservable</Badge>
                  )}
                  {a.capacity && (
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" /> {a.capacity}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span hidden />
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar amenidad" : "Nueva amenidad"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="w-20">
                <Label>Icono</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Edificio</Label>
              <Select
                value={form.buildingId}
                onValueChange={(v) => setForm({ ...form, buildingId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un edificio" />
                </SelectTrigger>
                <SelectContent>
                  {ownerBuildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descripción de la amenidad…"
                maxLength={400}
              />
            </div>

            <div>
              <Label>Foto (opcional)</Label>
              <ImageUploader
                folder={`amenities/${editingId ?? "new"}`}
                value={form.photoUrl}
                onChange={(url) => setForm({ ...form, photoUrl: url })}
              />
            </div>

            <div>
              <Label>Capacidad (máx personas por turno)</Label>
              <Input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Reservable</div>
                <div className="text-xs text-muted-foreground">
                  Permite a inquilinos reservar turnos
                </div>
              </div>
              <Switch
                checked={form.bookable}
                onCheckedChange={(v) => setForm({ ...form, bookable: v })}
              />
            </div>

            {form.bookable && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="text-sm font-medium">Horario</div>
                <div className="flex flex-wrap gap-3">
                  {WEEK_DAYS.map((d) => (
                    <label key={d.key} className="flex items-center gap-1.5 text-sm">
                      <Checkbox
                        checked={form.schedule.days.includes(d.key)}
                        onCheckedChange={() => toggleDay(d.key)}
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Apertura</Label>
                    <Input
                      type="time"
                      value={form.schedule.openTime}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          schedule: { ...form.schedule, openTime: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Cierre</Label>
                    <Input
                      type="time"
                      value={form.schedule.closeTime}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          schedule: { ...form.schedule, closeTime: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Duración del turno</Label>
                  <Select
                    value={String(form.schedule.slotDurationMinutes)}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        schedule: { ...form.schedule, slotDurationMinutes: Number(v) },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-gradient-warm" onClick={submit}>
              {editingId ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
