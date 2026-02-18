import { Elysia } from "elysia"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { errorResponse } from "@/lib/errors"

const generalSettingsSchema = z.object({
  instanceName: z.string().min(1).max(100).optional(),
})

const basicAuthSettingsSchema = z.object({
  passwordMinLength: z.int().min(6).max(128).optional(),
  requireSpecial: z.boolean().optional(),
  requireNumber: z.boolean().optional(),
  requireUppercase: z.boolean().optional(),
  requireLowercase: z.boolean().optional(),
})

const googleAuthSettingsSchema = z.object({
  googleClientId: z.string().min(1).max(500).optional().nullable(),
  googleClientSecret: z.string().min(1).max(500).optional().nullable(),
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

    return {
      instanceName: settings.instanceName,
      passwordMinLength: settings.passwordMinLength,
      requireSpecial: settings.requireSpecial,
      requireNumber: settings.requireNumber,
      requireUppercase: settings.requireUppercase,
      requireLowercase: settings.requireLowercase,
      googleClientId: settings.googleClientId,
      googleClientSecret: settings.googleClientSecret ? "***" : null,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
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
      updatedAt: updated.updatedAt,
    }
  })
  .patch("/auth/google", async ({ body, set }) => {
    const parsed = googleAuthSettingsSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    const data: { googleClientId?: string | null; googleClientSecret?: string | null } = {}

    if (parsed.data.googleClientId !== undefined) {
      data.googleClientId = parsed.data.googleClientId || null
    }
    if (parsed.data.googleClientSecret !== undefined) {
      data.googleClientSecret = parsed.data.googleClientSecret || null
    }

    const updated = await prisma.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    })

    return {
      googleClientId: updated.googleClientId,
      googleClientSecret: updated.googleClientSecret ? "***" : null,
      updatedAt: updated.updatedAt,
    }
  })
