/**
 * Duplicate-request protection (finding C-006).
 *
 * A changing request may carry an `Idempotency-Key` header. The first request with a key
 * runs. A repeat with the same key by the same user on the same route does not run again:
 *   - it gets the first answer back (with `Idempotency-Replayed: true`) once that is saved;
 *   - it gets 409 while the first is still running;
 *   - it gets 422 if the body differs from the first one.
 * Only a success (2xx) is kept. A refusal or a failure clears the key, so the same request
 * can be sent again after the cause is fixed. Requests with no header behave as before.
 *
 * The key is claimed with a unique index, so two copies arriving at the same instant cannot
 * both run, whichever server instance each one reaches.
 */
import crypto from 'node:crypto';
import prisma from '../lib/db.js';

const CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const STALE_MS = 60_000; // a claim older than this with no answer was abandoned (the instance died)
const KEEP_MS = 24 * 60 * 60 * 1000;

export const bodyHashOf = (body) => crypto.createHash('sha256').update(JSON.stringify(body ?? null)).digest('hex');
export const validKey = (key) => typeof key === 'string' && /^[\x21-\x7e]{8,200}$/.test(key);

export async function requestKeys(req, res, next) {
  const key = req.get('Idempotency-Key');
  if (!key || !CHANGING.has(req.method) || !prisma) return next();
  if (!validKey(key)) return res.status(400).json({ error: 'Idempotency-Key must be 8 to 200 printable characters with no spaces' });

  const scope = `${req.user?.id || req.user?.userId || 'anonymous'} ${req.method} ${req.originalUrl.split('?')[0]}`;
  const bodyHash = bodyHashOf(req.body);
  let row;
  try {
    row = await prisma.requestKey.create({ data: { scope, key, bodyHash } });
  } catch (error) {
    if (error?.code !== 'P2002') { console.error(`[requestKeys] ${req.id || '-'} could not claim a key: ${error?.message}`); return next(); }
    const first = await prisma.requestKey.findUnique({ where: { scope_key: { scope, key } } });
    if (!first) return res.status(409).json({ error: 'The same request was just sent. Try again in a moment.' });
    if (first.bodyHash !== bodyHash) return res.status(422).json({ error: 'This request key was already used for a different request.' });
    if (first.status === 'DONE') {
      res.set('Idempotency-Replayed', 'true');
      return res.status(first.responseStatus || 200).json(first.responseBody);
    }
    if (Date.now() - new Date(first.createdAt).getTime() < STALE_MS) {
      return res.status(409).json({ error: 'The same request is still being processed. Wait a moment before trying again.' });
    }
    // The first attempt never answered. Take the claim over, once.
    const taken = await prisma.requestKey.updateMany({ where: { id: first.id, status: 'IN_PROGRESS', createdAt: first.createdAt }, data: { createdAt: new Date() } });
    if (taken.count !== 1) return res.status(409).json({ error: 'The same request is still being processed. Wait a moment before trying again.' });
    row = first;
  }

  // Keep the answer before it is sent, so a repeat that arrives right after sees it.
  const send = res.json.bind(res);
  let settled = false;
  res.json = (body) => {
    if (settled) return send(body);
    settled = true;
    const ok = res.statusCode >= 200 && res.statusCode < 300;
    const save = ok
      ? prisma.requestKey.update({ where: { id: row.id }, data: { status: 'DONE', responseStatus: res.statusCode, responseBody: body ?? null } })
      : prisma.requestKey.deleteMany({ where: { id: row.id } });
    save.catch((error) => console.error(`[requestKeys] ${req.id || '-'} could not save the answer: ${error?.message}`)).finally(() => send(body));
    return res;
  };
  // An answer that did not go through res.json (a file, an empty 204, a dropped connection) is not kept.
  res.on('close', () => { if (!settled) prisma.requestKey.deleteMany({ where: { id: row.id, status: 'IN_PROGRESS' } }).catch(() => {}); });

  if (Math.random() < 0.01) prisma.requestKey.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP_MS) } } }).catch(() => {});
  next();
}
