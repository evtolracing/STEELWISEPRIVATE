-- One event is recorded once per subscriber (finding H-002).
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
