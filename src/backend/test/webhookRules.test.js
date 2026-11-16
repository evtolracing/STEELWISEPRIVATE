import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL ||= 'postgresql://postgres:password@localhost:5432/steelwise_qa';
const { RETRY_AFTER_MS, retryDelay, privateAddress, targetProblem, generateSignature, timedSignature, verifyTimedSignature } = await import('../src/services/webhookService.js');

test('retries wait 1, 5, 30 and 120 minutes, and never longer', () => {
  assert.deepEqual(RETRY_AFTER_MS.map((ms) => ms / 60000), [1, 5, 30, 120]);
  assert.equal(retryDelay(1), 60_000);
  assert.equal(retryDelay(2), 300_000);
  assert.equal(retryDelay(4), 7_200_000);
  assert.equal(retryDelay(40), 7_200_000);
  assert.equal(retryDelay(0), 60_000);
});

test('addresses inside a network are recognised', () => {
  for (const ip of ['10.0.0.1', '127.0.0.1', '172.16.5.4', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', '::ffff:10.0.0.1', 'fd00::1', 'fe80::1']) assert.equal(privateAddress(ip), true, ip);
  for (const ip of ['8.8.8.8', '172.32.0.1', '93.184.216.34', '2606:4700::1111']) assert.equal(privateAddress(ip), false, ip);
});

test('a webhook address must be a plain web address', () => {
  assert.match(targetProblem('not a url'), /valid address/);
  assert.match(targetProblem('ftp://example.com/x'), /https/);
  assert.match(targetProblem('file:///etc/passwd'), /https/);
  assert.match(targetProblem('https://user:pass@example.com/x'), /user name or password/);
  assert.equal(targetProblem('http://127.0.0.1:3056/hook', { production: false }), null);
});

test('in production a webhook may only go to a public https address', () => {
  const p = { production: true };
  assert.ok(targetProblem('http://example.com/hook', p));
  for (const url of ['https://localhost/hook', 'https://127.0.0.1/hook', 'https://10.1.2.3/hook', 'https://169.254.169.254/latest/meta-data', 'https://[::1]/hook', 'https://192.168.0.10:8443/x']) assert.ok(targetProblem(url, p), url);
  assert.equal(targetProblem('https://partner.example.com/hooks/steelwise', p), null);
});

test('the timed signature covers the time and the body, and expires', () => {
  const secret = 'whsec_test_only'; const body = JSON.stringify({ id: 'evt_1', type: 'shipment.dispatched' });
  const t = 1_800_000_000;
  const header = timedSignature(secret, body, t);
  assert.match(header, /^t=1800000000,v1=[0-9a-f]{64}$/);
  assert.equal(verifyTimedSignature(secret, body, header, { now: t * 1000 }), true);
  assert.equal(verifyTimedSignature(secret, body, header, { now: (t + 299) * 1000 }), true);
  assert.equal(verifyTimedSignature(secret, body, header, { now: (t + 301) * 1000 }), false, 'an old request is refused');
  assert.equal(verifyTimedSignature(secret, `${body} `, header, { now: t * 1000 }), false, 'a changed body is refused');
  assert.equal(verifyTimedSignature('other', body, header, { now: t * 1000 }), false, 'another secret is refused');
  assert.equal(verifyTimedSignature(secret, body, header.replace('t=1800000000', 't=1800000100'), { now: (t + 100) * 1000 }), false, 'a changed time is refused');
  for (const bad of ['', null, 'v1=abc', 't=abc,v1=abc', 't=1800000000']) assert.equal(verifyTimedSignature(secret, body, bad, { now: t * 1000 }), false, String(bad));
});

test('the older signature header is unchanged for existing receivers', () => {
  assert.match(generateSignature('{"a":1}', 's'), /^sha256=[0-9a-f]{64}$/);
  assert.equal(generateSignature({ a: 1 }, 's'), generateSignature('{"a":1}', 's'));
  assert.notEqual(generateSignature('{"a":1}', 's'), generateSignature('{"a":1}', 's2'));
});
