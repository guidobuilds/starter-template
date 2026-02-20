import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { decrypt, isEncryptionConfigured } from "@/lib/crypto"

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

async function getGoogleCredentials(): Promise<{
  clientId: string | null
  clientSecret: string | null
}> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: {
      googleAuthEnabled: true,
      googleClientIdEncrypted: true,
      googleClientSecretEncrypted: true,
      googleCredentialsIv: true,
      googleClientId: true,
      googleClientSecret: true,
    },
  })

  if (!settings?.googleAuthEnabled) {
    return { clientId: null, clientSecret: null }
  }

  if (settings.googleClientIdEncrypted && settings.googleCredentialsIv) {
    if (!isEncryptionConfigured()) {
      console.warn("AUTH_ENCRYPTION_KEY not set, cannot decrypt Google credentials")
      return { clientId: null, clientSecret: null }
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

      return { clientId, clientSecret }
    } catch (error) {
      console.error("Failed to decrypt Google credentials:", error)
      return { clientId: null, clientSecret: null }
    }
  }

  if (settings.googleClientId && settings.googleClientSecret) {
    return {
      clientId: settings.googleClientId,
      clientSecret: settings.googleClientSecret,
    }
  }

  return { clientId: null, clientSecret: null }
}

async function getProviders() {
  const googleCreds = await getGoogleCredentials()
  const providers = []

  if (googleCreds.clientId && googleCreds.clientSecret) {
    providers.push(
      Google({
        clientId: googleCreds.clientId,
        clientSecret: googleCreds.clientSecret,
      })
    )
  }

  providers.push(
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.passwordHash || user.status === "DISABLED") {
          return null
        }

        const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!validPassword) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    })
  )

  return providers
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: await getProviders(),
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        return false
      }

      if (account?.provider === "google") {
        const settings = await prisma.appSettings.findUnique({
          where: { id: "default" },
          select: { googleAuthEnabled: true },
        })

        if (!settings?.googleAuthEnabled) {
          return false
        }
      }

      const dbUser = await prisma.user.findUnique({ 
        where: { email: user.email },
        select: { id: true, status: true, authMethod: true, passwordHash: true },
      })
      
      if (!dbUser) {
        return true
      }

      if (dbUser.status === "DISABLED") {
        return false
      }

      if (account?.provider === "google" && dbUser.authMethod === "BASIC") {
        await prisma.account.create({
          data: {
            userId: dbUser.id,
            type: "oauth",
            provider: "google",
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
        }).catch(() => {})
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        const dbUser = token.email
          ? await prisma.user.findUnique({
              where: { email: token.email as string },
              select: { admin: true, authMethod: true },
            })
          : null
        session.user.admin = dbUser?.admin ?? false
        ;(session.user as { authMethod?: string }).authMethod = dbUser?.authMethod ?? "BASIC"
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
