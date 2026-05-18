import { Link } from "@tanstack/react-router";
import type { Unit, Building } from "@/lib/types";
import { Bed, Bath, Square, MapPin } from "lucide-react";
import { getUnitAddress, getUnitCity } from "@/lib/store";

interface Props {
  unit: Unit;
  building?: Building;
}

export function UnitCard({ unit, building }: Props) {
  const city = getUnitCity(unit, building);
  const address = getUnitAddress(unit, building);
  return (
    <Link
      to="/units/$unitId"
      params={{ unitId: unit.id }}
      className="group block overflow-hidden rounded-2xl bg-card transition-all hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <img
          src={unit.images[0]}
          alt={unit.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {unit.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
            Destacado
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-semibold text-background backdrop-blur">
          {unit.type === "apartment" ? "Apto" : unit.type === "house" ? "Casa" : "Estudio"}
        </span>
      </div>
      <div className="px-1 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-display text-base font-semibold">{unit.title}</h3>
          <div className="text-right">
            <div className="text-base font-bold">€{unit.rent.toLocaleString("es-ES")}</div>
            <div className="text-[11px] text-muted-foreground">/mes</div>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {city} · {address}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" /> {unit.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" /> {unit.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Square className="h-3.5 w-3.5" /> {unit.area} m²
          </span>
        </div>
      </div>
    </Link>
  );
}
