import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { Meter } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/meters")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const buildings = useAppStore((s) => s.buildings);
  const units = useAppStore((s) => s.units);
  const meters = useAppStore((s) => s.meters);

  const ownerBuildings = buildings.filter((b) => b.ownerId === user?.id);
  const ownerUnits = units.filter((u) => u.ownerId === user?.id);
  const ownerMeters = meters.filter((m) => ownerUnits.some((u) => u.id === m.unitId));
  const add = useAppStore((s) => s.addMeter);
  const del = useAppStore((s) => s.deleteMeter);

  const [form, setForm] = useState<Omit<Meter, "id">>({
    unitId: ownerUnits[0]?.id ?? "",
    type: "water",
    reading: 0,
    date: new Date().toISOString().slice(0, 10),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Medidores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lecturas de agua, electricidad y gas por unidad
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-5">
        <div className="sm:col-span-2">
          <Label>Unidad</Label>
          <Select value={form.unitId} onValueChange={(v) => setForm({ ...form, unitId: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ownerUnits.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={(v: Meter["type"]) => setForm({ ...form, type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="water">Agua</SelectItem>
              <SelectItem value="electricity">Electricidad</SelectItem>
              <SelectItem value="gas">Gas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Lectura</Label>
          <Input
            type="number"
            value={form.reading}
            onChange={(e) => setForm({ ...form, reading: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-end">
          <Button
            className="w-full bg-gradient-warm"
            onClick={() => {
              if (!form.unitId) return toast.error("Selecciona una unidad");
              add(form);
              toast.success("Lectura registrada");
            }}
          >
            Registrar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Lectura</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {ownerMeters.map((m) => {
              const u = ownerUnits.find((x) => x.id === m.unitId);
              return (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{u?.number}</td>
                  <td className="px-4 py-3 capitalize">{m.type}</td>
                  <td className="px-4 py-3">{m.reading}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.date}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        del(m.id);
                        toast.success("Eliminado");
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
