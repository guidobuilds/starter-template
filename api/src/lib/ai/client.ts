import { generateText, generateObject, generateImage, jsonSchema } from "ai"
import type { z } from "zod"
import type {
  AiClient,
  AiProvider,
  AiModelId,
  CreateAiClientOptions,
  PromptTextOptions,
  PromptJsonOptions,
  PromptImageOptions,
  AiTextResult,
  AiJsonResult,
  AiImageResult,
  StructuredSchema,
} from "./types"
import { AiModuleError } from "./types"
import { loadAiConfig } from "./config"
import { createProviderInstance } from "./provider"

export function createAiClient(options: CreateAiClientOptions): AiClient {
  const { provider, model, auth } = options
  const config = loadAiConfig()
  const apiKey = config.getApiKey(provider, auth?.apiKey)

  if (!apiKey) {
    throw new AiModuleError(
      "MISSING_API_KEY",
      `API key not configured for provider "${provider}". Set ${provider.toUpperCase()}_API_KEY environment variable or provide auth.apiKey.`,
    )
  }

  const providerInstance = createProviderInstance(provider, apiKey)
  const languageModel = providerInstance.languageModel(model)

  return {
    async promptText(opts: PromptTextOptions): Promise<AiTextResult> {
      const { prompt, system } = opts
      try {
        const result = await generateText({
          model: languageModel,
          prompt,
          system,
          timeout: config.timeoutMs,
        })
        return { text: result.text }
      } catch (error: unknown) {
        throw normalizeError(error)
      }
    },

    async promptJson<T = unknown>(opts: PromptJsonOptions<T>): Promise<AiJsonResult<T>> {
      const { prompt, system, schema } = opts
      try {
        const resolvedSchema = resolveSchema(schema)
        const result = await generateObject({
          model: languageModel,
          prompt,
          system,
          schema: resolvedSchema,
          timeout: config.timeoutMs,
        })
        return { object: result.object as T }
      } catch (error: unknown) {
        throw normalizeError(error)
      }
    },

    async promptImage(opts: PromptImageOptions): Promise<AiImageResult> {
      if (provider !== "openai") {
        throw new AiModuleError(
          "UNSUPPORTED_PROVIDER",
          `Image generation is only supported for the "openai" provider in MVP1. Received: "${provider}".`,
        )
      }

      if (!providerInstance.imageModel) {
        throw new AiModuleError(
          "IMAGE_MODEL_UNAVAILABLE",
          `Image model factory not available for provider "${provider}".`,
        )
      }

      const { prompt, size, n } = opts
      const imageModel = providerInstance.imageModel(model)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)

        const result = await generateImage({
          model: imageModel,
          prompt,
          size,
          n,
          abortSignal: controller.signal,
        })

        clearTimeout(timeoutId)

        const image = result.image
        return {
          base64: image.base64,
          mediaType: image.mediaType,
        }
      } catch (error: unknown) {
        throw normalizeError(error)
      }
    },
  }
}

function resolveSchema<T>(schema: StructuredSchema<T>) {
  if (isZodSchema(schema)) {
    return schema as z.ZodSchema
  }
  return jsonSchema(schema as Record<string, unknown>)
}

function isZodSchema(value: unknown): value is z.ZodSchema {
  return (
    typeof value === "object" &&
    value !== null &&
    "_def" in value &&
    typeof (value as Record<string, unknown>)._def === "object"
  )
}

function normalizeError(error: unknown): AiModuleError {
  if (error instanceof AiModuleError) {
    return error
  }

  if (error instanceof Error) {
    return new AiModuleError("AI_ERROR", error.message, {
      name: error.name,
      stack: error.stack,
    })
  }

  return new AiModuleError("AI_ERROR", "Unknown AI error", { error })
}
