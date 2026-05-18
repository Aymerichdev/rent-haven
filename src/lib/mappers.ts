import type {
  Building,
  Unit,
  Amenity,
  Meter,
  RentalRequest,
  AmenityBooking,
  Contract,
  Payment,
  User,
  AmenitySchedule,
} from "./types";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

// ---------------- profiles / users ----------------
export const rowToUser = (r: Tables["profiles"]["Row"]): User => ({
  id: r.id,
  name: r.name,
  email: r.email,
  password: "", // never exposed; kept for type compatibility
  role: r.role,
  avatar: r.avatar ?? undefined,
  createdAt: (r.created_at ?? "").slice(0, 10),
});

// ---------------- buildings ----------------
export const rowToBuilding = (
  r: Tables["buildings"]["Row"],
  amenityIds: string[] = [],
): Building => ({
  id: r.id,
  name: r.name,
  address: r.address,
  city: r.city,
  ownerId: r.owner_id,
  amenityIds,
  description: r.description ?? undefined,
  images: r.images ?? [],
});

export const buildingToInsert = (b: Omit<Building, "id">): Tables["buildings"]["Insert"] => ({
  name: b.name,
  address: b.address,
  city: b.city,
  owner_id: b.ownerId,
  description: b.description ?? null,
  images: b.images ?? [],
});

export const buildingToUpdate = (b: Partial<Building>): Tables["buildings"]["Update"] => {
  const out: Tables["buildings"]["Update"] = {};
  if (b.name !== undefined) out.name = b.name;
  if (b.address !== undefined) out.address = b.address;
  if (b.city !== undefined) out.city = b.city;
  if (b.ownerId !== undefined) out.owner_id = b.ownerId;
  if (b.description !== undefined) out.description = b.description ?? null;
  if (b.images !== undefined) out.images = b.images;
  return out;
};

// ---------------- units ----------------
export const rowToUnit = (r: Tables["units"]["Row"]): Unit => ({
  id: r.id,
  buildingId: r.building_id ?? undefined,
  ownerId: r.owner_id,
  number: r.number,
  title: r.title,
  description: r.description,
  type: r.type as Unit["type"],
  images: r.images ?? [],
  bedrooms: r.bedrooms,
  bathrooms: r.bathrooms,
  area: r.area,
  rent: r.rent,
  status: r.status as Unit["status"],
  tenantId: r.tenant_id ?? undefined,
  featured: r.featured,
  addressOverride: r.address_override ?? undefined,
  cityOverride: r.city_override ?? undefined,
});

export const unitToInsert = (u: Omit<Unit, "id">): Tables["units"]["Insert"] => ({
  building_id: u.buildingId ?? null,
  owner_id: u.ownerId,
  number: u.number,
  title: u.title,
  description: u.description,
  type: u.type,
  images: u.images ?? [],
  bedrooms: u.bedrooms,
  bathrooms: u.bathrooms,
  area: u.area,
  rent: u.rent,
  status: u.status,
  tenant_id: u.tenantId ?? null,
  featured: u.featured ?? false,
  address_override: u.addressOverride ?? null,
  city_override: u.cityOverride ?? null,
});

export const unitToUpdate = (u: Partial<Unit>): Tables["units"]["Update"] => {
  const out: Tables["units"]["Update"] = {};
  if (u.buildingId !== undefined) out.building_id = u.buildingId ?? null;
  if (u.ownerId !== undefined) out.owner_id = u.ownerId;
  if (u.number !== undefined) out.number = u.number;
  if (u.title !== undefined) out.title = u.title;
  if (u.description !== undefined) out.description = u.description;
  if (u.type !== undefined) out.type = u.type;
  if (u.images !== undefined) out.images = u.images;
  if (u.bedrooms !== undefined) out.bedrooms = u.bedrooms;
  if (u.bathrooms !== undefined) out.bathrooms = u.bathrooms;
  if (u.area !== undefined) out.area = u.area;
  if (u.rent !== undefined) out.rent = u.rent;
  if (u.status !== undefined) out.status = u.status;
  if (u.tenantId !== undefined) out.tenant_id = u.tenantId ?? null;
  if (u.featured !== undefined) out.featured = u.featured;
  if (u.addressOverride !== undefined) out.address_override = u.addressOverride ?? null;
  if (u.cityOverride !== undefined) out.city_override = u.cityOverride ?? null;
  return out;
};

// ---------------- amenities ----------------
export const rowToAmenity = (r: Tables["amenities"]["Row"]): Amenity => ({
  id: r.id,
  name: r.name,
  icon: r.icon,
  buildingId: r.building_id,
  bookable: r.bookable,
  description: r.description ?? undefined,
  photoUrl: r.photo_url ?? undefined,
  capacity: r.capacity ?? undefined,
  schedule: (r.schedule as AmenitySchedule | null) ?? undefined,
});

export const amenityToInsert = (a: Omit<Amenity, "id">): Tables["amenities"]["Insert"] => ({
  name: a.name,
  icon: a.icon,
  building_id: a.buildingId,
  bookable: a.bookable,
  description: a.description ?? null,
  photo_url: a.photoUrl ?? null,
  capacity: a.capacity ?? null,
  schedule: a.schedule ? (a.schedule as unknown as Tables["amenities"]["Insert"]["schedule"]) : null,
});

export const amenityToUpdate = (a: Partial<Amenity>): Tables["amenities"]["Update"] => {
  const out: Tables["amenities"]["Update"] = {};
  if (a.name !== undefined) out.name = a.name;
  if (a.icon !== undefined) out.icon = a.icon;
  if (a.buildingId !== undefined) out.building_id = a.buildingId;
  if (a.bookable !== undefined) out.bookable = a.bookable;
  if (a.description !== undefined) out.description = a.description ?? null;
  if (a.photoUrl !== undefined) out.photo_url = a.photoUrl ?? null;
  if (a.capacity !== undefined) out.capacity = a.capacity ?? null;
  if (a.schedule !== undefined)
    out.schedule = a.schedule
      ? (a.schedule as unknown as Tables["amenities"]["Update"]["schedule"])
      : null;
  return out;
};

// ---------------- meters ----------------
export const rowToMeter = (r: Tables["meters"]["Row"]): Meter => ({
  id: r.id,
  unitId: r.unit_id,
  type: r.type as Meter["type"],
  reading: r.reading,
  date: (r.date ?? "").slice(0, 10),
});

export const meterToInsert = (m: Omit<Meter, "id">): Tables["meters"]["Insert"] => ({
  unit_id: m.unitId,
  type: m.type,
  reading: m.reading,
  date: m.date,
});

// ---------------- rental_requests ----------------
export const rowToRequest = (r: Tables["rental_requests"]["Row"]): RentalRequest => {
  const row = r as Tables["rental_requests"]["Row"] & {
    national_id?: string | null;
    occupation?: string | null;
    bio?: string | null;
    recommendations?: string | null;
    profile_photo_url?: string | null;
    photos?: string[] | null;
    employer?: string | null;
    work_certificate_url?: string | null;
    credit_auth?: boolean | null;
  };

  return ({
  id: r.id,
  unitId: r.unit_id,
  tenantId: r.tenant_id,
  ownerId: r.owner_id,
  phone: r.phone,
  message: r.message,
  status: r.status as RentalRequest["status"],
  ownerResponse: r.owner_response ?? undefined,
  nationalId: row.national_id ?? undefined,
  occupation: row.occupation ?? undefined,
  bio: row.bio ?? undefined,
  recommendations: row.recommendations ?? undefined,
  profilePhotoUrl: row.profile_photo_url ?? undefined,
  photos: row.photos ?? undefined,
  employer: row.employer ?? undefined,
  workCertificateUrl: row.work_certificate_url ?? undefined,
  creditAuth: row.credit_auth ?? undefined,
  createdAt: (r.created_at ?? "").slice(0, 10),
  updatedAt: r.updated_at ? r.updated_at.slice(0, 10) : undefined,
});
};

export const requestToInsert = (
  r: Omit<RentalRequest, "id" | "createdAt" | "status" | "ownerResponse" | "updatedAt">,
): Tables["rental_requests"]["Insert"] => ({
  unit_id: r.unitId,
  tenant_id: r.tenantId,
  owner_id: r.ownerId,
  phone: r.phone,
  message: r.message,
});

// ---------------- amenity_bookings ----------------
export const rowToBooking = (r: Tables["amenity_bookings"]["Row"]): AmenityBooking => ({
  id: r.id,
  amenityId: r.amenity_id,
  tenantId: r.tenant_id,
  ownerId: r.owner_id,
  date: r.date,
  startTime: r.start_time,
  endTime: r.end_time,
  notes: r.notes ?? undefined,
  ownerNote: r.owner_note ?? undefined,
  status: r.status as AmenityBooking["status"],
});

export const bookingToInsert = (
  b: Omit<AmenityBooking, "id" | "status">,
): Tables["amenity_bookings"]["Insert"] => ({
  amenity_id: b.amenityId,
  tenant_id: b.tenantId,
  owner_id: b.ownerId,
  date: b.date,
  start_time: b.startTime,
  end_time: b.endTime,
  notes: b.notes ?? null,
});

// ---------------- contracts ----------------
export const rowToContract = (r: Tables["contracts"]["Row"]): Contract => ({
  id: r.id,
  unitId: r.unit_id,
  tenantId: r.tenant_id ?? undefined,
  ownerId: r.owner_id,
  startDate: r.start_date,
  endDate: r.end_date,
  monthlyRent: Number(r.monthly_rent),
  deposit: Number(r.deposit),
  status: r.status as Contract["status"],
  contractPhotoUrl: r.contract_photo_url ?? undefined,
});

export const contractToInsert = (c: Omit<Contract, "id">): Tables["contracts"]["Insert"] => ({
  unit_id: c.unitId,
  tenant_id: c.tenantId ?? null,
  owner_id: c.ownerId,
  start_date: c.startDate,
  end_date: c.endDate,
  monthly_rent: c.monthlyRent,
  deposit: c.deposit,
  status: c.status,
  contract_photo_url: c.contractPhotoUrl ?? null,
});

// ---------------- payments ----------------
export const rowToPayment = (r: Tables["payments"]["Row"]): Payment => ({
  id: r.id,
  contractId: r.contract_id,
  tenantId: r.tenant_id,
  month: r.month,
  amount: Number(r.amount),
  utilities: Number(r.utilities),
  status: r.status as Payment["status"],
  paidAt: r.paid_at ? r.paid_at.slice(0, 10) : undefined,
  receiptDataUrl: r.receipt_url ?? undefined,
  receiptName: r.receipt_name ?? undefined,
  receiptType: r.receipt_type ?? undefined,
  receiptUploadedAt: r.receipt_uploaded_at ? r.receipt_uploaded_at.slice(0, 10) : undefined,
  ownerNote: r.owner_note ?? undefined,
  reviewedAt: r.reviewed_at ? r.reviewed_at.slice(0, 10) : undefined,
});
