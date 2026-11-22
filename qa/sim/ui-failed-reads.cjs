#!/usr/bin/env node
// Reliability of the screens rebuilt on real data (2026-11-22): when the server cannot answer, each screen must
// say so, show no record, and never show the "nothing here" message that would be true only of a good answer.
// The failure is made in the browser (the request is answered with a 500, or cut), so the QA server is untouched.
// Bad input sent straight to the new routes must be refused with a 4xx, never crash them.
//   node qa/sim/ui-failed-reads.cjs --app http://localhost:5199 --api http://localhost:3001
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 420)); };

// screen, the read that fails, what must be shown, what must not be shown.
const SCREENS = [
  { name: 'Tracking Board', url: '/freight/tracking', fail: /\/api\/shipments(\?|$)/, says: '[data-testid="freight-board-error"]', never: ['[data-testid="freight-card"]'] },
  { name: 'Exception Inbox', url: '/freight/exceptions', fail: /\/api\/shipments(\?|$)/, says: '[data-testid="freight-exceptions-error"]', never: ['[data-testid="freight-exception-row"]', '[data-testid="freight-exceptions-none"]'] },
  { name: 'Shipment Planner', url: '/freight/planner', fail: /\/api\/shipments\/ready-orders/, says: '[data-testid="freight-planner-error"]', never: ['[data-testid="freight-planner-row"]', '[data-testid="freight-planner-none"]'] },
  { name: 'Proof of delivery', url: '/freight/pod/any-shipment', fail: /\/api\/shipments\/any-shipment/, says: '[data-testid="pod-error"]', never: ['[data-testid="pod-proof"]', '[data-testid="pod-signed-by"]'] },
  { name: 'Locations', url: '/admin/locations', fail: /\/api\/admin\/locations/, says: '.MuiAlert-standardError, .MuiAlert-filledError, .MuiAlert-outlinedError', never: ['tbody tr[data-testid]'] },
  { name: 'Users', url: '/admin/users', fail: /\/api\/users(\?|$)/, says: '.MuiAlert-standardError', never: ['[data-testid="users-no-branch"]', '[data-testid="user-no-branch"]'] },
  { name: 'Online Settings', url: '/admin/online-settings', fail: /\/api\/ecom\/cutoff-rules/, says: '[data-testid="online-settings-error"]', never: ['[data-testid="cutoff-no-branches"]', '[data-testid="cutoff-not-set"]'] },
  { name: 'Web store', url: '/shop', fail: /\/api\/ecom\/branches/, says: '[data-testid="store-branches-error"]', never: [] },
  { name: 'Promise preview', url: '/mobile-rep/promise', fail: /\/api\/ecom\/branches/, says: '.MuiAlert-standardError', never: ['[data-testid="promise-no-branches"]'] },
  { name: 'Order entry, branch comparison', url: '/orders/intake', fail: /\/api\/ecom\/branch-comparison/, says: '[data-testid="branch-comparison-error"]', never: [] },
];
const MADE_UP = /SHP-2026-00\d\d|FastFreight|Toledo Facility|loc-[1-4]\b/;

(async () => {
  const owner = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!owner.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const browser = await chromium.launch();
  try {
    for (const how of ['the server answers with an error', 'the connection is cut']) {
      for (const s of SCREENS) {
        const context = await browser.newContext({ viewport: { width: 1400, height: 950 } });
        await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, [owner.token, owner.user]);
        const page = await context.newPage();
        const crashes = [];
        page.on('pageerror', (e) => crashes.push(e.message));
        let hit = 0;
        await page.route((url) => s.fail.test(url.pathname + url.search), (route) => {
          hit += 1;
          return how === 'the connection is cut' ? route.abort('connectionfailed') : route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'QA made this read fail' }) });
        });
        const label = `${s.name}, ${how}`;
        try {
          await page.goto(APP + s.url);
          const shown = await page.locator(s.says).first().waitFor({ timeout: 20000 }).then(() => true).catch(() => false);
          check(`${label}: the read was made and the screen says it failed`, hit > 0 && shown, `requests ${hit}, message ${shown}`);
          let wrong = 0;
          for (const n of s.never) wrong += await page.locator(n).count();
          const text = await page.locator('body').innerText();
          check(`${label}: no record, no "nothing here" message and nothing made up is shown`, wrong === 0 && !MADE_UP.test(text), `${wrong} wrong elements`);
          check(`${label}: the page did not crash`, crashes.length === 0 && !/Something went wrong|Unexpected Application Error/.test(text), crashes[0] || '');
        } catch (e) {
          failed.push(`${label}: the walk stopped: ${String(e.message).slice(0, 200)}`);
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  // Bad input straight to the new routes: refused, never a crash.
  const call = async (method, url, body) => { const r = await fetch(API + url, { method, headers: { authorization: `Bearer ${owner.token}`, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return r.status; };
  const BAD = [
    ['GET', '/api/shipments?scope=everything'], ['GET', '/api/shipments?status=NOPE'], ['GET', '/api/shipments/no-such-shipment'],
    ['GET', '/api/ecom/cutoff-rules/no-such-branch'], ['PUT', '/api/admin/online-settings/cutoff-rules/no-such-branch', { divisionRules: 7 }],
    ['PUT', '/api/admin/online-settings/cutoff-rules/no-such-branch', { divisionRules: { METALS: { cutoffLocal: '99:99' } } }],
    ['POST', '/api/ecom/branch-comparison', { division: ['x'], requiredProcessing: 'not a list', shipTo: { lat: 'north', lng: {} } }],
    ['POST', '/api/ecom/branch-comparison', null], ['POST', '/api/demand-shaping/suggestions', { location: { $gt: '' }, items: 'x' }],
    ['PUT', '/api/demand-shaping/config', { branches: 'x', nonsense: [1, 2] }], ['GET', '/api/admin/locations/no-such-location'],
    ['POST', '/api/admin/locations', { code: '', name: null, lat: 'x' }], ['GET', '/api/users?noBranch=maybe&limit=5'],
  ];
  for (const [method, url, body] of BAD) {
    const status = await call(method, url, body);
    check(`${method} ${url} with bad input is answered without a server error`, status < 500, String(status));
  }
  const still = await call('GET', '/api/health');
  check('the server is still up afterwards', still === 200, String(still));

  console.log(`failed reads: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
