# Hecta Platform — Design Spec

**Date:** 2026-07-29
**Status:** Approved (pending final spec review)
**Source PRD:** `src/docs/hecta-prd.md`
**Design references:** `src/design/Hecta Reference/` (property marketplace UIs: split list+map search, filter sidebars, card grids, gallery-first detail pages)

## 1. Summary

A clickable, mock-data-only frontend prototype of the full Hecta MVP surface: seeker marketplace, landlord dashboard, and admin review console. No database, no real auth — a persisted client store simulates the whole system so the trust-layer story can be walked end-to-end across personas. The existing landing page at `/` remains untouched and links to none of the platform routes.

### Explicit product decisions made for this build

| Decision | Choice |
|---|---|
| Scope | Full MVP surface: seeker + landlord + admin |
| Routing | Top-level clean URLs (`/search`, `/listings/[id]`, `/dashboard`, `/admin`) |
| Auth simulation | Persona switcher + fake verification flows that always succeed |
| Data interactivity | "Living prototype" — one shared Zustand store; actions propagate across personas |
| Map view | **Included — overrides PRD Decision 4 (user decision).** Leaflet + OpenStreetMap, no API key |

## 2. Architecture

### 2.1 Routes

```
src/app/
  page.tsx                      → existing landing (UNCHANGED, no links to platform)
  (platform)/
    layout.tsx                  → platform shell: header (logo, Rent/Buy intent toggle,
                                  location summary, persona/avatar menu)
    search/page.tsx             → entry step OR results (driven by searchParams)
    listings/[id]/page.tsx      → property details
    listings/[id]/not-found.tsx
    saved/page.tsx              → saved listings (gated)
    applications/page.tsx       → my applications (gated)
    messages/page.tsx           → message threads (gated)
    verify/page.tsx             → tenant identity wizard (Trust Layer 2)
  dashboard/
    layout.tsx                  → landlord shell (sidebar)
    page.tsx                    → overview
    listings/page.tsx           → my listings
    listings/new/page.tsx       → create-listing wizard
    applications/page.tsx       → applications inbox
    messages/page.tsx           → landlord side of threads
    verification/page.tsx       → Trust Layer 1 wizard + status
  admin/
    layout.tsx                  → admin shell (sidebar)
    page.tsx                    → queue overview
    verifications/page.tsx      → landlord verification review queue
    listings/page.tsx           → listing approval queue
    reports/page.tsx            → reports queue
```

- `/search` with no location params renders the entry state: Rent/Buy intent choice + State → City/LGA → Area cascade. Area is optional and multi-select (PRD Decision 2). With params it renders results. Intent is changeable at any time from the platform header.
- Route group `(platform)` keeps the seeker shell separate from the landing page and from dashboard/admin shells.

### 2.2 Data layer

- `src/lib/types.ts` — interfaces mirroring PRD §5 exactly: `Listing` (incl. `intent`, `price`, `pricePeriod`, `otherCharges[]` with `{label, amount, refundable}`, derived `totalMoveInCost`, `location {state, cityLga, area, street?, geoPoint}`, `propertyType`, `bedrooms`, `bathrooms`, `toilets`, `sizeSqm?`, `serviced`, `furnishing`, `floor`, `petsAllowed`, `moveInDate`, `leaseType`, `powerSupply`, `waterSupply`, `amenities[]`, `description`, media, status, freshness timestamps), plus `SeekerProfile`/`IntentProfile`, `Landlord`, `Application`, `MessageThread`/`Message`, `Report`, `VerificationSubmission`.
- `src/lib/mock/` — typed seed data:
  - ~36 listings across Lagos (Lekki, Ikoyi, VI, Yaba, Ikeja, Surulere, Ajah, Gbagada…) and a few in Abuja; realistic NGN prices; every listing has a full `otherCharges` breakdown; real coordinates for map pins; a few unverified/pending/suspicious-priced listings to exercise admin flows.
  - 4 personas: Anonymous, Tunde (verified tenant, Level 2), Amaka (landlord, Trust Layer 1 verified with one pending property), Admin.
  - Seeded applications, message threads, reports, and verification submissions so no inbox starts empty.
  - Canonical location taxonomy: `states → cities/LGAs → areas` for the cascade and filters.
- `src/lib/marketplace.ts` — pure functions, unit tested: listing filtering/sorting, total move-in cost derivation, application quota logic (5/day, 30/month, WAT reset), qualification-strength scoring (intent profile → sort key), suspicious-price detection (deviation from area/type median), report auto-suspend rule (≥3 reports).
- **State:** one Zustand store (`persist` middleware, localStorage) seeded from mock data. Holds: active persona/session, saved listing ids, submitted applications, messages, admin decisions (verification + listing approvals, report resolutions), landlord-created listings, listing status changes, availability confirmations. All cross-persona propagation flows through this store.
- **Server/client split:** shells and static page chrome are server components; interactive data regions (results grid, map, inboxes, wizards, queues) are client feature components reading store selectors. This deliberately deviates from server-first data fetching — cross-persona propagation with no backend requires shared client state. `lib/` stays the single data-access point so a real API can replace the store later.
- Listing photos: Unsplash remote URLs via `next/image` (`remotePatterns` config). Lazy-loaded; above-the-fold gallery images `priority`.

### 2.3 UI foundation

- **shadcn/ui** initialized into `src/components/ui` — button, input, select, dialog, sheet, tabs, badge, card, avatar, dropdown-menu, slider, checkbox, radio-group, switch, form (RHF + Zod resolver), textarea, table, pagination, separator, skeleton, tooltip, sonner (toasts), popover, progress.
- Themed onto existing landing tokens: paper background, white cards, ink text, `--primary` deep green (actions, verified badges), `--secondary` warm amber (highlights, qualification/freshness accents). Bricolage Grotesque headings, Inter body (already global). Radii per existing `--radius` scale.
- **Map:** Leaflet + react-leaflet with OpenStreetMap tiles (free, keyless), loaded with `next/dynamic` + `ssr: false` and skeleton fallback. Price-pin markers with a hover/click mini-card (image, price, beds); pins sync with filtered results.
- Forms: React Hook Form + Zod schemas for every wizard/form; parse-don't-trust for URL searchParams (Zod) per project validation rules.
- Mobile-first: filter sidebar becomes a Sheet; split list+map becomes a full list with floating List/Map toggle; 44px touch targets.

## 3. Screens & flows

### 3.1 Seeker

1. **Search entry** (`/search`, no params): Rent/Buy toggle (hard fork per PRD §3.1) + State → City/LGA (required) → Areas (optional multi-select) → "Browse homes".
2. **Results** (`/search?intent=rent&state=lagos&city=eti-osa&areas=lekki-phase-1,ikate`):
   - Pill quick-filters (price, type, beds) + "All filters" sheet: price range, property type, bedrooms, bathrooms, furnishing, serviced level, pets, move-in date, lease term, amenities, **Verified-only toggle (default ON)**.
   - Sort (newest, price ↑↓, freshness), grid/list toggle, result count.
   - Split layout: results left, map right (hideable). Cards: primary photo, Verified badge, price + period (₦/yr default), **total move-in cost**, beds·baths·toilets, property type, Area·City, "Confirmed available [date]".
   - Pagination (12/page). Empty state with filter-reset.
3. **Listing detail** (`/listings/[id]`): gallery grid (hero + thumbnails, dialog lightbox), title, location, spec chips (beds/baths/toilets/size/floor), price block with **full cost-breakdown table** — each charge labeled refundable/non-refundable, summed to a separately-displayed move-in total (core trust feature), description, amenities, utilities (serviced/furnishing/power/water), small location map, landlord card (Verified Landlord + Verified Property badges, last-verified date), freshness stamp, sticky action bar: **Apply / Save / Contact**, "Report this listing" link, similar listings row.
4. **Trust gate:** any gated action while Anonymous → dialog explaining verification → `/verify` wizard: choose vNIN or selfie+OTP path → mock steps (input token / camera placeholder / OTP boxes) → always succeeds → session becomes Verified → user returns to complete the original action.
5. **Apply:** first-ever application requires the intent profile (timeline, payment plan, budget min/max) — attached to every subsequent application. Then optional message + quota banner ("4 of 5 applications left today"); submitting decrements quota and the application appears in the landlord inbox. Quota-exhausted state blocks submission with explanation. Report flow: category (agent posing as landlord / scam / spam) + reason → enters admin queue.
6. **Saved / Applications / Messages:** saved grid; application list with status chips (Submitted, Viewed, Accepted, Declined, Info requested); message thread per application (thread unlocks on application, per PRD AP-04).

### 3.2 Landlord (`/dashboard`)

- **Overview:** verification status card, stat tiles (active listings, pending applications, total saves), **"Still available?" prompts** — listings due 60-day re-confirmation with one-tap Yes/No; No or 7-day timeout (simulated) hides the listing with one-tap reactivate. Freshness visibly updates.
- **My listings:** table/cards — status flow Draft → Pending review → Active → Hidden / Let / Sold; mark-as-let removes from search; reactivate restores.
- **Create listing** (`/dashboard/listings/new`): multi-step wizard — Basics (intent, type, title) → Location (cascade + street) → Specs (beds/baths/toilets/size/floor + utilities) → **Costs** (price + period + charge-builder rows with refundable flags, live move-in total) → Photos (mock uploader, min 4 enforced from a preset picker) → Amenities + description (50–2000 chars) → Review → submit ⇒ "Pending admin approval". Requires Trust Layer 1 complete, else redirected to verification.
- **Applications inbox:** **sorted by qualification strength**; rows show applicant, intent profile (timeline/payment/budget vs listing cost), badges; actions Accept / Decline / Request more info → status reflects on the tenant side; links into messages.
- **Verification center:** Trust Layer 1 wizard — identity (NIN + phone OTP mock), ownership proof (choose C of O / Deed / Purchase receipt / Governor's Consent — mock upload), property legitimacy (address + survey plan or LUC receipt), **family-land path** (Family Resolution Letter / Letter of Administration); submission timeline (Submitted → Under review → Approved) with 48h SLA copy. Approval arrives when Admin approves it in the console.

### 3.3 Admin (`/admin`)

- **Overview:** queue counts (verifications, listing approvals, reports) + recent activity.
- **Verifications:** submission list → detail: identity fields, mock document previews, duplicate-address check result; Approve (grants Verified Landlord + Verified Property) / Reject with reason (one resubmission allowed) / Request more documents.
- **Listing approvals:** pending listings with completeness check and **suspicious-pricing flag** (deviation vs area/type median); Approve ⇒ listing goes Active in search; Reject with reason ⇒ back to landlord as Draft.
- **Reports:** queue with category, reporter, target, reason; listing with ≥3 independent reports shows auto-suspended; actions: Suspend / Restore listing, Dismiss report, Flag user.

### 3.4 Persona switcher

Avatar menu in every shell: **Anonymous · Tunde (verified tenant) · Amaka (landlord) · Admin**. Switching updates the session store and offers a jump to that persona's home (`/search`, `/dashboard`, `/admin`). This is the demo backbone tying the living prototype together.

## 4. Error handling & empty states

- `not-found.tsx` for unknown listing ids; graceful fallback if persisted store shape changes (version + migrate/reset).
- Empty states everywhere a list can be empty (results, saved, applications, inboxes, queues) with a constructive next action.
- Gate states: unverified (locked actions), quota exhausted, unverified landlord blocked from wizard.
- Map failure (tiles unreachable) degrades to list-only with a notice.

## 5. Testing

- Unit tests (mirroring source paths): `src/lib/marketplace.test.ts` — filtering, sorting, move-in cost derivation, quota logic incl. WAT reset boundaries, qualification scoring, suspicious-price detection, auto-suspend rule.
- Component tests for the two complex wizards (create listing, verification) if a test runner is introduced in the implementation plan; otherwise unit coverage of their Zod schemas.

## 6. Out of scope (this build)

Saved searches & alerts, inspection scheduling, WhatsApp landlord interface, dynamic tenancy agreement, demand pool / reverse listings, flatmate matching, real auth/identity providers, payments, i18n on platform pages (English only; landing i18n untouched), real document upload/storage, push/email notifications.

## 7. Open items deferred to implementation plan

- shadcn/ui init details (components.json) against Tailwind v4 tokens already present.
- Unsplash image curation for listings + `next.config` remotePatterns.
- Whether `motion` (already a dependency) is used for platform micro-interactions — default: sparing use, respecting `prefers-reduced-motion`.
