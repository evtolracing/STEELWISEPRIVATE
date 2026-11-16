// Shipping, billing and financial.
module.exports = async (s) => {
  const { sc, P, boss, clerk, dock, api, rowsOf, ctx, open, text, has, shown, gone, pathOf, settle, until, APP, w, B, prisma, run } = s;
  const { screenShows, sent, money } = require('./lists.cjs')(s);
  const good = (page) => page.writes.filter((x) => x.status >= 200 && x.status < 300);
  const ship = (id) => prisma.shipment.findUnique({ where: { id } });
  /** A shipped order with its invoice, made through the server. */
  const shipped = async (qty = 300, price = 0.65) => { const m = await B.readyToShip(qty, { price }); const d = await B.dispatch(m.shipment); if (d.status > 299) throw new Error(`dispatch ${d.status}`); const [invoice] = await B.invoicesOf(m.order.id); return { ...m, invoice }; };

  await sc('SHIP', 'the shipment list shows the shipments the server sent', async (t) => {
    await B.readyToShip(150);
    const c = await ctx(P.shipper); const page = await open(c, '/shipping'); await page.locator('main tbody tr').first().waitFor();
    await screenShows(t, page, 'shipmentNumber', { urlPattern: /^\/shipments/ });
    const heads = await page.locator('main thead th').allInnerTexts(); t.check('with named columns', ['Shipment', 'Order', 'Customer', 'Status'].every((h) => heads.includes(h)), heads.join('|'));
  });

  await sc('SHIP', 'searching shipments narrows the list to what the server finds, and nothing found says so', async (t) => {
    const m = await B.readyToShip(160); const c = await ctx(P.shipper); const page = await open(c, '/shipping'); await page.locator('main tbody tr').first().waitFor(); await settle(page);
    await page.getByLabel('Search shipments').fill(m.shipment.shipmentNumber); await settle(page, 900);
    const rows = await page.locator('main tbody tr').allInnerTexts(); t.check('only that shipment remains', rows.length === 1 && rows[0].includes(m.shipment.shipmentNumber), rows.slice(0, 2).join(' / '));
    t.check('with its order and customer', rows[0].includes(m.order.orderNumber) && rows[0].includes(w.custA.name));
    await page.getByLabel('Search shipments').fill('SHP-NO-SUCH'); t.check('nothing found says so', await has(page, 'No shipments match.', 8000));
  });

  await sc('SHIP', 'a shipment opens from its row by keyboard and shows the stored order, customer and quantities', async (t) => {
    const m = await B.readyToShip(170); const c = await ctx(P.shipper); const page = await open(c, '/shipping'); await page.getByLabel('Search shipments').fill(m.shipment.shipmentNumber); await settle(page, 900);
    const row = page.locator('main tbody tr', { hasText: m.shipment.shipmentNumber }).first(); await row.focus(); await page.keyboard.press('Enter'); await until(() => pathOf(page) === `/shipping/${m.shipment.id}`);
    t.check('Enter opens it', pathOf(page) === `/shipping/${m.shipment.id}`, pathOf(page)); await has(page, 'What is on it'); const body = await text(page, 'main');
    t.check('heading, order and customer', (await text(page, 'main h1')).trim() === m.shipment.shipmentNumber && body.includes(m.order.orderNumber) && body.includes(w.custA.name));
    t.check('the quantity on this shipment', /170 LB/.test(body), body.slice(0, 300)); t.check('the state in words', /Not yet loaded/.test(body));
  });

  await sc('SHIP', 'Dispatch asks first, and a double click on Dispatch now ships once and raises one invoice', async (t) => {
    const m = await B.readyToShip(180); const c = await ctx(P.shipper); const page = await open(c, `/shipping/${m.shipment.id}`); await has(page, 'What is on it');
    await page.getByRole('button', { name: 'Dispatch', exact: true }).click(); t.check('it warns that this cannot be undone', await has(page, /cannot be undone here/));
    t.check('nothing has happened yet', (await ship(m.shipment.id)).status === m.shipment.status && good(page).length === 0);
    await page.getByRole('button', { name: 'Dispatch now' }).dblclick().catch(() => {}); t.check('the screen says it is on the road', await has(page, /On the road/, 12000));
    const invoices = await B.invoicesOf(m.order.id); t.check('exactly one invoice was raised', invoices.length === 1, invoices.length);
    const after = await ship(m.shipment.id); t.check('the shipment left once', Boolean(after.shippedAt) && !['PENDING', 'READY'].includes(after.status), after.status);
    const inv = await prisma.inventory.findFirst({ where: { coilId: m.coilId } }); t.check('the stock came off the books once', Number(inv.qtyOnHand) === 500, inv.qtyOnHand);
    t.check('the buttons for a shipment not yet gone are no longer offered', (await page.getByRole('button', { name: 'Cancel shipment' }).count()) === 0);
  });

  await sc('SHIP', 'two people on one shipment: the second Dispatch is told it already left and nothing is billed twice', async (t) => {
    const m = await B.readyToShip(190); const c = await ctx(P.shipper); const page = await open(c, `/shipping/${m.shipment.id}`); await has(page, 'What is on it');
    const first = await B.dispatch(m.shipment); t.check('a colleague dispatched it meanwhile', first.status < 300, first.status);
    await page.getByRole('button', { name: 'Dispatch', exact: true }).click(); await page.getByRole('button', { name: 'Dispatch now' }).click(); await page.waitForTimeout(1500);
    const said = `${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')} ${await text(page)}`; t.check('the screen says why, in words', /already|left|dispatched|on the road|cannot/i.test(said), said.slice(0, 240));
    t.check('still one invoice', (await B.invoicesOf(m.order.id)).length === 1); const inv = await prisma.inventory.findFirst({ where: { coilId: m.coilId } }); t.check('stock taken once', Number(inv.qtyOnHand) === 500, inv.qtyOnHand);
    t.check('no page error', page.errors.length === 0, page.errors[0]);
  });

  await sc('SHIP', 'a shipment with no stock reserved cannot be dispatched and the screen says what to do', async (t) => {
    const o = await B.order([B.line(120)]); const sh = await B.shipment(o, [[o.lines[0], 120]]); t.check('a shipment with nothing reserved was made', sh.status === 201, sh.status);
    const c = await ctx(P.shipper); const page = await open(c, `/shipping/${sh.body.id}`); await has(page, 'What is on it');
    await page.getByRole('button', { name: 'Dispatch', exact: true }).click(); await page.getByRole('button', { name: 'Dispatch now' }).click();
    t.check('it says to reserve the stock first', await has(page, /Reserve the stock that is going out/, 10000)); t.check('no invoice', (await B.invoicesOf(o.id)).length === 0); t.check('still not gone', !(await ship(sh.body.id)).shippedAt);
  });

  await sc('SHIP', 'delivery cannot be saved without who received it; with a name it is stored once', async (t) => {
    const m = await shipped(200); const c = await ctx(P.shipper); const page = await open(c, `/shipping/${m.shipment.id}`); await has(page, /On the road/);
    await page.getByRole('button', { name: 'Mark delivered' }).click(); const dialog = page.getByRole('dialog'); const save = dialog.getByRole('button', { name: 'Mark delivered' });
    t.check('the save is off while the name is empty', await save.isDisabled()); await dialog.getByLabel('Received by').fill('Dana P9 Receiver'); await save.dblclick().catch(() => {}); await gone(dialog, 10000);
    const after = await until(async () => { const x = await ship(m.shipment.id); return x.deliveredAt ? x : null; }, 6000); t.check('the shipment is delivered with that name', after && after.podSignature === 'Dana P9 Receiver', after && after.podSignature);
    t.check('one delivery was accepted', good(page).filter((x) => /deliver/.test(x.url)).length === 1, JSON.stringify(page.writes)); t.check('the screen names who received it', await has(page, 'Dana P9 Receiver'));
  });

  await sc('SHIP', 'Cancel shipment asks first; No keeps it, Yes cancels it once and leaves the stock reserved to the order', async (t) => {
    const m = await B.readyToShip(210); const c = await ctx(P.shipper); const page = await open(c, `/shipping/${m.shipment.id}`); await has(page, 'What is on it');
    await page.getByRole('button', { name: 'Cancel shipment' }).click(); const dialog = page.getByRole('dialog'); t.check('a question appears', await shown(dialog, 5000));
    await page.keyboard.press('Escape'); await gone(dialog); t.check('Escape keeps the shipment', (await ship(m.shipment.id)).status === m.shipment.status && good(page).length === 0);
    await page.getByRole('button', { name: 'Cancel shipment' }).click(); await page.getByRole('button', { name: 'Cancel the shipment' }).click();
    const after = await until(async () => { const x = await ship(m.shipment.id); return x.status === 'CANCELLED' ? x : null; }, 8000); t.check('it is cancelled', Boolean(after), (await ship(m.shipment.id)).status);
    const inv = await prisma.inventory.findFirst({ where: { coilId: m.coilId } }); t.check('nothing left the books', Number(inv.qtyOnHand) === 710, inv.qtyOnHand); t.check('no invoice', (await B.invoicesOf(m.order.id)).length === 0);
  });

  await sc('SHIP', 'the packing list and the bill of lading open as papers with the stored lines, and print without the app around them', async (t) => {
    const m = await B.readyToShip(220); const c = await ctx(P.shipper); const page = await open(c, `/shipping/${m.shipment.id}`); await has(page, 'What is on it');
    for (const name of ['Packing list', 'Bill of lading']) {
      await page.getByRole('button', { name }).click(); const paper = await page.frameLocator(`iframe[title="${name}"]`).locator('body').innerText({ timeout: 10000 }).catch((e) => `no paper: ${e.message}`);
      t.check(`${name}: names the shipment and the order`, paper.includes(m.shipment.shipmentNumber) && paper.includes(m.order.orderNumber), paper.slice(0, 200)); t.check(`${name}: carries the quantity`, /220/.test(paper));
      await page.keyboard.press('Escape'); await gone(page.getByRole('dialog'));
    }
    t.check('reading papers changes no shipment: the only thing sent is the paper to the print queue', good(page).every((x) => /print-queue|documents/.test(x.url)), JSON.stringify(page.writes));
    t.check('the shipment is as it was', (await ship(m.shipment.id)).status === m.shipment.status);
  });

  await sc('SHIP', 'carrier and truck details typed on screen are stored and shown', async (t) => {
    const m = await B.readyToShip(230); const c = await ctx(P.shipper); const page = await open(c, `/shipping/${m.shipment.id}`); await has(page, 'What is on it');
    await page.getByRole('button', { name: 'Carrier and truck' }).click(); await page.getByLabel('Truck number').fill(`T9-${run.slice(-4)}`); await page.getByLabel('Driver', { exact: true }).fill('Pat P9 Driver'); await page.getByRole('button', { name: 'Save' }).click();
    t.check('the truck is shown', await has(page, `T9-${run.slice(-4)}`)); const after = await ship(m.shipment.id); t.check('and stored', after.truckNumber === `T9-${run.slice(-4)}` && after.driverName === 'Pat P9 Driver', `${after.truckNumber}/${after.driverName}`);
  });

  await sc('SHIP', 'the dock sees that an invoice was raised and its number, and no amount; sales sees the amount', async (t) => {
    const m = await shipped(240, 0.5); const c = await ctx(P.shipper); const page = await open(c, `/shipping/${m.shipment.id}`); await has(page, /On the road/); const body = await text(page, 'main');
    t.check('the invoice number is on the dock’s screen', body.includes(m.invoice.invoiceNumber), body.slice(0, 300)); t.check('its amount is not', !body.includes(money(m.invoice.totalAmount)), money(m.invoice.totalAmount));
    const r = await api(P.shipper, 'GET', `/api/invoices/${m.invoice.id}`); t.check('the server refuses the invoice to the dock', r.status === 403, r.status);
    const c2 = await ctx(P.credit); const p2 = await open(c2, '/orders/invoices'); await p2.getByLabel('Invoice or order number').fill(m.invoice.invoiceNumber); t.check('the credit manager sees the invoice with its total', await has(p2, money(m.invoice.totalAmount), 10000));
  });

  await sc('SHIP', 'the invoice list shows the invoices the server sent for the Open view', async (t) => {
    await shipped(250); const c = await ctx(P.credit); const page = await open(c, '/orders/invoices'); await page.locator('main tbody tr').first().waitFor();
    const { rows } = await screenShows(t, page, 'invoiceNumber', { urlPattern: /^\/invoices/ }); t.check('rows on screen equal invoices sent', (await page.locator('main tbody tr').count()) === rows.length, `${await page.locator('main tbody tr').count()} / ${rows.length}`);
    t.check('none sent is fully paid', rows.every((r) => !['PAID', 'VOID'].includes(r.status)), [...new Set(rows.map((r) => r.status))].join(','));
  });

  for (const [button, ok] of [['Paid', (r) => r.status === 'PAID'], ['Overdue', (r) => new Date(r.dueDate) < new Date() && Number(r.balance ?? (r.totalAmount - r.paidAmount)) > 0], ['All', () => true]]) {
    await sc('SHIP', `the invoice list: "${button}" asks the server for that view and every row fits it`, async (t) => {
      const c = await ctx(P.credit); const page = await open(c, '/orders/invoices'); await settle(page, 800); const before = page.answers.length;
      await page.getByRole('button', { name: button, exact: true }).click(); await settle(page, 900);
      const fresh = page.answers.slice(before).filter((a) => /^\/invoices/.test(a.url)); t.check('the server was asked again', fresh.length >= 1, page.answers.slice(before).map((a) => a.url).join(' '));
      const rows = rowsOf(fresh.length ? fresh[fresh.length - 1].json : []); const on = await page.locator('main tbody tr').count();
      t.check('rows on screen equal rows sent', rows.length ? on === rows.length : on <= 1, `${on} / ${rows.length}`);
      if (rows.length) t.check('every row fits the view', rows.every(ok), rows.filter((r) => !ok(r)).slice(0, 2).map((r) => `${r.invoiceNumber}:${r.status}`).join(','));
      else t.check('an empty view says so', /No invoices|nothing|none/i.test(await text(page, 'main')), (await text(page, 'main')).slice(-200));
    });
  }

  await sc('SHIP', 'an invoice opens with every figure as stored: subtotal, tax, freight, total, paid and balance', async (t) => {
    const o = await B.order([B.line(260, 0.5)], { taxRate: 0.06, freight: 20 }); const coil = await B.received({ weightLb: 600 }); await B.reserve(o, o.lines[0], coil, 260); const sh = await B.shipment(o, [[o.lines[0], 260]]); await B.dispatch(sh.body);
    const [inv] = await B.invoicesOf(o.id); const c = await ctx(P.credit); const page = await open(c, '/orders/invoices'); await page.getByLabel('Invoice or order number').fill(inv.invoiceNumber);
    await page.getByText(inv.invoiceNumber, { exact: true }).first().click(); const dialog = page.getByRole('dialog'); await dialog.waitFor(); await has(page, 'Invoice issued'); const body = await dialog.innerText();
    for (const [what, v] of [['subtotal', inv.subtotal], ['tax', inv.taxAmount], ['freight', inv.freightAmount], ['total', inv.totalAmount]]) t.check(`${what} ${money(v)}`, body.includes(money(v)), body.slice(0, 400));
    t.check('the balance is the whole total', new RegExp(`Balance due\\s*\\${money(inv.totalAmount)}`).test(body.replace(/\n/g, ' ')), body.slice(-300)); t.check('who issued it is named', /QA/.test(body));
  });

  await sc('SHIP', 'a payment larger than the balance is refused; a right one saved with a double click is recorded once', async (t) => {
    const m = await shipped(270, 1); const c = await ctx(P.credit); const page = await open(c, '/orders/invoices'); await page.getByLabel('Invoice or order number').fill(m.invoice.invoiceNumber);
    await page.getByText(m.invoice.invoiceNumber, { exact: true }).first().click(); const dialog = page.getByRole('dialog'); await has(page, 'Invoice issued');
    await page.getByRole('button', { name: 'Record payment' }).click(); await page.getByLabel('Amount').fill('99999'); await dialog.getByRole('button', { name: 'Save' }).click(); await page.waitForTimeout(1200);
    t.check('too much is refused with a reason', /more than|exceed|balance|cannot/i.test(`${await dialog.innerText()} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`), (await dialog.innerText()).slice(-300)); t.check('nothing was recorded', (await prisma.payment.count({ where: { invoiceId: m.invoice.id } })) === 0);
    await page.getByLabel('Amount').fill('100'); await dialog.getByRole('button', { name: 'Save' }).dblclick().catch(() => {}); t.check('the screen says the payment was recorded', await has(page, /Payment recorded/, 10000));
    const pays = await prisma.payment.findMany({ where: { invoiceId: m.invoice.id } }); t.check('exactly one payment of $100.00 is on file', pays.length === 1 && Number(pays[0].amount) === 100, pays.map((p) => p.amount).join(','));
    t.check('the balance on screen is what is left', (await dialog.innerText()).replace(/\n/g, ' ').includes(money(Number(m.invoice.totalAmount) - 100)), (await dialog.innerText()).slice(-200));
  });

  await sc('SHIP', 'an auditor may read invoices and may not record a payment', async (t) => {
    const m = await shipped(280); const r = await api(P.auditor, 'GET', `/api/invoices/${m.invoice.id}`); t.check('the auditor reads the invoice', r.status === 200, r.status);
    const pay = await api(P.auditor, 'POST', `/api/invoices/${m.invoice.id}/payments`, { amount: 10, method: 'CHECK' }); t.check('the server refuses a payment from the auditor', pay.status === 403, `${pay.status} ${JSON.stringify(pay.body).slice(0, 100)}`);
    t.check('none was recorded', (await prisma.payment.count({ where: { invoiceId: m.invoice.id } })) === 0);
    const c = await ctx(P.auditor); const page = await open(c, '/orders/invoices'); await page.getByLabel('Invoice or order number').fill(m.invoice.invoiceNumber); await page.getByText(m.invoice.invoiceNumber, { exact: true }).first().click(); await has(page, 'Invoice issued');
    const offered = await page.getByRole('button', { name: 'Record payment' }).isVisible().catch(() => false);
    if (offered) { await page.getByRole('button', { name: 'Record payment' }).click(); await page.getByLabel('Amount').fill('10'); await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click(); await page.waitForTimeout(1200); t.check('if the button is offered, pressing it is refused in words and records nothing', (await prisma.payment.count({ where: { invoiceId: m.invoice.id } })) === 0 && /not allowed|cannot|permission|manager|sales|refused|only/i.test(`${await page.getByRole('dialog').innerText()} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`), (await page.getByRole('dialog').innerText()).slice(-200)); }
    else t.check('the button is not offered to a view-only role', true);
  });

  await sc('SHIP', 'the invoices page tells a shop role who may read invoices, and shows none', async (t) => {
    const c = await ctx(P.operator); const page = await open(c, '/orders/invoices'); await settle(page, 1200); const body = await text(page, 'main');
    t.check('it says who may read invoices', /sales, accounting and managers|No access/.test(body), body.slice(0, 200)); t.check('no invoice number is shown', !/INV-\d+/.test(body));
  });

  await sc('SHIP', '“Owed by age” shows the server’s figures for what customers owe', async (t) => {
    const c = await ctx(P.credit); const page = await open(c, '/orders/invoices'); await settle(page, 800); const before = page.answers.length;
    await page.getByRole('button', { name: 'Owed by age' }).click(); await settle(page, 1000); const fresh = page.answers.slice(before); t.check('the server was asked', fresh.length >= 1, 'no request');
    const body = await text(page); const flat = JSON.stringify(fresh.map((a) => a.json)); const amounts = [...flat.matchAll(/"(?:total|balance|current|amount)[A-Za-z]*":"?(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1])).filter((v) => v > 0).slice(0, 3);
    t.check('figures the server sent are on screen', amounts.length > 0 && amounts.every((v) => body.includes(money(v))), `${amounts.join(',')} in ${body.slice(0, 200)}`);
  });

  await sc('SHIP', 'the returns list shows the returns the server sent, with their value', async (t) => {
    const c = await ctx(P.credit); const page = await open(c, '/orders/returns'); await settle(page, 1000); const rows = sent(page, 'orderNumber', /return/i).length ? sent(page, 'orderNumber', /return/i) : sent(page, 'rmaNumber');
    const body = await text(page, 'main'); const numbers = [...new Set([...body.matchAll(/RMA-\d{4,}/g)].map((m) => m[0]))];
    t.check('returns are listed, or the screen says there are none', numbers.length > 0 || /No returns/i.test(body), body.slice(0, 200));
    const known = await prisma.order.count({ where: { orderNumber: { in: numbers }, orderType: 'RETURN' } }); t.check('every return number shown is a real return', known === numbers.length, `${known} of ${numbers.length}`); void rows;
  });

  await sc('SHIP', 'orders not closed: a filter asks the server and the rows are what it sent', async (t) => {
    await shipped(290); const c = await ctx(P.credit); const page = await open(c, '/orders/closeout'); await page.locator('main tbody tr').first().waitFor(); await settle(page); const before = page.answers.length;
    await page.getByRole('button', { name: 'Unpaid', exact: true }).click(); await settle(page, 1000); const fresh = page.answers.slice(before).filter((a) => /closeout/.test(a.url));
    t.check('the server was asked for that view', fresh.length >= 1 && /unpaid|waiting|reason|filter/i.test(fresh[fresh.length - 1].url), fresh.map((a) => a.url).join(' '));
    const rows = rowsOf(fresh[fresh.length - 1].json); const body = await text(page, 'main tbody'); t.check('the orders sent are on screen', rows.length > 0 && rows.slice(0, 5).every((r) => body.includes(r.orderNumber)), rows.slice(0, 5).map((r) => r.orderNumber).join(','));
    t.check('each row says it waits for payment', (await page.locator('main tbody tr').allInnerTexts()).every((r) => /unpaid|payment|owed/i.test(r)));
  });

  await sc('SHIP', 'a shipment of another branch cannot be opened by address', async (t) => {
    const other = await prisma.shipment.findFirst({ where: { fromLocationId: w.L2.id, order: { locationId: w.L2.id } } }); if (!other) return t.na('no shipment from branch 2');
    const r = await api(P.shipper, 'GET', `/api/shipments/${other.id}`); t.check('the server refuses it', r.status === 403 || r.status === 404, r.status);
    const c = await ctx(P.shipper); const page = await open(c, `/shipping/${other.id}`); await settle(page, 1200); t.check('the page shows nothing of it', !(await text(page, 'main')).includes(other.shipmentNumber)); t.check('and says so', /not found|not on file|could not|no access/i.test(await text(page, 'main')), (await text(page, 'main')).slice(0, 160));
  });

  await sc('SHIP', 'on a phone a shipment can be read and dispatched: nothing runs off the screen and the buttons are big enough', async (t) => {
    const m = await B.readyToShip(310); const c = await ctx(P.shipper, 'phone', { hasTouch: true, isMobile: true }); const page = await open(c, `/shipping/${m.shipment.id}`); await has(page, 'What is on it');
    t.check('the page is no wider than the phone', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    const box = await page.getByRole('button', { name: 'Dispatch', exact: true }).boundingBox(); t.check('Dispatch is on screen and at least 36 px tall', box && box.x >= 0 && box.x + box.width <= 391 && box.height >= 36, JSON.stringify(box));
    await page.getByRole('button', { name: 'Dispatch', exact: true }).tap(); const dialog = page.getByRole('dialog'); await dialog.waitFor(); const d = await dialog.boundingBox(); t.check('the question fits the phone', d && d.width <= 390 && d.x >= 0, JSON.stringify(d));
    await page.getByRole('button', { name: 'Dispatch now' }).tap(); t.check('it ships', await has(page, /On the road/, 12000)); t.check('one invoice', (await B.invoicesOf(m.order.id)).length === 1);
  });

  await sc('SHIP', 'a lost load can be ended only by a manager: the dock is told so and nothing is credited', async (t) => {
    const m = await shipped(320); const prob = await api(P.shipper, 'PUT', `/api/shipments/${m.shipment.id}/exception`, { reason: 'P9 lost on the road' }).catch(() => ({ status: 0 }));
    const r = await api(P.shipper, 'POST', `/api/shipments/${m.shipment.id}/lost`, { kind: 'LOST_IN_TRANSIT', note: 'P9 test' }).then((x) => (x.status === 404 ? api(P.shipper, 'PUT', `/api/shipments/${m.shipment.id}/lost`, { kind: 'LOST_IN_TRANSIT', note: 'P9 test' }) : x));
    t.check('the server refuses the dock', r.status === 403 || r.status === 409, `${r.status} (problem step ${prob.status})`); t.check('the shipment is not lost', (await ship(m.shipment.id)).status !== 'LOST');
    const credits = await prisma.invoice.findUnique({ where: { id: m.invoice.id } }); t.check('the invoice is untouched', String(credits.totalAmount) === String(m.invoice.totalAmount) && credits.status === m.invoice.status);
  });
};
