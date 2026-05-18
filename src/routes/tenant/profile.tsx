import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader } from "@/components/site/ImageUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore, type TenantProfileRow } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/tenant/profile")({
  component: Page,
});

function Page() {
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TenantProfileRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!currentUser) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("tenant_profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("No se pudo cargar el perfil");
      } else {
        setProfile(data ?? null);
      }
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const save = async () => {
    if (!currentUser) return;
    setSaving(true);
    const payload = {
      id: currentUser.id,
      phone: profile?.phone ?? "",
      national_id: profile?.national_id ?? "",
      occupation: profile?.occupation ?? "",
      bio: profile?.bio ?? null,
      recommendations: profile?.recommendations ?? null,
      profile_photo_url: profile?.profile_photo_url ?? "",
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("tenant_profiles").upsert(payload);
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar el perfil");
      return;
    }
    setProfile(payload);
    toast.success("Perfil guardado");
  };

  const deleteAccount = async () => {
    setConfirmOpen(false);
    await useAppStore.getState().logout();
    const rpc = await supabase.rpc("delete_own_account");
    if (rpc.error) {
      toast.error("Contacta al administrador para eliminar tu cuenta.");
      return;
    }
    toast.success("Cuenta eliminada");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Mi perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">Administra tu información personal.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Cargando perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Administra tu información personal.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Teléfono" value={profile?.phone ?? ""} onChange={(value) => setProfile((s) => ({ ...(s ?? { id: currentUser?.id ?? "", phone: "", national_id: "", occupation: "", profile_photo_url: "" }), phone: value }))} />
            <Field label="Documento nacional" value={profile?.national_id ?? ""} onChange={(value) => setProfile((s) => ({ ...(s ?? { id: currentUser?.id ?? "", phone: "", national_id: "", occupation: "", profile_photo_url: "" }), national_id: value }))} />
            <Field label="Ocupación" value={profile?.occupation ?? ""} onChange={(value) => setProfile((s) => ({ ...(s ?? { id: currentUser?.id ?? "", phone: "", national_id: "", occupation: "", profile_photo_url: "" }), occupation: value }))} />
          </div>
          <ImageUploader
            folder={"profiles/" + currentUser?.id}
            label="Foto de perfil"
            value={profile?.profile_photo_url ?? ""}
            onChange={(url) => setProfile((s) => ({ ...s!, profile_photo_url: url ?? "" }))}
          />
          {profile?.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt="Vista previa de foto de perfil"
              className="h-40 w-40 rounded-xl object-cover"
            />
          ) : null}
          <div>
            <Label>Biografía</Label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={profile?.bio ?? ""}
              onChange={(e) => setProfile((s) => ({ ...(s ?? { id: currentUser?.id ?? "", phone: "", national_id: "", occupation: "", profile_photo_url: "" }), bio: e.target.value }))}
            />
          </div>
          <div>
            <Label>Recomendaciones</Label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={profile?.recommendations ?? ""}
              onChange={(e) => setProfile((s) => ({ ...(s ?? { id: currentUser?.id ?? "", phone: "", national_id: "", occupation: "", profile_photo_url: "" }), recommendations: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={save} disabled={saving} className="bg-gradient-warm">
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Eliminar cuenta</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Estás seguro?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={deleteAccount}>
                    Eliminar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
