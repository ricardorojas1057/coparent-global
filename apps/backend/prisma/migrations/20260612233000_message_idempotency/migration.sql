ALTER TABLE "ChatMessage" ADD COLUMN "clientMutationId" TEXT;
CREATE UNIQUE INDEX "ChatMessage_clientMutationId_key" ON "ChatMessage"("clientMutationId");
