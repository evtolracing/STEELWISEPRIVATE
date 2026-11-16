// Purchasing, inventory and warehouse.
module.exports = async (s) => {
  const { sc, P, boss, clerk, api, rowsOf, ctx, open, openWithAnswer, text, has, shown, gone, pathOf, settle, until, APP, w, B, prisma, run } = s;
  const { listShows, money } = require('./lists.cjs')(s);
  const lb = (v) => `${Number(v).toLocaleString('en-US')} lb`;
  const good = (page) => page.writes.filter((x) => x.status >= 200 && x.status < 300);

  await sc('STOCK', 'the stock list shows the items the server sent, with heat, grade and location', async (t) => {
    await B.received({ weightLb: 4321 });
    await listShows(t, await ctx(P.stock), '/units', /^\/coils\?limit/, (c) => c.coilNumber, { more: [['location', (c) => c.location?.name], ['grade', (c) => c.grade?.code]] });
  });

  await sc('STOCK', 'searching stock narrows the list to what the server finds, and an unknown number says so', async (t) => {
    const id = await B.received({ weightLb: 2222 }); const coil = await prisma.coil.findUnique({ where: { id } });
    const c = await ctx(P.stock); const page = await open(c, '/units'); await settle(page);
    const got = page.waitForResponse((r) => /\/api\/coils\?.*search=/.test(r.url()) && r.status() === 200);
    await page.getByLabel('Search stock items').fill(coil.coilNumber); const rows = rowsOf(await (await got).json()); await settle(page, 500);
    const on = await page.locator('main tbody tr').allInnerTexts();
    t.check('one item is found and shown', rows.length === 1 && on.length === 1 && on[0].includes(coil.coilNumber), `${rows.length} found, ${on.length} shown`);
    t.check('with its weight on hand', /2,222/.test(on[0] || ''), on[0]);
    await page.getByLabel('Search stock items').fill('ZZ-NO-SUCH-ITEM'); await settle(page, 900);
    t.check('an unknown number says nothing was found', /No (stock )?items|nothing|no results|No inventory/i.test(await text(page, 'main')), (await text(page, 'main')).slice(-300));
  });

  await sc('STOCK', 'a stock item opens from its row with the keyboard and shows what is on file', async (t) => {
    const id = await B.received({ weightLb: 3456 }); const coil = await prisma.coil.findUnique({ where: { id }, include: { grade: true, location: true, heat: true } });
    const c = await ctx(P.stock); const page = await open(c, `/units`); await page.getByLabel('Search stock items').fill(coil.coilNumber); await settle(page, 900);
    const row = page.locator('main tbody tr', { hasText: coil.coilNumber }).first(); await row.focus(); await page.keyboard.press('Enter');
    await until(() => pathOf(page) === `/units/${id}`);
    t.check('Enter on the row opens the item', pathOf(page) === `/units/${id}`, pathOf(page));
    await has(page, coil.coilNumber); await settle(page, 500); const body = await text(page, 'main');
    t.check('the heading is the item number', (await text(page, 'main h1')).trim() === coil.coilNumber);
    t.check('on hand', body.includes(lb(3456)), body.slice(0, 300));
    t.check('heat, grade and location', body.includes(coil.heat.heatNumber) && body.includes(coil.grade.code) && body.includes(coil.location.name));
    t.check('the title names the item', await until(async () => (await page.title()).startsWith(coil.coilNumber), 5000), await page.title());
  });

  await sc('STOCK', 'stock reserved for an order shows as reserved and not available, as the server holds it', async (t) => {
    const made = await B.readyToShip(400); const coil = await prisma.coil.findUnique({ where: { id: made.coilId } });
    const c = await ctx(P.stock); const page = await open(c, `/units/${made.coilId}`); await has(page, coil.coilNumber); await settle(page, 500);
    const body = await text(page, 'main');
    t.check('on hand 900 lb', /On hand\s*900 lb/.test(body), body.slice(0, 260));
    t.check('reserved 400 lb', /Reserved for orders\s*400 lb/.test(body));
    t.check('available 500 lb', /Available\s*500 lb/.test(body));
  });

  for (const [button, mustHave] of [['Move', /location|branch/i], ['Correct quantity', /reason|weight|quantity/i], ['Put on hold', /reason|why/i], ['Edit', /./]]) {
    await sc('STOCK', `a stock item: "${button}" opens a named dialog, cannot be saved empty, and Cancel changes nothing`, async (t) => {
      const id = await B.received({ weightLb: 1500 }); const before = await prisma.coil.findUnique({ where: { id } });
      const c = await ctx(P.stock); const page = await open(c, `/units/${id}`); await has(page, before.coilNumber);
      await page.getByRole('button', { name: button, exact: true }).first().click();
      const dialog = page.getByRole('dialog').first(); t.check('a dialog opens', await shown(dialog, 5000));
      const body = await dialog.innerText(); t.check('it asks for what the step needs', mustHave.test(body), body.slice(0, 200));
      const save = dialog.getByRole('button').filter({ hasNotText: /cancel|close/i }).last();
      if (button !== 'Edit') { if (await save.isEnabled().catch(() => false)) { await save.click(); await page.waitForTimeout(800); t.check('an empty form is not accepted', (await dialog.isVisible()) && good(page).length === 0, JSON.stringify(page.writes)); } else t.check('the save button is off while empty', true); }
      await dialog.getByRole('button', { name: /cancel|close/i }).first().click(); t.check('Cancel closes it', await gone(dialog));
      const after = await prisma.coil.findUnique({ where: { id } });
      t.check('the item is unchanged', after.locationId === before.locationId && String(after.netWeightLb) === String(before.netWeightLb) && after.status === before.status && after.updatedAt.getTime() === before.updatedAt.getTime());
    });
  }

  await sc('STOCK', 'a quantity correction made on screen is stored once with its reason and shows in the history', async (t) => {
    const id = await B.received({ weightLb: 1000 }); const coil = await prisma.coil.findUnique({ where: { id } });
    const c = await ctx(P.stock); const page = await open(c, `/units/${id}`); await has(page, coil.coilNumber);
    await page.getByRole('button', { name: 'Correct quantity', exact: true }).click(); const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Quantity actually there/).fill('940'); await dialog.getByLabel(/What was found/).fill(`P9 recount ${run}`);
    const save = dialog.getByRole('button').filter({ hasNotText: /cancel|close/i }).last();
    t.check('the save button comes on', await until(() => save.isEnabled(), 4000), await dialog.innerText());
    await save.dblclick().catch(() => {}); await gone(dialog, 10000);
    const after = await until(async () => { const x = await prisma.inventory.findFirst({ where: { coilId: id } }); return x && Number(x.qtyOnHand) === 940 ? x : null; }, 6000);
    t.check('the books now hold 940 lb', Boolean(after), after && after.qtyOnHand);
    const accepted = good(page).filter((x) => x.method !== 'GET'); t.check('one change was accepted', accepted.length === 1, JSON.stringify(page.writes));
    await settle(page, 600); t.check('the screen shows 940 lb', /On hand\s*940 lb/.test(await text(page, 'main')));
    const history = await api(P.stock, 'GET', `/api/coils/${id}/history`); const told = JSON.stringify(history.body || '');
    t.check('the history holds the reason once, with who did it', told.split(`P9 recount ${run}`).length === 2 && /P9 stock/.test(told), told.slice(0, 200));
    t.check('the history on screen shows it', (await text(page, 'main')).includes(`P9 recount ${run}`));
  });

  await sc('STOCK', 'a branch’s stock list holds only that branch’s stock', async (t) => {
    const id1 = await B.received({ weightLb: 777 }); const id2 = await B.received({ weightLb: 778, locationId: w.L2.id });
    const c1 = await prisma.coil.findUnique({ where: { id: id1 } }); const c2 = await prisma.coil.findUnique({ where: { id: id2 } });
    const two = await s.signIn('qa-branch-wh@qa.test').catch(() => null);
    const who = P.stock; const c = await ctx(who); const { page, rows } = await openWithAnswer(c, '/units', /^\/coils\?limit/);
    const foreign = rows.filter((r) => r.locationId && r.locationId !== w.L1.id).length;
    t.check('every item sent is at the manager’s own branch', foreign === 0, `${foreign} of ${rows.length}`);
    await page.getByLabel('Search stock items').fill(c2.coilNumber); await settle(page, 1000);
    t.check('the other branch’s item cannot be found', !(await text(page, 'main tbody')).includes(c2.coilNumber));
    const r = await api(who, 'GET', `/api/coils/${id2}`); t.check('and the server refuses it by address', r.status === 403 || r.status === 404, r.status);
    const p2 = await open(c, `/units/${id2}`); await settle(p2, 1000); t.check('its page shows nothing of it', !(await text(p2, 'main')).includes(c2.coilNumber));
    await page.getByLabel('Search stock items').fill(c1.coilNumber); await settle(page, 1000); t.check('the own-branch item is found', (await text(page, 'main tbody')).includes(c1.coilNumber));
    void two;
  });

  await sc('STOCK', 'the heat list shows the heats the server sent and searching narrows it', async (t) => {
    const { page } = await listShows(t, await ctx(P.stock), '/heats', /^\/heats\?limit/, (h) => h.heatNumber, { more: [['grade', (h) => h.grade?.code]] });
    const got = page.waitForResponse((r) => /\/api\/heats\?.*search=/.test(r.url()) && r.status() === 200);
    await page.getByLabel('Search heats').fill(w.heat.heatNumber); const rows = rowsOf(await (await got).json()); await settle(page, 500);
    const on = await page.locator('main tbody tr').allInnerTexts();
    t.check('the rows on screen are the rows found', on.length === rows.length && on.every((r) => r.includes(w.heat.heatNumber.slice(0, 6))), `${on.length} / ${rows.length}`);
  });

  await sc('STOCK', 'a heat page shows its grade and its stock items, and the tabs can be worked by keyboard', async (t) => {
    const c = await ctx(P.stock); const page = await open(c, `/heats/${w.heat.id}`); await has(page, w.heat.heatNumber); await settle(page, 500);
    const body = await text(page, 'main');
    t.check('the heading names the heat', (await text(page, 'main h1')).includes(w.heat.heatNumber));
    t.check('the grade', body.includes(w.heat.grade.code));
    const count = await prisma.coil.count({ where: { heatId: w.heat.id } }); const tab = page.getByRole('tab', { name: /Stock items/ });
    const shownCount = Number(((await tab.innerText()).match(/\((\d+)\)/) || [])[1]);
    t.check('the Stock items tab counts what the server will list', shownCount > 0 && shownCount <= count, `${shownCount} shown, ${count} in all branches`);
    await tab.focus(); await page.keyboard.press('Enter'); await settle(page, 600);
    t.check('the tab opens a list of items', (await page.locator('main tbody tr').count()) > 0);
    t.check('it is marked selected', (await tab.getAttribute('aria-selected')) === 'true');
  });

  await sc('STOCK', 'receiving lists what is expected from open purchase orders and what was received, from the server', async (t) => {
    const c = await ctx(P.receiver); const page = await open(c, '/receiving'); await settle(page, 1000);
    const body = await text(page, 'main');
    t.check('the screen opens for a receiving clerk', /Receiving/.test(await text(page, 'main h1')));
    t.check('it explains what is expected', /Expected/i.test(body), body.slice(0, 300));
    const numbers = [...new Set([...body.matchAll(/PO-\d{4,}/g)].map((m) => m[0]))]; const known = await prisma.order.count({ where: { orderNumber: { in: numbers }, orderType: 'PO' } });
    t.check('every purchase order number shown is on file', known === numbers.length, `${known} of ${numbers.length}`);
    t.check('no page error', page.errors.length === 0, page.errors[0]);
  });

  await sc('STOCK', 'receiving an item on screen: an unknown heat is said first, then a real item is stored once and listed', async (t) => {
    const number = `P9-RC-${run.toUpperCase()}`; const c = await ctx(P.receiver); const page = await open(c, '/receiving');
    await page.getByRole('button', { name: 'Receive item' }).first().click(); const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Item number/).fill(number); await dialog.getByLabel(/Weight \(lb\)/).fill('1234');
    await dialog.getByLabel(/Heat or lot number/).fill('NO-SUCH-HEAT-P9'); await dialog.getByLabel(/Heat or lot number/).blur();
    t.check('a heat not on file is said before saving', await has(page, /This heat is not on file/, 8000));
    t.check('and the save button is off', await dialog.getByRole('button', { name: 'Receive item', exact: true }).isDisabled());
    await dialog.getByLabel(/Heat or lot number/).fill(w.heat.heatNumber); await dialog.getByLabel(/Heat or lot number/).blur();
    await has(page, new RegExp(`On file: .*grade ${w.heat.grade.code}`), 8000);
    const loc = dialog.getByLabel(/^Location/); if (await loc.isEnabled().catch(() => false)) { await loc.click(); await page.getByRole('option').first().click(); }
    const save = dialog.getByRole('button', { name: 'Receive item', exact: true }); await until(() => save.isEnabled(), 4000); await save.dblclick().catch(() => {});
    t.check('the screen says it was received', await has(page, `${number} received`, 10000));
    const stored = await prisma.coil.findMany({ where: { coilNumber: number } });
    t.check('exactly one item is in the database, at 1,234 lb', stored.length === 1 && Number(stored[0].netWeightLb) === 1234, stored.map((x) => x.netWeightLb).join(','));
    t.check('at the clerk’s own branch', stored[0] && stored[0].locationId === w.L1.id);
    t.check('it is listed', (await text(page, 'main')).includes(number));
  });

  await sc('STOCK', 'the receipts search narrows the list and says when nothing matches', async (t) => {
    const c = await ctx(P.receiver); const page = await open(c, '/receiving'); await settle(page, 800);
    const before = await page.locator('main tbody tr').count();
    await page.getByLabel('Search receipts').fill('zz-no-such-receipt'); await settle(page, 400);
    t.check('nothing matching says so', /No receipts match your search/.test(await text(page, 'main')));
    await page.getByLabel('Search receipts').fill(''); await settle(page, 400);
    t.check('clearing brings the list back', (await page.locator('main tbody tr').count()) === before);
  });

  await sc('STOCK', 'the purchase order list shows the orders the server sent, with supplier and total', async (t) => {
    await listShows(t, await ctx(P.buyer), '/purchase-orders', /^\/purchase-orders\?limit/, (p) => p.orderNumber, { more: [['supplier', (p) => p.seller?.name], ['total', (p) => money(p.totalAmount)]] });
  });

  await sc('STOCK', 'a purchase order opens from its row and shows its lines and total as stored', async (t) => {
    const c = await ctx(P.buyer); const { page, rows } = await openWithAnswer(c, '/purchase-orders', /^\/purchase-orders\?limit/);
    if (!rows.length) return t.na('no purchase order in this database');
    const row = page.locator('main tbody tr', { hasText: rows[0].orderNumber }).first(); await row.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog'); t.check('Enter on the row opens it', await shown(dialog, 6000));
    const db = await prisma.order.findUnique({ where: { id: rows[0].id }, include: { lines: true } }); const body = await dialog.innerText();
    t.check('the number', body.includes(db.orderNumber));
    t.check('the total', body.includes(money(db.totalAmount)), `${money(db.totalAmount)} in ${body.slice(0, 160)}`);
    t.check('one row per line', (await dialog.locator('tbody tr').count()) === db.lines.length, `${await dialog.locator('tbody tr').count()} / ${db.lines.length}`);
    await page.keyboard.press('Escape'); t.check('Escape closes it and nothing changed', (await gone(dialog)) && page.writes.length === 0);
  });

  await sc('STOCK', 'the Supply position tab shows figures from the server and the tabs keep their place', async (t) => {
    const c = await ctx(P.buyer); const page = await open(c, '/purchase-orders'); await settle(page);
    const got = page.waitForResponse((r) => /\/api\//.test(r.url()) && !/purchase-orders\?limit/.test(r.url()) && r.request().method() === 'GET' && r.status() === 200, { timeout: 8000 }).catch(() => null);
    await page.getByRole('tab', { name: 'Supply position' }).click(); const res = await got; await settle(page, 600);
    t.check('the server was asked for it', Boolean(res), 'no request');
    t.check('the tab is selected', (await page.getByRole('tab', { name: 'Supply position' }).getAttribute('aria-selected')) === 'true');
    t.check('it shows a table or says there is nothing', (await page.locator('main tbody tr').count()) > 0 || /No |nothing/i.test(await text(page, 'main')));
    await page.getByRole('tab', { name: 'Purchase orders' }).click(); await settle(page, 400);
    t.check('going back shows the orders again', /PO-\d+/.test(await text(page, 'main')));
  });

  await sc('STOCK', 'a receiving clerk may receive but may not raise or change a purchase order', async (t) => {
    const c = await ctx(P.receiver); const page = await open(c, '/purchase-orders'); await settle(page, 800);
    const canOpen = !/No access/.test(await text(page, 'main'));
    const r = await api(P.receiver, 'POST', '/api/purchase-orders', { supplierId: w.supplierOrg.id, lines: [{ description: 'P9 not allowed', quantity: 1, unitPrice: 1 }] });
    t.check('the server refuses a purchase order from a receiving clerk', r.status === 403, r.status);
    if (canOpen) { const button = page.getByRole('button', { name: 'New purchase order', exact: true }); const there = await button.isVisible().catch(() => false); void there; t.check('the list is readable', /Purchase orders/.test(await text(page, 'main h1'))); }
    t.check('no purchase order was created', (await prisma.orderLine.count({ where: { description: 'P9 not allowed' } })) === 0);
  });

  await sc('STOCK', 'the packing list of packages shows what the server sent', async (t) => {
    await listShows(t, await ctx(boss), '/material-tracking/packages', /^\/drop-tags\/packages/, (p) => p.packageId, { more: [['status', (p) => String(p.status).charAt(0) + String(p.status).slice(1).toLowerCase().replace(/_/g, ' ')]] });
  });

  await sc('STOCK', 'the stock list pages: the second page is the server’s second page', async (t) => {
    const c = await ctx(boss); const { page, rows } = await openWithAnswer(c, '/units', /^\/coils\?limit/);
    const got = page.waitForResponse((r) => /\/api\/coils\?.*offset=25/.test(r.url()) && r.status() === 200);
    await page.getByRole('button', { name: 'Go to next page' }).click(); const second = rowsOf(await (await got).json()); await settle(page, 400);
    const body = await text(page, 'main tbody');
    t.check('page two is on screen', second.length > 0 && second.slice(0, 5).every((r) => body.includes(r.coilNumber)));
    t.check('page one is not', !body.includes(rows[0].coilNumber));
    t.check('the page marker moved', /26[–-]50/.test(await text(page, 'main')), (await text(page, 'main')).slice(-120));
  });

  await sc('STOCK', 'stock columns have headers a screen reader can use, and status is said in words', async (t) => {
    const c = await ctx(P.stock); const page = await open(c, '/units'); await page.locator('main tbody tr').first().waitFor();
    const heads = await page.locator('main thead th').allInnerTexts();
    t.check('every column has a header', heads.length >= 8 && heads.every((h) => h.trim().length > 0), heads.join('|'));
    const statuses = await page.locator('main tbody tr td:last-child').allInnerTexts();
    t.check('every row states its status in words', statuses.length > 0 && statuses.every((x) => /[A-Za-z]{3,}/.test(x)), statuses.slice(0, 4).join('|'));
    t.check('rows can be reached by Tab', (await page.locator('main tbody tr[tabindex="0"]').count()) === statuses.length, `${await page.locator('main tbody tr[tabindex="0"]').count()} of ${statuses.length}`);
  });

  await sc('STOCK', 'the stock upload dialog explains its steps and cannot continue without a choice', async (t) => {
    const c = await ctx(P.stock); const page = await open(c, '/units'); await page.getByRole('button', { name: 'Upload', exact: true }).click();
    const dialog = page.getByRole('dialog'); await dialog.waitFor(); const body = await dialog.innerText();
    t.check('the three steps are named', /Select Template/.test(body) && /Upload File/.test(body) && /Review/.test(body));
    t.check('the last step is off until the earlier ones are done', await dialog.getByRole('button', { name: /3\. Review/ }).isDisabled().catch(() => true));
    await page.keyboard.press('Escape'); t.check('Escape closes it and nothing was sent', (await gone(dialog)) && page.writes.length === 0);
  });

  await sc('STOCK', 'a buyer starts at stock and can reach purchase orders; a clerk in sales cannot receive', async (t) => {
    const r1 = await api(P.buyer, 'GET', '/api/purchase-orders?limit=1'); t.check('the buyer may read purchase orders', r1.status === 200, r1.status);
    const r2 = await api(clerk, 'POST', '/api/inventory/receipts', B.receiptBody()); t.check('the server refuses a receipt from a sales clerk', r2.status === 403, r2.status);
    const c = await ctx(clerk); const page = await open(c, '/receiving'); await settle(page, 800);
    const button = page.getByRole('button', { name: 'Receive item' }).first();
    t.check('the sales clerk’s screen does not offer to receive, or the server refuses', !(await button.isVisible().catch(() => false)) || r2.status === 403);
  });

  await sc('STOCK', 'Refresh on the stock list shows an item received meanwhile, without reloading the page', async (t) => {
    const c = await ctx(P.stock); const page = await open(c, '/units'); await page.locator('main tbody tr').first().waitFor(); await settle(page);
    const id = await B.received({ weightLb: 1111 }); const coil = await prisma.coil.findUnique({ where: { id } });
    t.check('the new item is not on screen yet', !(await text(page, 'main tbody')).includes(coil.coilNumber));
    await page.getByRole('button', { name: 'Refresh' }).click();
    t.check('after Refresh it is, at the top', await until(async () => (await page.locator('main tbody tr').first().innerText()).includes(coil.coilNumber), 8000), await page.locator('main tbody tr').first().innerText());
    t.check('nothing was changed by refreshing', page.writes.length === 0);
  });

  await sc('STOCK', 'a receiving clerk cannot correct a quantity: the server refuses, and the screen does not pretend it worked', async (t) => {
    const id = await B.received({ weightLb: 900 }); const coil = await prisma.coil.findUnique({ where: { id } });
    const r = await api(P.receiver, 'POST', '/api/inventory/adjust', { coilId: id, countedQty: 1, reason: 'COUNT', note: 'P9 not allowed' });
    t.check('the server refuses a correction from a receiving clerk', r.status === 403, `${r.status} ${JSON.stringify(r.body).slice(0, 100)}`);
    const c = await ctx(P.receiver); const page = await open(c, `/units/${id}`); await has(page, coil.coilNumber); const button = page.getByRole('button', { name: 'Correct quantity', exact: true });
    if (await button.isVisible().catch(() => false)) {
      await button.click(); const dialog = page.getByRole('dialog'); await dialog.getByLabel(/Quantity actually there/).fill('1'); await dialog.getByLabel(/What was found/).fill('P9 not allowed'); await dialog.getByRole('button', { name: 'Record correction' }).click(); await page.waitForTimeout(1200);
      const said = `${await dialog.innerText().catch(() => '')} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`;
      t.check('pressing it is refused in words', /manager|not allowed|cannot|only|permission/i.test(said), said.slice(-240));
    } else t.check('the button is not offered', true);
    const inv = await prisma.inventory.findFirst({ where: { coilId: id } }); t.check('the books still hold 900 lb', Number(inv.qtyOnHand) === 900, inv.qtyOnHand);
  });
};
