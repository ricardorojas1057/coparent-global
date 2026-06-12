-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'PLUS', 'PREMIUM', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubscriptionProvider" AS ENUM ('MANUAL', 'GOOGLE_PLAY', 'APP_STORE', 'STRIPE');

-- CreateTable
CREATE TABLE "FamilySubscription" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'PREMIUM',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "provider" "SubscriptionProvider" NOT NULL DEFAULT 'MANUAL',
    "providerSubscriptionId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "requestedPlan" "SubscriptionPlan",
    "requestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilySubscription_pkey" PRIMARY KEY ("id")
);

-- Give every existing family a Premium trial without changing family data.
INSERT INTO "FamilySubscription" (
    "id",
    "familyId",
    "plan",
    "status",
    "provider",
    "trialEndsAt",
    "createdAt",
    "updatedAt"
)
SELECT
    md5(random()::text || clock_timestamp()::text || "id"),
    "id",
    'PREMIUM'::"SubscriptionPlan",
    'TRIALING'::"SubscriptionStatus",
    'MANUAL'::"SubscriptionProvider",
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Family";

-- CreateIndex
CREATE UNIQUE INDEX "FamilySubscription_familyId_key" ON "FamilySubscription"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilySubscription_providerSubscriptionId_key" ON "FamilySubscription"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "FamilySubscription_status_currentPeriodEndsAt_idx" ON "FamilySubscription"("status", "currentPeriodEndsAt");

-- AddForeignKey
ALTER TABLE "FamilySubscription" ADD CONSTRAINT "FamilySubscription_familyId_fkey"
FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
