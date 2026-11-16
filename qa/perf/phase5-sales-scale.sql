-- Phase 5: adds requests for quote and quotes to the scaled QA copy (steelwise_qa_scale3), so the
-- sales screens are timed with a realistic backlog across 60 branches. Synthetic, local QA only.
--   psql -d steelwise_qa_scale3 -f qa/perf/phase5-sales-scale.sql
-- 300 requests a branch over a year, each with one line and one quote; about a fifth still open,
-- a fifth of those past their valid-until date.
DO $$ BEGIN
  IF current_database() NOT LIKE '%qa%' THEN RAISE EXCEPTION 'local QA databases only'; END IF;
END $$;

DELETE FROM "QuoteLine" WHERE "quoteId" IN (SELECT id FROM "Quote" WHERE "quoteNumber" LIKE 'PQ5-%');
DELETE FROM "Quote" WHERE "quoteNumber" LIKE 'PQ5-%';
DELETE FROM "RFQLine" WHERE "rfqId" IN (SELECT id FROM "RFQ" WHERE "rfqNumber" LIKE 'PR5-%');
DELETE FROM "RFQ" WHERE "rfqNumber" LIKE 'PR5-%';

CREATE TEMP TABLE p5_branch AS
  SELECT id, row_number() OVER (ORDER BY code) AS n FROM "Location" WHERE "isActive" ORDER BY code LIMIT 60;
CREATE TEMP TABLE p5_cust AS
  SELECT id, row_number() OVER (ORDER BY code) AS n FROM "Organization" WHERE "parentId" IS NULL ORDER BY code LIMIT 400;

CREATE TEMP TABLE p5_rfq AS
SELECT gen_random_uuid()::text AS id, 'PR5-' || lpad(g::text, 6, '0') AS num, g,
       (SELECT id FROM p5_branch WHERE n = 1 + (g % 60)) AS loc,
       (SELECT id FROM p5_cust WHERE n = 1 + (g % (SELECT count(*) FROM p5_cust))) AS cust,
       now() - ((g % 365) || ' days')::interval AS at
FROM generate_series(1, 18000) g;

INSERT INTO "RFQ" (id, "rfqNumber", "customerId", status, "locationId", "submittedAt", "createdAt", "updatedAt")
SELECT id, num, cust, (CASE WHEN g % 5 = 0 THEN 'QUOTED' WHEN g % 3 = 0 THEN 'REJECTED' ELSE 'ACCEPTED' END)::"RFQStatus", loc, at, at, at FROM p5_rfq;
INSERT INTO "RFQLine" (id, "rfqId", "lineNumber", description, "requestedQty", unit)
SELECT gen_random_uuid()::text, id, 1, 'PR5 plate ' || g, 1000 + (g % 9000), 'LB' FROM p5_rfq;

CREATE TEMP TABLE p5_quote AS
SELECT gen_random_uuid()::text AS id, 'PQ5-' || lpad(g::text, 6, '0') AS num, r.id AS rfq, r.loc, r.at, g,
       round((650 + (g % 9000) * 0.65)::numeric, 2) AS sub
FROM p5_rfq r;

INSERT INTO "Quote" (id, "quoteNumber", "rfqId", version, status, subtotal, "taxAmount", "freightAmount", "totalAmount", "validFrom", "validUntil", "locationId", "createdAt", "updatedAt")
SELECT id, num, rfq, 1,
       (CASE WHEN g % 5 = 0 THEN 'SENT' WHEN g % 3 = 0 THEN 'REJECTED' ELSE 'ACCEPTED' END)::"QuoteStatus",
       sub, round(sub * 0.06, 2), 0, round(sub * 1.06, 2), at,
       CASE WHEN g % 25 = 0 THEN now() - interval '2 days' ELSE at + interval '400 days' END,
       loc, at, at
FROM p5_quote;
INSERT INTO "QuoteLine" (id, "quoteId", "lineNumber", description, quantity, unit, "unitPrice", "priceUnit", "extendedPrice")
SELECT gen_random_uuid()::text, id, 1, 'PQ5 plate ' || g, 1000 + (g % 9000), 'LB', 65, 'CWT', sub FROM p5_quote;

ANALYZE "RFQ"; ANALYZE "RFQLine"; ANALYZE "Quote"; ANALYZE "QuoteLine";
SELECT (SELECT count(*) FROM "RFQ") AS rfqs, (SELECT count(*) FROM "Quote") AS quotes,
       (SELECT count(*) FROM "Quote" WHERE status = 'SENT' AND "validUntil" < now()) AS lapsed_open;
