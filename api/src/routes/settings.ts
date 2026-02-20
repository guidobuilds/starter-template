import { Elysia } from "elysia"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { errorResponse } from "@/lib/errors"
import { encrypt, decrypt, isEncryptionConfigured } from "@/lib/crypto"

const generalSettingsSchema = z.object({
  instanceName: z.string().min(1).max(100).optional(),
})

const basicAuthSettingsSchema = z.object({
  passwordMinLength: z.int().min(6).max(128).optional(),
  requireSpecial: z.boolean().optional(),
  requireNumber: z.boolean().optional(),
  requireUppercase: z.boolean().optional(),
  requireLowercase: z.boolean().optional(),
  basicAuthEnabled: z.boolean().optional(),
})

const googleAuthSettingsSchema = z.object({
  googleAuthEnabled: z.boolean().optional(),
  googleClientId: z.string().min(1).max(500).optional().nullable(),
  googleClientSecret: z.string().min(1).max(500).optional().nullable(),
})

const workspaceSettingsSchema = z.object({
  workspacesEnabled: z.boolean(),
})

export const settingsRoutes = new Elysia({ prefix: "/settings" })
  .get("/", async () => {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    })

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: "default" },
      })
    }

    const googleConfigured = !!(
      settings.googleClientIdEncrypted ||
      settings.googleClientId
    )

    return {
      instanceName: settings.instanceName,
      passwordMinLength: settings.passwordMinLength,
      requireSpecial: settings.requireSpecial,
      requireNumber: settings.requireNumber,
      requireUppercase: settings.requireUppercase,
      requireLowercase: settings.requireLowercase,
      basicAuthEnabled: settings.basicAuthEnabled,
      googleAuthEnabled: settings.googleAuthEnabled,
      googleConfigured,
      googleClientId: null,
      googleClientSecret: null,
      workspacesEnabled: settings.workspacesEnabled,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    }
  })
  .get("/auth/config", async () => {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: {
        basicAuthEnabled: true,
        googleAuthEnabled: true,
        googleClientIdEncrypted: true,
        googleClientId: true,
      },
    })

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: "default" },
        select: {
          basicAuthEnabled: true,
          googleAuthEnabled: true,
          googleClientIdEncrypted: true,
          googleClientId: true,
        },
      })
    }

    const googleConfigured = !!(
      settings.googleClientIdEncrypted ||
      settings.googleClientId
    )

    return {
      basicAuthEnabled: settings.basicAuthEnabled,
      googleAuthEnabled: settings.googleAuthEnabled && googleConfigured,
      googleConfigured,
    }
  })
  .get("/auth/google/credentials", async ({ set }) => {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: {
        googleClientIdEncrypted: true,
        googleClientSecretEncrypted: true,
        googleCredentialsIv: true,
        googleClientId: true,
        googleClientSecret: true,
      },
    })

    if (!settings) {
      set.status = 404
      return errorResponse("NOT_FOUND", "Settings not found")
    }

    if (!settings.googleClientIdEncrypted && !settings.googleClientId) {
      return {
        googleClientId: null,
        googleClientSecret: null,
      }
    }

    if (settings.googleClientIdEncrypted && settings.googleCredentialsIv) {
      if (!isEncryptionConfigured()) {
        set.status = 500
        return errorResponse(
          "ENCRYPTION_NOT_CONFIGURED",
          "AUTH_ENCRYPTION_KEY is not set"
        )
      }

      try {
        const clientId = decrypt(
          settings.googleClientIdEncrypted,
          settings.googleCredentialsIv
        )
        const clientSecret = settings.googleClientSecretEncrypted
          ? decrypt(
              settings.googleClientSecretEncrypted,
              settings.googleCredentialsIv
            )
          : null

        return {
          googleClientId: clientId,
          googleClientSecret: clientSecret,
        }
      } catch {
        set.status = 500
        return errorResponse("DECRYPTION_ERROR", "Failed to decrypt credentials")
      }
    }

    return {
      googleClientId: settings.googleClientId,
      googleClientSecret: settings.googleClientSecret,
    }
  })
  .patch("/general", async ({ body, set }) => {
    const parsed = generalSettingsSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    const updated = await prisma.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...parsed.data },
      update: parsed.data,
    })

    return {
      instanceName: updated.instanceName,
      updatedAt: updated.updatedAt,
    }
  })
  .patch("/auth/basic", async ({ body, set }) => {
    const parsed = basicAuthSettingsSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    const updated = await prisma.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...parsed.data },
      update: parsed.data,
    })

    return {
      passwordMinLength: updated.passwordMinLength,
      requireSpecial: updated.requireSpecial,
      requireNumber: updated.requireNumber,
      requireUppercase: updated.requireUppercase,
      requireLowercase: updated.requireLowercase,
      basicAuthEnabled: updated.basicAuthEnabled,
      updatedAt: updated.updatedAt,
    }
  })
  .patch("/auth/google", async ({ body, set }) => {
    const parsed = googleAuthSettingsSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    const data: Record<string, unknown> = {}

    if (parsed.data.googleAuthEnabled !== undefined) {
      data.googleAuthEnabled = parsed.data.googleAuthEnabled
    }

    if (
      parsed.data.googleClientId !== undefined ||
      parsed.data.googleClientSecret !== undefined
    ) {
      if (!isEncryptionConfigured()) {
        set.status = 500
        return errorResponse(
          "ENCRYPTION_NOT_CONFIGURED",
          "AUTH_ENCRYPTION_KEY is required to store Google credentials"
        )
      }

      if (
        parsed.data.googleClientId !== undefined &&
        parsed.data.googleClientSecret !== undefined
      ) {
        if (parsed.data.googleClientId && parsed.data.googleClientSecret) {
          const clientIdEncrypted = encrypt(parsed.data.googleClientId)
          const clientSecretEncrypted = encrypt(parsed.data.googleClientSecret)

          if (clientIdEncrypted.iv !== clientSecretEncrypted.iv) {
            const reencrypted = encrypt(parsed.data.googleClientSecret)
            data.googleCredentialsIv = clientIdEncrypted.iv
            data.googleClientIdEncrypted = clientIdEncrypted.encrypted
            data.googleClientSecretEncrypted = reencrypted.encrypted
          } else {
            data.googleCredentialsIv = clientIdEncrypted.iv
            data.googleClientIdEncrypted = clientIdEncrypted.encrypted
            data.googleClientSecretEncrypted = clientSecretEncrypted.encrypted
          }
        } else {
          data.googleClientIdEncrypted = null
          data.googleClientSecretEncrypted = null
          data.googleCredentialsIv = null
        }
      }
    }

    const updated = await prisma.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    })

    const googleConfigured = !!updated.googleClientIdEncrypted

    return {
      googleAuthEnabled: updated.googleAuthEnabled,
      googleConfigured,
      updatedAt: updated.updatedAt,
    }
  })
  .patch("/workspaces", async ({ body, set }) => {
    const parsed = workspaceSettingsSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    const updated = await prisma.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", workspacesEnabled: parsed.data.workspacesEnabled },
      update: { workspacesEnabled: parsed.data.workspacesEnabled },
    })

    return {
      workspacesEnabled: updated.workspacesEnabled,
      updatedAt: updated.updatedAt,
    }
  })
