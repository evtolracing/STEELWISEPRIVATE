/**
 * Creates a record that needs the next number in a series (SO-00042, SHP-00007).
 * Numbers come from the row count, so two people saving at once can pick the
 * same one; when the database rejects the duplicate we try the next number.
 */
export async function createNumbered({ count, format, create, attempts = 25 }) {
  let n = (await count()) + 1;
  for (let i = 0; i < attempts; i++, n++) {
    try {
      return await create(format(n));
    } catch (error) {
      // P2034: the database asked us to retry a transaction that overlapped another.
      if (error?.code === 'P2034') { n--; continue; }
      if (error?.code !== 'P2002') throw error;
      // Jump ahead a little so a burst of simultaneous saves spreads out.
      if (i > 2) n += Math.floor(Math.random() * 5);
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
