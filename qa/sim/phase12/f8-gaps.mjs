// Group 8: evidence gaps closed. Findings that earlier phases marked fixed on a code reading alone are
// exercised here for the first time. The two that need a server process of their own (E-010 shutdown,
// M-013 and AA-001 with no database) are in qa/tools/phase12-process.mjs; M-009 is in the browser check.
export default async function run(c) {
  const { W, G12, hq, prisma, branch, P, err } = c;
  const G = G12.gaps; const coo = hq('COO', 0) || hq('EXECUTIVE', 0);
  const m = (id, purpose, over = {}) => ({ id, purpose, role: 'as named', ui: 'none: API', ...over });

  await W(G, 'Gap B-007: an executive decision is recorded under the signed-in person, whatever the request claims', m('GP-01', 'Executive decision create reads no identity from the request', { api: 'POST /api/executive/decisions' }), async (ok, x) => {
    const r = await coo.post('/api/executive/decisions', { title: 'P12 decision', type: 'PRICING', description: 'synthetic', decisionMaker: 'Somebody Else', role: 'SUPER_ADMIN', id: 'forged-id', createdAt: '2001-01-01T00:00:00Z', status: 'IMPLEMENTED' });
    x.note(`answered ${r.status}: ${JSON.stringify(r.body).slice(0, 240)}`);
    ok('it is recorded', r.status === 201, `${r.status} ${err(r)}`);
    if (r.status === 201) {
      ok('the maker is the signed-in person', r.body.decisionMaker !== 'Somebody Else' && String(r.body.decisionMaker || '').length > 0, r.body.decisionMaker);
      ok('the role is the signed-in person\'s role', r.body.role === coo.user.role, r.body.role);
      ok('the id and the date are the server\'s, not the request\'s', r.body.id !== 'forged-id' && !String(r.body.createdAt || r.body.timestamp || '').startsWith('2001'), `${r.body.id} ${r.body.createdAt || r.body.timestamp}`);
    }
    const b = await branch('MEDIUM', 40); const no = await P.seller(b).post('/api/executive/decisions', { title: 'x' });
    ok('a sales representative cannot record one', no.status === 403, no.status);
  });

  await W(G, 'Gap E-023: the operations cockpit answers within the proposed limit with 80 branches of data', m('GP-02', 'Operations cockpit at volume', { api: 'GET /api/ops-cockpit', ui: 'Operations > Cockpit' }), async (ok, x) => {
    const counts = { orders: await prisma.order.count(), jobs: await prisma.job.count(), coils: await prisma.coil.count(), shipments: await prisma.shipment.count() };
    const times = []; let last;
    for (let i = 0; i < 7; i++) { const t = Date.now(); last = await coo.get('/api/ops-cockpit'); times.push(Date.now() - t); }
    times.sort((a, b2) => a - b2);
    x.note(`records: ${JSON.stringify(counts)}; seven reads took ${times.join(', ')} ms; answer ${(JSON.stringify(last.body).length / 1024).toFixed(0)} KB`);
    ok('it answers', last.status === 200, last.status);
    ok('the median read is under 2 seconds (proposed limit for a dashboard; not approved)', times[3] < 2000, `${times[3]} ms`);
    ok('the slowest read is under 5 seconds', times[6] < 5000, `${times[6]} ms`);
    ok('the answer is a summary, not every record: under 1 MB', JSON.stringify(last.body).length < 1024 * 1024, `${(JSON.stringify(last.body).length / 1024).toFixed(0)} KB`);
  });

  await W(G, 'Gap: a document over the upload size limit is refused cleanly, and a stored one downloads byte for byte', m('GP-03', 'Upload size limit', { api: 'POST /api/documents/upload' }), async (ok, x) => {
    const b = await branch('MEDIUM', 41); const who = P.csr(b) || P.seller(b);
    const send = async (bytes) => { const fd = new FormData(); fd.append('file', new Blob([Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(bytes, 0x20), Buffer.from('\n%%EOF\n')])], { type: 'application/pdf' }), 'p12-size.pdf'); fd.append('type', 'MTR'); const r = await fetch(`${c.BASE}/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${who.token}` }, body: fd }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
    const small = await send(200 * 1024); const big = await send(26 * 1024 * 1024);
    x.note(`200 KB answered ${small.status}; 26 MB answered ${big.status} ${JSON.stringify(big.body).slice(0, 120)}`);
    ok('a 200 KB PDF is accepted', small.status === 201, `${small.status} ${JSON.stringify(small.body).slice(0, 120)}`);
    ok('a 26 MB PDF, over the 25 MB limit of a self-hosted server, is refused as too large and not as a server error', big.status === 413 || big.status === 400, big.status);
    const id = small.body.id || small.body.document?.id;
    const dl = await fetch(`${c.BASE}/api/documents/${id}/download`, { headers: { authorization: `Bearer ${who.token}` } }); const bytes = Buffer.from(await dl.arrayBuffer());
    const want = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(200 * 1024, 0x20), Buffer.from('\n%%EOF\n')]);
    ok('the stored file downloads byte for byte on this server', dl.status === 200 && bytes.equals(want), `${dl.status} ${bytes.length} of ${want.length} bytes`);
    x.note('the hosted site has a lower limit (4 MB) and its own file store: D-011b, a hosted upload downloading byte for byte, can only be checked on the host and stays NOT VERIFIED');
  });
}
