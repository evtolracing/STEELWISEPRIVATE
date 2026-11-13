import test from 'node:test';
import assert from 'node:assert/strict';
import { createNumbered, padded, retryOverlap } from '../src/lib/numbering.js';

const dup = () => Object.assign(new Error('duplicate'), { code: 'P2002' });
const overlap = () => Object.assign(new Error('overlap'), { code: 'P2034' });

test('padded formats a series number', () => {
  assert.equal(padded('SO')(42), 'SO-00042');
  assert.equal(padded('JOB', 3)(7), 'JOB-007');
});

test('createNumbered uses count + 1 when it is free', async () => {
  const made = await createNumbered({ count: async () => 9, format: padded('SO'), create: async (n) => n });
  assert.equal(made, 'SO-00010');
});

test('createNumbered moves on when the number is already taken', async () => {
  const taken = new Set(['SO-00010', 'SO-00011']);
  const made = await createNumbered({ count: async () => 9, format: padded('SO'), create: async (n) => { if (taken.has(n)) throw dup(); return n; } });
  assert.equal(made, 'SO-00012');
});

test('createNumbered: 25 simultaneous saves all get different numbers', async () => {
  const taken = new Set();
  const create = async (n) => { await new Promise((r) => setTimeout(r, Math.random() * 3)); if (taken.has(n)) throw dup(); taken.add(n); return n; };
  const results = await Promise.all(Array.from({ length: 25 }, () => createNumbered({ count: async () => taken.size, format: padded('SO'), create, attempts: 200 })));
  assert.equal(new Set(results).size, 25);
});

test('createNumbered retries the same number after a transaction overlap', async () => {
  let calls = 0;
  const made = await createNumbered({ count: async () => 0, format: padded('SHP'), create: async (n) => { if (++calls < 3) throw overlap(); return n; } });
  assert.equal(made, 'SHP-00001');
});

test('createNumbered passes other errors straight through and gives up eventually', async () => {
  await assert.rejects(() => createNumbered({ count: async () => 0, format: padded('SO'), create: async () => { throw new Error('boom'); } }), /boom/);
  await assert.rejects(() => createNumbered({ count: async () => 0, format: padded('SO'), create: async () => { throw dup(); }, attempts: 4 }), /unique number/);
});

test('retryOverlap retries overlaps only', async () => {
  let n = 0;
  assert.equal(await retryOverlap(async () => { if (++n < 3) throw overlap(); return 'ok'; }), 'ok');
  await assert.rejects(() => retryOverlap(async () => { throw new Error('other'); }), /other/);
  await assert.rejects(() => retryOverlap(async () => { throw overlap(); }, 2), /overlap/);
});
