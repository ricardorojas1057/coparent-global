CREATE TABLE "ExpenseReceipt" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpenseReceipt_expenseId_key" ON "ExpenseReceipt"("expenseId");
CREATE INDEX "ExpenseReceipt_uploadedById_idx" ON "ExpenseReceipt"("uploadedById");

ALTER TABLE "ExpenseReceipt"
ADD CONSTRAINT "ExpenseReceipt_expenseId_fkey"
FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExpenseReceipt"
ADD CONSTRAINT "ExpenseReceipt_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
