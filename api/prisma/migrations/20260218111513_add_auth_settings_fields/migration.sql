-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('BASIC', 'GOOGLE');

-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "basicAuthEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "googleAuthEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleClientIdEncrypted" TEXT,
ADD COLUMN     "googleClientSecretEncrypted" TEXT,
ADD COLUMN     "googleCredentialsIv" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authMethod" "AuthMethod" NOT NULL DEFAULT 'BASIC';
