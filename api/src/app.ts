import { cors } from "@elysiajs/cors"
import { Elysia } from "elysia"
import { usersRoutes } from "@/routes/users"
import { settingsRoutes } from "@/routes/settings"
import { profileRoutes } from "@/routes/profile"

export const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["content-type", "authorization", "x-internal-api-key"],
    }),
  )
  .onRequest(({ request, set }) => {
    if (request.url.endsWith("/health")) return

    const internalApiKey = process.env.INTERNAL_API_KEY
    if (!internalApiKey) {
      console.warn("INTERNAL_API_KEY not configured - skipping auth check")
      return
    }

    const apiKey = request.headers.get("x-internal-api-key")
    if (apiKey !== internalApiKey) {
      set.status = 401
      return { code: "UNAUTHORIZED", message: "Invalid or missing API key" }
    }
  })
  .get("/health", () => ({ status: "ok" }))
  .group("/v1", (v1) => v1.use(usersRoutes).use(settingsRoutes).use(profileRoutes))

export type App = typeof app
