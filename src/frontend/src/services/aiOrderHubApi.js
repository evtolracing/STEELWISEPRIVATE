const AI_BASE_URL = '/api/v1/ai';
const INGEST_BASE_URL = '/api/v1/ingest';

export async function parseEmailRfq(payload) {
  const res = await fetch(`${AI_BASE_URL}/parse-email-rfq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to parse email');
  }
  return res.json();
}

export async function quoteAssistant(payload) {
  const res = await fetch(`${AI_BASE_URL}/quote-assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get quote suggestions');
  }
  return res.json();
}

/**
 * Ingest raw email and create RFQ in one step
 * For n8n and automation workflows
 */
export async function ingestEmailRfq(payload) {
  const res = await fetch(`${INGEST_BASE_URL}/email-rfq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to ingest email RFQ');
  }
  return res.json();
}

export default {
  parseEmailRfq,
  quoteAssistant,
  ingestEmailRfq
};
