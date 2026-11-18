// Phase 10 baseline probe: reproduces suspected weaknesses before any correction. QA database only.
import { http1, A, prisma, tokenOf, QA_PASSWORD } from './phase4-lib.mjs';
import { bcrypt } from './lib.mjs';
import fs from 'node:fs';
const out = {};
// 1. A token issued before a password change
const email = `qa-p10-probe-${Date.now()}@qa.test`;
const admin = await prisma.user.findUnique({ where: { email: 'qa-admin@qa.test' } });
await prisma.user.create({ data: { email, passwordHash: await bcrypt().hash(QA_PASSWORD, 10), firstName: 'QA', lastName: 'Probe', role: 'CSR', organizationId: admin.organizationId } });
const t1 = (await http1('POST', '/api/auth/login', { body: { email, password: QA_PASSWORD } })).body.token;
const ch = await http1('PUT', '/api/auth/password', { token: t1, body: { currentPassword: QA_PASSWORD, newPassword: 'another-password-9' } });
out.passwordChange = { change: ch.status, oldTokenAfter: (await http1('GET', '/api/auth/me', { token: t1 })).status };
const u = await prisma.user.findUnique({ where: { email } });
const t2 = (await http1('POST', '/api/auth/login', { body: { email, password: 'another-password-9' } })).body.token;
const rs = await http1('POST', `/api/users/${u.id}/reset-password`, { token: await tokenOf('admin'), body: { newPassword: 'reset-password-77' } });
out.adminReset = { reset: rs.status, oldTokenAfter: (await http1('GET', '/api/auth/me', { token: t2 })).status };
// 2. Brute force one account from many addresses
const tries = [];
for (let i = 0; i < 30; i++) tries.push((await http1('POST', '/api/auth/login', { body: { email, password: `wrong-${i}` }, headers: { 'x-forwarded-for': `10.9.${i}.1` } })).status);
out.bruteForceManyAddresses = tries.join(',');
// 3. Login timing: unknown email vs known
const time = async (em) => { const s = performance.now(); await http1('POST', '/api/auth/login', { body: { email: em, password: 'nope-nope-1' }, headers: { 'x-forwarded-for': `10.8.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` } }); return performance.now() - s; };
const known = []; const unknown = [];
for (let i = 0; i < 8; i++) { known.push(await time(email)); unknown.push(await time(`nobody-${i}@qa.test`)); }
const med = (a) => a.sort((x, y) => x - y)[a.length >> 1];
out.loginTimingMs = { knownEmail: +med(known).toFixed(1), unknownEmail: +med(unknown).toFixed(1) };
// 4. Upload with a crafted entity type and an .html name
const form = new FormData();
form.append('entityType', '../../../qa-p10-escape');
form.append('file', new Blob(['<script>document.title="xss"</script>'], { type: 'text/plain' }), 'note.html');
const up = await fetch(`http://localhost:3011/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${await tokenOf('admin')}` }, body: form });
const ub = await up.json().catch(() => ({}));
const doc = ub.id ? await prisma.document.findUnique({ where: { id: ub.id } }) : null;
out.upload = { status: up.status, storedAt: doc?.storagePath, escapedUploads: doc ? !doc.storagePath.includes('/uploads/') : null };
if (doc?.storagePath && doc.storagePath.includes('/uploads/')) {
  const rel = doc.storagePath.split('/uploads/')[1];
  const r = await fetch(`http://localhost:3011/uploads/${rel}`);
  out.staticNoLogin = { status: r.status, type: r.headers.get('content-type') };
}
// 4b. same upload with an ordinary entity type, then the file by its address with no login
const f2 = new FormData(); f2.append('entityType', 'general');
f2.append('file', new Blob(['<script>document.title="xss"</script>'], { type: 'text/plain' }), 'note.html');
const up2r = await fetch(`http://localhost:3011/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${await tokenOf('admin')}` }, body: f2 });
const up2 = await up2r.json().catch(() => ({}));
const d2 = up2.id ? await prisma.document.findUnique({ where: { id: up2.id } }) : null;
if (d2 && d2.storagePath.includes('/uploads/')) {
  const rel2 = d2.storagePath.split('/uploads/')[1];
  const r2 = await fetch(`http://localhost:3011/uploads/${rel2}`);
  out.staticNoLogin = { upload: up2r.status, status: r2.status, type: r2.headers.get('content-type'), path: `/uploads/${rel2}` };
} else out.staticNoLogin = { upload: up2r.status, refused: up2.error };
// 4b2. a real text file, then its address with no login
const f4 = new FormData(); f4.append('file', new Blob(['plain words'], { type: 'text/plain' }), 'notes.html');
const up4 = await (await fetch(`http://localhost:3011/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${await tokenOf('admin')}` }, body: f4 })).json();
const d4 = up4.id ? await prisma.document.findUnique({ where: { id: up4.id } }) : null;
if (d4) { const rel4 = d4.storagePath.split('/uploads/')[1]; out.plainTextByAddress = { storedAs: rel4, status: (await fetch(`http://localhost:3011/uploads/${rel4}`)).status, downloadNeedsLogin: (await fetch(`http://localhost:3011/api/documents/${d4.id}/download`)).status }; }
// 4c. a "PDF" that is not one
const f3 = new FormData(); f3.append('file', new Blob(['MZ this is not a pdf'], { type: 'application/pdf' }), 'invoice.pdf');
out.fakePdf = (await fetch(`http://localhost:3011/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${await tokenOf('admin')}` }, body: f3 })).status;
// 5. JWT checks
out.jwtAlgorithmsPinned = /algorithms:/.test(fs.readFileSync('src/backend/src/middleware/auth.js', 'utf8'));
// 6. ledger role privileges: who does the app connect as
out.dbRole = await prisma.$queryRawUnsafe('select current_user, (select rolsuper from pg_roles where rolname = current_user) as superuser, (select tableowner from pg_tables where tablename = \'JournalLine\') as journal_owner');
console.log(JSON.stringify(out, (k, v) => (typeof v === 'bigint' ? Number(v) : v), 1));
await prisma.$disconnect();
