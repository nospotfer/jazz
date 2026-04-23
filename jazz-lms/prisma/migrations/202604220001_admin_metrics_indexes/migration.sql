-- Performance indexes for the admin Panel de Métricas.
-- Added in 2026-04-22 (F6) to support time-ranged aggregations
-- (7d/30d/60d/90d/12m) without sequential scans.

-- Purchase by createdAt: revenue, enrollments charts and KPIs.
CREATE INDEX IF NOT EXISTS "Purchase_createdAt_idx"
  ON "Purchase" ("createdAt");

-- User by createdAt: new students KPI.
CREATE INDEX IF NOT EXISTS "User_createdAt_idx"
  ON "User" ("createdAt");

-- UserProgress by createdAt and updatedAt: started/completed completion metric
-- (uses OR between createdAt in range and isCompleted+updatedAt in range).
CREATE INDEX IF NOT EXISTS "UserProgress_createdAt_idx"
  ON "UserProgress" ("createdAt");

CREATE INDEX IF NOT EXISTS "UserProgress_updatedAt_idx"
  ON "UserProgress" ("updatedAt");

-- VoucherRedemption by redeemedAt: vouchers redeemed KPI.
CREATE INDEX IF NOT EXISTS "VoucherRedemption_redeemedAt_idx"
  ON "VoucherRedemption" ("redeemedAt");

-- LessonQuizSummary by lastAttemptAt: medals earned KPI.
CREATE INDEX IF NOT EXISTS "LessonQuizSummary_lastAttemptAt_idx"
  ON "LessonQuizSummary" ("lastAttemptAt");
