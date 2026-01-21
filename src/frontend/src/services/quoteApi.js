const BASE_URL = '/api/v1';

export async function createQuote(payload) {
  const res = await fetch(`${BASE_URL}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create quote');
  }
  return res.json();
}

export async function getQuote(id) {
  const res = await fetch(`${BASE_URL}/quotes/${id}`);
  if (!res.ok) {
    throw new Error('Failed to get quote');
  }
  return res.json();
}

export async function acceptQuote(id, payload = {}) {
  const res = await fetch(`${BASE_URL}/quotes/${id}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to accept quote');
  }
  return res.json();
}

export async function listQuotes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${BASE_URL}/quotes?${query}` : `${BASE_URL}/quotes`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to list quotes');
  }
  return res.json();
}

export default {
  createQuote,
  getQuote,
  acceptQuote,
  listQuotes
};
