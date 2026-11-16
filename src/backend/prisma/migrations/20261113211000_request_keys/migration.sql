-- Phase 3: duplicate-request protection (finding C-006).
-- One new table. Nothing existing is changed.
CREATE TABLE IF NOT EXISTS "RequestKey" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "bodyHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestKey_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RequestKey_scope_key_key" ON "RequestKey"("scope", "key");
CREATE INDEX IF NOT EXISTS "RequestKey_createdAt_idx" ON "RequestKey"("createdAt");
