// src/services/aiConsoleApi.js
/**
 * AI Operations Assistant API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function askOpsAssistant({ role, query, context = {} }) {
  try {
    const response = await fetch(`${API_BASE}/v1/ai/ops-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, query, context }),
    });
    
    if (!response.ok) {
      // Fallback to chat endpoint if ops-assistant not available
      return askChatFallback({ role, query, context });
    }
    
    return response.json();
  } catch (error) {
    console.warn('AI ops-assistant API unavailable, using fallback');
    return askChatFallback({ role, query, context });
  }
}

async function askChatFallback({ role, query, context }) {
  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        systemPrompt: `You are an industrial operations AI assistant helping a ${role} at an Alro-style metals/plastics service center. Location: ${context.locationId || 'FWA'}. Division: ${context.division || 'ALL'}. Be concise, action-oriented, and focus on operational insights.`,
      }),
    });
    
    if (!response.ok) {
      return notConnected();
    }
    
    const data = await response.json();
    return {
      answer: data.response || data.answer || data.message,
      suggestedActions: [],
    };
  } catch (error) {
    return notConnected();
  }
}

// No assistant is connected. Say so; never invent an answer or a figure.
function notConnected() {
  return { answer: 'The assistant is not connected, so there is no answer. Use the figures on this dashboard and the screens they open.', suggestedActions: [], unavailable: true };
}
