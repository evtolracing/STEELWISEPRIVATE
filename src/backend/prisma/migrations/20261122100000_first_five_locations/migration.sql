-- The first five real locations (owner's choice, 2026-11-22): Charlotte, Potterville, Lansing, Battle Creek, Jackson.
-- Names, addresses, phone and fax are from alro.com. Email, hours and manager are not published there and are left
-- blank for the owner to fill in on Admin > Locations. Each is added as an active branch that sells and ships.
-- A code that is already on file is left exactly as it is, so this is safe to run again.
-- Needs 20261122090000_location_details first (the new columns).
INSERT INTO "Location" ("id", "code", "name", "type", "ownerId", "addressLine1", "city", "state", "postalCode", "country",
                        "phone", "fax", "timezone", "isBranch", "isActive", "sellsFrom", "shipsFrom", "squareFeet", "processes", "updatedAt")
SELECT gen_random_uuid()::text, v.code, v.name, 'WAREHOUSE'::"LocationType", o.id, v.address, v.city, 'MI', v.zip, 'US',
       v.phone, v.fax, 'America/Detroit', true, true, true, true, v.sqft, v.processes, now()
FROM (VALUES
  ('CT', 'Charlotte',     '1298 Lipsey Dr.',     'Charlotte',    '48813',      '(517) 541-2558', '(517) 541-2559', 126600,
     ARRAY['Grinding', 'Oxy-Fuel Cutting', 'Plasma Cutting', 'Plate Laser Cutting', 'Precision Milled Super Square',
           'Precision Plate Sawing', 'Press Brake & Forming', 'Saw Cutting', 'Shearing', 'Thermal Processing',
           'Tube Cutting & Chamfering', 'Tube Laser Cutting', 'Waterjet Cutting']::TEXT[]),
  ('PV', 'Potterville',   '5859 Alro Park Dr.',  'Potterville',  '48876-8795', '(517) 645-9900', '(517) 645-9909', NULL::INTEGER, ARRAY[]::TEXT[]),
  ('L2', 'Lansing Steel', '1800 W. Willow St.',  'Lansing',      '48915-1498', '(517) 371-9600', '(517) 371-9640', NULL, ARRAY[]::TEXT[]),
  ('BC', 'Battle Creek',  '801 N. 20th St.',     'Battle Creek', '49037-7472', '(269) 968-0234', '(269) 968-3865', NULL, ARRAY[]::TEXT[]),
  ('JX', 'Jackson Steel', '3100 E. High St.',    'Jackson',      '49203',      '(517) 787-5500', '(517) 787-6390', NULL, ARRAY[]::TEXT[])
) AS v(code, name, address, city, zip, phone, fax, sqft, processes)
-- The company that owns the locations already on file.
CROSS JOIN LATERAL (SELECT "ownerId" AS id FROM "Location" GROUP BY "ownerId" ORDER BY count(*) DESC, "ownerId" LIMIT 1) o
ON CONFLICT ("code") DO NOTHING;
