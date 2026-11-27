/**
 * Builds the whole working inventory from fixed rules: products, store listings, heats, stocked pieces at the five
 * branches, and Steel Outlet pieces. Running it again gives exactly the same tags, heats, weights and prices, so
 * the SQL Editor files made from it are the same every time (scripts/working-inventory-sql.js).
 */
import { grades, gradeByCode } from './grades.js';
import { mills, millsFor } from './mills.js';
import { buildProducts, densityOf, inch } from './products.js';
import { buildSupplies } from './supplies.js';

/** The day the data set is dated from. Every date in it is counted back from here, never from today. */
export const AS_OF = new Date('2026-11-26T12:00:00Z');

export const BRANCHES = [
  { code: 'JX', name: 'Jackson Steel' },
  { code: 'BC', name: 'Battle Creek' },
  { code: 'PV', name: 'Potterville' },
  { code: 'L2', name: 'Lansing Steel' },
  { code: 'CT', name: 'Charlotte' },
];
// Where each category leans: Charlotte carries the most plate, Lansing Steel the most structural and long product.
const LEAN = {
  'carbon-plate': { CT: 4, JX: 2, BC: 1, PV: 1, L2: 1 },
  'stainless-flat': { CT: 3, JX: 2, BC: 1, PV: 1, L2: 1 },
  'aluminum-flat': { CT: 3, JX: 2, BC: 1, PV: 1, L2: 1 },
  structural: { L2: 4, JX: 2, BC: 1, PV: 1, CT: 1 },
  'tube-pipe': { L2: 4, JX: 2, BC: 1, PV: 1, CT: 1 },
  'carbon-alloy-bar': { L2: 3, JX: 2, BC: 1, PV: 1, CT: 1 },
};

/** Small seeded generator (mulberry32), so every run draws the same numbers. */
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    between: (lo, hi) => lo + next() * (hi - lo),
    int: (lo, hi) => Math.floor(lo + next() * (hi - lo + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    weighted: (weights) => {
      const entries = Object.entries(weights);
      let r = next() * entries.reduce((s, [, w]) => s + w, 0);
      for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
      return entries[entries.length - 1][0];
    },
  };
}

const r2 = (n) => Math.round(n * 100) / 100;
const r3 = (n) => Math.round(n * 1000) / 1000;
const r4 = (n) => Math.round(n * 10000) / 10000;
const DAY = 86400000;
const daysBefore = (date, days) => new Date(date.getTime() - Math.round(days) * DAY);
const isoDay = (d) => d.toISOString().slice(0, 10);

const MELT = {
  'CLIFFS-BURNS-HARBOR': 'BOF', 'CLIFFS-DEARBORN': 'BOF',
  'NAS-GHENT': 'AOD', 'OUTOKUMPU-CALVERT': 'AOD', 'VALBRUNA-FT-WAYNE': 'AOD', 'CARPENTER-READING': 'AOD',
};
const INGOT = new Set(['FINKL-STEEL', 'CARPENTER-READING']);
const STEEL = new Set(['CARBON', 'ALLOY', 'HSLA', 'STAINLESS', 'TOOL']);

function chemistryOf(g, R) {
  if (!g.chemistryMax && !g.chemistryMin) return null;
  const out = {};
  const max = g.chemistryMax || {};
  const min = g.chemistryMin || {};
  for (const el of new Set([...Object.keys(min), ...Object.keys(max)])) {
    let v;
    if (max[el] != null && min[el] != null) v = min[el] + R.between(0.1, 0.9) * (max[el] - min[el]);
    else if (max[el] != null) v = max[el] * R.between(0.3, 0.9);
    else v = min[el] + R.between(0, 0.08);
    out[el] = v >= 10 ? r2(v) : r3(v);
  }
  return out;
}

function propsOf(g, R) {
  const out = {};
  if (g.tensileMin) out['Tensile (psi)'] = Math.round(Math.min(g.tensileMin * R.between(1.03, 1.18), g.tensileMax ? g.tensileMax * 0.98 : Infinity) / 100) * 100;
  if (g.yieldMin) out['Yield (psi)'] = Math.round(Math.min(g.yieldMin * R.between(1.04, 1.22), (out['Tensile (psi)'] || Infinity) * 0.95, g.yieldMax ? g.yieldMax * 0.98 : Infinity) / 100) * 100;
  if (g.elongationMin) out['Elongation (%)'] = r2(g.elongationMin * R.between(1.05, 1.45));
  if (g.hardnessMin || g.hardnessMax) {
    const lo = g.hardnessMin || g.hardnessMax * 0.75;
    const hi = g.hardnessMax || g.hardnessMin * 1.2;
    out['Hardness (HBW)'] = Math.round(lo + R.between(0.15, 0.85) * (hi - lo));
  }
  return Object.keys(out).length ? out : null;
}

/** One piece's sizes and weight for its product's form. */
function shapePiece(p, R) {
  const rho = densityOf(p.family, p.gradeCode);
  if (p.form === 'COIL') {
    const perInch = p.family === 'Stainless Steel' ? R.between(140, 380) : R.between(180, 520);
    const weight = Math.round((p.w * perInch) / 10) * 10;
    const id = 20;
    const od = Math.sqrt(id * id + (4 * weight) / (Math.PI * p.w * rho));
    return { t: p.t, w: p.w, l: null, od: Math.round(od * 10) / 10, id, weight };
  }
  if (p.form === 'SHEET') {
    const cap = p.division === 'PLASTICS' ? 25 : 120;
    const sheets = Math.max(3, Math.min(cap, Math.round(R.between(1200, 4800) / p.pieceLb)));
    return { t: p.t, w: p.w, l: p.l, weight: r2(sheets * p.pieceLb), sheets };
  }
  if (p.form === 'PLATE') {
    // About one plate in six is a part plate left after earlier cutting.
    const l = R.next() < 0.16 ? Math.max(24, Math.round((p.l * R.between(0.35, 0.8)) / 12) * 12) : p.l;
    return { t: p.t, w: p.w, l, weight: r2(p.t * p.w * l * rho) };
  }
  // Long product: a full length, or about one in seven a short length back on the rack.
  const l = R.next() < 0.14 && p.l > 24 ? Math.max(12, Math.round((p.l * R.between(0.3, 0.8)) / 12) * 12) : p.l;
  return { t: p.t, w: p.w, l, od: p.od, weight: r2((p.lbPerFt * l) / 12) };
}

function binFor(form, R) {
  const n = (lo, hi) => String(R.int(lo, hi)).padStart(2, '0');
  if (form === 'PLATE') return `PL-${R.pick(['A', 'B', 'C', 'D', 'E', 'F'])}${n(1, 24)}`;
  if (form === 'SHEET') return `SH-${R.pick(['A', 'B', 'C'])}${n(1, 30)}`;
  if (form === 'COIL') return `CB-${n(1, 18)}`;
  if (form === 'SUPPLY') return `S${R.int(1, 6)}-${n(1, 12)}`;
  return `R${n(1, 40)}-${R.pick(['A', 'B', 'C', 'D', 'E'])}`;
}

const HOLD_REASONS = [
  ['DAMAGE', 'Edge damage found at receiving. Hold until the yard checks it.'],
  ['PENDING_TEST', 'Mill test report did not come with the load. Hold until it is on file.'],
  ['QUALITY', 'Surface rust on the top sheets. Quality to decide.'],
];

export function buildInventory() {
  const R = rng(20261126);
  const metals = buildProducts();
  const supplies = buildSupplies();
  const products = [...metals, ...supplies].map((p, i) => ({ ...p, sortOrder: i + 1 }));

  // Pieces: 1 to 3 per product spread by the category's lean; every fifth product and every featured one also
  // sits at all five branches, so a common size can be planned anywhere.
  const pieces = [];
  const seq = Object.fromEntries(BRANCHES.map((b) => [b.code, 100000]));
  for (const [i, p] of products.entries()) {
    const lean = LEAN[p.categoryKey] || { JX: 1, BC: 1, PV: 1, L2: 1, CT: 1 };
    const at = Array.from({ length: R.int(1, 3) }, () => R.weighted(lean));
    if (i % 5 === 0 || p.featured) at.push(...BRANCHES.map((b) => b.code));
    for (const branch of at) {
      const shape = p.form === 'SUPPLY'
        ? (() => { const qty = R.int(6, 120); return { qty, weight: r2(qty * p.unitLb) }; })()
        : shapePiece(p, R);
      pieces.push({ product: p, branch, ...shape, bin: binFor(p.form, R) });
    }
  }

  // Heats: pieces of one grade share heats, a product drawing on one or two of its grade's heats.
  const byGrade = new Map();
  for (const pc of pieces) if (pc.product.gradeCode) (byGrade.get(pc.product.gradeCode) || byGrade.set(pc.product.gradeCode, []).get(pc.product.gradeCode)).push(pc);
  const heats = [];
  const millSeq = Object.fromEntries(mills.map((m) => [m.code, 0]));
  for (const g of grades) {
    const list = byGrade.get(g.code) || [];
    if (!list.length) continue;
    const pool = [];
    const count = Math.max(2, Math.ceil(list.length / 7));
    const makers = millsFor(g.code);
    for (let k = 0; k < count; k++) {
      const mill = makers[k % makers.length];
      millSeq[mill.code] += 1;
      const castDate = daysBefore(AS_OF, R.between(45, 420));
      pool.push({
        heatNumber: mill.heat(millSeq[mill.code]), millCode: mill.code, gradeCode: g.code, castDate,
        meltType: STEEL.has(g.family) ? (MELT[mill.code] || 'EAF') : null,
        castType: STEEL.has(g.family) ? (INGOT.has(mill.code) ? 'INGOT' : 'CONTINUOUS') : null,
        chemistry: chemistryOf(g, R), mechanicalProps: propsOf(g, R), totalWeightLb: 0, plastic: g.family === 'PLASTIC',
      });
    }
    const productHeats = new Map();
    for (const pc of list) {
      if (!productHeats.has(pc.product.sku)) {
        const a = R.pick(pool);
        productHeats.set(pc.product.sku, R.next() < 0.45 ? [a, R.pick(pool)] : [a]);
      }
      pc.heat = R.pick(productHeats.get(pc.product.sku));
      pc.heat.totalWeightLb += pc.weight;
    }
    heats.push(...pool);
  }
  for (const h of heats) h.totalWeightLb = Math.max(2000, Math.round((h.totalWeightLb * R.between(3, 9)) / 100) * 100);

  // Dates, tags, holds and cost.
  pieces.sort((a, b) => BRANCHES.findIndex((x) => x.code === a.branch) - BRANCHES.findIndex((x) => x.code === b.branch));
  for (const pc of pieces) {
    const earliest = pc.heat ? Math.max(3, (AS_OF - pc.heat.castDate) / DAY - R.between(12, 40)) : R.between(3, 200);
    pc.receivedAt = daysBefore(AS_OF, R.between(2, Math.max(3, earliest)));
    seq[pc.branch] += 1;
    pc.tag = `${pc.branch}-${String(pc.receivedAt.getUTCFullYear()).slice(2)}-${seq[pc.branch]}`;
    pc.unitCost = r4(pc.product.cost * R.between(0.96, 1.04));
    pc.hold = pc.product.form !== 'SUPPLY' && R.next() < 0.02 ? R.pick(HOLD_REASONS) : null;
  }

  // Steel Outlet: 100 drops and offcuts cut from stocked material, at real branches.
  const outletFrom = products.filter((p) => ['carbon-plate', 'stainless-flat', 'aluminum-flat', 'carbon-alloy-bar', 'stainless-long', 'aluminum-long', 'plastic-sheet', 'plastic-rod-tube', 'red-metals', 'tool-steel'].includes(p.categoryKey) && p.form !== 'COIL');
  const heatsOf = new Map();
  for (const h of heats) (heatsOf.get(h.gradeCode) || heatsOf.set(h.gradeCode, []).get(h.gradeCode)).push(h);
  const remnants = [];
  for (let k = 1; k <= 100; k++) {
    const p = outletFrom[Math.floor(R.next() * outletFrom.length)];
    const branch = BRANCHES[R.int(0, BRANCHES.length - 1)];
    const rho = densityOf(p.family, p.gradeCode);
    const flatPiece = ['PLATE', 'SHEET'].includes(p.form);
    const width = flatPiece ? Math.min(p.w, R.int(8, 40)) : p.w || 0;
    const length = flatPiece ? R.int(12, Math.min(72, p.l)) : R.int(12, Math.min(72, p.l));
    const weight = flatPiece ? p.t * width * length * rho : (p.lbPerFt * length) / 12;
    const type = R.weighted({ DROP: 5, OFFCUT: 3, OVERRUN: 1, RETURN: 1 });
    const condition = R.weighted({ A: 6, B: 3, C: 1 });
    const shape = p.name.replace(/ x \d+ ft$| x \d+"$/, '').replace(/ \d+" x \d+" x \d+"$/, '');
    const kind = { DROP: 'Drop', OFFCUT: 'Offcut', OVERRUN: 'Overrun', RETURN: 'Return' }[type];
    const dims = flatPiece ? `${inch(p.t)}" x ${width}" x ${length}"` : `${length}" long`;
    const ageDays = R.int(2, 180);
    remnants.push({
      id: `out-${String(k).padStart(4, '0')}`,
      sku: `OUT-${branch.code}-${String(k).padStart(4, '0')}`,
      name: `${flatPiece ? shape.replace(/ (Sheet|Plate)( HRAP)?.*$/, ' $1$2') : shape} ${kind}: ${dims}`,
      grade: p.gradeCode, spec: p.specStandard, form: p.form, family: p.family, type, condition,
      thickness: p.t, width, length, uom: 'IN', estimatedWeight: r2(weight),
      pricePerLb: r4(p.price * 0.7), location: branch.code, locationName: branch.name,
      heatNumber: R.pick(heatsOf.get(p.gradeCode) || [{ heatNumber: null }]).heatNumber,
      cutDate: daysBefore(AS_OF, ageDays), qtyAvailable: type === 'OVERRUN' ? R.int(2, 6) : 1,
      notes: {
        A: 'Clean saw cut, prime surface. Full mill certification on file.',
        B: 'Light surface marks from handling. Usable as is for most work.',
        C: 'Rough torch edge on one side. Price reflects trim allowance.',
      }[condition],
    });
  }

  return { grades, mills, products, heats, pieces, remnants, asOf: isoDay(AS_OF) };
}

/** Store listing values for a product (family, tags, size choices). */
export function listingFor(p) {
  const upTo = (list, max) => list.filter((v) => v <= max + 1e-9).map(String);
  if (p.form === 'SUPPLY') return { family: p.family, tags: p.tags, featured: p.featured, sortOrder: p.sortOrder, leadTimeDays: 1, thicknessOptions: [], widthOptions: [], lengthOptions: [], allowCutToSize: false, allowProcessing: false };
  const flatForm = ['PLATE', 'SHEET', 'COIL'].includes(p.form);
  return {
    family: p.family, tags: p.tags, featured: p.featured, sortOrder: p.sortOrder, leadTimeDays: 1,
    thicknessOptions: [String(p.t)],
    widthOptions: flatForm ? upTo([12, 24, 36, 48, 60, 72, 96, 120], p.w) : [],
    lengthOptions: p.form === 'COIL' ? ['48', '96', '120', '144'] : upTo([6, 12, 24, 36, 48, 72, 96, 120, 144, 240, 288, 480], p.l || 0),
    allowCutToSize: true, allowProcessing: true,
  };
}

export { gradeByCode };
