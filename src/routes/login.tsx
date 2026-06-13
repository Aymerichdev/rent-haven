import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — EstateHub" }] }),
  component: Page,
});

function Page() {
  const login = useAppStore((s) => s.login);
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = await login(email, password);
    if (!u) {
      toast.error("Credenciales inválidas");
      return;
    }
    toast.success(`Bienvenido, ${u.name}`);
    nav({ to: u.role === "admin" ? "/admin" : u.role === "owner" ? "/owner" : "/tenant" });
  };

  const quick = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-gradient-warm lg:block">
        <div className="flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/20 backdrop-blur">
              <Home className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">EstateHub</span>
          </Link>
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight">
              Bienvenido de vuelta a tu hogar digital.
            </h1>
            <p className="mt-3 max-w-md text-primary-foreground/80">
              Gestiona tus alquileres, pagos y reservas desde un solo lugar.
            </p>
          </div>
          <p className="text-xs text-primary-foreground/70">© 2025 EstateHub</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground">
              <Home className="h-4 w-4" />
            </div>
            <span className="font-display font-bold">EstateHub</span>
          </Link>

          <h2 className="font-display text-2xl font-bold">Entrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Regístrate
            </Link>
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd">Contraseña</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  ¿Olvidaste?
                </Link>
              </div>
              <Input
                id="pwd"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-warm">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
