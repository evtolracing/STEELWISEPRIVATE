#!/usr/bin/env node
// Reads the route table and the menu and says, for every screen: is it on the menu, does it call
// the server, does it carry made-up data, and does it say so. Writes qa/screen-audit.md and
// qa/.screen-audit.json. Exits 1 when a screen that shows made-up data and never calls the server
// is reachable without the "sample screen" notice (pass --allow N to tolerate N known ones).
//   node qa/tools/screen-audit.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(root, 'src/frontend/src');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const ALLOW = Number(arg('allow', 0));

const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
/** Source with comments removed, so a call left in a comment does not count as a call. */
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"`])\/\/ .*$/gm, '$1');
const resolveFile = (from, spec) => {
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, `${base}.jsx`, `${base}.js`, path.join(base, 'index.jsx'), path.join(base, 'index.js')]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
};

const routerFile = path.join(SRC, 'router/AppRouter.jsx');
const router = read(routerFile);
const lazy = new Map();
for (const m of router.matchAll(/const (\w+) = lazy\(\(\) => import\('([^']+)'\)(?:\.then\([^)]*\))?\)/g)) lazy.set(m[1], m[2]);
for (const m of router.matchAll(/^import (\w+) from '(\.[^']+)'/gm)) lazy.set(m[1], m[2]);
for (const m of router.matchAll(/^import \{([^}]+)\} from '(\.[^']+)'/gm)) for (const n of m[1].split(',')) lazy.set(n.trim().split(' as ').pop(), m[2]);

const menu = new Set([...read(path.join(SRC, 'components/layout/Sidebar.jsx')).matchAll(/path: '([^']+)'/g)].map((m) => m[1].replace(/^\//, '')));

const SKIP = new Set(['Suspense', 'PageLoader', 'Navigate', 'SampleScreen', 'RouteErrorPage', 'ProtectedRoute', 'Outlet', 'AppLayout', 'OldShipmentAddress']);
const MOCK = /generateMock|\bmock[A-Z]\w*\s*=|\bMOCK_[A-Z]|\bsample[A-Z]\w*\s*=\s*\[|Math\.random\(\)(?!\.toString)|from '[^']*\/mocks?\/|\bDEMO_[A-Z]+\s*=|\bdemo[A-Z]\w*\s*=\s*\[/;
// A comment that says the data is made up is evidence too.
const MOCK_NOTE = /\/\/\s*Mock\b|\/\/.*\bmock data\b|Using mock data/i;
const MOCK_FIRST = /USE_MOCK\s*=\s*(true|window\.__USE_MOCK_RULES__\s*!==\s*false)/;
const SERVER = /\bclient\.(get|post|put|patch|delete)\(|\bapi\.(get|post|put|patch|delete)\(|\bfetch\(|from '[^']*\/(api|services)(\/[^']*)?'|useQuery\(|useMutation\(/;

/** The screen file and the local files it imports, two levels down. */
function family(file) {
  const seen = new Set(); const out = [];
  const walk = (f, depth) => {
    if (!f || seen.has(f) || depth > 2) return;
    seen.add(f);
    const text = read(f); if (text == null) return;
    out.push({ file: f, text: code(text), raw: text });
    for (const m of text.matchAll(/from '(\.{1,2}\/[^']+)'/g)) {
      if (/\/(api|services|store|stores|hooks|utils|constants|config|contexts?|theme)\b/.test(m[1])) {
        // A service is not a screen, but one that answers from built-in sample rules, or falls back
        // to sample data, makes the screen that uses it a mixed one.
        const svc = resolveFile(f, m[1]); const st = svc && !seen.has(svc) ? read(svc) : null;
        if (st && (MOCK_FIRST.test(st) || /return\s+(await\s+)?(getMock|generateMock)\w*\(/.test(code(st)) || /Using mock data|\/\/ Use mock data/.test(st))) { seen.add(svc); out.push({ file: svc, text: code(st), raw: st }); }
        continue;
      }
      walk(resolveFile(f, m[1]), depth + 1);
    }
    // an index file that only re-exports
    for (const m of text.matchAll(/export \{ default(?: as \w+)? \} from '(\.[^']+)'/g)) walk(resolveFile(f, m[1]), depth);
  };
  walk(file, 0);
  return out;
}

/** Screens declared with <Route path="..." element={<X />} /> inside an app file. */
function innerScreens(file) {
  let f = file; let text = read(f) || '';
  const re = text.match(/export \{ default(?: as \w+)? \} from '(\.[^']+)'/);
  if (re) { f = resolveFile(f, re[1]); text = read(f) || ''; }
  const imports = new Map();
  for (const m of text.matchAll(/import (\w+) from '(\.[^']+)'/g)) imports.set(m[1], m[2]);
  for (const m of text.matchAll(/const (\w+) = (?:React\.)?lazy\(\(\) => import\('([^']+)'\)/g)) imports.set(m[1], m[2]);
  const out = [];
  for (const m of text.matchAll(/<Route\s+(index|path="([^"]*)")\s+element=\{<(\w+)/g)) {
    const spec = imports.get(m[3]);
    const target = spec ? resolveFile(f, spec) : null;
    if (target && m[2] !== '*') out.push({ path: m[2] || '', name: m[3], file: target });
  }
  return out;
}

const rows = [];
const blocks = router.split(/\n\s*\{\s*\n?\s*path: '/).slice(1);
for (const b of blocks) {
  const route = b.slice(0, b.indexOf("'")).replace(/^\//, '');
  const body = b.slice(0, (b.indexOf('errorElement') + 1 || b.length + 1) - 1);
  if (/<Navigate /.test(body) && !/<Suspense/.test(body)) { rows.push({ route, kind: 'redirect' }); continue; }
  const names = [...body.matchAll(/<([A-Z]\w+)/g)].map((m) => m[1]).filter((n) => !SKIP.has(n));
  const name = names[names.length - 1];
  if (!name) { rows.push({ route, kind: 'layout' }); continue; }
  const spec = lazy.get(name);
  const file = spec ? resolveFile(routerFile, spec) : null;
  const labelledHere = /<SampleScreen/.test(body);
  // An app with its own routes inside: list each inner screen.
  const inner = file && route.endsWith('/*') ? innerScreens(file) : [];
  if (inner.length) {
    for (const it of inner) {
      const sub = it.path ? `${route.slice(0, -2)}/${it.path}` : route.slice(0, -2);
      const f2 = family(it.file);
      const mock2 = f2.filter((f) => (MOCK.test(f.text) || MOCK_NOTE.test(f.raw))).map((f) => path.relative(SRC, f.file));
      rows.push({ route: sub, kind: 'screen', component: it.name, file: path.relative(SRC, it.file), onMenu: menu.has(sub), labelled: labelledHere, callsServer: f2.some((f) => SERVER.test(f.text)), mock: mock2.length > 0, mockIn: mock2 });
    }
    continue;
  }
  const fam = file ? family(file) : [];
  const own = fam[0]?.text || '';
  const mockIn = fam.filter((f) => (MOCK.test(f.text) || MOCK_NOTE.test(f.raw))).map((f) => path.relative(SRC, f.file));
  rows.push({
    route, kind: 'screen', component: name, file: file ? path.relative(SRC, file) : null,
    onMenu: menu.has(route) || (route.endsWith('/*') && [...menu].some((m) => m === route.slice(0, -2) || m.startsWith(route.slice(0, -1)))), labelled: labelledHere,
    callsServer: fam.some((f) => SERVER.test(f.text)), ownCallsServer: SERVER.test(own),
    mock: mockIn.length > 0, mockIn,
  });
}
// Routes declared in one line: { path: 'x', element: <Y /> }
for (const m of router.matchAll(/\{ path: '([^']+)', element: <Navigate /g)) rows.push({ route: m[1], kind: 'redirect' });

const wild = [...router.matchAll(/path: '([^']+\/\*)'/g)].map((m) => m[1]);
const screens = rows.filter((r) => r.kind === 'screen');
const verdict = (r) => {
  if (!r.file) return 'UNKNOWN';
  if (r.labelled) return 'SAMPLE, LABELLED';
  if (r.mock && !r.callsServer) return 'SAMPLE, NOT LABELLED';
  if (r.mock) return 'MIXED';
  if (!r.callsServer) return 'STATIC';
  return 'REAL';
};
for (const r of screens) r.verdict = verdict(r);
const tally = {};
for (const r of screens) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
const bad = screens.filter((r) => r.verdict === 'SAMPLE, NOT LABELLED');

const L = ['# Screen audit', '', `Generated by \`qa/tools/screen-audit.mjs\` from the route table and the menu. ${screens.length} screens, ${rows.filter((r) => r.kind === 'redirect').length} redirects.`, '',
  'How to read the verdict. REAL: the screen or a component it uses calls the server and no made-up data was found. MIXED: it calls the server and also contains made-up data (a fallback, a random figure or a sample list); each one needs reading. SAMPLE, LABELLED: wrapped in the "sample screen" notice. SAMPLE, NOT LABELLED: made-up data, no server call, no notice. STATIC: no server call and no made-up data found (a form, a menu or a help page). The check reads the screen file and the local files it imports, two levels down, so it can miss data that comes from further away.', '',
  '| Verdict | Screens |', '|---|---:|', ...Object.entries(tally).sort().map(([k, v]) => `| ${k} | ${v} |`), '',
  '## Screens that show made-up data with no notice', '', bad.length ? '| Address | On the menu | File |\n|---|---|---|\n' + bad.map((r) => `| /${r.route} | ${r.onMenu ? 'Yes' : 'No'} | ${r.file} |`).join('\n') : 'None.', '',
  '## Screens that call the server and also contain made-up data', '', '| Address | On the menu | Where the made-up data is |', '|---|---|---|',
  ...screens.filter((r) => r.verdict === 'MIXED').map((r) => `| /${r.route} | ${r.onMenu ? 'Yes' : 'No'} | ${r.mockIn.join(', ')} |`), '',
  '## Every screen', '', '| Address | On the menu | Verdict | File |', '|---|---|---|---|',
  ...screens.map((r) => `| /${r.route} | ${r.onMenu ? 'Yes' : 'No'} | ${r.verdict} | ${r.file || 'not found'} |`), '',
  '## Menu items with no screen', '', ...(() => { const known = new Set(rows.map((r) => r.route)); const lost = [...menu].filter((m) => m && !known.has(m) && !wild.some((k) => m === k.slice(0, -2) || m.startsWith(k.slice(0, -1))) && ![...known].some((k) => k.includes(':') && new RegExp(`^${k.replace(/:[^/]+/g, '[^/]+')}$`).test(m))); return lost.length ? lost.map((m) => `- /${m}`) : ['None.']; })(), ''];
fs.writeFileSync(path.join(root, 'qa/screen-audit.md'), L.join('\n'));
fs.writeFileSync(path.join(root, 'qa/.screen-audit.json'), JSON.stringify({ screens: screens.length, tally, unlabelled: bad.map((r) => r.route), mixed: screens.filter((r) => r.verdict === 'MIXED').map((r) => r.route) }, null, 1));
console.log(JSON.stringify(tally));
console.log(`${bad.length} screens show made-up data with no notice (allowed: ${ALLOW})`);
for (const r of bad) console.log(`  /${r.route}${r.onMenu ? '  [on the menu]' : ''}  ${r.file}`);
process.exit(bad.length > ALLOW ? 1 : 0);
