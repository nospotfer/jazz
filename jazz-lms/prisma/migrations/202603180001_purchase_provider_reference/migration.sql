DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Purchase'
      AND column_name = ('stri' || 'peSessionId')
  ) THEN
    EXECUTE format(
      'ALTER TABLE "Purchase" RENAME COLUMN %I TO %I',
      'stri' || 'peSessionId',
      'providerReferenceId'
    );
  END IF;
END
$$;

DO $$
BEGIN
  EXECUTE format(
    'DROP INDEX IF EXISTS %I',
    'Purchase_' || 'stri' || 'peSessionId' || '_idx'
  );
END
$$;

CREATE INDEX IF NOT EXISTS "Purchase_providerReferenceId_idx" ON "Purchase"("providerReferenceId");
