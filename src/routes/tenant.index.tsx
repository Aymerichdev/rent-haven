import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore, getUnitAddress, getUnitCity } from "@/lib/store";
import { Home, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tenant/")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const contracts = useAppStore((s) => s.contracts);
  const payments = useAppStore((s) => s.payments);
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);

  const tenantContracts = contracts.filter((c) => c.tenantId === user?.id && c.status === "active");
  const tenantPayments = payments.filter((p) => p.tenantId === user?.id );
  const pending = tenantPayments.filter((p) => p.status === "pending" || p.status === "overdue");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Bienvenida, {user?.name} 🏡</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu hogar a un clic.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card icon={<Home />} label="Mis alquileres" value={tenantContracts.length} to="/tenant/rentals" />
        <Card icon={<FileText />} label="Contratos activos" value={tenantContracts.filter((c) => c.status === "active").length} to="/tenant/contracts" />
        <Card icon={<CreditCard />} label="Pagos pendientes" value={pending.length} to="/tenant/payments" accent />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {tenantContracts.map((c) => {
          const u = units.find((x) => x.id === c.unitId);
          const b = buildings.find((x) => x.id === u?.buildingId);
          if (!u) return null;
          return (
            <div key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <img src={u.images[0]} alt="" loading="lazy" className="h-40 w-full object-cover" />
              <div className="p-5">
                <h3 className="font-display text-lg font-bold">{u.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {getUnitAddress(u, b)} · {getUnitCity(u, b)}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Renta mensual</span>
                  <span className="font-display text-lg font-bold">€{c.monthlyRent}</span>
                </div>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to="/tenant/payments">Ver pagos</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  to,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  to: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl border p-5 shadow-card transition hover:-translate-y-0.5 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
    </Link>
  );
}
