// Password and key checks, a few at a time (Phase 11, Z-004).
//
// A password check is deliberately slow work for the processor, and this server does it on the same
// thread that answers every other request. The library gives the thread back between slices of up to
// a tenth of a second, so with twenty-four people signing in at the same moment every other request
// on this server process (a screen, a save, the host's "are you alive" check) waited for a slice of
// each of them: measured on one process, the health check went unanswered for over 1.5 seconds and
// 768 requests were turned away as "no server". Checks now take turns, two at a time: nobody is
// refused, a sign-in in a burst waits a little longer, and everything else keeps answering.
import bcrypt from 'bcryptjs';

/** Runs at most `max` of the given tasks at once; the rest wait their turn in order. */
export function limiter(max) {
  let running = 0; const waiting = [];
  const next = () => { if (running < max && waiting.length) { running += 1; waiting.shift()(); } };
  const run = (task) => new Promise((resolve, reject) => {
    const free = () => { running -= 1; next(); };
    waiting.push(() => Promise.resolve().then(task).then((v) => { free(); resolve(v); }, (e) => { free(); reject(e); }));
    next();
  });
  run.stats = () => ({ running, waiting: waiting.length });
  return run;
}

const AT_ONCE = Math.max(1, Number(process.env.PASSWORD_CHECKS_AT_ONCE) || 2);
const turn = limiter(AT_ONCE);

export const checkPassword = (plain, hash) => turn(() => bcrypt.compare(String(plain ?? ''), hash));
export const hashPassword = (plain, rounds = 10) => turn(() => bcrypt.hash(plain, rounds));
export const passwordQueue = () => turn.stats();
