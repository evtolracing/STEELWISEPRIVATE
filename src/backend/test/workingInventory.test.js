// The working inventory (owner, 2026-11-26: "a real looking inventory ... 100 sizes and or types per catagory ... heats
// coils plates etc ... stainless ... plastics ... in the online store and the steel outlet ... getting rid of any mock data").
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInventory, listingFor, BRANCHES } from '../src/seeds/inventory/build.js';
import { CATEGORIES, inch } from '../src/seeds/inventory/products.js';
import { gradeByCode } from '../src/seeds/inventory/grades.js';
import { millsFor } from '../src/seeds/inventory/mills.js';
import { densityFor } from '../src/lib/materialDensity.js';
import { PARTS, partSql, DEMO_SKUS } from '../scripts/working-inventory-sql.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const d = buildInventory();
const metals = d.products.filter((p) => p.form !== 'SUPPLY');
const NOT_REAL = /\b(demo|test|sample|mock|fake|dummy|placeholder)\b/i;

test('13 categories of exactly 100 products each, plus supplies, every number used once', () => {
  assert.equal(CATEGORIES.length, 13);
  const counts = {};
  for (const p of metals) counts[p.category] = (counts[p.category] || 0) + 1;
  assert.deepEqual(Object.values(counts), Array(13).fill(100), JSON.stringify(counts));
  assert.ok(d.products.filter((p) => p.form === 'SUPPLY').length >= 90);
  assert.equal(new Set(d.products.map((p) => p.sku)).size, d.products.length);
  assert.ok(d.products.every((p) => p.sku.length <= 40 && /^[A-Z0-9.-]+$/.test(p.sku)), 'product numbers are short and plain');
});

test('the basic metals and the plastics are all there: plate, sheet, coil, bar, shapes, tube, pipe, stainless, aluminum, plastics', () => {
  const forms = new Set(metals.map((p) => p.form));
  for (const f of ['PLATE', 'SHEET', 'COIL', 'BAR', 'BEAM', 'TUBE', 'ROD']) assert.ok(forms.has(f), f);
  for (const g of ['A36', 'A572-50', 'A1011-CS', 'A653-G90', '1018', '4140', 'A992', 'A500-B', 'A53-B', '304', '316L', '6061-T651', '5052-H32', 'HDPE', 'UHMW', 'ACETAL', 'A2', 'D2', 'C360', 'C110']) {
    assert.ok(metals.some((p) => p.gradeCode === g), g);
  }
  assert.equal(new Set(metals.filter((p) => p.division === 'PLASTICS').map((p) => p.category)).size, 2);
});

test('no name, tag, heat, mill or note says demo, test, sample or mock', () => {
  const words = [
    ...d.products.flatMap((p) => [p.name, p.description, p.sku, ...(p.tags || [])]),
    ...d.heats.map((h) => h.heatNumber), ...d.mills.map((m) => m.name),
    ...d.pieces.map((p) => p.tag), ...d.remnants.flatMap((r) => [r.name, r.notes, r.sku]),
  ];
  assert.deepEqual(words.filter((w) => NOT_REAL.test(w || '')), []);
});

test('weights follow from size and density: a plate by its dimensions, a shape by its weight per foot', () => {
  const plate = d.products.find((p) => p.sku === 'PL-A36-0500-96240');
  assert.equal(plate.name, 'A36 Hot Rolled Steel Plate 1/2" x 96" x 240"');
  assert.ok(Math.abs(plate.pieceLb - 0.5 * 96 * 240 * 0.2836) < 0.01, plate.pieceLb);
  // Published weights: 2x2x1/4 angle 3.19 lb/ft, 2x2x.120 square tube about 3.05, 2" Sch 40 pipe 3.65, W8x31 is 31.
  const perFt = (sku) => d.products.find((p) => p.sku === sku).lbPerFt;
  assert.ok(Math.abs(perFt('AN-A36-2000X2000X0250') - 3.19) < 0.02);
  assert.ok(Math.abs(perFt('TS-A500-B-2000X2000X0120') - 3.05) < 0.05);
  assert.ok(Math.abs(perFt('PI-A53-2-S40') - 3.65) < 0.02);
  assert.equal(perFt('WF-A992-W8X31'), 31);
  for (const pc of d.pieces) {
    const p = pc.product;
    if (p.form === 'SUPPLY') { assert.ok(pc.qty > 0); continue; }
    const rho = densityFor(p.family, p.gradeCode);
    if (p.form === 'PLATE') assert.ok(Math.abs(pc.weight - pc.t * pc.w * pc.l * rho) < 0.01, p.sku);
    else if (p.form === 'SHEET') assert.ok(Math.abs(pc.weight - pc.sheets * p.pieceLb) < 0.05, p.sku);
    else if (p.form === 'COIL') assert.ok(pc.weight >= 3000 && pc.weight <= 40000 && pc.od > pc.id, `${p.sku} ${pc.weight}`);
    else assert.ok(Math.abs(pc.weight - (p.lbPerFt * pc.l) / 12) < 0.01 && pc.l <= p.l, p.sku);
  }
});

test('stock: every piece has a tag of the branch, every branch carries every category, and about 2 in 100 are on hold', () => {
  assert.equal(new Set(d.pieces.map((p) => p.tag)).size, d.pieces.length);
  for (const pc of d.pieces) assert.match(pc.tag, new RegExp(`^${pc.branch}-2[56]-1\\d{5}$`));
  for (const c of new Set(d.products.map((p) => p.category))) {
    for (const b of BRANCHES) assert.ok(d.pieces.some((pc) => pc.product.category === c && pc.branch === b.code), `${c} at ${b.code}`);
  }
  const held = d.pieces.filter((p) => p.hold).length / d.pieces.length;
  assert.ok(held > 0.01 && held < 0.03, held);
  assert.ok(d.pieces.length >= 4000, d.pieces.length);
  // Charlotte carries the most plate, Lansing Steel the most structural.
  const at = (cat, code) => d.pieces.filter((p) => p.product.categoryKey === cat && p.branch === code).length;
  assert.ok(BRANCHES.every((b) => at('carbon-plate', 'CT') >= at('carbon-plate', b.code)));
  assert.ok(BRANCHES.every((b) => at('structural', 'L2') >= at('structural', b.code)));
});

test('heats: one number each, from a producer that makes the grade, chemistry and strength inside the grade', () => {
  assert.equal(new Set(d.heats.map((h) => h.heatNumber)).size, d.heats.length);
  for (const h of d.heats) {
    const g = gradeByCode[h.gradeCode];
    assert.ok(millsFor(h.gradeCode).some((m) => m.code === h.millCode), `${h.heatNumber} ${h.millCode} ${h.gradeCode}`);
    for (const [el, v] of Object.entries(h.chemistry || {})) {
      if (g.chemistryMax?.[el] != null) assert.ok(v <= g.chemistryMax[el], `${h.heatNumber} ${el} ${v} > ${g.chemistryMax[el]}`);
      if (g.chemistryMin?.[el] != null) assert.ok(v >= g.chemistryMin[el] - 1e-9, `${h.heatNumber} ${el} ${v} < ${g.chemistryMin[el]}`);
    }
    const m = h.mechanicalProps || {};
    if (g.tensileMin) assert.ok(m['Tensile (psi)'] >= g.tensileMin && (!g.tensileMax || m['Tensile (psi)'] <= g.tensileMax), h.heatNumber);
    if (g.yieldMin) assert.ok(m['Yield (psi)'] >= g.yieldMin && m['Yield (psi)'] < (m['Tensile (psi)'] || Infinity), h.heatNumber);
    assert.ok(h.castDate < new Date('2026-11-26'), h.heatNumber);
  }
  for (const pc of d.pieces) {
    if (pc.product.form === 'SUPPLY') assert.equal(pc.heat, undefined);
    else {
      assert.equal(pc.heat.gradeCode, pc.product.gradeCode);
      assert.ok(pc.receivedAt > pc.heat.castDate, pc.tag);
    }
  }
});

test('Steel Outlet: 100 pieces at real branches, with a heat of their grade and a price below list', () => {
  assert.equal(d.remnants.length, 100);
  const codes = new Set(BRANCHES.map((b) => b.code));
  const heats = new Map(d.heats.map((h) => [h.heatNumber, h]));
  for (const r of d.remnants) {
    assert.ok(codes.has(r.location), r.location);
    assert.equal(heats.get(r.heatNumber)?.gradeCode, r.grade, r.sku);
    assert.ok(r.estimatedWeight > 0 && r.pricePerLb > 0, r.sku);
    assert.doesNotMatch(r.name, /undefined|null|NaN/);
  }
});

test('the same rules give the same data every time', () => {
  const again = buildInventory();
  assert.deepEqual(again.pieces.map((p) => [p.tag, p.weight, p.heat?.heatNumber]), d.pieces.map((p) => [p.tag, p.weight, p.heat?.heatNumber]));
  assert.deepEqual(again.remnants, d.remnants);
});

test('store listings offer the product\'s own size, and supplies are sold as they are', () => {
  const plate = listingFor(d.products.find((p) => p.sku === 'PL-A36-0500-96240'));
  assert.deepEqual(plate.thicknessOptions, ['0.5']);
  assert.ok(plate.widthOptions.includes('96') && !plate.widthOptions.includes('120'));
  assert.ok(plate.lengthOptions.includes('240') && !plate.lengthOptions.includes('288'));
  const supply = listingFor(d.products.find((p) => p.form === 'SUPPLY'));
  assert.equal(supply.allowCutToSize, false);
  assert.equal(d.products.filter((p) => p.featured).length >= 20, true);
});

test('fractions read the way a shop writes them', () => {
  assert.equal(inch(0.375), '3/8');
  assert.equal(inch(1.25), '1-1/4');
  assert.equal(inch(2), '2');
  assert.equal(inch(0.065), '.065');
});

test('the SQL: stock refuses started books, goes only to a switched-on branch, and the files on disk match the rules', () => {
  const stock = partSql(d, 'stock:JX');
  assert.match(stock, /books are already started/);
  assert.match(stock, /"code" = 'JX' AND "isActive" = true/);
  assert.match(stock, /ON CONFLICT \("coilNumber"\) DO NOTHING/);
  const retire = partSql(d, 'retire');
  for (const sku of DEMO_SKUS) assert.ok(retire.includes(`'${sku}'`), sku);
  assert.doesNotMatch(retire, /DELETE FROM "Coil"|DELETE FROM "MaterialMovement"/, 'stock history is never deleted');
  assert.equal(PARTS.length, 10);
  execFileSync(process.execPath, [path.join(here, '..', 'scripts', 'working-inventory-sql.js'), '--check'], { stdio: 'pipe' });
});
