import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppStore, getUnitAddress } from "@/lib/store";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Check, X, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Payment } from "@/lib/types";

export const Route = createFileRoute("/owner/payments")({
  component: Page,
});

const monthName = (m: string) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("es", {
    month: "long",
    year: "numeric",
  });
};

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const payments = useAppStore((s) => s.payments);
  const contracts = useAppStore((s) => s.contracts);
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);
  const users = useAppStore((s) => s.users);
  const approve = useAppStore((s) => s.approvePayment);
  const reject = useAppStore((s) => s.rejectPayment);

  const [viewing, setViewing] = useState<Payment | null>(null);
  const [reviewing, setReviewing] = useState<{ payment: Payment; mode: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");

  const ownerContractIds = useMemo(
    () => new Set(contracts.filter((c) => c.ownerId === user?.id).map((c) => c.id)),
    [contracts, user?.id],
  );

  const ownerPayments = useMemo(
    () => payments.filter((p) => ownerContractIds.has(p.contractId)),
    [payments, ownerContractIds],
  );

  const rowsByUnit = useMemo(() => {
    const ownerContracts = contracts.filter((c) => c.ownerId === user?.id);
    return ownerContracts.map((c) => {
      const unit = units.find((u) => u.id === c.unitId);
      const building = buildings.find((b) => b.id === unit?.buildingId);
      const tenant = users.find((u) => u.id === c.tenantId);
      const unitPayments = ownerPayments
        .filter((p) => p.contractId === c.id)
        .sort((a, b) => b.month.localeCompare(a.month));
      const latest = unitPayments[0];
      return { contract: c, unit, building, tenant, latest, unitPayments };
    });
  }, [contracts, units, buildings, users, user?.id, ownerPayments]);

  const pending = ownerPayments.filter((p) => p.status === "validating");

  const openReview = (payment: Payment, mode: "approve" | "reject") => {
    setReviewing({ payment, mode });
    setNote("");
  };

  const submitReview = () => {
    if (!reviewing) return;
    if (reviewing.mode === "approve") {
      approve(reviewing.payment.id, note || undefined);
      toast.success("Pago aprobado");
    } else {
      if (!note.trim()) {
        toast.error("Indica el motivo del rechazo");
        return;
      }
      reject(reviewing.payment.id, note);
      toast.success("Pago rechazado");
    }
    setReviewing(null);
    setNote("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Pagos de tus unidades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verifica los comprobantes que envían los inquilinos. La plataforma no procesa pagos.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="font-display font-semibold text-primary">
            {pending.length} comprobante(s) en verificación
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Revisa los comprobantes pendientes en la tabla.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidad</TableHead>
              <TableHead>Inquilino</TableHead>
              <TableHead>Último mes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último pago</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowsByUnit.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Aún no hay contratos activos.
                </TableCell>
              </TableRow>
            )}
            {rowsByUnit.map(({ contract, unit, building, tenant, latest }) => (
              <TableRow key={contract.id}>
                <TableCell>
                  <div className="font-medium">{unit?.title ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {unit ? getUnitAddress(unit, building) : ""}
                    {unit?.number ? ` · #${unit.number}` : ""}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{tenant?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{tenant?.email}</div>
                </TableCell>
                <TableCell className="capitalize">
                  {latest ? monthName(latest.month) : "—"}
                </TableCell>
                <TableCell>{latest ? <StatusBadge status={latest.status} /> : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {latest?.paidAt ?? latest?.receiptUploadedAt ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {latest?.receiptDataUrl && (
                      <Button variant="outline" size="sm" onClick={() => setViewing(latest)}>
                        <Eye className="h-4 w-4" /> Ver
                      </Button>
                    )}
                    {latest?.status === "validating" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => openReview(latest, "approve")}
                        >
                          <Check className="h-4 w-4" /> Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openReview(latest, "reject")}
                        >
                          <X className="h-4 w-4" /> Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprobante de pago</DialogTitle>
            <DialogDescription>
              {viewing && `${monthName(viewing.month)} · €${viewing.amount + viewing.utilities}`}
            </DialogDescription>
          </DialogHeader>
          {viewing?.receiptDataUrl ? (
            viewing.receiptType === "application/pdf" ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-6">
                <FileText className="h-12 w-12 text-primary" />
                <div className="text-sm">{viewing.receiptName}</div>
                <a
                  href={viewing.receiptDataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline"
                >
                  Abrir PDF
                </a>
              </div>
            ) : (
              <img
                src={viewing.receiptDataUrl}
                alt="Comprobante"
                className="max-h-[60vh] w-full rounded-lg object-contain"
              />
            )
          ) : (
            <p className="text-sm text-muted-foreground">Sin comprobante.</p>
          )}
          {viewing?.status === "validating" && (
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  const p = viewing;
                  setViewing(null);
                  openReview(p, "reject");
                }}
              >
                Rechazar
              </Button>
              <Button
                className="bg-success text-success-foreground hover:bg-success/90"
                onClick={() => {
                  const p = viewing;
                  setViewing(null);
                  openReview(p, "approve");
                }}
              >
                Aprobar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewing?.mode === "approve" ? "Aprobar pago" : "Rechazar pago"}
            </DialogTitle>
            <DialogDescription>
              {reviewing?.mode === "approve"
                ? "Confirma el pago. Puedes dejar una nota opcional para el inquilino."
                : "Indica el motivo del rechazo. El inquilino podrá volver a subir el comprobante."}
            </DialogDescription>
          </DialogHeader>
          {reviewing?.mode === "reject" && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <span>El comprobante quedará marcado como rechazado.</span>
            </div>
          )}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              reviewing?.mode === "approve"
                ? "Mensaje opcional para el inquilino…"
                : "Ej: el comprobante no es legible o el monto no coincide…"
            }
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={submitReview}
              variant={reviewing?.mode === "reject" ? "destructive" : "default"}
              className={
                reviewing?.mode === "approve" ? "bg-success text-success-foreground hover:bg-success/90" : ""
              }
            >
              {reviewing?.mode === "approve" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: Payment["status"] }) {
  const m = {
    pending: { label: "Pendiente", cls: "border-warning/30 text-warning-foreground bg-warning/10" },
    paid: { label: "Pagado", cls: "border-success/30 text-success bg-success/10" },
    overdue: { label: "Atrasado", cls: "border-destructive/30 text-destructive bg-destructive/10" },
    validating: { label: "En verificación", cls: "border-primary/30 text-primary bg-primary/10" },
    rejected: { label: "Rechazado", cls: "border-destructive/30 text-destructive bg-destructive/10" },
  } as const;
  return (
    <Badge variant="outline" className={m[status].cls}>
      {m[status].label}
    </Badge>
  );
}

