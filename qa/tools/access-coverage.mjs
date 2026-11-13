// Which changing API routes have a department rule, and which have none (finding B-004).
// Reads the route list made by qa/tools/discover.mjs and the rule table in lib/roleAccess.js.
//   node qa/tools/access-coverage.mjs [--max N]     exits 1 when more than N routes have no rule (default 0)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { writeRuleFor, ASK_ONLY_PREFIXES, LEADERSHIP_PREFIXES, EXTERNAL_PREFIXES } = await import(pathToFileURL(path.join(root, 'src/backend/src/lib/roleAccess.js')));
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const MAX = Number(arg('max', 0));
const under = (p, prefix) => p === prefix || p.startsWith(`${prefix}/`);
// Areas whose changes are open to every signed-in staff login on purpose, with the reason.
const OPEN_ON_PURPOSE = [
  ['/api/auth', 'signing in and changing your own password'],
  ['/api/v1/partner', 'partner API: a partner token, not a staff login'],
  ['/api/admin', 'the access gate allows changes here to administrators only'],
  ['/api/v1/admin', 'the access gate allows changes here to administrators only'],
  ['/api/grades', 'checked inside the handler: managers, inventory manager, buyer, quality manager'],
  ['/api/products', 'checked inside the handler: managers, inventory manager, buyer; list price needs a manager'],
  ['/api/overrides', 'checked inside the handler: a price override is requested by sales and approved by a manager'],
  ['/api/documents/upload', 'any staff member may attach a document; deleting one has a rule'],
  ['/api/documents/upload-multiple', 'any staff member may attach a document; deleting one has a rule'],
];

const { backend } = JSON.parse(fs.readFileSync(path.join(root, 'qa/enterprise-excellence/.discovery.json'), 'utf8'));
const rows = backend.endpoints.filter((e) => !['GET', 'HEAD', 'OPTIONS'].includes(e.method)).map((e) => {
  const url = e.full.replace(/:[A-Za-z]+/g, 'x');
  const rule = writeRuleFor(url, e.method);
  const how = rule ? `rule: ${rule}`
    : e.guards?.length ? `guard in the route: ${e.guards.join(', ')}`
      : ASK_ONLY_PREFIXES.some((p) => under(url, p)) ? 'asks a question, changes nothing'
        : LEADERSHIP_PREFIXES.some((p) => under(url, p)) ? 'leadership only'
          : EXTERNAL_PREFIXES.some((p) => under(url, p)) ? 'store API (customer logins)'
            : (OPEN_ON_PURPOSE.find(([p]) => under(url, p)) || [])[1] ? `open on purpose: ${OPEN_ON_PURPOSE.find(([p]) => under(url, p))[1]}` : null;
  return { key: e.key, mount: e.mount, how };
});
const none = rows.filter((r) => !r.how);
const byMount = {};
for (const r of none) (byMount[r.mount] = byMount[r.mount] || []).push(r.key);
const out = { at: new Date().toISOString(), changingRoutes: rows.length, withRule: rows.filter((r) => r.how?.startsWith('rule')).length, guardedInRoute: rows.filter((r) => r.how?.startsWith('guard')).length, otherwiseCovered: rows.filter((r) => r.how && !/^(rule|guard)/.test(r.how)).length, noRule: none.length, noRuleByArea: byMount };
fs.writeFileSync(path.join(root, 'qa/results/access-coverage.json'), JSON.stringify(out, null, 1));
console.log(`${rows.length} changing routes: ${out.withRule} under a department rule, ${out.guardedInRoute} guarded in the route file, ${out.otherwiseCovered} covered another way, ${none.length} with no rule`);
for (const [m, keys] of Object.entries(byMount)) console.log(`  ${m}: ${keys.length}  ${keys.map((k) => k.replace(m, '')).join(', ').slice(0, 200)}`);
process.exit(none.length > MAX ? 1 : 0);
