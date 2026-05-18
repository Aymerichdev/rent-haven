import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Home, Loader2, Sparkles } from "lucide-react";

import { ImageUploader } from "@/components/site/ImageUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@/lib/types";
import {
  onboardingRoleDetails,
  validateAccountStep,
  validateOwnerStep,
  validateTenantStep,
  type FieldErrors,
  type OwnerOnboardingForm,
  type RegisterAccountForm,
  type RegisterRole,
  type TenantOnboardingForm,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Crear cuenta — EstateHub" }] }),
  component: Page,
});

const initialAccountForm: RegisterAccountForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "tenant",
};

const initialTenantForm: TenantOnboardingForm = {
  nationalId: "",
  occupation: "",
  bio: "",
  recommendations: "",
  photos: [],
  employer: "",
  workCertificateUrl: "",
  creditAuth: false,
};

const initialOwnerForm: OwnerOnboardingForm = {
  companyName: "",
  taxId: "",
  bio: "",
  photoUrl: "",
};

const roleCards: Array<{
  role: RegisterRole;
  icon: typeof Home | typeof Building2;
  eyebrow: string;
}> = [
  {
    role: "tenant",
    icon: Home,
    eyebrow: "Looking for a rental",
  },
  {
    role: "owner",
    icon: Building2,
    eyebrow: "Publish properties",
  },
];

function Page() {
  const register = useAppStore((s) => s.register);
  const currentUser = useAppStore((s) => s.currentUser);
  const nav = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [createdUser, setCreatedUser] = useState<User | null>(currentUser);
  const [accountForm, setAccountForm] = useState(initialAccountForm);
  const [tenantForm, setTenantForm] = useState(initialTenantForm);
  const [ownerForm, setOwnerForm] = useState(initialOwnerForm);
  const [accountErrors, setAccountErrors] = useState<FieldErrors<keyof RegisterAccountForm>>({});
  const [tenantErrors, setTenantErrors] = useState<FieldErrors<keyof TenantOnboardingForm>>({});
  const [ownerErrors, setOwnerErrors] = useState<FieldErrors<keyof OwnerOnboardingForm>>({});
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [finishingProfile, setFinishingProfile] = useState(false);

  const role = accountForm.role;
  const roleDetails = onboardingRoleDetails[role];

  const selectRole = (nextRole: RegisterRole) => {
    if (step !== 1) return;
    setAccountForm((current) => ({ ...current, role: nextRole }));
    setAccountErrors({});
  };

  const submitAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateAccountStep(accountForm);
    setAccountErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return;
    }

    setCreatingAccount(true);
    try {
      const user = await register(accountForm);
      if (!user) {
        toast.error("No se pudo crear la cuenta");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Sesión no disponible, inicia sesión de nuevo");
        return;
      }

      setCreatedUser(user);
      setStep(2);
      toast.success("Cuenta creada. Completa tu perfil para terminar el registro.");
    } finally {
      setCreatingAccount(false);
    }
  };

  const submitProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!createdUser) {
      toast.error("Primero crea tu cuenta");
      return;
    }

    if (role === "tenant") {
      const errors = validateTenantStep(tenantForm);
      setTenantErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error(Object.values(errors)[0]);
        return;
      }
    } else {
      const errors = validateOwnerStep(ownerForm);
      setOwnerErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error(Object.values(errors)[0]);
        return;
      }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Sesión no disponible, inicia sesión de nuevo");
      return;
    }

    setFinishingProfile(true);
    try {
      if (role === "tenant") {
        const { error } = await supabase.from("tenant_profiles").upsert({
          id: createdUser.id,
          phone: accountForm.phone.trim(),
          national_id: tenantForm.nationalId.trim(),
          occupation: tenantForm.occupation.trim(),
          bio: tenantForm.bio.trim() || null,
          recommendations: tenantForm.recommendations.trim() || null,
          profile_photo_url: tenantForm.photos[0] ?? null,
          photos: tenantForm.photos,
          employer: tenantForm.employer.trim() || null,
          work_certificate_url: tenantForm.workCertificateUrl || null,
          credit_auth: !!tenantForm.creditAuth,
          credit_auth_date: tenantForm.creditAuth ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("owner_profiles").upsert({
          id: createdUser.id,
          phone: accountForm.phone.trim(),
          company_name: ownerForm.companyName.trim() || null,
          tax_id: ownerForm.taxId.trim() || null,
          bio: ownerForm.bio.trim() || null,
          profile_photo_url: ownerForm.photoUrl || null,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: accountForm.role,
          name: accountForm.name,
          avatar: role === "tenant" ? tenantForm.photos[0] ?? null : ownerForm.photoUrl || null,
        })
        .eq("id", createdUser.id);
      if (profileError) throw profileError;

      toast.success("Perfil completado con éxito");
      nav({ to: role === "owner" ? "/owner" : "/tenant" });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[register] submitProfile error", error);
      toast.error("No se pudo completar el perfil");
    } finally {
      setFinishingProfile(false);
    }
  };

  const renderFieldError = (message?: string) =>
    message ? <p className="text-xs text-destructive">{message}</p> : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,202,128,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_22%),linear-gradient(180deg,rgba(250,247,243,0.96),rgba(245,239,232,0.9))] p-4 sm:p-6 lg:p-8">
      <div className="absolute left-[-6rem] top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-[-4rem] top-56 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-border/70 bg-card/90 shadow-elegant backdrop-blur">
            <CardContent className="flex h-full flex-col justify-between gap-8 p-8 sm:p-10">
              <div>
                <Link to="/" className="inline-flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground shadow-card">
                    <Home className="h-5 w-5" />
                  </div>
                  <span className="font-display text-lg font-bold tracking-tight">
                    Estate<span className="text-gradient-warm">Hub</span>
                  </span>
                </Link>

                <div className="mt-8 space-y-4">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                    Paso {step} de 2
                  </Badge>
                  <div className="space-y-2">
                    <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
                      {step === 1
                        ? "Empieza con una cuenta pensada para tu rol"
                        : role === "tenant"
                          ? "Completa tu perfil de inquilino"
                          : "Completa tu perfil de propietario"}
                    </h1>
                    <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                      {step === 1
                        ? "Selecciona cómo usarás EstateHub y crea tu acceso con una experiencia guiada y clara."
                        : roleDetails.summary}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Onboarding guiado",
                    description: "Todo se adapta a tu rol para evitar campos innecesarios.",
                  },
                  {
                    title: "Listo para móvil",
                    description: "El layout se reorganiza automáticamente en pantallas pequeñas.",
                  },
                  {
                    title: "Perfil estructurado",
                    description: "Separamos credenciales y datos de perfil para escalar mejor.",
                  },
                  {
                    title: "Fotos seguras",
                    description: "Las imágenes se suben al bucket existente con tu sesión activa.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/35 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{roleDetails.tagline}</p>
                <p className="mt-1">Tu foto es opcional, pero útil para dar confianza desde el primer contacto.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card shadow-elegant">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-2xl">Crear cuenta</CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {step === 1 ? "Elige tu rol y crea tu acceso." : "Ahora completa los datos específicos de tu perfil."}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 p-1 text-xs font-medium">
                  <div
                    className={cn(
                      "rounded-full px-3 py-1 transition-colors",
                      step === 1 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    Cuenta
                  </div>
                  <div
                    className={cn(
                      "rounded-full px-3 py-1 transition-colors",
                      step === 2 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    Perfil
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {step === 1 ? (
                  roleCards.map((item) => {
                    const Icon = item.icon;
                    const selected = accountForm.role === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => selectRole(item.role)}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition-all",
                          selected
                            ? "border-primary bg-primary/5 shadow-card"
                            : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/30",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground shadow-sm">
                            <Icon className="h-5 w-5" />
                          </div>
                          {selected ? <CheckCircle2 className="mt-1 h-5 w-5 text-primary" /> : null}
                        </div>
                        <div className="mt-4 space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {item.eyebrow}
                          </p>
                          <h3 className="text-base font-semibold text-foreground">
                            {onboardingRoleDetails[item.role].title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.role === "tenant"
                              ? "Busca un lugar para vivir con un perfil claro y confiable."
                              : "Publica propiedades y gestiona solicitudes desde un panel profesional."}
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4 sm:col-span-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        {onboardingRoleDetails[role].title}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        Foto opcional
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Revisa los datos básicos antes de terminar. Puedes cerrar la pestaña y volver después si el
                      proveedor de correo requiere confirmación.
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {step === 1 ? (
                <form onSubmit={submitAccount} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                          Requerido
                        </Badge>
                      </div>
                      <Input
                        id="name"
                        value={accountForm.name}
                        onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                        placeholder="Tu nombre y apellido"
                        autoComplete="name"
                        aria-invalid={!!accountErrors.name}
                        required
                      />
                      {renderFieldError(accountErrors.name)}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label>Perfil</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {roleCards.map((item) => {
                          const Icon = item.icon;
                          const selected = accountForm.role === item.role;
                          return (
                            <button
                              key={item.role}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => selectRole(item.role)}
                              className={cn(
                                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                                selected
                                  ? "border-primary bg-primary/5 shadow-card"
                                  : "border-border bg-background hover:border-primary/30",
                              )}
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold">{onboardingRoleDetails[item.role].title}</div>
                                <div className="text-xs text-muted-foreground">{item.eyebrow}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {renderFieldError(accountErrors.role)}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                        placeholder="tu@email.com"
                        autoComplete="email"
                        aria-invalid={!!accountErrors.email}
                        required
                      />
                      {renderFieldError(accountErrors.email)}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={accountForm.phone}
                        onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                        placeholder="+1 555 123 4567"
                        autoComplete="tel"
                        aria-invalid={!!accountErrors.phone}
                        required
                      />
                      {renderFieldError(accountErrors.phone)}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        value={accountForm.password}
                        onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        aria-invalid={!!accountErrors.password}
                        required
                        minLength={8}
                      />
                      {renderFieldError(accountErrors.password)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Al continuar, crearás el acceso inicial y desbloquearás el formulario de perfil.
                    </p>
                    <Button type="submit" className="bg-gradient-warm shadow-card" disabled={creatingAccount}>
                      {creatingAccount ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta...
                        </>
                      ) : (
                        <>
                          Continuar <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={submitProfile} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Teléfono</Label>
                      <Input id="profile-phone" value={accountForm.phone} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={accountForm.email} disabled />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-border bg-secondary/20 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold">Foto de perfil</h3>
                        <p className="text-sm text-muted-foreground">
                          Opcional para completar el registro.
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        Opcional
                      </Badge>
                    </div>

                    {createdUser ? (
                      role === "tenant" ? (
                        <ImageUploader
                          folder={"profiles/" + createdUser.id}
                          label="Fotos de perfil (mínimo 1)"
                          multiple
                          value={tenantForm.photos}
                          onChange={(urls) => setTenantForm({ ...tenantForm, photos: urls })}
                        />
                      ) : (
                        <ImageUploader
                          folder={"profiles/" + createdUser.id}
                          label="Foto de perfil"
                          value={ownerForm.photoUrl}
                          onChange={(url) => setOwnerForm({ ...ownerForm, photoUrl: url ?? "" })}
                        />
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">Creando la sesión inicial...</p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Las imágenes se guardan en el bucket existente de EstateHub y se usan como avatar del perfil.
                    </p>
                  </div>

                  {role === "tenant" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="nationalId">Documento / ID nacional</Label>
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                            Requerido
                          </Badge>
                        </div>
                        <Input
                          id="nationalId"
                          value={tenantForm.nationalId}
                          onChange={(e) => setTenantForm({ ...tenantForm, nationalId: e.target.value })}
                          placeholder="Número de identificación"
                          aria-invalid={!!tenantErrors.nationalId}
                          required
                        />
                        {renderFieldError(tenantErrors.nationalId)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="occupation">Ocupación</Label>
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                            Requerido
                          </Badge>
                        </div>
                        <Input
                          id="occupation"
                          value={tenantForm.occupation}
                          onChange={(e) => setTenantForm({ ...tenantForm, occupation: e.target.value })}
                          placeholder="Empleado, freelancer, estudiante..."
                          aria-invalid={!!tenantErrors.occupation}
                          required
                        />
                        {renderFieldError(tenantErrors.occupation)}
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="tenantBio">Bio</Label>
                        <Textarea
                          id="tenantBio"
                          value={tenantForm.bio}
                          onChange={(e) => setTenantForm({ ...tenantForm, bio: e.target.value })}
                          placeholder="Cuéntales a los propietarios un poco sobre ti..."
                          className="min-h-[110px]"
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="recommendations">Recomendaciones</Label>
                        <Textarea
                          id="recommendations"
                          value={tenantForm.recommendations}
                          onChange={(e) => setTenantForm({ ...tenantForm, recommendations: e.target.value })}
                          placeholder="Referencias, historial, detalles de confianza..."
                          className="min-h-[110px]"
                        />
                      </div>

                      {createdUser ? (
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Orden patronal / Constancia de trabajo (opcional)</Label>
                          <ImageUploader
                            folder={"profiles/" + createdUser.id + "/employer"}
                            label="Orden patronal / Constancia de trabajo (opcional)"
                            value={tenantForm.employer}
                            onChange={(url) => setTenantForm({ ...tenantForm, employer: url ?? "" })}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nombre de la empresa</Label>
                        <Input
                          id="companyName"
                          value={ownerForm.companyName}
                          onChange={(e) => setOwnerForm({ ...ownerForm, companyName: e.target.value })}
                          placeholder="Tu marca o empresa"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxId">Cedula Nacional</Label>
                        <Input
                          id="taxId"
                          value={ownerForm.taxId}
                          onChange={(e) => setOwnerForm({ ...ownerForm, taxId: e.target.value })}
                          placeholder="Identificación fiscal"
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="ownerBio">Bio</Label>
                        <Textarea
                          id="ownerBio"
                          value={ownerForm.bio}
                          onChange={(e) => setOwnerForm({ ...ownerForm, bio: e.target.value })}
                          placeholder="Describe tu actividad como propietario o gestor..."
                          className="min-h-[130px]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground shadow-sm">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Tu siguiente paso</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {role === "tenant"
                            ? "Con este perfil podrás descubrir unidades, enviar solicitudes y seguir tus alquileres."
                            : "Con este perfil podrás publicar propiedades, administrar unidades y responder solicitudes."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Puedes revisar tus datos antes de finalizar.
                    </div>
                    <Button type="submit" className="bg-gradient-warm shadow-card" disabled={finishingProfile}>
                      {finishingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizando...
                        </>
                      ) : (
                        <>
                          Finalizar registro <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Entrar
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
