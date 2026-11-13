-- Stock balance identity (finding E-020): for every stock balance,
--   on hand = available + reserved + on hold
-- Every code path that changes a balance moves these figures together; from
-- now on the database refuses a row where they do not add up, so a future
-- change cannot break the identity unnoticed.
-- Added only if every existing row already satisfies it; otherwise it is
-- skipped with a notice so nothing that works today starts failing.
DO $chk$
DECLARE
  bad bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Inventory_balance_identity') THEN RETURN; END IF;
  SELECT count(*) INTO bad FROM "Inventory"
   WHERE NOT (abs("qtyOnHand" - ("qtyAvailable" + "qtyAllocated" + "qtyOnHold")) <= 0.0001);
  IF bad > 0 THEN
    RAISE NOTICE 'Check Inventory_balance_identity skipped: % existing row(s) in "Inventory" do not add up', bad;
  ELSE
    ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_balance_identity"
      CHECK (abs("qtyOnHand" - ("qtyAvailable" + "qtyAllocated" + "qtyOnHold")) <= 0.0001);
  END IF;
END
$chk$;
