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
export async function createNumbered({ count, format, create, attempts = 40 }) {
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
export async function retryOverlap(run, attempts = 6) {
  for (let i = 0; ; i++) {
    try {
      return await run();
    } catch (error) {
      if (error?.code !== 'P2034' || i >= attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, 15 * (i + 1) + Math.random() * 20));
    }
  }
}
