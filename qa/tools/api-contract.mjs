#!/usr/bin/env node
// Compares the API calls the screens make with the routes the server mounts.
// Writes qa/api-contract.md. Static analysis: template parts become ":x".
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'qa/.inventory.json'), 'utf8'));
const norm = (p) => p.split('?')[0].replace(/\$\{[^}]+\}/g, ':x').replace(/:[A-Za-z_]+\??/g, ':x').replace(/\/+$/, '') || '/';
const server = new Set(inventory.endpoints.map((e) => { const [m, p] = e.ep.split(' '); return `${m} ${norm(p)}`; }));
const serverPatterns = inventory.endpoints.map((e) => { const [m, p] = e.ep.split(' '); return { m, re: new RegExp(`^${norm(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:x/g, '[^/]+')}$`) }; });
const matches = (m, p) => server.has(`${m} ${p}`) || serverPatterns.some((s) => s.m === m && s.re.test(p.replace(/:x/g, 'x')));

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name === 'node_modules' || f.name === 'dist') continue;
    const full = path.join(dir, f.name);
    if (f.isDirectory()) walk(full, out); else if (/\.(js|jsx)$/.test(f.name)) out.push(full);
  }
  return out;
}
const calls = [];
for (const file of walk(path.join(root, 'src/frontend/src'))) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  // axios-style: client.get('/orders/...'), api.post(`/jobs/${id}`)
  for (const m of src.matchAll(/\b(?:client|api|apiClient|axios|http)\.(get|post|put|patch|delete)\(\s*([`'"])((?:\\.|(?!\2).)*)\2/g)) {
    let p = m[3];
    if (!p.startsWith('/')) continue;
    if (!p.startsWith('/api')) p = `/api${p}`;
    calls.push({ method: m[1].toUpperCase(), path: norm(p), file: rel, dynamicBase: false });
  }
  // fetch('/api/...', { method: 'POST' })
  for (const m of src.matchAll(/\bfetch\(\s*([`'"])(\/api\/(?:\\.|(?!\1).)*)\1\s*(?:,\s*\{([^}]{0,200}))?/g)) {
    const method = (m[3]?.match(/method:\s*['"](\w+)['"]/) || [])[1] || 'GET';
    calls.push({ method: method.toUpperCase(), path: norm(m[2]), file: rel });
  }
}
const seen = new Map();
for (const c of calls) { const k = `${c.method} ${c.path}`; if (!seen.has(k)) seen.set(k, { ...c, files: new Set() }); seen.get(k).files.add(c.file); }
const unique = [...seen.values()];
const missing = unique.filter((c) => !matches(c.method, c.path)).sort((a, b) => a.path.localeCompare(b.path));
const byArea = {};
for (const c of missing) { const area = c.path.split('/').slice(0, 3).join('/'); (byArea[area] ||= []).push(c); }

const lines = [
  '# Screen-to-server API contract', '',
  `Generated ${new Date().toISOString().slice(0, 10)} by \`qa/tools/api-contract.mjs\` (static analysis of literal API paths in the frontend).`, '',
  `- Distinct API calls found in the screens: **${unique.length}**`,
  `- Matched to a server route: **${unique.length - missing.length}**`,
  `- No matching server route (the call would get a 404): **${missing.length}**`, '',
  'Calls built from variables (a base URL constant plus a suffix) are not seen by this scan, so the real number of calls is higher.', '',
  '## Calls with no server route, by area', '',
];
for (const [area, list] of Object.entries(byArea).sort((a, b) => b[1].length - a[1].length)) {
  lines.push(`### ${area} (${list.length})`, '', '| Call | Used in |', '|---|---|');
  for (const c of list) lines.push(`| \`${c.method} ${c.path}\` | ${[...c.files].slice(0, 2).map((f) => f.replace('src/frontend/src/', '')).join(', ')}${c.files.size > 2 ? ` +${c.files.size - 2}` : ''} |`);
  lines.push('');
}
fs.writeFileSync(path.join(root, 'qa/api-contract.md'), lines.join('\n'));
fs.writeFileSync(path.join(root, 'qa/.api-contract.json'), JSON.stringify({ total: unique.length, missing: missing.map((c) => ({ call: `${c.method} ${c.path}`, files: [...c.files] })) }, null, 1));
console.log(`${unique.length} distinct calls, ${missing.length} with no server route`);
for (const [area, list] of Object.entries(byArea).sort((a, b) => b[1].length - a[1].length).slice(0, 25)) console.log(String(list.length).padStart(4), area);
