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
} from "./types";

// Mock data removed — Supabase is the source of truth now.
// Kept as empty exports for backwards-compatible imports.

export const seedUsers: User[] = [];
export const seedBuildings: Building[] = [];
export const seedUnits: Unit[] = [];
export const seedAmenities: Amenity[] = [];
export const seedMeters: Meter[] = [];
export const seedRequests: RentalRequest[] = [];
export const seedBookings: AmenityBooking[] = [];
export const seedContracts: Contract[] = [];
export const seedPayments: Payment[] = [];
