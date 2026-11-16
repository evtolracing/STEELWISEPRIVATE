-- A voided counter quick sale is a cancelled order (finding G-009).
-- Until now a void wrote "VOIDED: <reason>" into the order's notes and left the order COMPLETE,
-- so every report by order status counted the sale. From this change the void also sets the
-- status to CANCELLED; this statement does the same for sales voided before it.
-- Nothing is removed: the notes, the invoice, the credit memo and the refund all stay.
-- Running it a second time changes nothing.
UPDATE "Order"
SET "status" = 'CANCELLED', "updatedAt" = now()
WHERE "poReference" LIKE 'QS:%'
  AND "notes" LIKE '%VOIDED:%'
  AND "status" <> 'CANCELLED';
