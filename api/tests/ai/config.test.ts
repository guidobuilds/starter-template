import { beforeEach, describe, expect, it, vi } from "vitest"

vi.stubEnv("AI_TIMEOUT_MS", "45000")
vi.stubEnv("OPENAI_API_KEY", "openai-test-key")
vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-test-key")
vi.stubEnv("GOOGLE_API_KEY", "google-test-key")

const { loadAiConfig } = await import("@/lib/ai/config")

describe("ai config", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads timeout from environment", () => {
    const config = loadAiConfig()
    expect(config.timeoutMs).toBe(45000)
  })

  it("uses default timeout when not configured", () => {
    vi.stubEnv("AI_TIMEOUT_MS", "")
    const config = loadAiConfig()
    expect(config.timeoutMs).toBe(30000)
    vi.stubEnv("AI_TIMEOUT_MS", "45000")
  })

  it("handles invalid timeout values", () => {
    vi.stubEnv("AI_TIMEOUT_MS", "invalid")
    const config = loadAiConfig()
    expect(config.timeoutMs).toBe(30000)
    vi.stubEnv("AI_TIMEOUT_MS", "45000")
  })

  it("handles negative timeout values", () => {
    vi.stubEnv("AI_TIMEOUT_MS", "-100")
    const config = loadAiConfig()
    expect(config.timeoutMs).toBe(30000)
    vi.stubEnv("AI_TIMEOUT_MS", "45000")
  })

  it("resolves API key for each provider", () => {
    const config = loadAiConfig()

    expect(config.getApiKey("openai")).toBe("openai-test-key")
    expect(config.getApiKey("anthropic")).toBe("anthropic-test-key")
    expect(config.getApiKey("google")).toBe("google-test-key")
  })

  it("allows override via parameter", () => {
    const config = loadAiConfig()

    expect(config.getApiKey("openai", "override-key")).toBe("override-key")
  })

  it("returns undefined when key not configured", () => {
    vi.stubEnv("OPENAI_API_KEY", undefined as unknown as string)
    const config = loadAiConfig()

    expect(config.getApiKey("openai")).toBeUndefined()
    vi.stubEnv("OPENAI_API_KEY", "openai-test-key")
  })
})
