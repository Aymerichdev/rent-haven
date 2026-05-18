import { createFileRoute } from "@tanstack/react-router";
import { useAppStore, getUnitAddress } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/tenant/contracts")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const contracts = useAppStore((s) => s.contracts);
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);
  const tenantContracts = contracts.filter((c) => c.tenantId === user?.id && c.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Mis contratos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Documentos y términos de tu alquiler.</p>
      </div>

      <div className="space-y-3">
        {tenantContracts.map((c) => {
          const u = units.find((x) => x.id === c.unitId);
          const b = buildings.find((x) => x.id === u?.buildingId);
          return (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">{u?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Contrato #{c.id.slice(0, 6).toUpperCase()} · {b?.name} {u?.number}
                    </p>
                    {u && (
                      <p className="mt-1 text-xs text-muted-foreground">{getUnitAddress(u, b)}</p>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
                      <KV k="Renta" v={`€${c.monthlyRent}`} />
                      <KV k="Depósito" v={`€${c.deposit}`} />
                      <KV k="Inicio" v={c.startDate} />
                      <KV k="Fin" v={c.endDate} />
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={c.status === "active" ? "border-success/30 text-success" : ""}
                >
                  {c.status === "active" ? "Activo" : "Finalizado"}
                </Badge>
              </div>
              {c.contractPhotoUrl && (
                <img
                  src={c.contractPhotoUrl}
                  alt="Contrato"
                  className="mt-3 max-h-48 cursor-pointer rounded-lg object-contain"
                  onClick={() => window.open(c.contractPhotoUrl)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}
