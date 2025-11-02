# Post-MVP Roadmap — Bento-Inspired UI/UX Edition

Purpose: plan incremental features after MVP while staying aligned with AGENTS.md conventions: Server Components-first, Server Actions for mutations, Drizzle + Postgres 17, R2 storage, type-safe TS, minimal env vars, and Coolify deploys.

Legend  
- [ ] task (atomic)  
- [dep] introduces a dependency — discuss first  
- [env] introduces new env vars — discuss first  
- [db] requires a migration via drizzle-kit

Constraints  
- Mutations via Server Actions only; always validate inputs and authorize (`auth()` / `requireUser()`); call `revalidatePath()` / `revalidateTag()`.  
- Prefer Server Components; keep client islands small/leaf-level.  
- Do not add env vars or heavy deps without prior discussion.

---

## Phase 1 — Hardening, UX, and Quality (no new env)

- [x] Accessibility pass on interactive UI (labels, roles, focus, keyboard nav)
- [x] Motion fallbacks (`prefers-reduced-motion`), color contrast, skip links
- [x] Friendly empty states suggesting hero tile first (Bento pattern)
- [x] Consistent, server-validated form messages (i18n-neutral copy)
- [x] Enforce image sizes & MIME types (client hints + server check)
- [x] Add per-user sliding-window rate limit [db]
- [x] Click tracking hygiene: debounce + bot filter
- [x] SEO: canonical URL, OpenGraph, Twitter meta
- [x] Dynamic OG image route (`app/(public)/u/[handle]/opengraph-image.tsx`)
- [x] Sitemap & robots (no plugin)
- [x] Landing: B2C positioning + pricing (Free, $5, $20) with clear CTAs
- [x] Lightweight audit log for mutations [db]
- [x] Structured server logs for failed actions

**Acceptance**
- [x] Axe / manual a11y checks pass
- [x] Public profiles render OG images + meta correctly
- [x] Rate-limit UI friendly; no client fetches for writes

---

## Phase 2 — Editor Improvements (Grid & Draft/Publish)

- [x] Drag-reorder (Framer Motion, stable IDs)
- [x] Resize support: persist `cols`/`rows`; snap to grid [db]
- [x] Keyboard reorder with visible outline
- [x] Client-side undo/redo; commit via Server Action
- [x] Draft/publish toggle (`published_at` nullable) [db]
- [x] Read-only Preview mode (server rendered)
- [x] Revalidate only on publish

**Acceptance**
- [x] Reorder/resize persists via Server Actions
- [x] Drafts hidden; publish toggles visibility

---

## Phase 3 — Bento Visual System & Themes (no new env)

Goal: replicate Bento’s *rich, asymmetric, aesthetic-first* feel through presets — not deep customization.

- [x] Theme presets (`theme_json` variants: Minimal, Studio, Neon, Pastel)
- [x] Asymmetric grid templates (“Hero + 2”, “Hero + Masonry”, “Cards Only”)
- [x] Typographic tokens (display/title/label) unified across tiles
- [x] Micro-interactions: hover lift, tap scale, focus rings
- [x] Auto-palette from avatar/hero image (server color extraction) [dep]
- [x] Mobile thumb-zone alignment (CTA placement)

**Acceptance**
- [x] Preset switch changes layout/palette/typography instantly
- [ ] All presets meet AA contrast

---

## Phase 4 — Onboarding & Content Ingestion

Goal: “Show, don’t tell.” Get users to a visual grid fast.

- [ ] Starter flow: choose preset → upload avatar/hero → add 3 links
- [ ] Social parser: detect handle → resolve URL + icon
- [ ] Autogenerate first layout (“Hero”, “About”, “Links”)
- [ ] Share sheet: copy link, QR, social share intents

**Acceptance**
- [ ] Users publish an attractive grid within 4 clicks
- [ ] Always at least one hero tile

---

## Phase 5 — New Card Types (opt-in, light embeds)

- [x] CardVideo: YouTube lite embed
- [x] CardMusic: Spotify lightweight iframe
- [ ] CardMap: static image preview + deep link
- [ ] CardGallery: image grid from R2; multi-upload [db]
- [ ] CardContact: mailto fallback + optional form [env][dep]
- [ ] CardDivider/Spacer for layout rhythm

**DB & Actions**
- [ ] Extend `card.type` union; discriminated payloads [db]
- [ ] Validate `data_json` per card type (zod or hand-rolled)

**Acceptance**
- [ ] New cards render in editor + public views
- [ ] No large bundle growth

---

## Phase 6 — Motion & Performance Polish (no new env)

- [ ] Staggered tile entry (SSR-safe)
- [ ] Idle image prefetch via server hints
- [ ] Skeletons matching tile dimensions; themed colors
- [ ] Continuous layout stability (CLS < 0.05)

**Acceptance**
- [ ] LCP ≤ 2.5s on mid device (4G)
- [ ] No layout shift on load

---

## Phase 7 — Auth Enhancements (optional)

- [ ] Email verification (token, expiry, `verified_at`) [db][env][dep]
- [ ] Password reset flow [db][env][dep]
- [ ] Session management UI
- [ ] OAuth (GitHub/Google via Lucia) [env][dep]
- [ ] 2FA (TOTP) [db][dep]

**Acceptance**
- [ ] Unverified users restricted; feature-flag gated

---

## Phase 8 — Analytics v2 (privacy-aware, no vendor)

- [ ] Unique visitors (daily) via salted IP+UA [db]
- [ ] Referrers + UTM capture [db]
- [ ] Time-series rollups via scheduled Server Action [db]
- [ ] CSV export
- [ ] Analytics toggle on public profile

**Acceptance**
- [ ] Public loads with no analytics bundle
- [ ] Server-side only, no PII

---

## Phase 9 — Custom Domains (advanced)

- [ ] Domain mapping (`domain`: host unique, profile_id, verified_at) [db]
- [ ] Host routing via `headers().get('host')`
- [ ] DNS TXT verification [env]
- [ ] Coolify wildcard/per-domain setup docs
- [ ] Canonical + redirect rules

**Acceptance**
- [ ] Host-based profile resolution; cache includes host

---

## Phase 10 — Monetization (Lemon Squeezy)

- [ ] Billing tables: `plan`, `user_plan`, `provider_events` [db]
- [ ] Checkout + Webhooks integration [env][dep]
- [ ] Feature gates by plan (domains=Max, themes=Pro+, caps by tier)
- [ ] Soft limits + upsell CTAs
- [ ] Admin backoffice (refunds, overrides)

**Acceptance**
- [ ] Idempotent webhooks (signature verified)
- [ ] CTAs route to proper plan signup

---

## Phase 11 — Media & Storage Enhancements

- [ ] Private bucket + signed URL helpers [env]
- [ ] Responsive image variants [dep]
- [ ] Strip EXIF data [dep]
- [ ] Background jobs via DB + server cron

**Acceptance**
- [ ] Public pages serve via Next/Image or R2 URLs

---

## Phase 12 — API Surface & Webhooks

- [ ] Public read-only profile JSON route
- [ ] Incoming webhooks (billing, auth callbacks)
- [ ] Outbound webhooks (analytics exports) [env]
- [ ] API keys table (scopes, rate-limit) [db]

**Acceptance**
- [ ] Read-only API; no write duplication

---

## Phase 13 — Internationalization (optional)

- [ ] Choose framework (next-intl) [dep]
- [ ] Extract strings (en → id)
- [ ] Locale routing for profiles (opt-in, SEO-safe)

---

## Database Changes (overview)

- [x] `card`: add `cols`, `rows` [db]
- [x] `profile`: add `published_at`, `theme_json` present [db]
- [x] `audit_log`: (id, user_id, action, entity, entity_id, created_at) [db]
- [x] `rate_limit`: (user_id, action, window_start, count) unique [db]
- [ ] `analytics`: `click_event_raw`, `visit_daily` [db]
- [ ] `domain`: (host unique, profile_id, verified_at, created_at) [db]
- [ ] `billing`: `plan`, `user_plan`, `provider_events` [db]
- [ ] `auth`: `email_verification`, `password_reset`, `totp_secret` [db]
- [ ] `api_keys`: (user_id, key_hash, scopes, created_at, revoked_at) [db]
- [ ] `profile_preset`: (profile_id, preset_key, created_at) [db]

> All migrations via `drizzle-kit`; never hand-edit SQL.

---

## Non-Goals

- Heavy SDK embeds (SSR-unfriendly)
- Client fetches for writes
- Real-time collaboration

---

## Implementation Notes

- Grid templates: asymmetric “bento” layouts with tokenized spacing and typography.  
- Tiles: media-first, minimal chrome, motion for delight with graceful fallbacks.  
- Focus on default beauty — published profiles should look good even with minimal input.

References  
- Bento.me design study (visual hierarchy, asymmetric grid)  
- Next.js Server Actions, cache, `revalidatePath`  
- Lucia Auth (App Router sessions)  
- Drizzle ORM (Postgres 17)  
- Cloudflare R2 (S3 compatible)  
- shadcn/ui (form, dialog, toast)  
- Framer Motion (layout transitions)
