import type { z } from "zod"

export type AiProvider = "openai" | "anthropic" | "google"

export type AiModelId = string

export type JsonSchema7 = Record<string, unknown>

export type StructuredSchema<T = unknown> =
  | z.ZodSchema<T>
  | JsonSchema7

export interface AiAuthOptions {
  apiKey?: string
}

export interface CreateAiClientOptions {
  provider: AiProvider
  model: AiModelId
  auth?: AiAuthOptions
}

export interface PromptTextOptions {
  prompt: string
  system?: string
}

export interface PromptJsonOptions<T = unknown> {
  prompt: string
  system?: string
  schema: StructuredSchema<T>
}

export interface PromptImageOptions {
  prompt: string
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792"
  n?: number
}

export interface AiTextResult {
  text: string
}

export interface AiJsonResult<T = unknown> {
  object: T
}

export interface AiImageResult {
  base64: string
  mediaType: string
}

export interface AiError {
  code: string
  message: string
  details?: unknown
}

export class AiModuleError extends Error {
  code: string
  details?: unknown

  constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.name = "AiModuleError"
    this.code = code
    this.details = details
  }

  toError(): AiError {
    return { code: this.code, message: this.message, details: this.details }
  }
}

export interface AiClient {
  promptText(options: PromptTextOptions): Promise<AiTextResult>
  promptJson<T = unknown>(options: PromptJsonOptions<T>): Promise<AiJsonResult<T>>
  promptImage(options: PromptImageOptions): Promise<AiImageResult>
}

export interface ModelsByProvider {
  provider: AiProvider
  models: AiModelId[]
}
