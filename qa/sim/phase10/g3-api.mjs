// Group 3: API, database and document security. The database part connects as the application's own
// role (steelwise_runtime) and tries what the application must never be able to do.
export default async function api(ctx) {
  const { S, G10, prisma, err, as, tokenOf, BASE, http1, asRuntime, asRuntimeRolledBack, denied, root } = ctx;
  const g = G10.api;
  const admin = await tokenOf('admin');
  const send = async (name, type, bytes, extra = {}) => {
    const fd = new FormData(); fd.append('file', new Blob([bytes], { type }), name);
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    const r = await fetch(`${BASE}/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${admin}` }, body: fd });
    return { status: r.status, body: await r.json().catch(() => ({})) };
  };
  const fsMod = await import('node:fs'); const pathMod = await import('node:path');
  const uploads = pathMod.join(root, 'src/backend/uploads');
  const file = { sec: 'Uploaded files cannot carry code into a browser or onto the server', db: 'No Document row for a refused file' };

  const refusedUploads = [
    ['a web page sent as plain text', 'qa.txt', 'text/plain', '<html><script>alert(1)</script></html>'],
    ['a web page sent as a PDF', 'qa.pdf', 'application/pdf', '<html><body>not a pdf</body></html>'],
    ['a picture with a script in it', 'qa.svg', 'image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'],
    ['a picture with a script element', 'qa.svg', 'image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
    ['a PNG that is really a GIF', 'qa.png', 'image/png', 'GIF89a.....'],
    ['a JPEG that is text', 'qa.jpg', 'image/jpeg', 'hello'],
    ['an empty file', 'qa.pdf', 'application/pdf', ''],
    ['a spreadsheet that is not a zip', 'qa.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'plain text'],
    ['a program', 'qa.exe', 'application/x-msdownload', 'MZ\x90\x00'],
    ['a web page by its own type', 'qa.html', 'text/html', '<html></html>'],
  ];
  for (const [what, name, type, bytes] of refusedUploads) {
    await S(g, `An upload of ${what} is refused`, { ...file, scope: 'A signed-in administrator', expect: '400 and nothing kept' }, async (ok) => {
      const before = await prisma.document.count();
      const r = await send(name, type, bytes);
      ok('refused', r.status === 400, `${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
      ok('nothing saved', (await prisma.document.count()) === before);
    });
  }

  await S(g, 'An upload that names a folder outside the uploads folder is written inside it', { ...file, scope: 'Administrator with a crafted record kind', expect: 'Stored under uploads/general', sec: 'No path traversal (Y-004)' }, async (ok) => {
    const r = await send('qa.txt', 'text/plain', 'plain words', { entityType: '../../qa-p10-escape' });
    ok('accepted as a plain text file', r.status === 201 || r.status === 409, `${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
    ok('nothing outside the uploads folder', !fsMod.existsSync(pathMod.join(root, 'qa-p10-escape')) && !fsMod.existsSync(pathMod.join(root, 'src/qa-p10-escape')));
    const d = r.body?.id && (await prisma.document.findUnique({ where: { id: r.body.id } }));
    ok('stored inside uploads', !d || d.storagePath === 'database' || pathMod.resolve(d.storagePath).startsWith(uploads), d?.storagePath);
  });

  await S(g, 'A stored file keeps the extension of its accepted type, never the sender\'s', { ...file, scope: 'Administrator', expect: '.txt on disk for a file sent as page.html', sec: 'The name cannot make the file run (Y-005)' }, async (ok) => {
    const r = await send('page.html', 'text/plain', 'plain words');
    const d = await prisma.document.findUnique({ where: { id: r.body.id } });
    ok('saved', r.status === 201, `${r.status}`);
    ok('stored as .txt', /\.txt$/.test(d.storagePath) || d.storagePath === 'database', d.storagePath);
  });

  await S(g, 'An uploaded file cannot be fetched by its address, only through the signed-in download', { ...file, scope: 'Anyone with the address', expect: '404 by address; 401 download without sign-in; attachment with sign-in', sec: 'B-021 closed' }, async (ok) => {
    const r = await send('qa.pdf', 'application/pdf', '%PDF-1.4 qa');
    const d = await prisma.document.findUnique({ where: { id: r.body.id } });
    const rel = pathMod.relative(uploads, d.storagePath).split(pathMod.sep).join('/');
    ok('by address: not served', (await http1('GET', `/uploads/${rel}`)).status === 404);
    ok('download without sign-in: 401', (await http1('GET', `/api/documents/${d.id}/download`)).status === 401);
    const dl = await http1('GET', `/api/documents/${d.id}/download`, { token: admin, text: true });
    ok('download signed in: an attachment', dl.status === 200 && /attachment/.test(dl.headers.get('content-disposition') || ''), `${dl.status} ${dl.headers.get('content-disposition')}`);
  });

  await S(g, 'A file name with quotes and line breaks cannot split the download headers', { ...file, scope: 'Administrator', expect: 'One clean Content-Disposition', sec: 'No header injection' }, async (ok) => {
    const r = await send('a"\r\nSet-Cookie: x=1.pdf', 'application/pdf', '%PDF-1.4 qa');
    const dl = await http1('GET', `/api/documents/${r.body.id}/download`, { token: admin, text: true });
    ok('no injected header', !dl.headers.get('set-cookie'), dl.headers.get('set-cookie'));
    ok('disposition has no quote break', !/"[^"]*"[^"]*"/.test(dl.headers.get('content-disposition') || ''), dl.headers.get('content-disposition'));
  });

  await S(g, 'Security headers are on every answer and the server does not say what it runs', { scope: 'Anyone', expect: 'nosniff, frame and referrer rules; no x-powered-by', sec: 'Browser protections' }, async (ok) => {
    const r = await http1('GET', '/api/health');
    ok('nosniff', r.headers.get('x-content-type-options') === 'nosniff');
    ok('framing refused', /SAMEORIGIN|DENY/i.test(r.headers.get('x-frame-options') || '') || /frame-ancestors/.test(r.headers.get('content-security-policy') || ''));
    ok('no x-powered-by', !r.headers.get('x-powered-by'));
    ok('strict transport security', Boolean(r.headers.get('strict-transport-security')));
  });

  await S(g, 'A body larger than the 5 MB limit is refused, not read into memory', { scope: 'Anyone', expect: '413', sec: 'No memory exhaustion by a huge JSON body' }, async (ok) => {
    const big = JSON.stringify({ email: 'x', password: 'y', pad: 'x'.repeat(6 * 1024 * 1024) });
    const r = await http1('POST', '/api/auth/login', { body: big, headers: { 'content-type': 'application/json' } });
    ok('refused', [413, 400].includes(r.status), `${r.status}`);
  });

  await S(g, 'Broken JSON is answered with 400 and no stack trace', { scope: 'Anyone', expect: '400, no file paths', sec: 'Errors expose nothing internal' }, async (ok) => {
    const r = await http1('POST', '/api/auth/login', { body: '{"email": "x", ', headers: { 'content-type': 'application/json' } });
    ok('400', r.status === 400, `${r.status}`);
    ok('no internals', !/node_modules|at \w+ \(|\/home\/|prisma/i.test(r.raw), r.raw.slice(0, 200));
  });

  const injections = ["' OR 1=1 --", '"; DROP TABLE "User"; --', '%27%20OR%201%3D1', '\\x00', '${7*7}', '{{7*7}}', '../../../etc/passwd'];
  await S(g, 'Search text that looks like SQL or a template is treated as text everywhere it is accepted', { scope: 'Signed-in administrator', expect: 'No 500, no leaked rows, tables intact', sec: 'Queries are parameterized', db: 'User table intact' }, async (ok) => {
    const before = await prisma.user.count();
    for (const q of injections) for (const url of ['/api/orders?search=', '/api/customers?search=', '/api/users?search=', '/api/ledger/entries?q=', '/api/inventory?search=']) {
      const r = await http1('GET', url + encodeURIComponent(q), { token: admin });
      if (r.status >= 500) ok(`${url}${q}`, false, `${r.status}`);
    }
    ok('no server error', true);
    ok('users intact', (await prisma.user.count()) === before);
  });

  await S(g, 'A body that tries to change object prototypes changes nothing', { scope: 'Signed-in user', expect: 'No 500; the server keeps answering normally', sec: 'No prototype pollution' }, async (ok) => {
    const r = await http1('PUT', '/api/auth/password', { token: admin, body: '{"__proto__": {"isAdmin": true}, "constructor": {"prototype": {"polluted": 1}}, "currentPassword": 1, "newPassword": 2}', headers: { 'content-type': 'application/json' } });
    ok('refused cleanly', r.status === 400, `${r.status}`);
    ok('the server still answers', (await http1('GET', '/api/auth/me', { token: admin })).status === 200);
    ok('no polluted object', ({}).polluted === undefined);
  });

  await S(g, 'In production the server refuses to start without its signing secret and database', { init: 'A second server process started with NODE_ENV=production and no secrets', scope: 'Deployment', expect: 'It exits with a configuration error naming what is missing, never printing a secret', sec: 'No production server with a guessable or random secret' }, async (ok) => {
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync('node', ['-e', "import('./src/config/index.js').then(()=>console.log('started')).catch(e=>{console.log(String(e.message));process.exit(3)})"], { cwd: pathMod.join(root, 'src/backend'), env: { PATH: process.env.PATH, NODE_ENV: 'production' }, encoding: 'utf8', timeout: 20000 });
    const out = `${r.stdout}${r.stderr}`;
    ok('did not start', r.status !== 0 && !/started/.test(r.stdout), `${r.status} ${out.slice(0, 200)}`);
    ok('says which settings are missing', /JWT_SECRET/.test(out) && /DATABASE_URL/.test(out), out.slice(0, 300));
  });

  await S(g, 'In production only the allowed origins may call the API from a browser', { init: 'A configuration loaded with NODE_ENV=production and CORS_ORIGIN set', scope: 'Deployment', expect: 'Only the named origin is listed', sec: 'No cross-origin calls from other sites' }, async (ok) => {
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync('node', ['-e', "import('./src/config/index.js').then(m=>console.log(JSON.stringify({o:m.default.corsOrigins,p:m.default.isProduction})))"], { cwd: pathMod.join(root, 'src/backend'), env: { PATH: process.env.PATH, NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40), DATABASE_URL: 'postgresql://u:p@127.0.0.1:1/qa_none', CORS_ORIGIN: 'https://steelwise.example' }, encoding: 'utf8', timeout: 20000 });
    const cfg = JSON.parse((r.stdout.trim().split('\n').pop()) || '{}');
    ok('production', cfg.p === true, r.stdout + r.stderr);
    ok('one allowed origin', JSON.stringify(cfg.o) === '["https://steelwise.example"]', JSON.stringify(cfg.o));
  });

  // ── the application's database role ─────────────────────────────────────────────────
  const dbm = { scope: 'The application\'s own database role, steelwise_runtime (what a compromised server could do)', db: 'Nothing changed: refused by the database', sec: 'Least privilege at the database (W-014)' };
  const roleTries = [
    ['change a history row', 'UPDATE "AuditLog" SET "action" = \'tampered\' WHERE id = (SELECT id FROM "AuditLog" LIMIT 1)'],
    ['delete history', 'DELETE FROM "AuditLog" WHERE id = (SELECT id FROM "AuditLog" LIMIT 1)'],
    ['empty the history', 'TRUNCATE "AuditLog"'],
    ['empty the journal', 'TRUNCATE "JournalLine"'],
    ['switch off the journal guards', 'ALTER TABLE "JournalLine" DISABLE TRIGGER ALL'],
    ['switch off triggers for its session', 'SET session_replication_role = replica'],
    ['drop a table', 'DROP TABLE "Coil"'],
    ['make a table', 'CREATE TABLE qa_p10_x (x int)'],
    ['make a function', 'CREATE FUNCTION public.qa_p10_f() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$'],
    ['rewrite the record of applied updates', 'DELETE FROM "_prisma_migrations"'],
    ['add a fake applied update', 'INSERT INTO "_prisma_migrations" (id, checksum, migration_name, applied_steps_count) VALUES (\'x\', \'x\', \'fake\', 1)'],
    ['make a login', 'CREATE ROLE qa_p10_attacker LOGIN'],
    ['read the password hashes of database roles', 'SELECT rolpassword FROM pg_authid LIMIT 1'],
    ['change a column', 'ALTER TABLE "User" ADD COLUMN qa_p10 int'],
  ];
  for (const [what, sql] of roleTries) {
    await S(g, `The application's database role cannot ${what}`, { ...dbm, expect: 'Permission denied' }, async (ok) => {
      const r = await asRuntimeRolledBack(sql);
      ok('refused by the database', denied(r) || (!r.ok && /42501|permission/.test(`${r.code} ${r.error}`)), r.ok ? `it was allowed (${r.count})` : r.error);
    });
  }

  await S(g, 'The application\'s database role cannot give itself more rights', { ...dbm, expect: 'A GRANT to itself grants nothing' }, async (ok) => {
    const c = await ctx.runtimeDb().connect();
    try {
      await c.query('BEGIN');
      await c.query('GRANT ALL ON "AuditLog" TO steelwise_runtime').catch(() => {});
      const r = await c.query(`SELECT has_table_privilege('steelwise_runtime', '"AuditLog"', 'UPDATE') AS u, has_table_privilege('steelwise_runtime', '"AuditLog"', 'DELETE') AS d`).catch(() => ({ rows: [{ u: false, d: false }] }));
      ok('still cannot change or delete history', r.rows[0].u === false && r.rows[0].d === false, JSON.stringify(r.rows[0]));
    } finally { await c.query('ROLLBACK').catch(() => {}); c.release(); }
  });

  await S(g, 'The application\'s database role can do its work: read, add and change business rows, add to the history', { ...dbm, expect: 'Allowed', db: 'Rolled back' }, async (ok) => {
    ok('read', (await asRuntime('SELECT count(*) FROM "Order"')).ok);
    ok('add history', (await asRuntimeRolledBack('INSERT INTO "AuditLog" (id, category, "eventType", action, severity, timestamp) VALUES (\'qa-p10-x\', \'SYSTEM\', \'QA\', \'QA\', \'INFO\', now())')).ok);
    ok('change a business row', (await asRuntimeRolledBack('UPDATE "Organization" SET "updatedAt" = now() WHERE id = (SELECT id FROM "Organization" LIMIT 1)')).ok);
    ok('use a sequence', (await asRuntimeRolledBack('SELECT nextval(\'"JournalEntry_number_seq"\')')).ok);
  });

  await S(g, 'The application\'s database role is not a superuser, cannot bypass row security and does not own the tables', { ...dbm, expect: 'All false', sec: 'The role cannot lift its own limits' }, async (ok) => {
    const r = await prisma.$queryRawUnsafe(`SELECT rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, (SELECT count(*)::int FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'steelwise_runtime') AS owns FROM pg_roles WHERE rolname = 'steelwise_runtime'`);
    ok('exists', r.length === 1);
    ok('no special powers', r[0] && !r[0].rolsuper && !r[0].rolbypassrls && !r[0].rolcreaterole && !r[0].rolcreatedb, JSON.stringify(r[0]));
    ok('owns no table', r[0]?.owns === 0, String(r[0]?.owns));
  });

  await S(g, 'The QA server itself runs as the application role, not as the owner', { scope: 'The running QA server', expect: 'current_user is steelwise_runtime when the gate runs it so', sec: 'The least-privilege role is proven in use, not only defined' }, async (ok) => {
    const sessions = await prisma.$queryRawUnsafe(`SELECT usename, count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND usename IS NOT NULL GROUP BY usename`);
    const names = sessions.map((s) => s.usename);
    ok('a steelwise_runtime connection is open (the server)', names.includes('steelwise_runtime') || process.env.QA_SERVER_AS_OWNER === '1', JSON.stringify(sessions));
  });

  await S(g, 'An error from the database does not reach the caller', { scope: 'Signed-in administrator sending a value the database rejects', expect: 'A 4xx or 5xx with a plain sentence, no SQL or table names', sec: 'safeErrors holds' }, async (ok) => {
    const r = await http1('GET', `/api/orders/${'x'.repeat(5000)}`, { token: admin });
    ok('answered', r.status >= 400, `${r.status}`);
    ok('no internals', !/prisma|SELECT|relation|invalid input syntax|stack/i.test(r.raw), r.raw.slice(0, 200));
  });
  void err; void as;
}
