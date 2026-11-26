// The working inventory in a real browser (2026-11-26): the store home, search and a form filter, the Steel Outlet,
// and the work order material search finding a piece among thousands. Against the QA server on the loaded QA copy.
//   node qa/sim/working-inventory-ui.cjs --app http://localhost:5199 --api http://localhost:3011 [--shots dir]
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3011');
const SHOTS = arg('shots', null);
const NOT_REAL = /\b(demo|mock|sample|dummy|placeholder)\b/i;
let pass = 0; let fail = 0;
const check = (name, ok, detail) => { (ok ? pass++ : fail++); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` :: ${String(detail).slice(0, 300)}`}`); };

(async () => {
  const login = await (await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) })).json();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, [login.token, login.user]);
  const page = await context.newPage();
  const errors = []; const failed = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 500) failed.push(`${r.status()} ${r.url()}`); });
  const shot = async (n) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: false }); };
  const text = async () => page.locator('body').innerText();

  await page.goto(`${APP}/shop`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  let t = await text();
  await shot('1-store-home');
  check('the store home shows products of the working inventory', /Steel Plate|Stainless|Aluminum|HDPE|UHMW|Brass/.test(t), t.slice(0, 300));
  check('the store home says nothing about demo or mock items', !NOT_REAL.test(t), (t.match(NOT_REAL) || [])[0]);

  for (const [q, want] of [['a36 plate', /A36/], ['304 stainless', /304/], ['uhmw', /UHMW/i], ['w8x31', /W8\s*x\s*31/i], ['6061', /6061/]]) {
    await page.goto(`${APP}/shop/search?q=${encodeURIComponent(q)}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    t = await text();
    check(`store search "${q}" finds it`, want.test(t), t.slice(0, 300));
  }
  await shot('2-store-search');
  await page.goto(`${APP}/shop/search`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const filters = page.getByRole('button', { name: /filter/i }).first();
  if (await filters.count()) await filters.click().catch(() => {});
  const beam = page.getByLabel(/Beam & channel/i).first();
  check('the form filter offers beams and channels', (await beam.count()) > 0, 'no Beam & channel box');
  if (await beam.count()) {
    await beam.check().catch(() => {});
    await page.waitForTimeout(1500);
    t = await text();
    await shot('3-store-beam-filter');
    check('ticking it shows beams and channels', /Wide Flange|Beam|Channel/i.test(t), t.slice(0, 300));
  }

  await page.goto(`${APP}/shop/remnants`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  t = await text();
  await shot('4-steel-outlet');
  check('the Steel Outlet shows pieces of the working inventory', /OUT-(JX|BC|PV|L2|CT)-|Drop|drop|Remnant|lb/.test(t) && /A36|304|6061|HDPE|A572|316/.test(t), t.slice(0, 400));
  check('the Steel Outlet says nothing about demo items', !NOT_REAL.test(t), (t.match(NOT_REAL) || [])[0]);

  await page.goto(`${APP}/work-orders/new`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const box = page.getByRole('combobox').first();
  check('the work order page has a material box', (await box.count()) > 0, 'no combobox');
  if (await box.count()) {
    await box.click();
    await box.fill('CT-26-1004');
    await page.waitForTimeout(2000);
    const opts = await page.getByRole('option').allInnerTexts();
    await shot('5-work-order-material-search');
    check('typing a tag finds pieces from the server, not only the newest 500', opts.some((o) => /CT-26-1004/.test(o)), JSON.stringify(opts.slice(0, 5)));
  }
  check('no page errors and no server errors', errors.length === 0 && failed.length === 0, [...errors, ...failed].join(' | '));
  await browser.close();
  console.log(`Working inventory in the browser: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
