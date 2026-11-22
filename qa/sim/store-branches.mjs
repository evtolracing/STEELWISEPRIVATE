// The web store, the promise check and the branch comparison on real branches (2026-11-22). Before this they
// ran on four made-up locations kept in the browser. Runs against a QA server and checks every answer against
// the database.
//   node qa/sim/store-branches.mjs [--base http://localhost:3011]
import { prismaClient, api } from './lib.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
const prisma = prismaClient();
const A = api(BASE);
let pass = 0; const failed = [];
const check = (name, ok, detail) => { if (ok) pass++; else failed.push(`${name}${detail !== undefined ? ` — ${detail}` : ''}`); };
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

for (const who of ['admin', 'csr', 'branchA', 'custA']) await A.login(who);
const SETTING = 'online.cutoffRules';
const before = await prisma.appSetting.findUnique({ where: { key: SETTING } });
const shapingBefore = await prisma.appSetting.findUnique({ where: { key: 'demandShaping.config' } });
const selling = await prisma.location.findMany({ where: { isActive: true, isBranch: true, sellsFrom: true } });
const sfx = Date.now().toString(36);
const owner = selling[0].ownerId;
// Three locations the store must not list: a storage area, a branch switched off, a branch that does not sell.
const hidden = await Promise.all([
  prisma.location.create({ data: { code: `T-SB-R-${sfx}`, name: 'Sim rack', type: 'RACK', ownerId: owner, isBranch: false } }),
  prisma.location.create({ data: { code: `T-SB-O-${sfx}`, name: 'Sim closed branch', type: 'WAREHOUSE', ownerId: owner, isBranch: true, isActive: false } }),
  prisma.location.create({ data: { code: `T-SB-N-${sfx}`, name: 'Sim no-sales branch', type: 'WAREHOUSE', ownerId: owner, isBranch: true, sellsFrom: false } }),
]);

try {
  // ── The store's branches ──
  const list = await A.get('/api/ecom/branches', 'custA');
  check('a customer login reads the branches the store sells from', list.status === 200 && same(list.body.data.map((b) => b.id), selling.map((b) => b.id)), `${list.status} ${list.body?.data?.length} of ${selling.length}`);
  check('no made-up location is listed', !list.body.data.some((b) => /^loc-\d/.test(b.id) || ['Detroit', 'Kalamazoo', 'Grand Rapids'].includes(b.name)));
  check('a storage area, a closed branch and a branch that does not sell are left out', !list.body.data.some((b) => hidden.some((h) => h.id === b.id)));

  // ── Cut-off rules ──
  await prisma.appSetting.deleteMany({ where: { key: SETTING } });
  const blank = await A.get('/api/ecom/cutoff-rules', 'custA');
  check('every selling branch has a rule, not set and promising nothing until saved', blank.status === 200 && same(blank.body.data.map((r) => r.locationId), selling.map((b) => b.id))
    && blank.body.data.every((r) => r.isSet === false && Object.values(r.divisionRules).every((d) => d.nextDayEnabled === false)));
  const target = selling[0], other = selling[1];
  const rule = { divisionRules: { METALS: { cutoffLocal: '14:45', nextDayEnabled: true, shipDays: [1, 2, 3, 4, 5], pickupSameDayEnabled: true } }, blackoutWindows: [{ start: '2027-07-03', end: '2027-07-04', reason: 'Holiday' }], notes: 'sim' };
  const url = (id) => `/api/admin/online-settings/cutoff-rules/${id}`;
  for (const who of ['csr', 'branchA', 'custA']) {
    const no = await A.put(url(target.id), rule, who);
    check(`${who} cannot save cut-off rules`, no.status === 403, `${no.status}`);
  }
  check('nothing was saved by the refused attempts', (await prisma.appSetting.findUnique({ where: { key: SETTING } })) === null);
  check('a time that is not a time is refused', (await A.put(url(target.id), { divisionRules: { METALS: { ...rule.divisionRules.METALS, cutoffLocal: '3pm' } } })).status === 400);
  check('next-day shipping with no ship day is refused', (await A.put(url(target.id), { divisionRules: { METALS: { ...rule.divisionRules.METALS, shipDays: [] } } })).status === 400);
  check('a location that is not on file is refused', (await A.put(url('loc-1'), rule)).status === 404);
  check('a storage area is refused', (await A.put(url(hidden[0].id), rule)).status === 404);
  const saved = await A.put(url(target.id), rule);
  const stored = (await prisma.appSetting.findUnique({ where: { key: SETTING } }))?.value || {};
  check('an administrator saves the rule for one branch', saved.status === 200 && saved.body.data.isSet === true && stored[target.id]?.divisionRules.METALS.cutoffLocal === '14:45' && Object.keys(stored).length === 1, `${saved.status}`);
  const one = await A.get(`/api/ecom/cutoff-rules/${target.id}`, 'custA');
  check('the store reads the saved rule with the branch\'s own name and time zone', one.body.data.isSet && one.body.data.locationName === target.name && one.body.data.timezone === target.timezone
    && one.body.data.divisionRules.METALS.cutoffLocal === '14:45' && one.body.data.divisionRules.PLASTICS.nextDayEnabled === false && one.body.data.blackoutWindows.length === 1);
  check('the other branches stay not set', (await A.get(`/api/ecom/cutoff-rules/${other.id}`, 'custA')).body.data.isSet === false);
  check('a location the store does not sell from has no rule', (await A.get(`/api/ecom/cutoff-rules/${hidden[2].id}`, 'custA')).body.data === null);
  const logged = await prisma.auditLog.findFirst({ where: { action: 'cutoffRules.update', resourceId: target.id }, orderBy: { timestamp: 'desc' } }).catch(() => null)
    || await prisma.auditLog.findFirst({ where: { action: 'cutoffRules.update', resourceId: target.id } });
  check('the change is in the audit log', Boolean(logged));

  // ── Branch comparison ──
  const cmp = await A.post('/api/ecom/branch-comparison', { division: 'METALS' }, 'csr');
  const sug = cmp.body?.suggestions || [];
  check('the comparison ranks the real selling branches, and only those', cmp.status === 200 && same(sug.map((s) => s.locationId), selling.map((b) => b.id)), `${cmp.status} ${sug.length}`);
  check('the best is first and marked', sug.every((s, i) => s.rank === i + 1 && s.recommended === (i === 0) && (i === 0 || sug[i - 1].score >= s.score)));
  const count = (id) => prisma.inventory.count({ where: { status: 'ACTIVE', qtyAvailable: { gt: 0 }, locationId: id, coil: { status: 'AVAILABLE', product: { division: 'METALS' } } } });
  const sample = [sug[0], sug[Math.floor(sug.length / 2)], sug[sug.length - 1]];
  const counts = await Promise.all(sample.map((s) => count(s.locationId)));
  check('the stock shown for a branch is the stock on file there', sample.every((s, i) => s.inventory.totalQty === counts[i] && s.inventory.available === counts[i] > 0), `${sample.map((s) => s.inventory.totalQty)} vs ${counts}`);
  check('the branch with a saved rule shows its cut-off, the others say not set', sug.find((s) => s.locationId === target.id).cutoff.isSet === true && sug.filter((s) => s.locationId !== target.id).every((s) => s.cutoff.isSet === false && s.cutoff.cutoffLocal === null));
  const held = await A.post('/api/ecom/branch-comparison', { division: 'METALS' }, 'branchA');
  check('a person held to one branch gets the same counts for every branch', JSON.stringify(held.body.suggestions.map((s) => [s.locationId, s.inventory.totalQty]).sort()) === JSON.stringify(sug.map((s) => [s.locationId, s.inventory.totalQty]).sort()));
  const without = await A.post('/api/ecom/branch-comparison', { division: 'METALS', excludeLocationId: target.id, requiredProcessing: ['NO-SUCH-PROCESS'] }, 'csr');
  check('a branch can be left out, and a process no branch has is reported missing', !without.body.suggestions.some((s) => s.locationId === target.id) && without.body.suggestions.every((s) => s.processing.capable === false && s.processing.missingOps[0] === 'NO-SUCH-PROCESS'));
  check('the old simple cut-off list is gone', (await A.get('/api/admin/online-settings/cutoffs')).status === 404);
  // ── Demand shaping: branch load from the plan, never typed in ──
  const cfg = await A.get('/api/demand-shaping/config');
  const loads = cfg.body?.data?.branches || {};
  check('demand shaping lists the real selling branches by code', cfg.status === 200 && same(Object.keys(loads), selling.map((b) => b.code)), `${cfg.status} ${Object.keys(loads).length}`);
  check('no made-up branch is in the load table', !['JACKSON', 'DETROIT', 'KALAMAZOO', 'GRAND_RAPIDS'].some((k) => loads[k]?.id?.startsWith('loc-')) && Object.values(loads).every((b) => selling.some((x) => x.id === b.id)));
  const machines = async (id) => prisma.workCenter.count({ where: { locationId: id, isActive: true } });
  const some = Object.values(loads).slice(0, 6);
  const onFile = await Promise.all(some.map((b) => machines(b.id)));
  check('each branch shows the machines on file, and no load figure where it has none', some.every((b, i) => b.machines === onFile[i] && (onFile[i] > 0 ? b.load !== null && b.load >= 0 : b.load === null && b.queueDays === null)), `${some.map((b) => b.machines)} vs ${onFile}`);
  // Book one machine's whole week at a branch and the figure moves by exactly that much.
  const busy = Object.values(loads).find((b) => b.machines > 0);
  if (busy) {
    const start = new Date(Date.now() + 3600000);
    const job = await prisma.job.create({ data: { jobNumber: `QA-SB-${sfx}`, status: 'SCHEDULED' } });
    const plan = await prisma.dispatchJob.create({ data: { jobId: job.id, jobNumber: job.jobNumber, locationId: busy.id } });
    await prisma.dispatchOperation.create({ data: { dispatchJobId: plan.id, sequence: 1, name: 'Sim cut', requiredWorkCenterType: 'SAW', scheduledStart: start, scheduledEnd: new Date(start.getTime() + 10 * 3600000) } });
    const now2 = (await A.get('/api/demand-shaping/config')).body.data.branches;
    const mine = Object.values(now2).find((b) => b.id === busy.id);
    check('ten booked hours raise the branch\'s booked hours by ten', Math.abs(mine.bookedHours - busy.bookedHours - 10) < 0.2, `${busy.bookedHours} -> ${mine.bookedHours}`);
    check('load is booked hours over machines x 50', Math.abs(mine.load - Math.round((mine.bookedHours / (mine.machines * 50)) * 100) / 100) <= 0.01, `${mine.load}`);
    await prisma.job.delete({ where: { id: job.id } });
  }
  const put = await A.put('/api/demand-shaping/config', { highLoadThreshold: 0.8, branches: { FAKE: { id: 'loc-9', name: 'Fake', load: 1, queueDays: 9 } } });
  const kept = await prisma.appSetting.findUnique({ where: { key: 'demandShaping.config' } });
  check('a load table sent by hand is ignored and never saved', put.status === 200 && !put.body.data.branches.FAKE && !kept?.value?.branches, `${put.status}`);
  const made = await A.post('/api/demand-shaping/suggestions', { branchKey: 'loc-2', priority: 'STANDARD', division: 'METALS', lines: [], source: 'CSR' }, 'csr');
  check('a made-up branch gets no load-based suggestion', made.status === 200 && !made.body.data.some((s) => ['ALT_BRANCH', 'OFF_PEAK'].includes(s.type)), `${made.status} ${made.body?.data?.map((s) => s.type)}`);
} finally {
  await prisma.location.deleteMany({ where: { id: { in: hidden.map((h) => h.id) } } });
  await prisma.appSetting.deleteMany({ where: { key: SETTING } });
  if (before) await prisma.appSetting.create({ data: { key: SETTING, value: before.value } });
  await prisma.appSetting.deleteMany({ where: { key: 'demandShaping.config' } });
  if (shapingBefore) await prisma.appSetting.create({ data: { key: 'demandShaping.config', value: shapingBefore.value } });
  await prisma.job.deleteMany({ where: { jobNumber: `QA-SB-${sfx}` } });
  await prisma.auditLog.deleteMany({ where: { action: 'cutoffRules.update', details: { path: ['notes'], equals: 'sim' } } }).catch(() => {});
  await prisma.$disconnect();
}
console.log(`store branches: ${pass} passed, ${failed.length} failed`);
for (const f of failed) console.log(`  FAILED: ${f}`);
process.exit(failed.length ? 1 : 0);
