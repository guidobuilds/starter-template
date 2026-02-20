# B2B Starter Template Plan

## Requirement: Fix Post-Auth Redirect with Session Cookies

Fix post-authentication redirect flow using NextAuth database session cookies (HttpOnly) so users are redirected correctly by role after login:
- Admin users → `/admin/users`
- Non-admin users → `/quotes/overview`

This applies to both Credentials and Google sign-in flows. Include unit and integration test coverage.

## MVP 1 - Monorepo and Base Apps
- [x] Create root workspace with scripts for `dev`, `build`, `test`, `lint`, and `typecheck` that orchestrate `/api` and `/front`.
- [x] Create backend app in `/api` with Bun + Elysia + TypeScript and a health endpoint `GET /health` returning `{ "status": "ok" }`.
- [x] Create frontend app in `/front` by adapting the Tremor Planner base from `./planner-base` to Next.js App Router structure used by this template.
- [x] Add required route shells in frontend for `/`, `/admin`, and `/admin/users`.
- [x] Add MVP 1 tests: backend health endpoint test and frontend route smoke tests.

## MVP 2 - Database and User CRUD API
- [x] Configure Prisma in `/api` for PostgreSQL and add migration-ready schema.
- [x] Implement user model with fields: `name` (required), `email` (required, unique), `status` (`ENABLED` default or `DISABLED`), `createdAt`, `updatedAt`, and `admin` (`false` default).
- [x] Add auth persistence models needed for NextAuth (`Account`, `Session`, and `VerificationToken`) and credentials storage support via `passwordHash` on `User`.
- [x] Implement Elysia user endpoints:
  - `POST /v1/users` body `{ name, email, status?, admin? }`
  - `GET /v1/users` query `{ page?, pageSize?, search?, status? }`
  - `GET /v1/users/:id` path `{ id }`
  - `PATCH /v1/users/:id` body `{ name?, email?, status?, admin? }`
  - `DELETE /v1/users/:id` path `{ id }`
- [x] Add request validation and standardized error shape `{ code, message, details? }`.
- [x] Add MVP 2 integration tests for user CRUD success and failure cases.

## MVP 3 - Authentication and Registration
- [x] Configure NextAuth in `/front` with Prisma adapter and providers for Google OAuth and Credentials (email/password).
- [x] Implement self-registration endpoint `POST /api/register` body `{ name, email, password }` that stores a hashed password and creates enabled non-admin users.
- [x] Implement login and registration UI flows from `/` with both Google and email/password options.
- [x] Enforce auth and authorization:
  - authenticated access required for `/admin` and `/admin/users`
  - admin role required for user management actions
  - disabled users cannot log in
- [x] Add MVP 3 tests for registration, credentials auth behavior, and route protection.

## MVP 4 - Admin Users UI
- [x] Implement `/admin` dashboard root page.
- [x] Implement `/admin/users` page with users table shown by default containing columns: name, email, status, admin, created at, updated at, actions.
- [x] Implement admin actions in UI: create, edit, delete, and toggles for status/admin using forms and confirmations.
- [x] Connect frontend data layer to backend `/v1/users` endpoints with loading, error, and empty states.
- [x] Add MVP 4 tests for users table rendering and CRUD interactions.

## MVP 5 - Quality, Coverage, and Documentation
- [x] Configure test coverage reporting in `/api` and `/front` with enforced threshold greater than 80%.
- [x] Add scripts and docs for running full local validation: install, migrate, test, build.
- [x] Write root `README.md` with architecture, environment variables, setup, and verification commands.
- [x] Run full test/build flow and ensure required routes and features are manually verifiable.

## MVP 6 - Docker Image and Runtime Stack
- [x] Add root `docker-compose.yml` orchestrating three services: `front` (Next.js), `api` (Elysia), and `postgres` (PostgreSQL).
- [x] Add backend Docker image in `api/Dockerfile` to host the API service:
  - build and run Bun app
  - generate Prisma client during build
  - expose port `3001`
  - run Prisma migrations before API starts so `/health` and `/v1/users` are operational
- [x] Add frontend Docker image in `front/Dockerfile` to host the Next.js app:
  - multi-stage production build
  - expose port `3000`
  - run with environment variables for `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, OAuth credentials, and API base URL
- [x] Add PostgreSQL service in Compose using official `postgres` image:
  - configure database name, user, and password from environment
  - mount persistent volume for data
  - add healthcheck and make `api` wait for healthy database before startup
- [x] Add Docker environment template updates in `.env.example` for Compose network usage:
  - `DATABASE_URL` pointing to `postgres` service host
  - `NEXT_PUBLIC_API_URL` for browser requests
  - `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
  - Google OAuth variables for optional Google login
- [x] Add Docker runbook to `README.md` with exact commands:
  - `docker compose up --build`
  - `docker compose down`
  - `docker compose logs -f api front postgres`
  - optional seed command for admin user
- [x] Add Docker validation checklist and tests:
  - verify frontend root is reachable at `/`
  - verify backend health endpoint `GET /health`
  - verify backend user endpoints under `/v1/users`
  - verify database connectivity from API and successful migration on startup

## MVP 7 - Auth Redirect Fix with Session Cookies
- [x] Update `/` page to redirect authenticated users based on role (admin → /admin/users, non-admin → /quotes/overview).
- [x] Update `/admin/layout.tsx` to redirect non-admin users to `/quotes/overview` instead of `/` to avoid redirect loop.
- [x] Update `AuthCard.tsx` to use role-based redirect after credentials login.
- [x] Ensure Google OAuth callback uses role-based redirect.
- [x] Add NextAuth middleware for session cookie validation on protected routes.
- [x] Add unit tests for redirect logic in `AuthCard` component.
- [x] Add integration tests for post-auth redirect behavior (both providers).

## MVP 8 - Authenticated Routes and BFF Pattern
- [x] Create dedicated `/login` page with `AuthCard` component.
- [x] Update NextAuth to use `/login` as the sign-in page.
- [x] Update middleware to require authentication for all routes except `/login`, `/api/auth/*`, `/api/register`, and static assets.
- [x] Add server-side auth protection to `/quotes/*` routes via layout.
- [x] Implement BFF (Backend for Frontend) pattern:
  - Create Next.js API routes (`/api/users/*`) that proxy to backend.
  - Remove direct browser-to-backend communication for protected endpoints.
  - All client components call Next.js API routes, not backend directly.
- [x] Add internal API key authentication between frontend and backend:
  - Backend requires `x-internal-api-key` header for all non-health routes.
  - Frontend API routes include API key in requests to backend.
  - Add `INTERNAL_API_KEY` to environment configuration.
- [x] Update logout to redirect to `/login`.
- [x] Update Google OAuth callback to redirect to `/login`.
- [x] Add tests for `/login` page, `/quotes` layout, and updated auth flow.
- [x] Verify all tests pass and build succeeds.

## MVP 9 - Global Entity UX Pattern (Modal + Three-Dots Actions)

- [x] Define and document reusable admin entity interaction pattern for the product:
  - Create/Edit actions must open in modal dialogs (no inline entity forms in list views).
  - Row actions must live in the last table column inside a three-dots dropdown menu.
  - Pattern must be reusable for other entity modules beyond Users.
- [x] Implement reusable UI primitives for this pattern in frontend shared components:
  - `EntityActionsMenu` wrapper using Tremor/Radix dropdown primitives with a three-dots trigger button.
  - `Modal` wrapper using Radix Dialog primitives for create/edit flows with consistent footer actions and loading/error states.
- [x] Add brief developer guidance in-plan notes for applying this pattern in future entity screens.

## MVP 10 - Users UI Refactor to Global Pattern

- [x] Refactor `/admin/users` create flow to open from a modal dialog trigger (remove inline create form from page body).
- [x] Refactor user edit flow into modal dialog with prefilled fields and validation feedback.
- [x] Refactor row-level actions into a three-dots dropdown in the last column (`Actions`) for: Edit, Toggle status, Toggle admin, Delete.
- [x] Keep destructive confirmation UX for delete while preserving modal/menu rule consistency.
- [x] Preserve loading, empty, and error states while migrating interactions.

## MVP 11 - Users Listing Data Flow, Search, and Pagination

- [x] Ensure Users page lists data immediately on route entry using server-provided initial payload and client hydration.
- [x] Move search to API-driven querying (name + email) instead of only client-side filtering.
- [x] Implement table pagination controls wired to API `page` and `pageSize`.
- [x] Add configurable page size selector (e.g., 10/20/50/100) and reset page correctly when filters/page size change.
- [x] Keep list refresh automatic after all mutations (create/edit/delete/toggles) while preserving current filters and pagination context.

## MVP 12 - API/BFF Contract Validation and Tests

- [x] Validate backend list endpoint contract for pagination/search/pageSize behavior and keep compatibility with existing consumers.
- [x] Update/expand API integration tests in `api/tests/app.test.ts` for page/pageSize behavior, search across both `name` and `email`, status + search combined filtering.
- [x] Update frontend API client tests in `front/src/lib/api/users.test.ts` for query param propagation and pagination/search responses.
- [x] Update Users UI tests in `front/src/components/admin/UsersTable.test.tsx` for modal-based create/edit flows, three-dots action menu behavior, automatic refresh after mutations, pagination + page size + API-backed search interactions.
- [x] Run targeted and package validation commands: front tests, api tests, typecheck for both packages.

## MVP 13 - Settings Navigation Simplification (No Double Navigation)

- [x] Keep `/admin/settings` as a redirect route to `/admin/settings/general`.
- [x] Update sidebar Settings link targets and active-state logic to align with the redirect entrypoint.
- [x] Refactor settings layouts so only one navigation context is visible at a time:
  - `/admin/settings/general` shows only General context/content.
  - `/admin/settings/auth/*` shows only Authentication context/content.
- [x] Remove the double-navigation state where top-level Settings options and Authentication sub-tabs appear simultaneously.
- [x] Ensure auth settings navigation remains usable within Authentication context (Basic/Google only).
- [x] Validate route behavior and active states for:
  - `/admin/settings`
  - `/admin/settings/general`
  - `/admin/settings/auth/basic`
  - `/admin/settings/auth/google`

## MVP 14 - Sidebar Cleanup (Remove Search Input)

- [x] Remove the sidebar search input UI from the main navigation sidebar.
- [x] Remove now-unused imports and spacing/divider logic related to search to keep layout consistent.
- [x] Verify desktop and mobile sidebar render correctly after removal.

## MVP 15 - User Profile Area (Accessible from Sidebar Bottom Item)

- [x] Add a dedicated profile page accessible from the existing bottom sidebar user area.
- [x] Add a "Profile" action in the bottom user menu that routes to the new profile page.
- [x] Build profile UI to match the reference style direction (header + tabbed/settings-like account section + email/password form blocks).
- [x] Populate profile defaults from authenticated user/session data and preserve existing theme/sign-out actions.
- [x] Implement profile APIs via BFF pattern (frontend route handlers), avoiding direct client-to-backend calls.
- [x] Add backend support for authenticated self-service profile updates:
  - Read current profile details
  - Update account details (name/email)
  - Update password with current-password verification and policy checks
- [x] Keep validation/error response conventions aligned with existing API patterns (`{ code, message, details? }`).
- [x] Ensure authorization boundaries:
  - Authenticated users can only manage their own profile
  - No admin-only restriction for basic profile self-management
- [x] Add/update tests for:
  - Profile page rendering and interaction states
  - BFF profile route handlers
  - Backend profile routes and validation/error scenarios
  - Navigation entry from sidebar bottom item

## MVP 16 - Validation and Regression Checks

- [x] Run targeted frontend tests for settings navigation, sidebar, and profile changes.
- [x] Run targeted backend tests for profile route additions.
- [x] Run package-level checks for touched apps (`front`, `api`) including test and typecheck.
- [x] Run root validation (`bun run test`, `bun run typecheck`) if changes cross both packages.
- [x] Confirm no regressions in auth flow, admin settings access control, and sidebar behavior.

## MVP 17 - AI Module (Backend Wrapper on AI SDK)

A native backend AI service layer that wraps Vercel AI SDK, abstracting provider auth and model selection for developers using this template.

### Scope
- Supported providers: OpenAI, Anthropic, Google (MVP1; extensible for future providers).
- Supported output types: text, structured JSON (Zod or JSON Schema), image generation (OpenAI only).
- No streaming, embeddings, audio, or tool/function calling in MVP1.
- Configuration: environment variables only, single global timeout.
- BYOK readiness: auth.apiKey override at instance creation (future flow hook; env-first in MVP1).

### Tasks
- [x] Add AI SDK dependencies in api package: `ai` (core) and provider packages `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`.
- [x] Create AI module directory structure under `api/src/lib/ai/` with focused files: types, models, config, client, index.
- [x] Implement public types: provider enum, model identifiers, client options, method payloads, and error shape.
- [x] Implement env-based configuration loader with single global timeout (`AI_TIMEOUT_MS`) and per-provider API key resolution from environment.
- [x] Implement provider factories that construct AI SDK provider instances (OpenAI, Anthropic, Google) with env or override API keys.
- [x] Implement `createAiClient({ provider, model, auth? })` factory binding provider and model at creation time.
- [x] Implement `promptText({ prompt, system? })` using AI SDK `generateText` and enforce timeout propagation.
- [x] Implement `promptJson({ prompt, system?, schema })` using AI SDK `generateObject` with support for Zod schemas and JSON Schema via `jsonSchema` helper; normalize errors to repo error shape.
- [x] Implement `promptImage({ prompt, ...options })` using AI SDK `generateImage`; restrict to OpenAI provider in MVP1 and throw structured error for unsupported providers.
- [x] Add static curated model catalog `AI_MODELS_BY_PROVIDER` (raw provider identifiers only) and export `listModelsByProvider()` helper for developer discovery.
- [x] Ensure MVP1 capability rules are enforced at runtime (no streaming/tools/embeddings/audio; image only via OpenAI).
- [x] Add unit tests covering: config resolution and defaults, timeout propagation, schema handling (Zod and JSON Schema), provider/model binding, unsupported operation errors, and model catalog listing.
- [x] Update `api/vitest.config.ts` coverage includes for new AI module files and keep thresholds passing.
- [x] Update root `README.md` with AI module usage examples, environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `AI_TIMEOUT_MS`), and MVP1 limitations.
- [x] Run package-level checks (`bun run --cwd api test`, `bun run --cwd api typecheck`, `bun run --cwd api build`) and root checks if cross-package changes emerge.

## MVP 18 - Auth Settings Data Model Upgrade

Add enable/disable flags and encrypted credential storage for authentication methods.

### Tasks
- [x] Add `basicAuthEnabled` (Boolean, default true) to `AppSettings` model.
- [x] Add `googleAuthEnabled` (Boolean, default false) to `AppSettings` model.
- [x] Add `googleClientIdEncrypted` (String?) and `googleClientSecretEncrypted` (String?) to replace plaintext fields.
- [x] Add `googleCredentialsIv` (String?) for encryption initialization vector.
- [x] Add `authMethod` enum (BASIC, GOOGLE) and `authMethod` field to `User` model to track registration origin.
- [x] Create and apply Prisma migration in `api/prisma`.
- [x] Mirror schema changes to `front/prisma/schema.prisma`.
- [x] Add encryption/decryption utility using `AUTH_ENCRYPTION_KEY` env var (AES-256-GCM).
- [x] Update API settings types to include new fields.
- [x] Update settings routes to handle encrypted Google credentials.
- [x] Add tests for encryption/decryption utility.
- [x] Add tests for updated settings routes.

## MVP 19 - Signup Access Rules (Basic Auth)

Implement dedicated `/signup` page with Basic Auth enable/disable gating.

### Tasks
- [x] Create `/signup` page at `front/src/app/signup/page.tsx` with registration form.
- [x] Update middleware to allow unauthenticated access to `/signup`.
- [x] Server-side gate: redirect `/signup` to `/login` when `basicAuthEnabled=false`.
- [x] Update registration API to reject requests when `basicAuthEnabled=false`.
- [x] Ensure password policy enforcement uses existing settings logic.
- [x] Update `AuthCard` on `/login` to remove inline register toggle (use `/signup` instead).
- [x] Add link from `/login` to `/signup` when Basic Auth enabled.
- [x] Add tests for `/signup` access and redirect behavior.
- [x] Add tests for registration API gating.

## MVP 20 - Google Auth Visibility + Runtime Gating

Conditionally show Google login option and enforce runtime gating.

### Tasks
- [x] Create public auth config API endpoint `GET /api/auth/config` (returns `basicAuthEnabled`, `googleAuthEnabled`, `googleConfigured`).
- [x] Update `AuthCard` to fetch auth config and conditionally show Google button.
- [x] Update `AuthCard` to show Basic Auth form only when `basicAuthEnabled=true`.
- [x] Update NextAuth `signIn` callback to reject Google sign-in when disabled or not configured.
- [x] Update NextAuth to use DB-stored Google credentials (decrypted) when available, with env fallback.
- [x] Add tests for auth config API.
- [x] Add tests for AuthCard conditional rendering.
- [x] Add tests for NextAuth signIn callback gating.

## MVP 21 - Google Auth Settings UX Improvements

Enhance Google settings page with enable/disable toggle, encrypted storage, and URL display.

### Tasks
- [x] Add enable/disable toggle switch to `GoogleAuthSettingsForm`.
- [x] Implement credential encryption on save (client ID and secret).
- [x] Show "Configured" status indicator when credentials exist.
- [x] Hide actual credential values in UI; show masked placeholder.
- [x] Add "Change" button to unlock credential editing when configured.
- [x] Display required Allow URL and Redirect URL for Google OAuth setup.
- [x] Update `updateGoogleAuthSettings` to handle encryption.
- [x] Update settings GET to return `isConfigured` boolean instead of credential values.
- [x] Add tests for Google settings form states.
- [x] Add tests for credential encryption flow.

## MVP 22 - Account Merge Rules (Basic + Google)

Implement automatic account linking when Basic user signs in with Google.

### Tasks
- [x] Implement `signIn` callback logic to detect existing user by email when Google sign-in.
- [x] Link Google account to existing Basic user (create `Account` record with provider="google").
- [x] Ensure merge only happens for verified Google emails.
- [x] Preserve user's existing data (name, status, admin flag) during merge.
- [x] Ensure DISABLED users cannot complete merge/sign-in.
- [x] Update `authMethod` field appropriately after merge scenarios.
- [x] Add tests for account merge behavior.
- [x] Add tests for edge cases (disabled user, existing Google account).

## MVP 23 - Profile Edit Restrictions by Auth Method

Restrict profile editing based on registration method.

### Tasks
- [x] Extend session/user type to include `authMethod` from database.
- [x] Backend: prevent password changes for Google-origin users.
- [x] Backend: prevent email changes for all users.
- [x] Backend: prevent name changes for Google-origin users.
- [x] Backend: allow password and name changes for Basic-origin users.
- [x] Frontend: disable/hide restricted fields in profile form based on auth method.
- [x] Add clear messaging explaining restrictions.
- [x] Update profile API types to include `authMethod`.
- [x] Add tests for profile restriction logic (API and UI).
- [x] Add tests for session callback authMethod inclusion.

## MVP 24 - Tests and Coverage Safeguards

Ensure comprehensive test coverage for all new functionality.

### Tasks
- [x] Frontend tests: `/signup` access and redirect behavior.
- [x] Frontend tests: AuthCard conditional Google/Basic visibility.
- [x] Frontend tests: Google settings form (toggle, configured view, change flow, URLs).
- [x] Frontend tests: Profile UI restrictions by auth method.
- [x] Frontend tests: Registration API behavior when Basic Auth disabled.
- [x] API tests: Settings routes for new fields and encrypted credentials.
- [x] API tests: Profile route restrictions by auth method.
- [x] API tests: Account merge/link behavior.
- [x] API tests: Encryption/decryption utility.
- [x] Run `bun run --cwd front test` and ensure all pass.
- [x] Run `bun run --cwd api test` and ensure all pass.
- [x] Run `bun run --cwd front typecheck`.
- [x] Run `bun run --cwd api typecheck`.
- [x] Run `bun run test` (root).
- [x] Run `bun run coverage` and confirm thresholds >= 80%.

## MVP 25 - Documentation Updates

Update documentation for new auth features.

### Tasks
- [x] Update README.md with auth configuration section.
- [x] Document `AUTH_ENCRYPTION_KEY` environment variable requirement.
- [x] Document new AppSettings fields and their purposes.
- [x] Add guidance for Google OAuth setup with Allow/Redirect URLs.
- [x] Document account merge behavior and security considerations.
- [x] Document profile restriction rules by auth method.
- [x] Add operational notes for credential rotation.
