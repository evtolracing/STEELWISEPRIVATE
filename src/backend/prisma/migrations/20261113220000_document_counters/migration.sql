-- Owner decision of 2026-11-13: invoice and credit memo numbers are never skipped and never repeated.
-- One new table that holds the last number used in each series. It is read and advanced inside the
-- same transaction that saves the invoice, so a save that fails gives its number back.
-- Nothing existing is changed. Numbers already issued keep whatever gaps they have.
CREATE TABLE IF NOT EXISTS "DocumentCounter" (
    "series" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("series")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DocumentCounter_lastNumber_check') THEN
    ALTER TABLE "DocumentCounter" ADD CONSTRAINT "DocumentCounter_lastNumber_check" CHECK ("lastNumber" >= 0);
  END IF;
END $$;
-- Each series starts from the highest number already on file.
INSERT INTO "DocumentCounter" ("series", "lastNumber", "updatedAt")
SELECT v.p,
       COALESCE((SELECT MAX(substring(i."invoiceNumber" from '[0-9]+$')::bigint)
                   FROM "Invoice" i
                  WHERE i."invoiceNumber" ~ ('^' || v.p || '-[0-9]{1,9}$')), 0),
       CURRENT_TIMESTAMP
  FROM (VALUES ('INV'), ('CM')) AS v(p)
ON CONFLICT ("series") DO NOTHING;
