/**
 * Writes the working inventory (src/seeds/inventory) as database migrations, one per part, so each becomes its own
 * SQL Editor file small enough to paste (owner, 2026-11-26):
 *
 *   node scripts/working-inventory-sql.js            # writes prisma/migrations/20261126090*_working_inventory_*
 *   node scripts/working-inventory-sql.js --check    # fails if the files on disk differ from what it would write
 *   then: npm run db:sql-editor -- <migration>       # for each part
 *
 * Every part is safe to run twice: a row already on file is left alone. Stock goes only to a branch that is on
 * file and switched on, and is refused if the books are already started (it would not be on them). The extra
 * files the owner runs by hand (check before, verify after, remove) are written by --extras <dir>.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInventory, listingFor, BRANCHES } from '../src/seeds/inventory/build.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'prisma', 'migrations');
export const PARTS = [
  ['20261126090000_working_inventory_1_catalog', 'catalog'],
  ['20261126090100_working_inventory_2_heats', 'heats'],
  ...BRANCHES.map((b, i) => [`20261126090${2 + i}00_working_inventory_${3 + i}_stock_${b.code.toLowerCase()}`, `stock:${b.code}`]),
  ['20261126090700_working_inventory_8_outlet', 'outlet'],
  ['20261126090800_working_inventory_9_retire_demo', 'retire'],
  ['20261126090900_working_inventory_10_machines', 'machines'],
];

// A standard set of machines for a branch that has none on file yet, so jobs can be planned and run there. Charlotte's
// follow the processes alro.com lists for it (plate sawing, laser, plasma, waterjet, precision milling, shearing).
export const MACHINES = {
  CT: [['SAW', 'Precision Plate Saw'], ['SAW', 'Horizontal Band Saw'], ['SHEAR', 'Plate Shear 1/2" x 12 ft'], ['LASER', 'Plate Fiber Laser 12 kW'], ['LASER', 'Tube Laser'],
    ['PLASMA', 'High Definition Plasma Table'], ['WATERJET', 'Waterjet 6 ft x 12 ft'], ['CNC', 'Precision Mill (squaring)']],
  JX: [['SAW', 'Horizontal Band Saw'], ['SAW', 'Cold Saw'], ['SHEAR', 'Sheet Shear 1/4" x 10 ft'], ['PLASMA', 'Plasma Table'], ['ROUTER', 'CNC Router (plastics)'], ['PLASTIC_SAW', 'Panel Saw (plastics)']],
  BC: [['SAW', 'Horizontal Band Saw'], ['SAW', 'Cold Saw'], ['SHEAR', 'Sheet Shear 1/4" x 10 ft'], ['LASER', 'Sheet Fiber Laser 6 kW'], ['ROUTER', 'CNC Router (plastics)']],
  PV: [['SAW', 'Horizontal Band Saw'], ['SAW', 'Vertical Band Saw'], ['SHEAR', 'Sheet Shear 3/16" x 10 ft'], ['PLASMA', 'Plasma Table'], ['PLASTIC_SAW', 'Panel Saw (plastics)'], ['ROUTER', 'CNC Router (plastics)']],
  L2: [['SAW', 'Structural Band Saw'], ['SAW', 'Structural Band Saw, Miter'], ['SAW', 'Horizontal Band Saw'], ['SHEAR', 'Angle and Flat Shear'], ['PLASMA', 'Beam Coping Plasma'], ['CNC', 'Beam Drill Line']],
};
const PLASTICS_MACHINES = new Set(['ROUTER', 'PLASTIC_SAW']);

// The demo and sample records this data set replaces (src/seeds/demo/catalog.js, prisma/seed.js).
export const DEMO_SKUS = ['HR-A36-PL', 'CR-1018-BR', 'SS-304-SH', 'AL-6061-PL', 'HR-A572-PL', 'HDPE-SH-NAT', 'UHMW-ROD-WH', 'WG-25', 'CUT-DISC-9', 'REM-A36-PL', 'HRC-A36-048', 'CRC-A36-060'];
export const DEMO_REMNANT_IDS = Array.from({ length: 10 }, (_, i) => `rem-${String(i + 1).padStart(3, '0')}`);

const s = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined || Number.isNaN(v) ? 'NULL' : String(v));
const j = (v) => (v === null || v === undefined ? 'NULL' : s(JSON.stringify(v)));
const b = (v) => (v ? 'true' : 'false');
const ts = (d) => s(d.toISOString().replace('T', ' ').replace('Z', ''));
const rows = (list) => list.join(',\n');
const header = (lines) => lines.map((l) => `-- ${l}`).join('\n');

const CREATOR = `(SELECT id FROM "User" ORDER BY "createdAt", id LIMIT 1)`;
const BOOKS_GUARD = `DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM "AppSetting" WHERE key = 'ledger.activation' AND value->>'active' = 'true') THEN
    RAISE EXCEPTION 'The books are already started, so stock loaded here would not be on them. Nothing was changed.';
  END IF;
END $guard$;`;

function catalogSql(d) {
  const grades = d.grades.map((g) => `(${[s(g.code), s(g.name), s(g.family), s(g.specStandard), j(g.chemistryMin || null), j(g.chemistryMax || null), n(g.tensileMin), n(g.tensileMax), n(g.yieldMin), n(g.yieldMax), n(g.elongationMin), n(g.hardnessMin), n(g.hardnessMax)].join(', ')})`);
  const mills = d.mills.map((m) => `(${[s(m.code), s(m.name), s(m.city), s(m.state)].join(', ')})`);
  const products = d.products.map((p) => `(${[s(p.sku), s(p.name), s(p.description), s(p.category), s(p.productType), s(p.form), s(p.gradeCode), s(p.specStandard),
    n(p.t ?? null), n(p.w ?? null), n(p.priceUnit === 'EACH' ? p.price : Math.round(p.price * 10000) / 100), s(p.priceUnit || 'CWT'), s(p.division), n(p.lbPerFt ?? null)].join(', ')})`);
  const listings = d.products.map((p) => { const l = listingFor(p); return `(${[s(p.sku), b(l.featured), n(l.sortOrder), s(l.family), j(l.tags), n(l.leadTimeDays), j(l.thicknessOptions), j(l.widthOptions), j(l.lengthOptions), b(l.allowCutToSize), b(l.allowProcessing)].join(', ')})`; });
  return `${header([
    'Working inventory, part 1 of 10: grades, mills and plastics makers, products and their online store listings (owner, 2026-11-26:',
    '"a real looking inventory similar to alrosteel ... 100 sizes and or types per catagory"). Made by scripts/working-inventory-sql.js.',
    `${d.grades.length} grades, ${d.mills.length} producers, ${d.products.length} products in 13 categories plus supplies, one store listing each.`,
    'A grade already on file keeps every value it has; only empty values are filled in. A product number already on file is left alone.',
  ])}

INSERT INTO "Grade" ("id", "code", "name", "family", "specStandard", "chemistryMin", "chemistryMax", "tensileMin", "tensileMax", "yieldMin", "yieldMax", "elongationMin", "hardnessMin", "hardnessMax", "isActive", "updatedAt")
SELECT gen_random_uuid()::text, v.code, v.name, v.family::"GradeFamily", v.spec, v.cmin::jsonb, v.cmax::jsonb, v.tmin::numeric, v.tmax::numeric, v.ymin::numeric, v.ymax::numeric, v.emin::numeric, v.hmin::numeric, v.hmax::numeric, true, now()
FROM (VALUES
${rows(grades)}
) AS v(code, name, family, spec, cmin, cmax, tmin, tmax, ymin, ymax, emin, hmin, hmax)
ON CONFLICT ("code") DO UPDATE SET
  "specStandard" = COALESCE("Grade"."specStandard", EXCLUDED."specStandard"),
  "chemistryMin" = COALESCE("Grade"."chemistryMin", EXCLUDED."chemistryMin"),
  "chemistryMax" = COALESCE("Grade"."chemistryMax", EXCLUDED."chemistryMax"),
  "tensileMin" = COALESCE("Grade"."tensileMin", EXCLUDED."tensileMin"), "tensileMax" = COALESCE("Grade"."tensileMax", EXCLUDED."tensileMax"),
  "yieldMin" = COALESCE("Grade"."yieldMin", EXCLUDED."yieldMin"), "yieldMax" = COALESCE("Grade"."yieldMax", EXCLUDED."yieldMax"),
  "elongationMin" = COALESCE("Grade"."elongationMin", EXCLUDED."elongationMin"),
  "hardnessMin" = COALESCE("Grade"."hardnessMin", EXCLUDED."hardnessMin"), "hardnessMax" = COALESCE("Grade"."hardnessMax", EXCLUDED."hardnessMax");

INSERT INTO "Organization" ("id", "code", "name", "type", "city", "state", "country", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.code, v.name, 'MILL'::"OrgType", v.city, v.state, 'USA', true, now(), now()
FROM (VALUES
${rows(mills)}
) AS v(code, name, city, state)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Product" ("id", "sku", "name", "description", "category", "productType", "form", "gradeId", "specStandard", "thicknessMin", "thicknessMax", "widthMin", "widthMax", "basePriceCwt", "priceUnit", "division", "isRemnant", "isActive", "weightPerFtLb", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.sku, v.name, v.description, v.category, v.ptype::"ProductType", v.form::"ProductForm", g.id, v.spec,
       v.t::numeric, v.t::numeric, v.w::numeric, v.w::numeric, v.price::numeric, v.unit::"PriceUnit", v.division, false, true, v.perft::numeric, now(), now()
FROM (VALUES
${rows(products)}
) AS v(sku, name, description, category, ptype, form, grade, spec, t, w, price, unit, division, perft)
LEFT JOIN "Grade" g ON g."code" = v.grade
ON CONFLICT ("sku") DO NOTHING;

INSERT INTO "StoreListing" ("productId", "visible", "featured", "sortOrder", "family", "tags", "leadTimeDays", "minOrderQty", "thicknessOptions", "widthOptions", "lengthOptions", "allowCutToSize", "allowProcessing", "updatedAt")
SELECT p.id, true, v.featured, v.sort, v.family, v.tags::jsonb, v.lead, 1, v.th::jsonb, v.wd::jsonb, v.ln::jsonb, v.cut, v.proc, now()
FROM (VALUES
${rows(listings)}
) AS v(sku, featured, sort, family, tags, lead, th, wd, ln, cut, proc)
JOIN "Product" p ON p."sku" = v.sku
ON CONFLICT ("productId") DO NOTHING;
`;
}

function heatsSql(d) {
  const heats = d.heats.map((h) => `(${[s(h.heatNumber), s(h.millCode), s(h.gradeCode), ts(h.castDate), s(h.meltType), s(h.castType), j(h.chemistry), j(h.mechanicalProps), n(h.totalWeightLb)].join(', ')})`);
  return `${header([
    'Working inventory, part 2 of 10: heats and plastics lots (owner, 2026-11-26). Needs part 1 first. Made by scripts/working-inventory-sql.js.',
    `${d.heats.length} heats, each with its producer, cast date, chemistry and test values inside its grade's limits. A plastics "heat" is the`,
    'maker\'s production lot: the database asks every stocked piece for one. A heat number already on file is left alone.',
  ])}

INSERT INTO "Heat" ("id", "heatNumber", "millId", "gradeId", "castDate", "meltType", "castType", "chemistry", "mechanicalProps", "totalWeightLb", "status", "createdById", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.heat, o.id, g.id, v.castdate::timestamp, v.melt::"MeltType", v.casttype::"CastType", v.chem::jsonb, v.mech::jsonb, v.total::numeric, 'ACTIVE'::"HeatStatus", u.id, now(), now()
FROM (VALUES
${rows(heats)}
) AS v(heat, mill, grade, castdate, melt, casttype, chem, mech, total)
JOIN "Grade" g ON g."code" = v.grade
JOIN "Organization" o ON o."code" = v.mill
CROSS JOIN ${CREATOR} u
ON CONFLICT ("heatNumber") DO NOTHING;
`;
}

function stockSql(d, code) {
  const branch = BRANCHES.find((x) => x.code === code);
  const list = d.pieces.filter((p) => p.branch === code);
  const lines = list.map((p) => {
    const supply = p.product.form === 'SUPPLY';
    const qty = supply ? p.qty : p.weight;
    return `(${[s(p.tag), s(p.product.sku), s(p.product.gradeCode), s(p.heat?.heatNumber), s(p.product.form), n(p.t ?? null), n(p.w ?? null), n(p.l ?? null), n(p.od ?? null), n(p.id ?? null),
      n(p.weight), n(qty), s(supply ? 'EA' : 'LB'), s(p.bin), n(p.unitCost), ts(p.receivedAt), s(p.hold?.[0] || null), s(p.hold?.[1] || null)].join(', ')})`;
  });
  const lb = Math.round(list.filter((p) => p.product.form !== 'SUPPLY').reduce((t, p) => t + p.weight, 0));
  return `${header([
    `Working inventory, part ${3 + BRANCHES.indexOf(branch)} of 10: stock on the shelf at ${branch.name} (${code}) (owner, 2026-11-26). Needs parts 1 and 2 first.`,
    `${list.length} stocked pieces, ${lb.toLocaleString('en-US')} lb of metal and plastic plus supplies counted by the piece. Each piece gets its stock balance and a`,
    'receipt line in its history dated the day it came in. About 2 in 100 come in on a quality hold, so the hold path can be tested.',
    'Nothing is added when the branch is not on file or switched off, or when a tag number is already in use.',
    'Refused, with nothing changed, if the books are already started: run this before starting the sandbox books.',
  ])}

${BOOKS_GUARD}

WITH v(tag, sku, grade, heat, form, t, w, l, od, idin, weight, qty, unit, bin, cost, received, holdtype, holdreason) AS (VALUES
${rows(lines)}
),
branch AS (SELECT id, "ownerId" FROM "Location" WHERE "code" = ${s(code)} AND "isActive" = true),
creator AS ${CREATOR.replace('(SELECT id', '(SELECT id AS uid')},
src AS (
  SELECT v.*, p.id AS pid, g.id AS gid, h.id AS hid, br.id AS lid, br."ownerId" AS owner, c.uid
  FROM v
  CROSS JOIN branch br
  CROSS JOIN creator c
  JOIN "Product" p ON p."sku" = v.sku
  LEFT JOIN "Grade" g ON g."code" = v.grade
  LEFT JOIN "Heat" h ON h."heatNumber" = v.heat AND h."gradeId" = g.id
  WHERE v.form = 'SUPPLY' OR (h.id IS NOT NULL AND g.id IS NOT NULL)
),
coil AS (
  INSERT INTO "Coil" ("id", "coilNumber", "heatId", "productId", "gradeId", "ownerId", "form", "thicknessIn", "widthIn", "lengthIn", "odIn", "idIn",
                      "grossWeightLb", "netWeightLb", "status", "qcStatus", "locationId", "binLocation", "unitCost", "createdAt", "createdById", "updatedAt")
  SELECT gen_random_uuid()::text, tag, hid, pid, gid, owner, form::"ProductForm", t::numeric, w::numeric, l::numeric, od::numeric, idin::numeric,
         weight::numeric, weight::numeric, (CASE WHEN holdtype IS NULL THEN 'AVAILABLE' ELSE 'HOLD' END)::"CoilStatus",
         (CASE WHEN holdtype IS NULL THEN 'PASSED' ELSE 'HOLD' END)::"QCStatus", lid, bin, cost::numeric, received::timestamp, uid, now()
  FROM src
  ON CONFLICT ("coilNumber") DO NOTHING
  RETURNING id, "coilNumber"
),
balance AS (
  INSERT INTO "Inventory" ("id", "coilId", "locationId", "qtyOnHand", "qtyAvailable", "qtyAllocated", "qtyOnHold", "qtyInTransit", "unit", "unitCost", "avgCost", "lastMovement", "status", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, coil.id, src.lid, src.qty::numeric, CASE WHEN src.holdtype IS NULL THEN src.qty::numeric ELSE 0 END, 0,
         CASE WHEN src.holdtype IS NULL THEN 0 ELSE src.qty::numeric END, 0, src.unit, src.cost::numeric, src.cost::numeric, src.received::timestamp, 'ACTIVE', src.received::timestamp, now()
  FROM coil JOIN src ON src.tag = coil."coilNumber"
  RETURNING "coilId"
),
receipt AS (
  INSERT INTO "MaterialMovement" ("id", "coilId", "movementType", "toLocationId", "qtyMoved", "unit", "reasonCode", "notes", "unitCost", "createdAt", "createdById")
  SELECT gen_random_uuid()::text, coil.id, 'RECEIVE'::"MovementType", src.lid, src.qty::numeric, src.unit, 'RECEIPT',
         'Opening stock: working inventory loaded 2026-11-26.', src.cost::numeric, src.received::timestamp, src.uid
  FROM coil JOIN src ON src.tag = coil."coilNumber"
  RETURNING "coilId"
),
hold AS (
  INSERT INTO "QCHold" ("id", "coilId", "holdType", "holdReason", "holdDate", "holdById", "status", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, coil.id, src.holdtype::"HoldType", src.holdreason, src.received::timestamp, src.uid, 'ACTIVE'::"HoldStatus", src.received::timestamp, now()
  FROM coil JOIN src ON src.tag = coil."coilNumber"
  WHERE src.holdtype IS NOT NULL
  RETURNING "coilId"
)
INSERT INTO "AuditLog" ("id", "category", "eventType", "severity", "resourceType", "resourceId", "action", "details", "timestamp")
SELECT gen_random_uuid()::text, 'DATA', 'WORKING_INVENTORY_LOADED', 'INFO', 'Location', ${s(code)}, 'CREATE',
       jsonb_build_object('branch', ${s(code)}, 'pieces', (SELECT count(*) FROM coil), 'balances', (SELECT count(*) FROM balance),
                          'receipts', (SELECT count(*) FROM receipt), 'holds', (SELECT count(*) FROM hold), 'note', 'Working inventory, 2026-11-26.'),
       now()
WHERE EXISTS (SELECT 1 FROM coil);
`;
}

function outletSql(d) {
  const lines = d.remnants.map((r) => `(${[s(r.id), s(r.sku), s(r.name), s(r.grade), s(r.spec), s(r.form), s(r.family), s(r.type), s(r.condition), n(r.thickness), n(r.width), n(r.length),
    n(r.estimatedWeight), n(r.pricePerLb), s(r.location), s(r.locationName), s(r.heatNumber), ts(r.cutDate), n(r.qtyAvailable), s(r.notes)].join(', ')})`);
  return `${header([
    'Working inventory, part 8 of 10: Steel Outlet pieces (owner, 2026-11-26). Made by scripts/working-inventory-sql.js.',
    `${d.remnants.length} drops, offcuts, overruns and returns at the five branches, each with a heat number from part 2, a condition and a cut date,`,
    'so the outlet\'s aging discounts work on real ages. A piece only goes to a branch that is on file. A piece already on file is left alone.',
  ])}

INSERT INTO "Remnant" ("id", "sku", "name", "grade", "spec", "form", "family", "type", "condition", "thickness", "width", "length", "uom", "estimatedWeight", "pricePerLb",
                       "location", "locationName", "heatNumber", "cutDate", "receivedDate", "qtyAvailable", "reserved", "notes", "division", "createdAt", "updatedAt")
SELECT v.id, v.sku, v.name, v.grade, v.spec, v.form, v.family, v.type, v.cond, v.t, v.w, v.l, 'IN', v.lb, v.price::numeric,
       v.loc, v.locname, v.heat, v.cut::timestamp, v.cut::timestamp, v.qty, false, v.notes, 'OUTLET', now(), now()
FROM (VALUES
${rows(lines)}
) AS v(id, sku, name, grade, spec, form, family, type, cond, t, w, l, lb, price, loc, locname, heat, cut, qty, notes)
WHERE EXISTS (SELECT 1 FROM "Location" x WHERE x."code" = v.loc AND x."isActive" = true)
ON CONFLICT DO NOTHING;
`;
}

function retireSql() {
  const skus = DEMO_SKUS.map(s).join(', ');
  const rems = DEMO_REMNANT_IDS.map(s).join(', ');
  return `${header([
    'Working inventory, part 9 of 10: the demo catalog comes off the shelves and out of the store (owner, 2026-11-26: "getting rid of any mock',
    'data in these areas"). Run it after parts 1 to 8.',
    '- The 12 demo and sample products are switched off and hidden from the online store. One that nothing points to is deleted.',
    '- Demo stock (tag numbers starting DEMO- or COIL-) that is free, not reserved, not on the road and not in a job is taken off the shelf:',
    '  its balance goes to zero with an adjustment line in its history, and it leaves the stock lists. Its history stays.',
    '  Demo stock that is reserved, in a job or on the road is left as it is; the check file lists it.',
    '- The 10 demo Steel Outlet pieces are deleted, unless one is reserved for an order.',
    'Customers, orders, jobs and shipments are not touched. Safe to run twice.',
  ])}

UPDATE "Product" SET "isActive" = false, "updatedAt" = now() WHERE "sku" IN (${skus}) AND "isActive" = true;
UPDATE "StoreListing" sl SET "visible" = false, "updatedAt" = now() FROM "Product" p WHERE p.id = sl."productId" AND p."sku" IN (${skus}) AND sl."visible" = true;
DELETE FROM "Product" p
WHERE p."sku" IN (${skus})
  AND NOT EXISTS (SELECT 1 FROM "Coil" c WHERE c."productId" = p.id)
  AND NOT EXISTS (SELECT 1 FROM "OrderLine" o WHERE o."productId" = p.id)
  AND NOT EXISTS (SELECT 1 FROM "QuoteLine" q WHERE q."productId" = p.id);

WITH retired AS (
  SELECT c.id, c."coilNumber", c."locationId", i."qtyOnHand", i.unit, c."unitCost"
  FROM "Coil" c
  JOIN "Inventory" i ON i."coilId" = c.id
  WHERE (c."coilNumber" LIKE 'DEMO-%' OR c."coilNumber" LIKE 'COIL-%')
    AND c."status" IN ('AVAILABLE', 'HOLD')
    AND i."qtyOnHand" > 0 AND i."qtyAllocated" = 0 AND i."qtyInTransit" = 0
    AND NOT EXISTS (SELECT 1 FROM "OrderLineAllocation" a WHERE a."coilId" = c.id)
    AND NOT EXISTS (SELECT 1 FROM "WorkOrder" w WHERE w."sourceCoilId" = c.id)
),
moved AS (
  INSERT INTO "MaterialMovement" ("id", "coilId", "movementType", "fromLocationId", "qtyMoved", "unit", "reasonCode", "notes", "unitCost", "createdAt", "createdById")
  SELECT gen_random_uuid()::text, r.id, 'ADJUST'::"MovementType", r."locationId", r."qtyOnHand", r.unit, 'DEMO_RETIRED',
         'Demo stock taken off the shelf: replaced by the working inventory (2026-11-26).', r."unitCost", now(), ${CREATOR}
  FROM retired r
  RETURNING "coilId"
),
zeroed AS (
  UPDATE "Inventory" i SET "qtyOnHand" = 0, "qtyAvailable" = 0, "qtyOnHold" = 0, "status" = 'RETIRED', "lastMovement" = now(), "updatedAt" = now()
  FROM retired r WHERE i."coilId" = r.id
  RETURNING i."coilId"
),
closed AS (
  UPDATE "Coil" c SET "status" = 'CONSUMED', "updatedAt" = now() FROM retired r WHERE c.id = r.id RETURNING c.id
)
INSERT INTO "AuditLog" ("id", "category", "eventType", "severity", "resourceType", "resourceId", "action", "details", "timestamp")
SELECT gen_random_uuid()::text, 'DATA', 'DEMO_STOCK_RETIRED', 'INFO', 'Coil', r.id, 'UPDATE',
       jsonb_build_object('coilNumber', r."coilNumber", 'qty', r."qtyOnHand", 'unit', r.unit, 'note', 'Demo stock taken off the shelf (2026-11-26).'), now()
FROM retired r
WHERE EXISTS (SELECT 1 FROM moved) AND EXISTS (SELECT 1 FROM zeroed) AND EXISTS (SELECT 1 FROM closed);

DELETE FROM "Remnant" WHERE "id" IN (${rems}) AND "reserved" = false;
`;
}

// Machine kinds: the word a company's own kind of work is recognised by, and the label one is made with when it has none.
const KINDS = {
  SAW: ['SAW', 'Saw'], SHEAR: ['SHEAR', 'Shear'], LASER: ['LASER', 'Laser'], PLASMA: ['PLASMA', 'Plasma'], WATERJET: ['WATERJET', 'Waterjet'],
  CNC: ['CNC', 'CNC Machining'], ROUTER: ['ROUTER', 'Router'], PLASTIC_SAW: ['PLASTIC', 'Plastic Saw'], PACKOUT: ['PACK', 'Packout'],
};

function machinesSql() {
  const lines = Object.entries(MACHINES).flatMap(([code, list]) => {
    const count = {};
    return [...list, ['PACKOUT', 'Packaging and Shipping Station']].map(([type, name]) => {
      count[type] = (count[type] || 0) + 1;
      const division = PLASTICS_MACHINES.has(type) ? 'PLASTICS' : 'METALS';
      return `(${[s(code), s(`${code}-${type.replace('_', '')}-${String(count[type]).padStart(2, '0')}`), s(name), s(type), s(KINDS[type][0]), s(KINDS[type][1]), s(division)].join(', ')})`;
    });
  });
  const values = `(VALUES\n${rows(lines)}\n) AS v(branch, code, name, type, word, label, division)`;
  const kindOf = `(SELECT t.id FROM "WorkCenterType" t WHERE upper(t.id) = v.type OR (t."isActive" AND upper(t.id || ' ' || t.label) LIKE '%' || v.word || '%')
     ORDER BY (upper(t.id) = v.type) DESC, t."isActive" DESC, t.id LIMIT 1)`;
  return `${header([
    'Working inventory, part 10 of 10: machines, so jobs can be planned and run at every branch (owner, 2026-11-26: "make full job plans and runs").',
    'A branch gets a machine of a kind of work (saw, shear, laser, plasma, waterjet, CNC, router, plastics saw, packout) only when it has',
    'no machine of that kind yet, so machines already set up are never doubled. A kind of work the company already has is used as it is;',
    'one it does not have is added. Each machine works one 8-hour shift; change names and capacity on Admin > Work Centers.',
  ])}

INSERT INTO "WorkCenterType" ("id", "label", "divisions", "isActive", "createdAt", "updatedAt")
SELECT DISTINCT ON (v.type) v.type, v.label, jsonb_build_array(v.division), true, now(), now()
FROM ${values}
WHERE NOT EXISTS (SELECT 1 FROM "WorkCenterType" t WHERE upper(t.id) = v.type OR (t."isActive" AND upper(t.id || ' ' || t.label) LIKE '%' || v.word || '%'))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "WorkCenter" ("id", "code", "name", "locationId", "type", "capabilities", "capacity", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, x.code, x.name, x.lid, x.kind, '[]'::jsonb, jsonb_build_object('division', x.division, 'shiftCapacityMinutesPerDay', 480), true, now(), now()
FROM (
  SELECT v.*, l.id AS lid, ${kindOf} AS kind
  FROM ${values}
  JOIN "Location" l ON l."code" = v.branch AND l."isActive" = true
) x
WHERE x.kind IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "WorkCenter" w WHERE w."locationId" = x.lid AND w."isActive" = true AND upper(w.type) = upper(x.kind))
ON CONFLICT ("code") DO NOTHING;
`;
}

export function partSql(d, part) {
  if (part === 'machines') return machinesSql();
  if (part === 'catalog') return catalogSql(d);
  if (part === 'heats') return heatsSql(d);
  if (part === 'outlet') return outletSql(d);
  if (part === 'retire') return retireSql();
  if (part.startsWith('stock:')) return stockSql(d, part.slice(6));
  throw new Error(`Unknown part ${part}`);
}

function main() {
  const d = buildInventory();
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const [name, part] of PARTS) {
    const file = path.join(root, name, 'migration.sql');
    const sql = partSql(d, part);
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== sql) { console.error(`Out of date: ${name}`); stale += 1; }
      continue;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, sql);
    console.log(`${name}: ${(sql.length / 1024).toFixed(0)} KB`);
  }
  if (stale) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
