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
