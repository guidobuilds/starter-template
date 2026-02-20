import { Elysia } from "elysia"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { errorResponse } from "@/lib/errors"

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
})

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
})

async function getPasswordPolicy() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: {
      passwordMinLength: true,
      requireSpecial: true,
      requireNumber: true,
      requireUppercase: true,
      requireLowercase: true,
    },
  })

  return settings ?? {
    passwordMinLength: 8,
    requireSpecial: false,
    requireNumber: false,
    requireUppercase: false,
    requireLowercase: false,
  }
}

function validatePassword(
  password: string,
  policy: {
    passwordMinLength: number
    requireSpecial: boolean
    requireNumber: boolean
    requireUppercase: boolean
    requireLowercase: boolean
  },
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < policy.passwordMinLength) {
    errors.push(`Password must be at least ${policy.passwordMinLength} characters`)
  }

  if (policy.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  if (policy.requireNumber && !/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  return { valid: errors.length === 0, errors }
}

export const profileRoutes = new Elysia({ prefix: "/profile" })
  .get("/:id", async ({ params, set }) => {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        authMethod: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      set.status = 404
      return errorResponse("NOT_FOUND", "User not found")
    }

    return user
  })
  .patch("/:id", async ({ params, body, set }) => {
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { authMethod: true },
    })

    if (!user) {
      set.status = 404
      return errorResponse("NOT_FOUND", "User not found")
    }

    const { name, email } = parsed.data

    if (user.authMethod === "GOOGLE" && name !== undefined) {
      set.status = 403
      return errorResponse("FORBIDDEN", "Google users cannot change their display name")
    }

    if (email !== undefined) {
      set.status = 403
      return errorResponse("FORBIDDEN", "Email changes are not allowed")
    }

    try {
      const updated = await prisma.user.update({
        where: { id: params.id },
        data: {
          ...(name !== undefined && { name }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          authMethod: true,
          updatedAt: true,
        },
      })

      return updated
    } catch {
      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Failed to update profile")
    }
  })
  .patch("/:id/password", async ({ params, body, set }) => {
    const parsed = updatePasswordSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    const { currentPassword, newPassword } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { passwordHash: true, authMethod: true },
    })

    if (!user) {
      set.status = 404
      return errorResponse("NOT_FOUND", "User not found")
    }

    if (user.authMethod === "GOOGLE") {
      set.status = 403
      return errorResponse("FORBIDDEN", "Google users cannot change their password")
    }

    if (!user.passwordHash) {
      set.status = 400
      return errorResponse("NO_PASSWORD", "User does not have a password set")
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!validPassword) {
      set.status = 400
      return errorResponse("INVALID_PASSWORD", "Current password is incorrect")
    }

    const policy = await getPasswordPolicy()
    const validation = validatePassword(newPassword, policy)

    if (!validation.valid) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Password does not meet requirements", {
        formErrors: validation.errors,
        fieldErrors: {},
      })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    try {
      await prisma.user.update({
        where: { id: params.id },
        data: { passwordHash },
      })

      return { success: true }
    } catch {
      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Failed to update password")
    }
  })
