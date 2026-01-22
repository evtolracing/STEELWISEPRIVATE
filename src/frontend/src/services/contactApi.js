const BASE_URL = '/api/v1';

export async function createContact(payload) {
  const res = await fetch(`${BASE_URL}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create contact');
  }
  return res.json();
}

export async function searchContacts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${BASE_URL}/contacts?${query}` : `${BASE_URL}/contacts`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to search contacts');
  }
  return res.json();
}

export async function getContact(id) {
  const res = await fetch(`${BASE_URL}/contacts/${id}`);
  if (!res.ok) {
    throw new Error('Failed to get contact');
  }
  return res.json();
}

export default {
  createContact,
  searchContacts,
  getContact
};
