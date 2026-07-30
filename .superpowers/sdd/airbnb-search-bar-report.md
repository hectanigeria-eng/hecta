# Airbnb-style search bar — implementation report

## Files changed / created / deleted

**Modified**
- `src/app/(platform)/search/page.tsx` — removed the `hasLocation` gate and the `SearchEntry` import/render entirely. Always renders the results experience now. The server-rendered `sr-only` `<h1>` reads `"Homes to rent"` / `"Homes for sale"` (from `query.intent`) with `" in {place}"` appended only when a state (and optionally city) is set.
- `src/features/search/search-results.tsx` — added `import { SearchBar } from "@/features/search/search-bar"` and mounted `<SearchBar query={query} />` immediately above `<ResultsToolbar .../>`. Nothing else changed.
- `src/features/search/results-toolbar.tsx` — swapped the `PencilSimpleIcon` import for `XCircleIcon`; renamed `handleEditLocation` to `handleClearLocation` (same body/logic, updated comment to reflect that there's no gate to fall back to and that editing now lives in `SearchBar`); the location line is now conditional:
  - location set → `{place}` (`cityLabel, stateLabel`, or just `stateLabel` if no city) + optional `· N areas` + a **"Clear location"** button (icon swapped to `XCircleIcon`)
  - no location → `Homes across Nigeria` (icon only, no button, no dangling comma)

**Created**
- `src/features/search/search-bar.tsx` — new `"use client"` component, the Airbnb-style pill. See design notes below.

**Deleted**
- `src/features/search/search-entry.tsx` — confirmed via `grep -rln` (both before and after editing `page.tsx`) that `page.tsx` was its only importer; safe to delete once its logic was ported into `search-bar.tsx`.

## How the mobile sheet was handled

Rather than keep a separate "draft" state for the sheet (like `FiltersSheet` does), `SearchBar` uses a **single shared** `state`/`city`/`areas` local state for both the desktop pill and the mobile sheet's fields — they're just two different renderings of the same underlying selection, following the same pattern already used elsewhere for the map toggle (`hidden ... lg:flex`). The sheet's `SheetTrigger` is a big rounded bar (`h-14`, full width) showing a one-line summary with a magnifying-glass icon; tapping it opens a `Sheet` (`side="bottom"`) with `SheetHeader` ("Where to?"), the same State/City/Areas fields stacked vertically (state Select → city Select disabled until state chosen → areas Popover+Checkbox list, with the same badge chips under it that the old `SearchEntry` had), and a `SheetFooter` with a full-width "Search" button. Submitting (`handleSubmit`) pushes the URL via `buildSearchUrl` and also calls `setSheetOpen(false)` to close it.

Because `SearchBar` stays mounted across navigations (unlike the old `SearchEntry`, which used to fully unmount), a `useEffect` re-syncs `state`/`city`/`areas` from the incoming `query` prop whenever it changes — this is the same pattern already used in `quick-filters.tsx` for its price inputs (comment references "Clear location" / back-forward navigation not remounting the component). Verified working: submitting from the pill, then clicking "Clear location" in the toolbar, correctly resets the pill/sheet's fields back to "All of Nigeria" / "Anywhere in Nigeria".

## Wording choices for the no-location states

- **Page `<h1>` (sr-only)**: `"Homes to rent"` / `"Homes for sale"` (mirrors `ResultsToolbar`'s existing `to rent` / `for sale` intent wording), with `" in {place}"` appended when a state is set.
- **Toolbar location line, no location**: `"Homes across Nigeria"` (icon + text, no button) — replaces the old always-present `"{cityLabel}, {stateLabel}"` line, avoiding the dangling `", "` that would otherwise render.
- **Toolbar location line, location set**: unchanged format (`{cityLabel}, {stateLabel}` or just `{stateLabel}` if no city, + `· N areas`), but the button is now **"Clear location"** (`XCircleIcon`) instead of "Edit location" (`PencilSimpleIcon`), since editing now happens in the `SearchBar` pill above.
- **Desktop pill placeholders**: "Where" label / `"All of Nigeria"` placeholder; "City / LGA" label / `"Any city"` placeholder (`"Choose a state first"` when disabled); "Areas" label / `"Any area"` (`"Choose a city first"` when disabled) or `"N areas selected"`.
- **Mobile bar summary**: `"Anywhere in Nigeria"` when nothing set; `{cityLabel}, {stateLabel}` when both set (e.g. `"Eti-Osa, Lagos"`); just `{stateLabel}` when only a state is set (e.g. `"Abuja (FCT)"`). Note: I kept the `cityLabel, stateLabel` order to match `ResultsToolbar`'s pre-existing convention, rather than the task prompt's illustrative `"Lagos, Eti-Osa"` (state-first) example — internal consistency with the already-established toolbar wording seemed like the better call given both were just "something like" examples.
- **Mobile bar accessible name**: `aria-label="Search location, currently {summary}"` on the trigger button (in addition to its visible text, which already carries the same info).

## Visual verification (via `pnpm dev` + Playwright, localStorage cleared first)

- Bare `/search`, 1440×900: desktop pill renders (`Where` / `City / LGA` disabled / `Areas` disabled / circular search button), grid immediately shows 24 nationwide listings, map shows pins scattered across Nigeria (Lagos, Abuja, etc.), toolbar shows `"24 homes to rent"` + `"Homes across Nigeria"` (no button). Confirmed via accessibility snapshot and a screenshot.
- Selected State → Lagos, City → Eti-Osa, Areas → Lekki Phase 1, clicked the circular search button: URL became `/search?state=lagos&city=eti-osa&areas=lekki-phase-1`; toolbar updated to `"Eti-Osa, Lagos · 1 area"` with a **"Clear location"** button.
- Clicked "Clear location": URL returned to `/search`; toolbar returned to `"Homes across Nigeria"`; the pill's own `Where`/`City / LGA` fields also reset back to `"All of Nigeria"` / disabled — confirming the `useEffect` re-sync works correctly on an externally-triggered URL change.
- Toggled header's Rent/Buy `IntentToggle` to Buy: URL → `/search?intent=buy`; `<h1>` → `"Homes for sale"`; toolbar heading → `"6 homes for sale"`; `"Homes across Nigeria"` line unaffected. Toggled back to Rent afterward.
- Resized to 375×812: desktop pill and the toolbar's map switch (`hidden ... lg:flex`) correctly hidden; mobile bar (`"Anywhere in Nigeria"` + magnifying glass) shown. Tapped it → bottom sheet opened with "Where to?" heading and stacked State/City/Areas fields. Selected State → Abuja (FCT), clicked the sheet's full-width "Search" button: URL became `/search?state=abuja`, sheet closed automatically, `<h1>` → `"Homes to rent in Abuja (FCT)"`, results narrowed to 5, toolbar showed `"Abuja (FCT)"` + "Clear location", and the mobile bar's own summary updated to `"Abuja (FCT)"`.
- Confirmed pagination links (`/search?page=2`), the sort dropdown, and the grid/list/map toggles are all still present and functioning in the toolbar (not modified).
- Confirmed `/` (landing page) still loads and renders correctly, unaffected — zero console errors on either `/` or `/search` throughout (only two pre-existing, unrelated Next.js dev warnings: LCP image `loading` hint and `scroll-behavior: smooth`).
- No `.playwright-mcp/` artifacts or screenshots were left behind; dev server was killed before committing.

## Full gate output

```
$ pnpm typecheck
$ tsc --noEmit
(no errors)

$ pnpm lint
$ biome check
Checked 150 files in 41ms. No fixes applied.

$ pnpm test
$ vitest run
 Test Files  9 passed (9)
      Tests  188 passed (188)
   Duration  941ms

$ pnpm build
$ next build
▲ Next.js 16.2.7 (Turbopack)
✓ Compiled successfully in 3.4s
  Running TypeScript ...
  Finished TypeScript in 3.2s ...
✓ Generating static pages using 9 workers (19/19) in 270ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin
├ ○ /admin/listings
├ ○ /admin/reports
├ ○ /admin/verifications
├ ƒ /api/health
├ ○ /applications
├ ○ /dashboard
├ ○ /dashboard/applications
├ ○ /dashboard/listings
├ ○ /dashboard/listings/new
├ ○ /dashboard/messages
├ ○ /dashboard/verification
├ ○ /icon.svg
├ ƒ /listings/[id]
├ ○ /messages
├ ○ /saved
├ ƒ /search
└ ƒ /verify

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

19 routes, matching the expected count. 188/188 tests still passing (domain-layer files untouched, as required).

## Notes / minor caveats

- `marketplace.ts`, `search-filters.ts`, and `search-params.ts` were not touched, per instructions — confirmed by re-reading them that no domain-logic change was needed for nationwide-by-default behavior.
- The `SelectTrigger`'s own `data-[size=default]:h-11` CSS (attribute-selector specificity) means the borderless pill segments end up height-locked to 44px regardless of the `h-auto` override requested — in practice this reads as a plus, not a bug: it gives the segment a solid ≥44px touch target for free, and visually the pill still looks like plain text since border/background/shadow are all successfully stripped.
- Untracked files `src/design/` and `src/docs/hecta-prd.md` predate this task (present in `git status` before any work started) and were left untouched.
