-- Prepared PAY-22 addition only. No production execution authorization.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE public."Purchase"
  ADD COLUMN "paymentCurrency" TEXT,
  ADD COLUMN "paymentAmountMinor" TEXT;
COMMIT;
