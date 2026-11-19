// Shared set-up for the Phase 12 certification scenarios. It stands on the Phase 11 enterprise (80 branches,
// people signed in on demand, the QA ledger active with test data) and adds the record Phase 12 asks for:
// each scenario is one certified workflow or control, with its purpose, starting event, role, screen, API
// path, database change, events, financial consequence and expected final state beside the checks that ran.
// Everything goes through the real server; the database is read to check what was saved. Local QA only.
import * as c11 from '../phase11/sctx.mjs';
import { scenario as record } from '../phase4-lib.mjs';

export * from '../phase11/sctx.mjs';
const { arg, reconcile, hq } = c11;
/** An administrator who is not the owner or the CFO (the 80-branch model has none at head office). */
export const admin = await c11.login('ADMIN', null, 'p12-admin');

export const G12 = {
  flows: 'Cross-module workflows end to end',
  finance: 'Financial ledger certification',
  recon: 'Financial and inventory reconciliation',
  dash: 'Dashboards and reports agree with the records',
  ai: 'AI assistants',
  sec: 'Security and access revalidation',
  multi: 'Multi-location readiness',
  gaps: 'Evidence gaps closed',
};
export const GROUPS12 = Object.values(G12);
const PICK = arg('group', ''); const MATCH = arg('match', '');
export const wants12 = (group) => !PICK || PICK.split(',').some((x) => GROUPS12[Number(x) - 1] === group);

let wfSeq = 0;
/**
 * One certified workflow or control. `m`:
 *   id (given or numbered)   purpose   start (starting event)   role   perms (required permissions)
 *   ui (screen)   api (API or service path)   db (database changes)   events (events and integrations)
 *   fin (financial consequences)   final (expected final state)
 */
export async function W(group, name, m, fn) {
  if (!wants12(group)) return null;
  if (MATCH && !MATCH.split('|').some((x) => name.includes(x))) return null;
  if (process.env.P12_TRACE) console.error(`… ${new Date().toISOString().slice(11, 19)} ${name}`);
  const notes = [];
  const sc = await record(group, name, (ok, x) => fn((what, cond, detail) => { const r = ok(what, cond, detail); if (r && detail != null && String(detail).trim() !== '') x.asserts.at(-1).measured = String(detail).slice(0, 240); return r; }, { ...x, note: (t) => notes.push(String(t)) }));
  const failed = sc.asserts.filter((a) => !a.ok);
  sc.record = {
    workflowId: m.id || `C12-${String(++wfSeq).padStart(3, '0')}`,
    purpose: m.purpose || name, startingEvent: m.start || 'as the name states', responsibleRole: m.role || 'as the checks state', requiredPermissions: m.perms || 'the role\'s department rule and its own branch',
    uiEntryPoint: m.ui || 'not a screen workflow', apiPath: m.api || 'as the checks state', databaseChanges: m.db || 'none outside the scenario', eventsAndIntegrations: m.events || 'none',
    financialConsequences: m.fin || 'none', expectedFinalState: m.final || 'as the checks state',
    evidence: `qa/sim/phase12-certification.mjs, ${group}; ${sc.asserts.length} checks`,
    actual: sc.pass ? `as expected (${sc.asserts.length} checks)` : `NOT as expected: ${failed.map((a) => `${a.what}${a.detail ? ` (${String(a.detail).slice(0, 140)})` : ''}`).join('; ').slice(0, 700)}`,
    observations: notes,
    result: sc.pass ? 'PASS' : 'FAIL',
  };
  return sc;
}

export const r2 = (v) => +Number(v).toFixed(2);
export const KEYS = ['BOOKS_BALANCE', 'INVENTORY', 'RECEIVABLES', 'IN_TRANSIT'];
/** The books agree with the records: the reconciliation ran and each main check matches. */
export async function agrees(ok, label, who = hq('CFO', 0)) {
  const r = await reconcile(who);
  ok(`${label}: the reconciliation ran`, r.status === 201, `${r.status}`);
  for (const k of KEYS) { const x = r.of(k); ok(`${label}: ${k} agrees`, x && x.status === 'MATCH', x ? `${x.status} ${x.difference} ${x.status === 'MATCH' ? '' : JSON.stringify(x.detail || '').slice(0, 160)}` : 'no such check'); }
  return r;
}
export const sumNets = (g) => Object.values(g).reduce((a, x) => a + x, 0);
