import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, Building2, KeyRound, DoorOpen } from "lucide-react";
import type { Unit } from "@/lib/types";
import { toast } from "sonner";
import { ImageUploader } from "@/components/site/ImageUploader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/owner/units")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const buildings = useAppStore((s) => s.buildings);
  const units = useAppStore((s) => s.units);
  const add = useAppStore((s) => s.addUnit);
  const del = useAppStore((s) => s.deleteUnit);
  const upd = useAppStore((s) => s.updateUnit);
  const allUsers = useAppStore((s) => s.users);
  const markRented = useAppStore((s) => s.markUnitRented);
  const markAvailable = useAppStore((s) => s.markUnitAvailable);
  const tenants = useMemo(() => allUsers.filter((u) => u.role === "tenant"), [allUsers]);

  const today = () => new Date().toISOString().slice(0, 10);
  const [rentUnit, setRentUnit] = useState<Unit | null>(null);
  const [rentTenant, setRentTenant] = useState<string>("");
  const [rentStart, setRentStart] = useState<string>("");
  const [rentEnd, setRentEnd] = useState<string>("");
  const [rentMonthly, setRentMonthly] = useState<number>(0);
  const [rentDeposit, setRentDeposit] = useState<number>(0);
  const [rentPhoto, setRentPhoto] = useState<string>("");
  const [releaseUnit, setReleaseUnit] = useState<Unit | null>(null);
  const [paymentPrompt, setPaymentPrompt] = useState<{
    contractId: string;
    tenantId?: string;
    monthlyRent: number;
  } | null>(null);

  const openRent = (u: Unit) => {
    setRentUnit(u);
    setRentTenant("");
    setRentStart(today());
    setRentEnd("");
    setRentMonthly(u.rent);
    setRentDeposit(u.rent * 2);
    setRentPhoto("");
  };

  const confirmRent = async () => {
    if (!rentUnit) return;
    if (!rentStart || !rentEnd) return toast.error("Inicio y fin son obligatorios");
    if (rentEnd <= rentStart) return toast.error("La fecha de fin debe ser posterior al inicio");
    const created = await markRented(rentUnit.id, {
      tenantId: rentTenant || undefined,
      startDate: rentStart,
      endDate: rentEnd,
      monthlyRent: rentMonthly,
      deposit: rentDeposit,
      contractPhotoUrl: rentPhoto || undefined,
    });
    toast.success("Unidad marcada como alquilada");
    setRentUnit(null);
    if (created) {
      setPaymentPrompt({
        contractId: created.id,
        tenantId: created.tenantId,
        monthlyRent: created.monthlyRent,
      });
    }
  };

  const monthLabel = (d: Date) =>
    d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const generateCurrentPayment = async () => {
    if (!paymentPrompt) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const { error } = await supabase.from("payments").insert({
      contract_id: paymentPrompt.contractId,
      tenant_id: paymentPrompt.tenantId ?? null,
      month: monthKey,
      amount: paymentPrompt.monthlyRent,
      utilities: 0,
      status: "pending",
    } as any);
    if (error) {
      toast.error("No se pudo generar el pago");
    } else {
      toast.success(`Pago de ${monthLabel(now)} generado correctamente`);
    }
    setPaymentPrompt(null);
  };

  const confirmRelease = () => {
    if (!releaseUnit) return;
    markAvailable(releaseUnit.id);
    toast.success("Unidad disponible");
    setReleaseUnit(null);
  };


  const ownerBuildings = useMemo(
    () => buildings.filter((b) => b.ownerId === user?.id),
    [buildings, user?.id],
  );
  const ownerUnits = useMemo(
    () => units.filter((u) => u.ownerId === user?.id),
    [units, user?.id],
  );

  const [filterBuilding, setFilterBuilding] = useState<string>("all");
  const filteredUnits = useMemo(
    () =>
      filterBuilding === "all"
        ? ownerUnits
        : ownerUnits.filter((u) => u.buildingId === filterBuilding),
    [ownerUnits, filterBuilding],
  );

  const buildEmpty = (): Omit<Unit, "id"> => ({
    buildingId: ownerBuildings[0]?.id,
    ownerId: user?.id ?? "",
    number: "",
    title: "",
    description: "",
    type: "apartment",
    images: [],
    bedrooms: 1,
    bathrooms: 1,
    area: 50,
    rent: 800,
    status: "available",
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState<Omit<Unit, "id">>(buildEmpty);

  const startNew = () => {
    setEditing(null);
    setForm(buildEmpty());
    setOpen(true);
  };
  const startEdit = (u: Unit) => {
    setEditing(u);
    const { id: _id, ...rest } = u;
    void _id;
    setForm(rest);
    setOpen(true);
  };

  const save = async () => {
    if (!form.number.trim()) return toast.error("El número es obligatorio");
    if (!form.title.trim()) return toast.error("El título es obligatorio");
    if (form.images.length === 0) return toast.error("Debes subir al menos una imagen");
    if (!form.buildingId) {
      if (!form.addressOverride?.trim() || !form.cityOverride?.trim())
        return toast.error("Sin edificio: dirección y ciudad son obligatorias");
    }

    if (editing) {
      if (form.buildingId) {
        const dup = ownerUnits.some(
          (x) =>
            x.id !== editing.id &&
            x.buildingId === form.buildingId &&
            x.number.trim() === form.number.trim(),
        );
        if (dup) return toast.error("Ya existe una unidad con ese número en el edificio");
      }
      await upd(editing.id, form);
      toast.success("Unidad actualizada");
    } else {
      const r = await add(form);
      if (!r.ok) return toast.error(r.reason);
      toast.success("Unidad creada");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Unidades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ownerUnits.length} unidades · {filteredUnits.length} mostradas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterBuilding} onValueChange={setFilterBuilding}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los edificios</SelectItem>
              {ownerBuildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-warm" onClick={startNew}>
                <Plus className="mr-2 h-4 w-4" /> Nueva unidad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar unidad" : "Nueva unidad"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Título</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Edificio</Label>
                  <Select
                    value={form.buildingId ?? "__none__"}
                    onValueChange={(v) =>
                      setForm({ ...form, buildingId: v === "__none__" ? undefined : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin edificio (independiente)</SelectItem>
                      {ownerBuildings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Número</Label>
                  <Input
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v: Unit["type"]) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartamento</SelectItem>
                      <SelectItem value="house">Casa</SelectItem>
                      <SelectItem value="studio">Estudio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v: Unit["status"]) => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="rented">Alquilada</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Habitaciones</Label>
                  <Input
                    type="number"
                    value={form.bedrooms}
                    onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Baños</Label>
                  <Input
                    type="number"
                    value={form.bathrooms}
                    onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Área m²</Label>
                  <Input
                    type="number"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Renta €</Label>
                  <Input
                    type="number"
                    value={form.rent}
                    onChange={(e) => setForm({ ...form, rent: Number(e.target.value) })}
                  />
                </div>
                {!form.buildingId && (
                  <>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Como esta unidad es independiente, indica su dirección y ciudad propias:
                      </p>
                    </div>
                    <div>
                      <Label>Dirección *</Label>
                      <Input
                        value={form.addressOverride ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, addressOverride: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Ciudad *</Label>
                      <Input
                        value={form.cityOverride ?? ""}
                        onChange={(e) => setForm({ ...form, cityOverride: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={!!form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    Destacar en página principal
                  </Label>
                </div>
                <div className="sm:col-span-2">
                  <Label>Imágenes *</Label>
                  <ImageUploader
                    multiple
                    folder={`units/${editing?.id ?? "new"}`}
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={save} className="bg-gradient-warm">
                  {editing ? "Guardar" : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Edificio</th>
              <th className="px-4 py-3">Habs</th>
              <th className="px-4 py-3">Renta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredUnits.map((u) => {
              const b = ownerBuildings.find((x) => x.id === u.buildingId);
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.number}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{u.title}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b ? (
                      <Link
                        to="/owner/buildings/$buildingId"
                        params={{ buildingId: b.id }}
                        className="inline-flex items-center gap-1 text-foreground hover:text-primary hover:underline"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        {b.name}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs italic">
                        Independiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.bedrooms}h · {u.bathrooms}b · {u.area}m²
                  </td>
                  <td className="px-4 py-3 font-medium">€{u.rent}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.status}
                      onValueChange={(v: Unit["status"]) => upd(u.id, { status: v })}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="rented">Alquilada</SelectItem>
                        <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(u.status === "available" || u.status === "maintenance") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => openRent(u)}
                        >
                          <KeyRound className="h-3.5 w-3.5" /> Alquilada
                        </Button>
                      )}
                      {u.status === "rented" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => setReleaseUnit(u)}
                        >
                          <DoorOpen className="h-3.5 w-3.5" /> Disponible
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => startEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          del(u.id);
                          toast.success("Eliminada");
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="border-success/30 text-success">
          Disponible
        </Badge>
        <Badge variant="outline">Alquilada</Badge>
        <Badge variant="outline" className="border-warning/30 text-warning-foreground">
          Mantenimiento
        </Badge>
      </div>

      <Dialog open={!!rentUnit} onOpenChange={(o) => !o && setRentUnit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Marcar como alquilada · {rentUnit?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <section className="space-y-2">
              <h3 className="font-display text-sm font-bold">Inquilino (opcional)</h3>
              <Label className="text-xs">Asignar inquilino</Label>
              <Select
                value={rentTenant || "__none__"}
                onValueChange={(v) => setRentTenant(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin inquilino asignado</SelectItem>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-3">
              <h3 className="font-display text-sm font-bold">Contrato</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Inicio del contrato</Label>
                  <Input
                    type="date"
                    value={rentStart}
                    onChange={(e) => setRentStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Fin del contrato</Label>
                  <Input
                    type="date"
                    value={rentEnd}
                    onChange={(e) => setRentEnd(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Renta mensual (₡)</Label>
                  <Input
                    type="number"
                    value={rentMonthly}
                    onChange={(e) => setRentMonthly(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Depósito (₡)</Label>
                  <Input
                    type="number"
                    value={rentDeposit}
                    onChange={(e) => setRentDeposit(Number(e.target.value))}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-display text-sm font-bold">Foto del contrato (opcional)</h3>
              <ImageUploader
                folder={`contracts/${rentUnit?.id ?? "new"}`}
                value={rentPhoto || undefined}
                onChange={(url) => setRentPhoto(url ?? "")}
              />
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRentUnit(null)}>
              Cancelar
            </Button>
            <Button className="bg-gradient-warm" onClick={confirmRent}>
              Confirmar alquiler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!releaseUnit} onOpenChange={(o) => !o && setReleaseUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como disponible</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro? Esto cerrará el contrato activo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRelease}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
