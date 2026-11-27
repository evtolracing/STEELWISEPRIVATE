// The store weighs shapes by their weight per foot, offers only forms that exist, and the work order stock list finds a
// piece among thousands (2026-11-26, with the working inventory).
import test from 'node:test';
import assert from 'node:assert/strict';
import { pieceWeight } from '../src/services/ecomService.js';
import { searchWords, wordMatch } from '../src/lib/stockSearch.js';
import { mergeStock } from '../../frontend/src/pages/WorkOrders/sourceStock.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

test('an angle, beam or tube is weighed from its weight per foot, not as a round bar', () => {
  const angle = { form: 'BAR', weightPerFtLb: '3.1905', category: 'Structural Shapes', storeListing: { family: 'Carbon Steel' } };
  assert.ok(Math.abs(pieceWeight(angle, { thickness: 2, length: 120 }) - 31.905) < 0.001);
  const beam = { form: 'BEAM', weightPerFtLb: 31, storeListing: { family: 'Carbon Steel' } };
  assert.equal(pieceWeight(beam, { thickness: 8, length: 240 }), 620);
  // Without a weight per foot, a long product is still a round bar, as before.
  const round = { form: 'BAR', storeListing: { family: 'Carbon Steel' } };
  assert.ok(Math.abs(pieceWeight(round, { thickness: 1, length: 12 }) - (Math.PI / 4) * 12 * 0.2836) < 1e-9);
});

test('plastics and red metals are weighed at their own density, not steel', () => {
  const sheet = (family) => pieceWeight({ form: 'SHEET', storeListing: { family } }, { thickness: 1, width: 10, length: 10 });
  assert.ok(Math.abs(sheet('Acrylic') - 4.3) < 1e-9);
  assert.ok(Math.abs(sheet('PTFE') - 7.84) < 1e-9);
  assert.ok(Math.abs(sheet('Brass') - 30.7) < 1e-9);
  assert.ok(Math.abs(sheet('Carbon Steel') - 28.36) < 1e-9);
  // A coil is flat: thickness x width x length.
  assert.ok(Math.abs(pieceWeight({ form: 'COIL', storeListing: { family: 'Carbon Steel' } }, { thickness: 0.1, width: 48, length: 120 }) - 0.1 * 48 * 120 * 0.2836) < 1e-9);
});

test('the store offers only forms a product can have', () => {
  const service = fs.readFileSync(path.join(here, '..', 'src', 'services', 'ecomService.js'), 'utf8');
  const drawer = fs.readFileSync(path.join(here, '..', '..', 'frontend', 'src', 'components', 'ecommerce', 'ProductFiltersDrawer.jsx'), 'utf8');
  const schema = fs.readFileSync(path.join(here, '..', 'prisma', 'schema.prisma'), 'utf8');
  const forms = new Set(schema.match(/enum ProductForm \{([^}]*)\}/)[1].trim().split(/\s+/));
  const listed = JSON.parse(service.match(/const FORMS = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  const offered = [...drawer.matchAll(/value: '([A-Z_]+)'/g)].map((m) => m[1]);
  for (const f of [...listed, ...offered]) assert.ok(forms.has(f), `${f} is not a product form`);
  assert.ok(offered.includes('BEAM') && offered.includes('COIL'));
});

test('stock search: every word must match somewhere, in any order', () => {
  assert.deepEqual(searchWords('  a36  plate 96 '), ['a36', 'plate', '96']);
  assert.deepEqual(searchWords(''), []);
  assert.equal(searchWords('a b c d e f g h').length, 6);
  const m = wordMatch('plate');
  const fields = JSON.stringify(m);
  for (const f of ['coilNumber', 'heatNumber', 'grade', 'product', 'name', 'sku', 'location']) assert.ok(fields.includes(f), f);
});

test('what a search finds is added to the list once', () => {
  const have = [{ id: 'a', n: 1 }, { id: 'b', n: 1 }];
  const out = mergeStock(have, [{ id: 'b', n: 2 }, { id: 'c', n: 1 }]);
  assert.deepEqual(out.map((x) => `${x.id}${x.n}`), ['a1', 'b2', 'c1']);
  assert.deepEqual(mergeStock(null, null), []);
});

test('store search: "a36 plate" finds the A36 plate, each word anywhere in the product', async () => {
  const { productWordMatch } = await import('../src/lib/stockSearch.js');
  const service = fs.readFileSync(path.join(here, '..', 'src', 'services', 'ecomService.js'), 'utf8');
  assert.match(service, /searchWords\(query\)\.map\(productWordMatch\)/, 'the store search splits what is typed into words');
  const fields = JSON.stringify(productWordMatch('plate'));
  for (const f of ['name', 'sku', 'description', 'grade']) assert.ok(fields.includes(f), f);
});
