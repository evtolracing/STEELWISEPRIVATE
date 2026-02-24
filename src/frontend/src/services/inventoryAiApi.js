/**
 * Inventory AI Assistant API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const V1_BASE = `${API_BASE}/v1/inventory`;

/**
 * Ask the inventory AI assistant a question
 * @param {Object} payload - { query, context?, user? }
 * @returns {Promise<{ answer, actions, supportingData }>}
 */
export async function askInventoryAssistant(payload) {
  const response = await fetch(`${V1_BASE}/ai-assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: payload.query,
      context: payload.context || {},
      user: payload.user || { id: 'anonymous', role: 'operator' },
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get AI response');
  }
  
  return response.json();
}
