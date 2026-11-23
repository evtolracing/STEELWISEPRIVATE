#!/usr/bin/env node
// The screens added or rebuilt for the real locations (2026-11-22), each opened at phone, tablet and desktop
// size on the QA server: it must show its heading and its content, fit the width with no sideways scrolling of
// the page, raise no script error, and show its content within the repository's limit for a screen
// (3000 ms, qa/sim/phase11/s8-report.mjs; approved by the owner on 2026-11-22).
//   node qa/sim/ui-real-data-sizes.cjs --app http://localhost:5199 --api http://localhost:3001
const { chromium } = require('playwright');
const path = require('path');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const SCREEN_MS = 3000;
const SIZES = [['phone', 390, 844], ['tablet', 768, 1024], ['desktop', 1440, 900]];
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 420)); };

(async () => {
  if (!/(localhost|127\.0\.0\.1).*qa/.test(process.env.DATABASE_URL || '')) throw new Error('Refusing: DATABASE_URL is not a local QA database');
  const { PrismaClient } = require(path.resolve(__dirname, '../../src/backend/node_modules/@prisma/client'));
  const prisma = new PrismaClient();
  const owner = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!owner.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const delivered = await prisma.shipment.findFirst({ where: { status: 'DELIVERED' }, select: { id: true } });
  await prisma.$disconnect();

  // screen, address, what counts as "its content is showing".
  const SCREENS = [
    ['Locations', '/admin/locations', 'table, [role="table"]'],
    ['Users', '/admin/users', 'tbody tr'],
    ['Online Settings', '/admin/online-settings', 'h1, h4'],
    ['Tracking Board', '/freight/tracking', '[data-testid="freight-count-PENDING"]'],
    ['Exception Inbox', '/freight/exceptions', '[data-testid="freight-exceptions-table"], [data-testid="freight-exceptions-none"]'],
    ['Shipment Planner', '/freight/planner', '[data-testid="freight-planner-table"], [data-testid="freight-planner-none"]'],
    ['Proof of delivery', `/freight/pod/${delivered.id}`, '[data-testid="pod-proof"]'],
    ['Web store', '/shop', 'h1, h2, h3, h4'],
    ['Promise preview', '/mobile-rep/promise', 'h1, h2, h3, h4, h5, h6'],
    ['Order entry', '/orders/intake', 'h1, h2, h3, h4, h5, h6'],
  ];

  const browser = await chromium.launch();
  try {
    for (const [size, width, height] of SIZES) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: size === 'phone', hasTouch: size !== 'desktop' });
      await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, [owner.token, owner.user]);
      // One unmeasured opening of each screen: the QA dev server builds a screen's code the first time it is asked
      // for, which the built site never does. Every measured opening after that is a full page load.
      if (size === SIZES[0][0]) for (const [, url] of SCREENS) { const warm = await context.newPage(); await warm.goto(APP + url); await warm.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}); await warm.close(); }
      for (const [name, url, content] of SCREENS) {
        const page = await context.newPage();
        const crashes = [];
        page.on('pageerror', (e) => crashes.push(e.message));
        const label = `${name} at ${size} size (${width} wide)`;
        try {
          const t = Date.now();
          await page.goto(APP + url, { waitUntil: 'domcontentloaded' });
          const shown = await page.locator(content).first().waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
          const ms = Date.now() - t;
          await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
          const m = await page.evaluate(() => {
            const doc = document.documentElement;
            const main = document.querySelector('main') || document.body;
            const h = main.querySelector('h1');
            // Things wider than the page that are not inside a box that scrolls on its own.
            const wide = [...main.querySelectorAll('*')].filter((el) => {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.right <= window.innerWidth + 1) return false;
              for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return false; }
              return true;
            }).length;
            return { sideways: doc.scrollWidth - window.innerWidth, heading: h ? h.innerText.trim() : '', wide, text: document.body.innerText.slice(0, 4000) };
          });
          check(`${label}: its content shows`, shown);
          check(`${label}: it has a main heading`, m.heading.length > 0, m.heading);
          check(`${label}: the page does not scroll sideways and nothing runs off the edge`, m.sideways <= 1 && m.wide === 0, `${m.sideways}px wider, ${m.wide} elements off the edge`);
          check(`${label}: no sample banner, no crash, no script error`, !/Sample screen/.test(m.text) && !/Something went wrong|Unexpected Application Error/.test(m.text) && crashes.length === 0, crashes[0] || '');
          check(`${label}: content within ${SCREEN_MS} ms`, shown && ms <= SCREEN_MS, `${ms} ms`);
        } catch (e) {
          failed.push(`${label}: the walk stopped: ${String(e.message).slice(0, 200)}`);
        }
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`screens at three sizes: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
