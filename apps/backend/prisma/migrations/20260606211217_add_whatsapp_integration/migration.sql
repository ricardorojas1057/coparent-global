-- CreateEnum
CREATE TYPE "WhatsAppActionType" AS ENUM ('EXPENSE', 'CALENDAR_EVENT', 'NOTE');

-- CreateEnum
CREATE TYPE "WhatsAppActionStatus" AS ENUM ('PENDING', 'PROCESSING', 'CONFIRMED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "WhatsAppLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "waId" TEXT,
    "linkCodeHash" TEXT,
    "codeExpiresAt" TIMESTAMP(3),
    "linkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppPendingAction" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "externalMessageId" TEXT,
    "type" "WhatsAppActionType" NOT NULL,
    "status" "WhatsAppActionStatus" NOT NULL DEFAULT 'PENDING',
    "originalText" TEXT,
    "mediaId" TEXT,
    "payload" JSONB NOT NULL,
    "resultEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppPendingAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppLink_waId_key" ON "WhatsAppLink"("waId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppLink_userId_familyId_key" ON "WhatsAppLink"("userId", "familyId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppPendingAction_externalMessageId_key" ON "WhatsAppPendingAction"("externalMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppPendingAction_linkId_status_createdAt_idx" ON "WhatsAppPendingAction"("linkId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "WhatsAppLink" ADD CONSTRAINT "WhatsAppLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppLink" ADD CONSTRAINT "WhatsAppLink_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppPendingAction" ADD CONSTRAINT "WhatsAppPendingAction_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "WhatsAppLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
