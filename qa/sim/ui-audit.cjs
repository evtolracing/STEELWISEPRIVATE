#!/usr/bin/env node
// Phase 9. Opens every screen at desktop, tablet and phone size and measures what a person would meet:
// controls with no name, fields with no label, text that is hard to read, a page wider than the screen,
// touch targets too small to hit, headings, the page title, and how long the screen takes to settle.
// It also counts every control, which is the interaction inventory.
//   node qa/sim/ui-audit.cjs [--app http://localhost:5199] [--api http://localhost:3001] [--only /a,/b] [--out file]
// It reads; it presses nothing. Automated checks find a part of accessibility defects, never all of them.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-audit.json');
const WHO = arg('who', 'qa-admin@qa.test');
const ONLY = arg('only', '');
const WORKERS = Number(arg('workers', '4'));
const inventory = JSON.parse(fs.readFileSync(path.join(__dirname, '../.inventory.json'), 'utf8'));
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'phone', width: 390, height: 844 },
];

// Runs in the page. Everything it returns is plain data.
const measure = (viewportName) => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
    for (let p = el; p; p = p.parentElement) if (p.getAttribute && p.getAttribute('aria-hidden') === 'true') return false;
    return true;
  };
  const textOf = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const nameOf = (el) => {
    const by = el.getAttribute('aria-labelledby');
    if (by) { const t = by.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean).map((n) => n.textContent.trim()).join(' ').trim(); if (t) return t; }
    const al = (el.getAttribute('aria-label') || '').trim(); if (al) return al;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
      if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l && l.textContent.trim()) return l.textContent.trim(); }
      const wrap = el.closest('label'); if (wrap && wrap.textContent.trim()) return wrap.textContent.trim();
      if (el.type === 'submit' || el.type === 'button') return (el.value || '').trim();
      // A placeholder is not a label: it goes away when the person types.
      return (el.getAttribute('title') || '').trim();
    }
    const t = textOf(el); if (t) return t;
    const img = el.querySelector('img[alt]'); if (img && img.alt.trim()) return img.alt.trim();
    const svgTitle = el.querySelector('svg title'); if (svgTitle && svgTitle.textContent.trim()) return svgTitle.textContent.trim();
    return (el.getAttribute('title') || '').trim();
  };
  const where = (el) => {
    const bits = [];
    for (let p = el, n = 0; p && p !== document.body && n < 4; p = p.parentElement, n += 1) {
      const id = p.getAttribute('data-testid') || p.id;
      const cls = (typeof p.className === 'string' ? p.className : '').split(/\s+/).filter((c) => /^Mui[A-Z]\w+-root$/.test(c))[0];
      bits.unshift(`${p.tagName.toLowerCase()}${id ? `#${id}` : ''}${cls ? `.${cls}` : ''}`);
    }
    return bits.join('>');
  };
  const icon = (el) => { const s = el.querySelector('svg[data-testid]'); return s ? s.getAttribute('data-testid') : ''; };

  const out = { controls: 0, byKind: {}, unnamed: [], unlabelled: [], smallTargets: [], contrast: [], images: [] };
  const kindOf = (el) => {
    const role = el.getAttribute('role');
    if (role) return role;
    if (el.tagName === 'A') return 'link';
    if (el.tagName === 'BUTTON') return 'button';
    if (el.tagName === 'SELECT') return 'combobox';
    if (el.tagName === 'TEXTAREA') return 'textbox';
    if (el.tagName === 'INPUT') return ({ checkbox: 'checkbox', radio: 'radio', file: 'file', range: 'slider', submit: 'button', button: 'button' })[el.type] || 'textbox';
    return 'other';
  };
  const sel = 'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=menuitem], [role=checkbox], [role=switch], [role=radio], [role=combobox], [role=link], [role=option], [tabindex]:not([tabindex="-1"])';
  const seen = new Set();
  for (const el of document.querySelectorAll(sel)) {
    if (seen.has(el)) continue; seen.add(el);
    // MUI keeps the real input of a checkbox, radio or switch at zero opacity inside a visible span.
    const hiddenNative = el.tagName === 'INPUT' && /checkbox|radio/.test(el.type);
    if (!hiddenNative && !visible(el)) continue;
    if (hiddenNative && !visible(el.parentElement)) continue;
    if (el.tagName === 'INPUT' && el.type === 'file' && !visible(el)) continue;
    const kind = kindOf(el);
    if (kind === 'other' && !el.onclick && el.getAttribute('tabindex') === '0' && !textOf(el)) continue;
    // The hidden native select or input MUI keeps under its own Select is not a control a person meets.
    if (el.classList.contains('MuiSelect-nativeInput')) continue;
    out.controls += 1; out.byKind[kind] = (out.byKind[kind] || 0) + 1;
    const name = nameOf(el);
    const field = /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || kind === 'combobox';
    if (!name) {
      let label = name;
      if (field) {
        // MUI Select: the visible div[role=combobox] is named by aria-labelledby; FormControlLabel names a checkbox by its wrapping label.
        const fc = el.closest('.MuiFormControl-root'); const l = fc && fc.querySelector('label'); if (l && l.textContent.trim()) label = l.textContent.trim();
      }
      if (!label) (field ? out.unlabelled : out.unnamed).push({ kind, where: where(el), icon: icon(el), placeholder: el.getAttribute('placeholder') || '', title: el.getAttribute('title') || '' });
    }
    if (viewportName === 'phone' && !hiddenNative) {
      const r = el.getBoundingClientRect();
      // WCAG 2.2 AA, 2.5.8: 24 by 24 CSS pixels. Links in a sentence are exempt.
      const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
      if (!inline && (r.width < 24 || r.height < 24)) out.smallTargets.push({ kind, name: (name || icon(el)).slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), where: where(el) });
    }
  }
  for (const img of document.querySelectorAll('img')) if (visible(img) && !img.hasAttribute('alt')) out.images.push(where(img));

  // Contrast of text against what is behind it. Text over a picture or a gradient is left out and counted.
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const lum = ({ r, g, b }) => { const f = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const background = (el) => {
    const layers = [];
    for (let p = el; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a === 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (const l of layers.reverse()) base = over(l, base);
    return base;
  };
  out.textOverImage = 0; out.textChecked = 0;
  const pairs = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.nodeValue.replace(/\s+/g, ' ').trim();
    if (text.length < 2) continue;
    const el = n.parentElement;
    if (!el || !visible(el) || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName)) continue;
    if (el.closest('[disabled], [aria-disabled="true"], .Mui-disabled')) continue;
    const s = getComputedStyle(el);
    const fg0 = parse(s.color); if (!fg0) continue;
    const bg = background(el); if (!bg) { out.textOverImage += 1; continue; }
    let alpha = fg0.a; for (let p = el; p; p = p.parentElement) alpha *= Number(getComputedStyle(p).opacity);
    const fg = over({ ...fg0, a: alpha }, bg);
    const l1 = lum(fg); const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(s.fontSize); const bold = Number(s.fontWeight) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    out.textChecked += 1;
    if (ratio < (large ? 3 : 4.5)) {
      const hex = (c) => `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
      const key = `${hex(fg)} on ${hex(bg)}`;
      const e = pairs.get(key) || { pair: key, ratio: Math.round(ratio * 100) / 100, count: 0, sample: text.slice(0, 40), where: where(el), px };
      e.count += 1; pairs.set(key, e);
    }
  }
  out.contrast = [...pairs.values()];

  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible);
  out.h1 = hs.filter((h) => h.tagName === 'H1').length;
  out.headings = hs.length;
  out.firstHeading = hs[0] ? `${hs[0].tagName} ${textOf(hs[0]).slice(0, 50)}` : '';
  out.title = document.title;
  out.main = document.querySelectorAll('main, [role=main]').length;
  out.lang = document.documentElement.lang || '';
  out.overflowX = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
  out.tables = [...document.querySelectorAll('table')].filter(visible).length;
  out.tablesNoHead = [...document.querySelectorAll('table')].filter(visible).filter((t) => !t.querySelector('th')).length;
  out.dialogsOpen = document.querySelectorAll('[role=dialog]').length;
  out.textLength = (document.body.innerText || '').trim().length;
  return out;
};

(async () => {
  const login = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: WHO, password: 'qa-password-1' }) }).then((r) => r.json());
  if (!login.token) throw new Error(`login failed: ${JSON.stringify(login)}`);
  const browser = await chromium.launch();
  // The sub-applications are small routers of their own: their screens are read from their files.
  const nested = [];
  const appsDir = path.join(__dirname, '../../src/frontend/src/apps');
  const mounts = { dashboard: 'role-dashboard', orderhub: 'orderhub', safety: 'safety', bom: 'bom', optimization: 'optimization', planning: 'planning' };
  for (const [dir, mount] of Object.entries(mounts)) {
    const file = fs.readdirSync(path.join(appsDir, dir)).find((f) => /App\.jsx$/.test(f));
    if (!file) continue;
    const text = fs.readFileSync(path.join(appsDir, dir, file), 'utf8');
    if (/<Route\s+(index|path="\/")/.test(text)) nested.push(`/${mount}`);
    for (const m of text.matchAll(/<Route\s+path="\/?([^"*]+)"/g)) if (m[1] && m[1] !== '/') nested.push(`/${mount}/${m[1]}`);
  }
  const routes = [...new Set([...inventory.routes.map((r) => (r.startsWith('/') ? r : `/${r}`)), ...nested])].filter((r) => r !== '/login' && !r.includes('*')).filter((r) => !ONLY || ONLY.split(',').includes(r));
  // A screen for one record is measured on a real record, so it is the screen a person sees and not
  // its "not found" state. Where no record can be found the made-up id stays, and the result says so.
  const SOURCES = [
    [/^\/heats\/:/, '/api/heats?limit=1'], [/^\/units\/:/, '/api/coils?limit=1'], [/^\/work-orders\/:/, '/api/work-orders?limit=1'],
    [/^\/(shipping|logistics\/shipments)\/:/, '/api/shipments?limit=1'], [/^\/freight\/(route|comparison|pod)\/:/, '/api/shipments?limit=1'],
    [/^\/qc\/inspect\/:/, '/api/qc/inspections?limit=1'], [/^\/jobs\/:/, '/api/jobs?limit=1'], [/^\/material-tracking\/traceability\/:/, '/api/jobs?limit=1'],
    [/^\/orders\/:/, '/api/orders?limit=1'], [/^\/shopfloor\/:/, '/api/work-centers'], [/^\/shop\/products\/:/, '/api/ecom/catalog?limit=1'],
    [/^\/shop\/orders\/:/, '/api/ecom/my-orders'], [/^\/orderhub\/rfq\/:/, '/api/rfqs?limit=1'],
  ];
  const idCache = {};
  const realId = async (route) => {
    const src = SOURCES.find(([re]) => re.test(route)); if (!src) return null;
    if (!(src[1] in idCache)) {
      idCache[src[1]] = await fetch(API + src[1], { headers: { authorization: `Bearer ${login.token}` } }).then((r) => r.json()).then((d) => {
        const rows = Array.isArray(d) ? d : d.data || d.items || d.products || d.orders || d.rfqs || d.workCenters || Object.values(d).find(Array.isArray) || [];
        return rows[0] ? rows[0].id : null;
      }).catch(() => null);
    }
    return idCache[src[1]];
  };
  const ids = {};
  for (const route of routes.filter((r) => r.includes(':'))) ids[route] = await realId(route);
  const results = [];
  const jobs = [];
  for (const vp of VIEWPORTS) for (const route of routes) jobs.push({ vp, route });
  const contexts = {};
  for (const vp of VIEWPORTS) {
    contexts[vp.name] = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.name !== 'desktop', isMobile: vp.name === 'phone' });
    await contexts[vp.name].addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [login.token, login.user]);
  }
  let next = 0;
  const worker = async () => {
    for (;;) {
      const job = jobs[next]; next += 1; if (!job) return;
      const { vp, route } = job;
      const url = route.replace(/:[A-Za-z]+/g, ids[route] || '00000000-0000-4000-8000-000000000000');
      const page = await contexts[vp.name].newPage();
      const calls = [];
      const r = { route, viewport: vp.name, pageErrors: [], requests: 0, apiCalls: 0, hasParam: route.includes(':'), onRealRecord: route.includes(':') ? Boolean(ids[route]) : undefined };
      page.on('pageerror', (e) => r.pageErrors.push(String(e.message).slice(0, 200)));
      page.on('request', (q) => { r.requests += 1; const u = q.url(); if (u.includes('/api/')) calls.push(`${q.method()} ${u.replace(/^https?:\/\/[^/]+/, '')}`); });
      const t0 = Date.now();
      try {
        await page.goto(APP + url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
        r.settledMs = Date.now() - t0;
        // A screen whose code arrives late is measured once it has drawn, not while it is still blank.
        await page.locator('main h1, main h2, main [role="alert"]').first().waitFor({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(300);
        r.landedOn = new URL(page.url()).pathname;
        Object.assign(r, await page.evaluate(measure, vp.name));
      } catch (e) { r.failed = String(e.message).slice(0, 200); }
      const settled = calls.slice();
      const counts = {}; for (const c of settled) counts[c] = (counts[c] || 0) + 1;
      r.repeatedCalls = Object.entries(counts).filter(([, n]) => n > 1).map(([c, n]) => `${c} x${n}`);
      r.apiCalls = settled.length;
      results.push(r);
      process.stdout.write(r.failed ? 'F' : '.');
      await page.close();
    }
  };
  await Promise.all(Array.from({ length: WORKERS }, worker));
  await browser.close();

  const at = (name) => results.filter((r) => r.viewport === name && !r.failed);
  const sum = (rows, f) => rows.reduce((n, r) => n + f(r), 0);
  const d = at('desktop');
  const pairs = {};
  for (const r of d) for (const c of r.contrast || []) { const e = (pairs[c.pair] ||= { pair: c.pair, ratio: c.ratio, texts: 0, screens: 0, sample: c.sample, where: c.where }); e.texts += c.count; e.screens += 1; }
  const summary = {
    screens: routes.length,
    failedToOpen: results.filter((r) => r.failed).map((r) => `${r.viewport} ${r.route}`),
    controls: sum(d, (r) => r.controls),
    controlsByKind: d.reduce((m, r) => { for (const [k, v] of Object.entries(r.byKind || {})) m[k] = (m[k] || 0) + v; return m; }, {}),
    unnamedControls: sum(d, (r) => r.unnamed.length), screensWithUnnamedControls: d.filter((r) => r.unnamed.length).length,
    unlabelledFields: sum(d, (r) => r.unlabelled.length), screensWithUnlabelledFields: d.filter((r) => r.unlabelled.length).length,
    lowContrastTexts: sum(d, (r) => (r.contrast || []).reduce((n, c) => n + c.count, 0)), screensWithLowContrast: d.filter((r) => (r.contrast || []).length).length,
    lowContrastPairs: Object.values(pairs).sort((a, b) => b.texts - a.texts),
    imagesWithNoAlt: sum(d, (r) => r.images.length),
    screensWithNoH1: d.filter((r) => r.h1 === 0).length, screensWithSeveralH1: d.filter((r) => r.h1 > 1).length,
    screensWithNoMain: d.filter((r) => r.main === 0).length,
    distinctTitles: new Set(d.map((r) => r.title)).size,
    tablesWithNoHeader: sum(d, (r) => r.tablesNoHead),
    overflow: Object.fromEntries(VIEWPORTS.map((v) => [v.name, at(v.name).filter((r) => r.overflowX > 1).length])),
    smallTargetsOnPhone: sum(at('phone'), (r) => r.smallTargets.length), screensWithSmallTargets: at('phone').filter((r) => r.smallTargets.length).length,
    pageErrors: results.filter((r) => r.pageErrors.length).length,
    screensRepeatingACall: d.filter((r) => r.repeatedCalls.length).length,
    settledMs: (() => { const t = d.map((r) => r.settledMs).sort((a, b) => a - b); return { median: t[Math.floor(t.length / 2)], p95: t[Math.floor(t.length * 0.95)], max: t[t.length - 1] }; })(),
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), who: WHO, viewports: VIEWPORTS, summary, results }, null, 1));
  const { lowContrastPairs, controlsByKind, ...short } = summary;
  console.log(`\n${JSON.stringify(short, null, 1)}`);
  console.log(`controls by kind: ${JSON.stringify(controlsByKind)}`);
  console.log(`low-contrast colour pairs: ${lowContrastPairs.length}`);
  for (const p of lowContrastPairs.slice(0, 25)) console.log(`  ${p.pair} ${p.ratio}:1  ${p.texts} texts on ${p.screens} screens  e.g. "${p.sample}" ${p.where}`);
})().catch((e) => { console.error(e); process.exit(1); });
