import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar contraseña — BR Internacional" }] }),
  component: Page,
});

function Page() {
  const reset = useAppStore((s) => s.resetPassword);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await reset(email);
    if (ok) {
      setSent(true);
      toast.success("Te enviamos un enlace de recuperación");
    } else {
      toast.error("No se pudo enviar el enlace");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <h2 className="font-display text-2xl font-bold">Recuperar contraseña</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Te enviaremos un enlace para restablecerla.
        </p>
        {sent ? (
          <div className="mt-6 rounded-xl bg-success/10 p-4 text-sm text-success-foreground">
            ✅ Email enviado a <strong>{email}</strong>. Revisa tu bandeja.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-warm">
              Enviar enlace
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Volver a entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
