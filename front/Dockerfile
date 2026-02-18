FROM oven/bun:1.1.37-alpine AS builder

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY front/package.json ./package.json
COPY front/tsconfig.json ./tsconfig.json
COPY front/next.config.ts ./next.config.ts
COPY front/postcss.config.mjs ./postcss.config.mjs
COPY front/tailwind.config.ts ./tailwind.config.ts
COPY front/.eslintrc.json ./.eslintrc.json
COPY front/public ./public
COPY front/src ./src
COPY api/prisma/schema.prisma ./prisma/schema.prisma
COPY api/prisma/migrations ./prisma/migrations

RUN bun install
RUN bunx --bun prisma generate --schema prisma/schema.prisma
RUN bun run build

FROM oven/bun:1.1.37-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["bun", "run", "start"]
