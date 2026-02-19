/**
 * Print Queue API Service
 * Frontend client for the automated print queue
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Fetch pending print jobs from the queue
 */
export async function getPrintQueue() {
  const res = await fetch(`${API_BASE}/print-queue`);
  if (!res.ok) throw new Error('Failed to fetch print queue');
  return res.json();
}

/**
 * Confirm a print job was printed (removes from pending)
 */
export async function confirmPrinted(printJobId) {
  const res = await fetch(`${API_BASE}/print-queue/${printJobId}/printed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to confirm print');
  return res.json();
}

/**
 * Skip a print job (dismiss without printing)
 */
export async function skipPrintJob(printJobId, reason = '') {
  const res = await fetch(`${API_BASE}/print-queue/${printJobId}/skip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to skip print job');
  return res.json();
}

/**
 * Get the render URL for a print job (opens in new tab for browser printing)
 */
export function getRenderUrl(printJobId) {
  return `${API_BASE}/print-queue/${printJobId}/render`;
}

/**
 * Open the print dialog for a tag in a new window
 */
export function openPrintWindow(printJobId) {
  const url = getRenderUrl(printJobId);
  const win = window.open(url, `print-${printJobId}`, 'width=700,height=900,toolbar=0,menubar=0');
  return win;
}

/**
 * Manually trigger a print job for a job (by jobNumber or jobId)
 * Set force: true to bypass dedup and always create a new print job
 */
export async function triggerPrintJob(data) {
  const res = await fetch(`${API_BASE}/print-queue/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to trigger print job');
  }
  return res.json();
}

/**
 * Reprint a previously printed or skipped job from history
 */
export async function reprintJob(printJobId) {
  const res = await fetch(`${API_BASE}/print-queue/${printJobId}/reprint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reprint');
  }
  return res.json();
}

/**
 * Fetch print queue history
 */
export async function getPrintQueueHistory(limit = 50) {
  const res = await fetch(`${API_BASE}/print-queue/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch print history');
  return res.json();
}

export default {
  getPrintQueue,
  confirmPrinted,
  skipPrintJob,
  getRenderUrl,
  openPrintWindow,
  triggerPrintJob,
  reprintJob,
  getPrintQueueHistory,
};
