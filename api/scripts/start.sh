#!/bin/sh
set -eu

bunx --bun prisma migrate deploy --schema prisma/schema.prisma || bunx --bun prisma db push --schema prisma/schema.prisma

exec bun src/index.ts
