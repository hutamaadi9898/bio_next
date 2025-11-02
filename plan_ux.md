# UX Plan — From Sign‑In To First Publish

Purpose: Define a simple, modern, and accessible UX that moves a new user from the marketing site to a published profile in minutes. Aligned with App Router + Server Actions, type‑safe TS, Drizzle + Postgres 17, shadcn/ui, Tailwind, Framer Motion, NextAuth (Credentials), and Cloudflare R2.

## Goals
- Time‑to‑value: first attractive published grid in ≤ 2 minutes, ≤ 4 clicks after auth.
- Low friction: minimal fields, inline validation, clear copy, progressive disclosure.
- High default beauty: presets, auto‑palette, hero/links autogeneration.
- Accessibility: keyboard/ARIA complete; motion fallbacks; AA contrast.
- Performance: small client islands, SSR‑first, no heavy client deps for simple UI.

## Principles
- Server Components by default; Client Components only for interaction/motion.
- All writes via Server Actions with zod validation and authorization helpers.
- Keep client bundles small; keep client boundaries leaf‑level (uploaders, dialogs, drag/drop).
- No new env vars for UX; optional deps only if they deliver clear UX value.

## Journey Overview
1) Landing (marketing) ⇒ clear CTA “Create your Biogrid”
2) Register (Credentials) ⇒ small form, inline server errors, password meter
3) Auto sign‑in ⇒ redirect to `/onboarding`
4) Onboarding (fast track):
   - Choose preset
   - Upload avatar + banner (optional but encouraged)
   - Add up to 3 links (URLs or “platform @handle”)
   - Finish & Publish ⇒ generates “Hero + About + Links”, sets published, opens Share
5) Share modal ⇒ Copy, QR, Web Share, social intents
6) Dashboard hint ⇒ subtle “Next steps” tips (add more cards, resize/reorder)

## Screens & Flows

### 1) Register (Credentials)
- Fields: Display name, Handle, Email, Password.
- Copy: “Launch in minutes. No OAuth required.”
- Inline server‑validated errors via `useActionState` (no client‑only validation).
- Handle availability check: optional, via Server Action submitted on blur.
- Password strength meter: progressive hinting (no blocker) using a tiny client util.
- On success: auto sign‑in (done), redirect to `/onboarding`.

Files (existing):
- `app/(auth)/register/page.tsx`, `components/auth/register-form.tsx`, `app/(auth)/actions.ts`

Improvements:
- Add handle availability check Server Action (optional) and inline hint.
- Add minimal password strength meter (no new deps; simple length/variety).

### 2) Onboarding (Fast Track)
- Goals: Reduce choices, show immediate progress.
- Steps (single page, vertical sections):
  1. Preset: Minimal, Studio, Neon, Pastel. Preselect Minimal.
  2. Media: Avatar + Banner upload (R2), instant preview.
  3. Links: 3 inputs; accept URLs or “platform @handle”. Parser autogenerates titles and icons later.
  4. Finish & Publish: Creates “Hero” (6x2), “About”, and up to 3 link/social cards; sets `publishedAt`; revalidates public page; opens Share sheet.
- Motion: Subtle reveal on section completion; skeleton states for uploads; reduced motion respect.
- A11y: Field labels, descriptions, validation messaging, focus management on errors.

Files (existing):
- Page: `app/(dashboard)/onboarding/page.tsx`
- Actions: `app/(dashboard)/onboarding/actions.ts` (`completeOnboardingAction`)
- Upload: `uploadAvatarAction`, `uploadBannerAction`
- Parser: `lib/social.ts`
- Share: `components/share/share-sheet.tsx`

Improvements:
- Add inline success ticks per section after completion.
- Provide “Skip for now” on media; never block publish.
- Add helper text under links with examples.
- Ensure contrasting preset swatches with clear selection outline (keyboardable radios).

### 3) Public Profile Header (Share)
- Add small “Share” button under display name to open system share or modal.
- Share sheet includes: copy link (with feedback), QR code, Web Share API, Twitter/LinkedIn intents.

Files (existing):
- Public page: `app/(public)/u/[handle]/page.tsx`
- Share button: `components/public/public-share.tsx`
- Share sheet: `components/share/share-sheet.tsx`

### 4) Dashboard Tips
- Banner in `DashboardHeader` when `cardCount < 3`: “Quick start” → `/onboarding`.
- After publish, surface inline tips: “Add card”, “Drag to reorder”, “Resize for emphasis”.
- Keep tips lightweight (no tour framework); use small, dismissible banners.

## Interaction & Visual System
- Typography: Use theme tokens from `lib/themes.ts` to ensure consistent headings/labels.
- Buttons/Dialogs/Inputs: shadcn/ui primitives with accessible focus rings.
- Motion: Framer Motion for enter/exit/reorder; respect `prefers-reduced-motion`.
- Grid: Keep Bento grid layout SSR‑first; animate reorder/resize only on client.
- Palette: Auto‑palette from avatar or banner (already supported with fallback).

## Accessibility
- Keyboard navigation through inputs and radios; visible focus states.
- Proper `aria-describedby` for helper/error text; dialogs with initial focus.
- Ensure AA contrast across presets (backgrounds vs accents).
- Provide text equivalents for QR and decorative images have `aria-hidden`.

## Performance
- Server Components for pages/sections; client islands only for uploads, dialogs, and motion.
- No client fetches for writes; all mutations use Server Actions with `revalidatePath`.
- Debounce handle check action to reduce server load (if implemented).
- Avoid large client deps; reuse existing stack (shadcn, Framer Motion, Sonner).

## Optional Dependencies (nice‑to‑have)
- None required. If adopted later:
  - `cmdk` for a quick action palette in the dashboard.
  - A lightweight, zero‑env password strength helper (or keep custom).
  - A local QR generator route (to avoid external image source) if desired.

## Metrics (no new env)
- Use existing `audit_logs` for funnel events:
  - `register`, `onboarding.complete`, `profile.publish`
- Count how many users publish within first session; average steps completed.
- No client analytics bundle on public pages.

## Acceptance Criteria
- Registration: server‑validated inline errors; auto sign‑in on success.
- Onboarding: users can publish within 4 clicks; media optional; must always have a hero tile.
- Share: Share button visible on public profile; copy/QR/intent work.
- A11y: keyboard‑complete; screen reader labels; motion fallbacks.
- Perf: no heavy client deps; LCP within target; minimal CLS.

## Implementation Plan (incremental)
1) Register polish
   - Add optional handle availability Server Action (blur handler), inline feedback.
   - Add basic password meter text (length, variety) — client‑only hint.
2) Onboarding UX refinements
   - Section success states (icons/text), improved helper copy, skip buttons.
   - Keyboardable preset radios with visible selection outline.
3) Share
   - Keep current Share sheet; consider local QR route later (no deps/env changes).
4) Dashboard hints
   - Add dismissible tip banners for first‑time users (no persistent storage needed; optional localStorage).
5) Metrics
   - Ensure audit events fired: `onboarding.complete`, `profile.publish` (exists), optional `register` (exists).

## References (Context7)
- Next.js (Server Actions, Forms): `/vercel/next.js`
- Drizzle ORM (queries, relations): `/drizzle-team/drizzle-orm`
- NextAuth (Credentials): `/nextauthjs/next-auth`
- Tailwind CSS: `/tailwindlabs/tailwindcss.com`
- shadcn/ui: `/shadcn-ui/ui`
- Framer Motion: `/grx7/framer-motion`
- Cloudflare R2: `/websites/developers_cloudflare_r2`

