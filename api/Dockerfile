FROM oven/bun:1.1.37-alpine

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY api/package.json ./package.json
COPY api/tsconfig.json ./tsconfig.json
COPY api/prisma ./prisma

RUN bun install
RUN bunx --bun prisma generate --schema prisma/schema.prisma

COPY api/src ./src
COPY api/scripts ./scripts

EXPOSE 3001

CMD ["sh", "scripts/start.sh"]
