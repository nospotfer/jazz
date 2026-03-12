-- Add multilingual metadata for lesson attachments (PDFs)
CREATE TYPE "AttachmentKind" AS ENUM ('CLASS', 'AUXILIARY');

ALTER TABLE "Attachment"
  ADD COLUMN "language" "LanguageCode" NOT NULL DEFAULT 'es',
  ADD COLUMN "kind" "AttachmentKind" NOT NULL DEFAULT 'CLASS',
  ADD COLUMN "documentKey" TEXT NOT NULL DEFAULT 'class-note';

-- Backfill for existing auxiliary records (legacy DB only had ES files)
WITH ranked_aux AS (
  SELECT
    id,
    "lessonId",
    ROW_NUMBER() OVER (PARTITION BY "lessonId" ORDER BY "createdAt", id) AS aux_order
  FROM "Attachment"
  WHERE name ~* '(auxiliar|auxiliares|auxiliary|support)'
)
UPDATE "Attachment" a
SET
  kind = 'AUXILIARY',
  "documentKey" = CONCAT('aux-', ranked_aux.aux_order)
FROM ranked_aux
WHERE ranked_aux.id = a.id;

-- Ensure non-auxiliary attachments keep class-note document key
UPDATE "Attachment"
SET
  kind = 'CLASS',
  "documentKey" = 'class-note'
WHERE kind <> 'AUXILIARY';

CREATE UNIQUE INDEX "Attachment_lessonId_language_documentKey_key"
ON "Attachment"("lessonId", "language", "documentKey");

CREATE INDEX "Attachment_language_idx" ON "Attachment"("language");
CREATE INDEX "Attachment_kind_idx" ON "Attachment"("kind");
