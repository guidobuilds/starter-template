# AI Generated starter template

This starter template was built entirely without writing a single line of code.

## Features

- User CRUD (`/v1/users`)
- NextAuth authentication
  - Google OAuth
  - Credentials (email + password)
- Self-registration (`POST /api/register`)
- Protected admin routes:
  - `/admin`
  - `/admin/users`

## Setup

```bash
bun install
bun run db:up
bun run --cwd api prisma:generate
bun run db:migrate
bun run db:seed
bun run dev
```

PostgreSQL runs in Docker with defaults: `postgres:postgres@localhost:5432/b2b_starter`.

## Test and quality checks

```bash
bun run test
bun run coverage
bun run typecheck
bun run build
```
