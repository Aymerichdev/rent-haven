import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Droplet,
  Zap,
  Flame,
  CreditCard,
  Check,
  Upload,
  FileText,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import type { Payment } from "@/lib/types";

export const Route = createFileRoute("/tenant/payments")({
  component: Page,
});

const monthName = (m: string) => {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString("es", { month: "long", year: "numeric" });
};

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const payments = useAppStore((s) => s.payments);
  const submitReceipt = useAppStore((s) => s.submitPaymentReceipt);
  const tenantPayments = payments.filter((p) => p.tenantId === user?.id );

  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const [viewing, setViewing] = useState<Payment | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    if (!activePayment) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Formato no permitido. Usa JPG, PNG, WEBP o PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("El archivo supera los 5MB.");
      return;
    }
    try {
      await submitReceipt(activePayment.id, file);
      toast.success("Comprobante enviado, en verificación");
      setActivePayment(null);
    } catch {
      toast.error("No se pudo subir el comprobante");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Pagos mensuales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paga por SINPE o transferencia y sube tu comprobante para verificación.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-gradient-warm p-5 text-primary-foreground shadow-elegant">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-background/20 p-3 backdrop-blur">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm opacity-90">Pago externo verificado</div>
            <div className="font-display text-xl font-bold">SINPE · Transferencia · Servicios incluidos</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/20 px-2.5 py-1">
            <Droplet className="h-3 w-3" /> Agua
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background/20 px-2.5 py-1">
            <Zap className="h-3 w-3" /> Luz
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background/20 px-2.5 py-1">
            <Flame className="h-3 w-3" /> Gas
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {tenantPayments
          .slice()
          .sort((a, b) => b.month.localeCompare(a.month))
          .map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display font-semibold capitalize">{monthName(p.month)}</div>
                  <div className="text-xs text-muted-foreground">
                    Renta €{p.amount} + Servicios €{p.utilities}
                  </div>
                  {p.status === "rejected" && p.ownerNote && (
                    <div className="mt-1 flex items-start gap-1 text-xs text-destructive">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>Rechazado: {p.ownerNote}</span>
                    </div>
                  )}
                  {p.status === "paid" && p.ownerNote && (
                    <div className="mt-1 text-xs text-success">Nota: {p.ownerNote}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-display text-lg font-bold">€{p.amount + p.utilities}</div>
                  <StatusBadge status={p.status} />
                </div>
                {p.receiptDataUrl && (
                  <Button variant="outline" size="icon" onClick={() => setViewing(p)} title="Ver comprobante">
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {(p.status === "pending" || p.status === "rejected" || p.status === "overdue") && (
                  <Button className="bg-gradient-warm" onClick={() => setActivePayment(p)}>
                    <Upload className="h-4 w-4" />
                    {p.status === "rejected" ? "Reenviar" : "Subir comprobante"}
                  </Button>
                )}
                {p.status === "paid" && (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>

      <Dialog open={!!activePayment} onOpenChange={(o) => !o && setActivePayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir comprobante de pago</DialogTitle>
            <DialogDescription>
              {activePayment ? `Mes ${monthName(activePayment.month)} · Total €${activePayment.amount + activePayment.utilities}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Realiza el pago por SINPE o transferencia y adjunta una imagen del recibo (JPG, PNG, WEBP) o PDF. Máx 5MB.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <Button className="w-full" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Seleccionar archivo
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivePayment(null)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprobante</DialogTitle>
            <DialogDescription>
              {viewing?.receiptName} · subido el {viewing?.receiptUploadedAt}
            </DialogDescription>
          </DialogHeader>
          {viewing?.receiptDataUrl && <ReceiptPreview payment={viewing} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReceiptPreview({ payment }: { payment: Payment }) {
  if (!payment.receiptDataUrl) return null;
  if (payment.receiptType === "application/pdf") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-6">
        <FileText className="h-12 w-12 text-primary" />
        <div className="text-sm">{payment.receiptName}</div>
        <a
          href={payment.receiptDataUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline"
        >
          Abrir PDF
        </a>
      </div>
    );
  }
  return (
    <img
      src={payment.receiptDataUrl}
      alt={payment.receiptName ?? "Comprobante"}
      className="max-h-[60vh] w-full rounded-lg object-contain"
    />
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
    <Badge variant="outline" className={`mt-1 ${m[status].cls}`}>
      {m[status].label}
    </Badge>
  );
}
