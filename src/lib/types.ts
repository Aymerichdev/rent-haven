export type Role = "admin" | "owner" | "tenant" | "public";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, "public">;
  avatar?: string;
  createdAt: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  ownerId: string;
  amenityIds: string[];
  description?: string;
  images: string[];
}

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface AmenitySchedule {
  days: WeekDay[];
  openTime: string; // "HH:MM"
  closeTime: string; // "HH:MM"
  slotDurationMinutes: number;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  buildingId: string;
  bookable: boolean;
  description?: string;
  photoUrl?: string;
  capacity?: number;
  schedule?: AmenitySchedule;
}

export interface Meter {
  id: string;
  unitId: string;
  type: "water" | "electricity" | "gas";
  reading: number;
  date: string;
}

/**
 * Unit es la entidad alquilable y publicable (la "propiedad" operativa).
 * Puede pertenecer a un Building (heredando ownerId/city/address) o ser
 * independiente: en ese caso `addressOverride` y `cityOverride` son obligatorios.
 */
export interface Unit {
  id: string;
  /** Opcional: si no hay, la unidad es independiente. */
  buildingId?: string;
  ownerId: string;
  number: string; // único por building (si tiene)
  title: string;
  description: string;
  type: "apartment" | "house" | "studio";
  images: string[];
  bedrooms: number;
  bathrooms: number;
  area: number;
  rent: number;
  status: "available" | "rented" | "maintenance";
  tenantId?: string;
  featured?: boolean;
  /** Sobrescribe (u obliga, si no hay building) la dirección. */
  addressOverride?: string;
  /** Sobrescribe (u obliga, si no hay building) la ciudad. */
  cityOverride?: string;
  /** Cantidad de clicks/vistas recibidas en la página de detalle. */
  clickCount?: number;
}

export interface RentalRequest {
  id: string;
  unitId: string;
  tenantId: string;
  ownerId: string;
  /** Teléfono de contacto del inquilino. */
  phone: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  /** Mensaje del propietario al aprobar/rechazar. */
  ownerResponse?: string;
  nationalId?: string;
  occupation?: string;
  bio?: string;
  recommendations?: string;
  profilePhotoUrl?: string;
  photos?: string[];
  employer?: string;
  workCertificateUrl?: string;
  creditAuth?: boolean;
  createdAt: string;
  /** Fecha de la última actualización (respuesta del owner). */
  updatedAt?: string;
}

export interface AmenityBooking {
  id: string;
  amenityId: string;
  tenantId: string;
  ownerId: string;
  date: string;
  /** Hora de inicio "HH:MM". (Reemplaza al antiguo `time`.) */
  startTime: string;
  /** Hora de fin "HH:MM", calculada según slot. */
  endTime: string;
  /** Compat: alias del antiguo `time`. */
  time?: string;
  notes?: string;
  ownerNote?: string;
  status: "pending" | "approved" | "rejected";
}

export interface Contract {
  id: string;
  unitId: string;
  /** Opcional: el owner puede crear un contrato sin asignar inquilino aún. */
  tenantId?: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: "active" | "ended";
  /** Foto del contrato físico (base64 data URL). */
  contractPhotoUrl?: string;
}

export interface Payment {
  id: string;
  contractId: string;
  tenantId: string;
  month: string; // YYYY-MM
  amount: number;
  utilities: number;
  /**
   * pending: aún no se subió comprobante.
   * validating: el inquilino subió comprobante, pendiente de revisión del owner.
   * paid: el owner aprobó el comprobante.
   * rejected: el owner rechazó el comprobante; el inquilino puede volver a subir.
   * overdue: vencido sin pago.
   */
  status: "pending" | "paid" | "overdue" | "validating" | "rejected";
  paidAt?: string;
  /** Comprobante subido por el inquilino (base64 data URL). Solo el último. */
  receiptDataUrl?: string;
  receiptName?: string;
  receiptType?: string;
  receiptUploadedAt?: string;
  /** Mensaje del owner al aprobar/rechazar. */
  ownerNote?: string;
  /** Fecha de la última revisión del owner. */
  reviewedAt?: string;
}
