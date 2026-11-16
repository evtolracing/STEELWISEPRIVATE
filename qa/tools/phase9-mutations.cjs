#!/usr/bin/env node
// Phase 9: proof that the UI scenarios catch the fixes. Each fix is taken out of the source, the
// named scenario is run, and the source is put back. A mutation "holds" when the scenario then fails.
//   DATABASE_URL=...steelwise_qa node qa/tools/phase9-mutations.cjs [--only 3]
// Needs the screens on 5199 (vite, which reloads the changed file) and the QA server on 3001.
const fs = require('node:fs'); const path = require('node:path'); const { execFileSync, spawn, execSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..'); const F = (p) => path.join(root, 'src/frontend/src', p); const Bk = (p) => path.join(root, 'src/backend/src', p);
const only = (() => { const i = process.argv.indexOf('--only'); return i > -1 ? process.argv[i + 1].split(',') : null; })();
const M = [
  ['a double click on Dispatch now no longer cancels', F('pages/Shipping/ShipmentPage.jsx'), [['disabled={!confirm || busy} onClick={dispatch}', 'onClick={dispatch}'], ['disabled={!confirm || busy} onClick={cancel}', 'onClick={cancel}'], [/asking === 'dispatch'/g, "confirm === 'dispatch'"]], 'Dispatch asks first'],
  ['the order page shows the money on file', F('pages/Orders/OrderDetailPage.jsx'), [['stored={editing ? undefined : order}', 'stored={undefined}']], 'an order page shows the number'],
  ['the order page names the customer', F('pages/Orders/OrderDetailPage.jsx'), [["{(order.buyer?.name || order.customerName) && <Typography", '{false && <Typography']], 'an order page shows the number'],
  ['the order list search narrows', Bk('routes/orders.js'), [['...(search && { OR: [{ orderNumber: like }, { poReference: like }, { buyer: { name: like } }] }),', '']], 'search: nothing found says what to try', true],
  ['each role starts at its workspace', F('config/roleAccess.js'), [['return start && canAccessPath(role, start) ? start : homeFor(role)', 'return homeFor(role)']], 'a sales representative signs in'],
  ['a wrong address says Page not found', F('router/AppRouter.jsx'), [['element: <NotFoundPage />,', 'element: <Navigate to="/" replace />,']], 'an address that is not a page'],
  ['unsaved order entry asks before leaving', F('components/common/UnsavedWorkGuard.jsx'), [['Boolean(when) && currentLocation.pathname !== nextLocation.pathname', 'false']], 'leaving with an order half typed'],
  ['the tab warns before reload', F('components/common/UnsavedWorkGuard.jsx'), [["window.addEventListener('beforeunload', warn)", 'void warn']], 'closing or reloading the tab'],
  ['the phone menu is a menu landmark', F('components/layout/Sidebar.jsx'), [["        variant=\"temporary\"\n        open={mobileOpen}\n        onClose={onMobileClose}\n        PaperProps={{ component: 'nav', 'aria-label': 'Main menu' }}", "        variant=\"temporary\"\n        open={mobileOpen}\n        onClose={onMobileClose}"]], 'on a phone the menu is a drawer'],
  ['every control shows a focus ring', F('theme/index.js'), [["'body *:focus-visible, body .Mui-focusVisible': { outline: `${tokens.focusRing} !important`, outlineOffset: '2px !important' },", '']], 'the keyboard’s place is always visible'],
  ['rows open from the keyboard', F('utils/activateOnKey.js'), [['event.currentTarget.click()', 'void 0']], 'a stock item opens from its row with the keyboard'],
  ['an unreadable customer answer is a failure, not a crash', F('pages/Customers/CustomersPage.jsx'), [["if (!list) throw new Error('Failed to load customers')\n      setCustomers(list)", 'setCustomers(json.data)']], '/customers: when there is nothing to list'],
  ['search offers a role only its own pages', F('components/layout/GlobalSearch.jsx'), [['searchPages(q, (path) => canAccessPath(role, path))', 'searchPages(q, () => true)']], 'search shows a role only'],
  ['every page has its own title', F('components/layout/AppLayout.jsx'), [['if (document.title !== title) document.title = title', 'void title']], 'every page has its own browser title'],
  ['the shop floor starts at the person’s branch', F('apps/shopfloor/WorkCenterSelectPage.jsx'), [['(locsData.find((l) => l.id === home) || locsData[0]).id', 'locsData[0].id']], 'the shop floor lists the work centres'],
  ['required fields say so', F('pages/Customers/CustomersPage.jsx'), [['label="Code" required', 'label="Code *"']], 'a form tells a screen reader'],
  ['the way back cannot leave the app', F('pages/Auth/LoginPage.jsx'), [["/^\\/(?!\\/)/.test(n) && !n.startsWith('/login') && n !== '/' ? n : null", 'n || null']], 'the way back after sign-in cannot be pointed'],
  ['an ended session keeps the way back', F('api/client.js'), [['/login?expired=1${here', '/login?x=1${here']], 'the session ends in the middle of work'],
  ['a sample button says it is not built', F('utils/notBuilt.js'), [['window.dispatchEvent(new CustomEvent(NOT_BUILT_EVENT, { detail: { label } }))', 'void label']], 'a button on a sample screen says'],
  ['the menu is left off the paper', F('theme/index.js'), [["'.MuiDrawer-root, .MuiAppBar-root, .skip-link, .no-print, .MuiSnackbar-root, nav': { display: 'none !important' },", '']], 'Print on an order'],
  ['less motion when asked', F('theme/index.js'), [["'*, *::before, *::after': { animationDuration: '0.01ms !important', animationIterationCount: '1 !important', transitionDuration: '0.01ms !important', scrollBehavior: 'auto !important' },", '']], 'a person who asks for less motion'],
  ['web shop preferences are not asked on staff screens', F('contexts/CustomerSessionContext.jsx'), [['if (!wanted || !session.customerId) return', 'if (!session.customerId) return']], 'a long round of 24 screens', false, 'skip'],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const restartServer = async () => { try { execSync("kill $(lsof -ti tcp:3001 -sTCP:LISTEN)", { stdio: 'ignore', shell: '/bin/bash' }); } catch (e) { /* not running */ } await sleep(1500); spawn('bash', ['-c', `PORT=3001 nohup ${root}/qa/tools/start-qa-server.sh > /tmp/qa3001.log 2>&1 &`], { detached: true, stdio: 'ignore' }).unref(); for (let i = 0; i < 40; i += 1) { await sleep(500); try { execSync('curl -sf localhost:3001/api/health -o /dev/null || curl -s localhost:3001/api/auth/me -o /dev/null', { stdio: 'ignore', shell: '/bin/bash' }); return; } catch (e) { /* wait */ } } };
(async () => {
  const out = [];
  for (let i = 0; i < M.length; i += 1) {
    const [what, file, edits, match, backend, skip] = M[i]; if (only && !only.includes(String(i + 1))) continue; if (skip) continue;
    const before = fs.readFileSync(file, 'utf8'); let text = before; let applied = 0;
    for (const [a, b] of edits) { const next = typeof a === 'string' ? text.split(a).join(b) : text.replace(a, b); if (next !== text) applied += 1; text = next; }
    if (!applied) { out.push({ n: i + 1, what, result: 'NOT APPLIED: the text to remove was not found' }); console.log(`${i + 1}. ${what}: NOT APPLIED`); continue; }
    fs.writeFileSync(file, text); let result = '';
    try { if (backend) await restartServer(); else await sleep(2500);
      let log = ''; try { log = execFileSync('node', ['qa/sim/phase9-ui.cjs', '--match', match], { cwd: root, env: process.env, maxBuffer: 64 * 1024 * 1024, timeout: 400000 }).toString(); } catch (e) { log = (e.stdout || '').toString(); }
      const m = log.match(/(\d+) of (\d+) passed, (\d+) failed/); const first = (log.split('\n').find((l) => l.startsWith('✗')) || '').split('  — ')[1] || '';
      result = !m ? 'DID NOT RUN' : Number(m[2]) === 0 ? 'NO SCENARIO MATCHED' : Number(m[3]) > 0 ? `HOLDS: ${m[3]} of ${m[2]} fail (${first.slice(0, 110)})` : `DOES NOT HOLD: ${m[2]} of ${m[2]} still pass`;
    } finally { fs.writeFileSync(file, before); if (backend) await restartServer(); else await sleep(1500); }
    out.push({ n: i + 1, what, scenario: match, result }); console.log(`${i + 1}. ${what}: ${result}`);
  }
  if (!only) fs.writeFileSync(path.join(root, 'qa/results/phase9-mutations.json'), JSON.stringify({ at: new Date().toISOString(), mutations: out }, null, 1));
})();
