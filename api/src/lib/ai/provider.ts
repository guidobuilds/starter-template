import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModel, ImageModel } from "ai"
import type { AiProvider, AiModelId } from "./types"

export interface ProviderInstance {
  languageModel(modelId: AiModelId): LanguageModel
  imageModel?: (modelId: AiModelId) => ImageModel
}

export function createProviderInstance(
  provider: AiProvider,
  apiKey: string,
): ProviderInstance {
  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey })
      return {
        languageModel: (modelId) => openai(modelId),
        imageModel: (modelId) => openai.image(modelId),
      }
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey })
      return {
        languageModel: (modelId) => anthropic(modelId),
      }
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey })
      return {
        languageModel: (modelId) => google(modelId),
      }
    }
  }
}
