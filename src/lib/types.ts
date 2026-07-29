export type Intent = "rent" | "buy";
export type PricePeriod = "per_annum" | "per_month" | "outright";
export type PropertyType =
  | "house"
  | "apartment"
  | "duplex"
  | "bungalow"
  | "terrace"
  | "self_contain"
  | "mini_flat"
  | "studio"
  | "land"
  | "commercial";
export type ServicedLevel = "none" | "semi" | "full";
export type Furnishing = "unfurnished" | "semi_furnished" | "furnished";
export type LeaseType = "short_term" | "long_term";
export type ListingStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "hidden"
  | "suspended"
  | "let"
  | "sold"
  | "rejected";

export interface OtherCharge {
  label: string;
  amount: number;
  refundable: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ListingLocation {
  state: string; // slug from NIGERIA_LOCATIONS
  cityLga: string; // slug
  area: string; // slug
  street?: string;
  geoPoint: GeoPoint;
}

export interface Listing {
  id: string;
  landlordId: string;
  intent: Intent;
  title: string;
  price: number; // NGN
  pricePeriod: PricePeriod;
  otherCharges: OtherCharge[];
  location: ListingLocation;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  sizeSqm?: number;
  serviced: ServicedLevel;
  furnishing: Furnishing;
  floor?: number;
  petsAllowed: boolean;
  moveInDate: string; // ISO date
  leaseType: LeaseType;
  powerSupply: string;
  waterSupply: string;
  amenities: string[];
  description: string;
  images: string[]; // Unsplash URLs, min 4
  status: ListingStatus;
  verifiedProperty: boolean;
  createdAt: string; // ISO
  lastConfirmedAvailableAt: string; // ISO
  reconfirmDueAt: string; // ISO — drives "Still available?" prompt
}

export type PersonaId = "anonymous" | "tenant" | "landlord" | "admin";

export type Timeline =
  | "immediate"
  | "within_1_month"
  | "1_3_months"
  | "exploring";
export type PaymentPlan = "full" | "mortgage" | "instalments";

export interface IntentProfile {
  timeline: Timeline;
  paymentPlan: PaymentPlan;
  budgetMin: number;
  budgetMax: number;
}

export interface User {
  id: string;
  personaId: PersonaId;
  name: string;
  identityVerified: boolean; // Trust Layer 2
  landlordVerified: boolean; // Trust Layer 1
  intentProfile?: IntentProfile;
}

export type ApplicationStatus =
  | "submitted"
  | "viewed"
  | "accepted"
  | "declined"
  | "info_requested";

export interface Application {
  id: string;
  listingId: string;
  applicantId: string;
  message: string;
  intentProfile: IntentProfile;
  status: ApplicationStatus;
  createdAt: string; // ISO
}

export interface MessageThread {
  id: string;
  applicationId: string;
  listingId: string;
  participantIds: [string, string]; // [applicantId, landlordId]
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  sentAt: string; // ISO
}

export type ReportCategory = "agent_posing" | "scam_listing" | "spam_user";
export type ReportStatus = "open" | "dismissed" | "actioned";

export interface Report {
  id: string;
  targetListingId: string;
  reporterId: string;
  category: ReportCategory;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export type OwnershipDocType =
  | "c_of_o"
  | "deed_of_assignment"
  | "purchase_receipt"
  | "governors_consent"
  | "family_resolution"
  | "letter_of_administration";

export type VerificationStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "info_requested";

export interface VerificationSubmission {
  id: string;
  landlordId: string;
  landlordName: string;
  nin: string; // mock, display-masked
  propertyAddress: string;
  ownershipDocType: OwnershipDocType;
  legitimacyDoc: "survey_plan" | "luc_receipt" | "none";
  status: VerificationStatus;
  submittedAt: string;
  reviewNote?: string;
}
