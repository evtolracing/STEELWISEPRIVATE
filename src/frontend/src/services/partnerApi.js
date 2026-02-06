/**
 * Partner API Service
 * Frontend API client for Partner Management admin UI.
 */

import client from '../api/client.js';

const BASE = '/api/v1/admin/partners';

// ─── Partner CRUD ──────────────────────────────────────────────────────────────

export const getPartners = (params = {}) =>
  client.get(BASE, { params }).then(r => r.data);

export const getPartner = (id) =>
  client.get(`${BASE}/${id}`).then(r => r.data);

export const createPartner = (data) =>
  client.post(BASE, data).then(r => r.data);

export const updatePartner = (id, data) =>
  client.put(`${BASE}/${id}`, data).then(r => r.data);

// ─── API Keys ──────────────────────────────────────────────────────────────────

export const createApiKey = (partnerId, data) =>
  client.post(`${BASE}/${partnerId}/keys`, data).then(r => r.data);

export const revokeApiKey = (partnerId, keyId, reason) =>
  client.delete(`${BASE}/${partnerId}/keys/${keyId}`, { data: { reason } }).then(r => r.data);

// ─── Usage & Logs ──────────────────────────────────────────────────────────────

export const getPartnerUsage = (partnerId, days = 30) =>
  client.get(`${BASE}/${partnerId}/usage`, { params: { days } }).then(r => r.data);

export const getPartnerLogs = (partnerId, params = {}) =>
  client.get(`${BASE}/${partnerId}/logs`, { params }).then(r => r.data);

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export const getPartnerDashboard = () =>
  client.get(`${BASE}/dashboard/summary`).then(r => r.data);
