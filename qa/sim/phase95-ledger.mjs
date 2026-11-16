// Phase 9.5 ledger scenarios: the double-entry books behind sales, payments, stock, work orders,
// transfers, periods, cutover, reports, permissions and recovery.
// Every scenario drives the real server the way the screens do, then reads the database to check the
// journal: which accounts moved, by how much, that the entry balances, and that the books still agree
// with the business records. A success answer alone is never counted as a pass.
//   node qa/sim/phase95-ledger.mjs [--base http://localhost:3011] [--group 3]
// Local QA database only (lib.mjs refuses anything else). The scenarios empty the ledger tables of the
// QA database first, so they start from "never activated", and they record a synthetic accountant's
// approval that exists only in this test data. No real payment is taken and nothing is sent anywhere.
import fs from 'node:fs';
import { finish } from './phase4-lib.mjs';
import * as ctx from './phase95/ctx.mjs';
import before from './phase95/g0-before.mjs';
import sales from './phase95/g1-sales.mjs';
import money from './phase95/g2-money.mjs';
import stock from './phase95/g3-stock.mjs';
import shop from './phase95/g4-shop.mjs';
import moves from './phase95/g5-moves.mjs';
import books from './phase95/g6-books.mjs';
import guard from './phase95/g7-guard.mjs';

const OUT = ctx.arg('out', 'qa/results/phase95-ledger.json');
const state = await before(ctx);
for (const group of [sales, money, stock, shop, moves, books, guard]) await group(ctx, state);
const failed = finish('Phase 9.5 ledger', OUT, fs);
await ctx.prisma.$disconnect();
process.exit(failed ? 1 : 0);
