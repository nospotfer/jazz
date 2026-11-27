ALTER TABLE "Purchase"
  RENAME COLUMN "stripeSessionId" TO "providerReferenceId";

DROP INDEX IF EXISTS "Purchase_stripeSessionId_idx";
CREATE INDEX IF NOT EXISTS "Purchase_providerReferenceId_idx" ON "Purchase"("providerReferenceId");
