/**
 * Turns migrations into one file you can paste into the Supabase SQL Editor.
 *
 *   npm run db:sql-editor                      # every migration after 0_init
 *   npm run db:sql-editor -- <migration_name>  # just that one
 *
 * The file runs in a single transaction, skips migrations the database
 * already has, and records each one in _prisma_migrations exactly as
 * `prisma migrate deploy` would, so the two ways of applying stay in step.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'prisma');
const migrationsDir = path.join(root, 'migrations');
const outDir = path.join(root, 'upgrades', 'sql-editor');

const wanted = process.argv[2];
const names = fs
  .readdirSync(migrationsDir)
  .filter(name => fs.statSync(path.join(migrationsDir, name)).isDirectory())
  .filter(name => name !== '0_init')
  .filter(name => !wanted || name === wanted)
  .sort();

if (names.length === 0) {
  console.error(wanted ? `No migration named ${wanted}` : 'No migrations after 0_init');
  process.exit(1);
}

const sqlString = value => `'${value.replace(/'/g, "''")}'`;
const dollar = tag => '$' + tag + '$';

let out = `-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: ${names.join(', ')}

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
`;

for (const name of names) {
  const sql = fs.readFileSync(path.join(migrationsDir, name, 'migration.sql'), 'utf8');
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');
  // Dollar-quote the migration so it can run inside a DO block.
  const suffix = crypto.randomBytes(4).toString('hex');
  const block = dollar(`m_${suffix}`);
  const body = dollar(`body_${suffix}`);
  out += `
-- ${name}
DO ${block}
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = ${sqlString(name)} AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping ${name} (already applied)';
    RETURN;
  END IF;
  EXECUTE ${body}${sql}${body};
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, ${sqlString(checksum)}, now(), ${sqlString(name)}, 1);
END ${block};
`;
}

// Supabase exposes the public schema through its REST API to anyone with
// the anon key. Turning RLS on for every table closes that API; the
// steelwise_app policy below lets the app's own connection back in.
out += `
-- Row Level Security on every table (blocks Supabase's public API keys).
DO $rls$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $rls$;
`;

// RLS with no policy also blocks the app when its database role is not the
// table owner (the case for tables created here). One policy per table lets
// every role in except Supabase's public API roles, whatever the app's role
// is called; requests made with the anon key still see nothing.
out += `
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
`;

out += '\nCOMMIT;\n';

fs.mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `${wanted || names[names.length - 1]}.sql`);
fs.writeFileSync(file, out);
console.log(`Wrote ${path.relative(process.cwd(), file)}`);
