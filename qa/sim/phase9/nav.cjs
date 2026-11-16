// Navigation, layout and role access.
module.exports = async (s) => {
  const { sc, P, boss, clerk, dock, shopper, api, rowsOf, ctx, open, text, has, shown, gone, pathOf, settle, until, APP, PASSWORD, w, B } = s;
  const MENU = 'nav[aria-label="Main menu"]';
  const menuLinks = async (page) => {
    for (let i = 0; i < 3; i += 1) for (const b of await page.locator(`${MENU} [aria-expanded="false"]`).all()) await b.click().catch(() => {});
    return [...new Set(await page.locator(`${MENU} a[href]`).evaluateAll((a) => a.map((x) => x.getAttribute('href'))))];
  };
  const signInByForm = async (page, email) => {
    await page.getByLabel('Email').fill(email);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
  };

  // One scenario per role: where it starts, what its menu offers, what it is refused.
  // The expectations are written here by hand from the permissions matrix, not read from the app.
  const ROLES = [
    ['a sales representative', P.rep, '/orders', '/customers', ['/admin/users', '/schedule'], ['/admin', '/schedule', '/executive'], null],
    ['a customer service clerk', clerk, '/orders', '/shipping', ['/admin/users', '/work-orders'], ['/admin', '/work-orders'], null],
    ['a saw operator', P.operator, '/shopfloor', '/schedule', ['/customers', '/shipping', '/admin/users'], ['/customers', '/shipping', '/admin'], '/api/invoices'],
    ['a production manager', P.planner, '/schedule', '/shipping', ['/customers', '/admin/users'], ['/customers', '/admin'], '/api/invoices'],
    ['a scheduler', P.scheduler, '/schedule', '/work-orders', ['/customers', '/shipping'], ['/customers', '/shipping'], '/api/invoices'],
    ['a receiving clerk', P.receiver, '/receiving', '/units', ['/customers', '/schedule', '/admin/users'], ['/customers', '/schedule', '/admin'], '/api/invoices'],
    ['a shipping coordinator', P.shipper, '/shipping', '/receiving', ['/customers', '/qc'], ['/customers', '/qc/'], '/api/invoices'],
    ['an inventory manager', P.stock, '/units', '/receiving', ['/customers', '/executive/cockpit'], ['/customers', '/executive'], '/api/invoices'],
    ['a buyer', P.buyer, '/units', '/purchase-orders', ['/customers', '/schedule'], ['/customers', '/schedule'], '/api/invoices'],
    ['a quality inspector', P.inspector, '/qc', '/units', ['/customers', '/shipping', '/admin/users'], ['/customers', '/shipping', '/admin'], '/api/invoices'],
    ['an auditor', P.auditor, '/', '/qc', ['/customers', '/admin/users'], ['/customers', '/admin'], null],
    ['a credit manager', P.credit, '/orders', '/orders/invoices', ['/admin/users', '/schedule'], ['/admin', '/schedule'], null],
    ['a maintenance manager', P.upkeep, '/', '/schedule', ['/customers', '/shipping'], ['/customers', '/shipping'], '/api/invoices'],
    ['a data analyst', P.analyst, '/', '/customers', ['/admin/users'], ['/admin'], null],
    ['the chief financial officer', P.cfo, '/', '/orders/invoices', ['/admin/users'], ['/admin/users'], null],
  ];
  for (const [label, who, start, allowed, refused, noMenu, refusedApi] of ROLES) {
    await sc('NAV', `${label} signs in at the form, starts at ${start}, and the menu and the server refuse what the role may not open`, async (t) => {
      const c = await ctx(null); const page = await open(c, '/login', { wait: 'h1' });
      await signInByForm(page, who.email);
      await until(() => pathOf(page) === start && pathOf(page) !== '/login', 15000); await page.waitForTimeout(700);
      await page.locator(`${MENU} a[href]`).first().waitFor({ timeout: 15000 }).catch(() => {});
      t.check('starts at the role’s own workspace', pathOf(page) === start, pathOf(page));
      const links = await menuLinks(page);
      t.check('the menu has links', links.length > 3, links.length);
      const leaked = links.filter((h) => noMenu.some((p) => h === p || h.startsWith(p.endsWith('/') ? p : `${p}/`) || h === p.replace(/\/$/, '')));
      t.check('the menu offers nothing from a refused area', leaked.length === 0, leaked.join(' '));
      t.check('the menu offers the role’s own work', links.includes(allowed) || links.some((h) => h.startsWith(allowed)), `${allowed} not in ${links.slice(0, 12).join(' ')}`);
      await page.goto(APP + allowed, { waitUntil: 'domcontentloaded' });
      await page.locator('main h1').first().waitFor({ timeout: 15000 }).catch(() => {});
      t.check('an allowed page opens', !/No access|Page not found/.test(await text(page, 'main h1')), await text(page, 'main h1'));
      for (const url of refused) {
        await page.goto(APP + url, { waitUntil: 'domcontentloaded' });
        t.check(`${url} says No access`, await has(page, 'No access', 8000), (await text(page, 'main')).slice(0, 120));
      }
      if (refusedApi) { const r = await api(who, 'GET', refusedApi); t.check(`the server refuses ${refusedApi} too`, r.status === 403, r.status); }
      t.check('no page error', page.errors.length === 0, page.errors[0]);
    });
  }

  await sc('NAV', 'a web shop customer starts in the shop and cannot open a staff page', async (t) => {
    const c = await ctx(null); const page = await open(c, '/login', { wait: 'h1' });
    await signInByForm(page, shopper.email);
    await until(() => pathOf(page).startsWith('/shop'), 15000);
    t.check('starts in the shop', pathOf(page).startsWith('/shop'), pathOf(page));
    for (const url of ['/orders', '/units', '/admin/users']) {
      await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); await settle(page, 300);
      const body = await text(page);
      t.check(`${url} is refused`, /No access/.test(body) || pathOf(page).startsWith('/shop'), `${pathOf(page)} ${body.slice(0, 100)}`);
    }
    const r = await api(shopper, 'GET', '/api/coils?limit=1'); t.check('the server refuses the stock list', r.status === 403, r.status);
  });

  await sc('NAV', 'a deep link opened while signed out comes back after sign-in', async (t) => {
    const c = await ctx(null); const page = await open(c, '/shipping', { wait: 'h1' });
    await until(() => pathOf(page) === '/login', 8000);
    t.check('sent to the sign-in page with the way back', pathOf(page) === '/login' && new URL(page.url()).searchParams.get('next') === '/shipping', page.url());
    await signInByForm(page, clerk.email);
    await until(() => pathOf(page) === '/shipping', 15000);
    t.check('lands on the page first asked for, not the workspace', pathOf(page) === '/shipping', pathOf(page));
  });

  await sc('NAV', 'the way back after sign-in cannot be pointed at another site', async (t) => {
    for (const next of ['//evil.example/x', 'https://evil.example/x', '/login?x=1']) {
      const c = await ctx(null); const page = await open(c, `/login?next=${encodeURIComponent(next)}`, { wait: 'h1' });
      await signInByForm(page, clerk.email);
      await until(() => pathOf(page) === '/orders', 15000);
      t.check(`"${next}" is ignored`, new URL(page.url()).origin === new URL(APP).origin && pathOf(page) === '/orders', page.url());
    }
  });

  await sc('NAV', 'wrong password: a spoken error, the email kept, nobody signed in', async (t) => {
    const c = await ctx(null); const page = await open(c, '/login', { wait: 'h1' });
    await page.getByLabel('Email').fill(clerk.email); await page.locator('input[type="password"]').fill('not-the-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    t.check('an alert says why', await shown(page.getByRole('alert'), 8000), await text(page));
    t.check('still on the sign-in page', pathOf(page) === '/login');
    t.check('the email is kept', (await page.getByLabel('Email').inputValue()) === clerk.email);
    t.check('no token was stored', !(await page.evaluate(() => localStorage.getItem('token'))));
  });

  await sc('NAV', 'signing out clears the session and Back does not bring a page back', async (t) => {
    const c = await ctx(null); const page = await open(c, '/login', { wait: 'h1' });
    await signInByForm(page, clerk.email); await until(() => pathOf(page) === '/orders', 15000);
    await page.getByRole('button', { name: /^Account menu for/ }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await until(() => pathOf(page) === '/login', 8000);
    t.check('back at the sign-in page', pathOf(page) === '/login', pathOf(page));
    t.check('the token is gone', !(await page.evaluate(() => localStorage.getItem('token'))));
    await page.goBack().catch(() => {}); await settle(page, 500);
    t.check('Back does not show orders', !(await page.locator(MENU).count()) && !/SO-\d/.test(await text(page)), pathOf(page));
    await page.goto(APP + '/orders', { waitUntil: 'domcontentloaded' }); await until(() => pathOf(page) === '/login', 8000);
    t.check('asking for orders again leads to sign-in', pathOf(page) === '/login', pathOf(page));
  });

  await sc('NAV', 'every page has its own browser title, taken from its heading', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/orders'); const seen = new Set();
    for (const url of ['/orders', '/customers', '/units', '/shipping', '/receiving', '/work-orders', '/orders/invoices']) {
      await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); await page.locator('main h1').first().waitFor({ timeout: 15000 });
      const h1 = (await text(page, 'main h1')).trim(); const title = await until(async () => { const x = await page.title(); return x.startsWith(h1) ? x : ''; }, 4000);
      t.check(`${url}: the title is "${h1} · SteelWise"`, title === `${h1} · SteelWise`, await page.title()); seen.add(title);
    }
    t.check('seven pages, seven titles', seen.size === 7, [...seen].join(' | '));
  });

  await sc('NAV', 'moving between pages by the menu announces the page and moves focus to it', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/orders');
    await page.locator(`${MENU} a[href="/customers"]`).first().click().catch(async () => { await menuLinks(page); await page.locator(`${MENU} a[href="/customers"]`).first().click(); });
    await until(() => pathOf(page) === '/customers'); await page.locator('main h1').first().waitFor();
    const said = await until(async () => { const x = await text(page, '[data-testid="route-announcer"]'); return /Customers/.test(x) ? x : ''; }, 5000);
    t.check('the announcer names the page', /Customers/.test(said || ''), said);
    t.check('focus is on the page content', await until(() => page.evaluate(() => document.activeElement && document.activeElement.id === 'main-content'), 3000));
    t.check('the menu marks the current page', (await page.locator(`${MENU} a[aria-current="page"]`).first().getAttribute('href')) === '/customers');
    t.check('only one item is marked current', (await page.locator(`${MENU} [aria-current="page"]`).count()) === 1, await page.locator(`${MENU} [aria-current="page"]`).count());
  });

  await sc('NAV', 'on a record page the menu marks the list the record belongs to', async (t) => {
    const made = await B.readyToShip(300);
    const c = await ctx(boss); const page = await open(c, `/shipping/${made.shipment.id}`);
    await menuLinks(page);
    const current = await page.locator(`${MENU} a[aria-current="page"]`).evaluateAll((a) => a.map((x) => x.getAttribute('href')));
    t.check('Shipping is marked, and nothing else', current.length === 1 && current[0] === '/shipping', current.join(' '));
    t.check('the title names the shipment', await until(async () => (await page.title()) === `${made.shipment.shipmentNumber} · SteelWise`, 6000), await page.title());
  });

  await sc('NAV', 'the skip link is the first stop and jumps past the menu', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/orders');
        await page.keyboard.press('Tab');
    const first = await page.evaluate(() => ({ cls: document.activeElement.className, text: document.activeElement.innerText, href: document.activeElement.getAttribute('href') }));
    t.check('first Tab lands on the skip link', /skip-link/.test(first.cls) && first.href === '#main-content', JSON.stringify(first));
    const box = await page.locator('.skip-link').boundingBox();
    t.check('it is visible while focused', box && box.y >= 0 && box.height > 10, JSON.stringify(box));
    await page.keyboard.press('Enter');
    t.check('Enter moves focus to the page content', await until(() => page.evaluate(() => document.activeElement && document.activeElement.id === 'main-content'), 3000));
  });

  await sc('NAV', 'menu sections open and close and say so to a screen reader', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/orders');
    const section = page.locator(`${MENU} [aria-expanded]`).first();
    const was = await section.getAttribute('aria-expanded'); const links = await page.locator(`${MENU} a[href]`).count();
    await section.click(); await page.waitForTimeout(500);
    const now = await section.getAttribute('aria-expanded'); const links2 = await page.locator(`${MENU} a[href]:visible`).count();
    t.check('the state flips', was !== now, `${was} ${now}`);
    await section.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    t.check('Enter flips it back', (await section.getAttribute('aria-expanded')) === was);
    t.check('the links shown change with it', links !== links2 || links2 > 0, `${links} ${links2}`);
  });

  await sc('NAV', 'search: a page is found by name and opened with the keyboard alone', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/orders');
    await page.keyboard.press('Control+k');
    t.check('Ctrl+K puts the cursor in the search', await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-testid') === 'global-search'));
    await page.keyboard.type('receiv');
    await shown(page.locator('[data-testid="global-search-results"] [role="option"]'));
    const first = await text(page, '[data-testid="global-search-results"] [role="option"]');
    t.check('the first result is Receiving', /Receiving/.test(first), first);
    await page.keyboard.press('Enter'); await until(() => pathOf(page) === '/receiving');
    t.check('Enter opens it', pathOf(page) === '/receiving', pathOf(page));
    t.check('the search is cleared', (await page.locator('[data-testid="global-search"]').inputValue()) === '');
  });

  await sc('NAV', 'search: an order is found by its number and opens the order', async (t) => {
    const o = await B.order([B.line(120)]);
    const c = await ctx(clerk); const page = await open(c, '/orders');
    await page.locator('[data-testid="global-search"]').fill(o.orderNumber);
    const row = page.locator('[data-testid="global-search-results"] [role="option"]', { hasText: o.orderNumber });
    t.check('the order is listed', await shown(row), await text(page, '[data-testid="global-search-results"]'));
    await row.first().click(); await until(() => pathOf(page) === `/orders/${o.id}`);
    t.check('it opens that order', pathOf(page) === `/orders/${o.id}`, pathOf(page));
    t.check('the order page shows the number', await has(page, o.orderNumber));
  });

  await sc('NAV', 'search: a customer is found by name and the customer list opens filtered to it', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/orders');
    await page.locator('[data-testid="global-search"]').fill(w.custA.name);
    const row = page.locator('[data-testid="global-search-results"] [role="group"][aria-label="Customers"] [role="option"]', { hasText: w.custA.name });
    t.check('the customer is listed', await shown(row), await text(page, '[data-testid="global-search-results"]'));
    await row.first().click(); await until(() => pathOf(page) === '/customers');
    await page.getByRole('heading', { level: 1, name: 'Customers' }).waitFor({ timeout: 10000 }); await settle(page, 500);
    const rows = await page.locator('tbody tr').allInnerTexts();
    t.check('the list is filtered to that customer', rows.length >= 1 && rows.every((r) => r.includes(w.custA.code) || r.includes(w.custA.name)), rows.slice(0, 3).join(' / '));
  });

  await sc('NAV', 'search: stock, a heat and a shipment are found by number', async (t) => {
    const made = await B.readyToShip(200); const coil = await s.prisma.coil.findUnique({ where: { id: made.coilId } });
    const c = await ctx(boss); const page = await open(c, '/orders'); const box = page.locator('[data-testid="global-search"]');
    for (const [what, q, to] of [['stock item', coil.coilNumber, `/units/${coil.id}`], ['shipment', made.shipment.shipmentNumber, `/shipping/${made.shipment.id}`], ['heat', w.heat.heatNumber, `/heats/${w.heat.id}`]]) {
      await box.fill(q);
      const row = page.locator('[data-testid="global-search-results"] [role="option"]', { hasText: q });
      const ok = await shown(row); t.check(`the ${what} is listed`, ok, await text(page, '[data-testid="global-search-results"]'));
      if (ok) { await row.first().click(); await until(() => pathOf(page) === to); t.check(`the ${what} opens`, pathOf(page) === to, pathOf(page)); }
    }
  });

  await sc('NAV', 'search shows a role only the pages and records it may open', async (t) => {
    const c = await ctx(P.operator); const page = await open(c, '/shopfloor'); const box = page.locator('[data-testid="global-search"]');
    const asked = []; page.on('request', (r) => { if (/search=/.test(r.url())) asked.push(r.url().replace(/^.*\/api/, '')); });
    await box.fill('customers'); await page.waitForTimeout(900);
    const body = await text(page, '[data-testid="global-search-results"]');
    t.check('the Customers page is not offered to an operator', !/^Customers$/m.test(body), body);
    await box.fill(w.custA.name); await page.waitForTimeout(1200);
    t.check('the customer list is not asked for', !asked.some((u) => u.startsWith('/customers')), asked.join(' '));
    t.check('no customer is shown', !(await text(page, '[data-testid="global-search-results"]')).includes(w.custA.code));
    await box.fill('schedule'); t.check('a page the operator may open is offered', await shown(page.locator('[data-testid="global-search-results"] [role="option"]', { hasText: 'Schedule' })));
  });

  await sc('NAV', 'search: nothing found says what to try, and Escape closes and clears', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/orders'); const box = page.locator('[data-testid="global-search"]');
    await box.fill('zzqqxx-nothing'); t.check('says nothing was found', await has(page, /Nothing found for "zzqqxx-nothing"/));
    t.check('the count is spoken', /Nothing found/.test(await until(async () => { const x = await text(page, '[role="search"] [role="status"]'); return /Nothing/.test(x) ? x : ''; }, 4000) || ''));
    await page.keyboard.press('Escape'); t.check('Escape closes the results', await gone(page.locator('[data-testid="global-search-results"]')));
    await page.keyboard.press('Escape'); t.check('a second Escape clears the box', (await box.inputValue()) === '');
  });

  await sc('NAV', 'search: arrow keys move through results and the choice is announced', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/orders'); const box = page.locator('[data-testid="global-search"]');
    await box.fill('order'); await shown(page.locator('[data-testid="global-search-results"] [role="option"]').nth(1));
    t.check('the first result is active', (await box.getAttribute('aria-activedescendant')) === 'gs-0');
    await page.keyboard.press('ArrowDown'); t.check('Down moves to the second', (await box.getAttribute('aria-activedescendant')) === 'gs-1');
    t.check('it is marked selected', (await page.locator('#gs-1').getAttribute('aria-selected')) === 'true');
    await page.keyboard.press('ArrowUp'); t.check('Up moves back', (await box.getAttribute('aria-activedescendant')) === 'gs-0');
    t.check('the box says its list is open', (await box.getAttribute('aria-expanded')) === 'true');
  });

  await sc('NAV', 'search survives the server failing: it says so and still finds pages', async (t) => {
    const c = await ctx(boss); await c.route(/\/api\/(orders|customers|coils|heats|shipments)\?search=/, (r) => r.fulfill({ status: 500, body: '{}' }));
    const page = await open(c, '/orders'); const box = page.locator('[data-testid="global-search"]');
    await box.fill('zzqq-fail'); t.check('says the search could not reach the server', await has(page, /could not reach the server/));
    await box.fill('shipping'); t.check('pages are still found', await shown(page.locator('[data-testid="global-search-results"] [role="option"]', { hasText: 'Shipping' })));
    t.check('no page error', page.errors.length === 0, page.errors[0]);
  });

  await sc('NAV', 'the help button opens the instruction manual', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/orders');
    await page.getByRole('link', { name: 'Instruction manual' }).first().click(); await until(() => pathOf(page) === '/help/manual');
    t.check('the manual opens', pathOf(page) === '/help/manual', pathOf(page));
    t.check('it has content', (await text(page, 'main')).length > 300);
  });

  await sc('NAV', 'the account menu names the signed-in person and their role', async (t) => {
    const c = await ctx(P.credit); const page = await open(c, '/orders');
    const button = page.getByRole('button', { name: /^Account menu for/ });
    t.check('the button names the person', /P9 credit/.test(await button.getAttribute('aria-label')), await button.getAttribute('aria-label'));
    await button.click(); const menu = await text(page, '[role="menu"]');
    t.check('the menu shows the email or the role', menu.includes(P.credit.email) || /credit/i.test(menu), menu);
    await page.keyboard.press('Escape'); t.check('Escape closes it and focus returns', await until(() => page.evaluate(() => /Account menu/.test(document.activeElement.getAttribute('aria-label') || '')), 3000));
  });

  await sc('NAV', 'an address that is not a page says so and offers a way on', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/shiping-typo');
    t.check('says Page not found', (await text(page, 'main h1')).trim() === 'Page not found', await text(page, 'main'));
    t.check('names the address', (await text(page, '[data-testid="not-found"]')).includes('/shiping-typo'));
    t.check('the title says so', /Page not found/.test(await page.title()), await page.title());
    await page.getByRole('link', { name: 'Go to the dashboard' }).click(); await until(() => pathOf(page) === '/');
    t.check('the way on works', pathOf(page) === '/');
    const p2 = await open(c, '/orders/not-a-page/deeper/still');
    t.check('a deep wrong address does not show the dashboard', !/^Dashboard$/.test((await text(p2, 'main h1')).trim()), await text(p2, 'main h1'));
  });

  await sc('NAV', 'on a phone the menu is a drawer: it opens, traps nothing behind it, and closes on a choice', async (t) => {
    const c = await ctx(clerk, 'phone'); const page = await open(c, '/orders');
    t.check('the menu is not on screen at first', !(await page.locator(`${MENU} a[href="/customers"]:visible`).count()));
    await page.getByRole('button', { name: 'Open the menu' }).click();
    t.check('the drawer opens', await shown(page.locator(`${MENU} a[href]:visible`)));
    let inside = true; for (let i = 0; i < 6; i += 1) { await page.keyboard.press('Tab'); inside = inside && await page.evaluate(() => Boolean(document.activeElement.closest('.MuiDrawer-root'))); }
    t.check('Tab stays inside the open drawer', inside);
    await menuLinks(page);
    await page.locator(`${MENU} a[href="/customers"]:visible`).first().click(); await until(() => pathOf(page) === '/customers');
    t.check('choosing a page goes there', pathOf(page) === '/customers', pathOf(page));
    t.check('and closes the drawer', await until(async () => !(await page.locator(`${MENU} a[href="/customers"]:visible`).count()), 4000));
    t.check('the page does not scroll sideways', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  });

  await sc('NAV', 'on a desktop the menu stays put and a click does not open the phone drawer', async (t) => {
    const c = await ctx(clerk, 'wide'); const page = await open(c, '/orders');
    t.check('the menu is on screen', await shown(page.locator(`${MENU} a[href]:visible`)));
    t.check('there is no menu button', !(await page.getByRole('button', { name: 'Open the menu' }).isVisible().catch(() => false)));
    await menuLinks(page); await page.locator(`${MENU} a[href="/customers"]`).first().click(); await until(() => pathOf(page) === '/customers');
    t.check('no drawer backdrop appears', !(await page.locator('.MuiBackdrop-root:visible').count()));
    t.check('the menu is still on screen', await page.locator(`${MENU} a[href="/customers"]`).first().isVisible());
  });

  await sc('NAV', 'two branches: each clerk’s order list holds only their own branch’s orders', async (t) => {
    const mine = await B.order([B.line(90)]); // made at branch 1
    for (const [who, expectSees] of [[clerk, true], [P.clerk2, false]]) {
      const c = await ctx(who); const page = await open(c, '/orders'); await settle(page);
      const r = await api(who, 'GET', `/api/orders/${mine.id}`);
      t.check(`${expectSees ? 'branch 1' : 'branch 2'}: the server ${expectSees ? 'serves' : 'refuses'} the branch 1 order`, expectSees ? r.status === 200 : r.status === 403 || r.status === 404, r.status);
      await page.locator('[data-testid="global-search"]').fill(mine.orderNumber); await page.waitForTimeout(1300);
      const found = (await page.locator('[data-testid="global-search-results"] [role="option"]', { hasText: mine.orderNumber }).count()) > 0;
      t.check(`the search ${expectSees ? 'finds' : 'does not find'} it`, found === expectSees, await text(page, '[data-testid="global-search-results"]'));
      if (!expectSees) { const p2 = await open(c, `/orders/${mine.id}`); await settle(p2, 800); t.check('opening it by address shows no order', !(await text(p2)).includes(mine.orderNumber), (await text(p2, 'main')).slice(0, 120)); }
    }
  });
};
