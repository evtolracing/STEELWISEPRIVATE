const BASE_URL = '/api/v1';

export async function createOrder(payload) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create order');
  }
  return res.json();
}

export async function getOrder(id) {
  const res = await fetch(`${BASE_URL}/orders/${id}`);
  if (!res.ok) {
    throw new Error('Failed to get order');
  }
  return res.json();
}

export async function listOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${BASE_URL}/orders?${query}` : `${BASE_URL}/orders`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to list orders');
  }
  return res.json();
}

export async function planOrder(id) {
  const res = await fetch(`${BASE_URL}/orders/${id}/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to plan order');
  }
  return res.json();
}

export async function markOrderPackaging(id) {
  const res = await fetch(`${BASE_URL}/orders/${id}/mark-packaging`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to mark order for packaging');
  }
  return res.json();
}

export async function getOrderJobs(orderId) {
  const res = await fetch(`${BASE_URL}/jobs?orderId=${orderId}`);
  if (!res.ok) {
    throw new Error('Failed to get order jobs');
  }
  return res.json();
}

export default {
  createOrder,
  getOrder,
  listOrders,
  planOrder,
  markOrderPackaging,
  getOrderJobs
};
