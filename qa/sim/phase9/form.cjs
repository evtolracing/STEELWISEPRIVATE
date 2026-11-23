// Forms, dialogs, validation and actions.
module.exports = async (s) => {
  const { sc, P, boss, clerk, api, rowsOf, ctx, open, text, has, shown, gone, pathOf, settle, until, APP, w, B, prisma, run } = s;
  const DIALOGS = [
    ['/customers', 'New Customer', /^Create Customer$/, boss],
    ['/heats', 'Add Heat', /^Add heat$/, boss],
    ['/shipping', 'New shipment', /^Create shipment$/, boss],
    ['/receiving', 'Receive item', /^Receive item$/, boss],
    ['/purchase-orders', 'New purchase order', /^Save as draft$/, boss],
    ['/orders/returns', 'New return', /^Open return$/, boss],
    ['/admin/users', 'Add User', /^Create User$/, boss],
    ['/admin/staff', 'Add Operator', /^Create$/, boss],
    ['/sales/rfq-inbox', 'New RFQ', /^Save RFQ$/, clerk],
    ['/shopfloor', 'New Work Center', /^Create Work Center$/, boss],
    ['/order-board', 'New Job', /^Create Job$/, boss],
    ['/material-tracking/packages', 'Open a package', /^Open package$/, boss],
  ];
  const good = (page) => page.writes.filter((x) => x.status >= 200 && x.status < 300 && !x.replayed); // an answer given again for a repeated request is not a second save

  for (const [route, opener, , who] of DIALOGS) {
    await sc('FORM', `${route} "${opener}": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved`, async (t) => {
      const c = await ctx(who); const page = await open(c, route);
      const button = page.getByRole('button', { name: opener, exact: true }).first();
      await button.waitFor(); await button.focus(); await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog').first();
      t.check('Enter on the button opens a dialog', await shown(dialog, 6000));
      const info = await dialog.evaluate((el) => ({ name: el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') && (document.getElementById(el.getAttribute('aria-labelledby')) || {}).innerText) || '', modal: el.getAttribute('aria-modal') }));
      t.check('the dialog has a name', info.name.trim().length > 2, JSON.stringify(info));
      t.check('focus moved into the dialog', await until(() => page.evaluate(() => Boolean(document.activeElement && document.activeElement.closest('.MuiDialog-root, .MuiModal-root'))), 3000));
      let inside = true;
      for (let i = 0; i < 25; i += 1) { await page.keyboard.press(i % 5 === 4 ? 'Shift+Tab' : 'Tab'); inside = inside && await page.evaluate(() => Boolean(document.activeElement && document.activeElement.closest('.MuiDialog-root, .MuiModal-root, .MuiPopover-root'))); }
      t.check('25 presses of Tab never leave the dialog', inside);
      const behind = await page.evaluate(() => { const root = document.getElementById('root'); return root ? root.getAttribute('aria-hidden') : null; });
      t.check('the page behind is hidden from a screen reader', behind === 'true', behind);
      await page.keyboard.press('Escape'); if (await dialog.isVisible().catch(() => false)) await page.keyboard.press('Escape');
      t.check('Escape closes it', await gone(dialog));
      t.check('focus returns to the button that opened it', await until(() => page.evaluate((n) => { const a = document.activeElement; return Boolean(a) && ((a.getAttribute('aria-label') || a.innerText || '').trim() === n); }, opener), 3000), await page.evaluate(() => (document.activeElement.innerText || document.activeElement.tagName).slice(0, 40)));
      t.check('nothing was sent to be saved', page.writes.length === 0, JSON.stringify(page.writes));
      t.check('no page error', page.errors.length === 0, page.errors[0]);
    });
  }

  for (const [route, opener, primary, who] of DIALOGS) {
    await sc('FORM', `${route} "${opener}": an empty form cannot be saved and says what is missing`, async (t) => {
      const c = await ctx(who); const page = await open(c, route);
      await page.getByRole('button', { name: opener, exact: true }).first().click();
      const dialog = page.getByRole('dialog').first(); await dialog.waitFor();
      const save = dialog.getByRole('button', { name: primary }).last();
      t.check('the save button is there', await shown(save, 4000));
      if (await save.isDisabled()) {
        t.check('the save button is off until the form is filled', true);
        const required = await dialog.locator('input[required], textarea[required], [aria-required="true"], label.Mui-required, .MuiFormLabel-asterisk').count();
        const hint = /required|needed|Find order|first|enter|type/i.test(await dialog.innerText());
        t.check('the form marks what is required, or says what to do first', required > 0 || hint, (await dialog.innerText()).slice(0, 160));
      } else {
        await save.click(); await page.waitForTimeout(900);
        t.check('the dialog stays open', await dialog.isVisible());
        const said = await dialog.evaluate((el) => ({ invalid: el.querySelectorAll('[aria-invalid="true"], .Mui-error, input:invalid').length, alert: (el.querySelector('[role="alert"]') || {}).innerText || '' }));
        const toast = await page.locator('[role="alert"], .MuiSnackbar-root').allInnerTexts();
        t.check('it says what is wrong', said.invalid > 0 || said.alert || toast.join('').length > 3, JSON.stringify(said));
      }
      t.check('nothing was saved', good(page).length === 0, JSON.stringify(page.writes));
    });
  }

  await sc('FORM', 'a new customer typed once and saved with a double click is stored once', async (t) => {
    const code = `P9C${run.slice(-5).toUpperCase()}`; const name = `QA P9 customer ${run}`;
    const c = await ctx(boss); const page = await open(c, '/customers');
    await page.getByRole('button', { name: 'New Customer', exact: true }).click();
    const dialog = page.getByRole('dialog'); await dialog.getByLabel('Code').fill(code); await dialog.getByLabel('Name').fill(name);
    await dialog.getByRole('button', { name: 'Create Customer' }).dblclick();
    t.check('the dialog closes', await gone(dialog, 10000));
    const made = await until(async () => { const r = await prisma.organization.findMany({ where: { name } }); return r.length ? r : null; }, 6000);
    t.check('exactly one customer is in the database', made && made.length === 1, made && made.length);
    t.check('one save was accepted', good(page).filter((x) => x.method === 'POST').length === 1, JSON.stringify(page.writes));
    await page.getByLabel('Search by name or code').fill(code); await settle(page, 700);
    t.check('the list shows the new customer', await has(page, name, 8000));
  });

  await sc('FORM', 'a customer code already in use is refused with the reason, and what was typed is kept', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/customers');
    await page.getByRole('button', { name: 'New Customer', exact: true }).click();
    const dialog = page.getByRole('dialog'); await dialog.getByLabel('Code').fill(w.custA.code); await dialog.getByLabel('Name').fill(`QA P9 duplicate ${run}`);
    await dialog.getByRole('button', { name: 'Create Customer' }).click(); await page.waitForTimeout(1200);
    t.check('the dialog stays open', await dialog.isVisible());
    const said = `${await dialog.innerText()} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`;
    t.check('it says the code is taken', /already|exists|in use|taken|duplicate/i.test(said), said.slice(0, 200));
    t.check('the name typed is still there', (await dialog.getByLabel('Name').inputValue()) === `QA P9 duplicate ${run}`);
    t.check('no second customer has that code', (await prisma.organization.count({ where: { code: w.custA.code } })) === 1);
  });

  await sc('FORM', 'when the server fails on save, the form says so and keeps every entry', async (t) => {
    const c = await ctx(boss); await c.route(/\/api\/customers$/, (r) => (r.request().method() === 'POST' ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"The server could not save"}' }) : r.continue()));
    const page = await open(c, '/customers'); const name = `QA P9 fail ${run}`;
    await page.getByRole('button', { name: 'New Customer', exact: true }).click();
    const dialog = page.getByRole('dialog'); await dialog.getByLabel('Code').fill(`P9F${run.slice(-5)}`); await dialog.getByLabel('Name').fill(name); await dialog.getByLabel('City').fill('Testville');
    await dialog.getByRole('button', { name: 'Create Customer' }).click(); await page.waitForTimeout(1200);
    t.check('the dialog stays open', await dialog.isVisible());
    const said = `${await dialog.innerText()} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`;
    t.check('an error is shown', /could not|failed|error|try again/i.test(said), said.slice(0, 200));
    t.check('the entries are kept', (await dialog.getByLabel('Name').inputValue()) === name && (await dialog.getByLabel('City').inputValue()) === 'Testville');
    t.check('nothing reached the database', (await prisma.organization.count({ where: { name } })) === 0);
    t.check('no page error', page.errors.length === 0, page.errors[0]);
  });

  for (const [route, opener, field, find, label] of [['/shipping', 'New shipment', 'Order number', 'Find order', 'shipment'], ['/orders/returns', 'New return', 'Sales order number', 'Find order', 'return'], ['/material-tracking/packages', 'Open a package', 'Order number', 'Find order', 'package']]) {
    await sc('FORM', `a new ${label} for an order number that is not on file says so and creates nothing`, async (t) => {
      const c = await ctx(boss); const page = await open(c, route);
      await page.getByRole('button', { name: opener, exact: true }).first().click();
      const dialog = page.getByRole('dialog'); await dialog.getByLabel(field).fill('SO-NOT-ON-FILE');
      await dialog.getByRole('button', { name: find }).click();
      t.check('it says the order is not on file', await until(async () => /not on file|not found|no (sales |open )?order|could not find/i.test(await dialog.innerText()), 8000), (await dialog.innerText()).slice(0, 200));
      t.check('the create button stays off', await dialog.getByRole('button', { name: new RegExp(`^(Create shipment|Open return|Open package)$`) }).isDisabled());
      t.check('nothing was saved', good(page).length === 0, JSON.stringify(page.writes));
    });
  }

  await sc('FORM', 'a new heat: the save button comes on only when the required entries are in', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/heats');
    await page.getByRole('button', { name: 'Add Heat', exact: true }).click();
    const dialog = page.getByRole('dialog'); const save = dialog.getByRole('button', { name: /^Add heat$/ });
    t.check('off when empty', await save.isDisabled());
    await dialog.getByLabel(/Heat number/).fill(`P9H-${run}`);
    t.check('still off with only the number', await save.isDisabled());
    const required = await dialog.locator('input[required]').count();
    t.check('the required fields are marked', required >= 2, required);
    await page.keyboard.press('Escape');
    t.check('nothing saved', (await prisma.heat.count({ where: { heatNumber: `P9H-${run}` } })) === 0);
  });

  await sc('FORM', 'a new purchase order: lines can be added and removed, and a line with no quantity cannot be saved', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/purchase-orders');
    await page.getByRole('button', { name: 'New purchase order', exact: true }).click();
    const dialog = page.getByRole('dialog'); const lines = () => dialog.getByLabel(/^Description/).count();
    const one = await lines(); await dialog.getByRole('button', { name: 'Add line' }).click();
    t.check('Add line adds a line', (await lines()) === one + 1, `${one} ${await lines()}`);
    await dialog.getByRole('button', { name: /Remove line/ }).last().click();
    t.check('Remove line takes it away', (await lines()) === one);
    await dialog.getByLabel(/^Description/).first().fill('QA P9 plate');
    t.check('saving stays off without a supplier, a quantity and a price', await dialog.getByRole('button', { name: /^Save as draft$/ }).isDisabled());
    t.check('nothing was saved', good(page).length === 0);
  });

  await sc('FORM', 'order entry: leaving with an order half typed asks first, and Stay keeps every entry', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/orders/intake');
    await page.getByLabel('PO Number').fill(`P9-PO-${run}`);
    await page.getByRole('link', { name: 'Orders' }).first().click();
    const ask = page.locator('[data-testid="unsaved-work-dialog"]');
    t.check('a question appears', await shown(ask, 5000));
    t.check('it says the order would be lost', /not been saved/.test(await text(page, '[data-testid="unsaved-work-dialog"]')));
    await page.locator('[data-testid="unsaved-stay"]').click();
    t.check('Stay keeps the page', pathOf(page) === '/orders/intake');
    t.check('and the entry', (await page.getByLabel('PO Number').inputValue()) === `P9-PO-${run}`);
  });

  await sc('FORM', 'order entry: choosing to leave does leave, and an untouched form never asks', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/orders/intake');
    await page.getByLabel('PO Number').fill('P9-LEAVE');
    await page.getByRole('link', { name: 'Orders' }).first().click();
    await page.locator('[data-testid="unsaved-leave"]').click(); await until(() => pathOf(page) === '/orders');
    t.check('Leave goes to the page asked for', pathOf(page) === '/orders', pathOf(page));
    const p2 = await open(c, '/orders/intake'); await p2.getByLabel('PO Number').waitFor();
    await p2.getByRole('link', { name: 'Orders' }).first().click(); await until(() => pathOf(p2) === '/orders', 5000);
    t.check('an untouched form leaves without a question', pathOf(p2) === '/orders' && !(await p2.locator('[data-testid="unsaved-work-dialog"]').isVisible().catch(() => false)), pathOf(p2));
    t.check('no order was created by any of it', (await prisma.order.count({ where: { poReference: 'P9-LEAVE' } })) === 0);
  });

  await sc('FORM', 'order entry: closing or reloading the tab with an order half typed brings the browser warning', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/orders/intake'); let warned = 0;
    page.on('dialog', async (d) => { if (d.type() === 'beforeunload') warned += 1; await d.dismiss().catch(() => {}); });
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByLabel('PO Number').waitFor();
    t.check('an untouched form reloads with no warning', warned === 0, warned);
    await page.getByLabel('PO Number').fill('P9-RELOAD'); await page.getByLabel('PO Number').press('Tab');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 4000 }).catch(() => {});
    t.check('a typed form warns before reload', warned === 1, warned);
    t.check('staying keeps the entry', (await page.getByLabel('PO Number').inputValue().catch(() => '')) === 'P9-RELOAD');
  });

  await sc('FORM', 'a button on a sample screen says it is not built and sends nothing', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/qaqc');
    const all = await page.locator('main button:visible').all(); let pressed = '';
    for (const b of all) { const name = ((await b.innerText()) || '').trim(); if (!name || /Refresh|Go to|rows per page/i.test(name)) continue; await b.click({ trial: false }).catch(() => {}); if (await page.locator('[data-testid="not-built-notice"]').isVisible().catch(() => false)) { pressed = name; break; } if (await page.getByRole('dialog').count()) await page.keyboard.press('Escape'); }
    t.check('a button answered with the notice', Boolean(pressed), `${all.length} buttons tried`);
    const said = await text(page, '[data-testid="not-built-notice"]');
    t.check('the notice names the button and says nothing was saved', said.includes(pressed.split('\n')[0]) && /not built yet/.test(said) && /Nothing was saved/.test(said), said);
    t.check('the screen says it is a sample', /Sample screen|sample/i.test(await text(page, 'main')));
    t.check('nothing was sent', page.writes.length === 0, JSON.stringify(page.writes));
  });

  await sc('FORM', 'Print on an order sends the order to the printer and the menu is left off the paper', async (t) => {
    const o = await B.order([B.line(75)]);
    const c = await ctx(clerk); await c.addInitScript(() => { window.__printed = 0; window.print = () => { window.__printed += 1; }; });
    const page = await open(c, `/orders/${o.id}`); await has(page, o.orderNumber);
    await page.getByRole('button', { name: /^Print/ }).first().click();
    t.check('the browser was asked to print once', (await page.evaluate(() => window.__printed)) === 1);
    await page.emulateMedia({ media: 'print' });
    t.check('the menu is not printed', !(await page.locator('nav[aria-label="Main menu"]').first().isVisible()));
    t.check('the search and account bar are not printed', !(await page.locator('[data-testid="global-search"]').isVisible()));
    t.check('the order number is printed', (await page.locator('main h1').first().isVisible()) && (await text(page, 'main h1')).includes(o.orderNumber));
    t.check('the Print button itself is not printed', !(await page.getByRole('button', { name: /^Print/ }).first().isVisible()));
  });

  await sc('FORM', 'a new user with a malformed email or a short password is refused and not created', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/admin/users');
    await page.getByRole('button', { name: 'Add User', exact: true }).click();
    const dialog = page.getByRole('dialog'); const email = `p9-bad-${run}`;
    await dialog.getByLabel(/First Name/).fill('QA'); await dialog.getByLabel(/Last Name/).fill('P9 bad'); await dialog.getByLabel(/^Email/).fill(email); await dialog.locator('input[type="password"]').first().fill('x');
    await dialog.getByRole('button', { name: 'Create User' }).click(); await page.waitForTimeout(1200);
    t.check('the dialog stays open', await dialog.isVisible());
    const said = `${await dialog.innerText()} ${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')}`;
    t.check('it says what is wrong', /email|password|valid|required|role/i.test(said) && (await dialog.locator('.Mui-error, [aria-invalid="true"], [role="alert"]').count()) + (await page.locator('[role="alert"]').count()) > 0, said.slice(0, 200));
    t.check('no user was created', (await prisma.user.count({ where: { email: { startsWith: email } } })) === 0);
  });

  await sc('FORM', 'a request for quote typed in the dialog is saved once and appears in the list', async (t) => {
    const c = await ctx(clerk); const page = await open(c, '/sales/rfq-inbox'); const what = `QA P9 plate ${run}`;
    await page.getByRole('button', { name: 'New RFQ', exact: true }).click();
    const dialog = page.getByRole('dialog'); const customer = dialog.getByLabel('Customer').first();
    await customer.fill(w.custA.name.slice(0, 8)); await page.getByRole('option').first().waitFor(); await page.getByRole('option', { name: new RegExp(w.custA.name) }).first().click();
    await dialog.getByLabel('Line 1: what they need').fill(what); await dialog.getByLabel('Quantity').first().fill('12');
    const save = dialog.getByRole('button', { name: 'Save RFQ' });
    t.check('the save button comes on', await until(() => save.isEnabled(), 4000));
    await save.dblclick().catch(() => {});
    t.check('the dialog closes or the request opens', await until(async () => !(await dialog.isVisible().catch(() => false)) || pathOf(page) !== '/sales/rfq-inbox', 10000));
    const posts = good(page).filter((x) => x.method === 'POST');
    t.check('one request was saved', posts.length === 1, JSON.stringify(page.writes));
    const saved = await until(async () => { const n = await prisma.rFQLine.count({ where: { OR: [{ description: what }, { notes: what }, { materialCode: what }] } }).catch(() => -1); return n !== 0 ? n : null; }, 5000);
    t.check('exactly one request line with that text is in the database', saved === 1, saved);
  });
  await sc('FORM', 'deactivating a user asks in the application\'s own box, and Cancel changes nothing', async (t) => {
    const admin = await prisma.user.findFirst({ where: { email: 'qa-admin@qa.test' } }); const email = `qa-p9-leaver-${run}@qa.test`;
    const leaver = await prisma.user.create({ data: { email, passwordHash: admin.passwordHash, firstName: 'QA', lastName: `Leaver ${run}`, role: 'VIEWER', organizationId: admin.organizationId } });
    const c = await ctx(boss); const page = await open(c, '/admin/users'); let native = 0; page.on('dialog', (d) => { native += 1; d.dismiss().catch(() => {}); });
    await page.locator('main').getByLabel('Search by name or email').fill(email); await settle(page, 900);
    const row = page.locator('main tbody tr', { hasText: email }); await row.getByRole('button', { name: 'More actions' }).click(); await page.getByRole('menuitem', { name: /Deactivate User/ }).click();
    const box = page.getByTestId('ask-dialog'); await box.waitFor({ timeout: 5000 }).catch(() => {});
    t.check('the question is the application\'s own box, not the browser\'s', native === 0 && await box.isVisible(), `${native} browser boxes`);
    t.check('it names the person and what will happen', (await box.innerText().catch(() => '')).includes(`Leaver ${run}`) && /sign in/i.test(await box.innerText().catch(() => '')));
    const before = page.writes.length; await page.getByTestId('ask-cancel').click(); await settle(page, 600);
    t.check('Cancel sends nothing and the user stays active', page.writes.length === before && (await prisma.user.findUnique({ where: { id: leaver.id } })).isActive !== false, `${page.writes.length - before} writes`);
    await row.getByRole('button', { name: 'More actions' }).click(); await page.getByRole('menuitem', { name: /Deactivate User/ }).click(); await page.getByTestId('ask-confirm').click(); await settle(page, 1200);
    const after = await prisma.user.findUnique({ where: { id: leaver.id } });
    t.check('Deactivate is sent once and the user can no longer sign in', page.writes.length === before + 1 && (!after || after.isActive === false), `${page.writes.length - before} writes; active ${after ? after.isActive : 'removed'}`);
    await c.close();
  });

  await sc('FORM', 'a sample form that used to announce a save now says nothing was saved', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/maintenance/pm-schedules'); let native = 0; page.on('dialog', (d) => { native += 1; d.dismiss().catch(() => {}); });
    await page.getByRole('button', { name: 'New PM Schedule' }).click(); const dialog = page.getByRole('dialog'); await dialog.waitFor();
    const before = page.writes.length; await dialog.getByRole('button', { name: 'Create Schedule' }).click(); await settle(page, 700);
    const notice = await page.getByTestId('not-built-notice').innerText().catch(() => '');
    t.check('no browser box claims a schedule was created', native === 0, `${native} browser boxes`);
    t.check('the notice says it is not built and nothing was saved', /not built/i.test(notice) && /nothing was saved/i.test(notice), notice);
    t.check('nothing was sent to the server', page.writes.length === before);
    await c.close();
  });
};
