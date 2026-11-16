// Customers, sales, quoting and order intake.
module.exports = async (s) => {
  const { sc, P, boss, clerk, shopper, api, rowsOf, ctx, open, openWithAnswer, text, has, shown, gone, pathOf, settle, until, APP, w, B, prisma, run } = s;
  const { listShows, money } = require('./lists.cjs')(s);

  await sc('SALES', 'the order list shows the orders the server sent, newest first, with customer and total', async (t) => {
    await B.order([B.line(110)]);
    await listShows(t, await ctx(clerk), '/orders', /^\/orders\/intake\?|^\/orders\?/, (o) => o.orderNumber, { more: [['customer', (o) => o.buyer?.name || o.customerName], ['total', (o) => money(o.totalAmount)]] });
  });

  await sc('SALES', 'choosing an order in the list shows its lines, and Enter on the keyboard does the same', async (t) => {
    const o = await B.order([B.line(130, 0.5), B.line(40, 1.25)]);
    const c = await ctx(clerk); const page = await open(c, '/orders'); const row = page.locator('main [role="button"]', { hasText: o.orderNumber }).first();
    await row.waitFor(); await row.focus(); await page.keyboard.press('Enter');
    t.check('the lines table shows both lines', await until(async () => (await page.locator('main tbody tr').count()) >= 2, 8000), await page.locator('main tbody tr').count());
    const body = await text(page, 'main');
    t.check('with the quantities ordered', body.includes('130') && body.includes('40'), body.slice(0, 300));
    t.check('and the order total', body.includes(money(o.totalAmount)), money(o.totalAmount));
  });

  await sc('SALES', 'an order page shows the number, customer, lines and money exactly as stored', async (t) => {
    const o = await B.order([B.line(200, 0.65), B.line(50, 2)], { taxRate: 0.06, freight: 25 });
    const c = await ctx(clerk); const page = await open(c, `/orders/${o.id}`); await has(page, o.orderNumber); await settle(page);
    const body = await text(page, 'main'); const db = await prisma.order.findUnique({ where: { id: o.id }, include: { buyer: true, lines: true } });
    t.check('the heading is the order number', (await text(page, 'main h1')).trim() === db.orderNumber);
    t.check('the customer', body.includes(db.buyer.name));
    for (const l of db.lines) t.check(`line ${l.lineNumber}: quantity and extended price`, body.includes(String(Number(l.qtyOrdered))) && body.includes(money(l.extendedPrice)), `${Number(l.qtyOrdered)} ${money(l.extendedPrice)}`);
    t.check('the total', body.includes(money(db.totalAmount)), money(db.totalAmount));
    t.check('the status', /CONFIRMED/i.test(body));
  });

  await sc('SALES', 'an order page: the tabs work from the keyboard and the history names who did what', async (t) => {
    const o = await B.order([B.line(60)]);
    const c = await ctx(clerk); const page = await open(c, `/orders/${o.id}`); await has(page, o.orderNumber);
    const tabs = page.getByRole('tab'); t.check('there are tabs', (await tabs.count()) >= 3, await tabs.count());
    await tabs.first().focus(); await page.keyboard.press('ArrowRight');
    t.check('the arrow key moves to the next tab', (await page.evaluate(() => document.activeElement.getAttribute('role'))) === 'tab' && (await page.evaluate(() => document.activeElement.innerText)) !== (await tabs.first().innerText()));
    await page.getByRole('tab', { name: 'History' }).click(); await settle(page, 500);
    const panel = await text(page, 'main');
    t.check('the history has entries', /confirmed|created|status/i.test(panel), panel.slice(-300));
    await page.getByRole('tab', { name: 'Details' }).click(); await settle(page, 300);
    t.check('the details show the customer’s PO', (await text(page, 'main')).includes(o.poReference), o.poReference);
  });

  await sc('SALES', 'an order that does not exist says so, with no blank page and no error', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/orders/00000000-0000-0000-0000-000000000000'); await settle(page, 1200);
    const body = await text(page, 'main');
    t.check('it says the order was not found', /not found|could not|no order|does not exist/i.test(body), body.slice(0, 200));
    t.check('no page error', page.errors.length === 0, page.errors[0]);
  });

  await sc('SALES', 'New Order on the order list opens order entry', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/orders');
    await page.getByRole('button', { name: 'New Order' }).click(); await until(() => pathOf(page) !== '/orders');
    t.check('order entry opens', /intake|new/.test(pathOf(page)), pathOf(page));
    t.check('with its heading', /Order/.test(await text(page, 'main h1')));
  });

  await sc('SALES', 'Refresh on the order list asks the server again and shows an order made meanwhile', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/orders'); await settle(page);
    const o = await B.order([B.line(33)]);
    t.check('the new order is not on screen yet', !(await text(page, 'main')).includes(o.orderNumber));
    await page.getByRole('button', { name: 'Refresh' }).click();
    t.check('after Refresh it is', await has(page, o.orderNumber, 8000));
  });

  await sc('SALES', 'the customer list shows the customers the server sent, and the count it reports', async (t) => {
    const { body, answer } = await listShows(t, await ctx(clerk), '/customers', /^\/customers\?limit/, (c) => c.code, { more: [['name', (c) => c.name]] });
    const total = answer.total ?? answer.pagination?.total ?? answer.count; const db = await prisma.organization.count({ where: { OR: [{ type: { in: ['OEM', 'FABRICATOR', 'DISTRIBUTOR', 'END_USER', 'CUSTOMER'] } }] } }).catch(() => null);
    t.check('the count on screen is the server’s', total ? body.includes(`${total} customers`) : /\d+ customers/.test(body), `${total} / ${(body.match(/\d+ customers/) || [])[0]}`);
    void db;
  });

  await sc('SALES', 'searching customers narrows the list to what the server finds for that text', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/customers'); await settle(page);
    const got = page.waitForResponse((r) => /\/api\/customers\?.*search=/.test(r.url()) && r.status() === 200);
    await page.getByLabel('Search by name or code').fill(w.custB.code);
    const rows = rowsOf(await (await got).json()); await settle(page, 500);
    const shownRows = await page.locator('main tbody tr').allInnerTexts();
    t.check('the server found it', rows.some((r) => r.code === w.custB.code));
    t.check('the rows on screen are the rows found', shownRows.length === rows.length && rows.every((r) => shownRows.some((x) => x.includes(r.code))), `${shownRows.length} on screen, ${rows.length} found`);
    await page.getByLabel('Search by name or code').fill('zz-no-such-customer'); await settle(page, 900);
    t.check('a search that finds nothing says so', /No customers|no results|nothing|0 customers/i.test(await text(page, 'main')), (await text(page, 'main')).slice(0, 300));
  });

  await sc('SALES', 'the next page of customers is the server’s second page, and Previous goes back', async (t) => {
    const c = await ctx(clerk); const { page, rows } = await openWithAnswer(c, '/customers', /^\/customers\?limit/);
    const got = page.waitForResponse((r) => /\/api\/customers\?.*offset=25/.test(r.url()) && r.status() === 200);
    await page.getByRole('button', { name: 'Go to next page' }).click();
    const second = rowsOf(await (await got).json()); await settle(page, 400);
    const body = await text(page, 'main tbody');
    t.check('page two holds different customers', second.length > 0 && second[0].code !== rows[0].code);
    t.check('page two is what is on screen', second.slice(0, 5).every((r) => body.includes(r.code)), second.slice(0, 5).map((r) => r.code).join(','));
    t.check('page one is gone from the screen', !body.includes(rows[0].code) || second.some((r) => r.code === rows[0].code));
    await page.getByRole('button', { name: 'Go to previous page' }).click(); await settle(page, 600);
    t.check('Previous shows page one again', (await text(page, 'main tbody')).includes(rows[0].code));
  });

  await sc('SALES', 'a customer name holding markup is shown as text and runs nothing', async (t) => {
    const name = `P9 <img src=x onerror="window.__xss=1"> & <b>Sons</b> ${run}`; const code = `P9X${run.slice(-5).toUpperCase()}`;
    const made = await api(boss, 'POST', '/api/customers', { code, name, type: 'OEM' });
    t.check('the customer was stored', made.status === 201 || made.status === 200, `${made.status} ${JSON.stringify(made.body).slice(0, 120)}`);
    const c = await ctx(clerk); const page = await open(c, `/customers?search=${code}`); await has(page, code); await settle(page, 500);
    t.check('the name is shown letter for letter', (await text(page, 'main tbody')).includes('<img src=x'), (await text(page, 'main tbody')).slice(0, 200));
    t.check('no script ran', !(await page.evaluate(() => window.__xss)));
    t.check('no image was made from it', (await page.locator('main tbody img[src="x"]').count()) === 0);
    await page.locator('[data-testid="global-search"]').fill(code); await shown(page.locator('[data-testid="global-search-results"] [role="option"]'));
    t.check('nor in the search results', !(await page.evaluate(() => window.__xss)) && (await page.locator('[data-testid="global-search-results"] img').count()) === 0);
  });

  await sc('SALES', 'the address /customers?search= opens the list already narrowed', async (t) => {
    const c = await ctx(clerk); const page = await open(c, `/customers?search=${w.custA.code}`); await has(page, w.custA.name); await settle(page, 500);
    t.check('the search box holds the text', (await page.getByLabel('Search by name or code').inputValue()) === w.custA.code);
    const rows = await page.locator('main tbody tr').allInnerTexts();
    t.check('every row matches', rows.length >= 1 && rows.every((r) => r.includes(w.custA.code)), rows.slice(0, 3).join(' / '));
  });

  await sc('SALES', 'the More actions menu on a customer opens, closes on Escape and gives focus back', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/customers'); const more = page.getByRole('button', { name: 'More actions' }).first();
    await more.waitFor(); await more.focus(); await page.keyboard.press('Enter');
    const menu = page.getByRole('menu'); t.check('a menu opens', await shown(menu, 4000));
    t.check('it has items', (await menu.getByRole('menuitem').count()) >= 1, await menu.innerText().catch(() => ''));
    await page.keyboard.press('Escape'); t.check('Escape closes it', await gone(menu));
    t.check('focus returns to the button', await until(() => page.evaluate(() => (document.activeElement.getAttribute('aria-label') || '') === 'More actions'), 3000));
    t.check('nothing was changed', page.writes.length === 0);
  });

  await sc('SALES', 'the RFQ list shows the requests the server sent for the Open view', async (t) => {
    await listShows(t, await ctx(clerk), '/sales/rfq-inbox', /^\/rfqs\?status=OPEN/, (r) => r.rfqNumber, { more: [['customer', (r) => r.customer?.name || r.customerName]] });
  });

  for (const [button, status] of [['Won', /WON|ACCEPTED/], ['Lost', /LOST|REJECTED|WITHDRAWN|EXPIRED/], ['All', /./]]) {
    await sc('SALES', `the RFQ list: "${button}" asks the server for that view and shows only what it sent`, async (t) => {
      const c = await ctx(clerk); const page = await open(c, '/sales/rfq-inbox'); await settle(page);
      const got = page.waitForResponse((r) => /\/api\/rfqs\?/.test(r.url()) && r.status() === 200, { timeout: 10000 });
      await page.getByRole('button', { name: button, exact: true }).click();
      const res = await got; const rows = rowsOf(await res.json()); await settle(page, 500);
      t.check('the request names the view', button === 'All' ? !/status=OPEN/.test(res.url()) : /status=/.test(res.url()), res.url().replace(/^.*\/api/, ''));
      const on = await page.locator('main tbody tr').count();
      t.check('rows on screen equal rows sent', rows.length === 0 ? on <= 1 : on === rows.length, `${on} on screen, ${rows.length} sent`);
      if (rows.length) t.check('each has the right status', rows.every((r) => status.test(String(r.status))), [...new Set(rows.map((r) => r.status))].join(','));
      else t.check('an empty view says so', /No |nothing|none/i.test(await text(page, 'main')), (await text(page, 'main')).slice(-200));
      t.check('the button shows it is the one chosen', (await page.getByRole('button', { name: button, exact: true }).getAttribute('aria-pressed')) === 'true' || /contained|selected|filled/i.test(await page.getByRole('button', { name: button, exact: true }).getAttribute('class')));
    });
  }

  await sc('SALES', 'opening an RFQ shows what the customer asked for, as stored', async (t) => {
    const c = await ctx(clerk); const { page, rows } = await openWithAnswer(c, '/sales/rfq-inbox', /^\/rfqs\?status=OPEN/);
    if (!rows.length) return t.na('no open RFQ in this database');
    await page.locator('main tbody tr', { hasText: rows[0].rfqNumber }).first().click();
    const dialog = page.getByRole('dialog'); await dialog.waitFor();
    const db = await prisma.rFQ.findUnique({ where: { id: rows[0].id }, include: { lines: true, customer: true } });
    // The dialog opens before its detail arrives: wait for the number, then read (a read made too early failed once in a full run under load).
    await dialog.getByText(db.rfqNumber).first().waitFor({ timeout: 8000 }).catch(() => {});
    const body = await dialog.innerText();
    t.check('the number and the customer', body.includes(db.rfqNumber) && body.includes(db.customer.name), body.slice(0, 120));
    for (const l of db.lines.slice(0, 3)) t.check(`line ${l.lineNumber}: what and how much`, body.includes(String(l.description || l.materialCode)) && body.includes(String(Number(l.requestedQty))), `${l.description} ${Number(l.requestedQty)}`);
    await page.keyboard.press('Escape'); t.check('Escape closes it', await gone(dialog));
  });

  await sc('SALES', 'the price list search narrows the products shown and clearing it brings them back', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/pricing'); await settle(page, 800);
    const box = page.getByLabel('Search the price list'); const all = await page.locator('main tbody tr').count();
    await box.fill('HR-A36'); await settle(page, 600);
    const rows = await page.locator('main table').last().locator('tbody tr').allInnerTexts();
    t.check('fewer rows are shown', rows.length > 0 && (await page.locator('main tbody tr').count()) < all, `${rows.length} of ${all}`);
    t.check('each row shown matches', rows.every((r) => /HR-A36/i.test(r)), rows.slice(0, 3).join(' / '));
    await box.fill(''); await settle(page, 600);
    t.check('clearing the search brings the list back', (await page.locator('main tbody tr').count()) === all);
  });

  await sc('SALES', 'the price list shows the list price stored for a product', async (t) => {
    const c = await ctx(boss); const { page, rows } = await openWithAnswer(c, '/pricing', /^\/(pricing|products|price)/);
    const body = await text(page, 'main'); const priced = rows.find((r) => r.sku && (r.listPrice ?? r.basePrice ?? r.price) != null);
    if (!priced) { t.check('the list shows products', /SKU/.test(body) && (await page.locator('main tbody tr').count()) > 3); return; }
    const price = priced.listPrice ?? priced.basePrice ?? priced.price;
    t.check(`${priced.sku} is listed`, body.includes(priced.sku));
    t.check('with the stored price', body.includes(Number(price).toFixed(2)) || body.includes(money(price)), `${price}`);
  });

  await sc('SALES', 'order entry: the customer lookup finds a customer and puts them on the order', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/orders/intake');
    await page.getByRole('button', { name: 'Look Up' }).click(); const dialog = page.getByRole('dialog'); await dialog.waitFor();
    await dialog.locator('input').first().fill(w.custA.name);
    const hit = dialog.getByText(w.custA.name).first(); t.check('the customer is found', await shown(hit, 8000), (await dialog.innerText()).slice(0, 200));
    await hit.click(); await page.waitForTimeout(600);
    if (await dialog.isVisible().catch(() => false)) await dialog.getByRole('button', { name: /select|use|choose|ok/i }).first().click().catch(() => {});
    t.check('the dialog closes', await gone(dialog));
    t.check('the order now names the customer', (await text(page, 'main')).includes(w.custA.name));
    t.check('nothing is saved by looking up', page.writes.filter((x) => x.method !== 'GET' && /\/orders/.test(x.url) && x.status < 300).length === 0, JSON.stringify(page.writes));
  });

  await sc('SALES', 'order entry: Submit with no customer and no lines is stopped, says why, and saves nothing', async (t) => {
    const before = await prisma.order.count();
    const c = await ctx(clerk); const page = await open(c, '/orders/intake');
    const submit = page.getByRole('button', { name: 'Submit Order' }).first(); await submit.waitFor();
    if (await submit.isDisabled()) t.check('Submit is off until the order has a customer and a line', true);
    else { await submit.click(); await page.waitForTimeout(900); const said = `${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')} ${await text(page, 'main')}`; t.check('it says what is missing', /customer|line|required|add at least/i.test(said), said.slice(0, 200)); }
    t.check('no order was created', (await prisma.order.count()) === before);
    t.check('no order was sent', page.writes.filter((x) => /^\/orders/.test(x.url) && x.status < 300).length === 0, JSON.stringify(page.writes));
  });

  await sc('SALES', 'the dashboard’s recent orders are the server’s newest orders, not sample rows', async (t) => {
    const o = await B.order([B.line(77)]);
    const c = await ctx(boss); const page = await open(c, '/'); await settle(page, 1500);
    const body = await text(page, 'main');
    t.check('the order just made is listed', body.includes(o.orderNumber), body.slice(0, 300));
    const numbers = [...body.matchAll(/SO-\d{4,}/g)].map((m) => m[0]); const known = await prisma.order.count({ where: { orderNumber: { in: numbers } } });
    t.check('every order number on the dashboard is a real order', numbers.length > 0 && known === new Set(numbers).size, `${known} of ${new Set(numbers).size}`);
    await page.getByRole('button', { name: 'Refresh the recent orders' }).click(); await settle(page, 600);
    t.check('Refresh keeps it real', (await text(page, 'main')).includes(o.orderNumber));
  });

  await sc('SALES', 'the web shop lists products the server sent and searching narrows them', async (t) => {
    const c = await ctx(shopper); const page = await open(c, '/shop'); await settle(page, 1200);
    t.check('the shop opens for a customer', pathOf(page).startsWith('/shop') && /Online Store/.test(await text(page, 'main h1')));
    const got = page.waitForResponse((r) => /\/api\/.*(products|catalog|search)/.test(r.url()) && r.status() === 200, { timeout: 10000 }).catch(() => null);
    await page.getByLabel(/Search products/).fill('plate'); await page.getByRole('button', { name: 'Search' }).first().click();
    const res = await got; await until(() => pathOf(page) === '/shop/search', 6000); await settle(page, 800);
    t.check('the search page opens', pathOf(page) === '/shop/search', pathOf(page));
    t.check('the server was asked', Boolean(res), 'no product request seen');
    const cards = await page.getByRole('button', { name: 'Details' }).count();
    t.check('results or a clear “nothing found” are shown', cards > 0 || /No products|nothing|no results/i.test(await text(page, 'main')), (await text(page, 'main')).slice(0, 200));
  });

  await sc('SALES', 'the web shop: a customer’s order list holds only that customer’s orders', async (t) => {
    const c = await ctx(shopper); const { page, rows } = await openWithAnswer(c, '/account/orders', /orders/);
    const mine = await prisma.user.findUnique({ where: { email: shopper.email } });
    const ids = rows.map((r) => r.id).filter(Boolean).slice(0, 50);
    const foreign = ids.length ? await prisma.order.count({ where: { id: { in: ids }, NOT: { buyerId: mine.organizationId } } }) : 0;
    t.check('no order of another customer was sent', foreign === 0, foreign);
    const other = await prisma.order.findFirst({ where: { NOT: { buyerId: mine.organizationId }, orderType: 'SO' } });
    const r = await api(shopper, 'GET', `/api/orders/${other.id}`); t.check('another customer’s order is refused by the server', r.status === 403 || r.status === 404, r.status);
    const p2 = await open(c, `/shop/orders/${other.id}`); await settle(p2, 1200);
    t.check('and its page shows nothing of it', !(await text(p2)).includes(other.orderNumber));
    void page;
  });

  await sc('SALES', 'the web checkout takes no card and says the order is on account', async (t) => {
    const c = await ctx(shopper); const page = await open(c, '/shop/checkout'); await settle(page, 1200);
    const body = await text(page, 'main');
    if (/empty|no items/i.test(body) && !/On account/.test(body)) { t.check('an empty cart cannot be checked out and says so', /empty|no items/i.test(body)); t.check('no card field exists', (await page.locator('input[autocomplete^="cc-"], input[name*="card" i]').count()) === 0); return; }
    t.check('it says On account', /On account/.test(body), body.slice(0, 300));
    t.check('no card field exists', (await page.locator('input[autocomplete^="cc-"], input[name*="card" i]').count()) === 0);
  });
};
