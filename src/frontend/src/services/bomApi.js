/**
 * BOM Recipes API Service
 */

const API_BASE = '/api';

export const bomApi = {
  /**
   * Get list of BOM recipes with optional filters
   */
  async getBomRecipes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE}/v1/bom/recipes${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch BOM recipes: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Get single BOM recipe by ID
   */
  async getBomRecipeById(id) {
    const response = await fetch(`${API_BASE}/v1/bom/recipes/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch BOM recipe: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Create new BOM recipe
   */
  async createBomRecipe(payload) {
    const response = await fetch(`${API_BASE}/v1/bom/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create BOM recipe');
    }
    return response.json();
  },

  /**
   * Update existing BOM recipe
   */
  async updateBomRecipe(id, payload) {
    const response = await fetch(`${API_BASE}/v1/bom/recipes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update BOM recipe');
    }
    return response.json();
  },

  /**
   * Activate a BOM recipe (set status to ACTIVE)
   */
  async activateBomRecipe(id) {
    const response = await fetch(`${API_BASE}/v1/bom/recipes/${id}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to activate BOM recipe');
    }
    return response.json();
  },

  /**
   * Transition a BOM recipe to a new status
   */
  async transitionBomRecipe(id, targetStatus) {
    const response = await fetch(`${API_BASE}/v1/bom/recipes/${id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStatus }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to transition BOM recipe');
    }
    return response.json();
  },

  /**
   * Clone an existing BOM recipe
   */
  async cloneBomRecipe(id) {
    const response = await fetch(`${API_BASE}/v1/bom/recipes/${id}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Failed to clone BOM recipe');
    }
    return response.json();
  },

  /**
   * Find best matching recipe for given material/job criteria
   */
  async matchBomRecipe(criteria) {
    const response = await fetch(`${API_BASE}/v1/bom/recipes/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria),
    });
    if (!response.ok) {
      throw new Error('Failed to match BOM recipe');
    }
    return response.json();
  },

  /**
   * Get AI-suggested recipe structure from text description
   */
  async suggestBomFromDescription(payload) {
    const response = await fetch(`${API_BASE}/v1/bom/ai-suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Failed to get AI suggestion');
    }
    return response.json();
  },
};
