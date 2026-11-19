// Error handling, two people at once, and recovery.
module.exports = async (s) => {
  const { sc, P, boss, clerk, api, rowsOf, ctx, open, text, has, shown, gone, pathOf, settle, until, APP, PASSWORD, w, B, prisma, run } = s;
  const LISTS = [['/orders', /\/api\/orders\/intake\?|\/api\/orders\?/, /SO-\d{4,}/], ['/customers', /\/api\/customers\?/, /QA-C\d|ACME|P11-C-/], ['/units', /\/api\/coils\?/, /RC-[A-Z0-9]+-\d/], ['/shipping', /\/api\/shipments(\?|$)/, /SHP-\d{4,}/], ['/work-orders', /\/api\/work-orders/, /WO-\d{4,}/], ['/orders/invoices', /\/api\/invoices/, /INV-\d{4,}/]];
  const SAYS_FAILED = /could not|couldn.t|failed|unable|try again|not be loaded|went wrong|error|problem/i;

  for (const [url, pattern, record] of LISTS) {
    await sc('FAIL', `${url}: when the server fails, the screen says so in words, invents no records, and loads again once the server is back`, async (t) => {
      const c = await ctx(boss); let broken = true;
      await c.route(pattern, (r) => (broken && r.request().method() === 'GET' ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"The server had a problem"}' }) : r.continue()));
      const page = await open(c, url); await settle(page, 1500); const body = `${await text(page, 'main')} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`;
      t.check('the failure is said in words', SAYS_FAILED.test(body), body.slice(0, 260));
      t.check('no record is shown', !record.test(await text(page, 'main')), (await text(page, 'main')).match(record));
      t.check('the heading and the menu are still there', (await page.locator('main h1').count()) === 1 && (await page.locator('nav[aria-label="Main menu"]').count()) >= 1);
      t.check('the page did not crash', page.errors.length === 0, page.errors[0]);
      broken = false; const again = page.getByRole('button', { name: /refresh|try again|retry|reload/i }).first();
      if (await again.isVisible().catch(() => false)) { await again.click(); await settle(page, 1500); } else { await page.reload({ waitUntil: 'domcontentloaded' }); await settle(page, 2000); }
      t.check('with the server back the records appear', await until(async () => record.test(await text(page, 'main')), 8000), (await text(page, 'main')).slice(0, 200));
    });
  }

  for (const [url, pattern, record] of [LISTS[1], LISTS[2], LISTS[3], LISTS[4]]) {
    await sc('FAIL', `${url}: when there is nothing to list, the screen says there is nothing, not that something failed`, async (t) => {
      const c = await ctx(boss); await c.route(pattern, (r) => (r.request().method() === 'GET' ? r.fulfill({ status: 200, contentType: 'application/json', headers: { 'x-total-count': '0' }, body: '[]' }) : r.continue()));
      const page = await open(c, url); await settle(page, 1500); const body = await text(page, 'main');
      t.check('it says there is nothing', /No |nothing|none|empty|0 /i.test(body), body.slice(0, 260));
      t.check('it does not call it a failure', !/could not|failed|went wrong/i.test(body) && (await page.locator('[role="alert"].MuiAlert-standardError, [role="alert"].MuiAlert-filledError').count()) === 0, body.slice(0, 200));
      t.check('no record is invented', !record.test(body)); t.check('the page did not crash', page.errors.length === 0, page.errors[0]);
    });
  }

  await sc('FAIL', 'a slow server: the list says it is loading, then shows the records', async (t) => {
    const c = await ctx(boss); await c.route(/\/api\/shipments(\?|$)/, async (r) => { await new Promise((x) => setTimeout(x, 2500)); r.continue(); });
    const page = await open(c, '/shipping'); const busy = await until(async () => (await page.locator('[role="progressbar"], .MuiSkeleton-root, [role="status"]').count()) > 0 || /Loading/i.test(await text(page, 'main')), 2000);
    t.check('a loading sign is shown while waiting', Boolean(busy)); t.check('no “nothing here” message is shown while still loading', !/No shipments yet/.test(await text(page, 'main')));
    t.check('then the shipments appear', await until(async () => /SHP-\d{4,}/.test(await text(page, 'main')), 10000));
  });

  await sc('FAIL', 'the connection drops: the screen says so, does not crash, and works again when it is back', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/units'); await page.locator('main tbody tr').first().waitFor(); await c.setOffline(true);
    await page.getByLabel('Search stock items').fill('RC'); await settle(page, 1500); const body = `${await text(page, 'main')} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`;
    t.check('the failure is said in words', SAYS_FAILED.test(body) || /connection|network|offline/i.test(body), body.slice(0, 240)); t.check('no crash', page.errors.length === 0, page.errors[0]);
    await c.setOffline(false); await page.getByLabel('Search stock items').fill(''); await page.getByRole('button', { name: 'Refresh' }).click().catch(() => {}); t.check('back on line the list returns', await until(async () => (await page.locator('main tbody tr').count()) > 3, 10000));
  });

  await sc('FAIL', 'the session ends in the middle of work: the person is told, signs in, and is back on the same page', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/shipping'); await page.locator('main tbody tr').first().waitFor(); let expired = true;
    await c.route(/\/api\/shipments(\?|$)/, (r) => (expired ? r.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"Token expired"}' }) : r.continue()));
    await page.addInitScript(() => sessionStorage.setItem('p9-signed-out', '1')); await page.evaluate(() => sessionStorage.setItem('p9-signed-out', '1'));
    await page.getByRole('button', { name: 'Refresh' }).click(); await until(() => pathOf(page) === '/login', 8000);
    t.check('sent to sign-in', pathOf(page) === '/login', pathOf(page)); t.check('told that the session ended', await shown(page.locator('[data-testid="session-expired"]'), 5000));
    t.check('the way back is kept', new URL(page.url()).searchParams.get('next') === '/shipping', page.url()); t.check('the old token is gone', !(await page.evaluate(() => localStorage.getItem('token'))));
    expired = false; await page.getByLabel('Email').fill(clerk.email); await page.locator('input[type="password"]').fill(PASSWORD); await page.getByRole('button', { name: /sign in/i }).click();
    await until(() => pathOf(page) === '/shipping', 15000); t.check('after signing in the same page is back', pathOf(page) === '/shipping' && await until(async () => /SHP-\d{4,}/.test(await text(page, 'main')), 8000), pathOf(page));
  });

  await sc('FAIL', 'signed out in another tab: the next page asked for leads to sign-in, and shows nothing', async (t) => {
    const c = await ctx(null); const page = await open(c, '/login', { wait: 'h1' }); await page.getByLabel('Email').fill(clerk.email); await page.locator('input[type="password"]').fill(PASSWORD); await page.getByRole('button', { name: /sign in/i }).click(); await until(() => pathOf(page) === '/orders', 15000);
    const tab2 = await c.newPage(); await tab2.goto(`${APP}/customers`); await tab2.locator('main h1').first().waitFor(); await tab2.evaluate(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); });
    await page.goto(`${APP}/units`, { waitUntil: 'domcontentloaded' }); await until(() => pathOf(page) === '/login', 8000);
    t.check('the first tab is sent to sign-in', pathOf(page) === '/login', pathOf(page)); t.check('and shows no stock', !/RC-[A-Z0-9]+-\d/.test(await text(page)));
  });

  await sc('FAIL', 'a role loses a permission mid-session: the screen says it is not allowed, and shows no stale records as if current', async (t) => {
    const c = await ctx(clerk); await c.route(/\/api\/shipments(\?|$)/, (r) => r.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"Your role cannot read shipments"}' }));
    const page = await open(c, '/shipping'); await settle(page, 1500); const body = `${await text(page, 'main')} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`;
    t.check('the refusal is said in the server’s words', /cannot read shipments|not allowed|permission|No access/i.test(body), body.slice(0, 240)); t.check('no shipment is listed', !/SHP-\d{4,}/.test(await text(page, 'main'))); t.check('not sent to sign-in for a refusal', pathOf(page) === '/shipping');
  });

  await sc('FAIL', 'an answer that is not what the screen expects does not blank the page', async (t) => {
    const c = await ctx(boss); await c.route(/\/api\/customers\?/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Bad gateway</body></html>' }));
    const page = await open(c, '/customers'); await settle(page, 1500); const body = await text(page);
    t.check('the page is not blank', body.trim().length > 40 && (await page.locator('main h1, [data-testid="error-boundary"], h1, h2').count()) > 0, body.slice(0, 120));
    t.check('nothing from the bad answer is shown as a customer', !/Bad gateway/.test(await text(page, 'main tbody').catch(() => '')));
    t.check('the person can still move on', (await page.locator('nav[aria-label="Main menu"] a[href]').count()) > 0 || (await page.getByRole('button', { name: /reload|home|try again|back/i }).count()) > 0);
  });

  await sc('FAIL', 'a record that is not on file says so on its own page: stock, heat, shipment, job', async (t) => {
    const c = await ctx(boss); const none = '00000000-0000-0000-0000-000000000000';
    for (const url of [`/units/${none}`, `/heats/${none}`, `/shipping/${none}`, `/jobs/${none}`]) { const page = await open(c, url); await settle(page, 1200); const body = await text(page, 'main'); t.check(`${url.split('/')[1]}: says it is not on file`, /not found|not on file|could not|does not exist|no longer/i.test(body), body.slice(0, 140)); t.check(`${url.split('/')[1]}: no crash and a way back`, page.errors.length === 0 && (await page.locator('main a[href], main button').count()) > 0, page.errors[0]); await page.close(); }
  });

  await sc('FAIL', 'the order save helper sends the version it read, and the server refuses a save made from an older one', async (t) => {
    const o = await B.order([B.line(55)], { status: 'DRAFT' }); const c = await ctx(clerk); const page = await open(c, '/orders'); await settle(page);
    const r = await page.evaluate(async ([id]) => { const m = await import('/src/api/index.js'); const c0 = (await import('/src/api/client.js')).default; const first = (await c0.get(`/orders/${id}`)).data; const a = await m.updateOrder(id, { notes: 'first person' }, first.updatedAt).then(() => 'saved').catch((e) => `refused ${e.response && e.response.status}`); const b = await m.updateOrder(id, { notes: 'second person, old copy' }, first.updatedAt).then(() => 'saved').catch((e) => `refused ${e.response && e.response.status} ${e.response && e.response.data && e.response.data.code}`); return { a, b }; }, [o.id]);
    t.check('the first save is accepted', r.a === 'saved', r.a); t.check('the second, made from the older copy, is refused as stale', r.b === 'refused 409 STALE_EDIT', r.b);
    const db = await prisma.order.findUnique({ where: { id: o.id } }); t.check('the first person’s note stands', db.notes === 'first person', db.notes);
  });

  await sc('FAIL', 'two people cancel and dispatch the same shipment at once: one wins, the other is told, the books agree', async (t) => {
    const m = await B.readyToShip(330); const c1 = await ctx(P.shipper); const c2 = await ctx(boss); const p1 = await open(c1, `/shipping/${m.shipment.id}`); const p2 = await open(c2, `/shipping/${m.shipment.id}`); await has(p1, 'What is on it'); await has(p2, 'What is on it');
    await p1.getByRole('button', { name: 'Dispatch', exact: true }).click(); await p2.getByRole('button', { name: 'Cancel shipment' }).click();
    await Promise.all([p1.getByRole('button', { name: 'Dispatch now' }).click(), p2.getByRole('button', { name: 'Cancel the shipment' }).click()]); await p1.waitForTimeout(2500);
    const after = await prisma.shipment.findUnique({ where: { id: m.shipment.id } }); const invoices = await B.invoicesOf(m.order.id); const inv = await prisma.inventory.findFirst({ where: { coilId: m.coilId } });
    const gone1 = Boolean(after.shippedAt); t.check('exactly one of the two happened', (gone1 && after.status !== 'CANCELLED') || (!gone1 && after.status === 'CANCELLED'), `${after.status} shipped ${gone1}`);
    t.check('the books agree with the winner', gone1 ? invoices.length === 1 && Number(inv.qtyOnHand) === 500 : invoices.length === 0 && Number(inv.qtyOnHand) === 830, `${invoices.length} invoices, ${inv.qtyOnHand} on hand`);
    const loser = gone1 ? p2 : p1; const said = `${(await loser.locator('[role="alert"]').allInnerTexts()).join(' ')}`; t.check('the other person is told in words', /changed by someone else|already|cannot|left|cancelled/i.test(said), said.slice(0, 200));
  });

  await sc('FAIL', 'a payment the server fails to save is not shown as paid, and the amount typed is kept', async (t) => {
    const m = await B.readyToShip(340, { price: 1 }); await B.dispatch(m.shipment); const [inv] = await B.invoicesOf(m.order.id); const c = await ctx(P.credit);
    await c.route(/\/api\/invoices\/[^/]+\/payments/, (r) => (r.request().method() === 'POST' ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"The payment could not be saved"}' }) : r.continue()));
    const page = await open(c, '/orders/invoices'); await page.getByLabel('Invoice or order number').fill(inv.invoiceNumber); await page.getByText(inv.invoiceNumber, { exact: true }).first().click(); const dialog = page.getByRole('dialog'); await has(page, 'Invoice issued');
    await page.getByRole('button', { name: 'Record payment' }).click(); await page.getByLabel('Amount').fill('75'); await dialog.getByRole('button', { name: 'Save' }).click(); await page.waitForTimeout(1200);
    const said = `${await dialog.innerText()} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`; t.check('the failure is said', /could not be saved|failed|try again|error/i.test(said), said.slice(-240));
    t.check('it is not shown as paid', !/Payment recorded \$75\.00/.test(said)); t.check('the amount typed is kept', (await page.getByLabel('Amount').inputValue().catch(() => '')) === '75'); t.check('nothing is on file', (await prisma.payment.count({ where: { invoiceId: inv.id } })) === 0);
  });

  await sc('FAIL', 'Back and Forward move between a list and a record without errors or a second save', async (t) => {
    const m = await B.readyToShip(350); const c = await ctx(P.shipper); const page = await open(c, '/shipping'); await page.getByLabel('Search shipments').fill(m.shipment.shipmentNumber); await settle(page, 900);
    await page.locator('main tbody tr', { hasText: m.shipment.shipmentNumber }).first().click(); await until(() => pathOf(page) === `/shipping/${m.shipment.id}`); await has(page, 'What is on it');
    await page.goBack(); await until(() => pathOf(page) === '/shipping'); t.check('Back returns to the list', pathOf(page) === '/shipping' && await until(async () => (await text(page, 'main h1')).trim() === 'Shipping', 6000), await text(page, 'main h1'));
    await page.goForward(); await until(() => pathOf(page) === `/shipping/${m.shipment.id}`); t.check('Forward returns to the shipment', await has(page, m.shipment.shipmentNumber));
    t.check('nothing was saved by moving about', page.writes.filter((x) => x.status < 300 && !/print-queue/.test(x.url)).length === 0, JSON.stringify(page.writes)); t.check('no page error', page.errors.length === 0, page.errors[0]);
  });

  await sc('FAIL', 'too many requests: the screen says to wait, and does not show an empty list as if there were no records', async (t) => {
    const c = await ctx(boss); await c.route(/\/api\/coils\?/, (r) => r.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"Too many requests. Try again in a minute."}' }));
    const page = await open(c, '/units'); await settle(page, 1500); const body = `${await text(page, 'main')} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`;
    t.check('the server’s message or a failure is shown', /Too many requests|try again|could not|failed/i.test(body), body.slice(0, 240)); t.check('it does not say there is no stock', !/No stock items yet|No inventory yet/i.test(body));
  });

  await sc('FAIL', 'a long round of 24 screens in one tab: no page error, no failed call, no screen left blank', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/orders'); const failed = []; const shopCalls = []; page.on('request', (q) => { if (/preferences/i.test(q.url()) && /\/api\//.test(q.url())) shopCalls.push(q.url().replace(/^.*\/api/, '')); }); page.on('response', (r) => { if (/\/api\//.test(r.url()) && !/\/src\//.test(r.url()) && r.status() >= 500) failed.push(`${r.status()} ${r.url().replace(/^.*\/api/, '')}`); }); const blank = [];
    for (const url of ['/', '/orders', '/orders/intake', '/customers', '/sales/rfq-inbox', '/pricing', '/units', '/heats', '/receiving', '/purchase-orders', '/work-orders', '/schedule', '/order-board', '/production', '/qc', '/time-tracking', '/shopfloor', '/shipping', '/material-tracking/packages', '/orders/invoices', '/orders/returns', '/orders/closeout', '/admin/users', '/help/manual']) { await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); await page.locator('main h1, main h2').first().waitFor({ timeout: 15000 }).catch(() => {}); await settle(page, 300); if ((await text(page, 'main')).trim().length < 40) blank.push(url); }
    t.check('no page error in 24 screens', page.errors.length === 0, page.errors.slice(0, 2).join(' | ')); t.check('no call answered with a server error', failed.length === 0, failed.slice(0, 3).join(' | ')); t.check('no screen was blank', blank.length === 0, blank.join(' '));
    t.check('no staff screen asks for a web shop customer\'s preferences', shopCalls.length === 0, `${shopCalls.length} calls ${shopCalls.slice(0, 2).join(' ')}`);
  });
  await sc('FAIL', 'dashboards show no figure the server did not send: with the server failing, no tile shows a number', async (t) => {
    const shown = [];
    for (const url of ['/', '/ops-cockpit', '/sales/dashboard', '/material-tracking', '/executive/compression-metrics', '/qc']) {
      const c = await ctx(boss); await c.route(/\/api\/(?!auth\/)/, (r) => (/\/src\//.test(r.request().url()) ? r.continue() : r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"planted failure"}' })));
      const page = await open(c, url); await settle(page, 2500);
      const figures = await page.locator('main h2, main h3, main h4, main h5').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter((x) => /^\$?[\d,]+(\.\d+)?\s?(%|k|K|M|lb|lbs|h|hrs)?$/.test(x) && Number(x.replace(/[^\d.]/g, '')) !== 0));
      if (figures.length) shown.push(`${url}: ${figures.slice(0, 4).join(', ')}`);
      t.check(`${url} is still on screen and did not crash`, page.errors.length === 0 && (await text(page, 'main')).trim().length > 20, page.errors.slice(0, 1).join(' '));
      await c.close();
    }
    t.check('no dashboard shows a figure of its own when the server sends none', shown.length === 0, shown.join(' | '));
  });
};
