# Hecta platform — accepted follow-ups

Known items deliberately left unfixed when the `platform` branch reached merge-ready. Every one was reviewed and judged non-blocking. Recorded here so they aren't rediscovered from scratch.

**Status at merge:** 188 tests passing, typecheck clean, lint clean (149 files), production build succeeds (19 platform routes + landing). Final whole-branch review verdict: ready.

## Touch targets still under 44px

The project rule is a 44px minimum. Shared primitives were raised and the platform's own controls were aligned, but three remain, all pre-existing and outside the polish pass's scope:

- `src/features/apply/apply-dialog.tsx` — the "Edit" button is `h-8` (32px).
- `src/components/ui/pagination.tsx` — `PaginationLink` renders 40px. Currently unreachable: no seeded city has more than 12 active listings, so pagination never renders.
- Radix dialog close buttons render 36px, and the header Rent/Buy tabs 31px.

## Validation and data

- `moveInDate` in `src/lib/search-params.ts` is shape-validated (`YYYY-MM-DD`) but not calendar-validated, so `2026-13-45` passes the regex. Harmless in practice: the filter predicate is a lexicographic string compare, so an impossible month excludes everything rather than silently matching everything.
- `src/lib/mock/**` has no fixture-integrity tests, yet several store tests depend on specific seeded ids and statuses. A small test asserting referential integrity and the conditions the demo relies on (listing-31 trips the suspicious-price flag, listing-34 has three distinct-reporter reports, listing-1 is overdue for re-confirmation) would stop a future seed edit breaking those silently.

## Test-suite shape

171 of 188 tests target pure functions; 20 touch the store, which is the one module where a bug corrupts cross-persona state. No component (`.tsx`) has a test. The highest-value additions would be component tests for the two multi-step wizards (create-listing, identity verification) — the spec anticipated these and they were never added because no test runner for components was set up.

## Structure

- `src/features/dashboard/new-listing/wizard.tsx` is ~1,400 lines: the wizard shell plus all six step forms. Two reviewers judged this a preference rather than a defect — the steps are uniform, the heavy pieces are already extracted, and the parent's draft wiring reads better with the steps nearby. Splitting into `steps/*.tsx` with a shell under 300 lines is the obvious improvement if the file grows further.
- `src/components/ui/slider.tsx` is installed but imported by nothing. The spec's price *range* is two numeric inputs, not a slider. Left in place rather than churning a generated primitive.
- `User` in `src/lib/types.ts` collapses what the spec named `SeekerProfile` and `Landlord` into one interface with `identityVerified` / `landlordVerified` flags. Naming deviation only, no functional loss.

## Demo notes

- The seeded message thread and its application belong to **Tunde**, so the verified-tenant persona has a populated inbox on first visit. The consequence: `listing-1` already shows "Applied ✓" for Tunde. To demo a fresh apply-as-Tunde flow, use `listing-2` ("Serviced 3-Bed with Pool, Ikate").
- The `verifiedOnly` filter cannot change results with the current seed, because every `active` listing is verified by design. The wiring is correct and unit-tested; it is a property of the data, not a bug.
- Some verification states (`user-emeka` submitted, `ll-seed-3` info-requested) are not reachable through the persona switcher and were verified by code review and store inspection.

## Out of scope by design

Saved searches and alerts, inspection scheduling, the WhatsApp landlord interface, dynamic tenancy agreements, the reverse-listing demand pool, flatmate matching, real auth and identity providers, payments, document upload and storage, notifications, and platform i18n. The map was built despite the PRD listing it as V2, on explicit instruction.
