import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, DoorOpen, X, ArrowRight } from "lucide-react";
import type { Building, Amenity } from "@/lib/types";
import { toast } from "sonner";
import { ImageUploader } from "@/components/site/ImageUploader";

type AmenityDraft = { name: string; icon: string; bookable: boolean };

export const Route = createFileRoute("/owner/buildings")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const buildings = useAppStore((s) => s.buildings);
  const units = useAppStore((s) => s.units);
  const amenities = useAppStore((s) => s.amenities);
  const add = useAppStore((s) => s.addBuilding);
  const upd = useAppStore((s) => s.updateBuilding);
  const del = useAppStore((s) => s.deleteBuilding);
  const addAmenity = useAppStore((s) => s.addAmenity);
  const deleteAmenity = useAppStore((s) => s.deleteAmenity);

  const ownerBuildings = useMemo(
    () => buildings.filter((b) => b.ownerId === user?.id),
    [buildings, user?.id],
  );

  const buildEmpty = (): Omit<Building, "id"> => ({
    name: "",
    address: "",
    city: "",
    ownerId: user?.id ?? "",
    amenityIds: [],
    description: "",
    images: [],
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState<Omit<Building, "id">>(buildEmpty);
  const [amenityDrafts, setAmenityDrafts] = useState<AmenityDraft[]>([]);
  const [newAmenity, setNewAmenity] = useState<AmenityDraft>({
    name: "",
    icon: "🏊",
    bookable: true,
  });

  const startNew = () => {
    setEditing(null);
    setForm(buildEmpty());
    setAmenityDrafts([]);
    setOpen(true);
  };

  const startEdit = (b: Building) => {
    setEditing(b);
    setForm({
      name: b.name,
      address: b.address,
      city: b.city,
      ownerId: b.ownerId,
      amenityIds: b.amenityIds,
      description: b.description ?? "",
      images: b.images,
    });
    setAmenityDrafts([]);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.city) return toast.error("Completa nombre y ciudad");
    if (form.images.length === 0) return toast.error("Debes subir al menos una imagen");

    if (editing) {
      await upd(editing.id, form);
      for (const a of amenityDrafts) await addAmenity({ ...a, buildingId: editing.id });
      toast.success("Edificio actualizado");
    } else {
      try {
        const newId = await add(form);
        for (const a of amenityDrafts) await addAmenity({ ...a, buildingId: newId });
        toast.success(
          amenityDrafts.length > 0
            ? `Edificio creado con ${amenityDrafts.length} amenidad(es)`
            : "Edificio creado",
        );
      } catch {
        return;
      }
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Edificios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ownerBuildings.length} en tu portafolio
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startNew} className="bg-gradient-warm">
              <Plus className="mr-2 h-4 w-4" /> Nuevo edificio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar edificio" : "Nuevo edificio"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Nombre</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ciudad</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={form.description ?? ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe el edificio, ubicación, características..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Imágenes *</Label>
                  <ImageUploader
                    multiple
                    folder={`buildings/${editing?.id ?? "new"}`}
                    value={form.images}
                    onChange={(urls) => setForm({ ...form, images: urls })}
                  />
                  {form.images.length === 0 && (
                    <p className="mt-1 text-xs text-destructive">
                      Debes subir al menos una imagen
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm">Amenidades del edificio</Label>
                  {!editing && (
                    <span className="text-[11px] text-muted-foreground">
                      Se crearán al guardar
                    </span>
                  )}
                </div>

                {editing && (
                  <ExistingAmenities
                    buildingId={editing.id}
                    amenities={amenities}
                    onDelete={(id) => {
                      deleteAmenity(id);
                      toast.success("Amenidad eliminada");
                    }}
                  />
                )}

                {amenityDrafts.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {amenityDrafts.map((a, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs"
                      >
                        <span>{a.icon}</span>
                        {a.name}
                        <button
                          type="button"
                          onClick={() =>
                            setAmenityDrafts(amenityDrafts.filter((_, idx) => idx !== i))
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-[1fr_64px_auto_auto] gap-2">
                  <Input
                    placeholder="Nombre (Piscina, Gimnasio...)"
                    value={newAmenity.name}
                    onChange={(e) => setNewAmenity({ ...newAmenity, name: e.target.value })}
                  />
                  <Input
                    placeholder="🏊"
                    value={newAmenity.icon}
                    onChange={(e) => setNewAmenity({ ...newAmenity, icon: e.target.value })}
                    className="text-center"
                  />
                  <div className="flex items-center gap-2 px-2">
                    <Switch
                      checked={newAmenity.bookable}
                      onCheckedChange={(v) => setNewAmenity({ ...newAmenity, bookable: v })}
                    />
                    <span className="text-xs text-muted-foreground">Reservable</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!newAmenity.name.trim()) return;
                      if (editing) {
                        addAmenity({ ...newAmenity, buildingId: editing.id });
                        toast.success("Amenidad añadida");
                      } else {
                        setAmenityDrafts([...amenityDrafts, newAmenity]);
                      }
                      setNewAmenity({ name: "", icon: "🏊", bookable: true });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={save} className="bg-gradient-warm">
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ownerBuildings.map((b) => {
          const bUnits = units.filter((u) => u.buildingId === b.id);
          const available = bUnits.filter((u) => u.status === "available").length;
          const rented = bUnits.filter((u) => u.status === "rented").length;
          const maintenance = bUnits.filter((u) => u.status === "maintenance").length;
          const bAmenities = amenities.filter((a) => a.buildingId === b.id);
          return (
            <div
              key={b.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <Link
                to="/owner/buildings/$buildingId"
                params={{ buildingId: b.id }}
                className="block aspect-[16/9] overflow-hidden bg-secondary"
              >
                <img
                  src={b.images[0]}
                  alt={b.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </Link>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to="/owner/buildings/$buildingId"
                      params={{ buildingId: b.id }}
                      className="font-display text-lg font-bold hover:underline"
                    >
                      {b.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {b.address} · {b.city}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        const r = await del(b.id);
                        if (!r.ok) toast.error(r.reason);
                        else toast.success("Edificio eliminado");
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm">
                  <DoorOpen className="h-4 w-4 text-primary" />
                  <span className="font-medium">{bUnits.length}</span>
                  <span className="text-muted-foreground">unidades</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {bAmenities.length} amenidades
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-success/30 text-success">
                    {available} disponibles
                  </Badge>
                  <Badge variant="outline">{rented} alquiladas</Badge>
                  <Badge variant="outline" className="border-warning/30 text-warning-foreground">
                    {maintenance} mantenimiento
                  </Badge>
                </div>

                <Link
                  to="/owner/buildings/$buildingId"
                  params={{ buildingId: b.id }}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Ver detalle <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExistingAmenities({
  buildingId,
  amenities,
  onDelete,
}: {
  buildingId: string;
  amenities: Amenity[];
  onDelete: (id: string) => void;
}) {
  const list = amenities.filter((a) => a.buildingId === buildingId);
  if (list.length === 0)
    return <p className="mb-3 text-xs text-muted-foreground">Aún no hay amenidades.</p>;
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {list.map((a) => (
        <span
          key={a.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs"
        >
          <span>{a.icon}</span>
          {a.name}
          <button
            type="button"
            onClick={() => onDelete(a.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
