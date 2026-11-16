// Responsive design and accessibility.
module.exports = async (s) => {
  const { sc, P, boss, clerk, api, ctx, open, text, has, shown, gone, pathOf, settle, until, APP, PASSWORD, SIZES, w, B, prisma } = s;
  const REAL = ['/orders', '/customers', '/units', '/shipping', '/orders/invoices', '/receiving', '/work-orders', '/heats', '/purchase-orders', '/sales/rfq-inbox'];

  // What sticks out of the screen: an element of the page content whose right edge is past the viewport
  // and which no ancestor lets the person scroll to.
  const stickingOut = (page) => page.evaluate(() => {
    const vw = window.innerWidth; const out = [];
    const scrollable = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === 'auto' || o === 'scroll') && p.scrollWidth > p.clientWidth) return true; if (o === 'hidden' && p.getBoundingClientRect().right <= vw + 1) return 'clipped'; } return false; };
    for (const el of document.querySelectorAll('main *')) { const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue; if (r.right > vw + 2 || r.left < -2) { const sc = scrollable(el); if (!sc) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} right=${Math.round(r.right)}`); } }
    return { pageWide: document.documentElement.scrollWidth - vw, out: out.slice(0, 4), count: out.length };
  });

  for (const url of ['/orders', '/customers', '/units', '/shipping', '/orders/invoices']) {
    await sc('FIT', `${url} fits five screen sizes, from a wide monitor to a small phone, with nothing out of reach`, async (t) => {
      for (const size of ['wide', 'laptop', 'tablet', 'phone', 'small']) {
        const c = await ctx(boss, size); const page = await open(c, url); await settle(page, 800); const r = await stickingOut(page);
        t.check(`${size} ${SIZES[size].width}px: the page does not scroll sideways`, r.pageWide <= 1, r.pageWide);
        t.check(`${size}: nothing in the page is out of reach`, r.count === 0, `${r.count}: ${r.out.join(' | ')}`);
        t.check(`${size}: the heading is on screen`, await page.locator('main h1').first().isVisible());
        await c.close();
      }
    });
  }

  await sc('FIT', 'with text at twice the size the main screens still do not scroll sideways', async (t) => {
    const c = await ctx(boss, 'laptop');
    for (const url of ['/orders', '/shipping', '/units']) { const page = await open(c, url); await settle(page, 600); await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; }); await page.waitForTimeout(500); const r = await stickingOut(page); t.check(`${url}: no sideways scroll at 200% text`, r.pageWide <= 1, r.pageWide); t.check(`${url}: the heading is still whole`, await page.locator('main h1').first().evaluate((h) => h.scrollWidth <= h.clientWidth + 1)); await page.close(); }
  });

  await sc('FIT', 'on a phone a wide table scrolls inside its own frame and keeps its headers', async (t) => {
    const c = await ctx(boss, 'phone', { hasTouch: true, isMobile: true });
    for (const url of ['/customers', '/units', '/shipping']) { const page = await open(c, url); await page.locator('main table').first().waitFor(); const r = await page.locator('main table').first().evaluate((tb) => { let p = tb.parentElement; while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return { frame: true, wider: tb.scrollWidth > p.clientWidth, right: p.getBoundingClientRect().right }; p = p.parentElement; } return { frame: false }; }); t.check(`${url}: the table has a scrolling frame no wider than the phone`, r.frame && r.right <= 391, JSON.stringify(r)); t.check(`${url}: the column headers are there`, (await page.locator('main thead th').count()) >= 5); await page.close(); }
  });

  await sc('FIT', 'on a phone every button and link in the main lists is big enough for a finger', async (t) => {
    const c = await ctx(boss, 'phone', { hasTouch: true, isMobile: true });
    for (const url of ['/orders', '/shipping', '/units', '/customers']) { const page = await open(c, url); await settle(page, 800); const small = await page.evaluate(() => [...document.querySelectorAll('main button, main a[href], main [role="button"], main input, header button')].map((e) => ({ r: (e.tagName === 'INPUT' ? (e.closest('.MuiInputBase-root, .MuiFormControlLabel-root, .MuiCheckbox-root, .MuiSwitch-root, label') || e) : e).getBoundingClientRect(), n: (e.getAttribute('aria-label') || e.innerText || e.tagName).slice(0, 24) })).filter((x) => x.r.width > 0 && x.r.height > 0 && (x.r.width < 24 || x.r.height < 24)).map((x) => `${x.n} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`)); t.check(`${url}: nothing under 24 by 24 px`, small.length === 0, small.slice(0, 4).join(' | ')); await page.close(); }
  });

  await sc('FIT', 'on a tablet the menu is put away and the page uses the whole width', async (t) => {
    const c = await ctx(clerk, 'tablet'); const page = await open(c, '/orders'); await settle(page);
    t.check('the menu is not taking space', !(await page.locator('nav[aria-label="Main menu"] a[href]:visible').count()));
    const m = await page.locator('main').boundingBox(); t.check('the content is the full 768 px wide', m && m.width >= 760, JSON.stringify(m));
    t.check('the menu button is offered', await page.getByRole('button', { name: 'Open the menu' }).isVisible());
  });

  await sc('FIT', 'a phone turned sideways: a dialog fits the height and its buttons can be reached', async (t) => {
    const c = await ctx(boss, { width: 844, height: 390 }, { hasTouch: true, isMobile: true }); const page = await open(c, '/customers');
    await page.getByRole('button', { name: 'New Customer', exact: true }).click(); const dialog = page.getByRole('dialog'); await dialog.waitFor(); const box = await dialog.boundingBox();
    t.check('the dialog is no taller than the screen', box && box.height <= 390 && box.y >= 0, JSON.stringify(box));
    const save = dialog.getByRole('button', { name: 'Create Customer' }); await save.scrollIntoViewIfNeeded(); const b = await save.boundingBox(); t.check('the save button can be brought on screen', b && b.y >= 0 && b.y + b.height <= 391, JSON.stringify(b));
  });

  await sc('FIT', 'signing in and opening a page needs no mouse', async (t) => {
    const c = await ctx(null); const page = await open(c, '/login', { wait: 'h1' });
    await page.keyboard.press('Tab'); let guard = 0; while (!(await page.evaluate(() => document.activeElement && document.activeElement.type === 'email' || (document.activeElement.labels && document.activeElement.labels[0] && /Email/.test(document.activeElement.labels[0].innerText)))) && guard < 6) { await page.keyboard.press('Tab'); guard += 1; }
    await page.keyboard.type(clerk.email); await page.keyboard.press('Tab'); await page.keyboard.type(PASSWORD); await page.keyboard.press('Enter');
    await until(() => pathOf(page) === '/orders', 15000); t.check('signed in with the keyboard alone', pathOf(page) === '/orders', pathOf(page));
    await page.locator('main h1').first().waitFor(); await page.keyboard.press('Control+k'); await page.keyboard.type('customers'); await shown(page.locator('[data-testid="global-search-results"] [role="option"]')); await page.keyboard.press('Enter');
    await until(() => pathOf(page) === '/customers'); t.check('and reached another page the same way', pathOf(page) === '/customers', pathOf(page));
  });

  await sc('FIT', 'the keyboard’s place is always visible: every stop of the first twenty has a focus ring', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/customers'); await page.locator('main tbody tr').first().waitFor(); const bare = [];
    for (let i = 0; i < 20; i += 1) { await page.keyboard.press('Tab'); await page.waitForTimeout(260); const f = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const st = getComputedStyle(e); const ring = (st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) >= 2) || st.boxShadow !== 'none'; const parent = e.closest('.MuiInputBase-root, .MuiOutlinedInput-root'); const pr = parent ? getComputedStyle(parent) : null; return { ring: ring || Boolean(pr && (pr.outlineStyle !== 'none' || pr.boxShadow !== 'none' || parent.classList.contains('Mui-focused'))), n: (e.getAttribute('aria-label') || e.innerText || e.tagName).slice(0, 30) }; }); if (f && !f.ring) bare.push(f.n); }
    t.check('no stop is without a visible ring', bare.length === 0, bare.join(' | '));
    t.check('nothing on the page jumps the Tab order', (await page.locator('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').count()) === 0);
  });

  await sc('FIT', 'each main screen has one heading, one main area, a named menu and a search landmark', async (t) => {
    const c = await ctx(boss);
    for (const url of REAL) { const page = await open(c, url); await settle(page, 500); const r = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length, main: document.querySelectorAll('main').length, nav: document.querySelectorAll('nav[aria-label]').length, search: document.querySelectorAll('[role="search"]').length, banner: document.querySelectorAll('header').length, lang: document.documentElement.lang })); t.check(`${url}: one h1, one main, menu, search, header, language`, r.h1 === 1 && r.main === 1 && r.nav >= 1 && r.search === 1 && r.banner >= 1 && r.lang, JSON.stringify(r)); await page.close(); }
  });

  await sc('FIT', 'on the main screens no control is without a name and no field without a label', async (t) => {
    const c = await ctx(boss);
    for (const url of REAL) { const page = await open(c, url); await settle(page, 700); const bad = await page.evaluate(() => { const name = (e) => { const lb = e.getAttribute('aria-labelledby'); return (e.getAttribute('aria-label') || (lb && lb.split(' ').map((i) => (document.getElementById(i) || {}).innerText || '').join(' ')) || e.getAttribute('title') || (e.labels && e.labels[0] && e.labels[0].innerText) || e.innerText || e.getAttribute('placeholder') || e.getAttribute('alt') || '').trim(); }; return [...document.querySelectorAll('button, a[href], [role="button"], [role="tab"], input:not([type="hidden"]), textarea, [role="combobox"], select')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('[aria-hidden="true"]') && !name(e); }).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`).slice(0, 4); }); t.check(`${url}: every control has a name`, bad.length === 0, bad.join(' | ')); await page.close(); }
  });

  await sc('FIT', 'text on the main screens is readable against its background (4.5 to 1, or 3 to 1 for large text)', async (t) => {
    const c = await ctx(boss);
    for (const url of ['/orders', '/customers', '/units', '/shipping', '/orders/invoices', '/work-orders']) {
      const page = await open(c, url); await settle(page, 900);
      const low = await page.evaluate(() => { const parse = (v) => { const m = v.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; }; const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }; const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 }); const bgOf = (el) => { const stack = []; for (let p = el; p; p = p.parentElement) { const st = getComputedStyle(p); if (st.backgroundImage !== 'none') return null; const c = parse(st.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } } let bg = { r: 255, g: 255, b: 255, a: 1 }; for (const c of stack.reverse()) bg = over(c, bg); return bg; }; const out = []; const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT); for (let n = walker.nextNode(); n; n = walker.nextNode()) { const tx = n.textContent.trim(); const el = n.parentElement; if (tx.length < 2 || !el) continue; const r = el.getBoundingClientRect(); const st = getComputedStyle(el); if (!r.width || !r.height || st.visibility === 'hidden' || Number(st.opacity) < 0.9 || el.closest('[aria-hidden="true"], .Mui-disabled, [disabled]')) continue; const fg0 = parse(st.color); const bg = bgOf(el); if (!fg0 || !bg) continue; const fg = over(fg0, bg); const L1 = lum(fg); const L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); const size = parseFloat(st.fontSize); const large = size >= 24 || (size >= 18.66 && Number(st.fontWeight) >= 700); if (ratio < (large ? 3 : 4.5)) out.push(`"${tx.slice(0, 18)}" ${ratio.toFixed(2)}`); } return out; });
      t.check(`${url}: no text below the ratio`, low.length === 0, `${low.length}: ${low.slice(0, 4).join(' | ')}`); await page.close();
    }
  });

  await sc('FIT', 'a person who asks for less motion gets none: dialogs and the menu do not animate', async (t) => {
    const c = await ctx(boss, 'desktop', { reducedMotion: 'reduce' }); const page = await open(c, '/customers'); await page.getByRole('button', { name: 'New Customer', exact: true }).click(); await page.getByRole('dialog').waitFor();
    const d = await page.evaluate(() => [...document.querySelectorAll('.MuiDialog-paper, .MuiBackdrop-root, .MuiButton-root, .MuiDrawer-paper')].map((e) => getComputedStyle(e).transitionDuration.split(',').map((x) => parseFloat(x) * (x.includes('ms') ? 1 : 1000))).flat());
    t.check('no transition lasts longer than a hundredth of a millisecond', d.length > 0 && Math.max(...d) <= 0.011, Math.max(...d));
    const c2 = await ctx(boss); const p2 = await open(c2, '/customers'); const usual = await p2.evaluate(() => Math.max(...[...document.querySelectorAll('.MuiButton-root')].map((e) => parseFloat(getComputedStyle(e).transitionDuration) || 0))); t.check('while a person who did not ask still gets the usual motion', usual > 0, usual);
  });

  await sc('FIT', 'a form tells a screen reader what is required and what is wrong', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/customers'); await page.getByRole('button', { name: 'New Customer', exact: true }).click(); const dialog = page.getByRole('dialog'); await dialog.waitFor();
    const code = dialog.getByLabel('Code'); t.check('the required field says so', (await code.getAttribute('required')) !== null || (await code.getAttribute('aria-required')) === 'true');
    await dialog.getByRole('button', { name: 'Create Customer' }).click(); await page.waitForTimeout(700);
    const state = await code.evaluate((e) => ({ invalid: e.getAttribute('aria-invalid'), described: e.getAttribute('aria-describedby'), help: e.getAttribute('aria-describedby') ? (document.getElementById(e.getAttribute('aria-describedby')) || {}).innerText : '', native: !e.validity.valid }));
    t.check('the empty required field is marked wrong', state.invalid === 'true' || state.native, JSON.stringify(state));
    t.check('and the reason is tied to the field or announced', Boolean(state.help) || state.native || (await page.locator('[role="alert"]').count()) > 0, JSON.stringify(state));
    const c2 = await ctx(null); const p2 = await open(c2, '/login', { wait: 'h1' }); await p2.getByLabel('Email').fill('nobody@qa.test'); await p2.locator('input[type="password"]').fill('wrong-password'); await p2.getByRole('button', { name: /sign in/i }).click();
    t.check('a failed sign-in is announced as an alert', await shown(p2.getByRole('alert'), 8000));
  });

  await sc('FIT', 'messages that appear by themselves are announced, and the page can be zoomed', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/qaqc'); const buttons = await page.locator('main button:visible').all();
    for (const b of buttons) { const n = ((await b.innerText()) || '').trim(); if (!n || /Refresh/.test(n)) continue; await b.click().catch(() => {}); if (await page.locator('[data-testid="not-built-notice"]').isVisible().catch(() => false)) break; }
    const role = await page.locator('[data-testid="not-built-notice"]').evaluate((e) => (e.getAttribute('role') || (e.querySelector('[role]') || { getAttribute: () => '' }).getAttribute('role') || e.getAttribute('aria-live'))).catch(() => '');
    t.check('the notice is a status or an alert', /alert|status|polite|assertive/.test(String(role)), role);
    const vp = await page.evaluate(() => (document.querySelector('meta[name="viewport"]') || { content: '' }).content); t.check('zooming is not switched off', !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/.test(vp), vp);
  });

  await sc('FIT', 'tables say which column is which: header cells are real headers on every main list', async (t) => {
    const c = await ctx(boss);
    for (const url of ['/customers', '/units', '/shipping', '/orders/invoices', '/work-orders', '/heats']) { const page = await open(c, url); await page.locator('main table').first().waitFor(); const r = await page.locator('main table').first().evaluate((tb) => ({ th: tb.querySelectorAll('thead th').length, td: tb.querySelectorAll('thead td').length, empty: [...tb.querySelectorAll('thead th')].filter((h) => !(h.innerText || h.getAttribute('aria-label') || '').trim()).length, cols: tb.querySelector('tbody tr') ? tb.querySelector('tbody tr').children.length : 0 })); t.check(`${url}: headers for every column`, r.th >= 5 && r.td === 0 && r.empty <= 1 && (r.cols === 0 || r.cols === 1 || r.cols === r.th), JSON.stringify(r)); await page.close(); }
  });

  await sc('FIT', 'pictures and icons: none is read out as noise, none is missing its description', async (t) => {
    const c = await ctx(boss);
    for (const url of ['/orders', '/customers', '/shipping', '/']) { const page = await open(c, url); await settle(page, 600); const r = await page.evaluate(() => ({ imgNoAlt: [...document.querySelectorAll('img:not([alt])')].length, loudIcons: [...document.querySelectorAll('svg.MuiSvgIcon-root')].filter((x) => x.getAttribute('aria-hidden') !== 'true' && !x.getAttribute('aria-label') && !x.querySelector('title')).length })); t.check(`${url}: images described, icons silent`, r.imgNoAlt === 0 && r.loudIcons === 0, JSON.stringify(r)); await page.close(); }
  });
};
