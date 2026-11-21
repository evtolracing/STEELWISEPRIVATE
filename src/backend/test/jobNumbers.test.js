// Job numbers follow the order they are made for (owner's decision, 2026-11-21).
import test from 'node:test';
import assert from 'node:assert/strict';
import { orderPart, jobNumberCandidates, nextFreeSlot, createJobNumbered, JOB_NUMBER_PATTERN } from '../src/lib/jobNumbers.js';

const dup = (target = ['jobNumber']) => Object.assign(new Error('duplicate'), { code: 'P2002', meta: { target } });

test('a sales order gives its digits; any other order keeps its whole number', () => {
  assert.equal(orderPart('SO-00078'), '00078');
  assert.equal(orderPart('so-00078'), '00078');
  assert.equal(orderPart('TO-00012'), 'TO-00012');
  assert.equal(orderPart('WEB 2026/0001'), 'WEB-2026-0001');
  assert.equal(orderPart(''), null);
  assert.equal(orderPart(null), null);
});

test('line 1 of SO-00078 is JOB-00078-1, and a second job for it is JOB-00078-1B', () => {
  const c = jobNumberCandidates('SO-00078', 1);
  assert.equal(c[0], 'JOB-00078-1');
  assert.equal(c[1], 'JOB-00078-1B');
  assert.equal(c.at(-1), 'JOB-00078-1Z');
  assert.equal(jobNumberCandidates('SO-00078', 12)[0], 'JOB-00078-12');
  assert.equal(jobNumberCandidates('TO-00012', 2)[0], 'JOB-TO-00012-2');
  assert.deepEqual(jobNumberCandidates('SO-00078', 0), []);
  assert.deepEqual(jobNumberCandidates('', 1), []);
});

test('a job of the order with no line takes the number after its lines and its jobs', () => {
  assert.equal(nextFreeSlot('SO-00078', { lineNumbers: [1, 2], jobNumbers: ['JOB-00078-1', 'JOB-00078-2'] }), 3);
  assert.equal(nextFreeSlot('SO-00078', { lineNumbers: [1], jobNumbers: ['JOB-00078-1', 'JOB-00078-4B', 'JOB-00079-9', 'JOB-00075'] }), 5);
  assert.equal(nextFreeSlot('SO-00078', {}), 1);
});

test('an old job number never collides with a new one', () => {
  // Jobs numbered before the change are JOB-00078 (no line); the new ones always end in -<line>.
  assert.ok(!jobNumberCandidates('SO-00078', 1).includes('JOB-00078'));
});

test('the pattern finds old and new job numbers in text', () => {
  for (const n of ['JOB-00075', 'JOB-00078-1', 'JOB-00078-12B', 'JOB-TO-00012-2', 'JS-00012']) {
    assert.equal(`Expedite ${n} (Acme)`.match(JOB_NUMBER_PATTERN)?.[0], n, n);
  }
  assert.equal('Expedite SO-00078 now'.match(JOB_NUMBER_PATTERN), null);
});

const fakeClient = ({ lines = [], jobs = [], stockCount = 0 } = {}) => ({
  orderLine: { findMany: async () => lines.map((lineNumber) => ({ lineNumber })) },
  job: { findMany: async () => jobs.map((jobNumber) => ({ jobNumber })), count: async () => stockCount },
});

test('createJobNumbered: an order line gets its number, and the next letter when that is taken', async () => {
  const saved = [];
  const used = new Set(['JOB-00078-1']);
  const create = async (n) => { if (used.has(n)) throw dup(); used.add(n); saved.push(n); return { jobNumber: n }; };
  const order = { id: 'o1', orderNumber: 'SO-00078' };
  assert.equal((await createJobNumbered({ client: fakeClient(), order, lineNumber: 2, create })).jobNumber, 'JOB-00078-2');
  assert.equal((await createJobNumbered({ client: fakeClient(), order, lineNumber: 1, create })).jobNumber, 'JOB-00078-1B');
  assert.equal((await createJobNumbered({ client: fakeClient(), order, lineNumber: 1, create })).jobNumber, 'JOB-00078-1C');
});

test('createJobNumbered: a job of the order with no line, and a job with no order', async () => {
  const create = async (n) => ({ jobNumber: n });
  const order = { id: 'o1', orderNumber: 'SO-00078' };
  assert.equal((await createJobNumbered({ client: fakeClient({ lines: [1, 2], jobs: ['JOB-00078-1', 'JOB-00078-2'] }), order, create })).jobNumber, 'JOB-00078-3');
  assert.equal((await createJobNumbered({ client: fakeClient({ stockCount: 11 }), order: null, create, })).jobNumber, 'JS-00012');
});

test('createJobNumbered: a refusal that is not about the number is not hidden', async () => {
  const order = { id: 'o1', orderNumber: 'SO-00078' };
  await assert.rejects(createJobNumbered({ client: fakeClient(), order, lineNumber: 1, create: async () => { throw dup(['orderLineId']); } }), /duplicate/);
  await assert.rejects(createJobNumbered({ client: fakeClient(), order, lineNumber: 1, create: async () => { throw new Error('offline'); } }), /offline/);
});
