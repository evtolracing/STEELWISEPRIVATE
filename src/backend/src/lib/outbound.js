/**
 * Calls to services outside this server (speech, AI providers, partner webhooks).
 *
 * Every outside call goes through here so that each one has:
 *   - a time limit, after which the call is abandoned;
 *   - a bounded number of tries, with a growing, jittered wait between them. Only a call
 *     the caller marks as safe to repeat is tried again, and only on a failure that can
 *     pass (no answer, 408, 429, 5xx). A 4xx is the caller's mistake and is never repeated;
 *   - a breaker: after several failures in a row the service is left alone for a while, so a
 *     provider that is down costs one quick refusal instead of a slow wait on every request;
 *   - counters that the integration health report reads.
 *
 * The breaker and the counters live in this server instance. On a host that runs several
 * instances each keeps its own; that is a stated limit, not a guarantee across instances.
 *
 * Never call this while a database transaction is open: a slow provider would hold locks.
 */

const envMs = (name, fallback) => { const n = Number(process.env[name]); return Number.isFinite(n) && n > 0 ? n : fallback; };
export const DEFAULTS = { timeoutMs: 15_000, tries: 1, baseDelayMs: 300, maxDelayMs: 4_000, breakerAfter: 5, breakerRestMs: envMs('OUTBOUND_BREAKER_REST_MS', 30_000) };

export class OutboundError extends Error {
  constructor(message, { kind, service, status = null, tries = 1 } = {}) {
    super(message);
    this.name = 'OutboundError';
    this.kind = kind; // TIMEOUT | NETWORK | HTTP | BREAKER_OPEN
    this.service = service;
    this.status = status;
    this.tries = tries;
  }
}

const services = new Map();
const blank = () => ({ calls: 0, ok: 0, failed: 0, timeouts: 0, retries: 0, refusedByBreaker: 0, failuresInARow: 0, openUntil: 0, lastOkAt: null, lastFailureAt: null, lastFailure: null, totalMs: 0 });
const stateOf = (service) => { if (!services.has(service)) services.set(service, blank()); return services.get(service); };

/** Whether a failed answer may pass if the same call is made again. */
export const mayPass = (status) => status === 408 || status === 429 || (status >= 500 && status <= 599);

/** Wait before try number `attempt` (2 is the first repeat): doubling, capped, with jitter. */
export function waitBefore(attempt, { baseDelayMs = DEFAULTS.baseDelayMs, maxDelayMs = DEFAULTS.maxDelayMs, random = Math.random } = {}) {
  const full = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt - 2));
  return Math.round(full / 2 + (full / 2) * random());
}

export function breakerState(service, now = Date.now()) {
  const s = stateOf(service);
  if (s.openUntil > now) return 'OPEN';
  return s.failuresInARow > 0 ? 'RECOVERING' : 'CLOSED';
}

function noteFailure(s, text, options, now) {
  s.failed += 1; s.failuresInARow += 1; s.lastFailureAt = new Date(now).toISOString(); s.lastFailure = String(text).slice(0, 200);
  if (s.failuresInARow >= (options.breakerAfter ?? DEFAULTS.breakerAfter)) s.openUntil = now + (options.breakerRestMs ?? DEFAULTS.breakerRestMs);
}
function noteOk(s, now) { s.ok += 1; s.failuresInARow = 0; s.openUntil = 0; s.lastOkAt = new Date(now).toISOString(); }

/**
 * Run `fn(signal)` under the rules above. `fn` must pass `signal` to whatever it calls and
 * either return a value or throw. An error with a numeric `.status` is treated as an HTTP answer.
 *   options: { timeoutMs, tries, repeatable, baseDelayMs, maxDelayMs, breakerAfter, breakerRestMs, sleep, now }
 */
export async function guarded(service, fn, options = {}) {
  const s = stateOf(service);
  const now = options.now || Date.now;
  const sleep = options.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const timeoutMs = options.timeoutMs ?? DEFAULTS.timeoutMs;
  const tries = options.repeatable ? Math.max(1, Math.min(options.tries ?? DEFAULTS.tries, 5)) : 1;
  if (s.openUntil > now()) {
    s.refusedByBreaker += 1;
    throw new OutboundError(`${service} is not answering. It will be tried again shortly.`, { kind: 'BREAKER_OPEN', service, tries: 0 });
  }
  let last;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    if (attempt > 1) { s.retries += 1; await sleep(waitBefore(attempt, options)); }
    const started = now();
    s.calls += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const value = await Promise.race([
        fn(controller.signal),
        new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(Object.assign(new Error('timed out'), { name: 'TimeoutError' })))),
      ]);
      s.totalMs += now() - started;
      noteOk(s, now());
      return value;
    } catch (error) {
      s.totalMs += now() - started;
      const timedOut = controller.signal.aborted || error?.name === 'TimeoutError' || error?.name === 'AbortError';
      const status = Number.isInteger(error?.status) ? error.status : null;
      if (timedOut) s.timeouts += 1;
      // A 4xx (other than "slow down" and "took too long") is an answer: the provider is up.
      if (status && !mayPass(status)) {
        noteOk(s, now());
        throw new OutboundError(error.message || `${service} refused the request (${status})`, { kind: 'HTTP', service, status, tries: attempt });
      }
      const kind = timedOut ? 'TIMEOUT' : status ? 'HTTP' : 'NETWORK';
      last = new OutboundError(timedOut ? `${service} did not answer within ${Math.round(timeoutMs / 1000)} seconds` : (status ? `${service} answered ${status}` : `${service} could not be reached`), { kind, service, status, tries: attempt });
      noteFailure(s, `${kind}${status ? ` ${status}` : ''}`, options, now());
      if (s.openUntil > now()) break;
    } finally {
      clearTimeout(timer);
    }
  }
  throw last;
}

/** fetch under the rules above. Resolves with the Response when it is 2xx; throws OutboundError otherwise. */
export function callOut(service, url, init = {}, options = {}) {
  return guarded(service, async (signal) => {
    const response = await fetch(url, { ...init, signal, redirect: options.redirect || 'follow' });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw Object.assign(new Error(`${service} answered ${response.status}`), { status: response.status, body: body.slice(0, 1000) });
    }
    return response;
  }, options);
}

/** Counters for the integration health report. No addresses, keys or payloads. */
export function outboundStats(now = Date.now()) {
  return [...services.entries()].map(([service, s]) => ({
    service, state: breakerState(service, now), calls: s.calls, ok: s.ok, failed: s.failed, timeouts: s.timeouts, retries: s.retries,
    refusedByBreaker: s.refusedByBreaker, averageMs: s.calls ? Math.round(s.totalMs / s.calls) : null,
    lastOkAt: s.lastOkAt, lastFailureAt: s.lastFailureAt, lastFailure: s.lastFailure,
  }));
}

export function resetOutbound(service) { if (service) services.delete(service); else services.clear(); }

/**
 * What to answer our own caller when an outside service failed. Never the provider's own
 * status (a provider's 401 is not the user's 401) and never its message, which can name keys.
 */
export function outsideFailure(error, what = 'The outside service') {
  if (!(error instanceof OutboundError)) {
    if (/no ai provider|not configured|no fallback provider/i.test(String(error?.message))) return { status: 503, error: `${what} is not set up on this server.` };
    return null;
  }
  if (error.kind === 'TIMEOUT') return { status: 504, error: `${what} took too long to answer. Try again.` };
  if (error.kind === 'BREAKER_OPEN') return { status: 503, error: `${what} is not answering right now. Try again in a minute.` };
  return { status: 502, error: `${what} could not answer.` };
}
