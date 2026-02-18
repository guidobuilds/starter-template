# AGENTS.md

## Purpose
This file guides coding agents working in this B2B starter monorepo.
Follow existing patterns before introducing new ones.

## Repository Overview
- Monorepo with Bun workspaces.
- `api/`: Bun + Elysia + Prisma + Vitest (backend).
- `front/`: Next.js App Router + NextAuth + Tremor UI + Tailwind + Vitest (frontend).
- Root scripts orchestrate both packages.

## Application Routes
- `/` → Root redirect (authenticated users go to dashboard/admin)
- `/login` → Authentication page (Google OAuth + email/password)
- `/quotes/overview`, `/quotes/monitoring`, `/quotes/audits` → User dashboard (authenticated)
- `/admin` → Administration root (admin only)
- `/admin/users` → User management with CRUD table (admin only)
- `/admin/settings/general` → Instance name configuration (admin only)
- `/admin/settings/auth/basic` → Password policy settings (admin only)
- `/admin/settings/auth/google` → Google OAuth credentials storage (admin only)

## Source of Truth
- Root scripts: `package.json`
- API scripts/config: `api/package.json`, `api/tsconfig.json`, `api/vitest.config.ts`
- Frontend scripts/config: `front/package.json`, `front/tsconfig.json`, `front/.eslintrc.json`, `front/.prettierrc`, `front/vitest.config.ts`
- Architecture docs: `README.md`, `PLAN.md`
- Prisma schema: `api/prisma/schema.prisma` (copy to `front/prisma/` when changed)

## Cursor / Copilot Rules
- No `.cursorrules` or `.cursor/rules/` or `.github/copilot-instructions.md` found.
- If added later, treat as high-priority instructions and update this document.

## Package Manager
- Use `bun` for all commands.
- Install dependencies from repo root: `bun install`.

## Common Commands (Root)
- Dev (api + front): `bun run dev`
- Build (api + front): `bun run build`
- Test (api + front): `bun run test`
- Coverage (api + front): `bun run coverage`
- Lint (api + front): `bun run lint`
- Typecheck (api + front): `bun run typecheck`

## Database Commands (Root)
- Start dev Postgres: `bun run db:up`
- Stop dev Postgres: `bun run db:down`
- Run migrations: `bun run db:migrate`
- Seed data: `bun run db:seed`
- Open Prisma Studio: `bun run db:studio`

## Running a Single Test (Important)
Vitest is used in both packages.

- Single API test file: `bun run --cwd api test -- tests/app.test.ts`
- Single API test by name: `bun run --cwd api test -- tests/app.test.ts -t "returns health status"`
- Single frontend test file: `bun run --cwd front test -- src/lib/api/users.test.ts`
- Single frontend test by name: `bun run --cwd front test -- src/lib/api/users.test.ts -t "listUsers"`

## Coverage Requirements
- Coverage thresholds enforced: lines 80%, functions 80%, branches 50-60%, statements 80%.
- Keep coverage at/above thresholds when changing covered modules.

## Architecture Patterns

### BFF (Backend for Frontend) Pattern
- Frontend NEVER calls backend API directly from client components.
- All API calls go through Next.js API routes (`front/src/app/api/*`).
- BFF routes proxy to backend with `x-internal-api-key` header.
- Backend validates API key for all non-health routes.

### Settings System
- `AppSettings` singleton model stores all application configuration.
- Instance name is used in sidebar header and page metadata.
- Password policy enforced on registration (not sign-in).
- Settings are admin-only; fetched server-side in layouts.

### Data Models
- User: name, email (unique), status (ENABLED/DISABLED), admin (boolean), timestamps.
- AppSettings: instanceName, password policy fields, google OAuth fields.

## Language and TypeScript Standards
- TypeScript strict mode enabled in both packages.
- Prefer explicit types at module boundaries (API payloads, return types).
- Use `unknown` in catch blocks and narrow before use.
- Avoid `any`; if unavoidable, isolate and document why.
- Preserve `@/*` path alias usage in both packages.

## Imports and Module Conventions
- Use ES modules and `import` syntax.
- Prefer absolute alias imports (`@/...`) for project code.
- Group imports: framework/external first, internal alias next, local relative last.
- Use `import type` when importing types only.
- Do NOT add code comments unless explicitly requested.

## Formatting and Linting
- Prettier settings: `printWidth: 80`, `tabWidth: 2`, `semi: false`, `doubleQuote`, `trailingComma: all`.
- ESLint extends `next/core-web-vitals`.
- API lint runs `tsc --noEmit`.
- Do not introduce formatting that conflicts with existing setup.

## Naming Conventions
- Components: `PascalCase` (`UsersTable`, `AuthCard`).
- Functions/variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` for env/static constants (`API_BASE`, `INTERNAL_API_KEY`).
- Route handlers: exported HTTP verb functions (`GET`, `POST`, `PATCH`, `DELETE`).

## API and Validation Patterns
- Validate external input with Zod (`safeParse` or direct `parse`).
- Return structured error payloads: `{ code: string, message: string, details?: unknown }`.
- Use `errorResponse()` helper from `api/src/lib/errors.ts`.
- HTTP status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 500 internal.
- In Elysia routes, set status via `set.status`.

## Auth and Security Conventions
- NextAuth with JWT strategy (not database sessions).
- Google OAuth + Credentials (email/password) providers.
- Admin flag fetched fresh in session callback for real-time checks.
- `/admin/*` routes protected by layout (checks `session.user.admin`).
- Middleware protects all routes except `/login`, `/api/auth/*`, `/api/register`.
- Never commit secrets or real credentials.

## Testing Conventions
- Use Vitest (`describe`, `it`, `expect`, `vi`).
- Mock Prisma boundaries for API tests; use `vi.mock("@/lib/db", ...)`.
- Mock fetch globally for frontend API client tests: `vi.stubGlobal("fetch", ...)`.
- Use `vi.stubEnv("INTERNAL_API_KEY", "...")` for API tests needing auth.
- Mock `next/headers` for layout tests that use `cookies()`.
- Add/update tests for behavior changes, especially auth, routing, and API contracts.

## Documentation and API References
- Always use Context7 MCP when you need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## Agent Workflow Expectations
- Before finalizing substantial changes:
  1. Run targeted tests for touched areas
  2. Run package-level test/lint/typecheck
  3. Run root checks for cross-package changes
- Prefer minimal, focused diffs.
- Preserve existing architecture (BFF pattern, Elysia API, NextAuth session flow).
- Update this AGENTS.md when tooling, rules, or conventions change.
