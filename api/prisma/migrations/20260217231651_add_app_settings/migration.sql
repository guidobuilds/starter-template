-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "instanceName" TEXT,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "requireSpecial" BOOLEAN NOT NULL DEFAULT false,
    "requireNumber" BOOLEAN NOT NULL DEFAULT false,
    "requireUppercase" BOOLEAN NOT NULL DEFAULT false,
    "requireLowercase" BOOLEAN NOT NULL DEFAULT false,
    "googleClientId" TEXT,
    "googleClientSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
