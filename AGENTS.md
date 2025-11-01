This AGENTS.md applies to the entire repository.

**Purpose**
- Shared guidance for contributors and AI agents working on the bio link generator (Bento grid) app.
- Keep changes minimal, type-safe, and aligned with App Router + Server Actions.

**Project Conventions**
- Language: TypeScript strict.
- Framework: Next.js (App Router, Server Components-first).
- Styling: Tailwind CSS with shadcn/ui components.
- Animations: Framer Motion; avoid heavy runtime state for simple transitions.
- Auth: NextAuth.js with database sessions; email/password via Credentials provider (no OAuth by default).
- DB: PostgreSQL 17 via Drizzle ORM and drizzle-kit migrations.
- Storage: Cloudflare R2 via S3-compatible AWS SDK v3 client.
- Mutations: Server Actions only; no client-side fetch for writes unless justified.
- Secrets: `.env.local` for local only; never commit secrets.
 - Package manager: pnpm. Lint/format: ESLint + Prettier.

**Repository Layout (expected)**
- `app/` — App Router routes.
  - `app/(public)/u/[handle]/page.tsx` — public profile.
  - `app/(auth)/login`, `app/(auth)/register` — auth routes.
  - `app/(dashboard)/dashboard/page.tsx` — editor.
  - `app/api/auth/[...nextauth]/route.ts` — NextAuth API route handler.
- `components/` — UI components (prefer Server Components; use `"use client"` only when needed).
- `lib/` — non-UI modules: `db` (drizzle), `auth` (nextauth config, adapter, session), `r2` (S3 client), `env`.
- `drizzle/` — schema and migrations.
 - `next.config.ts` — set `output: 'standalone'` for containerized deploys (Coolify).

**Server Components vs Client Components**
- Default to Server Components for pages/sections.
- Add `"use client"` only for interactive pieces (drag/drop, animation, inputs).
- Keep client boundaries leaf-level and small for bundle size.

**Server Actions**
- Keep actions colocated per feature, e.g., `app/(dashboard)/dashboard/actions.ts` or `app/(public)/u/[handle]/actions.ts`.
- Always validate input (e.g., zod or hand-rolled parsing). Reject on invalid state.
- Authorize using a shared helper (e.g., `requireUser()` or `auth()` in `lib/auth`).
- Use `revalidatePath()` or `revalidateTag()` after mutations.
- Avoid returning large payloads; prefer ids or re-fetch on server rerender.

**Database (Drizzle + Postgres 17)**
- Define schema in `drizzle/schema.ts` (or split by domain under `drizzle/schema/*`).
- Use `drizzle-kit` for migrations. Never hand-edit SQL migration files once committed.
- Prefer explicit selects; avoid `selectAll` in hot paths.
- Use `position` integers for simple ordering; add compound unique constraints where needed.

**Auth (NextAuth.js)**
- Store sessions in Postgres via database strategy. Do not rely on JWT for sessions.
- Passwords: hash with `bcryptjs` (12 salt rounds).
- Expose `getCurrentUser()` and `requireUser()` utilities for Server Actions and layouts.
- Keep login/register forms server-validated; avoid client-only validation.
- Configure via `lib/auth/nextauth.ts` with Credentials provider and custom Drizzle adapter.

**Cloudflare R2 (S3)**
- Use `@aws-sdk/client-s3` with endpoint `https://<accountid>.r2.cloudflarestorage.com` and region `auto`.
- Store object keys namespaced by user id and date; never trust user-provided filenames directly.
- Keep buckets public for MVP (simple); if switching to private, add signed URL helpers.
- Validate uploads: mime whitelist (images), max size, basic image sniffing.

**UI & Motion**
- Use shadcn/ui primitives (button, card, input, dialog, toast).
- Keep the Bento grid as a responsive CSS Grid; use Framer Motion for enter/exit/reorder transitions.
 - Prefer composition: small card components by type (`CardLink`, `CardEmail`, `CardText`, `CardSocial`).

**Environment Variables**
- Minimal set expected in `.env.local`:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
  - `NEXTAUTH_URL` (e.g., `http://localhost:3000` for dev, production URL for prod)
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `R2_PUBLIC_BASE_URL`
  - `NEXT_PUBLIC_APP_URL`
- Do not introduce new env vars without discussion; prefer runtime config or defaults where possible.

**Deployment (Coolify on VPS)**
- Next.js Node.js runtime; enable `output: 'standalone'` to simplify container image.
- Recommend Node LTS (20 or 22) and `pnpm i --frozen-lockfile` during build.
- Provide `DATABASE_URL` and R2 env via Coolify UI or secrets.
- Postgres via Coolify-managed service or external; ensure connectivity and SSL if required.

**Quality Bar**
- Type-safety: no `any`; narrow types using Drizzle inference where possible.
- Accessibility: ensure keyboard navigation and aria labels for interactive UI.
- Performance: keep client bundles slim; avoid large client-only deps.
- Security: validate all user input; enforce per-user access in actions.

**Tasks & Commits**
- Keep changes scoped and minimal; mention affected areas in PR/commit messages.
- Do not rename files or restructure unless part of agreed refactor.
- Prefer incremental migrations; avoid destructive changes without data plan.

**Runbook (expected scripts)**
- `dev`: start Next.js dev server.
- `build` / `start`: production build/run.
- `db:generate`: generate migrations from schema.
- `db:migrate`: apply migrations.
- `db:studio`: optional drizzle studio.

**When in Doubt**
- Favor Server Components and Server Actions.
- Ask before adding dependencies or env vars.
- Follow the data model in `plan.md`; discuss deviations.
