// Phase 11 measurement: what a burst of sign-ins does to every other request on ONE server process.
//   node qa/sim/phase11/signin-burst.mjs --base http://localhost:3111 [--people 24]
// Prints the time the health check and a small read took while the burst ran. Nothing is changed.
import * as ctx from '../phase10/ctx.mjs';
const N = Number(ctx.arg('people', '24'));
const emails = (await ctx.prisma.user.findMany({ where: { email: { startsWith: 'p11-' }, isActive: true }, select: { email: true }, take: N })).map((u) => u.email);
const admin = await ctx.tokenOf('admin');
const ms = { health: [], read: [], signIn: [] }; let failed = 0; let going = true;
const watch = (async () => { while (going) { let t = performance.now(); await ctx.http1('GET', '/api/health/live').catch(() => { failed += 1; }); ms.health.push(performance.now() - t); t = performance.now(); await ctx.http1('GET', '/api/grades?limit=5', { token: admin }).catch(() => { failed += 1; }); ms.read.push(performance.now() - t); await ctx.sleep(20); } })();
await ctx.sleep(200);
const ROUNDS = Number(ctx.arg('rounds', '8')); let burst = 0;
for (let k = 0; k < ROUNDS; k++) {
  const t0 = performance.now();
  await Promise.all(emails.map(async (email) => { const t = performance.now(); const r = await ctx.signIn(email); ms.signIn.push(performance.now() - t); if (!r.body?.token) failed += 1; }));
  burst += performance.now() - t0; await ctx.sleep(150);
}
going = false; await watch;
const pct = (a, p) => { const x = [...a].sort((m, n) => m - n); return +x[Math.min(x.length - 1, Math.ceil((p / 100) * x.length) - 1)].toFixed(0); };
const max = (a) => +Math.max(0, ...a).toFixed(0);
console.log(JSON.stringify({ people: emails.length, rounds: ROUNDS, burstMsEach: +(burst / ROUNDS).toFixed(0), health: { checks: ms.health.length, p50: pct(ms.health, 50), p95: pct(ms.health, 95), max: max(ms.health), over1s: ms.health.filter((x) => x > 1000).length }, read: { p50: pct(ms.read, 50), p95: pct(ms.read, 95), max: max(ms.read), over1s: ms.read.filter((x) => x > 1000).length }, signIn: { p50: pct(ms.signIn, 50), p95: pct(ms.signIn, 95), max: max(ms.signIn) }, failed }));
await ctx.closeDb(); await ctx.prisma.$disconnect(); process.exit(0);
