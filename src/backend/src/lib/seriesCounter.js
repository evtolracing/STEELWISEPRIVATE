// The database counter behind document numbers that may skip but never repeat: orders, shipments,
// quotes, requests for quote, jobs, work orders, inspections, transfers (Phase 11, Z-003).
// One row per series in "DocumentCounter", under a key that starts with "SEQ:" so it can never be
// mistaken for the invoice and credit memo series (INV, CM) or the drop tag series, which are kept
// in the same table and are advanced inside the save that uses them.
import prisma from './db.js';

export const dbSeriesCounter = {
  /**
   * The next number of the series. One statement, committed at once: nobody waits for anybody's save.
   * `seed` is asked for the number of documents already written only the first time a series is used.
   */
  async take(series, seed) {
    let rows = await prisma.$queryRaw`
      UPDATE "DocumentCounter" SET "lastNumber" = "lastNumber" + 1, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "series" = ${series} RETURNING "lastNumber"`;
    if (!rows.length) {
      const start = Math.max(0, Math.trunc(Number(await seed()) || 0)) + 1;
      rows = await prisma.$queryRaw`
        INSERT INTO "DocumentCounter" ("series", "lastNumber", "updatedAt") VALUES (${series}, ${start}, CURRENT_TIMESTAMP)
        ON CONFLICT ("series") DO UPDATE SET "lastNumber" = "DocumentCounter"."lastNumber" + 1, "updatedAt" = CURRENT_TIMESTAMP
        RETURNING "lastNumber"`;
    }
    return Number(rows[0].lastNumber);
  },
  /** Moves the series ahead, past numbers that are already on documents. */
  async advance(series, by) {
    await prisma.$executeRaw`UPDATE "DocumentCounter" SET "lastNumber" = "lastNumber" + ${Math.max(1, Math.trunc(by))}, "updatedAt" = CURRENT_TIMESTAMP WHERE "series" = ${series}`;
  },
};
