export type RegisterRole = "tenant" | "owner";

export interface RegisterAccountForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: RegisterRole;
}

export interface TenantOnboardingForm {
  nationalId: string;
  occupation: string;
  bio: string;
  recommendations: string;
  photos: string[];
  employer: string;
  workCertificateUrl: string;
  creditAuth: boolean;
}

export interface OwnerOnboardingForm {
  companyName: string;
  taxId: string;
  bio: string;
  photoUrl: string;
}

export type CompleteOnboardingInput =
  | { userId: string; phone: string; role: "tenant"; data: TenantOnboardingForm }
  | { userId: string; phone: string; role: "owner"; data: OwnerOnboardingForm };

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v: string) => v.trim();

export const onboardingRoleDetails: Record<
  RegisterRole,
  { title: string; summary: string; tagline: string; requiredLabel: string; optionalLabel: string }
> = {
  tenant: {
    title: "Looking for a rental",
    summary: "Crea tu perfil de inquilino con datos de contacto, ocupación y fotos.",
    tagline: "Para personas que quieren encontrar y gestionar su próximo hogar.",
    requiredLabel: "Perfil verificado",
    optionalLabel: "Más contexto para propietarios",
  },
  owner: {
    title: "Publish properties",
    summary: "Crea tu cuenta para publicar unidades y administrar solicitudes.",
    tagline: "Para propietarios, gestores y equipos que quieren publicar inventario.",
    requiredLabel: "Acceso para publicar",
    optionalLabel: "Perfil profesional",
  },
};

export function validateAccountStep(form: RegisterAccountForm): FieldErrors<keyof RegisterAccountForm> {
  const e: FieldErrors<keyof RegisterAccountForm> = {};
  if (clean(form.name).length < 3) e.name = "Ingresa tu nombre completo.";
  if (!emailRegex.test(clean(form.email))) e.email = "Ingresa un email válido.";
  if (clean(form.password).length < 8) e.password = "La contraseña debe tener al menos 8 caracteres.";
  if (clean(form.phone).length < 7) e.phone = "Ingresa un teléfono válido.";
  if (!form.role) e.role = "Selecciona un perfil.";
  return e;
}

export function validateTenantStep(form: TenantOnboardingForm): FieldErrors<keyof TenantOnboardingForm> {
  const e: FieldErrors<keyof TenantOnboardingForm> = {};
  if (!form.photos || form.photos.length < 1) e.photos = "Sube al menos una foto de perfil.";
  if (clean(form.nationalId).length < 4) e.nationalId = "Ingresa tu documento o ID nacional.";
  if (clean(form.occupation).length < 2) e.occupation = "Ingresa tu ocupación.";
  return e;
}

export function validateOwnerStep(form: OwnerOnboardingForm): FieldErrors<keyof OwnerOnboardingForm> {
  const e: FieldErrors<keyof OwnerOnboardingForm> = {};
  if (form.photoUrl && !clean(form.photoUrl)) e.photoUrl = "La foto seleccionada no es válida.";
  return e;
}

export const normalizePhone = (v: string) => clean(v);
export const normalizeOptionalText = (v: string) => clean(v);
