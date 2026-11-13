#!/usr/bin/env node
// Forensic discovery of the application from its code. Reads the server wiring, every route file,
// the database schema, the migrations, the frontend route table and every frontend source file,
// and writes the facts to qa/enterprise-excellence/.discovery.json for the document generators.
// Nothing here is a judgement: it counts and lists what the code contains.
//   node qa/tools/discover.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BE = path.join(root, 'src/backend');
const FE = path.join(root, 'src/frontend/src');
const OUT = path.join(root, 'qa/enterprise-excellence');
fs.mkdirSync(OUT, { recursive: true });
const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
const rel = (f) => path.relative(root, f);
const walk = (dir, keep = () => true, out = []) => {
  for (const e of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, keep, out); else if (keep(p)) out.push(p);
  }
  return out;
};
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

// ── Schema ──────────────────────────────────────────────────────────────────────────────────
const schema = read(path.join(BE, 'prisma/schema.prisma'));
const enums = Object.fromEntries([...schema.matchAll(/^enum (\w+) \{([\s\S]*?)^\}/gm)].map((m) => [m[1], m[2].split('\n').map((s) => s.replace(/\/\/.*$/, '').trim()).filter(Boolean)]));
const modelNames = [...schema.matchAll(/^model (\w+) \{/gm)].map((m) => m[1]);
const models = [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map((m) => {
  const body = m[2]; const rows = body.split('\n').map((l) => l.replace(/\/\/.*$/, '').trimEnd()).filter((l) => /^\s+\w+\s+\S/.test(l));
  const fields = rows.filter((l) => !/^\s+@@/.test(l)).map((l) => { const [, name, type, rest = ''] = /^\s+(\w+)\s+(\S+)\s*(.*)$/.exec(l); return { name, type, rest }; });
  const base = (t) => t.replace(/[?\[\]]/g, '');
  const scalar = fields.filter((f) => !modelNames.includes(base(f.type)));
  const relations = fields.filter((f) => modelNames.includes(base(f.type)));
  const fk = relations.filter((f) => /fields:\s*\[/.test(f.rest)).map((f) => ({ field: /fields:\s*\[([^\]]+)\]/.exec(f.rest)[1].trim(), to: base(f.type), onDelete: /onDelete:\s*(\w+)/.exec(f.rest)?.[1] || 'default', optional: f.type.endsWith('?') }));
  const table = /@@map\("([^"]+)"\)/.exec(body)?.[1] || m[1];
  return {
    name: m[1], table, fields: scalar.length, fk,
    unique: [...body.matchAll(/@@unique\(\[([^\]]+)\]/g)].map((u) => u[1].replace(/\s/g, '')).concat(scalar.filter((f) => /@unique/.test(f.rest)).map((f) => f.name)),
    indexes: [...body.matchAll(/@@index\(\[([^\]]+)\]/g)].map((u) => u[1].replace(/\s/g, '')),
    status: fields.find((f) => f.name === 'status' && enums[base(f.type)])?.type.replace('?', '') || null,
    scope: { organization: scalar.some((f) => /^(organizationId|tenantId|ownerId)$/.test(f.name)), location: scalar.some((f) => /^(locationId|homeLocationId|branchId|fromLocationId|toLocationId)$/.test(f.name)), division: scalar.some((f) => /^division(Id)?$/.test(f.name)), customer: scalar.some((f) => /^(customerId|buyerId)$/.test(f.name)) },
    money: scalar.filter((f) => /Decimal/.test(f.type) && /(price|cost|amount|total|tax|balance|paid|credit|subtotal|freight)/i.test(f.name)).map((f) => f.name),
    quantity: scalar.filter((f) => /(qty|quantity|weight|onHand|allocated|available)/i.test(f.name)).map((f) => `${f.name}:${f.type}`),
    floats: scalar.filter((f) => /^Float/.test(f.type)).map((f) => f.name),
    audit: { createdAt: scalar.some((f) => f.name === 'createdAt'), updatedAt: scalar.some((f) => f.name === 'updatedAt'), createdBy: scalar.some((f) => /^(createdById|createdBy|userId)$/.test(f.name)) },
  };
});
const prismaName = (n) => n[0].toLowerCase() + n.slice(1);
const byPrisma = new Map(models.map((m) => [prismaName(m.name), m.name]));

// ── Migrations ──────────────────────────────────────────────────────────────────────────────
const migDir = path.join(BE, 'prisma/migrations');
const migrations = fs.readdirSync(migDir).filter((d) => fs.existsSync(path.join(migDir, d, 'migration.sql'))).sort().map((d) => {
  const sql = read(path.join(migDir, d, 'migration.sql'));
  return { name: d, lines: sql.split('\n').length, creates: (sql.match(/CREATE TABLE/g) || []).length, drops: (sql.match(/DROP (TABLE|COLUMN)|DROP CONSTRAINT/g) || []).length, alters: (sql.match(/ALTER TABLE/g) || []).length, checks: (sql.match(/\bCHECK\s*\(/g) || []).length, indexes: (sql.match(/CREATE (UNIQUE )?INDEX/g) || []).length };
});
const sqlEditor = walk(path.join(BE, 'prisma/upgrades')).map(rel);
const allSql = migrations.map((m) => read(path.join(migDir, m.name, 'migration.sql'))).join('\n');
const dbChecks = [...allSql.matchAll(/ADD CONSTRAINT "?(\w+)"? CHECK\s*\(([^;]+)\)/g)].map((m) => ({ name: m[1], rule: m[2].replace(/\s+/g, ' ').slice(0, 140) }));
const dbViews = [...allSql.matchAll(/CREATE (?:OR REPLACE )?(?:MATERIALIZED )?VIEW "?(\w+)"?/g)].map((m) => m[1]);
const dbTriggers = [...allSql.matchAll(/CREATE (?:OR REPLACE )?TRIGGER "?(\w+)"?/g)].map((m) => m[1]);

// ── Server wiring and route files ───────────────────────────────────────────────────────────
const app = read(path.join(BE, 'src/app.js'));
const imports = {};
for (const m of app.matchAll(/import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]+)\})?\s+from\s+'(\.\/routes\/[^']+)'/g)) {
  const file = path.join(BE, 'src', m[3]);
  if (m[1]) imports[m[1]] = { file, exported: 'default' };
  for (const n of (m[2] || '').split(',').map((s) => s.trim()).filter(Boolean)) { const [orig, alias] = n.split(/\s+as\s+/); imports[alias || orig] = { file, exported: orig }; }
}
const mounts = [...app.matchAll(/app\.use\('(\/api[^']*)',\s*(?:[\w.]+\s*,\s*)*(\w+)\)/g)].map((m) => ({ prefix: m[1], name: m[2], file: imports[m[2]]?.file, exported: imports[m[2]]?.exported })).filter((m) => m.file);

const routeFiles = walk(path.join(BE, 'src/routes'), (p) => p.endsWith('.js'));
const WRITE = /\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(|\$executeRaw/;
const files = {};
for (const file of routeFiles) {
  const raw = read(file); const text = strip(raw);
  // router variables declared in this file
  const routers = [...text.matchAll(/(?:const|export const) (\w+) = (?:express\.)?Router\(/g)].map((m) => m[1]);
  const decl = [...text.matchAll(/\b(\w+)\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]*)\3\s*,([^\n]*)/g)].filter((m) => routers.includes(m[1]));
  const eps = decl.map((m, i) => {
    const body = text.slice(m.index, decl[i + 1]?.index ?? text.length);
    const used = [...new Set([...body.matchAll(/\b(?:prisma|tx|db|client|trx)\.(\w+)\.(\w+)\(/g)].filter((x) => byPrisma.has(x[1])).map((x) => byPrisma.get(x[1])))];
    const writes = [...body.matchAll(/\b(?:prisma|tx|db|client|trx)\.(\w+)\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(/g)].length;
    const lists = [...body.matchAll(/\.findMany\(\s*\{?([\s\S]{0,900}?)\n\s*\}\)/g)];
    return {
      router: m[1], method: m[2].toUpperCase(), path: m[4], line: lineOf(text, m.index), lines: body.split('\n').length,
      guards: [...m[5].matchAll(/\b(requireRole\([^)]*\)|authenticate|requireLinkedCustomer|\w*[Aa]uth\w*|upload\.\w+\([^)]*\))/g)].map((g) => g[1].replace(/\s+/g, '')),
      models: used, writes, transaction: /\$transaction\(|retryOverlap\(|createNumbered\(/.test(body),
      findMany: (body.match(/\.findMany\(/g) || []).length, bounded: (body.match(/\btake\s*[:,]/g) || []).length,
      listsNoTake: lists.filter((l) => !/\btake\b/.test(l[0])).length,
      validates: /status\(400\)/.test(body), tryCatch: /\btry\s*\{/.test(body), raw: /\$queryRaw|\$executeRaw/.test(body),
      usesUser: /req\.user/.test(body), scopesOrg: /req\.user\??\.organizationId/.test(body), scopesLocation: /req\.user\??\.(homeLocationId|locationId)|userLocations/.test(body), scopesCustomer: /scopedCustomerId|req\.user\??\.customerId|accountScope|customerIdsFor/.test(body),
      audit: /auditLog\.create|recordJobMove|recordMoney|recordShipmentEvent|moveJob\(|recordJobAssignment|logAudit|recordPriceChange|auditEvent/.test(body),
      inMemory: false,
    };
  });
  const stores = [...text.matchAll(/^(?:const|let) (\w+) = (?:new Map\(\)|\[\]|\{\})\s*;?\s*$/gm)].map((m) => m[1]);
  files[rel(file)] = {
    lines: raw.split('\n').length, routers, endpoints: eps,
    imports: [...text.matchAll(/from '(\.\.?\/[^']+)'/g)].map((m) => rel(path.resolve(path.dirname(file), m[1]))),
    moduleLevelState: stores, usesPrisma: /\bprisma\./.test(text), todo: (raw.match(/\b(TODO|FIXME|HACK|XXX)\b/g) || []).length,
    mock: (raw.match(/\bmock\w*|\bsimulat\w+|placeholder|hardcoded|in-memory|not implemented/gi) || []).length,
  };
}
// Which file and router each mount serves
const endpoints = [];
for (const mt of mounts) {
  const f = files[rel(mt.file)]; if (!f) continue;
  const raw = strip(read(mt.file));
  let router = mt.exported === 'default' ? /export default (\w+)/.exec(raw)?.[1] : mt.exported;
  if (!f.routers.includes(router)) router = f.routers[0];
  for (const e of f.endpoints.filter((x) => x.router === router)) {
    const full = (mt.prefix + (e.path === '/' ? '' : e.path)).replace(/\/+$/, '') || '/';
    endpoints.push({ ...e, full, key: `${e.method} ${full}`, file: rel(mt.file), mount: mt.prefix });
  }
}
const mountedFiles = new Set(mounts.map((m) => rel(m.file)));
const unmountedRouteFiles = Object.keys(files).filter((f) => !mountedFiles.has(f) && files[f].endpoints.length > 0);
const strayBackend = walk(BE, (p) => p.endsWith('.js') && !p.includes(`${path.sep}src${path.sep}`) && !p.includes(`${path.sep}test${path.sep}`) && !p.includes(`${path.sep}prisma${path.sep}`) && !p.includes(`${path.sep}scripts${path.sep}`)).map(rel);

// Server files nothing imports (walk from server.js, app.js, the seed and the tests)
const beFiles = walk(path.join(BE, 'src'), (p) => p.endsWith('.js'));
const reach = new Set();
const visit = (f) => {
  if (!f || reach.has(f)) return; const t = read(f); if (t == null) return; reach.add(f);
  for (const m of t.matchAll(/(?:from|import\()\s*['"](\.\.?\/[^'"]+)['"]/g)) { const b = path.resolve(path.dirname(f), m[1]); visit([b, `${b}.js`, path.join(b, 'index.js')].find((c) => fs.existsSync(c) && fs.statSync(c).isFile())); }
};
[path.join(BE, 'src/server.js'), path.join(BE, 'src/app.js'), path.join(root, 'api/index.js')].forEach(visit);
const deadBackend = beFiles.filter((f) => !reach.has(f) && !f.includes('/seeds/')).map(rel);

// Background work, schedules, queues, outbound calls
const beAll = beFiles.map((f) => ({ f: rel(f), t: strip(read(f)) }));
const grepBE = (re) => beAll.filter((x) => re.test(x.t)).map((x) => x.f);
const background = { setInterval: grepBE(/\bsetInterval\(/), cron: grepBE(/\bcron\b|node-cron|schedule\(/i), queues: grepBE(/\bbull\b|bullmq|amqp|kafka|sqs/i), eventEmitter: grepBE(/EventEmitter|\.emit\(/), outboundFetch: grepBE(/\bfetch\(|axios\.|new OpenAI|new Anthropic|ElevenLabs|createClient\(/), email: grepBE(/nodemailer|sendgrid|resend\b|mailgun|smtp/i), envVars: [...new Set(beAll.flatMap((x) => [...x.t.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((m) => m[1])))].sort() };

// Which models are used where
const modelUse = Object.fromEntries(models.map((m) => [m.name, { read: [], write: [] }]));
for (const { f, t } of beAll) {
  for (const m of new Set([...t.matchAll(/\.(\w+)\.(find\w+|create\w*|update\w*|upsert|delete\w*|count|aggregate|groupBy)\(/g)].filter((x) => byPrisma.has(x[1])).map((x) => `${byPrisma.get(x[1])}|${/^(create|update|upsert|delete)/.test(x[2]) ? 'write' : 'read'}`))) {
    const [name, kind] = m.split('|'); modelUse[name][kind].push(f);
  }
  // A store that names its table in a string: collection('stopWorkEvent', ...)
  for (const m of t.matchAll(/['"](\w+)['"]/g)) if (byPrisma.has(m[1]) && /\[model\]|\[name\]|\[table\]/.test(t)) { const n = byPrisma.get(m[1]); if (!modelUse[n].read.includes(f)) { modelUse[n].read.push(f); modelUse[n].write.push(f); } }
  // Rows written inside another record's create (lines: { create: [...] }) — the relation field name is all the code shows.
}
const relationFieldOf = Object.fromEntries(models.map((m) => [m.name, []]));
for (const m of [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)]) for (const l of m[2].split('\n')) { const x = /^\s+(\w+)\s+(\w+)\[\]/.exec(l); if (x && relationFieldOf[x[2]]) relationFieldOf[x[2]].push(x[1]); }
for (const [name, fieldsOf] of Object.entries(relationFieldOf)) {
  if (modelUse[name].read.length || modelUse[name].write.length) continue;
  const re = new RegExp(`\\b(${[...new Set(fieldsOf)].join('|')})\\s*:\\s*\\{\\s*(create|createMany|deleteMany|update|upsert|include|select|orderBy|where)\\b|include:\\s*\\{[^}]*\\b(${[...new Set(fieldsOf)].join('|')})\\b`);
  if (!fieldsOf.length) continue;
  for (const { f, t } of beAll) if (re.test(t)) modelUse[name].nested = (modelUse[name].nested || []).concat(f);
}
const rawSqlTables = [...new Set(beAll.flatMap((x) => [...x.t.matchAll(/(?:FROM|JOIN|INTO|UPDATE)\s+"?([A-Za-z_]\w+)"?/g)].map((m) => m[1])))];

// ── Frontend ────────────────────────────────────────────────────────────────────────────────
const feFiles = walk(FE, (p) => /\.(jsx?|cjs|mjs)$/.test(p));
const feReach = new Set();
const feResolve = (from, spec) => { const b = spec.startsWith('@/') ? path.join(FE, spec.slice(2)) : path.resolve(path.dirname(from), spec); return [b, `${b}.jsx`, `${b}.js`, path.join(b, 'index.jsx'), path.join(b, 'index.js')].find((c) => fs.existsSync(c) && fs.statSync(c).isFile()); };
const feVisit = (f) => { if (!f || feReach.has(f)) return; const t = read(f); if (t == null) return; feReach.add(f); for (const m of strip(t).matchAll(/(?:from|import\()\s*['"]((?:\.\.?|@)\/[^'"]+)['"]/g)) feVisit(feResolve(f, m[1])); };
[path.join(FE, 'main.jsx'), path.join(FE, 'index.jsx'), path.join(FE, 'App.jsx')].forEach(feVisit);
const feStat = feFiles.map((f) => { const t = read(f); const c = strip(t); return {
  file: path.relative(FE, f), lines: t.split('\n').length, reachable: feReach.has(f),
  useState: (c.match(/\buseState\(/g) || []).length, useEffect: (c.match(/\buseEffect\(/g) || []).length,
  ts: /\.tsx?$/.test(f), dialogs: (c.match(/<Dialog\b/g) || []).length, tables: (c.match(/<(Table|DataGrid)\b/g) || []).length, forms: (c.match(/<(TextField|Select|Autocomplete)\b/g) || []).length,
  ariaLabels: (c.match(/aria-label=/g) || []).length, iconButtons: (c.match(/<IconButton\b/g) || []).length,
  consoleLog: (c.match(/console\.log\(/g) || []).length, todo: (t.match(/\b(TODO|FIXME|HACK)\b/g) || []).length,
  alerts: (c.match(/\b(window\.)?(alert|confirm)\(/g) || []).length, timers: (c.match(/\bset(Interval|Timeout)\(/g) || []).length, clears: (c.match(/\bclear(Interval|Timeout)\(/g) || []).length,
}; });
const menuText = read(path.join(FE, 'components/layout/Sidebar.jsx')) || '';
const menu = [...menuText.matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
const feRoleAccess = read(path.join(FE, 'config/roleAccess.js')) || '';
const pkg = (p) => JSON.parse(read(p));
const depUse = (dir, deps, sources) => Object.keys(deps || {}).filter((d) => !sources.some((s) => new RegExp(`['"]${d.replace(/[/.]/g, '\\$&')}(/[^'"]*)?['"]`).test(s)));
const feSrcAll = feFiles.map(read).concat([read(path.join(root, 'src/frontend/vite.config.js')) || '', read(path.join(root, 'src/frontend/eslint.config.js')) || '', read(path.join(root, 'src/frontend/index.html')) || '']);
const beSrcAll = walk(BE, (p) => p.endsWith('.js') || p.endsWith('.mjs')).map(read).concat([read(path.join(root, 'api/index.js')) || '']);
const fePkg = pkg(path.join(root, 'src/frontend/package.json')); const bePkg = pkg(path.join(BE, 'package.json'));

// Tests
const unitFiles = walk(path.join(BE, 'test'), (p) => p.endsWith('.test.js')).map((f) => ({ file: rel(f), tests: (read(f).match(/^test\(/gm) || []).length, importsDb: /lib\/db\.js|@prisma\/client/.test(read(f)), mocks: (read(f).match(/\bmock\b/gi) || []).length }));
const simFiles = walk(path.join(root, 'qa/sim')).map((f) => ({ file: rel(f), lines: read(f).split('\n').length, checks: (read(f).match(/\bcheck\(/g) || []).length }));
const feTests = feFiles.filter((f) => /\.(test|spec)\.jsx?$/.test(f)).map((f) => path.relative(FE, f));

// What the automated runs actually called (written by qa/tools/exercised.mjs from server logs)
const exercisedFile = path.join(root, 'qa/results/exercised-endpoints.json');
const exercised = fs.existsSync(exercisedFile) ? JSON.parse(read(exercisedFile)) : null;
const matchKey = (method, p) => endpoints.filter((e) => e.method === method).find((e) => new RegExp(`^${e.full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[A-Za-z_]+/g, '[^/]+')}$`).test(p))?.key;
if (exercised) {
  const hit = {};
  for (const r of exercised.requests) { const k = matchKey(r.method, r.path); if (k) { hit[k] ||= { ok: 0, refused: 0, error: 0 }; hit[k][r.status >= 500 ? 'error' : r.status >= 400 ? 'refused' : 'ok'] += r.count; } }
  for (const e of endpoints) e.exercised = hit[e.key] || null;
}

const contract = JSON.parse(read(path.join(root, 'qa/.api-contract.json')) || 'null');
const screens = JSON.parse(read(path.join(root, 'qa/.screen-audit.json')) || 'null');

const out = {
  generated: new Date().toISOString(), commit: (read(path.join(root, '.git/HEAD')) || '').trim(),
  schema: { models, enums, migrations, sqlEditor, dbChecks, dbViews, dbTriggers, rawSqlTables },
  backend: { mounts: mounts.map((m) => ({ prefix: m.prefix, file: rel(m.file), router: m.exported })), files, endpoints, unmountedRouteFiles, strayBackend, deadBackend, background, modelUse },
  frontend: { files: feStat, menu, roleAccessLines: feRoleAccess.split('\n').length, tests: feTests, unusedDeps: depUse(FE, fePkg.dependencies, feSrcAll), deps: Object.keys(fePkg.dependencies || {}).length, devDeps: Object.keys(fePkg.devDependencies || {}).length },
  backendDeps: { deps: Object.keys(bePkg.dependencies || {}).length, unused: depUse(BE, bePkg.dependencies, beSrcAll) },
  tests: { unitFiles, simFiles, feTests }, contract, screens, exercised: exercised ? { at: exercised.at, sources: exercised.sources, distinct: exercised.requests.length } : null,
};
fs.writeFileSync(path.join(OUT, '.discovery.json'), JSON.stringify(out, null, 1));
const n = (a) => a.length;
console.log(JSON.stringify({ models: n(models), enums: n(Object.keys(enums)), migrations: n(migrations), mounts: n(mounts), routeFiles: n(routeFiles), endpoints: n(endpoints), declaredEndpoints: Object.values(files).reduce((s, f) => s + f.endpoints.length, 0), unmountedRouteFiles, deadBackend: n(deadBackend), frontendFiles: n(feFiles), unreachableFrontend: feStat.filter((f) => !f.reachable).length, unusedFrontendDeps: out.frontend.unusedDeps, unusedBackendDeps: out.backendDeps.unused, exercised: endpoints.filter((e) => e.exercised).length }, null, 1));
