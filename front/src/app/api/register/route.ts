import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

async function getPasswordPolicy() {
  let settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: {
      passwordMinLength: true,
      requireSpecial: true,
      requireNumber: true,
      requireUppercase: true,
      requireLowercase: true,
    },
  })

  if (!settings) {
    settings = {
      passwordMinLength: 8,
      requireSpecial: false,
      requireNumber: false,
      requireUppercase: false,
      requireLowercase: false,
    }
  }

  return settings
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

const baseRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const parsed = baseRegisterSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid registration payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const policy = await getPasswordPolicy()
  const passwordValidation = validatePassword(parsed.data.password, policy)

  if (!passwordValidation.valid) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "Password does not meet requirements",
        details: { formErrors: passwordValidation.errors, fieldErrors: {} },
      },
      { status: 400 },
    )
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json(
      { code: "EMAIL_CONFLICT", message: "Email already exists" },
      { status: 409 },
    )
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      status: "ENABLED",
      admin: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      admin: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
