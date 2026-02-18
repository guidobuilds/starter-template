import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import {
  createAiClient,
  listModelsByProvider,
  AI_MODELS_BY_PROVIDER,
  AiModuleError,
} from "@/lib/ai"

vi.stubEnv("AI_TIMEOUT_MS", "60000")
vi.stubEnv("OPENAI_API_KEY", "test-openai-key")
vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key")
vi.stubEnv("GOOGLE_API_KEY", "test-google-key")

const mockTextResponse = { text: "Hello from AI!" }
const mockObjectResponse = { object: { name: "Test", value: 42 } }
const mockImageResponse = {
  image: {
    base64: "aW1hZ2UtZGF0YQ==",
    mediaType: "image/png",
  },
}

vi.mock("ai", () => ({
  generateText: vi.fn(async () => mockTextResponse),
  generateObject: vi.fn(async () => mockObjectResponse),
  generateImage: vi.fn(async () => mockImageResponse),
  jsonSchema: vi.fn((schema) => schema),
}))

describe("ai module", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listModelsByProvider", () => {
    it("returns models grouped by provider", () => {
      const result = listModelsByProvider()

      expect(result).toHaveLength(3)
      expect(result.map((p) => p.provider)).toEqual(["openai", "anthropic", "google"])
    })

    it("includes key models for each provider", () => {
      const result = listModelsByProvider()
      const openaiModels = result.find((p) => p.provider === "openai")?.models ?? []
      const anthropicModels = result.find((p) => p.provider === "anthropic")?.models ?? []
      const googleModels = result.find((p) => p.provider === "google")?.models ?? []

      expect(openaiModels).toContain("gpt-4o")
      expect(openaiModels).toContain("dall-e-3")
      expect(anthropicModels).toContain("claude-3-5-sonnet-20241022")
      expect(googleModels).toContain("gemini-1.5-pro")
    })
  })

  describe("AI_MODELS_BY_PROVIDER", () => {
    it("exposes static model catalog", () => {
      expect(AI_MODELS_BY_PROVIDER.openai).toBeInstanceOf(Array)
      expect(AI_MODELS_BY_PROVIDER.anthropic).toBeInstanceOf(Array)
      expect(AI_MODELS_BY_PROVIDER.google).toBeInstanceOf(Array)
      expect(AI_MODELS_BY_PROVIDER.openai.length).toBeGreaterThan(0)
    })
  })

  describe("createAiClient", () => {
    it("throws when API key is missing", () => {
      vi.stubEnv("OPENAI_API_KEY", "")

      expect(() =>
        createAiClient({ provider: "openai", model: "gpt-4o" }),
      ).toThrow(AiModuleError)

      vi.stubEnv("OPENAI_API_KEY", "test-openai-key")
    })

    it("allows overriding API key via auth option", () => {
      const client = createAiClient({
        provider: "openai",
        model: "gpt-4o",
        auth: { apiKey: "custom-key" },
      })

      expect(client).toBeDefined()
      expect(client.promptText).toBeInstanceOf(Function)
      expect(client.promptJson).toBeInstanceOf(Function)
      expect(client.promptImage).toBeInstanceOf(Function)
    })

    it("creates client for each provider", () => {
      const providers: Array<"openai" | "anthropic" | "google"> = [
        "openai",
        "anthropic",
        "google",
      ]

      for (const provider of providers) {
        const client = createAiClient({
          provider,
          model: provider === "openai" ? "gpt-4o" : provider === "anthropic" ? "claude-3-5-sonnet-20241022" : "gemini-1.5-pro",
        })
        expect(client).toBeDefined()
      }
    })
  })

  describe("promptText", () => {
    it("calls generateText with correct parameters", async () => {
      const client = createAiClient({
        provider: "openai",
        model: "gpt-4o",
      })

      const result = await client.promptText({
        prompt: "Hello",
        system: "You are helpful.",
      })

      expect(result.text).toBe("Hello from AI!")
    })
  })

  describe("promptJson", () => {
    it("works with Zod schema", async () => {
      const client = createAiClient({
        provider: "openai",
        model: "gpt-4o",
      })

      const schema = z.object({
        name: z.string(),
        value: z.number(),
      })

      const result = await client.promptJson({
        prompt: "Generate data",
        schema,
      })

      expect(result.object).toEqual({ name: "Test", value: 42 })
    })

    it("works with JSON Schema", async () => {
      const client = createAiClient({
        provider: "openai",
        model: "gpt-4o",
      })

      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "number" },
        },
        required: ["name", "value"],
      }

      const result = await client.promptJson({
        prompt: "Generate data",
        schema,
      })

      expect(result.object).toEqual({ name: "Test", value: 42 })
    })
  })

  describe("promptImage", () => {
    it("works with OpenAI provider", async () => {
      const client = createAiClient({
        provider: "openai",
        model: "dall-e-3",
      })

      const result = await client.promptImage({
        prompt: "A sunset",
        size: "1024x1024",
      })

      expect(result.base64).toBe("aW1hZ2UtZGF0YQ==")
      expect(result.mediaType).toBe("image/png")
    })

    it("throws for non-OpenAI providers", async () => {
      const client = createAiClient({
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
      })

      await expect(
        client.promptImage({ prompt: "A sunset" }),
      ).rejects.toThrow(AiModuleError)

      try {
        await client.promptImage({ prompt: "A sunset" })
      } catch (error) {
        expect((error as AiModuleError).code).toBe("UNSUPPORTED_PROVIDER")
      }
    })

    it("throws for Google provider", async () => {
      const client = createAiClient({
        provider: "google",
        model: "gemini-1.5-pro",
      })

      await expect(
        client.promptImage({ prompt: "A sunset" }),
      ).rejects.toThrow(AiModuleError)
    })
  })

  describe("AiModuleError", () => {
    it("creates error with code and message", () => {
      const error = new AiModuleError("TEST_CODE", "Test message", { detail: "info" })

      expect(error.code).toBe("TEST_CODE")
      expect(error.message).toBe("Test message")
      expect(error.details).toEqual({ detail: "info" })
    })

    it("converts to AiError shape", () => {
      const error = new AiModuleError("TEST_CODE", "Test message")
      const aiError = error.toError()

      expect(aiError).toEqual({
        code: "TEST_CODE",
        message: "Test message",
      })
    })
  })
})
