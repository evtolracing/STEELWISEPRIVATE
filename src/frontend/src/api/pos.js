/**
 * POS API Service
 * 
 * API client for POS workflow endpoints.
 */

const API_BASE = '/api/pos';

/**
 * Make an API request with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================
// SESSION API
// ============================================

export const posApi = {
  /**
   * Get workflow definition
   */
  async getWorkflowDefinition() {
    return request('/workflow/definition');
  },
  
  /**
   * Get all screen flows
   */
  async getFlows() {
    return request('/flows');
  },
  
  /**
   * Get screens for a specific flow
   */
  async getFlowScreens(flowId) {
    return request(`/flows/${flowId}/screens`);
  },
  
  // ========================================
  // Session Management
  // ========================================
  
  /**
   * Create a new POS session
   */
  async createSession(userId, entryPoint = 'WALK_IN_CUSTOMER') {
    return request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId, entryPoint })
    });
  },
  
  /**
   * Get session details
   */
  async getSession(sessionId) {
    return request(`/sessions/${sessionId}`);
  },
  
  /**
   * End a session
   */
  async endSession(sessionId) {
    return request(`/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  },
  
  // ========================================
  // Workflow Transitions
  // ========================================
  
  /**
   * Execute a state transition
   */
  async transition(sessionId, trigger, payload = {}) {
    return request(`/sessions/${sessionId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ trigger, payload })
    });
  },
  
  /**
   * Get available transitions
   */
  async getAvailableTransitions(sessionId) {
    return request(`/sessions/${sessionId}/transitions`);
  },
  
  // ========================================
  // Screen Navigation
  // ========================================
  
  /**
   * Get current screen
   */
  async getCurrentScreen(sessionId, flowId) {
    return request(`/sessions/${sessionId}/screen?flowId=${flowId}`);
  },
  
  /**
   * Navigate to next screen
   */
  async navigateNext(sessionId, flowId) {
    return request(`/sessions/${sessionId}/screen/next`, {
      method: 'POST',
      body: JSON.stringify({ flowId })
    });
  },
  
  /**
   * Navigate to previous screen
   */
  async navigatePrevious(sessionId, flowId) {
    return request(`/sessions/${sessionId}/screen/previous`, {
      method: 'POST',
      body: JSON.stringify({ flowId })
    });
  },
  
  /**
   * Get flow progress
   */
  async getProgress(sessionId, flowId) {
    return request(`/sessions/${sessionId}/progress?flowId=${flowId}`);
  },
  
  // ========================================
  // Customer Operations
  // ========================================
  
  /**
   * Search customers
   */
  async searchCustomers(sessionId, query) {
    return request(`/sessions/${sessionId}/customers/search`, {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },
  
  /**
   * Select a customer
   */
  async selectCustomer(sessionId, customerId) {
    return request(`/sessions/${sessionId}/customers/select`, {
      method: 'POST',
      body: JSON.stringify({ customerId })
    });
  },
  
  /**
   * Create a new customer
   */
  async createCustomer(sessionId, customerData) {
    return request(`/sessions/${sessionId}/customers`, {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  },
  
  // ========================================
  // Product Operations
  // ========================================
  
  /**
   * Search products
   */
  async searchProducts(sessionId, query, filters = {}) {
    return request(`/sessions/${sessionId}/products/search`, {
      method: 'POST',
      body: JSON.stringify({ query, filters })
    });
  },
  
  /**
   * Get product details
   */
  async getProductDetails(sessionId, productId) {
    return request(`/sessions/${sessionId}/products/${productId}`);
  },
  
  /**
   * Add product to order
   */
  async addProduct(sessionId, productData) {
    return request(`/sessions/${sessionId}/products`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },
  
  /**
   * Add processed item (with cutting/processing config)
   */
  async addProcessedItem(sessionId, productData, processingConfig) {
    return request(`/sessions/${sessionId}/processed-items`, {
      method: 'POST',
      body: JSON.stringify({ ...productData, processing: processingConfig })
    });
  },
  
  // ========================================
  // Line Operations
  // ========================================
  
  /**
   * Update a line item
   */
  async updateLine(sessionId, lineId, updates) {
    return request(`/sessions/${sessionId}/lines/${lineId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },
  
  /**
   * Remove a line item
   */
  async removeLine(sessionId, lineId) {
    return request(`/sessions/${sessionId}/lines/${lineId}`, {
      method: 'DELETE'
    });
  },
  
  // ========================================
  // Pricing Operations
  // ========================================
  
  /**
   * Get current pricing summary
   */
  async getPricing(sessionId) {
    return request(`/sessions/${sessionId}/pricing`);
  },
  
  /**
   * Calculate price for a line item
   */
  async calculatePrice(sessionId, lineData) {
    return request(`/sessions/${sessionId}/pricing/calculate`, {
      method: 'POST',
      body: JSON.stringify(lineData)
    });
  },
  
  /**
   * Recalculate all pricing
   */
  async recalculatePricing(sessionId) {
    return request(`/sessions/${sessionId}/pricing/recalculate`, {
      method: 'POST'
    });
  },
  
  /**
   * Apply discount to order
   */
  async applyDiscount(sessionId, discountData) {
    return request(`/sessions/${sessionId}/pricing/discount`, {
      method: 'POST',
      body: JSON.stringify(discountData)
    });
  },
  
  /**
   * Remove a discount
   */
  async removeDiscount(sessionId, discountId) {
    return request(`/sessions/${sessionId}/pricing/discount/${discountId}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Approve a discount (manager approval)
   */
  async approveDiscount(sessionId, discountId, credentials) {
    return request(`/sessions/${sessionId}/pricing/discount/${discountId}/approve`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },
  
  // ========================================
  // Shipping Operations
  // ========================================
  
  /**
   * Set shipping configuration
   */
  async setShipping(sessionId, shippingConfig) {
    return request(`/sessions/${sessionId}/shipping`, {
      method: 'POST',
      body: JSON.stringify(shippingConfig)
    });
  },
  
  /**
   * Get delivery dates
   */
  async getDeliveryDates(sessionId) {
    return request(`/sessions/${sessionId}/shipping/dates`);
  },
  
  // ========================================
  // Payment Operations
  // ========================================
  
  /**
   * Set payment method
   */
  async setPayment(sessionId, paymentConfig) {
    return request(`/sessions/${sessionId}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentConfig)
    });
  },
  
  // ========================================
  // Order Operations
  // ========================================
  
  /**
   * Submit order
   */
  async submitOrder(sessionId) {
    return request(`/sessions/${sessionId}/order/submit`, {
      method: 'POST'
    });
  },
  
  /**
   * Create quote from order
   */
  async createQuote(sessionId) {
    return request(`/sessions/${sessionId}/quote`, {
      method: 'POST'
    });
  },
  
  // ========================================
  // Quote Operations
  // ========================================
  
  /**
   * Search quotes
   */
  async searchQuotes(sessionId, query) {
    return request(`/sessions/${sessionId}/quotes/search`, {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },
  
  /**
   * Convert quote to order
   */
  async convertQuote(sessionId, quoteId) {
    return request(`/sessions/${sessionId}/quotes/${quoteId}/convert`, {
      method: 'POST'
    });
  },
  
  // ========================================
  // Will Call Operations
  // ========================================
  
  /**
   * Search will call items
   */
  async searchWillCallItems(sessionId, query) {
    return request(`/sessions/${sessionId}/willcall/search`, {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },
  
  /**
   * Load will call items
   */
  async loadWillCallItems(sessionId, itemIds) {
    return request(`/sessions/${sessionId}/willcall/load`, {
      method: 'POST',
      body: JSON.stringify({ itemIds })
    });
  },
  
  /**
   * Complete will call pickup
   */
  async completeWillCall(sessionId) {
    return request(`/sessions/${sessionId}/willcall/complete`, {
      method: 'POST'
    });
  },
  
  // ========================================
  // Barcode Operations
  // ========================================
  
  /**
   * Scan barcode
   */
  async scanBarcode(sessionId, barcode) {
    return request(`/sessions/${sessionId}/scan`, {
      method: 'POST',
      body: JSON.stringify({ barcode })
    });
  },
  
  // ========================================
  // Reorder Operations
  // ========================================
  
  /**
   * Get reorder history
   */
  async getReorderHistory(sessionId, customerId) {
    return request(`/sessions/${sessionId}/reorder/${customerId}`);
  },
  
  /**
   * Copy lines from previous order
   */
  async copyPreviousOrder(sessionId, orderId) {
    return request(`/sessions/${sessionId}/reorder/${orderId}/copy`, {
      method: 'POST'
    });
  }
};

export default posApi;
