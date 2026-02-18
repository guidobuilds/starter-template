# B2B Starter Template

Monorepo starter with:

- `api`: Bun + Elysia + TypeScript + PostgreSQL + Prisma
- `front`: Next.js App Router + Tremor Planner UI + Tailwind + NextAuth

## Structure

- `api/` backend service (`http://localhost:3001` by default)
- `front/` frontend app (`http://localhost:3000` by default)

## Features

- User CRUD (`/v1/users`)
- NextAuth authentication
  - Google OAuth
  - Credentials (email + password)
- Self-registration (`POST /api/register`)
- Protected admin routes:
  - `/admin`
  - `/admin/users`

## User model

- `name` required
- `email` required + unique
- `status` enum: `ENABLED` (default) or `DISABLED`
- `admin` boolean default `false`
- `createdAt` automatic
- `updatedAt` automatic

## Environment variables

Copy `.env.example` to `.env` and set values.

Required:

- `DATABASE_URL`
- `DATABASE_URL_DOCKER`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_API_URL`
- `API_INTERNAL_URL`
- `CORS_ORIGIN`

## Setup

```bash
bun install
bun run --cwd api prisma:generate
bun run --cwd api prisma:migrate
bun run --cwd api prisma:seed
bun run dev
```

## Development with Docker PostgreSQL

Run only PostgreSQL in Docker, and the app servers locally (recommended for development):

```bash
# Start PostgreSQL
bun run db:up

# Run migrations and seed
bun run db:migrate
bun run db:seed

# Start dev servers
bun run dev

# Stop PostgreSQL
bun run db:down

# View PostgreSQL logs
bun run db:logs

# Open Prisma Studio
bun run db:studio
```

## Test and quality checks

```bash
bun run test
bun run coverage
bun run typecheck
bun run build
```

Coverage thresholds are enforced in both packages at >80%.

## Docker (front + api + postgres)

Build and start all services:

```bash
cp .env.example .env
docker compose up --build
```

Stop the stack:

```bash
docker compose down
```

Tail logs:

```bash
docker compose logs -f api front postgres
```

Optional: run seed inside the API container:

```bash
docker compose exec api bun run prisma:seed
```

Seeded admin user:

- email: `admin@example.com`
- password: `admin12345`
- role: `admin=true`

The stack exposes:

- Frontend: `http://localhost:3000`
- API: `http://localhost:3001/health`
- PostgreSQL: `localhost:5432`

At API container startup, Prisma migrations are applied with `prisma migrate deploy` (fallback to `prisma db push` for fresh environments).

## Seed from outside Docker

From your host shell (outside any container), you have two options:

1. Seed the running Docker stack DB:

```bash
docker compose exec api bun run prisma:seed
```

2. Seed a locally running API/DB (non-Docker flow):

```bash
bun run --cwd api prisma:seed
```

## Manual validation checklist

1. Open `http://localhost:3000/` and register a user with email/password.
2. Sign in with credentials.
3. Access `/admin` and `/admin/users`.
4. In `/admin/users`, create/update/delete users.
5. Confirm disabled users cannot sign in.
