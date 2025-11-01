**Project Goal**
- Build a bio link generator with a Bento grid layout using Next.js (App Router), Server Actions, TypeScript, Tailwind, shadcn/ui, Framer Motion, NextAuth.js, PostgreSQL 17, and Cloudflare R2. Keep environment variables minimal.

**Stack**
- Next.js (App Router) + Server Actions
- TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Framer Motion for Bento animations
- NextAuth.js for authentication (database sessions, email/password Credentials provider for MVP)
- PostgreSQL 17 (via Drizzle ORM)
- Cloudflare R2 for media storage (S3-compatible via AWS SDK v3)

**Architecture Overview**
- UI: Server Components-first, Client Components where interaction/animation is required.
- Data: Drizzle ORM schema and migrations targeting PostgreSQL 17.
- Auth: NextAuth.js sessions stored in Postgres; email/password via Credentials provider for MVP (no OAuth to keep env minimal).
- Storage: R2 bucket for avatars/backgrounds/media; uploads handled via Server Actions.
- Routing: Public profile at `/u/:handle`; authenticated editor at `/dashboard`.
- Deployment: Coolify on VPS (Node.js runtime, `output: standalone`).
- Server Actions: All mutations (create/update/delete resources, uploads, reordering) invoked from forms/actions.

**Milestones**
1) Scaffold & Tooling
- Initialize Next.js App Router + TS; Tailwind; set up shadcn/ui; Framer Motion.
- Add Drizzle ORM + Postgres driver; NextAuth.js with bcryptjs; R2 S3 client wrapper.
- Add base layout, theme, and Bento primitives.

2) Auth (NextAuth.js, minimal env)
- Email/password sign up/in/out; password hashing with `bcryptjs`.
- Protect `/dashboard`; expose `auth()` helper for Server Actions.

3) Database & Migrations
- Define tables: `user`, `session`, `profile`, `link`, `card`, `asset`.
- Implement drizzle-kit migrations and seed.

4) Editor (Bento Grid)
- Editable grid with shadcn/ui + Framer Motion; create/edit/delete/reorder cards.
- Card types (MVP): link, social, email, text; extensible pattern for future cards.

5) Media Uploads (R2)
- R2 S3 client and upload Server Action (image validation, type/size limit).
- Store object key + public URL; optional image transformations via Next/Image.

6) Public Profile
- SEO-friendly public page `/u/:handle` with theming and animated Bento grid.
- Link click tracking (increment counters only for MVP).

7) Polish & QA
- Empty states, error boundaries, optimistic updates for reorder.
- Lighthouse & Core Web Vitals pass; minimal bundle.

8) Optional Enhancements (Phase 2)
- OAuth providers (GitHub/Google) if desired.
- Custom domains for profiles.
- Advanced analytics, scheduled link rot checks.

**Data Model (initial)**
- `user` (id, email unique, hashed_password, created_at)
- `session` (id, user_id fk, expires_at)
- `profile` (id, user_id unique fk, handle unique, display_name, bio, avatar_asset_id, banner_asset_id, theme_json, updated_at)
- `asset` (id, user_id fk, bucket, key, content_type, width, height, size_bytes, public_url, created_at)
- `card` (id, profile_id fk, type enum ['link','social','email','text'], title, subtitle, url, icon, image_asset_id, cols int, rows int, position int, data_json, created_at, updated_at)
- `link` (id, profile_id fk, label, url, clicks int, position int, created_at, updated_at) — optional if separate from `card`

Notes:
- Use `card` as the primary Bento item. `link` table optional; can be represented as `card` with `type='link'`.
- `position` for simple ordering; future: drag/resize to set `cols/rows` and order.

**Server Actions (MVP)**
- Auth: `login`, `logout`, `register`.
- Profile: `updateProfile`, `updateTheme`.
- Cards: `createCard`, `updateCard`, `deleteCard`, `reorderCards`.
- Assets: `uploadAsset`, `deleteAsset`.
- Tracking: `trackClick`.

**Minimal Environment Variables**
- `DATABASE_URL` — Postgres 17 connection string.
- `R2_ACCOUNT_ID` — Cloudflare account id.
- `R2_ACCESS_KEY_ID` — R2 S3 access key id.
- `R2_SECRET_ACCESS_KEY` — R2 S3 secret.
- `R2_BUCKET_NAME` — R2 bucket for uploads.
- `R2_PUBLIC_BASE_URL` — base public URL for served objects (e.g., `https://pub-xxxxxx.r2.dev` or your CDN/domain).
- `NEXT_PUBLIC_APP_URL` — base URL for generating absolute links.

Notes:
- Auth via email/password with NextAuth.js Credentials provider requires no OAuth provider secrets (keeps env minimal). Add OAuth later if needed.
- R2 S3 endpoint is derived from account id (e.g., `https://<accountid>.r2.cloudflarestorage.com`).

**Local Development**
- Postgres 17: use Docker or a managed instance. Example docker: `postgres:17` exposing 5432.
- Create `.env.local` with the minimal vars above.
- Package manager: pnpm.
- Scripts (planned): `dev`, `build`, `start`, `db:generate`, `db:migrate`, `db:studio`.

**Security & Compliance**
- Hash passwords with `bcryptjs` (12 salt rounds).
- Validate file uploads (type/size), strip EXIF for images if needed.
- Use Server Actions only on secure forms; add CSRF-safe patterns (non-GET, revalidatePath).
- Enforce per-user access control for all mutations.

**Key Implementation Decisions (assumptions)**
- ORM: Drizzle ORM for type-safe Postgres 17 and smooth Server Actions usage.
- Auth: NextAuth.js with database sessions, custom email/password forms using Credentials provider.
- Bento: Use CSS Grid + Framer Motion for enter/reorder transitions; start with simple `position` ordering.
- Analytics: Only click count for MVP.
- R2: Public bucket for MVP.
- Profiles reachable at `/u/:handle` only (no custom domains in MVP).

**Decisions Confirmed**
- Auth: email/password only for MVP.
- Deployment: Coolify on VPS (Node runtime).
- R2: public bucket for now.
- Card types: link, social, email, text.
- Analytics: click count only.
- Tooling: pnpm, ESLint, Prettier.
- Routing: use `/u/*user*`; no custom domains in MVP.

**Remaining Inputs**
- Node.js version preference for production (recommend LTS 20 or 22).
- Next.js version preference (recommend v15 stable with React 19).
- Postgres provisioning on VPS (Docker via Coolify or external). Need `DATABASE_URL` format.
- R2 details: account id, bucket name, and public base URL to use.

**Doc References (for build-time accuracy)**
- Next.js: /vercel/next.js
- NextAuth.js: /nextauthjs/next-auth
- Drizzle ORM: /drizzle-team/drizzle-orm-docs
- Tailwind: /tailwindlabs/tailwindcss.com
- shadcn/ui: /shadcn-ui/ui
- Framer Motion: /grx7/framer-motion
- Cloudflare R2: /websites/developers_cloudflare_r2
