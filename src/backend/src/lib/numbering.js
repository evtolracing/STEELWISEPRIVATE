import { acrossBranches } from './branchScope.js';

/**
 * Creates a record that needs the next number in a series (SO-00042, SHP-00007).
 * Numbers come from the row count, so two people saving at once can pick the
 * same one; when the database rejects the duplicate we try another number.
 *
 * Two things make a plain "try the next one" run out of attempts: eighty branches saving
 * in the same instant all start from the same count, and a series that has had rows deleted
 * has a count that lags behind its highest number. So after a few collisions the search
 * widens: it waits a random moment, counts again, and steps ahead by a random distance that
 * doubles each time. A series can therefore skip numbers; it never repeats one, because the
 * database's unique rule on the number is what decides.
 */
/**
 * Where the next number of a series comes from (Phase 11, Z-003). The server registers the database
 * counter at start-up (src/lib/seriesCounter.js); with none registered (unit tests, a script) the
 * count-and-search below is used, as before.
 *
 * Counting rows worked, but not at the size of eighty branches on several server processes: every
 * save counted the whole table, then several saves picked the same number and all but one were
 * refused by the database and run again. Measured on a day of 545 customer jobs: 3,380 refused
 * shipment saves and 2,548 refused order saves. With a counter each save is handed its own number
 * in one short statement that is committed at once, so no two saves hold the same number and no
 * save waits for another to finish. A number handed out to a save that then fails is not reused:
 * these series may skip numbers and never repeat one, exactly as before. (Invoice and credit memo
 * numbers are different: they are never skipped, and are taken inside the save in billing.js.)
 */
let seriesCounter = null;
export function useSeriesCounter(counter) { seriesCounter = counter; }
/** SO-00000 -> "SEQ:SO-". A format with a year in it (MO-2026-0000) is a series of its own each year. */
export const seriesOf = (format) => `SEQ:${String(format(0)).replace(/\d+$/, '')}`;
const NUMBER_FIELD = /number|code|externalorderid/i;

async function createFromCounter({ counter, count, format, create, attempts }) {
  const series = seriesOf(format);
  for (let i = 0; i < attempts; i++) {
    let n;
    // If the counter cannot be read, the save is not lost: it is numbered the old way.
    try { n = await counter.take(series, () => acrossBranches(count)); } catch { return { fallBack: true }; }
    try {
      return { made: await create(format(n)) };
    } catch (error) {
      if (error?.code === 'P2034') continue;
      if (error?.code !== 'P2002') throw error;
      // The number is on a document written before the counter existed (the old search skipped
      // ahead by up to 512). Step the counter past it, further each time, and take the next.
      const target = String(error?.meta?.target ?? '');
      if (i >= 1 && (!target || NUMBER_FIELD.test(target))) await counter.advance(series, Math.min(2 ** (i - 1), 512)).catch(() => {});
    }
  }
  throw new Error('Could not assign a unique number');
}

export async function createNumbered({ count, format, create, attempts = 40, counter = seriesCounter }) {
  if (counter) {
    const out = await createFromCounter({ counter, count, format, create, attempts });
    if (!out.fallBack) return out.made;
  }
  // The series is company-wide, so the count ignores the branch boundary.
  let n = (await acrossBranches(count)) + 1;
  for (let i = 0; i < attempts; i++) {
    try {
      return await create(format(n));
    } catch (error) {
      // P2034: the database asked us to retry a transaction that overlapped another.
      if (error?.code === 'P2034') continue;
      if (error?.code !== 'P2002') throw error;
      if (i < 2) { n++; continue; }
      await new Promise((r) => setTimeout(r, Math.random() * 4 * i));
      const reach = Math.min(2 ** (i - 1), 512);
      n = Math.max(n + 1, (await acrossBranches(count)) + 1) + Math.floor(Math.random() * reach);
    }
  }
  throw new Error('Could not assign a unique number');
}

export const padded = (prefix, width = 5) => (n) => `${prefix}-${String(n).padStart(width, '0')}`;

/** Runs a transaction again when the database reports it overlapped another one. */
/**
 * True when the database says a transaction overlapped another one and should be run again.
 * A statement sent as raw SQL reports this differently (P2010 carrying the database's own code:
 * 40001 could not serialize, 40P01 deadlock) from one sent through the client (P2034). Both are
 * the same event. Before Phase 8 only the second was recognised, so a document number taken at
 * the same moment as another failed instead of waiting its turn (N-022). A third form, with no code,
 * is recognised below (N-029).
 */
export function isOverlap(error) {
  if (error?.busy === true) return true;
  if (error?.code === 'P2034') return true;
  if (error?.code === 'P2010' && ['40001', '40P01'].includes(String(error?.meta?.code || ''))) return true;
  // A deadlock met by one of the client's own statements comes back with no code at all, only the
  // database's words (N-029): an order cancelled at the moment its shipment was dispatched answered 500.
  return error?.name === 'PrismaClientUnknownRequestError' && /code: "(40001|40P01)"/.test(String(error?.message || ''));
}

/**
 * What a caller is told when a save overlapped others every time it was tried (Phase 11, Z-005).
 * Nothing was saved. Before, each route decided for itself, and most answered "500 Failed to ...":
 * with forty-eight jobs in flight on three server processes, two returns being received were shown a
 * server error for what is only "busy, send it again". The error carries `refuse` and `status`, the
 * form every route already turns into an answer, so the answer is 409 with the code BUSY everywhere.
 */
export const BUSY_MESSAGE = 'Another change was being saved at the same moment. Nothing was saved; please try again.';
export class Busy extends Error {
  constructor(cause) { super(BUSY_MESSAGE); this.name = 'Busy'; this.status = 409; this.refuse = true; this.code = 'BUSY'; this.busy = true; this.cause = cause; }
}

export async function retryOverlap(run, attempts = 6) {
  for (let i = 0; ; i++) {
    try {
      return await run();
    } catch (error) {
      if (!isOverlap(error)) throw error;
      if (i >= attempts - 1) throw error.busy ? error : new Busy(error);
      await new Promise((r) => setTimeout(r, 15 * (i + 1) + Math.random() * 20));
    }
  }
}
