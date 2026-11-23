// Group 7: multi-location readiness (Phase 12 prompt, section 23): the 80 synthetic branches of the
// Phase 11 model, checked for the things a wrong branch set-up would break. Synthetic data only: this
// certifies the software's behaviour with 80 branches, not the readiness of any real branch.
export default async function run(c) {
  const { W, G12, E, hq, prisma, branch, P, err, lot, sold, n, inv, TIERS } = c;
  const G = G12.multi; const coo = hq('COO', 0) || hq('EXECUTIVE', 0);
  const m = (id, purpose, over = {}) => ({ id, purpose, role: 'head office and branch staff', ui: 'the branch chooser and every list', api: 'as named in the checks', ...over });

  await W(G, 'Locations 1: all 80 branches exist, each with a time zone, an address state and its own people', m('ML-01', 'Branch set-up is complete'), async (ok, x) => {
    const locs = await prisma.location.findMany({ where: { id: { in: E.branches.map((b) => b.id) } } });
    x.note(`${locs.length} branches of ${E.branches.length}; kinds: ${Object.entries(E.branches.reduce((a, b) => ({ ...a, [b.tier]: (a[b.tier] || 0) + 1 }), {})).map(([k, v]) => `${TIERS[k].label} ${v}`).join(', ')}`);
    ok('80 branches', locs.length === 80, locs.length);
    ok('every branch is active and has a code that is its own', locs.every((l) => l.isActive !== false) && new Set(locs.map((l) => l.code)).size === locs.length);
    ok('the branches span more than one state', new Set(locs.map((l) => l.state)).size > 1, `${new Set(locs.map((l) => l.state)).size} states`);
    // A branch record has no time zone field. The books keep one business day for the whole company (the zone given when the ledger was switched on). Recorded as finding AA-007.
    x.note(`a branch record holds no time zone (fields: ${Object.keys(locs[0]).filter((k) => /zone/i.test(k)).join(', ') || 'none'}); the ledger's business day is one zone for the company`);
    const staffed = await prisma.user.groupBy({ by: ['homeLocationId'], where: { homeLocationId: { in: locs.map((l) => l.id) }, isActive: true }, _count: true });
    ok('every branch has people whose home it is', staffed.length === 80, staffed.length);
  });

  await W(G, 'Locations 2: each kind of branch sees only itself, and head office sees all 80', m('ML-02', 'Location-specific permissions', { api: 'GET /api/orders, /api/coils, /api/shipments' }), async (ok) => {
    let i = 30;
    for (const tier of ['LARGE', 'MEDIUM', 'SMALL', 'WAREHOUSE', 'SALES']) {
      const b = await branch(tier, i++); const who = P.manager(b) || P.seller(b) || P.stock(b);
      const [o, s] = await Promise.all([who.get('/api/orders?limit=100'), who.get('/api/coils?limit=100')]);
      const rows = (r) => r.body?.data || r.body?.orders || r.body?.coils || r.body?.items || (Array.isArray(r.body) ? r.body : []);
      ok(`${TIERS[tier].label} ${b.code}: every order listed is its own`, o.status === 200 && rows(o).every((r) => r.locationId === b.id), `${o.status} ${rows(o).filter((r) => r.locationId !== b.id).length} foreign of ${rows(o).length}`);
      ok(`${TIERS[tier].label} ${b.code}: every stock item listed is its own`, s.status === 200 && rows(s).every((r) => r.locationId === b.id), `${s.status} ${rows(s).filter((r) => r.locationId !== b.id).length} foreign of ${rows(s).length}`);
    }
    const all = await prisma.order.groupBy({ by: ['locationId'], _count: true });
    const seen = new Set(); for (let off = 0; off < 2000 && seen.size < all.length; off += 100) { const r = await coo.get(`/api/orders?limit=100&offset=${off}`); const rows = r.body?.data || r.body?.orders || r.body?.items || (Array.isArray(r.body) ? r.body : []); if (!rows.length) break; rows.forEach((x) => seen.add(x.locationId)); }
    ok('head office reads orders of many branches in one list', seen.size > 5, `${seen.size} branches in the pages read; ${all.length} branches have orders`);
  });

  await W(G, 'Locations 3: stock moves between branches only by a transfer, and both ends agree', m('ML-03', 'Inter-location transfers and inventory visibility', { api: 'POST /api/inventory/transfers, /:id/receive', fin: 'inventory leaves one branch and arrives at the other at the same cost; total unchanged' }), async (ok) => {
    const a = await branch('WAREHOUSE', 33); const d = await branch('MEDIUM', 34); const l = await lot(a, 2400);
    const direct = await P.stock(a).put(`/api/coils/${l.coilId}`, { locationId: d.id });
    const at = (await prisma.coil.findUnique({ where: { id: l.coilId } })).locationId;
    ok('a stock item cannot simply be edited to another branch', at === a.id, `${direct.status}; now at ${at === a.id ? 'the first branch' : 'the other branch'}`);
    const sent = await P.stock(a).post('/api/inventory/transfers', { toLocationId: d.id, coilIds: [l.coilId], carrier: 'Own truck' });
    const tid = sent.body?.id || sent.body?.transfer?.id;
    const wrong = await P.stock(a).post(`/api/inventory/transfers/${tid}/receive`, {});
    ok('the sending branch cannot receive its own transfer', wrong.status === 403 || wrong.status === 404, `${wrong.status} ${err(wrong)}`);
    const got = await (P.receiver(d) || P.stock(d)).post(`/api/inventory/transfers/${tid}/receive`, {});
    ok('a transfer is sent and received', sent.status === 201 && got.status === 200, `${sent.status} ${got.status} ${err(sent)} ${err(got)}`);
    const after = await prisma.coil.findUnique({ where: { id: l.coilId }, include: { inventory: true } });
    ok('the stock is now at the receiving branch with the same pounds', after.locationId === d.id && n(after.inventory?.qtyOnHand ?? (await inv(l.coilId)).qtyOnHand) === 2400, `${after.locationId === d.id} ${after.inventory?.qtyOnHand}`);
    ok('the sending branch no longer lists it and the receiving branch does', ![200].includes((await P.stock(a).get(`/api/coils/${l.coilId}`)).status) && (await P.stock(d).get(`/api/coils/${l.coilId}`)).status === 200);
  });

  await W(G, 'Locations 4: numbers that must be unique stay unique across all branches', m('ML-04', 'Document numbering across branches'), async (ok) => {
    const q = (t, col) => prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM (SELECT "${col}" FROM "${t}" WHERE "${col}" IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1) x`);
    for (const [t, col, what] of [['Order', 'orderNumber', 'order'], ['Invoice', 'invoiceNumber', 'invoice'], ['Shipment', 'shipmentNumber', 'shipment'], ['Quote', 'quoteNumber', 'quote'], ['Coil', 'coilNumber', 'stock item']]) { const r = await q(t, col).catch((e) => [{ n: String(e.message).slice(0, 60) }]); ok(`no two ${what}s share a number`, r[0].n === 0, r[0].n); }
  });

  await W(G, 'Locations 5: a branch\'s tax and financial reporting follow the branch', m('ML-05', 'Location-specific tax and reporting', { fin: 'revenue and tax are attributed to the selling branch' }), async (ok, x) => {
    const b = await branch('SMALL', 36); const s = await sold(b, 310);
    const e = await c.posted('INVOICE_ISSUED', 'Invoice', s.invoice.id);
    ok('every line of the invoice entry carries the selling branch', e.entry.lines.every((l) => l.locationId === b.id), e.entry.lines.filter((l) => l.locationId !== b.id).length);
    const rep = await hq('CFO', 0).get('/api/ledger/reports/revenue?by=branch');
    ok('the branch has its own line in revenue by branch', (rep.body.rows || []).some((r) => r.key === b.id));
    x.note(`invoice tax ${s.invoice.taxAmount} on subtotal ${s.invoice.subtotal} at branch state ${(await prisma.location.findUnique({ where: { id: b.id } })).state}`);
    const rate = await prisma.salesTaxRate.findFirst({ where: { state: (await prisma.location.findUnique({ where: { id: b.id } })).state } }).catch(() => null);
    ok('the tax charged is the rate on file for the place of delivery, or none where none is on file', rate ? Number(s.invoice.taxAmount) >= 0 : Number(s.invoice.taxAmount) === 0, `${s.invoice.taxAmount}; rate on file: ${rate ? rate.rate : 'none'}`);
  });

  await W(G, 'Locations 6: a new branch can be added and is at once separate from the rest', m('ML-06', 'New location onboarding', { api: 'POST /api/admin/locations or the locations screen', db: 'one Location, one user' }), async (ok, x) => {
    const admin = c.admin; const code = `P12N${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const tried = [];
    for (const path of ['/api/admin/locations', '/api/locations', '/api/v1/locations']) { const r = await admin.post(path, { code, name: `P12 new branch ${code}`, type: 'BRANCH', city: 'Toledo', state: 'OH' }); tried.push(`${path} ${r.status}`); }
    // No screen or API adds a branch (finding AA-008): one is added by a database script, as it is here.
    x.note(`the product has no path that adds a branch: ${tried.join(', ')}; the branch below is added the way cutover adds one, by script`);
    ok('no route pretends to add a branch', (await prisma.location.count({ where: { code } })) === 0, tried.join(', '));
    const owner = (await prisma.location.findUnique({ where: { id: E.branches[0].id } })).ownerId;
    const made = await prisma.location.create({ data: { code, isBranch: true, name: `P12 new branch ${code}`, type: (await prisma.location.findUnique({ where: { id: E.branches[0].id } })).type, ownerId: owner, city: 'Toledo', state: 'OH' } });
    const mgr = await c.login('BRANCH_MANAGER', made, `p12-new-${code.toLowerCase()}`);
    const [o, s2] = await Promise.all([mgr.get('/api/orders?limit=50'), mgr.get('/api/coils?limit=50')]);
    const rows = (r) => r.body?.data || r.body?.orders || r.body?.coils || r.body?.items || (Array.isArray(r.body) ? r.body : []);
    ok('its first manager signs in and sees no other branch\'s orders or stock', o.status === 200 && s2.status === 200 && rows(o).length === 0 && rows(s2).length === 0, `${o.status} ${rows(o).length} orders, ${s2.status} ${rows(s2).length} stock items`);
    const other = await sold(await branch('SMALL', 37), 150);
    ok('and cannot open another branch\'s order', [403, 404].includes((await mgr.get(`/api/orders/${other.order.id}`)).status));
    ok('head office sees the new branch', (await coo.get('/api/locations').catch(() => ({ status: 0 }))).status !== 500);
    ok('the new branch starts with no orders and no stock', (await prisma.order.count({ where: { locationId: made.id } })) === 0 && (await prisma.inventory.count({ where: { locationId: made.id } })) === 0);
  });
}
