import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
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
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false
      }
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
      if (!dbUser) {
        return true
      }
      return dbUser.status === "ENABLED"
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
              select: { admin: true },
            })
          : null
        session.user.admin = dbUser?.admin ?? false
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
