import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader } from "@/components/site/ImageUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { Pencil, Save, X, CheckCircle2, FileText, Mail, Phone, Briefcase, IdCard } from "lucide-react";

export const Route = createFileRoute("/tenant/profile")({ component: Page });

type ProfileState = {
  id: string;
  phone: string;
  national_id: string;
  occupation: string;
  bio: string | null;
  recommendations: string | null;
  profile_photo_url: string | null;
  photos: string[];
  employer: string | null;
  work_certificate_url: string | null;
  credit_auth: boolean;
  credit_auth_date: string | null;
};

const empty = (id: string): ProfileState => ({
  id, phone: "", national_id: "", occupation: "",
  bio: null, recommendations: null,
  profile_photo_url: null, photos: [],
  employer: null, work_certificate_url: null,
  credit_auth: false, credit_auth_date: null,
});

function Page() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileState | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentUser) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("tenant_profiles").select("*").eq("id", currentUser.id).maybeSingle();
      if (cancelled) return;
      if (error) toast.error("No se pudo cargar el perfil");
      else if (data) setProfile({ ...(data as any), photos: (data as any).photos ?? [] });
      else setProfile(empty(currentUser.id));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [currentUser]);

  const save = async () => {
    if (!currentUser || !profile) return;
    if (!profile.photos || profile.photos.length < 1) {
      toast.error("Sube al menos una foto de perfil");
      return;
    }
    setSaving(true);
    const wasAuthorized = (profile as any).credit_auth_date;
    const payload: any = {
      id: currentUser.id,
      phone: profile.phone ?? "",
      national_id: profile.national_id ?? "",
      occupation: profile.occupation ?? "",
      bio: profile.bio || null,
      recommendations: profile.recommendations || null,
      photos: profile.photos,
      profile_photo_url: profile.photos[0] ?? null,
      employer: profile.employer || null,
      work_certificate_url: profile.work_certificate_url || null,
      credit_auth: !!profile.credit_auth,
      credit_auth_date: profile.credit_auth ? (wasAuthorized ?? new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("tenant_profiles").upsert(payload);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar el perfil");
    setProfile({ ...profile, ...payload });
    setEditing(false);
    toast.success("Perfil guardado");
  };

  const set = (patch: Partial<ProfileState>) =>
    setProfile((s) => ({ ...(s ?? empty(currentUser?.id ?? "")), ...patch }));

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const p = profile ?? empty(currentUser?.id ?? "");
  const initials = currentUser?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "U";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Mi perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tu información para solicitudes de alquiler.</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="bg-gradient-warm">
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={save} disabled={saving} className="bg-gradient-warm">
              <Save className="mr-2 h-4 w-4" /> {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        )}
      </div>

      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-warm" />
        <CardContent className="-mt-12 space-y-3 pb-6">
          <Avatar className="h-24 w-24 border-4 border-background shadow-card">
            <AvatarImage src={p.photos[0] ?? p.profile_photo_url ?? undefined} />
            <AvatarFallback className="bg-gradient-warm text-2xl text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-display text-2xl font-bold">{currentUser?.name}</div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {currentUser?.email}</span>
              {p.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {p.phone}</span> : null}
              {p.occupation ? <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {p.occupation}</span> : null}
            </div>
          </div>
          {p.credit_auth && p.credit_auth_date && (
            <Badge className="bg-success/15 text-success border-success/30" variant="outline">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Estudio crediticio autorizado el {new Date(p.credit_auth_date).toLocaleDateString()}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader><CardTitle>Galería de fotos {!editing && <span className="text-xs font-normal text-muted-foreground">({p.photos.length})</span>}</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <ImageUploader
              folder={"profiles/" + currentUser?.id}
              multiple
              value={p.photos}
              onChange={(urls) => set({ photos: urls })}
              label="Sube al menos 1 foto"
            />
          ) : p.photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin fotos. Edita tu perfil para añadir.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {p.photos.map((url) => (
                <img key={url} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader><CardTitle>Información personal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre completo" value={currentUser?.name ?? ""} readOnly />
            <Field label="Email" value={currentUser?.email ?? ""} readOnly />
            <Field label="Teléfono" value={p.phone} editing={editing} onChange={(v) => set({ phone: v })} />
            <Field label="Cédula" value={p.national_id} editing={editing} onChange={(v) => set({ national_id: v })} />
            <Field label="Ocupación" value={p.occupation} editing={editing} onChange={(v) => set({ occupation: v })} />
            <div>
              <Label>Orden patronal / Constancia de trabajo (opcional)</Label>
              {editing ? (
                <div className="mt-2">
                  <ImageUploader
                    folder={"profiles/" + currentUser?.id + "/employer"}
                    label="Orden patronal / Constancia de trabajo (opcional)"
                    value={p.employer ?? ""}
                    onChange={(url) => set({ employer: url ?? "" })}
                  />
                </div>
              ) : p.employer ? (
                <a href={p.employer} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  <FileText className="h-4 w-4" /> Ver orden patronal
                </a>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Sin archivo adjunto</p>
              )}
            </div>
          </div>

          <div>
            <Label>Constancia de trabajo (archivo)</Label>
            {editing ? (
              <div className="mt-2">
                <ImageUploader
                  folder={"profiles/" + currentUser?.id + "/work"}
                  value={p.work_certificate_url ?? undefined}
                  onChange={(url) => set({ work_certificate_url: url ?? null })}
                />
              </div>
            ) : p.work_certificate_url ? (
              <a href={p.work_certificate_url} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <FileText className="h-4 w-4" /> Ver documento
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Sin documento adjunto</p>
            )}
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

          <div>
            <Label>Recomendaciones</Label>
            {editing ? (
              <textarea className="mt-2 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={p.recommendations ?? ""} onChange={(e) => set({ recommendations: e.target.value })} />
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{p.recommendations || "—"}</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="credit-auth"
                checked={!!p.credit_auth}
                disabled={!editing || !!p.credit_auth_date}
                onCheckedChange={(v) => set({ credit_auth: !!v })}
              />
              <div className="flex-1">
                <Label htmlFor="credit-auth" className="cursor-pointer">
                  Autorizo el estudio crediticio y/o financiero de mi perfil
                </Label>
                {p.credit_auth_date && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Autorizado el {new Date(p.credit_auth_date).toLocaleDateString()}. Esta autorización no puede revocarse desde aquí.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label, value, editing, readOnly, onChange,
}: { label: string; value: string; editing?: boolean; readOnly?: boolean; onChange?: (v: string) => void }) {
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
