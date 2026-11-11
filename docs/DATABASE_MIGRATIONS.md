# Database migrations

STEELWISE runs on Postgres (Supabase) for the demo and will move to MySQL 8
on our own servers for production. The schema is written so the same
`prisma/schema.prisma` works on both. This page covers how schema changes
are made and how to bring the existing Supabase database onto migrations.

## Rules that keep the schema portable

- **Lists are JSON.** A list field is `Json @default("[]")`, never `String[]`
  or an enum list. Postgres stores it as `jsonb`, MySQL as `JSON`. You read
  and write plain JavaScript arrays. To filter by "list contains X", load the
  rows and filter in JavaScript (see `services/webhookService.js`).
- **Case-insensitive search uses `ci`.** Write
  `{ name: { contains: search, ...ci } }` with `ci` from `src/lib/dbText.js`.
  Never write `mode: 'insensitive'` directly; MySQL rejects it.
- **No raw SQL in app code**, except the portable `SELECT 1` health check.
- **Long text on MySQL.** Prisma maps `String` to `VARCHAR(191)` on MySQL.
  Fields that hold long text will need `@db.Text` when we switch (Phase 6).

## Making a schema change

1. Edit `src/backend/prisma/schema.prisma`.
2. Against a local database, run `npm run db:migrate -- --name what_changed`
   from `src/backend`. This writes a new folder under `prisma/migrations/`.
3. Commit the schema and the migration folder together.
4. To apply to Supabase, run `npm run db:migrate:deploy` with `DATABASE_URL`
   and `DIRECT_URL` pointing at it. Vercel builds do not run migrations;
   apply them by hand before deploying code that needs them.

## Applying a new migration from the Supabase SQL Editor

Each PR that adds a migration also adds a paste-ready file under
`src/backend/prisma/upgrades/sql-editor/`, made with `npm run db:sql-editor`.
Paste it into Supabase → SQL Editor → New query and click Run. It runs as
one transaction, skips anything already applied, and records the migration
the same way `prisma migrate deploy` does, so you can mix the two.

The file also turns on Row Level Security for every table. Supabase serves
the public schema through its REST API to anyone with the anon key; with
RLS on, that API returns nothing. If Supabase asks whether to run with RLS,
choose to enable it.

RLS with no policy also blocks the app itself when its database role is
not the table's owner, which is the case for tables created in the SQL
Editor. So the file also adds a `steelwise_app` policy on every table that
lets any role in except Supabase's `anon` and `authenticated`. If an older
update left tables without it, run
`prisma/upgrades/sql-editor/fix-rls-app-access.sql` once.

Apply the database update before merging the PR that needs it (the change is
additive, so the old code keeps working against the new tables).

## Loading demo data

`npm run db:seed:demo` from `src/backend` loads everything. Without a
terminal, sign in as an owner or super admin and call
`POST /api/admin/seed-demo?part=<name>` once per part (`GET
/api/admin/seed-demo` lists them). One request for everything can outlast
Vercel's 30-second function limit, so load it part by part. From the
browser console on the signed-in app:

```js
(async () => {
  const h = { Authorization: 'Bearer ' + localStorage.getItem('token') }
  const { parts } = await (await fetch('/api/admin/seed-demo', { headers: h })).json()
  for (const p of parts) {
    const r = await fetch('/api/admin/seed-demo?part=' + p, { method: 'POST', headers: h })
    console.log(p, r.status, await r.text())
  }
})()
```

Every part is safe to repeat. Set `DEMO_SEED_ENABLED=false` on real
production servers.

## Bringing the existing Supabase database onto migrations (one time)

The Supabase database was created with `prisma db push`, so it has no
migration history, and its list columns are Postgres arrays. Do this once.

### Easiest: Supabase SQL Editor (no terminal needed)

1. Back up: Supabase → Database → Backups.
2. Open `src/backend/prisma/upgrades/supabase-sql-editor-upgrade.sql`, copy
   all of it, paste it into Supabase → SQL Editor → New query, and click Run.
   It runs as one transaction, so if anything fails nothing is changed.
3. Check it worked: run `select migration_name from "_prisma_migrations";`
   and you should see `0_init`.

If it fails with "already exists", the database is not in the state the file
expects; use the terminal steps below instead.

### Terminal steps

1. **Back up.** In Supabase, Database → Backups, or
   `pg_dump "$DIRECT_URL" > steelwise-before-migrations.sql`.
2. **Convert list columns to JSON** (keeps the data, safe to re-run):

   ```bash
   cd src/backend
   npx prisma db execute --file prisma/upgrades/001_lists_to_json.sql --schema prisma/schema.prisma
   ```

3. **See what else differs:**

   ```bash
   npx prisma migrate diff --from-url "$DIRECT_URL" \
     --to-schema-datamodel prisma/schema.prisma --script > remaining.sql
   ```

   Read `remaining.sql`. It should only create things (the safety tables,
   their types and indexes). If it contains any `DROP` or `ALTER COLUMN`,
   stop and check before going on.

4. **Apply it and mark the baseline as done:**

   ```bash
   npx prisma db execute --file remaining.sql --schema prisma/schema.prisma
   npx prisma migrate resolve --applied 0_init
   npm run db:migrate:status   # should say the schema is up to date
   ```

After this, every later change goes through `npm run db:migrate:deploy`.
A brand-new database just needs `npm run db:migrate:deploy`.
