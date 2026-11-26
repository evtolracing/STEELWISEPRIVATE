/**
 * The working inventory catalog (owner, 2026-11-26: "100 sizes and or types per catagory just need a good working
 * inventory"). Thirteen categories of 100 products each, named the way a metals service center lists stock, plus
 * industrial supplies. Every product is one orderable size.
 *
 * Weights: flat products from thickness x width x length x density; long products carry `lbPerFt`, worked out
 * from the shape (round, square, hex, flat, angle, channel, tube, pipe) or, for rolled channels and beams, read
 * from the designation (W8x31 weighs 31 lb/ft). Costs and prices are per pound, typical of late 2026.
 */
import { gradeByCode } from './grades.js';

import { DENSITY, densityFor as densityOf } from '../../lib/materialDensity.js';

export { DENSITY, densityOf };

const r4 = (n) => Math.round(n * 10000) / 10000;
const r2 = (n) => Math.round(n * 100) / 100;

/** 0.375 -> 3/8, 1.25 -> 1-1/4, 0.065 -> .065 (decimals that are not a 64th stay decimals). */
export function inch(x) {
  const whole = Math.floor(x + 1e-9);
  const frac = x - whole;
  if (frac < 1e-6) return `${whole}`;
  for (const d of [2, 4, 8, 16, 32, 64]) {
    const n = Math.round(frac * d);
    if (Math.abs(frac - n / d) < 1e-6) return whole ? `${whole}-${n}/${d}` : `${n}/${d}`;
  }
  return whole ? `${x}` : `${x}`.replace(/^0/, '');
}
const q = (x) => `${inch(x)}"`;
const dec = (x) => String(Math.round(x * 1000)).padStart(4, '0');
const ft = (inches) => `${Math.round(inches / 12)} ft`;

/** Pick n spread evenly through the list, keeping its order. */
export function pick(list, n) {
  if (list.length <= n) return list;
  const step = list.length / n;
  return Array.from({ length: n }, (_, i) => list[Math.floor(i * step)]);
}

// Gauge to decimal inches.
const GAUGE = {
  carbon: { 7: 0.1793, 10: 0.1345, 11: 0.1196, 12: 0.1046, 14: 0.0747, 16: 0.0598, 18: 0.0478, 20: 0.0359, 22: 0.0299, 24: 0.0239 },
  galv: { 10: 0.1382, 12: 0.1084, 14: 0.0785, 16: 0.0635, 18: 0.0516, 20: 0.0396, 22: 0.0336, 24: 0.0276 },
  stainless: { 7: 0.1875, 10: 0.135, 11: 0.12, 12: 0.105, 14: 0.075, 16: 0.06, 18: 0.048, 20: 0.036, 22: 0.03, 24: 0.024, 26: 0.018 },
};

// Cost and list price per lb by grade, with an uplift for light sizes.
const COST = {
  A36: 0.47, 'A572-50': 0.52, 'A516-70': 0.61, 'A514-T1': 1.18, AR400: 1.12, AR500: 1.34,
  'A1011-CS': 0.42, 'A1008-CS': 0.5, 'A653-G90': 0.56, 'A653-A40': 0.58,
  1018: 0.63, 1045: 0.71, 1144: 0.88, '12L14': 0.84, 4140: 0.96, '4140-HT': 1.12, 4340: 1.38, 8620: 1.06,
  A992: 0.5, 'A529-50': 0.52, 'A500-B': 0.68, 'A500-C': 0.71, 'A513-DOM': 1.08, 'A53-B': 0.74,
  304: 1.86, '304L': 1.9, 316: 2.58, '316L': 2.62, 430: 1.32, 201: 1.48, 303: 2.42, 410: 2.1, 416: 2.25, '17-4PH': 4.4,
  '3003-H14': 2.38, '3003-H22': 2.55, '5052-H32': 2.68, '6061-T6': 2.86, '6061-T651': 2.92, '6061-T6511': 2.8, '6063-T52': 2.5,
  '7075-T651': 5.15, '2024-T351': 4.95, 'AL-CAST-TP': 3.4,
  A2: 4.2, D2: 4.6, O1: 4.05, S7: 5.2, H13: 4.8, P20: 3.6,
  C360: 4.75, C260: 5.2, C464: 5.05, C110: 6.15, C932: 6.8, C954: 7.25,
  HDPE: 2.1, UHMW: 2.6, ACRYLIC: 3.2, PC: 4.2, 'PVC-1': 2.4, ABS: 3.1, ACETAL: 5.8, 'NYLON-66': 5.2, PTFE: 13.0, PEEK: 92.0, PP: 2.2,
};
function money(gradeCode, lb, extra = 1) {
  const light = lb < 1 ? 1.22 : lb < 3 ? 1.1 : 1;
  const cost = r4(COST[gradeCode] * light * extra);
  const margin = gradeCode === 'PEEK' || gradeCode === 'PTFE' ? 1.45 : 1.5;
  return { cost, price: r4(cost * margin) };
}

// Weight per foot of long shapes, in lb, for a density in lb/in3.
const perFt = {
  round: (d, rho) => (Math.PI / 4) * d * d * 12 * rho,
  square: (s, rho) => s * s * 12 * rho,
  hex: (s, rho) => 0.866 * s * s * 12 * rho,
  flat: (t, w, rho) => t * w * 12 * rho,
  angle: (a, b, t, rho) => (a + b - t) * t * 12 * rho,
  channel: (d, f, t, rho) => (d + 2 * f - 2 * t) * t * 12 * rho,
  roundTube: (od, wall, rho) => Math.PI * (od - wall) * wall * 12 * rho,
  rectTube: (a, b, wall, rho) => (2 * (a + b) - 4 * wall) * wall * 12 * rho,
};

function base(cat, { sku, name, gradeCode, family, form, productType, division = 'METALS', tags = [], featured = false }) {
  const g = gradeByCode[gradeCode];
  if (!g) throw new Error(`Grade ${gradeCode} is not in the grade list (${sku})`);
  return { sku, name, category: cat, family, gradeCode, specStandard: g.specStandard, form, productType, division, tags, featured };
}

/** A flat product: plate, sheet, or coil (coil has no length). */
function flat(cat, o) {
  const p = base(cat, o);
  const rho = densityOf(o.family, o.gradeCode);
  const pieceLb = o.l ? o.t * o.w * o.l * rho : null;
  const lbPerSqFt = o.t * 144 * rho;
  return {
    ...p, t: o.t, w: o.w, l: o.l || null, stockForm: o.form,
    pieceLb: pieceLb && r2(pieceLb), lbPerFt: null,
    description: o.description || `${o.specStandard || p.specStandard}. ${r2(lbPerSqFt)} lb per sq ft.`,
    ...money(o.gradeCode, pieceLb ?? 1000, o.extra),
  };
}

/** A long product: bar, rod, shape, tube or pipe, sold in a standard length. */
function long(cat, o) {
  const p = base(cat, o);
  return {
    ...p, t: o.t, w: o.w ?? null, l: o.l, od: o.od ?? null, wall: o.wall ?? null, stockForm: o.form,
    lbPerFt: r4(o.lbPerFt), pieceLb: r2((o.lbPerFt * o.l) / 12),
    description: o.description || `${p.specStandard}. ${r2(o.lbPerFt)} lb/ft, ${ft(o.l)} lengths.`,
    ...money(o.gradeCode, o.lbPerFt, o.extra),
  };
}

const cross = (a, b) => a.flatMap((x) => b.map((y) => [x, y]));

// 1. Carbon and HSLA plate
function carbonPlate() {
  const C = 'Carbon & HSLA Plate';
  const rows = [
    ['A36', 'A36 Hot Rolled Steel Plate', [0.1875, 0.25, 0.3125, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4], [[48, 96], [60, 120], [96, 240], [96, 288]], ['structural', 'weldable', 'plate']],
    ['A572-50', 'A572 Grade 50 Steel Plate', [0.25, 0.375, 0.5, 0.625, 0.75, 1, 1.25, 1.5, 2], [[96, 240], [96, 288]], ['hsla', 'structural', 'plate']],
    ['A516-70', 'A516-70 Pressure Vessel Plate', [0.25, 0.375, 0.5, 0.75, 1, 1.5], [[96, 240]], ['pressure vessel', 'plate', 'normalized']],
    ['A514-T1', 'A514 T-1 Type Quenched & Tempered Plate', [0.25, 0.5, 0.75, 1], [[96, 240]], ['high strength', 'q&t', 'plate']],
    ['AR400', 'AR400 Abrasion Resistant Plate', [0.1875, 0.25, 0.375, 0.5, 0.75, 1], [[96, 240]], ['abrasion resistant', 'wear', 'plate']],
    ['AR500', 'AR500 Abrasion Resistant Plate', [0.1875, 0.25, 0.375, 0.5], [[72, 144]], ['abrasion resistant', 'wear', 'targets']],
  ];
  const out = [];
  for (const [g, label, ts, sizes, tags] of rows) {
    for (const [t, [w, l]] of cross(ts, sizes)) {
      out.push(flat(C, { sku: `PL-${g}-${dec(t)}-${w}${l}`, name: `${label} ${q(t)} x ${w}" x ${l}"`, gradeCode: g, family: 'Carbon Steel', form: 'PLATE', productType: 'FLAT', t, w, l, tags, featured: g === 'A36' && w === 96 && l === 240 && (t === 0.5 || t === 0.25) }));
    }
  }
  return pick(out, 100);
}

// 2. Carbon sheet and coil
function carbonSheetCoil() {
  const C = 'Carbon Sheet & Coil';
  const out = [];
  const sheet = (g, label, table, gauges, sizes, tags, code) => {
    for (const [ga, [w, l]] of cross(gauges, sizes)) {
      const t = GAUGE[table][ga];
      out.push(flat(C, { sku: `SH-${code}-${ga}GA-${w}${l}`, name: `${label} Sheet ${ga} ga (${t}") x ${w}" x ${l}"`, gradeCode: g, family: 'Carbon Steel', form: 'SHEET', productType: 'FLAT', t, w, l, tags }));
    }
  };
  const coil = (g, label, table, gauges, widths, tags, code) => {
    for (const [ga, w] of cross(gauges, widths)) {
      const t = GAUGE[table][ga];
      out.push(flat(C, { sku: `CL-${code}-${ga}GA-${w}`, name: `${label} Coil ${ga} ga (${t}") x ${w}"`, gradeCode: g, family: 'Carbon Steel', form: 'COIL', productType: 'FLAT', t, w, tags: [...tags, 'coil'] }));
    }
  };
  sheet('A1011-CS', 'Hot Rolled Pickled & Oiled', 'carbon', [7, 10, 11, 12, 14, 16], [[48, 96], [48, 120], [60, 120]], ['hot rolled', 'p&o', 'sheet'], 'HRPO');
  coil('A1011-CS', 'Hot Rolled Pickled & Oiled', 'carbon', [7, 10, 12, 14, 16], [48, 60], ['hot rolled', 'p&o'], 'HRPO');
  coil('A1011-CS', 'Hot Rolled Pickled & Oiled', 'carbon', [10, 12, 14], [72], ['hot rolled', 'p&o'], 'HRPO');
  sheet('A1008-CS', 'Cold Rolled', 'carbon', [11, 12, 14, 16, 18, 20, 22, 24], [[48, 96], [48, 120], [36, 96]], ['cold rolled', 'sheet', 'formable'], 'CR');
  coil('A1008-CS', 'Cold Rolled', 'carbon', [14, 16, 18, 20], [48, 60], ['cold rolled'], 'CR');
  coil('A1008-CS', 'Cold Rolled', 'carbon', [16, 20, 24], [36], ['cold rolled'], 'CR');
  sheet('A653-G90', 'Galvanized G90', 'galv', [10, 12, 14, 16, 18, 20, 22, 24], [[48, 96], [48, 120]], ['galvanized', 'g90', 'corrosion resistant'], 'GALV');
  coil('A653-G90', 'Galvanized G90', 'galv', [16, 18, 20, 22], [48, 60], ['galvanized', 'g90'], 'GALV');
  sheet('A653-A40', 'Galvannealed A40', 'galv', [14, 16, 18, 20], [[48, 96], [48, 120]], ['galvannealed', 'paintable'], 'GALVN');
  coil('A653-A40', 'Galvannealed A40', 'galv', [16, 18], [48], ['galvannealed'], 'GALVN');
  out.filter((p) => p.sku === 'SH-HRPO-11GA-48120' || p.sku === 'SH-CR-16GA-48120').forEach((p) => { p.featured = true; });
  return pick(out, 100);
}

// 3. Carbon and alloy bar
function carbonAlloyBar() {
  const C = 'Carbon & Alloy Bar';
  const rho = DENSITY['Carbon Steel'];
  const out = [];
  const rounds = (g, label, sizes, l, tags, code = 'RD', fam = 'Carbon Steel') => sizes.forEach((d) => out.push(long(C, { sku: `${code}-${g}-${dec(d)}`, name: `${label} Round Bar ${q(d)} dia x ${ft(l)}`, gradeCode: g, family: fam, form: 'BAR', productType: 'LONG', t: d, l, lbPerFt: perFt.round(d, rho), tags })));
  const squares = (g, label, sizes, l, tags) => sizes.forEach((s) => out.push(long(C, { sku: `SQ-${g}-${dec(s)}`, name: `${label} Square Bar ${q(s)} x ${ft(l)}`, gradeCode: g, family: 'Carbon Steel', form: 'BAR', productType: 'LONG', t: s, w: s, l, lbPerFt: perFt.square(s, rho), tags })));
  const hexes = (g, label, sizes, l, tags) => sizes.forEach((s) => out.push(long(C, { sku: `HX-${g}-${dec(s)}`, name: `${label} Hex Bar ${q(s)} across flats x ${ft(l)}`, gradeCode: g, family: 'Carbon Steel', form: 'BAR', productType: 'LONG', t: s, l, lbPerFt: perFt.hex(s, rho), tags })));
  const flats = (g, label, sizes, l, tags, code) => sizes.forEach(([t, w]) => out.push(long(C, { sku: `FL-${code}-${dec(t)}X${dec(w)}`, name: `${label} Flat Bar ${q(t)} x ${q(w)} x ${ft(l)}`, gradeCode: g, family: 'Carbon Steel', form: 'BAR', productType: 'LONG', t, w, l, lbPerFt: perFt.flat(t, w, rho), tags })));
  rounds('1018', '1018 Cold Finished', [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4], 144, ['cold finished', 'machinable', 'round']);
  squares('1018', '1018 Cold Finished', [0.5, 0.75, 1, 1.25, 1.5, 2], 144, ['cold finished', 'square']);
  flats('1018', '1018 Cold Finished', [[0.25, 1], [0.25, 2], [0.375, 1.5], [0.5, 1], [0.5, 2], [0.5, 3], [0.75, 2], [1, 2], [1, 3]], 144, ['cold finished', 'flat'], '1018CF');
  hexes('1018', '1018 Cold Finished', [0.5, 0.75, 1, 1.25], 144, ['cold finished', 'hex']);
  flats('A36', 'A36 Hot Rolled', [[0.125, 1], [0.1875, 1.5], [0.25, 1], [0.25, 1.5], [0.25, 2], [0.25, 3], [0.25, 4], [0.375, 2], [0.375, 3], [0.5, 2], [0.5, 3], [0.5, 4], [0.5, 6], [0.75, 4], [1, 4], [1, 6]], 240, ['hot rolled', 'flat', 'weldable'], 'A36HR');
  rounds('A36', 'A36 Hot Rolled', [0.5, 0.75, 1, 1.5, 2, 3], 240, ['hot rolled', 'round'], 'RDHR');
  [0.5, 0.75, 1, 1.5, 2].forEach((s) => out.push(long(C, { sku: `SQHR-A36-${dec(s)}`, name: `A36 Hot Rolled Square Bar ${q(s)} x 20 ft`, gradeCode: 'A36', family: 'Carbon Steel', form: 'BAR', productType: 'LONG', t: s, w: s, l: 240, lbPerFt: perFt.square(s, rho), tags: ['hot rolled', 'square'] })));
  rounds('1045', '1045 Turned Ground & Polished', [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6], 144, ['tg&p', 'shafting', 'round']);
  rounds('1144', '1144 Stress Proof Type', [0.75, 1, 1.25, 1.5, 2, 2.5, 3], 144, ['high strength', 'machinable', 'round']);
  rounds('12L14', '12L14 Cold Finished', [0.375, 0.5, 0.75, 1, 1.25, 1.5, 2], 144, ['free machining', 'screw machine', 'round']);
  hexes('12L14', '12L14 Cold Finished', [0.5, 0.75, 1], 144, ['free machining', 'hex']);
  rounds('4140', '4140 Annealed', [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8], 144, ['alloy', 'annealed', 'round'], 'RD', 'Alloy Steel');
  rounds('4140-HT', '4140 Heat Treated', [0.75, 1, 1.5, 2, 3, 4], 144, ['alloy', 'prehard', 'round'], 'RD', 'Alloy Steel');
  rounds('4340', '4340 Annealed', [1, 2, 3, 4], 144, ['alloy', 'high strength', 'round'], 'RD', 'Alloy Steel');
  rounds('8620', '8620 Hot Rolled', [1, 1.5, 2, 3], 144, ['alloy', 'carburizing', 'round'], 'RD', 'Alloy Steel');
  out.filter((p) => p.sku === 'RD-1018-1000' || p.sku === 'FL-A36HR-0250X2000').forEach((p) => { p.featured = true; });
  return pick(out, 100);
}

// 4. Structural
function structural() {
  const C = 'Structural Shapes';
  const rho = DENSITY['Carbon Steel'];
  const out = [];
  const angles = [[1, 1, 0.125], [1, 1, 0.1875], [1, 1, 0.25], [1.25, 1.25, 0.125], [1.25, 1.25, 0.1875], [1.25, 1.25, 0.25], [1.5, 1.5, 0.125], [1.5, 1.5, 0.1875], [1.5, 1.5, 0.25], [2, 2, 0.125], [2, 2, 0.1875], [2, 2, 0.25], [2, 2, 0.375], [2.5, 2.5, 0.1875], [2.5, 2.5, 0.25], [3, 3, 0.1875], [3, 3, 0.25], [3, 3, 0.375], [3, 3, 0.5], [4, 4, 0.25], [4, 4, 0.375], [4, 4, 0.5], [5, 5, 0.375], [5, 5, 0.5], [6, 6, 0.375], [6, 6, 0.5], [6, 6, 0.625], [3, 2, 0.25], [4, 3, 0.25], [4, 3, 0.375], [6, 4, 0.375], [5, 3, 0.3125]];
  for (const [a, b, t] of angles) out.push(long(C, { sku: `AN-A36-${dec(a)}X${dec(b)}X${dec(t)}`, name: `A36 Angle ${q(a)} x ${q(b)} x ${q(t)} x 20 ft`, gradeCode: 'A36', family: 'Carbon Steel', form: 'BAR', productType: 'STRUCTURAL', t: a, w: b, wall: t, l: 240, lbPerFt: perFt.angle(a, b, t, rho), tags: ['angle', 'structural'] }));
  const channels = ['C3x4.1', 'C3x5', 'C3x6', 'C4x5.4', 'C4x7.25', 'C5x6.7', 'C5x9', 'C6x8.2', 'C6x10.5', 'C6x13', 'C7x9.8', 'C7x12.25', 'C8x11.5', 'C8x13.75', 'C8x18.75', 'C9x13.4', 'C10x15.3', 'C10x20', 'C10x25', 'C12x20.7', 'C12x25', 'C12x30', 'C15x33.9', 'MC6x12', 'MC8x8.5', 'MC10x22', 'MC12x31'];
  for (const d of channels) {
    const [, depth, lb] = d.match(/^M?C(\d+)x([\d.]+)$/);
    const l = Number(depth) >= 8 ? 480 : 240;
    const g = d.startsWith('MC') ? 'A529-50' : 'A36';
    out.push(long(C, { sku: `CH-${g}-${d.toUpperCase()}`, name: `${g === 'A36' ? 'A36 Channel' : 'A529 Grade 50 Miscellaneous Channel'} ${d} x ${ft(l)}`, gradeCode: g, family: 'Carbon Steel', form: 'BEAM', productType: 'STRUCTURAL', t: Number(depth), l, lbPerFt: Number(lb), tags: ['channel', 'structural'] }));
  }
  const wf = ['W4x13', 'W5x16', 'W5x19', 'W6x9', 'W6x12', 'W6x15', 'W6x20', 'W6x25', 'W8x10', 'W8x13', 'W8x15', 'W8x18', 'W8x21', 'W8x24', 'W8x31', 'W8x35', 'W8x40', 'W10x12', 'W10x15', 'W10x19', 'W10x22', 'W10x26', 'W10x33', 'W10x45', 'W12x14', 'W12x16', 'W12x19', 'W12x22', 'W12x26', 'W12x30', 'W12x35', 'W12x40', 'W12x50', 'W14x22', 'W14x26', 'W14x30', 'W14x48', 'W16x26', 'W16x31', 'W18x35'];
  for (const d of wf) {
    const [, depth, lb] = d.match(/^W(\d+)x([\d.]+)$/);
    const l = Number(depth) <= 6 ? 240 : 480;
    out.push(long(C, { sku: `WF-A992-${d.toUpperCase()}`, name: `A992 Wide Flange Beam ${d} x ${ft(l)}`, gradeCode: 'A992', family: 'Carbon Steel', form: 'BEAM', productType: 'STRUCTURAL', t: Number(depth), l, lbPerFt: Number(lb), tags: ['wide flange', 'beam', 'structural'], featured: d === 'W8x31' }));
  }
  for (const d of ['S3x5.7', 'S4x7.7', 'S5x10', 'S6x12.5', 'S8x18.4', 'S10x25.4']) {
    const [, depth, lb] = d.match(/^S(\d+)x([\d.]+)$/);
    out.push(long(C, { sku: `IB-A36-${d.toUpperCase()}`, name: `A36 American Standard I-Beam ${d} x 20 ft`, gradeCode: 'A36', family: 'Carbon Steel', form: 'BEAM', productType: 'STRUCTURAL', t: Number(depth), l: 240, lbPerFt: Number(lb), tags: ['i-beam', 'beam', 'structural'] }));
  }
  out.filter((p) => p.sku === 'AN-A36-2000X2000X0250').forEach((p) => { p.featured = true; });
  return pick(out, 100);
}

// 5. Tube and pipe
function tubePipe() {
  const C = 'Tube & Pipe';
  const rho = DENSITY['Carbon Steel'];
  const out = [];
  const sq = [[1, [0.065, 0.083, 0.12]], [1.25, [0.083, 0.12]], [1.5, [0.083, 0.12, 0.188]], [2, [0.083, 0.12, 0.188, 0.25]], [2.5, [0.12, 0.188, 0.25]], [3, [0.12, 0.188, 0.25]], [4, [0.12, 0.188, 0.25, 0.375]], [5, [0.188, 0.25, 0.375]], [6, [0.188, 0.25, 0.375, 0.5]]];
  for (const [s, walls] of sq) for (const wall of walls) {
    const g = s >= 6 ? 'A500-C' : 'A500-B';
    out.push(long(C, { sku: `TS-${g}-${dec(s)}X${dec(s)}X${dec(wall)}`, name: `${g.replace('-', ' Gr ')} Square Tube ${q(s)} x ${q(s)} x ${wall}" wall x 24 ft`, gradeCode: g, family: 'Carbon Steel', form: 'TUBE', productType: 'TUBE', t: s, w: s, wall, l: 288, lbPerFt: perFt.rectTube(s, s, wall, rho), tags: ['square tube', 'hss', 'structural'], featured: s === 2 && wall === 0.12 }));
  }
  const rect = [[2, 1, [0.083, 0.12]], [3, 1, [0.12]], [3, 2, [0.12, 0.188, 0.25]], [4, 2, [0.12, 0.188, 0.25]], [4, 3, [0.188, 0.25]], [5, 3, [0.188, 0.25]], [6, 2, [0.188, 0.25]], [6, 3, [0.188, 0.25]], [6, 4, [0.188, 0.25, 0.375]], [8, 4, [0.25, 0.375]], [8, 6, [0.25, 0.375]], [10, 4, [0.25]]];
  for (const [a, b, walls] of rect) for (const wall of walls) {
    const g = a >= 6 ? 'A500-C' : 'A500-B';
    out.push(long(C, { sku: `TR-${g}-${dec(a)}X${dec(b)}X${dec(wall)}`, name: `${g.replace('-', ' Gr ')} Rectangular Tube ${q(a)} x ${q(b)} x ${wall}" wall x 24 ft`, gradeCode: g, family: 'Carbon Steel', form: 'TUBE', productType: 'TUBE', t: a, w: b, wall, l: 288, lbPerFt: perFt.rectTube(a, b, wall, rho), tags: ['rectangular tube', 'hss', 'structural'] }));
  }
  for (const [od, wall] of [[1, 0.065], [1, 0.12], [1.25, 0.083], [1.5, 0.083], [1.5, 0.12], [1.75, 0.12], [2, 0.12], [2, 0.188], [2.5, 0.12], [3, 0.12], [3, 0.188], [4, 0.188]]) {
    out.push(long(C, { sku: `RT-A500-B-${dec(od)}X${dec(wall)}`, name: `A500 Gr B Round Tube ${q(od)} OD x ${wall}" wall x 24 ft`, gradeCode: 'A500-B', family: 'Carbon Steel', form: 'TUBE', productType: 'TUBE', t: od, od, wall, l: 288, lbPerFt: perFt.roundTube(od, wall, rho), tags: ['round tube', 'structural'] }));
  }
  for (const [od, wall] of [[0.75, 0.065], [0.875, 0.065], [1, 0.083], [1, 0.12], [1.25, 0.12], [1.5, 0.12], [1.5, 0.188], [1.75, 0.12], [2, 0.12], [2, 0.25], [2.5, 0.25], [3, 0.25]]) {
    out.push(long(C, { sku: `DOM-${dec(od)}X${dec(wall)}`, name: `DOM Mechanical Tube ${q(od)} OD x ${wall}" wall x 20 ft`, gradeCode: 'A513-DOM', family: 'Carbon Steel', form: 'TUBE', productType: 'TUBE', t: od, od, wall, l: 240, lbPerFt: perFt.roundTube(od, wall, rho), tags: ['dom', 'mechanical tube', 'hydraulic'] }));
  }
  const nps = [['1/2', 0.84, 0.109, 0.147], ['3/4', 1.05, 0.113, 0.154], ['1', 1.315, 0.133, 0.179], ['1-1/4', 1.66, 0.14, 0.191], ['1-1/2', 1.9, 0.145, 0.2], ['2', 2.375, 0.154, 0.218], ['2-1/2', 2.875, 0.203, 0.276], ['3', 3.5, 0.216, 0.3], ['4', 4.5, 0.237, 0.337], ['6', 6.625, 0.28, 0.432], ['8', 8.625, 0.322, 0.5]];
  for (const [size, od, s40, s80] of nps) for (const [sch, wall] of [['40', s40], ['80', s80]]) {
    out.push(long(C, { sku: `PI-A53-${size.replace(/[-/]/g, '')}-S${sch}`, name: `A53 Gr B Black Pipe ${size}" Sch ${sch} (${od}" OD x ${wall}" wall) x 21 ft`, gradeCode: 'A53-B', family: 'Carbon Steel', form: 'TUBE', productType: 'TUBE', t: od, od, wall, l: 252, lbPerFt: perFt.roundTube(od, wall, rho), tags: ['pipe', `schedule ${sch}`, 'black pipe'] }));
  }
  return pick(out, 100);
}

// 6. Stainless sheet and plate
function stainlessFlat() {
  const C = 'Stainless Sheet & Plate';
  const out = [];
  const sheet = (g, finish, gauges, sizes, tags) => {
    for (const [ga, [w, l]] of cross(gauges, sizes)) {
      const t = GAUGE.stainless[ga];
      out.push(flat(C, { sku: `SS${g}-SH-${finish.replace('#', 'N')}-${ga}GA-${w}${l}`, name: `${g} Stainless Sheet ${finish} ${ga} ga (${t}") x ${w}" x ${l}"`, gradeCode: g, family: 'Stainless Steel', form: 'SHEET', productType: 'FLAT', t, w, l, tags: ['stainless', finish.toLowerCase(), ...tags], extra: finish === '#8' ? 1.35 : finish === '#4' ? 1.08 : 1 }));
    }
  };
  const plate = (g, ts, sizes, tags) => {
    for (const [t, [w, l]] of cross(ts, sizes)) out.push(flat(C, { sku: `SS${g}-PL-${dec(t)}-${w}${l}`, name: `${g} Stainless Plate HRAP ${q(t)} x ${w}" x ${l}"`, gradeCode: g, family: 'Stainless Steel', form: 'PLATE', productType: 'FLAT', t, w, l, tags: ['stainless', 'plate', 'hrap', ...tags] }));
  };
  const coil = (g, gauges, widths) => {
    for (const [ga, w] of cross(gauges, widths)) {
      const t = GAUGE.stainless[ga];
      out.push(flat(C, { sku: `SS${g}-CL-2B-${ga}GA-${w}`, name: `${g} Stainless Coil 2B ${ga} ga (${t}") x ${w}"`, gradeCode: g, family: 'Stainless Steel', form: 'COIL', productType: 'FLAT', t, w, tags: ['stainless', 'coil', '2b'] }));
    }
  };
  sheet('304', '2B', [24, 22, 20, 18, 16, 14, 12, 11, 10], [[48, 96], [48, 120]], ['food grade']);
  sheet('304', '#4', [24, 22, 20, 18, 16, 14], [[48, 96], [48, 120]], ['polished', 'food grade']);
  sheet('304', '#8', [24, 20, 18], [[48, 96]], ['mirror', 'decorative']);
  plate('304L', [0.1875, 0.25, 0.375, 0.5, 0.625, 0.75, 1, 1.25, 1.5, 2], [[48, 96], [60, 120]], ['dual certified']);
  sheet('316L', '2B', [24, 20, 18, 16, 14, 12, 11], [[48, 96], [48, 120]], ['marine', 'chemical resistant']);
  sheet('316', '#4', [20, 18, 16], [[48, 96]], ['marine', 'polished']);
  plate('316L', [0.1875, 0.25, 0.375, 0.5, 0.75, 1], [[48, 96], [60, 120]], ['marine', 'chemical resistant']);
  sheet('430', '#4', [24, 22, 20, 18, 16], [[48, 96], [48, 120]], ['ferritic', 'magnetic', 'appliance']);
  sheet('201', '2B', [20, 18, 16], [[48, 120]], ['economy']);
  coil('304', [26, 24, 22, 20, 18, 16], [36, 48]);
  out.filter((p) => p.sku === 'SS304-SH-N4-16GA-48120' || p.sku === 'SS304L-PL-0250-4896').forEach((p) => { p.featured = true; });
  return pick(out, 100);
}

// 7. Stainless bar, tube and angle
function stainlessLong() {
  const C = 'Stainless Bar, Tube & Angle';
  const rho = DENSITY['Stainless Steel'];
  const out = [];
  const L = (o) => out.push(long(C, { family: 'Stainless Steel', productType: o.productType || 'LONG', ...o }));
  const rounds = (g, ds, tags) => ds.forEach((d) => L({ sku: `SS${g}-RD-${dec(d)}`, name: `${g} Stainless Round Bar ${q(d)} dia x 12 ft`, gradeCode: g, form: 'BAR', t: d, l: 144, lbPerFt: perFt.round(d, rho), tags: ['stainless', 'round', ...tags] }));
  rounds('303', [0.25, 0.375, 0.5, 0.625, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4], ['free machining']);
  [0.5, 0.75, 1].forEach((s) => L({ sku: `SS303-HX-${dec(s)}`, name: `303 Stainless Hex Bar ${q(s)} across flats x 12 ft`, gradeCode: '303', form: 'BAR', t: s, l: 144, lbPerFt: perFt.hex(s, rho), tags: ['stainless', 'hex', 'free machining'] }));
  rounds('304', [0.25, 0.375, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6], ['general purpose']);
  [0.5, 0.75, 1, 1.5, 2].forEach((s) => L({ sku: `SS304-SQ-${dec(s)}`, name: `304 Stainless Square Bar ${q(s)} x 12 ft`, gradeCode: '304', form: 'BAR', t: s, w: s, l: 144, lbPerFt: perFt.square(s, rho), tags: ['stainless', 'square'] }));
  [[0.125, 1], [0.1875, 1], [0.25, 1], [0.25, 1.5], [0.25, 2], [0.25, 3], [0.375, 2], [0.5, 2], [0.5, 3], [0.5, 4]].forEach(([t, w]) => L({ sku: `SS304-FL-${dec(t)}X${dec(w)}`, name: `304 Stainless Flat Bar ${q(t)} x ${q(w)} x 12 ft`, gradeCode: '304', form: 'BAR', t, w, l: 144, lbPerFt: perFt.flat(t, w, rho), tags: ['stainless', 'flat'] }));
  [[1, 1, 0.125], [1.5, 1.5, 0.125], [1.5, 1.5, 0.1875], [2, 2, 0.125], [2, 2, 0.1875], [2, 2, 0.25], [3, 3, 0.25]].forEach(([a, b, t]) => L({ sku: `SS304-AN-${dec(a)}X${dec(b)}X${dec(t)}`, name: `304 Stainless Angle ${q(a)} x ${q(b)} x ${q(t)} x 20 ft`, gradeCode: '304', form: 'BAR', productType: 'STRUCTURAL', t: a, w: b, wall: t, l: 240, lbPerFt: perFt.angle(a, b, t, rho), tags: ['stainless', 'angle'] }));
  [[1, 0.065], [1.5, 0.065], [2, 0.083], [2, 0.12], [3, 0.12]].forEach(([s, wall]) => L({ sku: `SS304-TS-${dec(s)}X${dec(wall)}`, name: `304 Stainless Square Tube ${q(s)} x ${q(s)} x ${wall}" wall x 20 ft`, gradeCode: '304', form: 'TUBE', productType: 'TUBE', t: s, w: s, wall, l: 240, lbPerFt: perFt.rectTube(s, s, wall, rho), tags: ['stainless', 'square tube'] }));
  [[0.75, 0.065], [1, 0.065], [1.25, 0.065], [1.5, 0.065], [2, 0.065], [2, 0.083]].forEach(([od, wall]) => L({ sku: `SS304-RT-${dec(od)}X${dec(wall)}`, name: `304 Stainless Round Tube ${q(od)} OD x ${wall}" wall x 20 ft, #180 polished`, gradeCode: '304', form: 'TUBE', productType: 'TUBE', t: od, od, wall, l: 240, lbPerFt: perFt.roundTube(od, wall, rho), tags: ['stainless', 'round tube', 'polished'] }));
  const nps = [['1', 1.315, 0.109, 0.133], ['1-1/2', 1.9, 0.109, 0.145], ['2', 2.375, 0.109, 0.154], ['3', 3.5, 0.12, 0.216], ['4', 4.5, 0.12, 0.237]];
  for (const [size, od, s10, s40] of nps) for (const [sch, wall] of [['10', s10], ['40', s40]]) {
    L({ sku: `SS304L-PI-${size.replace(/[-/]/g, '')}-S${sch}`, name: `304/304L Stainless Pipe ${size}" Sch ${sch} (${od}" OD x ${wall}" wall) x 20 ft`, gradeCode: '304L', form: 'TUBE', productType: 'TUBE', t: od, od, wall, l: 240, lbPerFt: perFt.roundTube(od, wall, rho), tags: ['stainless', 'pipe', `schedule ${sch}`] });
  }
  for (const [size, od, wall] of [['1', 1.315, 0.133], ['2', 2.375, 0.154]]) L({ sku: `SS316L-PI-${size}-S40`, name: `316/316L Stainless Pipe ${size}" Sch 40 (${od}" OD x ${wall}" wall) x 20 ft`, gradeCode: '316L', form: 'TUBE', productType: 'TUBE', t: od, od, wall, l: 240, lbPerFt: perFt.roundTube(od, wall, rho), tags: ['stainless', 'pipe', 'schedule 40', 'marine'] });
  rounds('316', [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3], ['marine', 'corrosion resistant']);
  [[0.25, 1], [0.25, 2], [0.5, 2]].forEach(([t, w]) => L({ sku: `SS316-FL-${dec(t)}X${dec(w)}`, name: `316 Stainless Flat Bar ${q(t)} x ${q(w)} x 12 ft`, gradeCode: '316', form: 'BAR', t, w, l: 144, lbPerFt: perFt.flat(t, w, rho), tags: ['stainless', 'flat', 'marine'] }));
  rounds('410', [0.5, 1, 1.5, 2], ['hardenable']);
  rounds('416', [0.5, 0.75, 1, 1.25, 1.5, 2], ['free machining', 'hardenable']);
  rounds('17-4PH', [0.5, 0.75, 1, 1.5, 2, 3, 4], ['precipitation hardening', 'aerospace']);
  out.filter((p) => p.sku === 'SS304-RD-1000').forEach((p) => { p.featured = true; });
  return pick(out, 100);
}

// 8. Aluminum sheet and plate
function aluminumFlat() {
  const C = 'Aluminum Sheet & Plate';
  const out = [];
  const F = (g, kind, label, ts, sizes, tags, code, fmt = (t) => `${t}"`) => {
    for (const [t, [w, l]] of cross(ts, sizes)) out.push(flat(C, { sku: `AL${code}-${kind === 'Plate' ? 'PL' : kind === 'Tread Plate' ? 'TP' : 'SH'}-${dec(t)}-${w}${l}`, name: `${label} ${kind} ${fmt(t)} x ${w}" x ${l}"`, gradeCode: g, family: 'Aluminum', form: kind === 'Plate' ? 'PLATE' : 'SHEET', productType: 'FLAT', t, w, l, tags: ['aluminum', ...tags] }));
  };
  F('3003-H14', 'Sheet', 'Aluminum 3003-H14', [0.025, 0.032, 0.04, 0.05, 0.063, 0.08, 0.09, 0.125], [[48, 96], [48, 144]], ['sheet', 'formable'], '3003');
  F('5052-H32', 'Sheet', 'Aluminum 5052-H32', [0.032, 0.04, 0.05, 0.063, 0.08, 0.09, 0.1, 0.125, 0.16, 0.19, 0.25], [[48, 96], [48, 144]], ['sheet', 'marine', 'formable'], '5052');
  F('6061-T6', 'Sheet', 'Aluminum 6061-T6', [0.032, 0.04, 0.063, 0.08, 0.09, 0.125, 0.16, 0.19], [[48, 96], [48, 144]], ['sheet', 'structural'], '6061');
  F('6061-T651', 'Plate', 'Aluminum 6061-T651', [0.25, 0.375, 0.5, 0.625, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6], [[48, 96], [48, 144]], ['plate', 'machinable'], '6061', q);
  F('7075-T651', 'Plate', 'Aluminum 7075-T651', [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4], [[48, 96]], ['plate', 'aerospace', 'high strength'], '7075', q);
  F('AL-CAST-TP', 'Plate', 'Cast Aluminum Tooling', [0.25, 0.375, 0.5, 0.75, 1, 1.5, 2, 3], [[48, 96]], ['plate', 'tooling', 'precision'], 'CAST', q);
  F('3003-H22', 'Tread Plate', 'Aluminum 3003-H22 Diamond', [0.063, 0.125, 0.188, 0.25], [[48, 96], [48, 144]], ['tread plate', 'diamond', 'non-slip'], '3003');
  out.filter((p) => p.sku === 'AL6061-PL-0500-4896' || p.sku === 'AL5052-SH-0063-4896').forEach((p) => { p.featured = true; });
  return pick(out, 100);
}

// 9. Aluminum bar, extrusions and tube
function aluminumLong() {
  const C = 'Aluminum Bar, Extrusions & Tube';
  const out = [];
  const L = (o) => { const rho = densityOf('Aluminum', o.gradeCode); out.push(long(C, { family: 'Aluminum', productType: 'LONG', ...o, lbPerFt: o.shape(rho) })); };
  [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 5, 6, 8].forEach((d) => L({ sku: `AL6061-RD-${dec(d)}`, name: `Aluminum 6061-T6511 Round Bar ${q(d)} dia x 12 ft`, gradeCode: '6061-T6511', form: 'BAR', t: d, l: 144, shape: (rho) => perFt.round(d, rho), tags: ['aluminum', 'round', 'extruded'], featured: d === 1 }));
  [[0.125, 1], [0.125, 2], [0.1875, 1], [0.25, 1], [0.25, 1.5], [0.25, 2], [0.25, 3], [0.25, 4], [0.375, 1], [0.375, 2], [0.375, 3], [0.5, 1], [0.5, 2], [0.5, 3], [0.5, 4], [0.5, 6], [0.75, 2], [0.75, 3], [1, 2], [1, 3], [1, 4], [1, 6]].forEach(([t, w]) => L({ sku: `AL6061-FL-${dec(t)}X${dec(w)}`, name: `Aluminum 6061-T6511 Flat Bar ${q(t)} x ${q(w)} x 12 ft`, gradeCode: '6061-T6511', form: 'BAR', t, w, l: 144, shape: (rho) => perFt.flat(t, w, rho), tags: ['aluminum', 'flat', 'extruded'] }));
  [0.5, 0.75, 1, 1.5, 2, 3].forEach((s) => L({ sku: `AL6061-SQ-${dec(s)}`, name: `Aluminum 6061-T6511 Square Bar ${q(s)} x 12 ft`, gradeCode: '6061-T6511', form: 'BAR', t: s, w: s, l: 144, shape: (rho) => perFt.square(s, rho), tags: ['aluminum', 'square'] }));
  [[0.75, 0.75, 0.125], [1, 1, 0.125], [1, 1, 0.25], [1.5, 1.5, 0.125], [1.5, 1.5, 0.25], [2, 2, 0.125], [2, 2, 0.25], [3, 3, 0.25], [4, 4, 0.25]].forEach(([a, b, t]) => L({ sku: `AL6061-AN-${dec(a)}X${dec(b)}X${dec(t)}`, name: `Aluminum 6061-T6 Angle ${q(a)} x ${q(b)} x ${q(t)} x 20 ft`, gradeCode: '6061-T6511', form: 'BAR', productType: 'STRUCTURAL', t: a, w: b, wall: t, l: 240, shape: (rho) => perFt.angle(a, b, t, rho), tags: ['aluminum', 'angle'] }));
  [[2, 1, 0.125], [3, 1.5, 0.1875], [3, 1.5, 0.25], [4, 2, 0.25], [5, 2.25, 0.25], [6, 2.5, 0.3125]].forEach(([d, f, t]) => L({ sku: `AL6061-CH-${dec(d)}X${dec(f)}X${dec(t)}`, name: `Aluminum 6061-T6 Channel ${q(d)} x ${q(f)} x ${q(t)} x 20 ft`, gradeCode: '6061-T6511', form: 'BEAM', productType: 'STRUCTURAL', t: d, w: f, wall: t, l: 240, shape: (rho) => perFt.channel(d, f, t, rho), tags: ['aluminum', 'channel'] }));
  [[1, 0.125], [1.5, 0.125], [2, 0.125], [2, 0.25], [3, 0.25]].forEach(([s, wall]) => L({ sku: `AL6061-TS-${dec(s)}X${dec(wall)}`, name: `Aluminum 6061-T6 Square Tube ${q(s)} x ${q(s)} x ${wall}" wall x 20 ft`, gradeCode: '6061-T6', form: 'TUBE', productType: 'TUBE', t: s, w: s, wall, l: 240, shape: (rho) => perFt.rectTube(s, s, wall, rho), tags: ['aluminum', 'square tube'] }));
  [[0.75, 0.065], [1, 0.065], [1, 0.125], [1.5, 0.125], [2, 0.125], [3, 0.25]].forEach(([od, wall]) => L({ sku: `AL6061-RT-${dec(od)}X${dec(wall)}`, name: `Aluminum 6061-T6 Round Tube ${q(od)} OD x ${wall}" wall x 12 ft`, gradeCode: '6061-T6', form: 'TUBE', productType: 'TUBE', t: od, od, wall, l: 144, shape: (rho) => perFt.roundTube(od, wall, rho), tags: ['aluminum', 'round tube'] }));
  [[2, 1, 0.125], [3, 2, 0.125], [4, 2, 0.125]].forEach(([a, b, wall]) => L({ sku: `AL6061-TR-${dec(a)}X${dec(b)}X${dec(wall)}`, name: `Aluminum 6061-T6 Rectangular Tube ${q(a)} x ${q(b)} x ${wall}" wall x 20 ft`, gradeCode: '6061-T6', form: 'TUBE', productType: 'TUBE', t: a, w: b, wall, l: 240, shape: (rho) => perFt.rectTube(a, b, wall, rho), tags: ['aluminum', 'rectangular tube'] }));
  [[1, 1, 0.125], [1.5, 1.5, 0.125], [2, 2, 0.125]].forEach(([a, b, t]) => L({ sku: `AL6063-AN-${dec(a)}X${dec(b)}X${dec(t)}`, name: `Aluminum 6063-T52 Angle ${q(a)} x ${q(b)} x ${q(t)} x 20 ft`, gradeCode: '6063-T52', form: 'BAR', productType: 'STRUCTURAL', t: a, w: b, wall: t, l: 240, shape: (rho) => perFt.angle(a, b, t, rho), tags: ['aluminum', 'angle', 'architectural'] }));
  [[0.125, 1], [0.125, 2], [0.25, 2]].forEach(([t, w]) => L({ sku: `AL6063-FL-${dec(t)}X${dec(w)}`, name: `Aluminum 6063-T52 Flat Bar ${q(t)} x ${q(w)} x 12 ft`, gradeCode: '6063-T52', form: 'BAR', t, w, l: 144, shape: (rho) => perFt.flat(t, w, rho), tags: ['aluminum', 'flat', 'architectural'] }));
  [[1, 0.125], [1.5, 0.125], [2, 0.125]].forEach(([s, wall]) => L({ sku: `AL6063-TS-${dec(s)}X${dec(wall)}`, name: `Aluminum 6063-T52 Square Tube ${q(s)} x ${q(s)} x ${wall}" wall x 24 ft`, gradeCode: '6063-T52', form: 'TUBE', productType: 'TUBE', t: s, w: s, wall, l: 288, shape: (rho) => perFt.rectTube(s, s, wall, rho), tags: ['aluminum', 'square tube', 'architectural'] }));
  [0.5, 1, 1.5, 2, 3].forEach((d) => L({ sku: `AL2024-RD-${dec(d)}`, name: `Aluminum 2024-T351 Round Bar ${q(d)} dia x 12 ft`, gradeCode: '2024-T351', form: 'BAR', t: d, l: 144, shape: (rho) => perFt.round(d, rho), tags: ['aluminum', 'round', 'aerospace'] }));
  [[0.5, 2], [1, 2]].forEach(([t, w]) => L({ sku: `AL2024-FL-${dec(t)}X${dec(w)}`, name: `Aluminum 2024-T351 Flat Bar ${q(t)} x ${q(w)} x 12 ft`, gradeCode: '2024-T351', form: 'BAR', t, w, l: 144, shape: (rho) => perFt.flat(t, w, rho), tags: ['aluminum', 'flat', 'aerospace'] }));
  [0.5, 0.75, 1, 1.5, 2, 3, 4].forEach((d) => L({ sku: `AL7075-RD-${dec(d)}`, name: `Aluminum 7075-T651 Round Bar ${q(d)} dia x 12 ft`, gradeCode: '7075-T651', form: 'BAR', t: d, l: 144, shape: (rho) => perFt.round(d, rho), tags: ['aluminum', 'round', 'high strength'] }));
  [[0.5, 2], [1, 3]].forEach(([t, w]) => L({ sku: `AL7075-FL-${dec(t)}X${dec(w)}`, name: `Aluminum 7075-T651 Flat Bar ${q(t)} x ${q(w)} x 12 ft`, gradeCode: '7075-T651', form: 'BAR', t, w, l: 144, shape: (rho) => perFt.flat(t, w, rho), tags: ['aluminum', 'flat', 'high strength'] }));
  return pick(out, 100);
}

// 10. Plastic sheet
const PLASTIC = {
  HDPE: { family: 'Polyethylene', label: 'HDPE' }, UHMW: { family: 'Ultra-High MW', label: 'UHMW' }, ACRYLIC: { family: 'Acrylic', label: 'Cast Acrylic' },
  PC: { family: 'Polycarbonate', label: 'Polycarbonate' }, 'PVC-1': { family: 'PVC', label: 'PVC Type I' }, ABS: { family: 'ABS', label: 'ABS' },
  ACETAL: { family: 'Acetal', label: 'Acetal Copolymer' }, 'NYLON-66': { family: 'Nylon', label: 'Nylon 6/6' }, PTFE: { family: 'PTFE', label: 'PTFE' },
  PEEK: { family: 'PEEK', label: 'PEEK' }, PP: { family: 'Polypropylene', label: 'Polypropylene' },
};
const COLOR = { Natural: 'NAT', Black: 'BLK', White: 'WHT', Clear: 'CLR', Gray: 'GRY', 'White Translucent': 'WTL', 'Black Textured': 'BTX' };
function plasticSheet() {
  const C = 'Plastic Sheet';
  const out = [];
  const S = (g, color, ts, [w, l], tags, extra = 1) => {
    const { family, label } = PLASTIC[g];
    for (const t of ts) out.push(flat(C, { sku: `${g.replace('-', '')}-SH-${COLOR[color]}-${dec(t)}-${w}${l}`, name: `${label} Sheet, ${color}, ${t}" x ${w}" x ${l}"`, gradeCode: g, family, division: 'PLASTICS', form: 'SHEET', productType: 'FLAT', t, w, l, tags: ['plastic', ...tags], extra }));
  };
  S('HDPE', 'Natural', [0.125, 0.1875, 0.25, 0.375, 0.5, 0.75, 1, 1.5, 2], [48, 96], ['food grade', 'chemical resistant']);
  S('HDPE', 'Black', [0.25, 0.5, 0.75, 1], [48, 96], ['uv resistant']);
  S('HDPE', 'White', [0.5, 0.75], [48, 96], ['marine board', 'uv stabilized'], 1.2);
  S('UHMW', 'Natural', [0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.5, 2, 3, 4], [48, 120], ['wear resistant', 'low friction']);
  S('UHMW', 'Black', [0.25, 0.5, 1], [48, 120], ['wear resistant', 'uv resistant']);
  S('ACRYLIC', 'Clear', [0.06, 0.093, 0.118, 0.177, 0.22, 0.236, 0.375, 0.5, 0.75, 1], [48, 96], ['clear', 'glazing', 'signage']);
  S('ACRYLIC', 'White Translucent', [0.118, 0.236], [48, 96], ['signage', 'light diffusing']);
  S('ACRYLIC', 'Black', [0.118, 0.236], [48, 96], ['signage']);
  S('PC', 'Clear', [0.06, 0.093, 0.118, 0.177, 0.236, 0.375, 0.5, 0.75], [48, 96], ['clear', 'impact resistant', 'machine guard']);
  S('PVC-1', 'Gray', [0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.5, 2], [48, 96], ['chemical resistant', 'tank lining']);
  S('PVC-1', 'White', [0.25, 0.5], [48, 96], ['chemical resistant']);
  S('ABS', 'Black Textured', [0.06, 0.093, 0.125, 0.187, 0.25, 0.375], [48, 96], ['thermoforming', 'haircell']);
  S('ABS', 'Natural', [0.125, 0.25, 0.5], [48, 96], ['machinable']);
  S('ACETAL', 'Natural', [0.25, 0.375, 0.5, 0.75, 1, 1.5, 2], [24, 48], ['machinable', 'low friction', 'food grade']);
  S('ACETAL', 'Black', [0.25, 0.5, 1], [24, 48], ['machinable', 'low friction']);
  S('NYLON-66', 'Natural', [0.25, 0.375, 0.5, 0.75, 1], [24, 48], ['wear resistant', 'machinable']);
  S('NYLON-66', 'Black', [0.5, 1], [24, 48], ['wear resistant']);
  S('PTFE', 'White', [0.0625, 0.125, 0.25, 0.5, 1], [24, 24], ['chemical resistant', 'high temperature', 'low friction']);
  S('PEEK', 'Natural', [0.25, 0.5, 1], [12, 24], ['high temperature', 'high performance']);
  S('PP', 'Natural', [0.125, 0.25, 0.5, 1], [48, 96], ['chemical resistant', 'tank']);
  S('PP', 'White', [0.25, 0.5], [48, 96], ['chemical resistant', 'food grade']);
  out.filter((p) => p.sku === 'HDPE-SH-NAT-0500-4896' || p.sku === 'ACRYLIC-SH-CLR-0236-4896').forEach((p) => { p.featured = true; });
  return pick(out, 100);
}

// 11. Plastic rod and tube
function plasticRodTube() {
  const C = 'Plastic Rod & Tube';
  const out = [];
  const R = (g, color, ds, tags, l = 96) => {
    const { family, label } = PLASTIC[g];
    const rho = DENSITY[family];
    for (const d of ds) out.push(long(C, { sku: `${g.replace('-', '')}-RD-${COLOR[color]}-${dec(d)}`, name: `${label} Rod, ${color}, ${q(d)} dia x ${ft(l)}`, gradeCode: g, family, division: 'PLASTICS', form: 'ROD', productType: 'LONG', t: d, l, lbPerFt: perFt.round(d, rho), tags: ['plastic', 'rod', ...tags] }));
  };
  R('UHMW', 'Natural', [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6], ['wear resistant', 'bushing']);
  R('UHMW', 'Black', [1, 2, 3], ['wear resistant']);
  R('HDPE', 'Natural', [0.5, 0.75, 1, 1.5, 2, 3, 4], ['food grade']);
  R('HDPE', 'Black', [1, 2], ['uv resistant']);
  R('ACETAL', 'Natural', [0.25, 0.375, 0.5, 0.625, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6], ['machinable', 'gears', 'food grade']);
  R('ACETAL', 'Black', [0.5, 1, 1.5, 2], ['machinable', 'gears']);
  R('NYLON-66', 'Natural', [0.25, 0.375, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5], ['wear resistant', 'bushing']);
  R('NYLON-66', 'Black', [1, 2], ['wear resistant']);
  R('PTFE', 'White', [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4], ['chemical resistant', 'seals'], 48);
  R('PEEK', 'Natural', [0.25, 0.5, 0.75, 1, 1.5, 2, 3], ['high performance', 'high temperature'], 48);
  R('ACRYLIC', 'Clear', [0.25, 0.375, 0.5, 0.75, 1, 1.5, 2, 3], ['clear', 'display'], 72);
  R('PC', 'Clear', [0.5, 1, 2], ['clear', 'impact resistant']);
  R('PVC-1', 'Gray', [0.5, 0.75, 1, 1.5, 2, 3], ['chemical resistant']);
  R('PP', 'Natural', [0.5, 1, 2], ['chemical resistant']);
  R('ABS', 'Black', [0.5, 1, 2], ['machinable']);
  for (const [od, wall] of [[1, 0.125], [2, 0.125], [3, 0.125], [4, 0.125]]) out.push(long(C, { sku: `ACRYLIC-TB-CLR-${dec(od)}X${dec(wall)}`, name: `Cast Acrylic Tube, Clear, ${q(od)} OD x ${q(wall)} wall x 6 ft`, gradeCode: 'ACRYLIC', family: 'Acrylic', division: 'PLASTICS', form: 'TUBE', productType: 'TUBE', t: od, od, wall, l: 72, lbPerFt: perFt.roundTube(od, wall, DENSITY.Acrylic), tags: ['plastic', 'tube', 'clear'] }));
  for (const [size, od, wall] of [['1', 1.315, 0.179], ['2', 2.375, 0.218], ['3', 3.5, 0.3]]) out.push(long(C, { sku: `PVC1-PI-GRY-${size}-S80`, name: `PVC Schedule 80 Pipe, Gray, ${size}" (${od}" OD x ${wall}" wall) x 20 ft`, gradeCode: 'PVC-1', family: 'PVC', division: 'PLASTICS', form: 'TUBE', productType: 'TUBE', t: od, od, wall, l: 240, lbPerFt: perFt.roundTube(od, wall, DENSITY.PVC), tags: ['plastic', 'pipe', 'schedule 80'] }));
  out.filter((p) => p.sku === 'ACETAL-RD-NAT-1000' || p.sku === 'UHMW-RD-NAT-2000').forEach((p) => { p.featured = true; });
  return pick(out, 100);
}

// 12. Tool steel
function toolSteel() {
  const C = 'Tool Steel';
  const out = [];
  const rho = DENSITY['Tool Steel'];
  const T = (o) => out.push(long(C, { family: 'Tool Steel', productType: 'LONG', form: 'BAR', ...o }));
  const rounds = (g, label, ds, l = 144, tags = []) => ds.forEach((d) => T({ sku: `TS${g.replace('-', '')}-RD-${dec(d)}`, name: `${label} Round Bar ${q(d)} dia x ${ft(l)}`, gradeCode: g, t: d, l, lbPerFt: perFt.round(d, rho), tags: ['tool steel', 'round', ...tags] }));
  const flats = (g, label, sizes, l = 36, tags = [], code = 'FL') => sizes.forEach(([t, w]) => T({ sku: `TS${g.replace('-', '')}-${code}-${dec(t)}X${dec(w)}`, name: `${label} ${code === 'PG' ? 'Precision Ground Flat Stock' : 'Decarb-Free Flat'} ${q(t)} x ${q(w)} x ${l}"`, gradeCode: g, t, w, l, lbPerFt: perFt.flat(t, w, rho), tags: ['tool steel', code === 'PG' ? 'precision ground' : 'flat', ...tags], extra: code === 'PG' ? 1.6 : 1.1 }));
  rounds('A2', 'A2 Tool Steel', [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8], 144, ['air hardening']);
  flats('A2', 'A2 Tool Steel', [[0.5, 1], [0.5, 2], [0.75, 2], [0.75, 3], [1, 2], [1, 3], [1, 4], [1.5, 3], [1.5, 4], [2, 4], [2, 6], [2, 8]], 36, ['air hardening']);
  flats('A2', 'A2 Tool Steel', [[0.125, 1], [0.25, 1], [0.25, 2], [0.375, 2], [0.5, 2], [0.5, 3], [0.75, 3], [1, 4]], 18, ['air hardening'], 'PG');
  rounds('D2', 'D2 Tool Steel', [0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6], 144, ['wear resistant']);
  flats('D2', 'D2 Tool Steel', [[0.5, 2], [0.75, 3], [1, 3], [1, 4], [1.5, 4], [2, 6]], 36, ['wear resistant']);
  flats('D2', 'D2 Tool Steel', [[0.25, 1], [0.25, 2], [0.5, 2], [0.5, 3], [1, 3]], 18, ['wear resistant'], 'PG');
  [0.125, 0.1875, 0.25, 0.3125, 0.375, 0.4375, 0.5, 0.625, 0.75, 0.875, 1].forEach((d) => T({ sku: `TSO1-DR-${dec(d)}`, name: `O1 Drill Rod ${q(d)} dia x 36"`, gradeCode: 'O1', t: d, l: 36, lbPerFt: perFt.round(d, rho), tags: ['tool steel', 'drill rod', 'oil hardening'], extra: 1.3 }));
  flats('O1', 'O1 Tool Steel', [[0.5, 2], [1, 2], [1, 4]], 36, ['oil hardening']);
  flats('O1', 'O1 Tool Steel', [[0.25, 2], [0.5, 2], [0.5, 3]], 18, ['oil hardening'], 'PG');
  rounds('S7', 'S7 Tool Steel', [1, 1.5, 2, 3, 4, 6], 144, ['shock resistant']);
  flats('S7', 'S7 Tool Steel', [[0.5, 2], [1, 3], [1, 4], [2, 4]], 36, ['shock resistant']);
  rounds('H13', 'H13 Tool Steel', [1, 2, 3, 4, 6, 8], 144, ['hot work', 'die casting']);
  flats('H13', 'H13 Tool Steel', [[1, 4], [2, 6], [2, 8]], 36, ['hot work']);
  [[1, 6], [1.5, 8], [2, 10], [3, 12]].forEach(([t, w]) => T({ sku: `TSP20-BL-${dec(t)}X${dec(w)}`, name: `P20 Prehardened Mold Steel Block ${q(t)} x ${q(w)} x 72"`, gradeCode: 'P20', t, w, l: 72, lbPerFt: perFt.flat(t, w, rho), tags: ['tool steel', 'mold steel', 'prehardened'] }));
  rounds('P20', 'P20 Prehardened Mold Steel', [2, 4, 6], 144, ['mold steel', 'prehardened']);
  [[0.5, 2], [1, 2], [1, 4], [2, 4], [2, 6]].forEach(([t, w]) => T({ sku: `TS4140HT-FL-${dec(t)}X${dec(w)}`, name: `4140 Prehard Flat Bar ${q(t)} x ${q(w)} x 12 ft`, gradeCode: '4140-HT', family: 'Alloy Steel', t, w, l: 144, lbPerFt: perFt.flat(t, w, rho), tags: ['alloy', 'prehard', 'flat'] }));
  out.filter((p) => p.sku === 'TSA2-PG-0500X2000' || p.sku === 'TSO1-DR-0500').forEach((p) => { p.featured = true; });
  return pick(out, 100);
}

// 13. Brass, copper and bronze
function redMetals() {
  const C = 'Brass, Copper & Bronze';
  const out = [];
  const famOf = (g) => (g === 'C110' ? 'Copper' : g === 'C932' || g === 'C954' ? 'Bronze' : 'Brass');
  const L = (o) => { const fam = famOf(o.gradeCode); out.push(long(C, { family: fam, productType: 'LONG', form: 'BAR', ...o, lbPerFt: o.shape(densityOf(fam, o.gradeCode)) })); };
  const F = (g, label, ts, sizes, tags) => { const fam = famOf(g); for (const [t, [w, l]] of cross(ts, sizes)) out.push(flat(C, { sku: `${g}-SH-${dec(t)}-${w}${l}`, name: `${label} ${t >= 0.1875 ? 'Plate' : 'Sheet'} ${t}" x ${w}" x ${l}"`, gradeCode: g, family: fam, form: t >= 0.1875 ? 'PLATE' : 'SHEET', productType: 'FLAT', t, w, l, tags })); };
  [0.125, 0.1875, 0.25, 0.3125, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4].forEach((d) => L({ sku: `C360-RD-${dec(d)}`, name: `C360 Free Cutting Brass Round Bar ${q(d)} dia x 12 ft`, gradeCode: 'C360', t: d, l: 144, shape: (rho) => perFt.round(d, rho), tags: ['brass', 'round', 'free machining'], featured: d === 1 }));
  [0.25, 0.375, 0.5, 0.625, 0.75, 1, 1.25].forEach((s) => L({ sku: `C360-HX-${dec(s)}`, name: `C360 Free Cutting Brass Hex Bar ${q(s)} across flats x 12 ft`, gradeCode: 'C360', t: s, l: 144, shape: (rho) => perFt.hex(s, rho), tags: ['brass', 'hex'] }));
  [0.25, 0.5, 0.75, 1].forEach((s) => L({ sku: `C360-SQ-${dec(s)}`, name: `C360 Free Cutting Brass Square Bar ${q(s)} x 12 ft`, gradeCode: 'C360', t: s, w: s, l: 144, shape: (rho) => perFt.square(s, rho), tags: ['brass', 'square'] }));
  F('C260', 'C260 Cartridge Brass, Half Hard', [0.02, 0.025, 0.032, 0.04, 0.05, 0.064, 0.081, 0.125], [[24, 96], [36, 96]], ['brass', 'sheet', 'decorative']);
  [0.5, 0.75, 1, 1.5, 2, 3, 4].forEach((d) => L({ sku: `C464-RD-${dec(d)}`, name: `C464 Naval Brass Round Bar ${q(d)} dia x 12 ft`, gradeCode: 'C464', t: d, l: 144, shape: (rho) => perFt.round(d, rho), tags: ['brass', 'round', 'marine'] }));
  F('C464', 'C464 Naval Brass', [0.25, 0.5, 1], [[48, 144]], ['brass', 'plate', 'marine']);
  F('C110', 'C110 Copper, Half Hard', [0.021, 0.032, 0.04, 0.064, 0.125, 0.25], [[24, 96], [36, 96]], ['copper', 'electrical']);
  [[0.125, 1], [0.125, 2], [0.25, 1], [0.25, 2], [0.25, 3], [0.25, 4], [0.375, 2], [0.5, 4]].forEach(([t, w]) => L({ sku: `C110-BB-${dec(t)}X${dec(w)}`, name: `C110 Copper Bus Bar ${q(t)} x ${q(w)} x 12 ft`, gradeCode: 'C110', t, w, l: 144, shape: (rho) => perFt.flat(t, w, rho), tags: ['copper', 'bus bar', 'electrical'] }));
  [0.25, 0.5, 0.75, 1, 1.5, 2, 3].forEach((d) => L({ sku: `C110-RD-${dec(d)}`, name: `C110 Copper Round Bar ${q(d)} dia x 12 ft`, gradeCode: 'C110', t: d, l: 144, shape: (rho) => perFt.round(d, rho), tags: ['copper', 'round'] }));
  [0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4].forEach((d) => L({ sku: `C932-RD-${dec(d)}`, name: `C932 Bearing Bronze Solid Bar ${q(d)} dia x 13"`, gradeCode: 'C932', t: d, l: 13, shape: (rho) => perFt.round(d, rho), tags: ['bronze', 'bearing', 'solid bar'] }));
  [[1.5, 0.75], [2, 1], [2.5, 1.5], [3, 2], [4, 2.5]].forEach(([od, id]) => L({ sku: `C932-CB-${dec(od)}X${dec(id)}`, name: `C932 Bearing Bronze Cored Bar ${q(od)} OD x ${q(id)} ID x 13"`, gradeCode: 'C932', form: 'TUBE', productType: 'TUBE', t: od, od, wall: (od - id) / 2, l: 13, shape: (rho) => perFt.roundTube(od, (od - id) / 2, rho), tags: ['bronze', 'bearing', 'cored bar'] }));
  [1, 1.5, 2, 3, 4, 5].forEach((d) => L({ sku: `C954-RD-${dec(d)}`, name: `C954 Aluminum Bronze Round Bar ${q(d)} dia x 12 ft`, gradeCode: 'C954', t: d, l: 144, shape: (rho) => perFt.round(d, rho), tags: ['bronze', 'round', 'wear resistant'] }));
  return pick(out, 100);
}

export const CATEGORIES = [
  { key: 'carbon-plate', build: carbonPlate },
  { key: 'carbon-sheet-coil', build: carbonSheetCoil },
  { key: 'carbon-alloy-bar', build: carbonAlloyBar },
  { key: 'structural', build: structural },
  { key: 'tube-pipe', build: tubePipe },
  { key: 'stainless-flat', build: stainlessFlat },
  { key: 'stainless-long', build: stainlessLong },
  { key: 'aluminum-flat', build: aluminumFlat },
  { key: 'aluminum-long', build: aluminumLong },
  { key: 'plastic-sheet', build: plasticSheet },
  { key: 'plastic-rod-tube', build: plasticRodTube },
  { key: 'tool-steel', build: toolSteel },
  { key: 'red-metals', build: redMetals },
];

/** Every metals and plastics product, in category order. */
export function buildProducts() {
  return CATEGORIES.flatMap(({ key, build }) => build().map((p, i) => ({ ...p, categoryKey: key, sortOrder: i + 1 })));
}
