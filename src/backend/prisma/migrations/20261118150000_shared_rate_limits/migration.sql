-- Phase 11: request limits counted once for every server copy (E-014, Z-007).
--
-- The sign-in limit per address and the partner API limits were counted in the memory of each server
-- copy. With several copies running (every hosted function instance is one), a caller got the limit
-- once per copy. "RateWindow" holds the count of one limit in one window of time, so every copy adds
-- to the same number. Rows are small, short-lived, and removed by the scheduled run two hours after
-- their window began. No existing table or row is changed.
--
-- Until this update is applied the server keeps counting per copy, as before, and says so once in its log.

CREATE TABLE IF NOT EXISTS "RateWindow" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RateWindow_pkey" PRIMARY KEY ("key", "windowStart")
);
CREATE INDEX IF NOT EXISTS "RateWindow_windowStart_idx" ON "RateWindow" ("windowStart");

-- The application's own role (update 17) reads and writes rows of this table like any other.
DO $rate_window_grant$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'steelwise_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "RateWindow" TO steelwise_runtime;
  END IF;
END
$rate_window_grant$;
