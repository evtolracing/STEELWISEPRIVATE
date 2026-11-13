#!/usr/bin/env node
// Builds the generated documents of the Enterprise Excellence Program from measured facts:
//   .discovery.json (qa/tools/discover.mjs), qa/results/db-facts.json (qa/tools/db-facts.mjs),
//   qa/results/baseline-probe.json, findings.json and the module map (excellence-modules.mjs).
// Writes into qa/enterprise-excellence/: system-inventory.md, api-inventory.md,
// database-inventory.md, module-dependency-map.md, permissions-matrix.md, findings-register.md,
// testing-gap-analysis.md, quality-scorecard.md and progress.json.
// The other files in that folder are written by hand.
//   node qa/tools/discover.mjs && node qa/tools/excellence-docs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { MODULES, AREAS, NOT_BUILT } from './excellence-modules.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = path.join(root, 'qa/enterprise-excellence');
const json = (f, d = null) => { try { return JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')); } catch { return d; } };
const d = json('qa/enterprise-excellence/.discovery.json');
const db = json('qa/results/db-facts.json');
const probe = json('qa/results/baseline-probe.json');
const reg = json('qa/enterprise-excellence/findings.json');
const state = json('qa/enterprise-excellence/phase-state.json', {});
const today = new Date().toISOString().slice(0, 10);
const write = (name, lines) => fs.writeFileSync(path.join(DIR, name), `${lines.join('\n')}\n`);
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const git = (c) => { try { return execSync(`git ${c}`, { cwd: root }).toString().trim(); } catch { return ''; } };
const head = git('rev-parse --short HEAD');
const made = (tool) => `Generated ${today} by \`${tool}\` at commit ${head}. Do not edit by hand: change the source and rerun.`;

const eps = d.backend.endpoints;
const fileOf = (f) => (f.startsWith('../') ? `src/backend/src/${f.slice(3)}` : `src/backend/src/routes/${f}`);
const okOf = (e) => (e.exercised?.ok || 0) > 0;
const screens = d.screens?.rows || [];
const rowsOf = Object.fromEntries((db?.rows || []).map((r) => [r.table, r.rows]));
const open = (f) => !['VERIFIED FIXED', 'NOT APPLICABLE'].includes(f.status);
// A module's list of findings shows only the ones still open in the register.
const stillOpen = (ids) => String(ids || '').split(/,\s*/).filter(Boolean).filter((id) => { const f = reg.findings.find((x) => x.id === id); return !f || open(f); }).join(', ');

// ── Module facts ────────────────────────────────────────────────────────────────────────────
const mods = MODULES.map((m) => {
  const files = m.files.map(fileOf);
  const e = eps.filter((x) => files.includes(x.file));
  const uniq = [...new Map(e.map((x) => [`${x.method} ${x.file} ${x.path}`, x])).values()];
  const sc = screens.filter((s) => m.screens.some((p) => s.route === p || s.route.startsWith(`${p}/`)));
  const tables = [...new Set(e.flatMap((x) => x.models))];
  const w = e.filter((x) => x.method !== 'GET');
  return { ...m, srcFiles: files, routes: e.length, distinctRoutes: uniq.length, okRoutes: e.filter(okOf).length, writes: w.length, okWrites: w.filter(okOf).length, tables, screensFound: sc, mounts: [...new Set(e.map((x) => x.mount))] };
});
const claimedFiles = new Set(mods.flatMap((m) => m.srcFiles));
const unclaimed = Object.keys(d.backend.files).filter((f) => d.backend.files[f].endpoints.length && !claimedFiles.has(f));
const claimedScreens = new Set(mods.flatMap((m) => m.screensFound.map((s) => s.route)));
const unclaimedScreens = screens.filter((s) => !claimedScreens.has(s.route));

// ── system-inventory.md ─────────────────────────────────────────────────────────────────────
{
  const fe = d.frontend.files; const be = d.backend.files;
  const tally = mods.reduce((a, m) => { a[m.status] = (a[m.status] || 0) + 1; return a; }, {});
  const L = ['# System inventory', '', made('qa/tools/excellence-docs.mjs'), '',
    'Every figure here is counted from the code or measured in a test run. The module map itself (which files make a module, and its classification) is written by hand in `qa/tools/excellence-modules.mjs`.', '',
    '## Totals', '', '| Item | Count |', '|---|---:|',
    `| Modules | ${mods.length} |`, `| Server route files | ${Object.keys(be).length} |`, `| API routes (each address counted; two route files are mounted twice) | ${eps.length} |`,
    `| API routes that change data | ${eps.filter((e) => e.method !== 'GET').length} |`, `| Database tables in the schema | ${d.schema.models.length} |`, `| Enumerations | ${Object.keys(d.schema.enums).length} |`, `| Migrations | ${d.schema.migrations.length} |`,
    `| Screens (routes in the browser) | ${screens.length} |`, `| Frontend source files | ${fe.length} (${fe.reduce((s, f) => s + f.lines, 0).toLocaleString('en-US')} lines) |`, `| Server route code | ${Object.values(be).reduce((s, f) => s + f.lines, 0).toLocaleString('en-US')} lines |`,
    `| Background jobs, queues, schedules, event bus | 0 |`, `| Email or text providers | 0 |`, `| Outside services called | 4 (three AI providers, one voice provider) plus partner webhooks |`, `| Feature flags | 0 |`, '',
    '## Modules by classification', '', '| Classification | Modules |', '|---|---:|', ...Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`), '',
    'IMPLEMENTED AND VERIFIED means the module\'s critical behaviour was run successfully by an automated test in this session and the result was checked. It does not mean the module is complete: see the findings listed against it.', ''];
  for (const area of AREAS) {
    const list = mods.filter((m) => m.area === area); if (!list.length) continue;
    L.push(`## ${area}`, '');
    for (const m of list) {
      const sv = m.screensFound.reduce((a, s) => { a[s.verdict] = (a[s.verdict] || 0) + 1; return a; }, {});
      L.push(`### ${m.name}`, '', `- **Status:** ${m.status}`, `- **Basis:** ${m.basis}`, `- **Purpose:** ${m.purpose}`,
        `- **Screens:** ${m.screensFound.length ? `${m.screensFound.length} (${Object.entries(sv).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(', ')}): ${m.screensFound.slice(0, 10).map((s) => `/${s.route}`).join(', ')}${m.screensFound.length > 10 ? ', …' : ''}` : 'none'}`,
        `- **Server:** ${m.srcFiles.length ? m.srcFiles.map((f) => `\`${f}\``).join(', ') : 'none'}${m.mounts.length ? `; served at ${m.mounts.join(', ')}` : ''}`,
        `- **Routes:** ${m.routes}${m.routes ? `, of which ${m.writes} change data. Returned a success in a test this session: ${m.okRoutes} of ${m.routes}; of the changing routes, ${m.okWrites} of ${m.writes}` : ''}`,
        `- **Tables:** ${m.tables.length ? m.tables.join(', ') : 'none directly in the route files (through a service, or none)'}`,
        `- **Who may change it:** see permissions-matrix.md`, `- **Depends on:** ${m.upstream || 'nothing'}`, `- **Feeds:** ${m.downstream || 'nothing'}`,
        `- **Findings:** ${stillOpen(m.findings) || 'none open'}`, ...(m.concern ? [`- **Production concern:** ${m.concern}`] : []), '');
    }
  }
  L.push('## Capabilities in the program brief that the code does not contain', '', 'These are not modules. Nothing was built for them in Phase 1; each is a decision for the owner or a later phase.', '', '| Capability | Finding |', '|---|---|', ...NOT_BUILT.map(([c, f]) => `| ${c} | ${f} |`), '');
  L.push('## Code nothing uses', '', `Found by following imports from the application entry points. ${fe.filter((f) => !f.reachable).length} frontend files (${fe.filter((f) => !f.reachable).reduce((s, f) => s + f.lines, 0).toLocaleString('en-US')} lines) and ${d.backend.deadBackend.length} server files. Finding B-013.`, '',
    '| File | Lines |', '|---|---:|', ...fe.filter((f) => !f.reachable).sort((a, b) => b.lines - a.lines).map((f) => `| src/frontend/src/${f.file} | ${f.lines} |`), ...d.backend.deadBackend.map((f) => `| ${f} | |`), '',
    `Packages no source file imports: frontend ${d.frontend.unusedDeps.join(', ') || 'none'}; server ${d.backendDeps.unused.join(', ') || 'none'}. (@emotion/react and @emotion/styled are required by Material UI although nothing imports them.)`, '');
  L.push('## Largest files', '', 'Finding B-014.', '', '| File | Lines | Pieces of state (useState) |', '|---|---:|---:|', ...fe.filter((f) => f.reachable).sort((a, b) => b.lines - a.lines).slice(0, 20).map((f) => `| src/frontend/src/${f.file} | ${f.lines} | ${f.useState} |`),
    ...Object.entries(be).sort((a, b) => b[1].lines - a[1].lines).slice(0, 12).map(([k, f]) => `| ${k} | ${f.lines} | |`), '');
  L.push('## Other counts from the frontend', '', '| Item | Count |', '|---|---:|',
    `| Files over 600 lines | ${fe.filter((f) => f.lines > 600).length} |`, `| Files over 1,000 lines | ${fe.filter((f) => f.lines > 1000).length} |`, `| TypeScript files | ${fe.filter((f) => f.ts).length} |`,
    `| Icon-only buttons | ${fe.reduce((s, f) => s + f.iconButtons, 0)} |`, `| aria-label attributes | ${fe.reduce((s, f) => s + f.ariaLabels, 0)} |`, `| Browser alert or confirm calls | ${fe.reduce((s, f) => s + f.alerts, 0)} in ${fe.filter((f) => f.alerts).length} files |`,
    `| Timers started (setInterval, setTimeout) | ${fe.reduce((s, f) => s + f.timers, 0)} |`, `| Timers cleared | ${fe.reduce((s, f) => s + f.clears, 0)} |`, `| console.log calls | ${fe.reduce((s, f) => s + f.consoleLog, 0)} |`, `| Dialogs | ${fe.reduce((s, f) => s + f.dialogs, 0)} |`, `| Frontend unit test files | ${d.tests.feTests.length} |`, '');
  if (unclaimed.length || unclaimedScreens.length) L.push('## Not yet placed in a module', '', ...unclaimed.map((f) => `- route file ${f}`), ...unclaimedScreens.map((s) => `- screen /${s.route} (${s.verdict})`), '');
  write('system-inventory.md', L);
}

// ── api-inventory.md ────────────────────────────────────────────────────────────────────────
{
  const w = eps.filter((e) => e.method !== 'GET');
  const L = ['# API inventory', '', made('qa/tools/excellence-docs.mjs'), '',
    `${eps.length} routes in ${Object.keys(d.backend.files).length} route files, served at ${d.backend.mounts.length} mount points. ${w.length} change data.`, '',
    '## What the columns mean', '',
    '- **Tested OK**: the route returned a success at least once during the full gate run of this session (from server request logs). A route that only ever returned a refusal is not counted.',
    '- **Tx**: the handler uses a database transaction. **Writes**: database changes written in the handler itself (a handler that calls a service shows 0).',
    '- **No limit**: the handler has a list query with no row limit. **Record**: the handler writes an audit or history record.', '- These are counts from reading the code by pattern. They locate candidates; they do not prove a defect.', '',
    '## Totals', '', '| Measure | Count |', '|---|---:|',
    `| Routes that returned a success in a test | ${eps.filter(okOf).length} of ${eps.length} |`, `| Changing routes that returned a success in a test | ${w.filter(okOf).length} of ${w.length} |`,
    `| Changing handlers with two or more database writes and no transaction | ${w.filter((e) => e.writes > 1 && !e.transaction).length} |`, `| Read routes with a list query that has no row limit | ${eps.filter((e) => e.method === 'GET' && e.listsNoTake > 0).length} |`,
    `| Handlers with no try/catch of their own | ${eps.filter((e) => !e.tryCatch).length} (many use a shared wrapper) |`, `| Routes that use raw SQL | ${eps.filter((e) => e.raw).length} |`,
    `| Calls the screens make that have no server route | ${d.contract?.unmatched ?? d.contract?.missing?.length ?? 'see qa/api-contract.md'} |`, '',
    '## Reply shapes', '', 'Three shapes are in use: a bare record or list (most older routes), `{ data, meta }` (order entry, products search), and `{ success, data }` or `{ success, error }` (dispatch, operations, order hub). Finding E-021.', '',
    '## Changing handlers with several writes and no transaction (B-010)', '', '| Route | Writes | File |', '|---|---:|---|', ...w.filter((e) => e.writes > 1 && !e.transaction).map((e) => `| \`${e.key}\` | ${e.writes} | ${e.file.replace('src/backend/src/routes/', '')}:${e.line} |`), '',
    '## Read routes with an unlimited list query (B-012)', '', '| Route | File |', '|---|---|', ...eps.filter((e) => e.method === 'GET' && e.listsNoTake > 0).map((e) => `| \`${e.key}\` | ${e.file.replace('src/backend/src/routes/', '')}:${e.line} |`), '',
    '## Every route, by route file', ''];
  const byFile = {}; for (const e of eps) (byFile[e.file] ||= []).push(e);
  for (const [f, list] of Object.entries(byFile)) {
    const meta = d.backend.files[f];
    L.push(`### ${f.replace('src/backend/src/routes/', '')} (${list.length} routes, ${meta.lines} lines)`, '', `Mounted at ${[...new Set(list.map((e) => e.mount))].join(', ')}. Tables: ${[...new Set(list.flatMap((e) => e.models))].join(', ') || 'through a service or none'}.`, '',
      '| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |', '|---|:-:|---:|:-:|:-:|:-:|---|',
      ...list.map((e) => `| \`${e.key}\` | ${okOf(e) ? 'yes' : ''} | ${e.writes || ''} | ${e.transaction ? 'yes' : ''} | ${e.listsNoTake ? 'yes' : ''} | ${e.audit ? 'yes' : ''} | ${e.guards.filter((g) => /requireRole|Linked/.test(g)).join(' ').slice(0, 60)} |`), '');
  }
  write('api-inventory.md', L);
}

// ── database-inventory.md ───────────────────────────────────────────────────────────────────
{
  const ms = d.schema.models; const use = d.backend.modelUse;
  const used = (m) => use[m.name].read.length + use[m.name].write.length > 0 || use[m.name].nested;
  const noCode = ms.filter((m) => !used(m));
  const L = ['# Database inventory', '', made('qa/tools/excellence-docs.mjs'), '',
    `Schema: \`src/backend/prisma/schema.prisma\`. Row counts and enforced rules are read from the local QA database after a full gate run${db ? ` (${db.at.slice(0, 16).replace('T', ' ')} UTC)` : ''}; they describe test data, not the live database, which was not touched.`, '',
    '## Totals', '', '| Item | Count |', '|---|---:|', `| Tables | ${ms.length} |`, `| Tables no server code reads or writes | ${noCode.length} |`, ...(db ? [`| Tables empty after a full test run | ${db.emptyTables.length} of ${db.tables} |`, `| Rows in the QA database | ${db.totalRows.toLocaleString('en-US')} |`, `| Indexes | ${db.indexes} |`, `| Foreign keys | ${db.constraintCounts['foreign key']} |`, `| Foreign keys with no index | ${db.fkNoIndex.length} |`, `| Value rules the database enforces (CHECK) | ${db.constraintCounts.check || 0} |`, `| Views | ${db.views.length} |`, `| Triggers | ${db.triggers.length} |`, `| Columns holding free-form JSON | ${db.jsonCols.length} |`] : []),
    `| Tables with a branch or location column | ${ms.filter((m) => m.scope.location).length} |`, `| Tables with an organization or tenant column | ${ms.filter((m) => m.scope.organization).length} |`, `| Tables with a status column backed by an enumeration | ${ms.filter((m) => m.status).length} |`, `| Tables with no updatedAt | ${ms.filter((m) => !m.audit.updatedAt).length} |`,
    `| Foreign keys that delete children with the parent (cascade) | ${ms.reduce((s, m) => s + m.fk.filter((f) => f.onDelete === 'Cascade').length, 0)} |`, `| Money or quantity columns stored as floating point | ${ms.reduce((s, m) => s + m.floats.length, 0)} (${ms.filter((m) => m.floats.length).map((m) => m.name).join(', ')}) |`, '',
    '## Rules the database itself enforces', '', ...(db ? ['| Table | Rule |', '|---|---|', ...db.checkConstraints.map((c) => `| ${c.table} | \`${esc(c.def)}\` |`)] : ['Not read.']), '',
    'Everything else (status moves, totals, who may change what) is enforced in server code only.', '',
    '## Read-only consistency checks on the QA database', '', 'Run by `qa/tools/db-facts.mjs`. Each number is how many rows break the rule. The demo seed writes rows directly and is known to break some (D-023, B-022); the "outside the demo seed" rows are the ones that matter.', '',
    ...(db ? ['| Check | Rows that break it |', '|---|---:|', ...Object.entries(db.checks).map(([k, v]) => `| ${k} | ${v} |`)] : []), '',
    '## Migrations', '', '| Migration | Lines | Tables created | Drops | Indexes |', '|---|---:|---:|---:|---:|', ...d.schema.migrations.map((m) => `| ${m.name} | ${m.lines} | ${m.creates} | ${m.drops} | ${m.indexes} |`), '',
    `SQL Editor files for the owner to apply are under \`src/backend/prisma/upgrades/\` (${d.schema.sqlEditor.length} files). Phase 1 made no database change.`, '',
    '## Tables no server code reads or writes (B-017)', '', noCode.map((m) => m.name).join(', '), '',
    '## Records kept as one JSON value per row (B-009)', '', 'InventoryCatalogItem, InventorySite, InventoryUnit, InventoryTransfer, RfidScanEvent (the second stock list); the order hub tables; StopWorkEvent, StopWorkAudit, StopWorkStep, StopWorkEvidence. The database cannot check any value inside them.', '',
    '## Every table', '', '| Table | Columns | Foreign keys | Unique | Indexes | Status | Branch | Org | Rows (QA) | Read by | Written by |', '|---|---:|---:|---:|---:|---|:-:|:-:|---:|---|---|',
    ...ms.map((m) => { const u = use[m.name]; const short = (a) => [...new Set(a.map((f) => f.split('/').pop().replace('.js', '')))].slice(0, 4).join(', ') + (new Set(a).size > 4 ? ', …' : ''); return `| ${m.name} | ${m.fields} | ${m.fk.length} | ${m.unique.length} | ${m.indexes.length} | ${m.status || ''} | ${m.scope.location ? 'yes' : ''} | ${m.scope.organization ? 'yes' : ''} | ${rowsOf[m.table] ?? ''} | ${short(u.read) || (u.nested ? '(with its parent)' : 'nothing')} | ${short(u.write) || (u.nested ? '(with its parent)' : 'nothing')} |`; }), ''];
  write('database-inventory.md', L);
}

// ── module-dependency-map.md ────────────────────────────────────────────────────────────────
{
  // Tables shared between modules: the real coupling.
  const tableMods = {};
  for (const m of mods) for (const t of m.tables) (tableMods[t] ||= new Set()).add(m.name);
  const shared = Object.entries(tableMods).filter(([, s]) => s.size > 1).sort((a, b) => b[1].size - a[1].size);
  const libUse = {};
  for (const [f, meta] of Object.entries(d.backend.files)) for (const i of meta.imports) if (/\/(lib|services|middleware)\//.test(i)) (libUse[i.replace('src/backend/src/', '')] ||= []).push(f.split('/').pop());
  const L = ['# Module dependency map', '', made('qa/tools/excellence-docs.mjs'), '',
    'Two views. The first is the business flow, written by hand in the module map. The second is measured: which tables more than one module touches, and which shared code files the route files import. A change to a shared table or a shared file needs the tests of every module listed beside it.', '',
    '## Business flow', '', '| Module | Depends on | Feeds |', '|---|---|---|', ...mods.map((m) => `| ${m.name} | ${m.upstream || ''} | ${m.downstream || ''} |`), '',
    '## Tables touched by more than one module', '', '| Table | Modules | Count |', '|---|---|---:|', ...shared.map(([t, s]) => `| ${t} | ${[...s].join('; ')} | ${s.size} |`), '',
    '## Shared server code and who imports it', '', '| File | Imported by (route files) | Count |', '|---|---|---:|', ...Object.entries(libUse).sort((a, b) => b[1].length - a[1].length).map(([f, a]) => `| ${f} | ${a.slice(0, 8).join(', ')}${a.length > 8 ? ', …' : ''} | ${a.length} |`), '',
    '## Highest-risk dependencies', '',
    '1. `lib/db.js`, `lib/branchScope.js`, `middleware/apiGate.js`, `lib/roleAccess.js`: every request and, since Phase 2, every query on a branch-owned table passes through them. A mistake here hides records from everyone or shows them to everyone. Covered by unit tests, the sweep, the probe and `qa/sim/branch-boundary.mjs` (37 checks).',
    '2. The Job table: read or written by jobs, dispatch, operations, quality, material tracking, shipping, order entry, cockpit, planning, print queue and the partner API. Its moves are governed by `lib/workflowRules.js` and recorded by `lib/jobHistory.js`. Since Phase 2, planning and operations record their moves in the same transaction, completing an operation locks the job, and a status move applies only if the job is still where it was checked (C-005; `qa/sim/phase2-integrity.mjs`). Still outside: the general edit route writes a status unconditionally, and three job routes carry their own status checks (M-017).',
    '3. Order, OrderLine, Coil, Inventory, Shipment, Invoice: the order-to-cash chain. Covered in depth by the simulation and its reconciliation.',
    '4. `services/billing.js`: every money action. Covered by unit tests, the simulation and the sweep.',
    '5. Two stock lists and two order pipelines that do not depend on each other at all (B-009): the risk is that they disagree. Decided by the owner; to be connected or retired in Phase 3.',
    '6. Shelf stock: the counter quick sale now writes stock levels and movements (B-025), joining receiving, transfer, hold, allocation, dispatch and return receipt as the only writers of stock.',
    '7. `routes/shipments.js` holds dispatch and delivery as private functions; the carrier partner routes re-implemented them and are wrong (C-002).', ''];
  write('module-dependency-map.md', L);
}

// ── permissions-matrix.md ───────────────────────────────────────────────────────────────────
{
  const ra = fs.readFileSync(path.join(root, 'src/backend/src/lib/roleAccess.js'), 'utf8');
  const groups = Object.fromEntries([...ra.matchAll(/^\s+(\w+): \[([^\]]+)\],$/gm)].map((m) => [m[1], m[2].replace(/'/g, '').split(',').map((s) => s.trim())]));
  const roles = d.schema.enums.UserRole || [];
  const sectionsP = probe?.sections || {};
  const AREAS_W = [['Orders, quotes, RFQs, customers, invoices and payments, opening a return', 'sales'], ['Counter sales', 'sales, warehouse'], ['Reserving stock for an order; receiving a return', 'sales, warehouse, production'], ['Stock records (stock items, heats, receiving, holds, transfers)', 'warehouse, production, quality'], ['Shipments', 'warehouse, sales, plus production manager, packaging lead, material handler, work-center lead'], ['Jobs and coil work orders (at both addresses since B-001)', 'production, sales, warehouse, quality'], ['Credits, refunds, cancelling an invoice, voiding a counter sale, tax rates', 'managers only: admin, leadership, credit manager, sales director'], ['Anything under /api/admin and /api/v1/admin', 'admin group only'], ['Users', 'SUPER_ADMIN, TENANT_OWNER, ADMIN, BRANCH_MANAGER, OPS_MANAGER (route guard)'], ['Products, grades, price levels', 'checked inside the handlers (sweep section "Heats, products and grades")'], ['Executive pages and order-speed metrics (reading too)', 'leadership roles']];
  const L = ['# Permissions matrix', '', made('qa/tools/excellence-docs.mjs'), '',
    'How access is decided today, read from `src/backend/src/middleware/apiGate.js`, `lib/roleAccess.js`, `lib/customerScope.js` and the route guards, and checked by the sweep and the baseline probe.', '',
    '## The layers, in the order a request meets them', '',
    '1. **Sign-in.** Every `/api` route needs a signed token except sign-in, first-user registration, the health check and the partner API (which has its own tokens). Sweep: 557 routes tried with no token, 0 let in.',
    '2. **Customer and partner logins** reach only the store routes, and only their own account and the accounts beneath it. Sweep: 534 staff routes tried as a customer, 0 let in; 31 cross-account checks.',
    '3. **Leadership pages** (executive, order-speed metrics) are limited to leadership roles, for reading too.',
    '4. **Department write rules.** Staff may change only the records their department owns (table below). Reading is open to every staff login by design.',
    '5. **Read-only roles** (auditor, data analyst) change nothing (B-002, fixed in Phase 1).',
    '6. **Admin routes**: changing anything under `/api/admin` needs an admin role.', '',
    '## What does not exist', '',
    '- **No branch, division or region boundary.** `User.homeLocationId`, `UserLocation` and `UserDivision` are stored and read by no route. Every staff login reads every branch and, within its department, changes any branch (B-003).',
    '- **No tenant boundary between companies on staff routes.** Only the user list is filtered by organization. The system runs as one company. If a second company is ever hosted in the same database, every staff route would show it both (E-019).',
    '- **No approval authority.** ApprovalRequest and ApprovalDecision tables exist with no code. The only approvals are: a manager releases a credit hold; a manager issues credits and refunds.',
    '- **No permission inheritance.** `Role`, `UserRoleAssignment` tables are saved by the user screen and read by no access check; access comes from the single `User.role` value.',
    `- **The screens have their own list** (\`src/frontend/src/config/roleAccess.js\`, ${d.frontend.roleAccessLines} lines; \`constants/permissions.js\` is imported by nothing). The server list is the one that counts.`, '',
    '## Roles and their department', '', `${roles.length} roles in the schema.`, '', '| Department | Roles |', '|---|---|', ...Object.entries(groups).map(([g, r]) => `| ${g} | ${r.join(', ')} |`), `| customer and partner logins | ${roles.filter((r) => /^(CUSTOMER|SUPPLIER|CARRIER)/.test(r)).join(', ')} |`, '',
    '## Who may change what', '', 'Admin and leadership departments may change everything below.', '', '| Records | Departments that may change them |', '|---|---|', ...AREAS_W.map(([a, g]) => `| ${a} | ${g} |`), '',
    '## Areas with no department rule (B-004)', '', 'Any staff login that is not read-only can change these. Measured with a saw-operator login against every write route.', '',
    '| Area | Write routes | Routes |', '|---|---:|---|',
    ...[['Processing recipes', '/api/processing-recipes'], ['Work centers', '/api/work-centers'], ['Staff, skills and shifts', '/api/staff'], ['Dispatch set-up and queue', '/api/v1/dispatch'], ['Shop-floor operations', '/api/v1/operations'], ['Bills of material', '/api/v1/bom'], ['Assets', '/api/assets'], ['Maintenance orders', '/api/maintenance-orders'], ['Documents (upload, delete)', '/api/documents'], ['Drop tags and packages', '/api/drop-tags'], ['Print queue', '/api/print-queue'], ['Stop work', '/api/safety/stop-work'], ['Second stock list', '/api/v1/inventory'], ['Order hub', '/api/v1'], ['Demand shaping', '/api/demand-shaping'], ['Exception events', '/api/v1/events'], ['Material tracking', '/api/material-tracking'], ['Quality inspections', '/api/qc'], ['Operations cockpit actions', '/api/ops-cockpit']].map(([n, p]) => { const l = eps.filter((e) => e.method !== 'GET' && e.mount === p); return `| ${n} | ${l.length} | ${p} |`; }), '',
    '## Evidence from this session', '', '| Check | Result |', '|---|---|', ...Object.entries(sectionsP).map(([k, v]) => `| ${k} | ${esc(v.summary)} |`), '',
    '## Decisions needed from the owner', '', '1. Which roles are held to their own branch, and which to a region, for reading and for changing (B-003).', '2. The owner department for each area in the table above (B-004).', '3. Whether every staff login should read invoices and cost-bearing records (F-009).', ''];
  write('permissions-matrix.md', L);
}

// ── findings-register.md ────────────────────────────────────────────────────────────────────
const F = reg.findings;
const count = (list, k) => list.reduce((a, f) => { a[f[k]] = (a[f[k]] || 0) + 1; return a; }, {});
{
  const order = ['P0', 'P1', 'P2', 'P3'];
  const L = ['# Findings register', '', made('qa/tools/excellence-docs.mjs'), '',
    'Source of truth: `findings.json` in this folder. Nothing is ever deleted from it. IDs are permanent: B = Phase 1 baseline; C = Phase 2 architecture review; E, S, I, M, F, X = the six earlier workstreams; D = the first audit; U = user-experience register. The older registers in `qa/` are kept as history.', '',
    'Severity: P0 critical security, financial integrity, data corruption or outage risk. P1 essential workflow failure or significant operational risk. P2 functional, architectural, performance or maintainability deficiency. P3 minor.', '',
    '## Counts', '', '| Severity | All | Still open |', '|---|---:|---:|', ...order.map((s) => `| ${s} | ${F.filter((f) => f.severity === s).length} | ${F.filter((f) => f.severity === s && open(f)).length} |`), `| Total | ${F.length} | ${F.filter(open).length} |`, '',
    '| Status | Count |', '|---|---:|', ...Object.entries(count(F, 'status')).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`), '',
    '## Open findings, most severe first', '', '| ID | Sev | Status | Module | What is wrong | Assigned to |', '|---|---|---|---|---|---|',
    ...F.filter(open).sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity) || a.id.localeCompare(b.id, 'en', { numeric: true })).map((f) => `| ${f.id} | ${f.severity} | ${f.status} | ${esc(f.module)} | ${esc(f.actual).slice(0, 220)} | ${esc(f.phase)} |`), '',
    '## Every finding in full', ''];
  for (const f of F) {
    L.push(`### ${f.id} · ${f.severity} · ${f.status}`, '',
      ...[['Discovered', f.discovered], ['Module', f.module], ['Workflow', f.workflow], ['Category', f.category], ['Source file or endpoint', f.where], ['Evidence', f.evidence], ['Expected', f.expected], ['Actual', f.actual], ['Root cause or suspected cause', f.cause], ['Operational impact', f.impact], ['Affected dependencies', f.dependencies], ['Recommended correction', f.correction], ['Deferred: reason', f.deferral?.reason], ['Deferred: target phase', f.deferral?.targetPhase], ['Deferred: required correction', f.deferral && f.deferral.correction !== f.correction ? f.deferral.correction : ''], ['Deferred: dependencies', f.deferral?.dependencies], ['Deferred: acceptance criteria', f.deferral?.acceptance], ['Deferred: verification', f.deferral?.verification], ['Required tests', f.requiredTests], ['Assigned phase', f.phase], ['Status note', f.statusNote], ['Verification evidence', f.verification], ['First recorded in', f.source]].filter(([, v]) => v).map(([k, v]) => `- **${k}:** ${String(v).replace(/\n/g, ' ')}`), '');
  }
  write('findings-register.md', L);
}

// ── testing-gap-analysis.md ─────────────────────────────────────────────────────────────────
{
  const t = d.tests; const unit = t.unitFiles.reduce((s, f) => s + f.tests, 0);
  const w = eps.filter((e) => e.method !== 'GET');
  const gaps = mods.filter((m) => m.writes > 0).map((m) => ({ ...m, miss: m.writes - m.okWrites })).sort((a, b) => b.miss - a.miss);
  const L = ['# Testing gap analysis', '', made('qa/tools/excellence-docs.mjs'), '',
    '## What exists', '', '| Kind | Where | Size | Runs on GitHub |', '|---|---|---|:-:|',
    `| Unit tests | src/backend/test (${t.unitFiles.length} files) | ${unit} tests | yes |`,
    '| Order-to-cash simulation with database checks and reconciliation | qa/sim/run.mjs | 50 jobs per cycle, 3 cycles per gate run | no |',
    '| Security and safeguards sweep | qa/sim/security.mjs | 20 sections | no |', '| Baseline probe (Phase 1) | qa/sim/baseline-probe.mjs | 4 sections over every write route | no |',
    '| Browser suites that operate screens | qa/sim/ui-*.cjs | 5 suites, 125 checks, plus a check that every route opens | no |',
    '| Screen audit, lint, production build | qa/tools/screen-audit.mjs, src/frontend | all screens, whole frontend | audit and lint yes; build on the host |',
    `| Frontend unit tests | none | ${t.feTests.length} | |`, '| Performance benchmark | qa/perf (Workstream 1) | not rerun in Phase 1 | no |', '| Accessibility, mobile and tablet layout | none | 0 | |', '| Restore from backup, failover | none | 0 | |', '',
    '## What the tests actually reach', '', 'Measured from the server\'s request log during the full gate run of this session (`qa/tools/exercised.mjs`). "Success" means the route answered 2xx at least once. A refusal test (no token, wrong role, bad input) is real coverage of the refusal and none of the function.', '',
    '| Measure | Count |', '|---|---:|', `| Routes that returned a success | ${eps.filter(okOf).length} of ${eps.length} (${Math.round(100 * eps.filter(okOf).length / eps.length)}%) |`, `| Changing routes that returned a success | ${w.filter(okOf).length} of ${w.length} (${Math.round(100 * w.filter(okOf).length / w.length)}%) |`,
    `| Routes called at all (including refusals) | ${eps.filter((e) => e.exercised).length} of ${eps.length} |`, `| Screens operated by a browser suite (not just opened) | about 30 of ${screens.length} |`, `| Screens opened without a crash | 125 of 125 that take no record id |`, '',
    '## Changing routes with no success-path test, by module', '', '| Module | Changing routes | With a success-path test | Without |', '|---|---:|---:|---:|', ...gaps.map((m) => `| ${m.name} | ${m.writes} | ${m.okWrites} | ${m.miss} |`), '',
    '## Weaknesses in the existing tests', '',
    '- **Data isolation between runs.** The simulation, sweep and probes share one QA database and leave their records behind; the gate script rebuilds the database first. A test run on a database that was not rebuilt can pass or fail for reasons left by an earlier run.',
    '- **Refusal-heavy.** The sweep proves that 557 routes refuse a missing token and 534 refuse a customer, which is right, but most of those routes are never made to succeed.',
    '- **Browser checks read text.** They assert that a row or a message appears. They do not check layout, keyboard use or what a screen reader would say.',
    `- **Unit tests cover rules that were moved into \`lib/\`.** ${t.unitFiles.length} files, none of which needs a database. Rules still inside route handlers (dispatch, operations, staff, quality, drop tags, order hub) cannot be unit tested where they are (B-014).`,
    '- **No concurrency test outside order to cash.** Reservation, dispatch, payment and return races are tested. Nothing tests two requests at once on the second stock list, operations, counter sessions or user edits.',
    '- **No cross-branch test**, because there is no cross-branch rule to test (B-003).', '- **One flake seen in earlier sessions and not since**: none recorded in this session; all gates passed on two consecutive full runs before any change.', '',
    '## Prioritised gaps', '', '| Priority | Gap | Why | Assigned |', '|---|---|---|---|',
    '| 1 | Database-backed gates do not run on GitHub | A regression in order to cash is caught only if someone runs the gates locally | Phase 2 (workflow change: add a Postgres service) |',
    '| 2 | Shop-floor operations: start, pause, complete, reassign; time logs | 0 of 15 changing routes ever succeed in a test; labor time depends on them | Manufacturing phase |',
    '| 3 | Material tracking, packages, drop tags, print queue | 0 of 30; this is the physical identity of what ships | Manufacturing and shipping phases |',
    '| 4 | Partner API success paths and webhook delivery | 0 of 18; outside parties depend on it | Integration phase |',
    '| 5 | User administration success paths | Creating and disabling users is never tested end to end | Security phase |',
    '| 6 | Quality inspections beyond pass | 2 of 6 | Manufacturing phase |',
    '| 7 | Staff, work centers, recipes, BOMs, assets, maintenance | Set-up data everything else reads | Phase 2 as each handler is given validation |',
    '| 8 | Dashboard and report figures reconciled to records | A wrong figure would not be seen | Reporting phase |',
    '| 9 | Accessibility scan and tablet layout in the browser suites | Never run | Phase 9 |', '| 10 | Frontend unit tests for the price, tax and total calculations done in the browser | None exist | Phase 2 |', ''];
  write('testing-gap-analysis.md', L);
}

// ── quality-scorecard.md ────────────────────────────────────────────────────────────────────
{
  const WEIGHTS = [['Functional correctness', 15], ['Data integrity', 15], ['Reliability', 12], ['Security', 12], ['Operational efficiency', 10], ['User experience', 10], ['Performance', 8], ['Integration quality', 6], ['Maintainability', 5], ['Observability', 4], ['Accessibility', 3]];
  const old = fs.readFileSync(path.join(root, 'qa/module-quality-scorecard.md'), 'utf8');
  const groups = [];
  for (const sec of old.split(/^## /m).slice(1)) {
    const title = sec.split('\n')[0].replace(/\s*\(Workstream \d\)/, '').trim(); if (/^Other modules/.test(title)) continue;
    const scores = {}; for (const l of sec.split('\n')) { const c = l.split('|').map((x) => x.trim()); if (c.length > 4 && WEIGHTS.some(([n]) => n === c[1])) scores[c[1]] = { score: /^\d+$/.test(c[3]) ? Number(c[3]) : null, evidence: c[4] }; }
    if (Object.keys(scores).length) groups.push({ title, scores });
  }
  const P1NOTE = { Security: 'Capped at 60 by judgement while B-003 and B-004 are open: any staff login reads every branch and can change 16 unruled areas. Sign-in, customer isolation and department rules are verified by the sweep and probe', Accessibility: 'NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015)' };
  const AREA_OF = { 'Platform infrastructure': ['Platform infrastructure'], 'Sales and customer operations': ['Customer and sales operations'], 'Inventory and purchasing': ['Inventory and purchasing', 'Product and material management'], 'Manufacturing and processing': ['Manufacturing and processing'], 'Logistics and financial operations': ['Shipping and logistics', 'Financial operations'], 'Enterprise experience': ['Enterprise administration', 'Analytics and executive', 'Safety, quality systems and other sample modules'] };
  const L = ['# Quality scorecard', '', made('qa/tools/excellence-docs.mjs'), '',
    'The scores are a judgement from the evidence named beside them, not a measurement. They are carried from `qa/module-quality-scorecard.md` (each was set when its workstream audited the group) and changed in Phase 1 only where Phase 1 produced new evidence. A category with no evidence is NOT VERIFIED and is left out of the weighted figure, which is why no weighted figure here should be read as "out of 100 across everything". A score never overrides an open P0 or P1: the last column is the gate.', '',
    '## Weights and what earns the score', '', '| Category | Weight | Acceptance criteria for 95 |', '|---|---:|---|',
    '| Functional correctness | 15% | Every function the module offers works on real records, proven by a success-path test; no sample data |', '| Data integrity | 15% | Totals, balances and identities enforced by the database or a tested rule; saves are all-or-nothing; reconciliation is clean |',
    '| Reliability | 12% | No server error on bad input; safe under simultaneous requests; recovery path tested |', '| Security | 12% | Sign-in, role, department and branch boundaries enforced on the server and proven by test |',
    '| Operational efficiency | 10% | No duplicate entry; the next department is informed; exceptions are visible |', '| User experience | 10% | Consistent screens, clear errors, loading and empty states, safe correction |',
    '| Performance | 8% | Measured at the target volume with a stated environment |', '| Integration quality | 6% | Every screen call has a route; one reply shape; outside calls have timeouts and retries |',
    '| Maintainability | 5% | Rules in testable units; no dead code; lint clean |', '| Observability | 4% | Every action traceable to a person and a request; alerts on failure |', '| Accessibility | 3% | Keyboard and screen-reader use verified |', '',
    '## Module groups', ''];
  const summary = [];
  for (const g of groups) {
    const areas = AREA_OF[g.title] || [];
    const gm = mods.filter((m) => areas.includes(m.area));
    const ids = new Set(gm.flatMap((m) => m.findings.split(/,\s*/).filter(Boolean)));
    const opens = F.filter((f) => ids.has(f.id) && open(f));
    const p01 = opens.filter((f) => f.severity === 'P0' || f.severity === 'P1');
    let sum = 0; let wsum = 0; const rows = [];
    for (const [cat, wgt] of WEIGHTS) {
      let s = g.scores[cat]?.score ?? null; let ev = g.scores[cat]?.evidence || 'No evidence gathered';
      if (cat === 'Security') {
        // The Phase 1 cap of 60 stood while B-003 and B-004 were open. With both verified fixed the cap is 78, held there by C-009 and E-014.
        const boundaryDone = ['B-003', 'B-004'].every((id) => F.find((f) => f.id === id)?.status === 'VERIFIED FIXED');
        const cap = boundaryDone ? 78 : 60;
        const note = boundaryDone ? 'Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open' : P1NOTE.Security;
        if (s == null) { s = cap; ev = note; } else if (s > cap) { ev = `${note}. Was ${s}`; s = cap; } else ev = `${ev}. ${note}`;
      }
      const adj = (state.scoreAdjustments || []).find((x) => x.group === g.title && x.category === cat);
      if (adj) { ev = `${adj.evidence}. Was ${s} (${ev})`; s = adj.score; }
      if (cat === 'Accessibility') { s = null; ev = P1NOTE.Accessibility; }
      if (cat === 'Performance' && s == null) ev = 'NOT VERIFIED for this group. Only the routes in the Workstream 1 benchmark were measured';
      if (s != null) { sum += s * wgt; wsum += wgt; }
      rows.push(`| ${cat} | ${wgt}% | ${s == null ? 'NOT VERIFIED' : s} | ${esc(ev)} |`);
    }
    const weighted = wsum ? Math.round(sum / wsum) : null;
    const wr = gm.reduce((a, m) => a + m.writes, 0); const wo = gm.reduce((a, m) => a + m.okWrites, 0);
    L.push(`### ${g.title}`, '', `Modules: ${gm.map((m) => m.name).join('; ') || 'the shared server layer'}.`, '', '| Category | Weight | Score | Evidence and weaknesses |', '|---|---:|---:|---|', ...rows,
      `| **Weighted over the ${wsum}% that has evidence** | | **${weighted}** | Target 95 |`, '',
      `Changing routes with a success-path test: ${wo} of ${wr}. Open findings against these modules: ${opens.length}, of which P0 or P1: ${p01.length}${p01.length ? ` (${p01.map((f) => f.id).join(', ')})` : ''}.`, '');
    summary.push([g.title, weighted, wsum, p01.length, wr ? `${wo} of ${wr}` : 'n/a']);
  }
  L.splice(L.indexOf('## Module groups'), 0, '## Summary', '', '| Module group | Weighted score | Share of the weights that has evidence | Open P0 or P1 | Changing routes with a success-path test | Meets the gate |', '|---|---:|---:|---:|---|:-:|', ...summary.map(([t, w, ws, p, c]) => `| ${t} | ${w} | ${ws}% | ${p} | ${c} | No |`), '', 'No group meets the target of 95, and every group has at least one open P0 or P1 finding. Lowest: enterprise experience, then manufacturing.', '',
    '## Modules below the groups', '', 'The groups hide large differences. Classification and test reach per module:', '', '| Module | Classification | Changing routes with a success-path test | Open findings |', '|---|---|---|---|', ...mods.map((m) => `| ${m.name} | ${m.status} | ${m.writes ? `${m.okWrites} of ${m.writes}` : 'n/a'} | ${stillOpen(m.findings)} |`), '');
  write('quality-scorecard.md', L);
  state.scoreSummary = summary.map(([group, weighted, evidenceShare, openP0P1]) => ({ group, weighted, evidenceShare, openP0P1 }));
}

// ── progress.json ───────────────────────────────────────────────────────────────────────────
{
  const w = eps.filter((e) => e.method !== 'GET');
  const progress = {
    programVersion: '1.0', program: 'Enterprise Excellence Program', currentPhase: state.currentPhase || 1, phaseStatus: state.phaseStatus || 'IN PROGRESS', updated: new Date().toISOString(),
    repository: { branch: git('rev-parse --abbrev-ref HEAD'), commit: git('rev-parse HEAD'), baselineCommit: state.baselineCommit || null, pullRequest: 30, merged: false },
    modulesDiscovered: mods.length, modulesAudited: mods.filter((m) => !/Not examined/.test(m.basis)).length, modulesByClassification: mods.reduce((a, m) => { a[m.status] = (a[m.status] || 0) + 1; return a; }, {}),
    discovered: { apiRoutes: eps.length, apiRoutesThatChangeData: w.length, routeFiles: Object.keys(d.backend.files).length, databaseTables: d.schema.models.length, enumerations: Object.keys(d.schema.enums).length, migrations: d.schema.migrations.length, screens: screens.length, frontendFiles: d.frontend.files.length, roles: (d.schema.enums.UserRole || []).length },
    workflowsMapped: state.workflowsMapped ?? null, jobTypesIdentified: state.jobTypesIdentified ?? null,
    findingsBySeverity: count(F, 'severity'), findingsByStatus: count(F, 'status'), openFindingsBySeverity: count(F.filter(open), 'severity'), findingsTotal: F.length, findingsAddedThisPhase: F.filter((f) => f.id.startsWith(state.findingPrefix || 'B-')).length,
    testsExecuted: state.testsExecuted || [], testReach: { routesWithSuccess: eps.filter(okOf).length, routes: eps.length, changingRoutesWithSuccess: w.filter(okOf).length, changingRoutes: w.length },
    correctionsCompleted: F.filter((f) => /^[BC]-/.test(f.id) && f.status === 'VERIFIED FIXED').map((f) => f.id), scoreSummary: state.scoreSummary,
    unverifiedAreas: state.unverifiedAreas || [], currentBlockers: state.currentBlockers || [], nextActions: state.nextActions || [], lastCompletedCheckpoint: state.lastCompletedCheckpoint || null,
  };
  fs.writeFileSync(path.join(DIR, 'progress.json'), `${JSON.stringify(progress, null, 2)}\n`);
  JSON.parse(fs.readFileSync(path.join(DIR, 'progress.json'), 'utf8'));
}
console.log(JSON.stringify({ modules: mods.length, unclaimedRouteFiles: unclaimed, unclaimedScreens: unclaimedScreens.map((s) => s.route), findings: F.length, open: F.filter(open).length }));
