# Project Rules

## Stack

- React + Next.js, Tailwind CSS
- State: Zustand (avoid prop drilling)
- Routing/page logic in `src/app/`, UI logic in components/features

## Folder Structure (Mandatory)

```text
src/
  app/        → routing & page composition only
  components/
    ui/       → generic reusable UI
    layout/   → shells, headers, sidebars
  features/   → domain-specific components
  hooks/      → custom hooks
  lib/        → helpers (no UI)
  constants/  → constants & config
```

## Components

- Use shadcn/ui components by default — only build a custom component when shadcn/ui does not cover the use case
- Create a component if: reused 2+ places, represents a UI block, has logic/state, JSX > ~40 lines
- Naming: PascalCase, purpose-based (`PaymentSummaryCard` ✅, `BlueBox` ❌)
- Prefer semantic HTML (`section`, `header`, `article`, `main`, `nav`)
- Use Fragment instead of wrapper divs; use Tailwind layout (`flex`, `grid`, `gap`) over nesting

## Product Requirements (Mandatory)

- Before implementing any feature, read the relevant PRD in `docs/` to understand the requirements
- Implementation must satisfy all acceptance criteria defined in the PRD — do not ship partial or misaligned work
- If the PRD conflicts with the design reference, flag it before proceeding — do not silently pick one
- If a PRD does not exist for a feature, ask before building

## Design Reference (Strict)

- **Reference > Preference > New Ideas** — follow design references exactly
- Must match: section order, grid, spacing, typography hierarchy, colors, component shapes, hover/focus/loading states
- Only allowed deviations: responsiveness, accessibility, hard technical constraints
- NOT allowed: aesthetic improvements, mixing references, new UI patterns, arbitrary spacing/type changes

## Styling

- Tailwind-first, token-driven colors only
- ✅ `bg-primary-500`, `text-primary-200` — ❌ `text-[#0f172a]`, `style={{ color: 'var(...)' }}`
- No arbitrary color values
- Arbitrary values allowed only if no utility exists and truly one-off; if used 2+ times → extract with `@apply`
- `@apply` class names must describe purpose, not appearance

## Performance

- Prefer Server Components; use `"use client"` only when necessary
- No heavy computation in render or request paths
- No N+1 queries — batch, paginate, and dedupe
- No large datasets in React state — paginate or stream
- Import only what's needed; prefer built-in APIs (e.g., `Intl`)
- Dynamically import large client components

## Security

- Never hardcode or log secrets
- Client-exposed env vars must use `NEXT_PUBLIC_*`
- Validate all inputs server-side with strict schemas; reject unexpected fields
- Always verify auth server-side; enforce least privilege; never trust the client for authorization
- Prevent XSS, CSRF; use strict CORS; never expose stack traces in production

## Error Handling

- Never log sensitive data
- Return safe, user-friendly error messages to clients
- Keep internal error details server-side only

## Pre-Deploy Checklist

- No heavy compute in request paths
- No unbounded memory usage
- No N+1 queries
- Minimal client components
- No secrets in logs or bundles
- Inputs validated, authorization enforced, queries paginated

## TypeScript

- No `any` — use `unknown` and narrow it explicitly
- No type assertions (`as X`) without a comment explaining why it's safe
- Prefer `interface` for object shapes, `type` for unions/intersections/aliases
- Never suppress errors with `@ts-ignore` or `@ts-expect-error` without an explanatory comment
- Enable and respect strict mode — do not relax compiler options

## Data Fetching

- Fetch on the server by default (Server Components, Server Actions)
- Use SWR or React Query only for client-side data that must stay live or be user-triggered
- No raw `fetch` calls inside components — wrap them in a `lib/` function
- Never expose internal API URLs or keys to the client

## Validation

- All external data (API responses, form inputs, URL params, cookies) must be parsed through a Zod schema before use
- Reject or throw on parse failure — never silently fall back to defaults for untrusted input

## Accessibility

- All interactive elements must be keyboard accessible (focusable, operable with Enter/Space)
- Images require meaningful `alt` text; use `alt=""` only for purely decorative images
- Every form input must have an associated `<label>` (via `htmlFor` or wrapping)
- Use ARIA attributes only when semantic HTML cannot express the role — prefer native elements
- Sufficient color contrast required; never rely on color alone to convey meaning

## Next.js Image & Fonts

- Always use `next/image` instead of `<img>` — no exceptions
- Always use `next/font` for font loading — no Google Fonts CDN `<link>` tags

## Code Quality

- No `console.log` in committed code — use a logger or remove before committing
- No commented-out code blocks — delete dead code, use git history to recover it
- No TODOs without a linked issue (`// TODO: #123 — description`)
- No magic numbers — extract named constants

## Testing

- Unit test all pure functions in `lib/`
- Write component tests for complex interactive UI (forms, modals, multi-step flows)
- Mock only external boundaries (APIs, databases, third-party SDKs) — never internal modules
- Test file location mirrors source: `src/lib/foo.ts` → `src/lib/foo.test.ts`

## Database & ORM (Drizzle)

- Use Drizzle ORM with PostgreSQL
- Schema lives in `src/db/schema.ts` — schema is the source of truth
- Connection pooling required — set `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`
- Add indexes for every column used in `WHERE`, `ORDER BY`, or `JOIN`
- Use composite indexes for common multi-column queries
- Never use `db:push` in production — always use generated migrations
- Commit the `drizzle/migrations/` folder — never edit deployed migrations
- Select only needed columns — never `SELECT *`
- Always paginate list queries — no unbounded results
- Use database aggregations (`COUNT`, `SUM`, `AVG`) — not JavaScript
- Maintain separate databases for dev, staging, and production

## API & Backend

- Wrap all fetch calls in a typed API client class in `lib/` — no raw `fetch` in components
- Use request cancellation (`AbortController`) for client-side fetches that may unmount
- Rate limit all API routes — stricter limits for auth endpoints (5 req/15min)
- Queue heavy work (emails, reports, image processing) as background jobs — never block request handlers
- Use Redis for caching hot data and session storage in production
- Cache strategy: static content (1hr+), user-specific (5-15min), real-time (don't cache)
- Invalidate related caches when data changes
- Add health check endpoints that verify DB and Redis connectivity
- Implement graceful shutdown — close HTTP server, DB pool, and Redis on `SIGTERM`/`SIGINT`
- Use response compression in production (gzip/brotli)

## SEO

- Every page must have unique `<title>` (under 60 chars, primary keyword first) and `<meta description>` (under 160 chars)
- Use Next.js `Metadata` API for all metadata — per-page `generateMetadata` for dynamic pages
- Only one `<h1>` per page — follow logical header hierarchy (`h1` → `h2` → `h3`, no skipping)
- Clean URL slugs: short (3-5 words), lowercase, hyphens, include target keyword
- Add JSON-LD structured data (`Organization`, `Article`, `FAQ`, `Product`) where applicable
- Create `app/sitemap.ts` and `app/robots.ts` using Next.js conventions
- Use canonical tags to prevent duplicate content issues
- Implement breadcrumbs with `BreadcrumbList` schema markup
- Internal links must use descriptive anchor text — never "click here"
- Every page reachable within 3 clicks from homepage
- Use `301` redirects for permanent URL changes — never chain redirects
- Add `hreflang` tags for multi-language content

## Core Web Vitals

- LCP (Largest Contentful Paint) < 2.5s
- INP (Interaction to Next Paint) < 200ms
- CLS (Cumulative Layout Shift) < 0.1
- TTFB (Time to First Byte) < 800ms
- Preload critical resources (fonts, hero images) with `<link rel="preload">`
- Always specify `width` and `height` on images to prevent layout shift
- Reserve space for dynamic content (ads, embeds) with `min-height`

## Re-render & Bundle Optimization

- Avoid creating new objects/arrays in render — extract to constants or `useMemo`
- Memoize callbacks passed to children with `useCallback`
- Use `React.memo` for expensive components that receive stable props
- Debounce search inputs and frequent user interactions (300ms default)
- Use virtual lists (`@tanstack/react-virtual`) for datasets > 100 items
- Analyze bundle with `@next/bundle-analyzer` before optimizing
- Use `next/dynamic` with `ssr: false` for heavy client-only components
- Import only what's needed — `import { X } from 'lib'` not `import * as lib`
- Prefer lighter alternatives: `date-fns`/`dayjs` over `moment`, native `fetch` over `axios`
- Use `optimizePackageImports` in `next.config.js` for icon/component libraries

## Lazy Loading

- Use `next/dynamic` for heavy components (charts, editors, admin panels)
- Provide `loading` fallback skeletons for lazy-loaded components
- Wrap below-the-fold sections in `<Suspense>` with skeleton fallbacks
- Mark above-the-fold images with `priority` — lazy load everything else

## State Management

- Local/simple: `useState`, `useReducer`
- Shared (few components): Context + `useReducer`
- Complex/global: Zustand with `persist` middleware where needed
- Server state: TanStack Query or SWR — not Zustand
- Forms: React Hook Form with Zod resolver

## Responsive Design

- Mobile-first approach — base styles for mobile, scale up with `md:`, `lg:`
- Use Tailwind responsive utilities — no custom media queries unless necessary
- Minimum touch target size: 44x44px with adequate spacing
- Use `hover:` states only via `@media (hover: hover)` — don't assume hover capability
- Test on real devices, not just Chrome DevTools

## Environment & Config

- Type-safe environment variables — validate with Zod schema at build time
- Never commit `.env.local` — only `.env.production` (no secrets) and `.env.example`
- All secrets managed via deployment platform env vars
- Use Docker multi-stage builds for production — `npm ci --only=production`

## Monitoring & Error Tracking

- Set up error tracking (Sentry) — capture client and server errors
- Monitor Core Web Vitals in production
- Track key user events with typed analytics helpers
- Never expose internal error details to clients — log server-side, return safe messages

## CI/CD

- GitHub Actions: lint → type-check → test → build → deploy
- Run E2E tests (Playwright) on PRs against main
- Block deploys on lint, type, or test failures
- Use `npm ci` (not `npm install`) in CI pipelines

## General

- Follow existing patterns before inventing new ones
- Ask before creating new abstractions
- Default to safety, simplicity, and consistency
