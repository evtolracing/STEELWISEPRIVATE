-- Weight of one foot of a long product (bar, shape, tube, pipe), so the store weighs and prices an angle, a beam or a
-- tube from its real weight instead of treating it as a round bar (2026-11-26). One optional column. Existing
-- products are left empty and are weighed as before. Safe to run again.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weightPerFtLb" DECIMAL(12,4);
