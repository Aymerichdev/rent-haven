import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { PublicNavbar, Footer } from "@/components/site/PublicNavbar";
import { UnitCard } from "@/components/site/UnitCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export const Route = createFileRoute("/units/")({
  head: () => ({
    meta: [
      { title: "Explorar unidades — EstateHub" },
      { name: "description", content: "Encuentra apartamentos, casas y estudios en alquiler." },
      { property: "og:title", content: "Explorar unidades — EstateHub" },
      { property: "og:description", content: "Encuentra tu próximo hogar." },
    ],
  }),
  component: Page,
});

function Page() {
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const list = useMemo(() => {
    return units.filter((u) => {
      if (u.status !== "available") return false;
      if (type !== "all" && u.type !== type) return false;
      if (maxPrice && u.rent > Number(maxPrice)) return false;
      if (q) {
        const s = q.toLowerCase();
        const b = buildings.find((x) => x.id === u.buildingId);
        const city = b?.city.toLowerCase() ?? "";
        if (!u.title.toLowerCase().includes(s) && !city.includes(s)) return false;
      }
      return true;
    });
  }, [units, buildings, q, type, maxPrice]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold">Explora unidades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} resultado{list.length === 1 ? "" : "s"}
        </p>

        <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por ciudad o título..."
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="apartment">Apartamento</SelectItem>
              <SelectItem value="house">Casa</SelectItem>
              <SelectItem value="studio">Estudio</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Precio máx €"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        {list.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No encontramos unidades con esos filtros.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setQ("");
                setType("all");
                setMaxPrice("");
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((u) => (
              <UnitCard key={u.id} unit={u} building={buildings.find((b) => b.id === u.buildingId)} />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
