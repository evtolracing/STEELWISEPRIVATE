-- Phase 9.5: financial ledger (double entry). Adds ten new tables and their rules.
-- No existing table is changed and no existing row is touched. Nothing posts until the ledger is
-- activated, which needs an accountant's approval recorded in the application.

CREATE TABLE IF NOT EXISTS "LedgerAccount" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL, "normalSide" TEXT NOT NULL,
  "isControl" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true, "description" TEXT,
  "approvedAt" TIMESTAMP(3), "approvedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LedgerAccount_code_key" ON "LedgerAccount"("code");

CREATE TABLE IF NOT EXISTS "LedgerMapping" (
  "key" TEXT NOT NULL, "accountCode" TEXT, "description" TEXT, "approvedAt" TIMESTAMP(3), "approvedBy" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerMapping_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "LedgerPeriod" (
  "id" TEXT NOT NULL, "year" INTEGER NOT NULL, "month" INTEGER NOT NULL, "startsOn" DATE NOT NULL, "endsOn" DATE NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN', "closedAt" TIMESTAMP(3), "closedById" TEXT,
  "reopenedAt" TIMESTAMP(3), "reopenedById" TEXT, "reopenReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerPeriod_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LedgerPeriod_year_month_key" ON "LedgerPeriod"("year", "month");

CREATE TABLE IF NOT EXISTS "LedgerEvent" (
  "id" TEXT NOT NULL, "eventKind" TEXT NOT NULL, "sourceType" TEXT NOT NULL, "sourceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING', "reason" TEXT, "attempts" INTEGER NOT NULL DEFAULT 0, "locationId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL, "journalEntryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LedgerEvent_eventKind_sourceType_sourceId_key" ON "LedgerEvent"("eventKind", "sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "LedgerEvent_status_idx" ON "LedgerEvent"("status");
CREATE INDEX IF NOT EXISTS "LedgerEvent_sourceType_sourceId_idx" ON "LedgerEvent"("sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "LedgerEvent_locationId_status_idx" ON "LedgerEvent"("locationId", "status");

CREATE TABLE IF NOT EXISTS "JournalEntry" (
  "id" TEXT NOT NULL, "entryNumber" TEXT NOT NULL, "entryDate" DATE NOT NULL, "periodId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT', "kind" TEXT NOT NULL, "eventKind" TEXT, "sourceType" TEXT, "sourceId" TEXT,
  "ruleVersion" INTEGER, "currency" TEXT NOT NULL DEFAULT 'USD', "locationId" TEXT, "legalEntityId" TEXT, "memo" TEXT,
  "reversesEntryId" TEXT, "totalDebit" DECIMAL(18,2) NOT NULL DEFAULT 0, "createdById" TEXT, "createdByService" TEXT,
  "postedAt" TIMESTAMP(3), "postedById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "JournalEntry_reversesEntryId_key" ON "JournalEntry"("reversesEntryId");
CREATE INDEX IF NOT EXISTS "JournalEntry_periodId_idx" ON "JournalEntry"("periodId");
CREATE INDEX IF NOT EXISTS "JournalEntry_entryDate_idx" ON "JournalEntry"("entryDate");
CREATE INDEX IF NOT EXISTS "JournalEntry_sourceType_sourceId_idx" ON "JournalEntry"("sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "JournalEntry_locationId_entryDate_idx" ON "JournalEntry"("locationId", "entryDate");
CREATE INDEX IF NOT EXISTS "JournalEntry_status_kind_idx" ON "JournalEntry"("status", "kind");
-- One entry per business event, whatever the application does.
CREATE UNIQUE INDEX IF NOT EXISTS "JournalEntry_one_per_event" ON "JournalEntry"("eventKind", "sourceType", "sourceId") WHERE "kind" = 'SYSTEM';

CREATE TABLE IF NOT EXISTS "JournalLine" (
  "id" TEXT NOT NULL, "entryId" TEXT NOT NULL, "lineNumber" INTEGER NOT NULL, "accountId" TEXT NOT NULL,
  "debit" DECIMAL(18,2) NOT NULL DEFAULT 0, "credit" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "locationId" TEXT, "division" TEXT, "customerId" TEXT, "supplierId" TEXT, "productId" TEXT, "coilId" TEXT,
  "jurisdiction" TEXT, "memo" TEXT,
  CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "JournalLine_entryId_lineNumber_key" ON "JournalLine"("entryId", "lineNumber");
CREATE INDEX IF NOT EXISTS "JournalLine_accountId_idx" ON "JournalLine"("accountId");
CREATE INDEX IF NOT EXISTS "JournalLine_locationId_accountId_idx" ON "JournalLine"("locationId", "accountId");
CREATE INDEX IF NOT EXISTS "JournalLine_customerId_idx" ON "JournalLine"("customerId");
CREATE INDEX IF NOT EXISTS "JournalLine_productId_idx" ON "JournalLine"("productId");
CREATE INDEX IF NOT EXISTS "JournalLine_coilId_idx" ON "JournalLine"("coilId");

-- Entry numbers. A sequence, so two entries posted at once never wait on each other. A save that is
-- undone leaves a gap in the numbers; a gap is never reused.
CREATE SEQUENCE IF NOT EXISTS "JournalEntry_number_seq" START 1;

CREATE TABLE IF NOT EXISTS "LedgerExternalAccount" (
  "id" TEXT NOT NULL, "provider" TEXT NOT NULL, "accountCode" TEXT NOT NULL, "scope" TEXT NOT NULL DEFAULT '*',
  "externalAccount" TEXT NOT NULL, "externalName" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedById" TEXT,
  CONSTRAINT "LedgerExternalAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LedgerExternalAccount_provider_accountCode_scope_key" ON "LedgerExternalAccount"("provider", "accountCode", "scope");

CREATE TABLE IF NOT EXISTS "LedgerExportBatch" (
  "id" TEXT NOT NULL, "batchNumber" TEXT NOT NULL, "provider" TEXT NOT NULL, "fromDate" DATE NOT NULL, "toDate" DATE NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'GENERATED', "entryCount" INTEGER NOT NULL, "totalDebit" DECIMAL(18,2) NOT NULL,
  "checksum" TEXT NOT NULL, "content" TEXT NOT NULL, "error" TEXT, "externalReference" TEXT, "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "acknowledgedAt" TIMESTAMP(3), "acknowledgedById" TEXT,
  CONSTRAINT "LedgerExportBatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LedgerExportBatch_batchNumber_key" ON "LedgerExportBatch"("batchNumber");
CREATE INDEX IF NOT EXISTS "LedgerExportBatch_provider_status_idx" ON "LedgerExportBatch"("provider", "status");

CREATE TABLE IF NOT EXISTS "LedgerExportItem" (
  "id" TEXT NOT NULL, "batchId" TEXT NOT NULL, "provider" TEXT NOT NULL, "entryId" TEXT NOT NULL,
  CONSTRAINT "LedgerExportItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LedgerExportItem_provider_entryId_key" ON "LedgerExportItem"("provider", "entryId");
CREATE INDEX IF NOT EXISTS "LedgerExportItem_batchId_idx" ON "LedgerExportItem"("batchId");

CREATE TABLE IF NOT EXISTS "LedgerReconciliation" (
  "id" TEXT NOT NULL, "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "ranById" TEXT, "asOf" TIMESTAMP(3) NOT NULL,
  "passed" BOOLEAN NOT NULL, "exceptions" INTEGER NOT NULL, "checks" JSONB NOT NULL,
  CONSTRAINT "LedgerReconciliation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LedgerReconciliation_ranAt_idx" ON "LedgerReconciliation"("ranAt");

DO $l95$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JournalEntry_periodId_fkey') THEN
    ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "LedgerPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JournalEntry_reversesEntryId_fkey') THEN
    ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_reversesEntryId_fkey" FOREIGN KEY ("reversesEntryId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JournalLine_entryId_fkey') THEN
    ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JournalLine_accountId_fkey') THEN
    ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LedgerExportItem_batchId_fkey') THEN
    ALTER TABLE "LedgerExportItem" ADD CONSTRAINT "LedgerExportItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LedgerExportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  -- Values.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LedgerAccount_type_known') THEN
    ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_type_known" CHECK ("type" IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'CONTRA_REVENUE', 'EXPENSE'));
    ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_side_known" CHECK ("normalSide" IN ('DEBIT', 'CREDIT'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LedgerPeriod_status_known') THEN
    ALTER TABLE "LedgerPeriod" ADD CONSTRAINT "LedgerPeriod_status_known" CHECK ("status" IN ('OPEN', 'CLOSED'));
    ALTER TABLE "LedgerPeriod" ADD CONSTRAINT "LedgerPeriod_month_valid" CHECK ("month" BETWEEN 1 AND 12 AND "startsOn" <= "endsOn");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LedgerEvent_status_known') THEN
    ALTER TABLE "LedgerEvent" ADD CONSTRAINT "LedgerEvent_status_known" CHECK ("status" IN ('PENDING', 'POSTED', 'FAILED', 'REVERSED', 'RECONCILIATION_REQUIRED', 'NOT_POSTED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JournalEntry_status_known') THEN
    ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_status_known" CHECK ("status" IN ('DRAFT', 'POSTED'));
    ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_kind_known" CHECK ("kind" IN ('SYSTEM', 'MANUAL', 'REVERSAL', 'OPENING'));
    ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_not_own_reversal" CHECK ("reversesEntryId" IS NULL OR "reversesEntryId" <> "id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JournalLine_one_side') THEN
    ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_one_side" CHECK ("debit" >= 0 AND "credit" >= 0 AND ("debit" = 0) <> ("credit" = 0));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LedgerExportBatch_status_known') THEN
    ALTER TABLE "LedgerExportBatch" ADD CONSTRAINT "LedgerExportBatch_status_known" CHECK ("status" IN ('GENERATED', 'ACKNOWLEDGED', 'FAILED', 'VOID'));
  END IF;
END
$l95$;

-- A posted entry is never changed or removed, and an entry can only become posted when it balances,
-- has at least two lines, and its date lies in an open period.
CREATE OR REPLACE FUNCTION ledger_entry_guard() RETURNS trigger AS $fn$
DECLARE d NUMERIC; c NUMERIC; n INTEGER; p RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."status" = 'POSTED' THEN RAISE EXCEPTION 'LEDGER_IMMUTABLE: posted journal entry % cannot be deleted', OLD."entryNumber" USING ERRCODE = '23514'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW."status" <> 'DRAFT' THEN RAISE EXCEPTION 'LEDGER_DRAFT_FIRST: a journal entry is written as a draft and then posted' USING ERRCODE = '23514'; END IF;
    RETURN NEW;
  END IF;
  IF OLD."status" = 'POSTED' THEN RAISE EXCEPTION 'LEDGER_IMMUTABLE: posted journal entry % cannot be changed', OLD."entryNumber" USING ERRCODE = '23514'; END IF;
  IF NEW."status" = 'POSTED' THEN
    SELECT COALESCE(SUM("debit"), 0), COALESCE(SUM("credit"), 0), COUNT(*) INTO d, c, n FROM "JournalLine" WHERE "entryId" = NEW."id";
    IF n < 2 THEN RAISE EXCEPTION 'LEDGER_TOO_FEW_LINES: journal entry % needs at least two lines', NEW."entryNumber" USING ERRCODE = '23514'; END IF;
    IF d <> c OR d <= 0 THEN RAISE EXCEPTION 'LEDGER_UNBALANCED: journal entry % has debits % and credits %', NEW."entryNumber", d, c USING ERRCODE = '23514'; END IF;
    -- The period row is locked for the rest of the transaction, so a close waits for entries being posted.
    SELECT "status", "startsOn", "endsOn" INTO p FROM "LedgerPeriod" WHERE "id" = NEW."periodId" FOR SHARE;
    IF p."status" <> 'OPEN' THEN RAISE EXCEPTION 'LEDGER_PERIOD_CLOSED: the period of journal entry % is closed', NEW."entryNumber" USING ERRCODE = '23514'; END IF;
    IF NEW."entryDate" < p."startsOn" OR NEW."entryDate" > p."endsOn" THEN RAISE EXCEPTION 'LEDGER_WRONG_PERIOD: the date of journal entry % is outside its period', NEW."entryNumber" USING ERRCODE = '23514'; END IF;
    NEW."totalDebit" := d;
    IF NEW."postedAt" IS NULL THEN NEW."postedAt" := CURRENT_TIMESTAMP; END IF;
  END IF;
  RETURN NEW;
END
$fn$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ledger_line_guard() RETURNS trigger AS $fn$
DECLARE s TEXT; e TEXT;
BEGIN
  e := CASE WHEN TG_OP = 'DELETE' THEN OLD."entryId" ELSE NEW."entryId" END;
  SELECT "status" INTO s FROM "JournalEntry" WHERE "id" = e;
  IF s = 'POSTED' THEN RAISE EXCEPTION 'LEDGER_IMMUTABLE: the lines of a posted journal entry cannot be added, changed or removed' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'UPDATE' AND NEW."entryId" <> OLD."entryId" THEN
    SELECT "status" INTO s FROM "JournalEntry" WHERE "id" = OLD."entryId";
    IF s = 'POSTED' THEN RAISE EXCEPTION 'LEDGER_IMMUTABLE: the lines of a posted journal entry cannot be moved' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "JournalEntry_guard" ON "JournalEntry";
CREATE TRIGGER "JournalEntry_guard" BEFORE INSERT OR UPDATE OR DELETE ON "JournalEntry" FOR EACH ROW EXECUTE FUNCTION ledger_entry_guard();
DROP TRIGGER IF EXISTS "JournalLine_guard" ON "JournalLine";
CREATE TRIGGER "JournalLine_guard" BEFORE INSERT OR UPDATE OR DELETE ON "JournalLine" FOR EACH ROW EXECUTE FUNCTION ledger_line_guard();

-- TRUNCATE does not fire row triggers, so it is refused by its own trigger: posted history cannot be emptied in one statement.
CREATE OR REPLACE FUNCTION ledger_no_truncate() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'LEDGER_IMMUTABLE: the journal cannot be truncated' USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS "JournalEntry_no_truncate" ON "JournalEntry";
CREATE TRIGGER "JournalEntry_no_truncate" BEFORE TRUNCATE ON "JournalEntry" FOR EACH STATEMENT EXECUTE FUNCTION ledger_no_truncate();
DROP TRIGGER IF EXISTS "JournalLine_no_truncate" ON "JournalLine";
CREATE TRIGGER "JournalLine_no_truncate" BEFORE TRUNCATE ON "JournalLine" FOR EACH STATEMENT EXECUTE FUNCTION ledger_no_truncate();
