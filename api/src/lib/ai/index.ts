import { createAiClient } from "./client"
import { listModelsByProvider, AI_MODELS_BY_PROVIDER } from "./models"
import { AiModuleError } from "./types"

export { createAiClient, listModelsByProvider, AI_MODELS_BY_PROVIDER, AiModuleError }
export type {
  AiClient,
  AiProvider,
  AiModelId,
  AiAuthOptions,
  CreateAiClientOptions,
  PromptTextOptions,
  PromptJsonOptions,
  PromptImageOptions,
  AiTextResult,
  AiJsonResult,
  AiImageResult,
  AiError,
  ModelsByProvider,
  StructuredSchema,
  JsonSchema7,
} from "./types"
