# Hecta Platform (Mock-Data MVP Prototype) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Hecta MVP surface (seeker marketplace, landlord dashboard, admin console) as a clickable prototype driven entirely by typed mock data and one persisted Zustand store — per the approved spec at `docs/superpowers/specs/2026-07-29-hecta-platform-design.md`.

**Architecture:** Top-level routes in three shells — `(platform)` seeker, `/dashboard` landlord, `/admin` admin — all reading/writing one Zustand store (persist middleware) seeded from `src/lib/mock/`. Pure domain logic lives in `src/lib/marketplace.ts` (unit tested). Shells and static chrome are server components; interactive regions are client feature components under `src/features/`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4 (tokens already in `globals.css`), shadcn/ui (components.json already configured, phosphor icons), Zustand v5 + persist, React Hook Form + Zod, Leaflet + react-leaflet (OpenStreetMap tiles), Vitest.

## Global Constraints

- Landing page (`src/app/page.tsx` and `src/components/landing/*`) is **UNTOUCHED**. Nothing on it may link to platform routes.
- Folder structure per CLAUDE.md: routing in `src/app/`, generic UI in `src/components/ui/`, shells in `src/components/layout/`, domain components in `src/features/`, hooks in `src/hooks/`, helpers in `src/lib/`, constants in `src/constants/`.
- Tailwind token colors only (`bg-primary-500`, `text-ink`, `bg-paper`…) — **no** arbitrary hex/oklch values in components.
- TypeScript strict; no `any`; no uncommented `as`; interfaces for object shapes.
- All external inputs (URL searchParams, form values) parsed through Zod before use.
- `next/image` for all images (Unsplash remote). Every image has meaningful `alt`.
- Semantic HTML; every input labelled; 44px touch targets; mobile-first (`md:`/`lg:` scale-ups).
- No `console.log`; no commented-out code; no magic numbers (named constants in `src/constants/`).
- Currency display: NGN via `Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })`.
- Package manager is **pnpm**. Verify each task with `pnpm typecheck && pnpm lint` before committing.
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

**Phases:** 0 Foundation → 1 Data core → 2 Seeker → 3 Landlord → 4 Admin → 5 Polish. Phases 3 and 4 are independent of each other after Phase 2.

---

## Phase 0 — Foundation

### Task 1: Dependencies, shadcn components, test runner, image config

**Files:**
- Modify: `package.json` (via pnpm), `next.config.ts`
- Create: `vitest.config.ts`, `src/components/ui/*` (generated)

**Interfaces:**
- Produces: all shadcn primitives under `@/components/ui/*`; `pnpm test` runs Vitest; `images.unsplash.com` allowed in `next/image`.

- [ ] **Step 1: Install dependencies**

```bash
pnpm add zod @hookform/resolvers leaflet react-leaflet
pnpm add -D vitest @types/leaflet
```

- [ ] **Step 2: Add shadcn components** (components.json already exists — do NOT re-init)

```bash
pnpm dlx shadcn@latest add button input select dialog sheet tabs badge card avatar dropdown-menu slider checkbox radio-group switch form textarea table separator skeleton tooltip sonner popover progress label
```

Expected: files appear in `src/components/ui/`. If the CLI asks about overwriting `utils.ts`, keep the existing file.

- [ ] **Step 3: Configure Vitest and test script**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 4: Allow Unsplash images in `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Emit a minimal self-contained server bundle for Docker deployment.
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
```

- [ ] **Step 5: Verify**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: typecheck passes; lint passes (run `pnpm format` if shadcn output needs formatting); Vitest reports "no test files found" exit 0 (or add a trivial placeholder test in Task 4 — acceptable for this step if exit code is non-zero, note it and move on).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: add platform deps, shadcn primitives, vitest"
```

---

## Phase 1 — Data core

### Task 2: Domain types and location taxonomy

**Files:**
- Create: `src/lib/types.ts`, `src/constants/locations.ts`, `src/constants/marketplace.ts`

**Interfaces:**
- Produces: every domain type used by the rest of the plan (exact names below); `NIGERIA_LOCATIONS` taxonomy; marketplace constants.

- [ ] **Step 1: Write `src/lib/types.ts`** (complete file)

```ts
export type Intent = "rent" | "buy";
export type PricePeriod = "per_annum" | "per_month" | "outright";
export type PropertyType =
  | "house" | "apartment" | "duplex" | "bungalow" | "terrace"
  | "self_contain" | "mini_flat" | "studio" | "land" | "commercial";
export type ServicedLevel = "none" | "semi" | "full";
export type Furnishing = "unfurnished" | "semi_furnished" | "furnished";
export type LeaseType = "short_term" | "long_term";
export type ListingStatus =
  | "draft" | "pending_review" | "active" | "hidden"
  | "suspended" | "let" | "sold" | "rejected";

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
  state: string;   // slug from NIGERIA_LOCATIONS
  cityLga: string; // slug
  area: string;    // slug
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

export type Timeline = "immediate" | "within_1_month" | "1_3_months" | "exploring";
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
  | "submitted" | "viewed" | "accepted" | "declined" | "info_requested";

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
  | "c_of_o" | "deed_of_assignment" | "purchase_receipt"
  | "governors_consent" | "family_resolution" | "letter_of_administration";

export type VerificationStatus =
  | "submitted" | "under_review" | "approved" | "rejected" | "info_requested";

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
```

- [ ] **Step 2: Write `src/constants/locations.ts`**

Structure (fill all rows shown — this is the complete taxonomy for the prototype):

```ts
export interface AreaDef { slug: string; label: string; }
export interface CityDef { slug: string; label: string; areas: AreaDef[]; }
export interface StateDef { slug: string; label: string; cities: CityDef[]; }

export const NIGERIA_LOCATIONS: StateDef[] = [
  {
    slug: "lagos", label: "Lagos",
    cities: [
      { slug: "eti-osa", label: "Eti-Osa", areas: [
        { slug: "lekki-phase-1", label: "Lekki Phase 1" },
        { slug: "ikate", label: "Ikate" },
        { slug: "vi", label: "Victoria Island" },
        { slug: "ikoyi", label: "Ikoyi" },
        { slug: "ajah", label: "Ajah" },
        { slug: "oniru", label: "Oniru" },
      ]},
      { slug: "ikeja", label: "Ikeja", areas: [
        { slug: "gra-ikeja", label: "Ikeja GRA" },
        { slug: "opebi", label: "Opebi" },
        { slug: "allen", label: "Allen Avenue" },
      ]},
      { slug: "yaba", label: "Yaba (Lagos Mainland)", areas: [
        { slug: "akoka", label: "Akoka" },
        { slug: "alagomeji", label: "Alagomeji" },
        { slug: "sabo", label: "Sabo" },
      ]},
      { slug: "surulere", label: "Surulere", areas: [
        { slug: "adeniran-ogunsanya", label: "Adeniran Ogunsanya" },
        { slug: "bode-thomas", label: "Bode Thomas" },
      ]},
      { slug: "kosofe", label: "Kosofe", areas: [
        { slug: "gbagada", label: "Gbagada" },
        { slug: "ogudu", label: "Ogudu GRA" },
      ]},
    ],
  },
  {
    slug: "abuja", label: "Abuja (FCT)",
    cities: [
      { slug: "amac", label: "AMAC", areas: [
        { slug: "wuse-2", label: "Wuse 2" },
        { slug: "maitama", label: "Maitama" },
        { slug: "gwarinpa", label: "Gwarinpa" },
        { slug: "jabi", label: "Jabi" },
      ]},
    ],
  },
];

export function stateBySlug(slug: string): StateDef | undefined { /* find */ }
export function cityBySlug(state: string, city: string): CityDef | undefined { /* find via stateBySlug */ }
export function locationLabel(state: string, city: string, area: string): string { /* "Lekki Phase 1, Eti-Osa" */ }
```

Implement the three helpers with plain `.find()` chains (no placeholder comments in the real file).

- [ ] **Step 3: Write `src/constants/marketplace.ts`**

```ts
export const DAILY_APPLICATION_LIMIT = 5;
export const MONTHLY_APPLICATION_LIMIT = 30;
export const AUTO_SUSPEND_REPORT_COUNT = 3;
export const RECONFIRM_INTERVAL_DAYS = 60;
export const RECONFIRM_GRACE_DAYS = 7;
export const RESULTS_PER_PAGE = 12;
export const SUSPICIOUS_PRICE_HIGH_RATIO = 1.6;
export const SUSPICIOUS_PRICE_LOW_RATIO = 0.4;
export const MIN_COMPARABLES_FOR_PRICE_CHECK = 3;
export const MIN_LISTING_IMAGES = 4;
export const DESCRIPTION_MIN_CHARS = 50;
export const DESCRIPTION_MAX_CHARS = 2000;

export const PROPERTY_TYPE_LABELS: Record<import("@/lib/types").PropertyType, string> = {
  house: "House", apartment: "Apartment / Flat", duplex: "Duplex",
  bungalow: "Bungalow", terrace: "Terrace", self_contain: "Self-contain",
  mini_flat: "Mini-flat", studio: "Studio", land: "Land", commercial: "Commercial",
};

export const AMENITY_OPTIONS = [
  "Generator", "Parking", "Security", "Gym", "Pool", "Borehole",
  "POP ceiling", "Fitted kitchen", "Wardrobe", "Air conditioning",
  "Elevator", "Estate/gated",
] as const;
```

- [ ] **Step 4: Verify** — `pnpm typecheck && pnpm lint`

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: domain types, location taxonomy, marketplace constants"`

### Task 3: Mock seed data

**Files:**
- Create: `src/lib/mock/images.ts`, `src/lib/mock/users.ts`, `src/lib/mock/listings.ts`, `src/lib/mock/activity.ts`, `src/lib/mock/index.ts`

**Interfaces:**
- Consumes: types from Task 2.
- Produces: `MOCK_USERS: User[]` (ids `"anonymous" | "user-tunde" | "user-amaka" | "user-admin"`), `MOCK_LISTINGS: Listing[]` (~36), `MOCK_APPLICATIONS: Application[]`, `MOCK_THREADS: MessageThread[]`, `MOCK_MESSAGES: ChatMessage[]`, `MOCK_REPORTS: Report[]`, `MOCK_VERIFICATIONS: VerificationSubmission[]`, `LISTING_PHOTO_POOL: string[][]`.

- [ ] **Step 1: `src/lib/mock/images.ts`** — 10 photo sets of 5 Unsplash URLs each (`LISTING_PHOTO_POOL: string[][]`). Use stable Unsplash photo URLs of house exteriors/interiors in the form `https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=1200&q=70`. Pick real photo IDs (e.g. from the Unsplash "architecture/interiors" collections); verify each returns 200 with `curl -sI` before committing.

- [ ] **Step 2: `src/lib/mock/users.ts`**

```ts
import type { User } from "@/lib/types";

export const MOCK_USERS: User[] = [
  { id: "anonymous", personaId: "anonymous", name: "Guest", identityVerified: false, landlordVerified: false },
  {
    id: "user-tunde", personaId: "tenant", name: "Tunde Bakare",
    identityVerified: true, landlordVerified: false,
    intentProfile: { timeline: "within_1_month", paymentPlan: "full", budgetMin: 1_500_000, budgetMax: 4_000_000 },
  },
  { id: "user-amaka", personaId: "landlord", name: "Amaka Obi", identityVerified: true, landlordVerified: true },
  { id: "user-admin", personaId: "admin", name: "Hecta Admin", identityVerified: true, landlordVerified: false },
];
```

Also export two extra seeker users (`user-chidi`, `user-fatima`, personaId `"tenant"`, verified, with intent profiles) used as authors of seeded applications, and one extra landlord `user-emeka` (verified: false — owns the pending verification submission).

- [ ] **Step 3: `src/lib/mock/listings.ts`** — author all ~36 listings with a local helper:

```ts
let seq = 0;
function listing(partial: Omit<Listing, "id" | "createdAt" | "lastConfirmedAvailableAt" | "reconfirmDueAt"> & { daysOld: number; freshDaysAgo: number }): Listing { /* builds dates from fixed BASE_DATE */ }
const BASE_DATE = new Date("2026-07-29T09:00:00+01:00");
```

Dates derive from `BASE_DATE` minus `daysOld`/`freshDaysAgo`; `reconfirmDueAt = lastConfirmedAvailableAt + RECONFIRM_INTERVAL_DAYS`. Author this exact inventory (title · intent · type · area · price NGN · beds/baths/toilets · status · owner):

| # | Title | Intent | Type | Area | Price | B/Ba/T | Status | Owner |
|---|---|---|---|---|---|---|---|---|
| 1 | Bright 2-Bed Flat off Admiralty Way | rent | apartment | lekki-phase-1 | 3,500,000/yr | 2/2/3 | active | user-amaka |
| 2 | Serviced 3-Bed with Pool, Ikate | rent | apartment | ikate | 6,000,000/yr | 3/3/4 | active | user-amaka |
| 3 | Waterfront Studio, Oniru | rent | studio | oniru | 2,800,000/yr | 1/1/1 | active | ll-seed-1 |
| 4 | Classic Mini-flat, Alagomeji | rent | mini_flat | alagomeji | 1,200,000/yr | 1/1/2 | active | ll-seed-1 |
| 5 | Self-contain near UNILAG, Akoka | rent | self_contain | akoka | 750,000/yr | 1/1/1 | active | ll-seed-2 |
| 6 | Family Duplex, Ikeja GRA | rent | duplex | gra-ikeja | 9,500,000/yr | 4/4/5 | active | ll-seed-2 |
| 7–30 | *(24 more `active` rentals & sales spread across all areas incl. Abuja; vary furnishing/serviced/pets/lease; 6 of them `intent: "buy"` outright sales incl. 2 `land`)* | | | | | | active | seed landlords |
| 31 | Overpriced 2-Bed, Akoka | rent | apartment | akoka | 5,000,000/yr | 2/2/2 | pending_review | user-emeka |
| 32 | New 3-Bed Terrace, Ajah | rent | terrace | ajah | 2,900,000/yr | 3/3/3 | pending_review | user-amaka |
| 33 | 4-Bed Semi-detached, Gwarinpa | buy | house | gwarinpa | 120,000,000 | 4/4/5 | pending_review | ll-seed-3 |
| 34 | Suspicious "Luxury" Flat, Sabo | rent | apartment | sabo | 900,000/yr | 3/3/3 | suspended | ll-seed-3 |
| 35 | Cozy Room, Bode Thomas | rent | self_contain | bode-thomas | 800,000/yr | 1/1/1 | hidden | user-amaka |
| 36 | 2-Bed Flat, Gbagada (let) | rent | apartment | gbagada | 2,200,000/yr | 2/2/2 | let | user-amaka |

Row 7–30 details are the implementer's to author **within these constraints**: every listing has ≥4 images from `LISTING_PHOTO_POOL[i % 10]`, a 50–200 word description, 3–6 amenities from `AMENITY_OPTIONS`, real coordinates inside its area (look up approximate lat/lng per area once and jitter ±0.005), and `otherCharges`: rentals get `[{label:"Agency fee", amount: 10% of price, refundable:false},{label:"Legal fee", amount: 5%, refundable:false},{label:"Caution deposit", amount: 10%, refundable:true}]` (serviced listings add `{label:"Service charge", amount: 500_000–1_500_000, refundable:false}`); sales get `[{label:"Legal & survey", amount: 2%, refundable:false},{label:"Agency fee", amount: 5%, refundable:false}]`. Round amounts to whole thousands. `verifiedProperty: true` for all except rows 31 and 34 (false). Listing 31 is deliberately priced ~1.6× above its comparables (rows 5, and two other Akoka/Yaba 2-beds you author in 7–30 at ~₦1.4–1.6M) so the suspicious-price flag fires. Add 3 seed landlord users (`ll-seed-1..3`, personaId `"landlord"`, verified) to `users.ts`.

- [ ] **Step 4: `src/lib/mock/activity.ts`** — seed:
  - `MOCK_APPLICATIONS`: 4 applications to Amaka's listing #1 and #2 from `user-chidi`/`user-fatima` with differing intent profiles (one `immediate`/full-payment high budget, one `exploring` low budget — so qualification sorting is visible), statuses `submitted`/`viewed`.
  - `MOCK_THREADS` + `MOCK_MESSAGES`: one thread on the accepted-track application with 4 messages back and forth.
  - `MOCK_REPORTS`: 3 open reports (distinct reporters) against listing #34 (auto-suspended), 1 open report against listing #3.
  - `MOCK_VERIFICATIONS`: one `approved` (Amaka, `c_of_o`), one `submitted` (user-emeka, `family_resolution`, for listing #31's address), one `info_requested` (ll-seed-3, `purchase_receipt`).

- [ ] **Step 5: `src/lib/mock/index.ts`** — re-export everything.

- [ ] **Step 6: Verify** — `pnpm typecheck && pnpm lint`; spot-check 3 image URLs return 200.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: mock seed data (listings, users, activity)"`

### Task 4: Marketplace pure functions (TDD)

**Files:**
- Create: `src/lib/marketplace.ts`, `src/lib/marketplace.test.ts`

**Interfaces:**
- Consumes: types (Task 2), constants (Task 2).
- Produces (exact signatures — later tasks import these):

```ts
export interface CostBreakdown { price: number; nonRefundable: number; refundable: number; total: number; }
export function costBreakdown(listing: Listing): CostBreakdown;
export function totalMoveInCost(listing: Listing): number; // costBreakdown().total

export interface ListingFilters {
  intent: Intent;
  state?: string; cityLga?: string; areas?: string[];
  priceMin?: number; priceMax?: number;
  propertyTypes?: PropertyType[];
  bedroomsMin?: number; bathroomsMin?: number;
  furnishing?: Furnishing; serviced?: ServicedLevel;
  petsAllowed?: boolean; leaseType?: LeaseType;
  amenities?: string[];
  verifiedOnly?: boolean; // default true at call sites
}
export function filterListings(listings: Listing[], filters: ListingFilters): Listing[]; // only "active" pass
export type SortKey = "newest" | "price_asc" | "price_desc" | "freshness";
export function sortListings(listings: Listing[], sort: SortKey): Listing[];
export function paginate<T>(items: T[], page: number, perPage: number): { items: T[]; totalPages: number; total: number };

export function remainingQuota(applications: Application[], applicantId: string, nowIso: string): { day: number; month: number };
export function qualificationScore(profile: IntentProfile, listing: Listing): number; // 0–100
export function sortApplicationsByQualification(apps: Application[], listings: Listing[]): Application[];
export function isSuspiciousPrice(listing: Listing, all: Listing[]): boolean;
export function shouldAutoSuspend(reports: Report[], listingId: string): boolean;
export function isReconfirmDue(listing: Listing, nowIso: string): boolean;
export function similarListings(listing: Listing, all: Listing[], limit: number): Listing[]; // same intent, same cityLga, active, not self; nearest by |price - listing.price|
```

- [ ] **Step 1: Write failing tests** (`src/lib/marketplace.test.ts`). Build tiny inline fixtures with a local `makeListing(overrides)` helper — do NOT import the full mock seed. Cover at minimum:

```ts
import { describe, expect, it } from "vitest";
// costBreakdown: price 1_000_000 + charges [{100k nonref},{50k ref}] → { nonRefundable: 100_000, refundable: 50_000, total: 1_150_000 }
// filterListings: excludes non-active; excludes verifiedProperty=false when verifiedOnly; areas multi-select ORs; priceMin/Max inclusive; bedroomsMin is >=
// sortListings: price_asc ascending; freshness by lastConfirmedAvailableAt desc; newest by createdAt desc
// paginate: 25 items, perPage 12 → totalPages 3; page 3 has 1 item; page out of range clamps to last page
// remainingQuota: 5 apps today (WAT) → day 0; app at 2026-07-28T23:30:00Z (= 00:30 WAT Jul 29) counts toward Jul 29 WAT day; month cap 30
// qualificationScore: immediate+full+budgetMax>=total → 100; exploring+instalments+budgetMax<0.8*total → 13
// sortApplicationsByQualification: higher score first
// isSuspiciousPrice: <3 comparables → false; price 1.7× median of 3 comparables → true; 0.3× median → true; 1.2× → false
// shouldAutoSuspend: 3 open reports distinct reporters → true; 3 reports same reporter → false; 2 open + 1 dismissed → false
// isReconfirmDue: now past reconfirmDueAt → true
// similarListings: never includes self; respects limit; same cityLga only
```

Write each comment above as a real test with concrete fixture values and exact expected numbers.

- [ ] **Step 2: Run tests, verify they fail** — `pnpm test` → FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/marketplace.ts`.** Key implementations:

```ts
const WAT_OFFSET_MS = 60 * 60 * 1000; // Africa/Lagos is UTC+1 year-round (no DST)
function watDayKey(iso: string): string {
  return new Date(new Date(iso).getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);
}
export function remainingQuota(applications: Application[], applicantId: string, nowIso: string) {
  const mine = applications.filter((a) => a.applicantId === applicantId);
  const day = mine.filter((a) => watDayKey(a.createdAt) === watDayKey(nowIso)).length;
  const month = mine.filter((a) => watDayKey(a.createdAt).slice(0, 7) === watDayKey(nowIso).slice(0, 7)).length;
  return {
    day: Math.max(0, DAILY_APPLICATION_LIMIT - day),
    month: Math.max(0, MONTHLY_APPLICATION_LIMIT - month),
  };
}

export function qualificationScore(profile: IntentProfile, listing: Listing): number {
  const timeline: Record<Timeline, number> = { immediate: 40, within_1_month: 30, "1_3_months": 15, exploring: 5 };
  const payment: Record<PaymentPlan, number> = { full: 20, mortgage: 12, instalments: 8 };
  const total = totalMoveInCost(listing);
  const budget = profile.budgetMax >= total ? 40 : profile.budgetMax >= total * 0.8 ? 20 : 0;
  return timeline[profile.timeline] + budget + payment[profile.paymentPlan];
}

export function isSuspiciousPrice(listing: Listing, all: Listing[]): boolean {
  const comps = all.filter((l) =>
    l.id !== listing.id && l.intent === listing.intent &&
    l.propertyType === listing.propertyType && l.location.cityLga === listing.location.cityLga,
  );
  if (comps.length < MIN_COMPARABLES_FOR_PRICE_CHECK) return false;
  const prices = comps.map((c) => c.price).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  return listing.price > median * SUSPICIOUS_PRICE_HIGH_RATIO || listing.price < median * SUSPICIOUS_PRICE_LOW_RATIO;
}
```

`filterListings` applies each defined filter conjunctively (undefined = skip); `status === "active"` always required; `verifiedOnly` filters on `verifiedProperty`. `shouldAutoSuspend` counts **distinct** reporterIds among `status === "open"` reports for the listing.

- [ ] **Step 4: Run tests, verify all pass** — `pnpm test`.

- [ ] **Step 5: Verify + commit** — `pnpm typecheck && pnpm lint`; `git add -A && git commit -m "feat: marketplace domain logic with unit tests"`

### Task 5: Zustand store and session hooks

**Files:**
- Create: `src/lib/store.ts`, `src/hooks/use-session.ts`, `src/hooks/use-hydrated.ts`
- Create: `src/lib/format.ts`

**Interfaces:**
- Consumes: mock seed (Task 3), marketplace functions (Task 4).
- Produces:

```ts
// src/lib/store.ts
export interface HectaState {
  activeUserId: string; // "anonymous" default
  users: User[];
  listings: Listing[];
  savedByUser: Record<string, string[]>; // userId -> listingIds
  applications: Application[];
  threads: MessageThread[];
  messages: ChatMessage[];
  reports: Report[];
  verifications: VerificationSubmission[];
  // actions
  switchPersona: (userId: string) => void;
  completeIdentityVerification: () => void; // marks active user identityVerified
  setIntentProfile: (profile: IntentProfile) => void;
  toggleSaved: (listingId: string) => void;
  submitApplication: (listingId: string, message: string) => void; // stamps now, attaches profile
  markApplicationStatus: (applicationId: string, status: ApplicationStatus) => void; // creates thread on "accepted"/"info_requested" if absent
  sendMessage: (threadId: string, body: string) => void;
  ensureThreadForApplication: (applicationId: string) => string; // returns threadId
  submitReport: (listingId: string, category: ReportCategory, reason: string) => void; // applies shouldAutoSuspend
  createListing: (listing: Omit<Listing, "id" | "createdAt" | "lastConfirmedAvailableAt" | "reconfirmDueAt" | "status" | "verifiedProperty">) => string; // status "pending_review"
  setListingStatus: (listingId: string, status: ListingStatus) => void;
  confirmAvailability: (listingId: string) => void; // bumps freshness + reconfirmDueAt
  submitVerification: (v: Omit<VerificationSubmission, "id" | "status" | "submittedAt">) => void;
  reviewVerification: (id: string, status: VerificationStatus, note?: string) => void; // "approved" sets landlordVerified on owner
  reviewListing: (listingId: string, approve: boolean, note?: string) => void; // active | rejected
  resolveReport: (reportId: string, status: ReportStatus) => void;
  resetDemo: () => void; // restore seed
}
export const useHectaStore: UseBoundStore<...>; // create<HectaState>()(persist(..., { name: "hecta-demo", version: 1 }))

// src/hooks/use-hydrated.ts
export function useHydrated(): boolean; // true after persist rehydration (onRehydrateStorage flag)

// src/hooks/use-session.ts
export function useSession(): { user: User; isAnonymous: boolean; isIdentityVerified: boolean; isLandlordVerified: boolean };

// src/lib/format.ts
export function formatNaira(amount: number): string;
export function formatDate(iso: string): string;      // "12 Jul 2026" via Intl.DateTimeFormat("en-NG")
export function formatRelativeDays(iso: string, nowIso?: string): string; // "3 days ago" via Intl.RelativeTimeFormat
export function pricePeriodLabel(period: PricePeriod): string; // "/year" | "/month" | ""
```

- [ ] **Step 1:** Implement store with `persist` (localStorage). Seed initial state from `src/lib/mock`. Use a `_hasHydrated` boolean + `onRehydrateStorage` to flag hydration; `useHydrated` reads it. IDs: `crypto.randomUUID()`. Timestamps: `new Date().toISOString()` inside actions.
- [ ] **Step 2:** `resetDemo` restores the full seed and returns persona to `anonymous`. Bump `version` if seed shape changes later (migrate = reset).
- [ ] **Step 3:** Implement `use-session.ts` and `format.ts`; add unit tests for `format.ts` pure functions in `src/lib/format.test.ts` (naira formatting includes ₦ and no decimals; relative days for 3-day gap).
- [ ] **Step 4:** `pnpm test && pnpm typecheck && pnpm lint`.
- [ ] **Step 5:** Commit — `feat: hecta store, session hooks, formatters`.

---

## Phase 2 — Seeker surface

### Task 6: Platform shell, header, persona switcher

**Files:**
- Create: `src/app/(platform)/layout.tsx`, `src/components/layout/platform-header.tsx`, `src/features/session/persona-switcher.tsx`, `src/features/session/reset-demo-button.tsx`
- Create: `src/lib/search-params.ts`

**Interfaces:**
- Consumes: `useHectaStore`, `useSession`, `useHydrated`.
- Produces: `(platform)` shell wrapping all seeker routes; `searchParamsSchema` + `SearchQuery` type used by Tasks 7–9; `PersonaSwitcher` (client) reused by dashboard/admin shells.

- [ ] **Step 1: `src/lib/search-params.ts`** — Zod schema for `/search` params:

```ts
import { z } from "zod";
export const searchParamsSchema = z.object({
  intent: z.enum(["rent", "buy"]).default("rent"),
  state: z.string().optional(),
  city: z.string().optional(),
  areas: z.string().transform((s) => s.split(",").filter(Boolean)).optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().positive().optional(),
  types: z.string().transform((s) => s.split(",").filter(Boolean)).optional(),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().int().min(0).optional(),
  furnishing: z.enum(["unfurnished", "semi_furnished", "furnished"]).optional(),
  serviced: z.enum(["none", "semi", "full"]).optional(),
  pets: z.coerce.boolean().optional(),
  lease: z.enum(["short_term", "long_term"]).optional(),
  amenities: z.string().transform((s) => s.split(",").filter(Boolean)).optional(),
  verifiedOnly: z.coerce.boolean().default(true),
  sort: z.enum(["newest", "price_asc", "price_desc", "freshness"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  view: z.enum(["grid", "list"]).default("grid"),
  map: z.coerce.boolean().default(true),
});
export type SearchQuery = z.infer<typeof searchParamsSchema>;
export function parseSearchParams(raw: Record<string, string | string[] | undefined>): SearchQuery; // safeParse; on failure return schema defaults (log nothing)
export function buildSearchUrl(query: Partial<SearchQuery>, base?: SearchQuery): string; // merges + serializes back to /search?...
```

Note on validation rule: search params are UI state, not trusted input crossing a privilege boundary — invalid values fall back to defaults via `safeParse` rather than throwing, so a mangled URL still renders the entry state.

- [ ] **Step 2: Platform header** (client component): left — Hecta wordmark (text, `font-heading`, links to `/search`, NOT `/`); center — Rent/Buy `Tabs` bound to `intent` param via `buildSearchUrl`; right — Saved (heart icon → `/saved`), Applications icon → `/applications`, Messages icon → `/messages`, then `PersonaSwitcher`. Mobile: icons collapse into the avatar dropdown.
- [ ] **Step 3: `PersonaSwitcher`** — shadcn `DropdownMenu` on an `Avatar` (initials). Items: the four personas with role captions; checkmark on active; on select `switchPersona(id)` then `router.push` persona home (`anonymous`/`tenant` → `/search`, `landlord` → `/dashboard`, `admin` → `/admin`) via a `PERSONA_HOME: Record<PersonaId, string>` constant; separator; "Reset demo data" item (`resetDemo` + toast). Until `useHydrated()`, render a `Skeleton` avatar.
- [ ] **Step 4: `(platform)/layout.tsx`** (server): `<div className="min-h-dvh bg-paper">` → `<PlatformHeader />` sticky top with `border-b bg-background/80 backdrop-blur` → `<main>{children}</main>` → mount `<Toaster />` (sonner).
- [ ] **Step 5:** Visual check: `pnpm dev`, visit `/search` (404 is fine — layout not yet exercised; alternatively temporarily view via Task 7). Verify `/` landing unchanged and has no new links. `pnpm typecheck && pnpm lint`.
- [ ] **Step 6:** Commit — `feat: platform shell, header, persona switcher`.

### Task 7: Search entry state (intent + location cascade)

**Files:**
- Create: `src/app/(platform)/search/page.tsx`, `src/features/search/search-entry.tsx`

**Interfaces:**
- Consumes: `parseSearchParams`, `NIGERIA_LOCATIONS`, `buildSearchUrl`.
- Produces: `/search` route that renders `SearchEntry` when `state`/`city` are missing, else `SearchResults` (Task 8 — until then render a `<p>` count of matching listings as a placeholder that Task 8 replaces).

- [ ] **Step 1: `search/page.tsx`** (server component):

```tsx
export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseSearchParams(await searchParams);
  const hasLocation = Boolean(query.state && query.city);
  return hasLocation ? <SearchResults query={query} /> : <SearchEntry query={query} />;
}
```

(Next 16: `searchParams` is a Promise — await it.)

- [ ] **Step 2: `SearchEntry`** (client): centered hero section (`max-w-2xl mx-auto`) — h1 "Find a home you can trust" (`font-heading`), large Rent/Buy segmented toggle (two big `Button`s, `variant` toggles), then cascading selects: State (`Select` over `NIGERIA_LOCATIONS`), City/LGA (`Select`, enabled after state), Areas (multi-select via `Popover` + `Checkbox` list with pill summary, optional), CTA `Browse homes` → `router.push(buildSearchUrl({...}))` — disabled until state+city chosen. Sub-copy under CTA: "Browsing is open — no account needed."
- [ ] **Step 3:** Visual check at `/search`: cascade works, CTA navigates to `/search?intent=rent&state=lagos&city=eti-osa` and shows the temporary results count. Mobile viewport check.
- [ ] **Step 4:** `pnpm typecheck && pnpm lint`; commit — `feat: search entry with intent + location cascade`.

### Task 8: Search results — cards, filters, sort, pagination

**Files:**
- Create: `src/features/search/search-results.tsx`, `src/features/search/listing-card.tsx`, `src/features/search/filters-sheet.tsx`, `src/features/search/quick-filters.tsx`, `src/features/search/results-toolbar.tsx`
- Modify: `src/app/(platform)/search/page.tsx` (drop Task 7's temporary count)

**Interfaces:**
- Consumes: `SearchQuery`, `filterListings`, `sortListings`, `paginate`, store listings, `formatNaira`, `totalMoveInCost`, `locationLabel`, `useHydrated`.
- Produces: `SearchResults({ query })` (client), `ListingCard({ listing, view })` (reused by `/saved` and similar-listings), URL-driven filter state (all filter changes go through `router.push(buildSearchUrl(...))` — the URL is the single source of truth; page resets to 1 on any filter change).

- [ ] **Step 1: `ListingCard`** — `Card` wrapping `<article>`: `next/image` primary photo (`aspect-[4/3]`, `sizes` set, lazy), overlay top-left `Badge` "Verified" (green, ShieldCheck icon) when `verifiedProperty`, top-right save-heart `Button` (uses `toggleSaved`; if anonymous, opens gate dialog — wired in Task 11, until then plain toggle); body: price line `formatNaira(price) + pricePeriodLabel`, muted "₦X total move-in", title (line-clamp-1), `beds bd · baths ba · toilets t · TYPE_LABEL`, location label, footer muted "Confirmed available {formatRelativeDays}". `view === "list"` renders horizontal (image left `w-64`, content right) via flex. Whole card links to `/listings/[id]`.
- [ ] **Step 2: `QuickFilters`** — pill row (horizontal scroll on mobile): price `Popover` (min/max inputs + Apply), type `Popover` (checkbox list), beds `Popover` (0–5+ radio), verified-only `Switch` pill, "All filters" `Button` opening the sheet.
- [ ] **Step 3: `FiltersSheet`** — shadcn `Sheet` (right, full-height, `overflow-y-auto`) with every filter: price min/max `Input`s, property type checkboxes, bedrooms/bathrooms min steppers, furnishing/serviced/lease `RadioGroup`s, pets `Switch`, move-in date `Input type="date"`, amenities checkboxes, verified-only `Switch` (default on). Footer: result-count `Button` "Show N homes" + "Clear all". Local RHF state; Apply serializes once to URL.
- [ ] **Step 4: `ResultsToolbar`** — breadcrumb-ish location label + "N homes", sort `Select`, grid/list `Tabs` (icon-only, aria-labels), map show/hide `Switch` (labelled "Map"), edit-location `Button` (returns to entry state preserving intent).
- [ ] **Step 5: `SearchResults`** — composes toolbar, quick filters, then `lg:grid lg:grid-cols-[1fr_minmax(380px,42%)]`: left = card grid (`grid gap-4 sm:grid-cols-2` in grid view, stacked in list view) + `Pagination` (12/page); right = map placeholder `div` (Task 9 fills it; render `Skeleton` for now) hidden when `map=false` or below `lg`. Empty state: `SmileySad` phosphor icon, "No homes match these filters", "Clear filters" button. Until `useHydrated()`, render 8 `Skeleton` cards.
- [ ] **Step 6:** Visual check: filters narrow results and update URL; back/forward navigation restores state; pagination clamps; verified-only ON hides listing 31/34 even if other filters match (they're non-active anyway — confirm via toggling). Mobile: sheet filters, pill scroll.
- [ ] **Step 7:** `pnpm typecheck && pnpm lint`; commit — `feat: search results with filters, sort, pagination`.

### Task 9: Map (split view)

**Files:**
- Create: `src/features/search/listing-map.tsx`, `src/features/search/listing-map-inner.tsx`
- Modify: `src/features/search/search-results.tsx` (replace map placeholder)

**Interfaces:**
- Consumes: filtered listings array (already computed in `SearchResults`), `formatNaira`.
- Produces: `ListingMap({ listings, activeId?, onPinClick? })` — dynamic wrapper safe to render anywhere client-side.

- [ ] **Step 1: `listing-map-inner.tsx`** (the real Leaflet component): `MapContainer` + `TileLayer` (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, attribution required). Import `leaflet/dist/leaflet.css` here. Price pins as `Marker` with `divIcon`:

```ts
const icon = L.divIcon({
  className: "",
  html: `<span class="rounded-full bg-primary-600 px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-md whitespace-nowrap">${label}</span>`,
});
```

`Popup` shows mini-card: 80px image, price, beds, link "View" → `/listings/[id]`. Fit bounds to listings (`L.latLngBounds`) on mount and when the listing set changes; guard empty set (default center Lagos `6.5244, 3.3792`, zoom 11).

- [ ] **Step 2: `listing-map.tsx`** — `next/dynamic(() => import("./listing-map-inner"), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> })`. Wrap in `div` with `rounded-2xl overflow-hidden border sticky top-20 h-[calc(100dvh-6rem)]`.
- [ ] **Step 3:** Mobile: floating bottom-center pill `Button` "Map"/"List" (`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:hidden`) toggling between full-screen map and list.
- [ ] **Step 4:** Visual check: pins match filtered results; popups link through; tiles load; toggling filters refits bounds; mobile toggle works. If tiles fail (offline), map area shows Leaflet grey — acceptable degradation, list remains.
- [ ] **Step 5:** `pnpm typecheck && pnpm lint`; commit — `feat: split list+map search view with OSM price pins`.

### Task 10: Listing detail page

**Files:**
- Create: `src/app/(platform)/listings/[id]/page.tsx`, `src/app/(platform)/listings/[id]/not-found.tsx`
- Create: `src/features/listing/listing-detail.tsx`, `src/features/listing/gallery.tsx`, `src/features/listing/cost-breakdown-card.tsx`, `src/features/listing/landlord-card.tsx`, `src/features/listing/spec-chips.tsx`, `src/features/listing/similar-listings.tsx`, `src/features/listing/action-bar.tsx`

**Interfaces:**
- Consumes: store listings, `costBreakdown`, `similarListings`, `ListingCard`, `ListingMap`, session hooks.
- Produces: `/listings/[id]`; `ActionBar` exposes `onApply/onSave/onContact/onReport` callbacks (wired to real flows in Tasks 11–13; until then they show a sonner toast "Coming in the next task" — replaced, never shipped in final phase).

- [ ] **Step 1: `page.tsx`** (server): `const { id } = await params;` render `<ListingDetail id={id} />` (client — data comes from store, so lookup + `notFound()` UX happens client-side: if hydrated and listing missing, render the not-found UI via `notFound()` is server-only — instead render a `NotFoundView` component with "Listing not found" + button to `/search`; `not-found.tsx` covers hard navigation errors).
- [ ] **Step 2: `Gallery`** — Habitect-style grid: `grid grid-cols-4 grid-rows-2 gap-2 rounded-3xl overflow-hidden aspect-[2/1]`; first image `col-span-2 row-span-2` (`priority`), next four fill; "+N photos" overlay button on last tile opens `Dialog` lightbox with full-width image + prev/next + counter + thumbnails. Mobile: single swipeable strip (horizontal scroll-snap).
- [ ] **Step 3: `ListingDetail` layout** — `max-w-6xl mx-auto px-4 py-6`; breadcrumb (Search › Area); `<h1>` title + location line + freshness `Badge` (amber, "Confirmed {relative}"); Gallery; then `lg:grid-cols-[1fr_400px]`:
  - Left `<article>`: `SpecChips` (beds/baths/toilets/size/floor/type as bordered chips with phosphor icons); "About this home" description; amenities chip grid; "Utilities & terms" definition list (serviced, furnishing, power, water, lease, move-in date, pets); "Location" section with `ListingMap listings={[listing]}` (h-64, non-sticky wrapper — add a `className` prop to the Task 9 wrapper for this).
  - Right sticky `<aside>`: `CostBreakdownCard` then `LandlordCard` then report link.
- [ ] **Step 4: `CostBreakdownCard`** — the trust centerpiece. `Card`: price headline (`text-3xl font-heading`) + period; `Table` rows: base price, each charge (label + refundable `Badge` "Refundable" in green-soft / "Non-refundable" muted, amount); `Separator`; bold "Total move-in cost" row (`bg-primary-50` in light, token-based); caption "Every cost, upfront. No surprises on inspection day." Then `ActionBar`: primary `Apply` (full-width), `Save` (heart outline/filled), `Contact landlord` (secondary).
- [ ] **Step 5: `LandlordCard`** — avatar initials, name, badges: `Verified Landlord` (green, ShieldCheck) and `Verified Property` when `verifiedProperty` (green outline, SealCheck) with `Tooltip`s explaining each ("Identity and ownership documents confirmed by Hecta", "This specific address verified against title documents"); muted "Last verified {date}".
- [ ] **Step 6: `SimilarListings`** — "Similar homes nearby" — `similarListings(listing, all, 3)` rendered as `ListingCard` row (grid sm:grid-cols-3).
- [ ] **Step 7:** Visual check desktop + mobile; bad id `/listings/nope` shows not-found view. `pnpm typecheck && pnpm lint`; commit — `feat: listing detail page with cost breakdown and gallery`.

### Task 11: Trust gate + tenant verification wizard

**Files:**
- Create: `src/features/verification/gate-dialog.tsx`, `src/features/verification/use-gate.ts`, `src/app/(platform)/verify/page.tsx`, `src/features/verification/identity-wizard.tsx`
- Modify: `src/features/listing/action-bar.tsx`, `src/features/search/listing-card.tsx` (save hearts go through the gate)

**Interfaces:**
- Consumes: `useSession`, store (`completeIdentityVerification`, `switchPersona`).
- Produces:

```ts
// use-gate.ts
export function useGate(): { requireVerified: (action: () => void) => void; gateOpen: boolean; setGateOpen: (o: boolean) => void };
// requireVerified runs action immediately when identity-verified; otherwise opens GateDialog
```

`/verify?next=<path>` — wizard that ends with `completeIdentityVerification()` + redirect to `next` (validate `next` starts with "/" to avoid open redirect).

- [ ] **Step 1: `GateDialog`** — `Dialog`: ShieldCheck icon in green circle, h "Verify once, apply anywhere", copy: "Hecta keeps enquiries serious. Verify your identity in under a minute to apply, save homes, and contact landlords — browsing stays free."; buttons: primary "Verify my identity" → `/verify?next={currentPath}`, ghost "Not now". Secondary caption for demo: "Demo tip: switching to the Tunde persona skips this."
- [ ] **Step 2: `IdentityWizard`** (client, at `/verify`) — stepper UI (`Progress` + step labels). Step 1 choose path (`RadioGroup` cards: "vNIN + selfie" / "Selfie + OTP"); Step 2 input: vNIN path → 16-char `Input` with monospace font (any 16 chars pass Zod `z.string().length(16)`); OTP path → phone `Input` then 6 one-char `Input`s (any digits pass); Step 3 "Liveness check" — circular dashed frame with Camera phosphor icon, button "Simulate capture" → 1.2s `Progress` animation → CheckCircle; Step 4 success — green check, "You're verified", `completeIdentityVerification()`, auto-redirect to `next` after 1.5s (also a button). All steps always succeed; back navigation allowed.
- [ ] **Step 3:** Wire `ActionBar` and card hearts: `requireVerified(() => actualAction())`. Anonymous → dialog; Tunde → straight through.
- [ ] **Step 4:** Visual check both paths; verify redirect returns to the listing. `pnpm typecheck && pnpm lint`; commit — `feat: trust gate and identity verification wizard`.

### Task 12: Apply flow, saved, applications pages

**Files:**
- Create: `src/features/apply/apply-dialog.tsx`, `src/features/apply/intent-profile-form.tsx`, `src/features/apply/quota-banner.tsx`
- Create: `src/app/(platform)/saved/page.tsx`, `src/features/apply/saved-grid.tsx`
- Create: `src/app/(platform)/applications/page.tsx`, `src/features/apply/applications-list.tsx`
- Modify: `src/features/listing/action-bar.tsx` (Apply opens ApplyDialog; Contact = apply-first messaging per PRD AP-04 — opens ApplyDialog with note "Messaging unlocks when you apply")

**Interfaces:**
- Consumes: `remainingQuota`, store (`submitApplication`, `setIntentProfile`, `savedByUser`), session.
- Produces: `ApplyDialog({ listing, open, onOpenChange })`; `/saved`; `/applications`. Status chip colors used again by landlord inbox: submitted=muted, viewed=blue-ish (use `secondary` amber), accepted=green, declined=destructive, info_requested=amber outline.

- [ ] **Step 1: `IntentProfileForm`** — RHF + Zod (`timeline` enum radio cards, `paymentPlan` radio, budget min/max `Input`s with naira prefix; `budgetMax >= budgetMin` refinement). Shown inside ApplyDialog when `user.intentProfile` is undefined; submits via `setIntentProfile`.
- [ ] **Step 2: `ApplyDialog`** — steps: (a) intent profile if missing; (b) application: listing summary row, profile summary chips ("Moving within 1 month · Full payment · ₦1.5M–₦4M" + Edit), message `Textarea` (optional, max 600), `QuotaBanner`, submit "Send application". `QuotaBanner`: `remainingQuota(...)` → "You have {day} of 5 applications left today" (`Progress`); if `day === 0` or `month === 0` → destructive-soft banner "Daily/monthly limit reached — resets at midnight WAT" and disabled submit. Success: toast "Application sent — the landlord will see your profile" + dialog closes. Duplicate application to same listing: replace submit with "Applied ✓" disabled state (check store).
- [ ] **Step 3: `/saved`** — grid of `ListingCard`s from `savedByUser[user.id]`; empty state with heart icon + "Browse homes" button; anonymous → gate-style empty state ("Verify to save homes").
- [ ] **Step 4: `/applications`** — list: each row = listing thumb + title, submitted date, status chip, quota footer ("N of 30 left this month"), "Message landlord" button when thread exists (→ `/messages?thread=id`). Empty state.
- [ ] **Step 5:** Visual check the full funnel as Anonymous → gate → verify → apply (profile then message) → appears in `/applications`. Submit 5 applications → 6th blocked. `pnpm typecheck && pnpm lint`; commit — `feat: apply flow with intent profile and quotas`.

### Task 13: Messaging (both sides) + report flow

**Files:**
- Create: `src/features/messaging/thread-list.tsx`, `src/features/messaging/chat-view.tsx`, `src/features/messaging/messages-screen.tsx`
- Create: `src/app/(platform)/messages/page.tsx`
- Create: `src/features/listing/report-dialog.tsx`
- Modify: `src/features/listing/listing-detail.tsx` (wire report link)

**Interfaces:**
- Consumes: store threads/messages (`sendMessage`), session; `submitReport`.
- Produces: `MessagesScreen({ role })` (`role: "seeker" | "landlord"` filters threads by participant side) — reused at `/dashboard/messages` in Task 15. `ReportDialog({ listing })`.

- [ ] **Step 1: `MessagesScreen`** — `md:grid-cols-[320px_1fr]` split: `ThreadList` (listing thumb, other-party name, last message preview, time) + `ChatView` (header with listing link, scrollable bubble list — own messages right in `bg-primary-600 text-primary-foreground`, other left in `bg-background border`; `Input` + send `Button`, Enter submits). `?thread=` param selects thread; mobile shows list OR chat with back button. Empty state: "Messages unlock when an application is accepted or a landlord responds."
- [ ] **Step 2: `ReportDialog`** — Flag link under LandlordCard ("Report this listing", muted, Flag icon). Dialog: `RadioGroup` (Agent posing as landlord / Scam listing / Spam user), reason `Textarea` (required, min 10 chars, Zod), submit → `submitReport` → toast "Report received — our team reviews within 24 hours". If this report is the 3rd distinct open report the store auto-suspends (already in store action) — nothing special in UI here.
- [ ] **Step 3:** Visual check: as Tunde message on seeded thread; report listing #3 twice with different personas won't dupe (one reporter = one report — store ignores duplicate reporter+listing pair; implement that guard in `submitReport` now if missing). `pnpm test && pnpm typecheck && pnpm lint`; commit — `feat: messaging and report flows`.

---

## Phase 3 — Landlord dashboard

### Task 14: Dashboard shell + overview

**Files:**
- Create: `src/app/dashboard/layout.tsx`, `src/app/dashboard/page.tsx`
- Create: `src/components/layout/dashboard-sidebar.tsx` (generic sidebar shell — reused by admin)
- Create: `src/features/dashboard/overview-stats.tsx`, `src/features/dashboard/availability-prompts.tsx`, `src/features/dashboard/verification-status-card.tsx`, `src/features/dashboard/persona-guard.tsx`

**Interfaces:**
- Consumes: store, session, `isReconfirmDue`, `PersonaSwitcher`.
- Produces: `DashboardSidebar({ title, items, children })` where `items: { href: string; label: string; icon: ReactNode; badge?: number }[]` — active state via `usePathname()`; mobile = top bar + `Sheet` drawer. `PersonaGuard({ persona, children })` — if active persona ≠ required, renders a centered card "Switch to the {persona} persona to view this" with a switch button (uses `switchPersona`), instead of children.

- [ ] **Step 1:** Build `DashboardSidebar` (client) — `lg:grid-cols-[240px_1fr]`; sidebar: wordmark "Hecta · Landlord", nav items, bottom `PersonaSwitcher`. Content header shows page title slot.
- [ ] **Step 2:** `dashboard/layout.tsx` wraps children in `PersonaGuard persona="landlord"` + sidebar with items: Overview `/dashboard`, My listings `/dashboard/listings`, Applications `/dashboard/applications` (badge = pending count), Messages `/dashboard/messages`, Verification `/dashboard/verification`. Mount `<Toaster />`.
- [ ] **Step 3:** Overview page composes: `VerificationStatusCard` (landlordVerified → green "Verified Landlord" card with SealCheck; else CTA card → `/dashboard/verification`); `OverviewStats` — stat tiles (`Card`s): Active listings, Pending review, Applications awaiting reply, Saves on your homes (count savedByUser entries containing own listing ids); `AvailabilityPrompts` — for own listings where `isReconfirmDue(listing, now)`: amber card per listing "Is {title} still available?" with buttons **Yes, still available** (`confirmAvailability` → toast "Freshness updated — shown to seekers") and **No, it's taken** (`setListingStatus(id, "let")`). Also list `hidden` listings with one-tap "Reactivate" (`confirmAvailability` + status active).
- [ ] **Step 4:** Seed check: make listing #35 (`hidden`) and give listing #1 a `reconfirmDueAt` in the past (adjust mock `freshDaysAgo` to 61) so both cards show. Visual check as Amaka; as Tunde `/dashboard` shows the guard. `pnpm typecheck && pnpm lint`; commit — `feat: landlord dashboard shell and overview`.

### Task 15: My listings + messages reuse

**Files:**
- Create: `src/app/dashboard/listings/page.tsx`, `src/features/dashboard/my-listings-table.tsx`
- Create: `src/app/dashboard/messages/page.tsx` (renders `MessagesScreen role="landlord"`)

**Interfaces:**
- Consumes: store, `setListingStatus`, status chip mapping from Task 12.
- Produces: listings management table.

- [ ] **Step 1:** `MyListingsTable` — responsive `Table` (cards on mobile): thumb+title, status `Badge` (draft muted / pending_review amber / active green / hidden outline / suspended destructive / let·sold secondary / rejected destructive-outline), price, freshness date, row `DropdownMenu` actions: View (active → `/listings/[id]`), Mark as let / Mark as sold (active), Reactivate (hidden/let), Edit-disabled item with tooltip "Editing coming soon" — no dead ends. Header CTA `Button` "+ New listing" → `/dashboard/listings/new`.
- [ ] **Step 2:** Wire `/dashboard/messages`. Visual check status transitions reflect instantly in `/search` (mark #1 as let → gone from results; reactivate → back).
- [ ] **Step 3:** `pnpm typecheck && pnpm lint`; commit — `feat: landlord listings management`.

### Task 16: Create-listing wizard

**Files:**
- Create: `src/app/dashboard/listings/new/page.tsx`, `src/features/dashboard/new-listing/wizard.tsx`, `src/features/dashboard/new-listing/steps.ts` (Zod schemas), `src/features/dashboard/new-listing/charge-builder.tsx`, `src/features/dashboard/new-listing/photo-picker.tsx`

**Interfaces:**
- Consumes: `createListing`, `NIGERIA_LOCATIONS`, constants, `LISTING_PHOTO_POOL`, `totalMoveInCost` shape (compute live total from form values with the same formula).
- Produces: 7-step wizard ending in `pending_review` listing visible in admin queue.

- [ ] **Step 1: `steps.ts`** — one Zod schema per step:

```ts
export const basicsSchema = z.object({ intent: z.enum(["rent", "buy"]), propertyType: z.enum([...]), title: z.string().min(10).max(90) });
export const locationSchema = z.object({ state: z.string().min(1), cityLga: z.string().min(1), area: z.string().min(1), street: z.string().optional() });
export const specsSchema = z.object({ bedrooms: z.coerce.number().int().min(0).max(20), bathrooms: ..., toilets: ..., sizeSqm: z.coerce.number().positive().optional(), floor: ..., serviced: ..., furnishing: ..., leaseType: ..., petsAllowed: z.boolean(), moveInDate: z.string().min(1), powerSupply: z.string().min(1), waterSupply: z.string().min(1) })
  .refine((v) => v.propertyType !== undefined || true); // sizeSqm required when intent=buy or type=land — enforce in wizard-level superRefine
export const costsSchema = z.object({ price: z.coerce.number().positive(), pricePeriod: z.enum([...]), otherCharges: z.array(z.object({ label: z.string().min(2), amount: z.coerce.number().positive(), refundable: z.boolean() })) });
export const photosSchema = z.object({ images: z.array(z.string().url()).min(MIN_LISTING_IMAGES).max(20) });
export const detailsSchema = z.object({ description: z.string().min(DESCRIPTION_MIN_CHARS).max(DESCRIPTION_MAX_CHARS), amenities: z.array(z.string()).max(17) });
```

(Write the elided enums in full in the real file.)

- [ ] **Step 2: `Wizard`** — stepper header (`Progress` + labels: Basics · Location · Specs · Costs · Photos · Details · Review); one RHF form per step, accumulated in local `useState` draft; Back/Next; geoPoint = the area's base coordinate (add `AREA_COORDS: Record<string, GeoPoint>` to `src/constants/locations.ts` in this task — also refactor mock listings to use it).
- [ ] **Step 3: `ChargeBuilder`** — field-array rows (label `Input`, amount `Input`, refundable `Switch`, remove); "Add charge" + quick-add preset buttons (Agency fee 10%, Legal fee 5%, Caution deposit 10%, Service charge); sticky live summary line "Total move-in cost: ₦X".
- [ ] **Step 4: `PhotoPicker`** — mock uploader: grid of the 50 pool photos, tap to select (order badge), min-4 counter; "Review" step shows a preview `ListingCard` + full detail summary + notice "Your listing will be reviewed by Hecta before going live (usually under 48 hours)"; submit → `createListing` → success screen → `/dashboard/listings` (row shows pending_review).
- [ ] **Step 5:** Guard: if `!isLandlordVerified`, page renders verification-required card linking to `/dashboard/verification` instead of wizard.
- [ ] **Step 6:** Visual check full happy path + validation errors per step (short title, 3 photos, 20-char description). `pnpm typecheck && pnpm lint`; commit — `feat: create-listing wizard`.

### Task 17: Applications inbox + landlord verification center

**Files:**
- Create: `src/app/dashboard/applications/page.tsx`, `src/features/dashboard/applications-inbox.tsx`
- Create: `src/app/dashboard/verification/page.tsx`, `src/features/dashboard/landlord-verification.tsx`

**Interfaces:**
- Consumes: `sortApplicationsByQualification`, `qualificationScore`, store (`markApplicationStatus`, `ensureThreadForApplication`, `submitVerification`), verifications.
- Produces: inbox with accept/decline/request-info propagating to seeker side; Trust Layer 1 wizard feeding admin queue.

- [ ] **Step 1: `ApplicationsInbox`** — applications on own listings, **sorted by `sortApplicationsByQualification`**, grouped by listing (`Tabs` per listing or section headers). Row: applicant name + qualification score ring (`Progress` circular substitute: `Badge` "Strong match {score}" ≥70 green / "Medium" 40–69 amber / "Low" <40 muted), intent profile chips (timeline · payment · budget vs move-in total with ✓/⚠ if `budgetMax < total`), message excerpt, date, status chip, actions: **Accept** (→ status accepted + `ensureThreadForApplication` + toast "Accepted — messaging opened"), **Decline** (`Dialog` confirm), **Request info** (→ status info_requested + thread). Empty state.
- [ ] **Step 2: `LandlordVerification`** — if approved: status card + submission summary. Else wizard: Step 1 identity (NIN `Input` 11 digits + phone OTP mock like Task 11), Step 2 ownership (`RadioGroup` cards for the 4 standard docs + separated "Family land?" section with the 2 family-path docs; selected doc gets a mock upload tile — dashed border, UploadSimple icon, click → filename appears with CheckCircle), Step 3 property (address `Input`, legitimacy `RadioGroup`: survey plan / LUC receipt / none), Step 4 review + submit → `submitVerification` → timeline view (Submitted ● → Under review ○ → Approved ○) with copy "Our team reviews within 48 hours. You'll be able to list as soon as you're approved."
- [ ] **Step 3:** Seed tweak: for demo, `user-emeka` already has `submitted` — the wizard state for Amaka shows approved. Visual check: as Amaka accept Chidi's application → switch to Tunde — no change (Chidi isn't Tunde) — verify via `/dashboard` → messages instead; decline flows show on seeded users' rows.
- [ ] **Step 4:** `pnpm typecheck && pnpm lint`; commit — `feat: applications inbox and landlord verification center`.

---

## Phase 4 — Admin console

### Task 18: Admin shell + overview + verification review

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/verifications/page.tsx`
- Create: `src/features/admin/admin-overview.tsx`, `src/features/admin/verification-queue.tsx`

**Interfaces:**
- Consumes: `DashboardSidebar`, `PersonaGuard persona="admin"`, store (`reviewVerification`), verifications.
- Produces: admin shell (items: Overview `/admin`, Verifications, Listing approvals `/admin/listings`, Reports `/admin/reports` — each with pending-count badge).

- [ ] **Step 1:** Layout mirrors dashboard: `PersonaGuard persona="admin"` + `DashboardSidebar title="Hecta · Admin"`.
- [ ] **Step 2:** Overview: three queue `Card`s (count + "Review" link) + "Recent decisions" list (derive from verifications/listings with non-pending status, latest 5).
- [ ] **Step 3: `VerificationQueue`** — master/detail (`md:grid-cols-[minmax(280px,1fr)_2fr]`): list of submissions (name, doc type label, status chip, date) → detail: identity section (name, NIN masked `•••• •••• 1234`, phone-verified check), documents section — mock preview tiles (FileText phosphor icon + doc label + "Preview" opens `Dialog` with a styled placeholder document: grey page with doc-type heading and fake reference number), automated checks list (✓ NIN format valid, ✓ Document readable, ✓/⚠ Duplicate address check — ⚠ if another listing shares the address), actions: **Approve** (→ `reviewVerification(id, "approved")` → toast; owner becomes landlordVerified), **Reject** (`Dialog` requiring reason `Textarea`, note "One resubmission permitted"), **Request more documents** (reason → status info_requested). Decisions update the landlord's dashboard view.
- [ ] **Step 4:** Visual check: approve Emeka → switch persona to see effect (Emeka isn't a switchable persona — verify via store devtools/UI badge counts instead; acceptable). `pnpm typecheck && pnpm lint`; commit — `feat: admin shell and verification review queue`.

### Task 19: Listing approvals + reports queue

**Files:**
- Create: `src/app/admin/listings/page.tsx`, `src/features/admin/listing-approval-queue.tsx`
- Create: `src/app/admin/reports/page.tsx`, `src/features/admin/reports-queue.tsx`

**Interfaces:**
- Consumes: `isSuspiciousPrice`, `shouldAutoSuspend`, store (`reviewListing`, `resolveReport`, `setListingStatus`).
- Produces: approval + reports flows completing the cross-persona loop.

- [ ] **Step 1: `ListingApprovalQueue`** — pending_review listings as rows: thumb, title, landlord name (+ Verified badge or "Unverified" destructive-outline), price + **suspicious-price flag** when `isSuspiciousPrice` (amber `Badge` "Price 60%+ above area median" with `Tooltip` showing median), completeness checks (✓ ≥4 photos, ✓ description length, ✓ charges present), expandable preview (`Sheet` with the seeker-facing `ListingDetail` content read-only or a summary card — summary card is enough: cost table + specs), actions: **Approve & publish** (→ active, toast "Live on search") / **Reject** (reason dialog → status rejected). Approving listing #32 then switching to seeker persona shows it in Ajah results.
- [ ] **Step 2: `ReportsQueue`** — group open reports by listing: listing header (thumb, title, status chip — `suspended` shows destructive "Auto-suspended after 3 reports" banner per `shouldAutoSuspend`), report rows (category `Badge`, reporter name, reason, date), actions per listing: **Suspend listing** / **Restore listing** (status active + resolve reports as dismissed? No —) **Restore** sets status active only; per report: **Dismiss** (→ dismissed), **Mark actioned** (→ actioned). "Flag user" `DropdownMenu` item on reporter rows → toast "User flagged for review" (no further model — acceptable stub, states clearly in UI copy "added to review list").
- [ ] **Step 3:** Visual check the full loop: tenant reports listing #3 three times can't (single reporter) — instead verify seeded #34 shows auto-suspended; restore it → appears in search; suspend again. `pnpm typecheck && pnpm lint`; commit — `feat: admin listing approvals and reports queue`.

---

## Phase 5 — Polish & verification

### Task 20: Empty/error states, a11y & responsive pass, final verification

**Files:**
- Create: `src/app/(platform)/listings/[id]/not-found.tsx` (if not done in Task 10)
- Modify: any files flagged by the passes below.

- [ ] **Step 1:** Sweep every route in all three personas at 375px and 1440px: no horizontal overflow, touch targets ≥44px, filter sheet + map toggle usable, wizards completable on mobile.
- [ ] **Step 2:** A11y pass: every `Input` has `Label htmlFor`; icon-only buttons have `aria-label`; `Dialog`s have titles; keyboard-walk the gate → verify → apply funnel (Tab/Enter/Space only); heading hierarchy one `h1` per page.
- [ ] **Step 3:** Grep gates — all must return clean:

```bash
grep -rn "console.log" src --include="*.tsx" --include="*.ts" | grep -v test
grep -rn "text-\[#\|bg-\[#\|oklch(" src/features src/app src/components/layout
grep -rn "Coming in the next task" src
grep -rn ": any\b" src --include="*.ts" --include="*.tsx"
```

- [ ] **Step 4:** Confirm landing isolation: `grep -rn "href=\"/search\|href=\"/dashboard\|href=\"/admin\|/listings/" src/components/landing src/app/page.tsx` → no matches.
- [ ] **Step 5:** Full verification: `pnpm test && pnpm typecheck && pnpm lint && pnpm build` — all pass. Manually re-walk the demo script: Anonymous browse → verify → apply → switch Amaka → accept + confirm availability → switch Admin → approve listing #32 + review verification → switch back to seeker → see #32 live.
- [ ] **Step 6:** Commit — `chore: platform polish pass (a11y, responsive, empty states)`.

---

## Self-Review Notes (resolved during planning)

- PRD's map exclusion is overridden by explicit user decision (recorded in spec §1) — Task 9 implements it.
- Contact-landlord is modelled as apply-first (PRD AP-04: messaging unlocks on application) — Task 12 states this in UI copy.
- Search params use safeParse-with-defaults rather than reject-on-failure; justification recorded in Task 6 (UI state, no privilege boundary). All privileged mutations go through typed store actions.
- Listing edit is deliberately out of scope (spec lists create + status changes only); Task 15 shows a disabled Edit item with tooltip so it doesn't read as broken.
- Landlord "Contact" CTA, saved-search alerts, inspection scheduling: out of scope per spec §6.
