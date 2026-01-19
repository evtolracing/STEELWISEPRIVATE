// src/services/aiConsoleApi.js
/**
 * AI Operations Assistant API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
      return getMockResponse({ role, query, context });
    }
    
    const data = await response.json();
    return {
      answer: data.response || data.answer || data.message,
      suggestedActions: [],
    };
  } catch (error) {
    return getMockResponse({ role, query, context });
  }
}

// Mock response for demo/fallback
function getMockResponse({ role, query, context }) {
  const roleResponses = {
    CEO: `Based on current operations at ${context.locationId || 'all locations'}, key metrics are: Utilization at 85%, SLA compliance at 94%, Margin at 28.5%. Focus areas: Saw Line 1 bottleneck, 2 low-margin orders flagged.`,
    VP_OPERATIONS: `Operations summary for ${context.locationId || 'enterprise'}: 18 jobs in process, 4 HOT priority, 2 capacity alerts. Saw Line 1 at 94% utilization - recommend load balancing to Saw Line 2.`,
    BRANCH_MANAGER: `Branch ${context.locationId || 'FWA'} status: 25 shipments today (5 staged, 8 ready, 12 dispatched). 2 late-risk orders. Inventory alerts: SS-304 critical, HR-A36 low.`,
    SCHEDULER: `Schedule analysis: Today's load 87.5%, Tomorrow 79.2%. 4 HOT jobs need priority sequencing. Recommend: Move JOB-2026-009 to SAW-02 to avoid bottleneck.`,
    OPERATOR: `Your work center status: 3 jobs queued, next job JOB-2026-004 (aluminum plate cut). Estimated completion for current job: 25 minutes.`,
  };
  
  return {
    answer: roleResponses[role] || `Analyzing "${query}" for ${role}... This is a simulated response. Connect to DeepSeek API for real AI insights.`,
    suggestedActions: [
      { label: 'View Details', action: 'navigate', target: '/ops-cockpit' },
      { label: 'Run Optimization', action: 'optimize', target: '/optimization' },
    ],
  };
}
