ALTER TABLE "FamilySubscription"
ADD COLUMN "googlePlayProductId" TEXT,
ADD COLUMN "googlePlayBasePlanId" TEXT,
ADD COLUMN "latestOrderId" TEXT,
ADD COLUMN "lastVerifiedAt" TIMESTAMP(3);

CREATE INDEX "FamilySubscription_googlePlayProductId_idx"
ON "FamilySubscription"("googlePlayProductId");
