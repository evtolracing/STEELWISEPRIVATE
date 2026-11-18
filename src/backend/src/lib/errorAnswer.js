/**
 * Phase 10 (Y-023): errors that are the caller's, not the server's. Express and its body parser mark
 * them with a 4xx status before any route runs: a body too large, a body that is not JSON, and an
 * address whose percent signs do not decode. They are answered as such, with a sentence and the
 * request id; anything else is a server error and is logged by the caller.
 * Returns { status, body } for a caller's error, or null.
 */
export function clientErrorAnswer(err, requestId = null) {
  if (err?.type === 'entity.too.large') return { status: 413, body: { error: 'Request body too large', requestId } };
  if (err?.type === 'entity.parse.failed') return { status: 400, body: { error: 'Invalid JSON body', requestId } };
  if (err instanceof URIError && (err.status === 400 || err.statusCode === 400)) {
    return { status: 400, body: { error: 'The address is not valid: it has a % that is not followed by two hexadecimal digits.', code: 'BAD_ADDRESS', requestId } };
  }
  return null;
}
