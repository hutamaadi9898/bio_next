# Post‑MVP Roadmap (Phased, Atomic, Checklists)

Purpose: plan incremental features after MVP while staying aligned with AGENTS.md conventions: Server Components-first, Server Actions for mutations, Drizzle + Postgres 17, R2 storage, type‑safe TS, minimal env vars, and Coolify deploys.

Legend
- [ ] task (atomic)
- [dep] introduces a dependency — discuss first
- [env] introduces new env vars — discuss first
- [db] requires a migration via drizzle‑kit

Constraints
- Mutations via Server Actions only; always validate inputs and authorize (`auth()` / `requireUser()`) and call `revalidatePath()` / `revalidateTag()`.
- Prefer Server Components; keep client islands leaf‑level and small.
- Do not add env vars or heavy deps without prior discussion.

---

## Phase 1 — Hardening, UX, and Quality (no new env)

- [ ] Accessibility pass on interactive UI (labels, roles, focus, kbd nav)
- [ ] Color contrast, prefers‑reduced‑motion fallbacks, skip links
- [ ] Error boundaries for client islands; friendly empty/error states
- [ ] Form validation messages consistent (server‑validated), i18n‑neutral copy
- [ ] Enforce max sizes on images (client hint + server check) and MIME sniffing
- [ ] Add basic rate‑limit for sensitive actions (per‑user, sliding window) [db]
- [ ] Click tracking hygiene: ignore bots via simple UA filter; debounce multiple rapid clicks per session
- [ ] SEO: add `metadata`/`generateMetadata`, canonical URL, OpenGraph & Twitter meta for profiles
- [ ] Dynamic OG image route for profiles (`app/(public)/u/[handle]/opengraph-image.tsx`)
- [ ] Sitemap and robots (`app/sitemap.ts`, `robots`) without external plugins
- [ ] Add lightweight audit log for mutations (action name, user_id, target id, ts) [db]
- [ ] Monitoring hooks: structured server logs for action failures (no vendor yet)

Acceptance
- [ ] Axe (or manual) a11y checks pass on key screens
- [ ] Public profiles render OG images and correct meta
- [ ] Actions show rate‑limit response with friendly UI; no client fetch for writes

---

## Phase 2 — Editor Improvements (grid, draft/publish)

- [ ] Grid drag‑to‑reorder refinements with Framer Motion (stable IDs, layout)
- [ ] Resize support: persist `cols`/`rows` on card; snap to grid [db]
- [ ] Keyboard reorder (accessibility) with visual outline
- [ ] Undo/redo (client‑side) for reorder/resize; commit via Server Action
- [ ] Draft/publish toggle on profile: `published_at` nullable field [db]
- [ ] Preview mode in editor (server rendered, read‑only)
- [ ] Revalidation strategy: revalidate public path(s) on publish only

Acceptance
- [ ] Reorder/resize persists via Server Actions with validation and auth
- [ ] Draft profiles are not publicly accessible; publish toggles visibility

---

## Phase 3 — New Card Types (opt‑in, light embeds)

- [ ] CardVideo: YouTube/Vimeo with lite embeds; no heavy iframes by default [dep]
- [ ] CardMusic: Spotify/Apple Music lightweight embeds [dep]
- [ ] CardMap: Static map preview (image) with link to map app; avoid JS SDKs
- [ ] CardGallery: simple image grid backed by R2; upload multiple images [db]
- [ ] CardContact: mailto fallback; server‑sent contact form optional [env][dep]
- [ ] CardDivider/Spacer for layout composition (no data cost)

DB & actions
- [ ] Extend `card.type` union and narrow discriminated payloads [db]
- [ ] Validate per‑type `data_json` schema (zod or hand‑rolled)

Acceptance
- [ ] New cards render on public and editor views without large bundle growth

---

## Phase 4 — Auth Enhancements (optional)

- [ ] Email verification flow (tokens table, expiry, verified_at) [db][env][dep]
- [ ] Password reset via time‑boxed token + server action [db][env][dep]
- [ ] Session management UI (list + revoke)
- [ ] Optional OAuth: GitHub/Google with Lucia adapters [env][dep]
- [ ] 2FA (TOTP) opt‑in for Pro later [db][dep]

Acceptance
- [ ] Unverified users limited in public exposure; flows gated by feature flags

---

## Phase 5 — Analytics v2 (privacy‑aware, no vendor)

- [ ] Unique visitors (daily) using salted hash of IP+UA (salt rotates) [db]
- [ ] Referrers + basic UTM capture on click [db]
- [ ] Time‑series rollups (daily) materialized table via scheduled action [db]
- [ ] Export CSV for clicks/visitors
- [ ] Toggle analytics visibility on public profile

Acceptance
- [ ] Public profile loads without client analytics bundles
- [ ] Server‑side collection only; no PII stored

---

## Phase 6 — Custom Domains (advanced)

- [ ] Domain mapping tables: `domain` (host unique, profile_id, verified_at) [db]
- [ ] Host routing by `headers().get('host')` in App Router
- [ ] DNS verification via TXT; ownership UI [env]
- [ ] Wildcard or per‑domain setup in Coolify; document deploy steps
- [ ] Canonical URL + redirects between `app` domain and custom domains

Acceptance
- [ ] Requests resolve profile by host; public cache keys include host

---

## Phase 7 — Monetization (Lemon Squeezy)

- [ ] Plans/entitlements tables; per‑user plan with grace periods [db]
- [ ] Billing provider integration (Checkout + Webhooks) [env][dep]
- [ ] Feature gates: custom domains, advanced analytics, gallery size caps
- [ ] Soft limits with upsell in UI
- [ ] Admin backoffice: refunds, plan overrides

Acceptance
- [ ] Webhooks processed via route handler; idempotent with signature verify

---

## Phase 8 — Media & Storage Enhancements

- [ ] Optional private bucket + signed URL helpers [env]
- [ ] Image transforms: generate responsive variants on upload [dep]
- [ ] Strip EXIF on upload (security/privacy) [dep]
- [ ] Background jobs: best‑effort queue using DB + server cron (document cadence)

Acceptance
- [ ] Public pages still serve images via Next/Image or R2 public base URL

---

## Phase 9 — API Surface & Webhooks (minimal)

- [ ] Public read API for profile JSON (stable, cached) — route handler
- [ ] Incoming webhooks: billing, optional GitHub/Google auth callbacks
- [ ] Outbound webhooks (optional) for analytics exports [env]
- [ ] API keys table with scopes & rate‑limit [db]

Acceptance
- [ ] No duplication with Server Actions for writes; API is read‑only (MVP)

---

## Phase 10 — Internationalization (optional)

- [ ] Framework selection (next‑intl) [dep]
- [ ] Extract strings, minimal locales (en → id)
- [ ] Locale routing for public profiles (opt‑in, no SEO harm)

---

## Database Changes (overview)

- [ ] card: add `cols` int, `rows` int (resize); ensure bounds and defaults [db]
- [ ] profile: add `published_at` nullable, `theme_json` already present [db]
- [ ] audit_log: (id, user_id, action, entity, entity_id, created_at) [db]
- [ ] rate_limit: (user_id, action, window_start, count) composite unique [db]
- [ ] analytics tables: `click_event_raw`, `visit_daily` rollup [db]
- [ ] domain: (host unique, profile_id, verified_at, created_at) [db]
- [ ] billing: `plan`, `user_plan`, `provider_events` [db]
- [ ] auth extras: `email_verification`, `password_reset`, `totp_secret` [db]
- [ ] api_keys: (user_id, key_hash, scopes, created_at, revoked_at) [db]

All schema changes via `drizzle-kit` migrations; never hand‑edit SQL. Add compound uniques where needed (e.g., `card(profile_id, position)`; `rate_limit(user_id, action, window_start)`).

---

## Non‑Goals (for now)

- SSR‑unfriendly heavy SDK embeds that bloat client bundles
- Client‑side fetch for writes; stick to Server Actions
- Real‑time collaboration (would require websockets or a broker)

---

## References (for implementers)

- Next.js Server Actions, cache, `revalidatePath`: /vercel/next.js
- Lucia sessions (Next.js App Router): /lucia-auth/lucia
- Drizzle ORM (Postgres, constraints, migrations): /drizzle-team/drizzle-orm-docs
- Cloudflare R2 (S3, endpoint `https://<accountid>.r2.cloudflarestorage.com`, `region: 'auto'`): /websites/developers_cloudflare_r2
- shadcn/ui primitives (form, dialog, toast): /shadcn-ui/ui
- Framer Motion (layout / reorder patterns): /grx7/framer-motion

Notes
- Tag tasks that add deps/env with [dep]/[env] and discuss before implementation to keep the surface minimal and deploys simple.

