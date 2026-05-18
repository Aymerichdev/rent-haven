import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader } from "@/components/site/ImageUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { Pencil, Save, X, Mail, Phone, Building2 } from "lucide-react";

export const Route = createFileRoute("/owner/profile")({ component: Page });

type OwnerState = {
  id: string;
  phone: string;
  company_name: string | null;
  tax_id: string | null;
  bio: string | null;
  profile_photo_url: string | null;
};

const empty = (id: string): OwnerState => ({
  id, phone: "", company_name: null, tax_id: null, bio: null, profile_photo_url: null,
});

function Page() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<OwnerState | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentUser) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("owner_profiles").select("*").eq("id", currentUser.id).maybeSingle();
      if (cancelled) return;
      if (error) toast.error("No se pudo cargar el perfil");
      else if (data) setProfile(data as any);
      else setProfile(empty(currentUser.id));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [currentUser]);

  const save = async () => {
    if (!currentUser || !profile) return;
    setSaving(true);
    const payload: any = {
      id: currentUser.id,
      phone: profile.phone ?? "",
      company_name: profile.company_name || null,
      tax_id: profile.tax_id || null,
      bio: profile.bio || null,
      profile_photo_url: profile.profile_photo_url || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("owner_profiles").upsert(payload);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar el perfil");
    setProfile({ ...profile, ...payload });
    setEditing(false);
    toast.success("Perfil guardado");
  };

  const set = (patch: Partial<OwnerState>) =>
    setProfile((s) => ({ ...(s ?? empty(currentUser?.id ?? "")), ...patch }));

  if (loading) return <Skeleton className="h-96 w-full" />;

  const p = profile ?? empty(currentUser?.id ?? "");
  const initials = currentUser?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "O";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Mi perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">Información de tu cuenta como propietario.</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="bg-gradient-warm">
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}><X className="mr-2 h-4 w-4" /> Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-gradient-warm">
              <Save className="mr-2 h-4 w-4" /> {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-warm" />
        <CardContent className="-mt-12 space-y-3 pb-6">
          <Avatar className="h-24 w-24 border-4 border-background shadow-card">
            <AvatarImage src={p.profile_photo_url ?? undefined} />
            <AvatarFallback className="bg-gradient-warm text-2xl text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-display text-2xl font-bold">{currentUser?.name}</div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {currentUser?.email}</span>
              {p.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {p.phone}</span> : null}
              {p.company_name ? <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {p.company_name}</span> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Información</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {editing && (
            <ImageUploader
              folder={"profiles/" + currentUser?.id}
              value={p.profile_photo_url ?? undefined}
              onChange={(url) => set({ profile_photo_url: url ?? null })}
              label="Foto de perfil"
            />
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" value={currentUser?.name ?? ""} readOnly />
            <Field label="Email" value={currentUser?.email ?? ""} readOnly />
            <Field label="Teléfono" value={p.phone} editing={editing} onChange={(v) => set({ phone: v })} />
            <Field label="Nombre de la empresa" value={p.company_name ?? ""} editing={editing} onChange={(v) => set({ company_name: v })} />
            <Field label="NIF / Cédula" value={p.tax_id ?? ""} editing={editing} onChange={(v) => set({ tax_id: v })} />
          </div>
          <div>
            <Label>Biografía</Label>
            {editing ? (
              <textarea className="mt-2 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={p.bio ?? ""} onChange={(e) => set({ bio: e.target.value })} />
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{p.bio || "—"}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, editing, readOnly, onChange }: {
  label: string; value: string; editing?: boolean; readOnly?: boolean; onChange?: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {editing && !readOnly && onChange ? (
        <Input className="mt-2" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="mt-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
          {value || <span className="text-muted-foreground">—</span>}
        </div>
      )}
    </div>
  );
}
