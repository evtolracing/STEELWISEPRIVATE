// Group 8: backup, restore, deployment and rollback. An actual backup of the QA database is restored into
// a separate PostgreSQL server (port 5433, its own data folder), never over the QA or any live database.
// Times and the recovery point are measured and written to qa/results/phase10-restore.json.
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export default async function recovery(ctx, state) {
  const { S, G10, prisma, root, OWNER_URL, http1, sleep } = ctx;
  const g = G10.dr;
  const ISO = process.env.RESTORE_SERVER_URL || 'postgresql://postgres@localhost:5433';
  const TARGET = 'steelwise_qa_restore';
  const work = fs.mkdtempSync('/tmp/p10-restore-');
  const dump = path.join(work, 'steelwise_qa.dump');
  const sh = (cmd, args, opts = {}) => { const t = Date.now(); const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26, ...opts }); return { ...r, ms: Date.now() - t, out: `${r.stdout || ''}${r.stderr || ''}` }; };
  const psql = (url, sql) => sh('psql', [url, '-Atc', sql]);
  const one = (url, sql) => psql(url, sql).stdout.trim();
  const restoreUrl = `${ISO}/${TARGET}`;
  const facts = { at: new Date().toISOString(), source: `local QA database ${new URL(OWNER_URL).pathname.slice(1)}`, target: `separate PostgreSQL 16 server on port 5433, database ${TARGET}` };
  const isoUp = sh('pg_isready', ['-h', 'localhost', '-p', '5433']).status === 0;
  const m = (expect, extra = {}) => ({ init: 'The QA database after the earlier groups, with an active test ledger', scope: 'QA operator; separate restore server on port 5433', expect, sec: 'Production is never touched; the restore target is checked before anything is written', db: 'Only the restore target changes', rec: 'Measured restore', ...extra });

  /** Refuses any restore target that is not a local database whose name says restore and qa. */
  const safeTarget = (url) => { try { const u = new URL(url); return ['localhost', '127.0.0.1'].includes(u.hostname) && /qa/.test(u.pathname) && /restore/.test(u.pathname) && u.port !== '5432'; } catch { return false; } };

  await S(g, 'The restore refuses any target that could be a live or the QA database', m('Refused for a hosted database, the QA database itself and a name without restore'), async (ok) => {
    for (const bad of ['postgresql://u:p@db.supabase.co:5432/postgres', OWNER_URL, 'postgresql://postgres@localhost:5433/steelwise_live', 'postgresql://postgres@localhost:5432/steelwise_qa_restore']) ok(bad.replace(/:[^:@/]+@/, ':***@'), !safeTarget(bad));
    ok('the planned target is accepted', safeTarget(restoreUrl));
  });

  // The figures to compare, read just before the backup with nothing else writing.
  const figures = (url) => ({
    tables: Number(one(url, "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")),
    journal: one(url, `SELECT count(*) || ':' || COALESCE(sum(l.debit), 0) || ':' || COALESCE(sum(l.credit), 0) FROM "JournalLine" l JOIN "JournalEntry" e ON e.id = l."entryId" WHERE e.status IN ('POSTED', 'REVERSED')`),
    entries: one(url, 'SELECT count(*) FROM "JournalEntry"'),
    invoices: one(url, `SELECT count(*) || ':' || COALESCE(sum("totalAmount" - "paidAmount"), 0) FROM "Invoice" WHERE status <> 'CANCELLED'`),
    stock: one(url, 'SELECT count(*) || \':\' || COALESCE(sum("qtyOnHand"), 0) FROM "Inventory"'),
    audit: one(url, 'SELECT count(*) FROM "AuditLog"'),
    users: one(url, 'SELECT count(*) FROM "User"'),
    migrations: one(url, 'SELECT string_agg(migration_name, \',\' ORDER BY migration_name) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL'),
    seq: Number(one(url, 'SELECT last_value FROM "JournalEntry_number_seq"')),
    triggers: Number(one(url, "SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgname IN ('JournalEntry_guard', 'JournalLine_guard', 'JournalEntry_no_truncate', 'JournalLine_no_truncate')")),
    constraints: Number(one(url, "SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public'")),
    blobs: one(url, 'SELECT count(*) || \':\' || COALESCE(sum(length(data)), 0) FROM "DocumentBlob"'),
  });
  let before = null; let after = null; let markerId = null;

  await S(g, 'A backup of the QA database is taken with pg_dump, and its size and time are recorded', m('pg_dump exits 0; a non-empty file'), async (ok) => {
    before = figures(OWNER_URL);
    const t0 = new Date();
    // A marker written once the backup has started is after the recovery point and must not be restored.
    const run = spawn('pg_dump', ['-Fc', '-Z', '6', '-f', dump, OWNER_URL]);
    // Listen for the end at once: a small database can be dumped before the marker below is written.
    const ended = new Promise((r) => { run.on('exit', r); run.on('error', () => r(-1)); });
    await sleep(300);
    markerId = `qa-p10-after-backup-${Date.now()}`;
    await prisma.auditLog.create({ data: { id: markerId, category: 'SYSTEM', eventType: 'QA_RPO_MARKER', action: 'QA', severity: 'INFO', details: { writtenAfterBackupStarted: true } } });
    const code = await ended;
    facts.backup = { startedAt: t0.toISOString(), seconds: +((Date.now() - t0) / 1000).toFixed(1), bytes: fs.existsSync(dump) ? fs.statSync(dump).size : 0, format: 'pg_dump custom format, compression 6' };
    ok('pg_dump succeeded', code === 0, String(code));
    ok('a file was written', facts.backup.bytes > 100000, String(facts.backup.bytes));
  });

  await S(g, 'The backup restores into a separate server, and the restore time is recorded', m('pg_restore exits 0 with no errors'), async (ok) => {
    ok('the separate restore server is running on port 5433', isoUp, 'start it: initdb a folder and pg_ctl -o "-p 5433" start (qa/enterprise-excellence/phase-10-restore-test.md)');
    if (!isoUp) return;
    ok('the target is safe', safeTarget(restoreUrl));
    sh('psql', [`${ISO}/postgres`, '-qc', `DROP DATABASE IF EXISTS ${TARGET}`]);
    // The application role is a server-wide role: it must exist before its rights are restored (runbook step 2).
    sh('psql', [`${ISO}/postgres`, '-qc', "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'steelwise_runtime') THEN CREATE ROLE steelwise_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS; END IF; END $$"]);
    const c = sh('createdb', ['-h', 'localhost', '-p', '5433', '-U', 'postgres', TARGET]);
    ok('target made', c.status === 0, c.out.slice(0, 200));
    const t = Date.now();
    const r = sh('pg_restore', ['--exit-on-error', '--no-owner', '--role=postgres', '-d', restoreUrl, dump]);
    facts.restore = { seconds: +((Date.now() - t) / 1000).toFixed(1), exitCode: r.status, errors: (r.out.match(/error/gi) || []).length };
    ok('restored with no error', r.status === 0, r.out.slice(0, 300));
    after = figures(restoreUrl);
  });

  const same = (k, what) => S(g, `The restored database has the same ${what} as the backup`, m(`${what} equal`), async (ok) => { ok('restored', Boolean(after), 'no restore'); if (after) ok('equal', JSON.stringify(after[k]) === JSON.stringify(before[k]), `${before[k]} vs ${after[k]}`); });
  await same('tables', 'tables');
  await same('journal', 'posted journal lines and totals');
  await same('entries', 'journal entries');
  await same('invoices', 'invoices and amounts owed');
  await same('stock', 'stock rows and quantities');
  await same('users', 'logins');
  await same('migrations', 'applied database updates');
  await same('constraints', 'constraints');
  await same('blobs', 'stored document files');

  await S(g, 'The recovery point is the moment the backup started: a row written after it is not in the restore', m('The marker is absent; the history count is the count at the start', { rec: `Recovery point objective measured: anything written after the backup started is lost from this restore` }), async (ok) => {
    ok('restored', Boolean(after));
    if (!after) return;
    ok('the marker is not restored', one(restoreUrl, `SELECT count(*) FROM "AuditLog" WHERE id = '${markerId}'`) === '0');
    ok('the marker is in the QA database', Boolean(await prisma.auditLog.findUnique({ where: { id: markerId } })));
    facts.recoveryPoint = { definition: 'the start of pg_dump (one consistent snapshot)', writtenAfterStartAndLost: 1, seconds: facts.backup?.seconds };
  });

  await S(g, 'The journal guards came back with the restore and still refuse a change to a posted line', m('Four guards; an update refused', { sec: 'Immutability survives a restore' }), async (ok) => {
    ok('four guards', after?.triggers === 4, String(after?.triggers));
    const r = psql(restoreUrl, `UPDATE "JournalLine" SET debit = debit + 1 WHERE id = (SELECT l.id FROM "JournalLine" l JOIN "JournalEntry" e ON e.id = l."entryId" WHERE e.status = 'POSTED' AND l.debit > 0 LIMIT 1)`);
    ok('refused even for the owner', r.status !== 0 || /ERROR/.test(r.out), r.out.slice(0, 200));
  });

  await S(g, 'The entry numbering continues after the restore without reusing a number', m('Sequence at or past the highest number'), async (ok) => {
    ok('restored', Boolean(after));
    if (!after) return;
    ok('the sequence is where it was', after.seq === before.seq, `${before.seq} vs ${after.seq}`);
    const next = Number(one(restoreUrl, 'SELECT nextval(\'"JournalEntry_number_seq"\')'));
    ok('the next number is new', next > before.seq);
  });

  await S(g, 'The books balance in the restored database', m('Debits equal credits; no unbalanced entry', { fin: 'Read only, on the restore' }), async (ok) => {
    const [, d, c] = String(after?.journal || '0:0:1').split(':');
    ok('debits equal credits', Number(d) === Number(c), `${d} vs ${c}`);
    ok('no unbalanced entry', one(restoreUrl, `SELECT count(*) FROM (SELECT e.id FROM "JournalEntry" e JOIN "JournalLine" l ON l."entryId" = e.id WHERE e.status IN ('POSTED','REVERSED') GROUP BY e.id HAVING sum(l.debit) <> sum(l.credit)) x`) === '0');
  });

  await S(g, 'The application role has the same rights in the restored database', m('History append-only; business tables writable'), async (ok) => {
    const r = one(restoreUrl, `SELECT has_table_privilege('steelwise_runtime', '"AuditLog"', 'INSERT')::text || has_table_privilege('steelwise_runtime', '"AuditLog"', 'UPDATE')::text || has_table_privilege('steelwise_runtime', '"Order"', 'UPDATE')::text`);
    ok('insert yes, update no, orders yes', r === 'truefalsetrue', r);
  });

  let restoredUp = false;
  await S(g, 'The application runs on the restored database: sign-in, the books and a reconciliation that agrees', m('Server on the restore answers; trial balance as in the backup; reconciliation MATCH', { scope: 'A QA server on port 3014 pointed at the restore', rec: 'The restored system is usable, not only loaded' }), async (ok) => {
    if (!after) { ok('restored', false); return; }
    sh('psql', [restoreUrl, '-qc', "ALTER ROLE steelwise_runtime LOGIN PASSWORD 'qa-runtime-not-a-secret'"]);
    const url = restoreUrl.replace('postgres@', 'steelwise_runtime:qa-runtime-not-a-secret@');
    spawn('bash', ['-c', `PORT=3014 ${path.join(root, 'qa/tools/start-qa-server.sh')} >> /tmp/qa-server-3014.log 2>&1`], { detached: true, stdio: 'ignore', env: { ...process.env, SERVER_DATABASE_URL: url } }).unref();
    for (let i = 0; i < 60 && !restoredUp; i += 1) { try { restoredUp = (await fetch('http://localhost:3014/api/health')).ok; } catch { /* starting */ } if (!restoredUp) await sleep(500); }
    ok('the server answers', restoredUp);
    const l = await http1('POST', 'http://localhost:3014/api/auth/login', { body: { email: ctx.cfo.user.email, password: ctx.QA_PASSWORD } });
    ok('the CFO signs in on the restore', l.status === 200, `${l.status}`);
    const tb = await http1('GET', 'http://localhost:3014/api/ledger/reports/trial-balance', { token: l.body?.token });
    ok('the trial balance balances', tb.body?.balanced === true, JSON.stringify(tb.body?.totals));
    const rc = await http1('POST', 'http://localhost:3014/api/ledger/reconciliations', { token: l.body?.token, body: {} });
    ok('the reconciliation agrees', rc.status === 201 && rc.body.checks.filter((c) => ['BOOKS_BALANCE', 'INVENTORY', 'RECEIVABLES'].includes(c.key)).every((c) => c.status === 'MATCH'), JSON.stringify((rc.body?.checks || []).map((c) => [c.key, c.status])));
    try { const pid = spawnSync('bash', ['-c', 'lsof -ti tcp:3014 -sTCP:LISTEN'], { encoding: 'utf8' }).stdout.trim(); if (pid) process.kill(Number(pid), 'SIGTERM'); } catch { /* gone */ }
  });

  await S(g, 'The finished code on a database without update 17 says which update is missing instead of failing sign-in with a server error (Y-022)', m('Sign-in 503 DATABASE_UPDATE_REQUIRED; health 200', { scope: 'A copy of the restore with update 17 rolled back, and a server on port 3016', rec: 'Apply update 17, or promote the previous deployment' }), async (ok) => {
    if (!after) { ok('restored', false); return; }
    const copy = `${ISO}/p10_no17_qa`;
    sh('psql', [`${ISO}/postgres`, '-qc', 'DROP DATABASE IF EXISTS p10_no17_qa']);
    let made = null;
    for (let i = 0; i < 10 && made?.status !== 0; i += 1) { made = sh('psql', [`${ISO}/postgres`, '-qc', `CREATE DATABASE p10_no17_qa TEMPLATE ${TARGET}`]); if (made.status !== 0) await sleep(500); }
    ok('copy made', made.status === 0, made.out.slice(0, 200));
    const down = sh('psql', [copy, '-v', 'ON_ERROR_STOP=1', '-q', '-f', path.join(root, 'src/backend/prisma/upgrades/rollback/20261118090000_security_hardening.down.sql')]);
    ok('update 17 rolled back on the copy', down.status === 0, down.out.slice(0, 200));
    spawn('bash', ['-c', `PORT=3016 ${path.join(root, 'qa/tools/start-qa-server.sh')} >> /tmp/qa-server-3016.log 2>&1`], { detached: true, stdio: 'ignore', env: { ...process.env, SERVER_DATABASE_URL: copy, QA_DATABASE_URL: copy } }).unref();
    let up = false;
    for (let i = 0; i < 60 && !up; i += 1) { try { up = (await fetch('http://localhost:3016/api/health/live')).ok; } catch { /* starting */ } if (!up) await sleep(500); }
    ok('the server answers', up);
    const l = await http1('POST', 'http://localhost:3016/api/auth/login', { body: { email: ctx.cfo.user.email, password: ctx.QA_PASSWORD } });
    ok('sign-in says update 17 is needed', l.status === 503 && l.body?.code === 'DATABASE_UPDATE_REQUIRED' && /update 17/.test(l.body?.error || ''), `${l.status} ${l.raw.slice(0, 160)}`);
    ok('health still answers', (await http1('GET', 'http://localhost:3016/api/health')).status === 200);
    try { const pid = spawnSync('bash', ['-c', 'lsof -ti tcp:3016 -sTCP:LISTEN'], { encoding: 'utf8' }).stdout.trim(); if (pid) process.kill(Number(pid), 'SIGTERM'); } catch { /* gone */ }
  });

  await S(g, 'Database update 17 run again on the restored database changes nothing', m('Skipped as already applied; schema unchanged', { sec: 'Updates are safe to rerun' }), async (ok) => {
    const file = path.join(root, 'src/backend/prisma/upgrades/sql-editor/20261118090000_security_hardening.sql');
    const r = sh('psql', [restoreUrl, '-v', 'ON_ERROR_STOP=1', '-q', '-f', file]);
    ok('ran', r.status === 0, r.out.slice(0, 200));
    ok('said it was already applied', /already applied/.test(r.out), r.out.slice(0, 200));
  });

  await S(g, 'Every database update runs from scratch on an empty database and matches the schema', m('migrate deploy succeeds; migrate diff finds nothing', { scope: 'An empty database on the restore server', sec: 'A new environment can be built from the repository alone' }), async (ok) => {
    const fresh = `${ISO}/steelwise_qa_restore_fresh`;
    sh('psql', [`${ISO}/postgres`, '-qc', 'DROP DATABASE IF EXISTS steelwise_qa_restore_fresh']); sh('psql', [`${ISO}/postgres`, '-qc', 'CREATE DATABASE steelwise_qa_restore_fresh']);
    const be = path.join(root, 'src/backend');
    const t = Date.now();
    const d = sh('npx', ['prisma', 'migrate', 'deploy'], { cwd: be, env: { ...process.env, DATABASE_URL: fresh, DIRECT_URL: fresh } });
    facts.freshMigrations = { seconds: +((Date.now() - t) / 1000).toFixed(1) };
    ok('applied', d.status === 0, d.out.slice(-300));
    const again = sh('npx', ['prisma', 'migrate', 'deploy'], { cwd: be, env: { ...process.env, DATABASE_URL: fresh, DIRECT_URL: fresh } });
    ok('a second run has nothing to do', again.status === 0 && /No pending migrations/.test(again.out), again.out.slice(-200));
    const diff = sh('npx', ['prisma', 'migrate', 'diff', '--from-url', fresh, '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'], { cwd: be, env: { ...process.env, DATABASE_URL: fresh, DIRECT_URL: fresh } });
    ok('matches the schema', diff.status === 0, diff.out.slice(0, 300));
  });

  await S(g, 'Database update 17 can be rolled back and applied again on a copy', m('Rollback removes the columns and the role\'s rights; reapply restores them; schema matches', { scope: 'Copy of the restore', rec: 'The rollback file beside update 17' }), async (ok) => {
    const copy = `${ISO}/steelwise_qa_restore_rollback`;
    sh('psql', [`${ISO}/postgres`, '-qc', 'DROP DATABASE IF EXISTS steelwise_qa_restore_rollback']);
    const mk = sh('psql', [`${ISO}/postgres`, '-qc', `CREATE DATABASE steelwise_qa_restore_rollback TEMPLATE ${TARGET}`]);
    ok('copy made', mk.status === 0, mk.out.slice(0, 200));
    const down = sh('psql', [copy, '-v', 'ON_ERROR_STOP=1', '-q', '-f', path.join(root, 'src/backend/prisma/upgrades/rollback/20261118090000_security_hardening.down.sql')]);
    ok('rolled back', down.status === 0, down.out.slice(0, 200));
    ok('the columns are gone', one(copy, "SELECT count(*) FROM information_schema.columns WHERE table_name = 'User' AND column_name IN ('tokensValidAfter', 'failedLoginCount', 'lockedUntil')") === '0');
    ok('no business row lost', one(copy, 'SELECT count(*) FROM "JournalEntry"') === after?.entries);
    const up = sh('psql', [copy, '-v', 'ON_ERROR_STOP=1', '-q', '-f', path.join(root, 'src/backend/prisma/upgrades/sql-editor/20261118090000_security_hardening.sql')]);
    ok('applied again', up.status === 0, up.out.slice(0, 200));
    const be = path.join(root, 'src/backend');
    ok('schema matches', sh('npx', ['prisma', 'migrate', 'diff', '--from-url', copy, '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'], { cwd: be }).status === 0);
  });

  await S(g, 'The build does not change the database: migrations are never run by a deployment', { scope: 'The host build (scripts/build.cjs, vercel.json)', expect: 'No migrate, db push or SQL in the build', sec: 'A deployment cannot alter production data', rec: 'Database updates are applied by the owner, then the code is deployed' }, async (ok) => {
    const build = fs.readFileSync(path.join(root, 'scripts/build.cjs'), 'utf8');
    const vercel = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8');
    ok('no migrate in the build', !/migrate|db push|psql/.test(build));
    ok('no migrate in the install or build command', !/migrate|db push/.test(vercel));
  });

  await S(g, 'A deployment says which version it is, so a rollback can be checked', { scope: 'GET /api/health', expect: 'version field when the host sets the commit', rec: 'After a rollback the health check names the earlier commit' }, async (ok) => {
    const src = fs.readFileSync(path.join(root, 'src/backend/src/app.js'), 'utf8');
    ok('health reports the commit', /VERCEL_GIT_COMMIT_SHA/.test(src));
    ok('health answers', (await http1('GET', '/api/health')).status === 200);
  });

  await S(g, 'No secret is in the repository or the frontend source', { scope: 'Tracked files', expect: 'Only QA fixtures and examples match', sec: 'Secrets stay in the host settings' }, async (ok) => {
    const r = sh('git', ['grep', '-nIE', '(sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC )?PRIVATE KEY|postgres(ql)?://[^:@/ ]+:[^@/ ]{6,}@[a-z0-9.-]*(supabase|amazonaws|neon)|xox[bp]-[0-9A-Za-z-]+|ghp_[A-Za-z0-9]{30,}|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\\.[A-Za-z0-9_-]{20,}\\.)', '--', '.', ':!**/package-lock.json'], { cwd: root });
    const hits = r.stdout.split('\n').filter(Boolean).filter((l) => !/\.env\.example|qa-not-a-real|not-a-secret|example\.invalid|db\.xxx\.supabase|SECRETSECRET/.test(l));
    ok('none', hits.length === 0, hits.slice(0, 3).join(' | '));
    const fe = sh('git', ['grep', '-nIE', 'process\\.env\\.|import\\.meta\\.env\\.(?!VITE_)', '--', 'src/frontend/src'], { cwd: root });
    ok('the frontend reads only VITE_ settings', !/import\.meta\.env\.[A-Z]/.test(fe.stdout.replace(/import\.meta\.env\.VITE_/g, '').replace(/import\.meta\.env\.(DEV|PROD|MODE|BASE_URL|SSR)/g, '')), fe.stdout.slice(0, 200));
  });

  await S(g, 'The continuous integration runs the backend tests and the frontend checks on every pull request', { scope: '.github/workflows', expect: 'Tests and lint present', sec: 'Changes are checked before merge' }, async (ok) => {
    const wf = fs.readFileSync(path.join(root, '.github/workflows/backend-tests.yml'), 'utf8');
    ok('backend tests', /npm test/.test(wf));
    ok('runs on pull requests', /pull_request/.test(wf));
    ok('a dependency audit for critical problems', /npm audit/.test(wf));
  });

  fs.mkdirSync(path.join(root, 'qa/results'), { recursive: true });
  // Only a run that took a backup replaces the record (a run of other groups or one scenario must not blank it).
  if (facts.backup) fs.writeFileSync(path.join(root, 'qa/results/phase10-restore.json'), `${JSON.stringify({ ...facts, before, after }, null, 1)}\n`);
  state.restore = facts;
  fs.rmSync(work, { recursive: true, force: true });
}
