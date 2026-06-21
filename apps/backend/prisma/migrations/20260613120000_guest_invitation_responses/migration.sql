CREATE TYPE "FamilyInvitationGuestResponse" AS ENUM ('INTERESTED', 'DECLINED');

ALTER TABLE "FamilyInvitation"
ADD COLUMN "guestResponse" "FamilyInvitationGuestResponse",
ADD COLUMN "guestRespondedAt" TIMESTAMP(3);
