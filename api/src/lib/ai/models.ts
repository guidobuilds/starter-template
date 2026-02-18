import type { AiProvider, AiModelId, ModelsByProvider } from "./types"

const OPENAI_MODELS: AiModelId[] = [
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
  "o1",
  "o1-mini",
  "o1-pro",
  "o3-mini",
  "dall-e-3",
  "dall-e-2",
]

const ANTHROPIC_MODELS: AiModelId[] = [
  "claude-sonnet-4-20250514",
  "claude-opus-4-20250514",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
]

const GOOGLE_MODELS: AiModelId[] = [
  "gemini-2.5-pro-preview-06-05",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
]

export const AI_MODELS_BY_PROVIDER: Record<AiProvider, AiModelId[]> = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  google: GOOGLE_MODELS,
}

export function listModelsByProvider(): ModelsByProvider[] {
  const providers: AiProvider[] = ["openai", "anthropic", "google"]
  return providers.map((provider) => ({
    provider,
    models: AI_MODELS_BY_PROVIDER[provider] ?? [],
  }))
}
