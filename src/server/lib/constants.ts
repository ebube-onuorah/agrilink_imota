// Domain constants for FarmLink.
// Centralised here so the database seed, validation schemas, and UI stay in sync.

export const USER_TYPES = ["farmer", "buyer", "admin"] as const;
export type UserType = (typeof USER_TYPES)[number];

export const BUSINESS_TYPES = [
  "retailer",
  "wholesaler",
  "processor",
  "restaurant",
  "institution",
  "individual",
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const QUALITY_GRADES = ["Grade A", "Grade B", "Grade C"] as const;
export type QualityGrade = (typeof QUALITY_GRADES)[number];

export const LISTING_STATUSES = ["active", "sold", "expired", "withdrawn"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const TRANSACTION_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "disputed",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

// Commodity categories (controlled vocabulary — mirrors §3.4.2 of the report).
export const COMMODITY_CATEGORIES = [
  "Fresh Vegetables",
  "Fruits and Berries",
  "Root Crops and Tubers",
  "Grains and Cereals",
  "Legumes",
  "Fish and Seafood",
  "Poultry and Livestock",
  "Other Produce",
] as const;

// Lagos wholesale markets surfaced on the price dashboard (FR-05).
export const LAGOS_MARKETS = ["Mile 12 Market", "Oshodi Market", "Badagry Market"] as const;

// Ikorodu Division LGAs / wards used for farmer location + buyer search (FR-04).
export const STUDY_AREA_LGAS = [
  "Ikorodu",
  "Imota",
  "Ijede",
  "Igbogbo-Bayeku",
  "Ikorodu North",
] as const;

// Allowed transitions for the transaction state machine (FR-07).
export const TRANSACTION_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "disputed"],
  completed: [],
  cancelled: [],
  disputed: ["completed", "cancelled"],
};

export function canTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  return TRANSACTION_TRANSITIONS[from]?.includes(to) ?? false;
}
