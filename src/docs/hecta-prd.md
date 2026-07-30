# Hecta — Product Requirements Document

**Version:** 0.1 (Draft for review)
**Date:** 29 July 2026
**Status:** Pre-development — pending decisions in §12
**Owner:** _[Product Lead]_

---

## 1. Overview

### 1.1 Product summary
Hecta is a rent-and-buy property marketplace for the Nigerian market, built around a trust layer that most existing platforms lack. The core insight is that Nigerian property search fails not because listings are hard to find, but because listings are hard to *believe* — ghost listings, agent-chain markups, and unverified landlords dominate the experience.

Hecta's answer is two-sided verification: landlords prove ownership before listing, tenants and buyers prove identity and intent before applying. Everything else in the product exists to support that exchange.

### 1.2 Problem statement
| Pain | Who feels it |
|---|---|
| Listings for properties that are already let, or never existed | Tenants, buyers |
| Multiple agents relisting the same property at different prices | Tenants, buyers |
| No way to tell a real landlord from a middleman | Tenants, buyers |
| Time wasted on enquiries from people with no funds or timeline | Landlords |
| Repeated physical inspections for properties that don't match the ad | Tenants, buyers |
| Lawyer fees for standard tenancy agreements | Both sides |

### 1.3 Goals
1. Every listing on the platform traces back to a verified owner or authorised representative.
2. A tenant or buyer can go from app open to a serious enquiry in under five minutes.
3. Landlords receive fewer, better-qualified enquiries than they do on classifieds platforms.
4. Reduce the ghost-listing rate to near zero through active listing hygiene.

### 1.4 Non-goals (MVP)
- Flatmate / roommate matching
- In-app rent payment or escrow
- Agent-to-agent listing syndication
- Property management (maintenance tickets, rent collection)
- Map-based search

---

## 2. Users

### 2.1 Primary personas

**Tenant (Rent intent)**
Young professional or family relocating within or into Lagos/Abuja. Budget-constrained, time-poor, deeply sceptical after prior bad experiences. Needs annual rent plus agency and caution fees visible upfront — headline price alone is misleading in this market.

**Buyer (Buy intent)**
Higher net worth, longer timeline, often diaspora. Cares about title documents above almost everything else. Willing to complete heavier verification because the transaction value justifies it.

**Landlord / Property Owner**
May own one property or several. Often not technically sophisticated. Lives in WhatsApp. Will abandon any flow that feels like a government form. This is the constituency most at risk from strict verification.

**Admin / Verification Officer (internal)**
Reviews submitted ownership documents, approves or rejects listings, handles reports. A human bottleneck by design in MVP.

### 2.2 Out of scope as a persona (MVP)
Agents. The product's positioning is landlord-direct. A decision on whether verified agents are eventually admitted is listed in §12.

---

## 3. Core user flow

```
Entry → Select Intent → Choose Location → View Listings → Apply Filters
      → View Property → Take Action (Apply / Save / Contact)
```

Verification is deliberately deferred: browsing is fully open, and identity is only demanded at the point of action. Front-loading verification kills the funnel.

### 3.1 Step breakdown

**Step 1 — Intent selection**
User picks `Rent` or `Buy`. This is a hard fork; it drives listing inventory, filter set, and the qualification path later in the funnel. Intent is changeable at any time from the header.

**Step 2 — Location selection**
Hierarchy: `State → City/LGA → Area`.

Recommendation: make State and City required, Area optional and multi-select. Areas in Lagos are colloquial and inconsistently bounded (is Oniru part of VI?), so forcing a single-area choice will hide relevant inventory. Store a canonical area taxonomy internally and accept common aliases in search. _See §12, Decision 2._

**Step 3 — Listings page**
Grid/list toggle. Card shows: primary image, headline price, price period, location (Area, City), bedrooms, bathrooms, property type, verification badge, posted/updated date.

**Step 4 — Filters**
See §5.3 for the full filter set.

**Step 5 — Property details page**
Full listing information, image gallery (required), video (see Decision 3), full cost breakdown, amenities, landlord verification badge, last-verified date.

**Step 6 — Action**
`Apply`, `Save`, or `Contact Landlord`. All three require Trust Layer 2 (verified identity). This is the first hard gate in the product.

---

## 4. Functional requirements

Requirements are labelled `[MVP]`, `[V2]`, or `[Later]`.

### 4.1 Search & discovery

| ID | Requirement | Priority |
|---|---|---|
| SD-01 | User can select Rent or Buy intent and change it at any time | MVP |
| SD-02 | User can select location by State → City → Area | MVP |
| SD-03 | User can browse listings without an account | MVP |
| SD-04 | Listings display in grid or list view | MVP |
| SD-05 | User can save a search and receive alerts for new matches | V2 |
| SD-06 | Map view of listings | Later |
| SD-07 | Text search by landmark, estate name, or street | V2 |

### 4.2 Listings

| ID | Requirement | Priority |
|---|---|---|
| LS-01 | Verified landlord can create a listing with all core fields | MVP |
| LS-02 | Listing cannot publish until admin approval | MVP |
| LS-03 | Listing displays full cost breakdown, not just headline rent | MVP |
| LS-04 | Landlord can mark a listing Let/Sold, which removes it from search | MVP |
| LS-05 | Listing shows a "last confirmed available" timestamp | MVP |
| LS-06 | Landlord can duplicate a listing to create a similar unit | V2 |
| LS-07 | Listing supports video | See Decision 3 |

### 4.3 Applications & contact

| ID | Requirement | Priority |
|---|---|---|
| AP-01 | Verified user can apply to a listing with their intent profile attached | MVP |
| AP-02 | Landlord receives applications in an inbox, sorted by qualification strength | MVP |
| AP-03 | Landlord can accept, decline, or request more information | MVP |
| AP-04 | In-app messaging between landlord and applicant, unlocked on application | MVP |
| AP-05 | Application limits enforced (§8) | MVP |
| AP-06 | Inspection scheduling with calendar slots | V2 |

---

## 5. Property data model

### 5.1 Core fields (required)

| Field | Type | Notes |
|---|---|---|
| `listing_id` | UUID | |
| `intent` | enum | `rent` \| `sale` |
| `price` | decimal (NGN) | |
| `price_period` | enum | `per_annum` \| `per_month` \| `outright` — annual is the Nigerian default for rent |
| `other_charges[]` | array | Each: `{label, amount, refundable: bool}`. Covers agency fee, legal fee, caution/security deposit, service charge. **Required, not optional** — this is a core trust feature |
| `total_move_in_cost` | decimal | Derived: price + non-refundable charges + refundable deposits, displayed separately |
| `location` | object | `{state, city_lga, area, street_optional, geo_point}` |
| `property_type` | enum | House, Apartment/Flat, Duplex, Bungalow, Terrace, Self-contain, Mini-flat, Studio, Land, Commercial |
| `bedrooms` | int | |
| `bathrooms` | int | |
| `toilets` | int | Listed separately from bathrooms — standard in Nigerian listings |
| `size_sqm` | decimal | Optional for rentals, required for land/sale |

### 5.2 Additional details

| Field | Type | Values |
|---|---|---|
| `serviced` | enum | `none` \| `semi` \| `full` |
| `furnishing` | enum | `unfurnished` \| `semi_furnished` \| `furnished` |
| `floor` | int \| null | `null` = N/A |
| `pets_allowed` | bool | |
| `move_in_date` | date | |
| `lease_type` | enum | `short_term` \| `long_term` |
| `power_supply` | text | Estate/generator/inverter/solar — high-salience in this market, recommend adding |
| `water_supply` | text | Borehole/mains — same rationale |

### 5.3 Filter set

Price range · Property type · Bedrooms · Bathrooms · Furnishing · Serviced level · Pets allowed · Move-in date · Short-term vs long-term · Amenities · Verified-only toggle

The **Verified-only toggle** is not in the original notes but is recommended as a default-on filter. It makes the trust layer visible and gives landlords a concrete reason to complete verification.

### 5.4 Media
- **Images:** required, minimum 4, maximum 20. Server-side compression, EXIF stripping for privacy.
- **Videos:** see Decision 3. If included: max 90 seconds, max 100 MB, transcoded to adaptive bitrate. Data cost is a real constraint for Nigerian users — video must never autoplay on mobile data.

### 5.5 Description & amenities
- `description`: free text, 50–2000 characters, profanity and contact-detail filtered (to prevent off-platform circumvention).
- `amenities[]`: predefined list (Generator, Parking, Security, Gym, Pool, Borehole, POP ceiling, Fitted kitchen, Wardrobe, Air conditioning, Elevator, Estate/gated) plus custom free-text entries, capped at 5 custom items.

---

## 6. Trust Layer 1 — Landlord verification

**Design tension:** too strict and there is no inventory; too loose and the product is indistinguishable from what already exists. The MVP recommendation is *strict verification with a fast, assisted path* — a human onboarding call for the first cohort of landlords rather than a self-serve form they will abandon.

### 6.1 Required inputs

**Identity**
- NIN or vNIN (16-digit token)
- Phone OTP verification

**Ownership proof — any one of:**
- Certificate of Occupancy (C of O)
- Deed of Assignment
- Purchase Receipt
- Governor's Consent

**Property legitimacy**
- Property address
- Survey plan, **or**
- Land Use Charge receipt (optional, but treated as a strong positive signal)

**Special case — family land ("Omo Onile")**
- Family Resolution Letter, **or**
- Letter of Administration

This path must exist. A meaningful share of Lagos property sits outside the clean-title paper trail, and excluding it excludes real supply.

### 6.2 Review process
1. Landlord submits documents.
2. Automated checks: NIN validity via identity provider, document readability, duplicate-address detection against existing listings.
3. Manual admin review. Target SLA: 48 hours.
4. Outcome: Approved → `Verified Landlord` badge; Rejected → reason given, one resubmission permitted; Escalated → additional documents requested.

### 6.3 Outputs
- **Verified Landlord** — identity and ownership confirmed
- **Verified Property** — this specific address confirmed against submitted title

Both badges display on every listing. A landlord verified on one property does not get automatic verification on another.

---

## 7. Trust Layer 2 — Tenant / buyer verification

### 7.1 Identity levels

**Level 1 — Anonymous**
No verification. Can browse and filter all listings. Cannot save, apply, or contact.

**Level 2 — Verified Identity**
Required to apply, save, or contact. One of:
- vNIN (16-digit token) + live selfie with liveness check
- Live selfie with liveness check + OTP to a registered number

vNIN is preferred over raw NIN: it is a tokenised, expiring reference and it materially reduces the platform's data-breach exposure. Raw NIN should not be stored where a vNIN token will do.

### 7.2 Serious buyer/tenant qualification

**This should be optional in MVP, not mandatory.** Requiring financial proof before a first enquiry will collapse the demand side. Instead, make it a *badge* that raises an applicant's position in the landlord's inbox — carrot, not gate. _See Decision 5._

Options (user chooses one):

1. **Financial proof** — bank statement linked via open-banking API (Mono, Okra) to verify available funds against listing cost. Read-only, consent-scoped, never stored raw.
2. **Pre-approval** — mortgage pre-approval letter (buyers) or proof-of-funds document.
3. **Legal representation** — lawyer name and NBA enrolment verification.

### 7.3 Intent profile
Short, mandatory before first application. Cheap for the user, extremely valuable to the landlord.

- **Timeline:** immediate · within 1 month · 1–3 months · 3+ months / exploring
- **Payment plan:** full payment · mortgage · instalments
- **Budget range:** min/max

The intent profile is attached to every application and is the primary sorting signal in the landlord inbox.

---

## 8. Anti-spam and platform integrity

### 8.1 Application limits
- Maximum **5 applications per day** per user
- Maximum **30 applications per month** per user
- Counter resets at 00:00 WAT / on the calendar month
- User sees remaining quota before submitting

### 8.2 Spam detection
- Near-identical message bodies sent across multiple listings
- Repeated listing uploads from one account within a short window
- Velocity anomalies (bursts of applications in minutes)
- Contact details embedded in messages or descriptions to move the transaction off-platform

Detected accounts are rate-limited first, then queued for human review. Automatic permanent bans are not recommended in MVP — the false-positive cost is too high with low volume.

### 8.3 Listing validation
- **Duplicate detection:** perceptual image hashing plus address matching. The same property listed twice by different accounts is the clearest agent-chain signal available.
- **Suspicious pricing flag:** listing priced more than a set deviation from the area/type median is held for review rather than auto-published.
- **Missing critical data:** listings failing required-field completeness cannot be submitted.

---

## 9. Reporting system

Users can report:
- Agents posing as landlords
- Scam listings
- Spam users

**Actions available:** flag listing, flag user.

**Handling:** every report enters an admin queue with reporter, target, category, and free-text reason. Three or more independent reports against one listing auto-suspends it pending review. Suspension is reversible; the intent is to fail safe toward the user.

---

## 10. Ghost listing prevention

The single most important integrity feature for this market. A platform that solves only this is already differentiated.

| Mechanism | Detail |
|---|---|
| **Periodic re-verification** | Every 60 days the landlord must confirm the listing is still available |
| **"Still available?" prompt** | Push notification, email, and WhatsApp message with one-tap Yes/No |
| **Auto-expiry** | No response within 7 days of the prompt → listing hidden from search (not deleted); landlord can reactivate in one tap |
| **Visible freshness** | Every listing card shows "Confirmed available [date]" |
| **Application-triggered check** | After 3 applications with no landlord response in 72 hours, trigger an availability check |

---

## 11. Dynamic tenancy agreement `[Later]`

A strong differentiator and a genuine cost saving — a standard Lagos tenancy agreement is routinely a five-figure legal fee for a document that is 90% boilerplate.

**Functionality**
- Auto-generate a tenancy agreement from: property details, rent terms, duration, tenant and landlord verified identities
- Editable clauses: payment structure, maintenance responsibility, notice period
- Export as PDF
- Optional: digital signing

**Prerequisites before building**
- Legal review of the base template by a Nigerian property lawyer, per state
- Clear product positioning: Hecta provides a document template, not legal advice. Liability language must be reviewed by counsel.
- Both parties verified at Trust Layer 1 / Level 2 respectively

This should not ship until the core marketplace has liquidity. It is a retention feature, not an acquisition one.

---

## 12. Key product decisions required

These are blocking. Development cannot scope accurately until they are settled.

| # | Decision | Recommendation | Rationale |
|---|---|---|---|
| 1 | **Flatmate feature in MVP?** | **No** | Matching logic and UX complexity are disproportionate to MVP value. Revisit post-launch. |
| 2 | **Location granularity — is Area required?** | Area optional, multi-select | Area boundaries are colloquial and contested; forcing one hides inventory. |
| 3 | **Videos in MVP?** | Optional field, not required | High value in the Lagos market — video is the strongest anti-ghost-listing signal available. But transcoding, storage, and user data costs are real. Suggest: allow video, cap at 90s, never require it. |
| 4 | **Map view** | V2 | List + filters first. Map is expensive to build well and adds little before there is inventory density. |
| 5 | **Verification strictness** | Strict for landlords, light for tenants | Landlord side is where the trust problem lives, and there are fewer of them to hand-hold. Tenant financial proof should be a badge, not a gate. |
| 6 | **Are agents ever allowed on the platform?** | Open | Not addressed in source notes. Landlord-direct positioning is cleaner, but agents control real inventory in Nigeria. Needs an explicit answer. |
| 7 | **Monetisation model** | Open | Not addressed in source notes. Options: listing fees, featured placement, success fee, tenant subscription. Affects data model and needs deciding before launch. |
| 8 | **Launch city** | Open | Recommend a single city, likely Lagos, to concentrate inventory density. A thin marketplace across five cities fails; a dense one in three areas works. |

---

## 13. Future concepts

### 13.1 Live demand pool / reverse listings
Verified tenants post what they want and their budget; landlords with matching properties get notified. This inverts the market — instead of demand chasing supply through stale listings, supply responds to verified, funded demand.

Strategically the most interesting idea in the source notes. It is only viable once there is a critical mass of verified users on both sides; launching it into an empty marketplace produces posts that no one answers. Target: post-MVP, once verified landlord count supports meaningful match rates.

### 13.2 WhatsApp-first landlord interface
Landlords manage listings entirely from WhatsApp Business — no new app to learn. This is the highest-leverage adoption idea in the document. Nigerian landlords already live in WhatsApp; asking them to learn a dashboard is the main friction point in landlord onboarding.

Scope when built: availability confirmations, new-application notifications, accept/decline, listing status changes. Initial listing creation, which requires document upload, may still need the web flow.

---

## 14. Non-functional requirements

| Area | Requirement |
|---|---|
| **Performance** | Listings page loads in under 3s on a 3G connection. Images lazy-loaded and served in WebP. |
| **Mobile** | Mobile-first. Assume the majority of traffic is Android on metered data. |
| **Offline tolerance** | Saved listings and viewed properties cached for offline viewing. |
| **Data protection** | NDPR compliant. NIN/vNIN and identity documents encrypted at rest, access-logged, retention-limited. Documents deleted after a defined retention window post-verification. |
| **Auditability** | Every verification decision logged with reviewer identity and timestamp. |
| **Accessibility** | WCAG 2.1 AA target for core flows. |

---

## 15. Success metrics

**Trust (primary)**
- Ghost listing rate: reports of unavailable listings ÷ total listings
- Verified listing share: target 100% at launch by construction
- Listing freshness: median days since last availability confirmation

**Marketplace health**
- Verified landlords onboarded
- Active listings per target area
- Application-to-response rate (landlord responsiveness)
- Application-to-inspection conversion

**Funnel**
- Browse → verify conversion
- Verification completion rate (drop-off by step, both sides)
- Time from app open to first application

**Counter-metrics (watch for harm)**
- Landlord verification abandonment rate — if this exceeds ~40%, verification is too strict
- Applications per listing — if very high, the qualification layer isn't filtering

---

## 16. Phasing

**Phase 1 — MVP**
Intent selection · location search · listings with filters · property details · landlord verification (Trust Layer 1) · tenant identity verification (Level 2) · applications with intent profile · application limits · reporting · ghost listing prevention · admin review console

**Phase 2**
Saved searches and alerts · in-app inspection scheduling · qualification badges (financial proof, pre-approval, legal) · WhatsApp landlord interface · text search · listing duplication

**Phase 3**
Map view · live demand pool / reverse listings · dynamic tenancy agreement · digital signing · flatmate matching (if validated)

---

## 17. Open questions

1. Which identity provider for NIN/vNIN verification — direct NIMC integration or an aggregator (Dojah, Prembly, Smile ID)?
2. Which open-banking provider for financial proof — Mono or Okra?
3. What is the admin review team size, and what listing volume does that support before the 48-hour SLA breaks?
4. Is there a fallback verification path for landlords who are unwilling to submit title documents digitally?
5. How are properties managed by a caretaker on an owner's behalf handled — a distinct authorised-representative role?
6. What happens to a listing when a landlord's verification lapses or is revoked?
