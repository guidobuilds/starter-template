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
- AI Module (backend wrapper on Vercel AI SDK)
  - Text generation (`promptText`)
  - Structured JSON output (`promptJson`)
  - Image generation (`promptImage`, OpenAI only)
  - Providers: OpenAI, Anthropic, Google

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

## AI Module

A backend service layer wrapping the Vercel AI SDK for easy AI integration.

### Environment Variables

```bash
OPENAI_API_KEY=sk-...        # Required for OpenAI provider
ANTHROPIC_API_KEY=sk-...     # Required for Anthropic provider
GOOGLE_API_KEY=...           # Required for Google provider
AI_TIMEOUT_MS=30000          # Optional: global timeout (default: 30000ms)
```

### Usage

```typescript
import { createAiClient, listModelsByProvider } from "@/lib/ai"

const client = createAiClient({
  provider: "openai",
  model: "gpt-4o",
})

const text = await client.promptText({
  prompt: "Hello!",
  system: "You are helpful.",
})

const data = await client.promptJson({
  prompt: "Generate a user",
  schema: z.object({ name: z.string(), email: z.string() }),
})

const image = await client.promptImage({
  prompt: "A sunset over mountains",
  size: "1024x1024",
})

const models = listModelsByProvider()
```

### MVP1 Limitations

- No streaming, embeddings, audio, or tool/function calling
- Image generation only via OpenAI provider
- Configuration via environment variables only (no UI)
- Model selection at instance creation time (not per-call)
