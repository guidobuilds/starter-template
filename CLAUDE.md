# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

B2B starter monorepo with Bun workspaces: `api/` (Bun + Elysia + Prisma + PostgreSQL) and `front/` (Next.js App Router + NextAuth + Tailwind). Uses the BFF (Backend for Frontend) pattern — the frontend never calls the API directly from the browser; instead, Next.js API routes (`/api/users/*`, `/api/settings/*`) proxy requests to the Elysia backend using an internal API key (`x-internal-api-key` header).

## Commands

```bash
# Install
bun install

# Dev (both api + front)
bun run dev

# Build / test / lint / typecheck (both packages)
bun run build
bun run test
bun run coverage
bun run lint
bun run typecheck

# Single package
bun run --cwd api test
bun run --cwd front test

# Single test file
bun run --cwd api test -- tests/app.test.ts
bun run --cwd front test -- src/lib/api/users.test.ts

# Single test by name
bun run --cwd api test -- tests/app.test.ts -t "returns health status"

# Database (Docker PostgreSQL for local dev)
bun run db:up          # start postgres
bun run db:down        # stop postgres
bun run db:migrate     # prisma migrate dev
bun run db:seed        # seed admin user (admin@example.com / admin12345)
bun run db:studio      # prisma studio
bun run db:logs        # tail postgres logs

# Prisma
bun run --cwd api prisma:generate
bun run --cwd api prisma:migrate
bun run --cwd api prisma:seed
```

## Architecture

### API (`api/src/`)
- `app.ts` — Elysia app with CORS, internal API key guard (skipped for `/health`), and route mounting
- `routes/users.ts` — User CRUD endpoints under `/v1/users` with Zod validation and pagination
- `routes/settings.ts` — AppSettings CRUD under `/v1/settings` (general, auth/basic, auth/google)
- `lib/db.ts` — Prisma singleton
- `lib/errors.ts` — Standardized error responses `{ code, message, details? }`
- `prisma/schema.prisma` — User model, AppSettings model (singleton, `id="default"`), plus NextAuth models (Account, Session, VerificationToken)
- `scripts/start.sh` — Docker entrypoint: runs `prisma migrate deploy` (fallback `db push`) then starts server

### Frontend (`front/src/`)
- `auth.ts` — NextAuth v5 config with Prisma adapter, **JWT sessions**, Google + Credentials providers; `session` callback fetches `admin` field from DB
- `middleware.ts` — Protects all routes except `/login`, `/api/auth/*`, `/api/register`; redirects unauthenticated users to `/login` (cookie-presence check only, not cryptographic)
- `app/api/users/route.ts` and `[id]/route.ts` — BFF proxy routes for user CRUD (auth + admin checks for writes)
- `app/api/settings/route.ts` and sub-routes — BFF proxy for settings (admin-only for all operations)
- `app/api/register/route.ts` — Self-registration endpoint (creates enabled non-admin user; reads password policy from AppSettings directly)
- `app/admin/layout.tsx` — Server-side admin guard; non-admins → `/quotes/overview`; also fetches `instanceName` from API directly
- `app/login/page.tsx` — Login page with `AuthCard` component
- `lib/api/users.ts` — Client-side API functions calling Next.js BFF routes
- `lib/api/settings.ts` — Client-side API functions for settings BFF routes
- `lib/prisma.ts` — Prisma singleton with `import "server-only"`
- `components/` — Tremor-based UI components (charts, tables, sidebar, etc.)

### Auth Flow
1. Middleware checks session cookie presence on every request
2. Unauthenticated users → `/login`
3. Admin pages (`/admin/*`) require `admin=true` (enforced server-side in layout)
4. Disabled users (`status=DISABLED`) cannot sign in (checked in `signIn` callback)

### Prisma Models
- **User** — `name`, `email` (unique), `passwordHash?`, `status` (ENABLED/DISABLED), `admin` (bool), timestamps
- **AppSettings** — Singleton (`id="default"`), `instanceName?`, password policy fields (`passwordMinLength`, `requireSpecial/Number/Uppercase/Lowercase`), `googleClientId?`, `googleClientSecret?`
- **Account/Session/VerificationToken** — NextAuth OAuth models

## Conventions

- **Package manager**: Bun (always use `bun`, not npm/yarn)
- **Path aliases**: `@/` maps to `src/` in both packages
- **Validation**: Zod v4 — use `z.email()` not `z.string().email()`, `z.int()` not `z.number().int()`, `safeParse` for all external input
- **Testing**: Vitest; jsdom + Testing Library for frontend; mock Prisma boundaries, no real DB in tests
  - API tests: call `app.handle(new Request(...))` directly, use `vi.stubEnv` and `vi.mock("@/lib/db", ...)`
  - Frontend tests: call route handlers directly, use `vi.mock("@/lib/prisma", ...)` and `vi.stubGlobal("fetch", ...)`
- **Coverage thresholds**: API ≥80% lines/functions/statements, 60% branches; Front ≥80% lines/functions/statements, 50% branches
- **Formatting** (frontend): Prettier — `semi: false`, `singleQuote: false`, `printWidth: 80`, `trailingComma: all`, `endOfLine: lf`, `tabWidth: 2`, tailwindcss plugin with `tailwindFunctions: ["tv", "cx"]`
- **API lint**: `tsc --noEmit` (no separate ESLint); frontend uses ESLint (`eslint-config-next`)
- **Error responses**: `{ code: string, message: string, details?: any }` — codes: `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`, `EMAIL_CONFLICT`, `INTERNAL_ERROR`, `PROXY_ERROR`
- **Imports**: ES modules, `import type` for type-only imports, grouped as external → alias → relative
