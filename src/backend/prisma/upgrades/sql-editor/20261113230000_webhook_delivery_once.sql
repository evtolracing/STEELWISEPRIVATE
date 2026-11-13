-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261113230000_webhook_delivery_once

BEGIN;

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                  VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"            VARCHAR(64) NOT NULL,
    "finished_at"         TIMESTAMPTZ,
    "migration_name"      VARCHAR(255) NOT NULL,
    "logs"                TEXT,
    "rolled_back_at"      TIMESTAMPTZ,
    "started_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- 20261113230000_webhook_delivery_once
DO $m_57909efd$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261113230000_webhook_delivery_once' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261113230000_webhook_delivery_once (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_57909efd$-- One event is recorded once per subscriber (finding H-002).
-- Nothing is removed. If the same event id is already on file twice for one subscriber, the
-- later rows get their own row id added to the event id, so every existing row stays and the
-- unique index can be created.
UPDATE "WebhookDelivery" d
SET "eventId" = d."eventId" || '#' || d."id"
WHERE EXISTS (
    SELECT 1 FROM "WebhookDelivery" o
    WHERE o."webhookId" = d."webhookId" AND o."eventId" = d."eventId" AND o."id" <> d."id"
      AND (o."createdAt" < d."createdAt" OR (o."createdAt" = d."createdAt" AND o."id" < d."id"))
  );

CREATE UNIQUE INDEX IF NOT EXISTS "WebhookDelivery_webhookId_eventId_key" ON "WebhookDelivery"("webhookId", "eventId");

-- The delivery run reads what is due in order of age.
CREATE INDEX IF NOT EXISTS "WebhookDelivery_status_nextRetryAt_idx" ON "WebhookDelivery"("status", "nextRetryAt");
$body_57909efd$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '98feaf2d1343c28e2052fa701f7d7f51fa407c2f4ad5cc42b5e427f33d9a9a20', now(), '20261113230000_webhook_delivery_once', 1);
END $m_57909efd$;

-- Row Level Security on every table (blocks Supabase's public API keys).
DO $rls$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $rls$;

-- Let the app in on every table; keep Supabase's anon/authenticated out.
DO $app$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS steelwise_app ON public.%I', t.tablename);
    EXECUTE format(
      'CREATE POLICY steelwise_app ON public.%I FOR ALL TO PUBLIC '
      'USING (current_user NOT IN (''anon'', ''authenticated'')) '
      'WITH CHECK (current_user NOT IN (''anon'', ''authenticated''))',
      t.tablename);
  END LOOP;
END $app$;

COMMIT;
