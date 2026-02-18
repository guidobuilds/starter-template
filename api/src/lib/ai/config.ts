import type { AiProvider } from "./types"

const DEFAULT_TIMEOUT_MS = 30_000

export interface AiConfig {
  timeoutMs: number
  getApiKey(provider: AiProvider, override?: string): string | undefined
}

export function loadAiConfig(): AiConfig {
  const timeoutMs = parseTimeout(process.env.AI_TIMEOUT_MS)

  return {
    timeoutMs,
    getApiKey(provider, override) {
      if (override) return override
      return process.env[providerEnvKey(provider)]
    },
  }
}

function parseTimeout(value: string | undefined): number {
  if (!value) return DEFAULT_TIMEOUT_MS
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS
  }
  return parsed
}

function providerEnvKey(provider: AiProvider): string {
  switch (provider) {
    case "openai":
      return "OPENAI_API_KEY"
    case "anthropic":
      return "ANTHROPIC_API_KEY"
    case "google":
      return "GOOGLE_API_KEY"
  }
}
