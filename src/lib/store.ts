import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import type {
  User,
  Building,
  Unit,
  Amenity,
  Meter,
  RentalRequest,
  AmenityBooking,
  Contract,
  Payment,
  Role,
} from "./types";
import {
  rowToUser,
  rowToBuilding,
  rowToUnit,
  rowToAmenity,
  rowToMeter,
  rowToRequest,
  rowToBooking,
  rowToContract,
  rowToPayment,
  buildingToInsert,
  buildingToUpdate,
  unitToInsert,
  unitToUpdate,
  amenityToInsert,
  amenityToUpdate,
  meterToInsert,
  requestToInsert,
  bookingToInsert,
  contractToInsert,
} from "./mappers";
import { deleteFolder, deleteImageByUrl } from "./storage";
import type {
  CompleteOnboardingInput,
  RegisterAccountForm,
} from "./onboarding";

export type DeleteResult = { ok: true } | { ok: false; reason: string };
export type TenantProfileRow = Database["public"]["Tables"]["tenant_profiles"]["Row"];
export type OwnerProfileRow = Database["public"]["Tables"]["owner_profiles"]["Row"];

interface AppState {
  currentUser: User | null;
  hydrated: boolean;
  _hydrating: boolean;

  users: User[];
  buildings: Building[];
  units: Unit[];
  amenities: Amenity[];
  meters: Meter[];
  requests: RentalRequest[];
  bookings: AmenityBooking[];
  contracts: Contract[];
  payments: Payment[];

  // session bootstrap
  init: () => Promise<void>;
  hydrate: () => Promise<void>;

  // auth
  login: (email: string, password: string) => Promise<User | null>;
  register: (data: RegisterAccountForm) => Promise<User | null>;
  completeOnboarding: (data: CompleteOnboardingInput) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (oldPwd: string, newPwd: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;

  // users (admin)
  addUser: (u: Omit<User, "id" | "createdAt">) => Promise<void>;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<boolean>;
  updateTenantProfile: (data: Partial<TenantProfileRow>) => Promise<boolean>;
  updateOwnerProfile: (data: Partial<OwnerProfileRow>) => Promise<boolean>;

  // buildings
  addBuilding: (b: Omit<Building, "id">) => Promise<string>;
  updateBuilding: (id: string, patch: Partial<Building>) => Promise<void>;
  deleteBuilding: (id: string) => Promise<DeleteResult>;

  // units
  addUnit: (u: Omit<Unit, "id">) => Promise<DeleteResult & { id?: string }>;
  updateUnit: (id: string, patch: Partial<Unit>) => Promise<void>;
  markUnitRented: (
    unitId: string,
    contract: {
      tenantId?: string;
      startDate: string;
      endDate: string;
      monthlyRent: number;
      deposit: number;
      contractPhotoUrl?: string;
    },
  ) => Promise<{ id: string; tenantId?: string; monthlyRent: number } | null>;
  markUnitAvailable: (unitId: string) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;

  // amenities
  addAmenity: (a: Omit<Amenity, "id">) => Promise<void>;
  updateAmenity: (id: string, patch: Partial<Amenity>) => Promise<void>;
  deleteAmenity: (id: string) => Promise<void>;

  // meters
  addMeter: (m: Omit<Meter, "id">) => Promise<void>;
  deleteMeter: (id: string) => Promise<void>;

  // requests / bookings
  createRentalRequest: (
    r: Omit<RentalRequest, "id" | "createdAt" | "status" | "ownerResponse" | "updatedAt">,
  ) => Promise<void>;
  setRequestStatus: (
    id: string,
    status: RentalRequest["status"],
    ownerResponse?: string,
  ) => Promise<void>;
  createBooking: (b: Omit<AmenityBooking, "id" | "status">) => Promise<void>;
  setBookingStatus: (
    id: string,
    status: AmenityBooking["status"],
    ownerNote?: string,
  ) => Promise<void>;

  // payments
  submitPaymentReceipt: (id: string, receipt: File) => Promise<void>;
  approvePayment: (id: string, ownerNote?: string) => Promise<void>;
  rejectPayment: (id: string, ownerNote: string) => Promise<void>;
}

const fail = (label: string, err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(`[store] ${label}:`, err);
  const message = (err as { message?: string } | null)?.message ?? "Error inesperado";
  toast.error(`${label}: ${message}`);
};

const isMissingRelationError = (err: unknown) => {
  const error = err as { code?: string; message?: string } | null;
  const message = error?.message ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    /does not exist/i.test(message) ||
    /relation .* does not exist/i.test(message) ||
    /table .* does not exist/i.test(message)
  );
};

const recomputeBuildingAmenityIds = (
  buildings: Building[],
  amenities: Amenity[],
): Building[] => {
  const map = new Map<string, string[]>();
  for (const a of amenities) {
    const arr = map.get(a.buildingId) ?? [];
    arr.push(a.id);
    map.set(a.buildingId, arr);
  }
  return buildings.map((b) => ({ ...b, amenityIds: map.get(b.id) ?? [] }));
};
let _authSubscription: { unsubscribe: () => void } | null = null;

export function cleanupAuthSubscription() {
  _authSubscription?.unsubscribe();
  _authSubscription = null;
}
export const useAppStore = create<AppState>()((set, get) => ({
  currentUser: null,
  hydrated: false,
  _hydrating: false,
  users: [],
  buildings: [],
  units: [],
  amenities: [],
  meters: [],
  requests: [],
  bookings: [],
  contracts: [],
  payments: [],



  // -------- bootstrap --------
  init: async () => {
    cleanupAuthSubscription();
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sess.session.user.id)
        .maybeSingle();
      if (profile) set({ currentUser: rowToUser(profile) });
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (_e === "TOKEN_REFRESHED") {
        return;
      }

      if (
        _e === "SIGNED_IN" &&
        get().hydrated &&
        get().currentUser?.id === session?.user?.id
      ) {
        return;
      }

      if (!session?.user) {
        set({
          currentUser: null,
          hydrated: false,
          _hydrating: false,
          buildings: [],
          units: [],
          amenities: [],
          meters: [],
          requests: [],
          bookings: [],
          contracts: [],
          payments: [],
          users: [],
        });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile) {
        set({ currentUser: rowToUser(profile) });
        // hydrate in background
        get().hydrate();
      }
    });
    _authSubscription = subscription;
    if (get().currentUser) await get().hydrate();
  },

  hydrate: async () => {
    if (get()._hydrating) return;
    set({ _hydrating: true });
    try {
      const [
        profilesRes,
        buildingsRes,
        unitsRes,
        amenitiesRes,
        metersRes,
        requestsRes,
        bookingsRes,
        contractsRes,
        paymentsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("buildings").select("*"),
        supabase.from("units").select("*"),
        supabase.from("amenities").select("*"),
        supabase.from("meters").select("*"),
        supabase.from("rental_requests").select("*"),
        supabase.from("amenity_bookings").select("*"),
        supabase.from("contracts").select("*"),
        supabase.from("payments").select("*"),
      ]);

      const users = (profilesRes.data ?? []).map(rowToUser);
      const amenities = (amenitiesRes.data ?? []).map(rowToAmenity);
      const buildings = recomputeBuildingAmenityIds(
        (buildingsRes.data ?? []).map((b) => rowToBuilding(b)),
        amenities,
      );

      set({
        users,
        buildings,
        amenities,
        units: (unitsRes.data ?? []).map(rowToUnit),
        meters: (metersRes.data ?? []).map(rowToMeter),
        requests: (requestsRes.data ?? []).map(rowToRequest),
        bookings: (bookingsRes.data ?? []).map(rowToBooking),
        contracts: (contractsRes.data ?? []).map(rowToContract),
        payments: (paymentsRes.data ?? []).map(rowToPayment),
        hydrated: true,
      });
    } catch (err) {
      fail("Cargar datos", err);
    } finally {
      set({ _hydrating: false });
    }
  },

  // -------- auth --------
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      fail("Iniciar sesión", error ?? new Error("Sin usuario"));
      return null;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profile) return null;
    const u = rowToUser(profile);
    set({ currentUser: u });
    return u;
  },

  register: async (data) => {
    const { data: signup, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { name: data.name, role: data.role, phone: data.phone },
      },
    });
    if (error || !signup.user) {
      const message = (error as { message?: string } | null)?.message ?? "";
      if (/already registered/i.test(message)) {
        const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (signInError || !signIn.user) {
          fail("Crear cuenta", signInError ?? new Error("Sin usuario"));
          return null;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", signIn.user.id)
          .maybeSingle();
        if (!profile) return null;
        const u = rowToUser(profile);
        set({ currentUser: u });
        return u;
      }
      fail("Crear cuenta", error ?? new Error("Sin usuario"));
      return null;
    }
    // Ensure we have a session (some Supabase projects require email confirm and do not
    // create a session on signUp). Try signing in immediately with the provided creds so
    // subsequent onboarding writes that require auth succeed.
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) {
        fail("Crear cuenta", signInError);
        return null;
      }
    } catch (e) {
      fail("Crear cuenta", e);
      return null;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      fail("Crear cuenta", new Error("Sesión no disponible"));
      return null;
    }
    // upsert profile (trigger may already have created it; we set name/role here)
    await supabase
      .from("profiles")
      .upsert({ id: signup.user.id, email: data.email, name: data.name, role: data.role });
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", signup.user.id)
      .maybeSingle();
    if (!profile) return null;
    const u = rowToUser(profile);
    set({ currentUser: u });
    return u;
  },

  completeOnboarding: async (data) => {
    const user = get().currentUser;
    if (!user || user.id !== data.userId) {
      // eslint-disable-next-line no-console
      console.error("[store] Completar perfil: sesión no lista", { currentUserId: user?.id, payloadUserId: data.userId });
      fail("Completar perfil", new Error("La sesión no está lista"));
      return false;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      // eslint-disable-next-line no-console
      console.error("[store] Completar perfil: sesión no disponible tras getSession");
      fail("Completar perfil", new Error("Sesión no disponible"));
      return false;
    }

    try {
      const tenantPhoto =
        data.role === "tenant" ? (data.data.photos[0] ?? "") : "";
      const sharedMetadata =
        data.role === "tenant"
          ? {
              onboarding_role: "tenant",
              phone: data.phone.trim(),
              national_id: data.data.nationalId.trim(),
              occupation: data.data.occupation.trim(),
              bio: data.data.bio.trim(),
              recommendations: data.data.recommendations.trim(),
              profile_photo_url: tenantPhoto,
            }
          : {
              onboarding_role: "owner",
              phone: data.phone.trim(),
              company_name: data.data.companyName.trim(),
              tax_id: data.data.taxId.trim(),
              bio: data.data.bio.trim(),
              profile_photo_url: data.data.photoUrl,
            };

      const { error: metadataError } = await supabase.auth.updateUser({ data: sharedMetadata });
      if (metadataError) {
        console.error("[store] Completar perfil: auth.updateUser failed", metadataError);
        throw metadataError;
      }

      if (data.role === "tenant") {
        if (tenantPhoto) {
          const { error: avatarError } = await supabase
            .from("profiles")
            .update({ avatar: tenantPhoto })
            .eq("id", user.id);
          if (avatarError) throw avatarError;
          set((state) => ({
            currentUser:
              state.currentUser?.id === user.id
                ? { ...state.currentUser, avatar: tenantPhoto }
                : state.currentUser,
            users: state.users.map((profile) =>
              profile.id === user.id ? { ...profile, avatar: tenantPhoto } : profile,
            ),
          }));
        }

        const { error } = await supabase.from("tenant_profiles").upsert({
          id: user.id,
          phone: data.phone.trim(),
          national_id: data.data.nationalId.trim(),
          occupation: data.data.occupation.trim(),
          bio: data.data.bio.trim() || null,
          recommendations: data.data.recommendations.trim() || null,
          profile_photo_url: tenantPhoto || null,
          photos: data.data.photos,
          employer: data.data.employer.trim() || null,
          work_certificate_url: data.data.workCertificateUrl || null,
          credit_auth: !!data.data.creditAuth,
          credit_auth_date: data.data.creditAuth ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        } as any);
        if (error && !isMissingRelationError(error)) throw error;
      } else {
        if (data.data.photoUrl) {
          const { error: avatarError } = await supabase
            .from("profiles")
            .update({ avatar: data.data.photoUrl })
            .eq("id", user.id);
          if (avatarError) throw avatarError;
          set((state) => ({
            currentUser:
              state.currentUser?.id === user.id
                ? { ...state.currentUser, avatar: data.data.photoUrl }
                : state.currentUser,
            users: state.users.map((profile) =>
              profile.id === user.id ? { ...profile, avatar: data.data.photoUrl } : profile,
            ),
          }));
        }

        const { error } = await supabase.from("owner_profiles").upsert({
          id: user.id,
          phone: data.phone.trim(),
          company_name: data.data.companyName.trim() || null,
          tax_id: data.data.taxId.trim() || null,
          bio: data.data.bio.trim() || null,
          profile_photo_url: data.data.photoUrl || null,
          updated_at: new Date().toISOString(),
        });
        if (error && !isMissingRelationError(error)) throw error;
      }

      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[store] Completar perfil:", err);
      if (isMissingRelationError(err)) {
        return true;
      }
      fail("Completar perfil", err);
      return false;
    }
  },

  logout: async () => {
    set({
      currentUser: null,
      hydrated: false,
      users: [],
      buildings: [],
      units: [],
      amenities: [],
      meters: [],
      requests: [],
      bookings: [],
      contracts: [],
      payments: [],
    });
    await supabase.auth.signOut();
  },

  changePassword: async (_old, newPwd) => {
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) {
      fail("Cambiar contraseña", error);
      return false;
    }
    return true;
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/change-password` : undefined,
    });
    if (error) {
      fail("Recuperar contraseña", error);
      return false;
    }
    return true;
  },

  // -------- users (admin) --------
  addUser: async (u) => {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { name: u.name, role: u.role } },
    });
    if (error || !data.user) return fail("Crear usuario", error);
    await supabase
      .from("profiles")
      .upsert({ id: data.user.id, email: u.email, name: u.name, role: u.role });
    if (u.role === "tenant") {
      try {
        await supabase.from("tenant_profiles").upsert({
          id: data.user.id,
          phone: "",
          national_id: "",
          occupation: "",
          profile_photo_url: "",
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[store] Crear perfil tenant:", err);
      }
    }
    if (u.role === "owner") {
      try {
        await supabase.from("owner_profiles").upsert({
          id: data.user.id,
          phone: "",
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[store] Crear perfil owner:", err);
      }
    }
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");
    if (profilesError) return fail("Cargar usuarios", profilesError);
    set({ users: (profiles ?? []).map(rowToUser) });
  },

  updateUser: async (id, patch) => {
    const update: Database["public"]["Tables"]["profiles"]["Update"] = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.email !== undefined) update.email = patch.email;
    if (patch.role !== undefined) update.role = patch.role;
    if (patch.avatar !== undefined) update.avatar = patch.avatar;
    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("profiles").update(update).eq("id", id);
      if (error) return fail("Actualizar usuario", error);
    }
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      currentUser:
        s.currentUser?.id === id ? { ...s.currentUser, ...patch } : s.currentUser,
    }));
  },

  deleteUser: async (id) => {
    // quick guard: only allow if current user is admin (prevents silent RLS failures)
    const current = get().currentUser;
    if (!current || current.role !== "admin") {
      const err = new Error("Permisos insuficientes: se requiere rol admin");
      fail("Eliminar usuario", err);
      return false;
    }

    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      // Provide more detailed toast for debugging (include code if present)
      const code = (error as { code?: string }).code;
      const msg = `${error.message ?? String(error)}${code ? ` (code: ${code})` : ""}`;
      fail("Eliminar usuario", { message: msg });
      return false;
    }
    set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
    return true;
  },

  updateTenantProfile: async (data) => {
    const current = get().currentUser;
    if (!current) return false;
    const payload: Database["public"]["Tables"]["tenant_profiles"]["Insert"] = {
      id: current.id,
      phone: data.phone ?? "",
      national_id: data.national_id ?? "",
      occupation: data.occupation ?? "",
      profile_photo_url: data.profile_photo_url ?? "",
      bio: data.bio ?? null,
      recommendations: data.recommendations ?? null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("tenant_profiles").upsert(payload);
    if (error) {
      fail("Actualizar perfil", error);
      return false;
    }
    return true;
  },

  updateOwnerProfile: async (data) => {
    const current = get().currentUser;
    if (!current) return false;
    const payload: Database["public"]["Tables"]["owner_profiles"]["Insert"] = {
      id: current.id,
      phone: data.phone ?? "",
      company_name: data.company_name ?? null,
      tax_id: data.tax_id ?? null,
      bio: data.bio ?? null,
      profile_photo_url: data.profile_photo_url ?? null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("owner_profiles").upsert(payload);
    if (error) {
      fail("Actualizar perfil", error);
      return false;
    }
    return true;
  },

  // -------- buildings --------
  addBuilding: async (b) => {
    const { data, error } = await supabase
      .from("buildings")
      .insert(buildingToInsert(b))
      .select()
      .single();
    if (error || !data) {
      fail("Crear edificio", error);
      throw error ?? new Error("Insert failed");
    }
    const created = rowToBuilding(data);
    set((s) => ({
      buildings: recomputeBuildingAmenityIds([...s.buildings, created], s.amenities),
    }));
    return created.id;
  },

  updateBuilding: async (id, patch) => {
    const { data, error } = await supabase
      .from("buildings")
      .update(buildingToUpdate(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) return fail("Actualizar edificio", error);
    const updated = data ? rowToBuilding(data) : null;
    set((s) => ({
      buildings: recomputeBuildingAmenityIds(
        s.buildings.map((b) => (b.id === id ? updated ?? { ...b, ...patch } : b)),
        s.amenities,
      ),
    }));
  },

  deleteBuilding: async (id) => {
    const unitsInBuilding = get().units.filter((u) => u.buildingId === id);
    if (unitsInBuilding.length > 0)
      return {
        ok: false,
        reason: `Tiene ${unitsInBuilding.length} unidad(es). Bórralas o muévelas primero.`,
      };
    const { error } = await supabase.from("buildings").delete().eq("id", id);
    if (error) {
      fail("Eliminar edificio", error);
      return { ok: false, reason: error.message };
    }
    await deleteFolder(`buildings/${id}`);
    set((s) => ({
      buildings: s.buildings.filter((b) => b.id !== id),
      amenities: s.amenities.filter((a) => a.buildingId !== id),
    }));
    return { ok: true };
  },

  // -------- units --------
  addUnit: async (u) => {
    if (u.buildingId) {
      const building = get().buildings.find((b) => b.id === u.buildingId);
      if (!building) return { ok: false, reason: "Edificio inválido" };
      if (building.ownerId !== u.ownerId)
        return { ok: false, reason: "El owner debe coincidir con el del edificio" };
      const dup = get().units.some(
        (x) => x.buildingId === u.buildingId && x.number.trim() === u.number.trim(),
      );
      if (dup) return { ok: false, reason: "Ya existe una unidad con ese número en el edificio" };
    } else if (!u.addressOverride?.trim() || !u.cityOverride?.trim()) {
      return { ok: false, reason: "Las unidades sin edificio requieren dirección y ciudad" };
    }
    const { data, error } = await supabase
      .from("units")
      .insert(unitToInsert(u))
      .select()
      .single();
    if (error || !data) {
      fail("Crear unidad", error);
      return { ok: false, reason: error?.message ?? "Insert failed" };
    }
    const created = rowToUnit(data);
    set((s) => ({ units: [...s.units, created] }));
    return { ok: true, id: created.id };
  },

  updateUnit: async (id, patch) => {
    const { data, error } = await supabase
      .from("units")
      .update(unitToUpdate(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) return fail("Actualizar unidad", error);
    const updated = data ? rowToUnit(data) : null;
    set((s) => ({
      units: s.units.map((u) => (u.id === id ? updated ?? { ...u, ...patch } : u)),
    }));
  },

  markUnitRented: async (unitId, contract) => {
  const unit = get().units.find((u) => u.id === unitId);
  if (!unit) return;

  // Cerrar contratos activos anteriores directo en DB
  await supabase
    .from("contracts")
    .update({ status: "ended" })
    .eq("unit_id", unitId)
    .eq("status", "active");

  const { data: contractRow, error: cErr } = await supabase
    .from("contracts")
    .insert(
      contractToInsert({
        unitId,
        tenantId: contract.tenantId,
        ownerId: unit.ownerId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: contract.monthlyRent,
        deposit: contract.deposit,
        status: "active",
        contractPhotoUrl: contract.contractPhotoUrl,
      }),
    )
    .select()
    .single();
  if (cErr || !contractRow) return fail("Crear contrato", cErr);

  const { error: uErr } = await supabase
    .from("units")
    .update({ status: "rented", tenant_id: contract.tenantId ?? null })
    .eq("id", unitId);
  if (uErr) return fail("Marcar alquilada", uErr);

  set((s) => ({
    units: s.units.map((u) =>
      u.id === unitId ? { ...u, status: "rented" as const, tenantId: contract.tenantId } : u,
    ),
    contracts: [
      ...s.contracts.map((c) =>
        c.unitId === unitId && c.status === "active" ? { ...c, status: "ended" as const } : c
      ),
      rowToContract(contractRow),
    ],
  }));
},


  markUnitAvailable: async (unitId) => {
    const active = get().contracts.find((c) => c.unitId === unitId && c.status === "active");
    if (active) {
      await supabase.from("contracts").update({ status: "ended" }).eq("id", active.id);
    }
    const { error } = await supabase
      .from("units")
      .update({ status: "available", tenant_id: null })
      .eq("id", unitId);
    if (error) return fail("Liberar unidad", error);
    set((s) => ({
      units: s.units.map((u) =>
        u.id === unitId ? { ...u, status: "available", tenantId: undefined } : u,
      ),
      contracts: s.contracts.map((c) =>
        c.unitId === unitId && c.status === "active" ? { ...c, status: "ended" } : c,
      ),
    }));
  },

  deleteUnit: async (id) => {
    const { error } = await supabase.from("units").delete().eq("id", id);
    if (error) return fail("Eliminar unidad", error);
    await deleteFolder(`units/${id}`);
    set((s) => ({ units: s.units.filter((u) => u.id !== id) }));
  },

  // -------- amenities --------
  addAmenity: async (a) => {
    const { data, error } = await supabase
      .from("amenities")
      .insert(amenityToInsert(a))
      .select()
      .single();
    if (error || !data) return fail("Crear amenidad", error);
    const created = rowToAmenity(data);
    set((s) => {
      const amenities = [...s.amenities, created];
      return { amenities, buildings: recomputeBuildingAmenityIds(s.buildings, amenities) };
    });
  },
  
  updateAmenity: async (id, patch) => {
    const { data, error } = await supabase
      .from("amenities")
      .update(amenityToUpdate(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) return fail("Actualizar amenidad", error);
    const updated = data ? rowToAmenity(data) : null;
    set((s) => {
      const amenities = s.amenities.map((a) => (a.id === id ? updated ?? { ...a, ...patch } : a));
      return { amenities, buildings: recomputeBuildingAmenityIds(s.buildings, amenities) };
    });
  },

  deleteAmenity: async (id) => {
    const existing = get().amenities.find((a) => a.id === id);
    const { error } = await supabase.from("amenities").delete().eq("id", id);
    if (error) return fail("Eliminar amenidad", error);
    if (existing?.photoUrl) await deleteImageByUrl(existing.photoUrl);
    set((s) => {
      const amenities = s.amenities.filter((a) => a.id !== id);
      return { amenities, buildings: recomputeBuildingAmenityIds(s.buildings, amenities) };
    });
  },

  // -------- meters --------
  addMeter: async (m) => {
    const { data, error } = await supabase
      .from("meters")
      .insert(meterToInsert(m))
      .select()
      .single();
    if (error || !data) return fail("Crear lectura", error);
    set((s) => ({ meters: [...s.meters, rowToMeter(data)] }));
  },

  deleteMeter: async (id) => {
    const { error } = await supabase.from("meters").delete().eq("id", id);
    if (error) return fail("Eliminar lectura", error);
    set((s) => ({ meters: s.meters.filter((m) => m.id !== id) }));
  },

  // -------- requests --------
  createRentalRequest: async (r) => {
    const { data: tenantProfile, error: tenantProfileError } = await supabase
      .from("tenant_profiles")
      .select("*")
      .eq("id", r.tenantId)
      .maybeSingle();
    if (tenantProfileError) return fail("Enviar solicitud", tenantProfileError);

    if (!tenantProfile || !tenantProfile.phone?.trim() || !tenantProfile.national_id?.trim() || !tenantProfile.occupation?.trim()) {
      throw new Error("Completa tu perfil antes de enviar solicitudes");
    }
    const photos = (tenantProfile as { photos?: string[] | null }).photos ?? [];
    if (!photos || photos.length === 0) {
      throw new Error("Sube al menos una foto a tu perfil antes de enviar solicitudes");
    }
    const profile = tenantProfile as typeof tenantProfile & {
      photos?: string[] | null;
      employer?: string | null;
      work_certificate_url?: string | null;
      credit_auth?: boolean | null;
    };

    const { data, error } = await supabase
      .from("rental_requests")
      .insert({
        ...requestToInsert(r),
        phone: profile.phone,
        national_id: profile.national_id,
        occupation: profile.occupation,
        bio: profile.bio ?? null,
        recommendations: profile.recommendations ?? null,
        profile_photo_url: profile.profile_photo_url ?? photos[0] ?? null,
        photos: photos,
        employer: profile.employer ?? null,
        work_certificate_url: profile.work_certificate_url ?? null,
        credit_auth: !!profile.credit_auth,
        status: "pending",
      } as never)
      .select()
      .single();
    if (error || !data) return fail("Enviar solicitud", error);
    set((s) => ({ requests: [...s.requests, rowToRequest(data)] }));
  },

  setRequestStatus: async (id, status, ownerResponse) => {
    const { data, error } = await supabase
      .from("rental_requests")
      .update({
        status,
        owner_response: ownerResponse ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return fail("Actualizar solicitud", error);
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === id ? (data ? rowToRequest(data) : { ...r, status, ownerResponse }) : r,
      ),
    }));
  },

  // -------- bookings --------
  createBooking: async (b) => {
    const { data, error } = await supabase
      .from("amenity_bookings")
      .insert(bookingToInsert(b))
      .select()
      .single();
    if (error || !data) return fail("Crear reserva", error);
    set((s) => ({ bookings: [...s.bookings, rowToBooking(data)] }));
  },

  setBookingStatus: async (id, status, ownerNote) => {
    const update: Database["public"]["Tables"]["amenity_bookings"]["Update"] = { status };
    if (ownerNote?.trim()) update.owner_note = ownerNote.trim();
    const { data, error } = await supabase
      .from("amenity_bookings")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail("Actualizar reserva", error);
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? (data ? rowToBooking(data) : { ...b, status, ownerNote: ownerNote ?? b.ownerNote }) : b,
      ),
    }));
  },

  // -------- payments --------
  submitPaymentReceipt: async (id, file) => {
    // Upload to receipts folder in property-images bucket (reusing same bucket for simplicity).
    let publicUrl: string;
    try {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `receipts/${id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("property-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      publicUrl = supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl;
    } catch (err) {
      return fail("Subir comprobante", err);
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("payments")
      .update({
        status: "validating",
        receipt_url: publicUrl,
        receipt_name: file.name,
        receipt_type: file.type,
        receipt_uploaded_at: nowIso,
        owner_note: null,
        reviewed_at: null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return fail("Registrar comprobante", error);
    set((s) => ({
      payments: s.payments.map((p) => (p.id === id ? (data ? rowToPayment(data) : p) : p)),
    }));
  },

  approvePayment: async (id, ownerNote) => {
    const today = new Date().toISOString();
    const { data, error } = await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_at: today,
        reviewed_at: today,
        owner_note: ownerNote?.trim() ? ownerNote.trim() : null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return fail("Aprobar pago", error);
    set((s) => ({
      payments: s.payments.map((p) => (p.id === id ? (data ? rowToPayment(data) : p) : p)),
    }));
  },

  rejectPayment: async (id, ownerNote) => {
    const { data, error } = await supabase
      .from("payments")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        owner_note: ownerNote.trim(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return fail("Rechazar pago", error);
    set((s) => ({
      payments: s.payments.map((p) => (p.id === id ? (data ? rowToPayment(data) : p) : p)),
    }));
  },
}));



export const getRole = (u: User | null): Role => u?.role ?? "public";

export const getUnitAddress = (unit: Unit, building: Building | undefined): string =>
  unit.addressOverride ?? building?.address ?? "";

export const getUnitCity = (unit: Unit, building: Building | undefined): string =>
  unit.cityOverride ?? building?.city ?? "";
