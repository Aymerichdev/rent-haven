import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/change-password")({
  head: () => ({ meta: [{ title: "Cambiar contraseña — BR Internacional" }] }),
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const change = useAppStore((s) => s.changePassword);
  const nav = useNavigate();
  const [oldPwd, setOld] = useState("");
  const [newPwd, setNew] = useState("");

  useEffect(() => {
    if (!user) nav({ to: "/login" });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await change(oldPwd, newPwd);
    if (ok) {
      toast.success("Contraseña actualizada");
      setOld("");
      setNew("");
    } else {
      toast.error("No se pudo actualizar la contraseña");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <h2 className="font-display text-2xl font-bold">Cambiar contraseña</h2>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Contraseña actual</Label>
            <Input type="password" value={oldPwd} onChange={(e) => setOld(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              value={newPwd}
              onChange={(e) => setNew(e.target.value)}
              required
              minLength={4}
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-warm">
            Actualizar
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-primary hover:underline">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
