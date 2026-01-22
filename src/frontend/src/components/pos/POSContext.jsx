/**
 * POS Workflow Context
 * 
 * React context for managing POS session state and screen navigation.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { posApi } from '../../api/pos';
import { usePOSPricing } from '../../hooks/usePOSPricing';

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // Session
  sessionId: null,
  isLoading: false,
  error: null,
  
  // Workflow State
  currentState: 'IDLE',
  availableTransitions: [],
  activeParallelStates: [],
  
  // Screen Flow
  flowId: null,
  currentScreen: null,
  screenProgress: [],
  progress: 0,
  
  // Context Data
  customer: null,
  division: null,
  lines: [],
  pricing: {
    subtotal: 0,
    processingTotal: 0,
    discountTotal: 0,
    taxableAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    freightAmount: 0,
    totalAmount: 0,
    discounts: [],
    locked: false,
    approvalRequired: false
  },
  shipping: {
    method: null,
    address: null,
    requestedDate: null
  },
  payment: {
    method: null,
    cashOnly: false
  },
  
  // Order Result
  orderId: null,
  orderNumber: null,
  
  // UI State
  modals: {
    productSearch: false,
    cutConfigurator: false,
    quoteLookup: false,
    pricingAdjustment: false,
    discountApproval: false,
    marginWarning: false,
    creditHold: false
  },
  
  // Pricing State
  pricingWarnings: [],
  pendingApprovals: []
};

// ============================================
// ACTION TYPES
// ============================================

const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Session
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_LOADED: 'SESSION_LOADED',
  SESSION_ENDED: 'SESSION_ENDED',
  
  // Transitions
  TRANSITION_SUCCESS: 'TRANSITION_SUCCESS',
  STATE_UPDATED: 'STATE_UPDATED',
  
  // Screen Flow
  SET_FLOW: 'SET_FLOW',
  SCREEN_CHANGED: 'SCREEN_CHANGED',
  PROGRESS_UPDATED: 'PROGRESS_UPDATED',
  
  // Data Updates
  SET_CUSTOMER: 'SET_CUSTOMER',
  SET_DIVISION: 'SET_DIVISION',
  ADD_LINE: 'ADD_LINE',
  UPDATE_LINE: 'UPDATE_LINE',
  UPDATE_LINE_PRICING: 'UPDATE_LINE_PRICING',
  REMOVE_LINE: 'REMOVE_LINE',
  SET_LINES: 'SET_LINES',
  SET_PRICING: 'SET_PRICING',
  SET_SHIPPING: 'SET_SHIPPING',
  SET_PAYMENT: 'SET_PAYMENT',
  
  // Pricing
  ADD_DISCOUNT: 'ADD_DISCOUNT',
  REMOVE_DISCOUNT: 'REMOVE_DISCOUNT',
  SET_DISCOUNTS: 'SET_DISCOUNTS',
  ADD_PENDING_APPROVAL: 'ADD_PENDING_APPROVAL',
  REMOVE_PENDING_APPROVAL: 'REMOVE_PENDING_APPROVAL',
  SET_PRICING_WARNINGS: 'SET_PRICING_WARNINGS',
  LOCK_PRICING: 'LOCK_PRICING',
  UNLOCK_PRICING: 'UNLOCK_PRICING',
  RECALCULATE_TOTALS: 'RECALCULATE_TOTALS',
  
  // Order
  ORDER_SUBMITTED: 'ORDER_SUBMITTED',
  
  // Modals
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  
  // Reset
  RESET: 'RESET'
};

// ============================================
// REDUCER
// ============================================

function posReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
      
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
      
    case ActionTypes.SESSION_CREATED:
    case ActionTypes.SESSION_LOADED:
      return {
        ...state,
        sessionId: action.payload.sessionId,
        currentState: action.payload.currentState,
        availableTransitions: action.payload.availableTransitions || [],
        activeParallelStates: action.payload.activeParallelStates || [],
        isLoading: false,
        error: null
      };
      
    case ActionTypes.SESSION_ENDED:
      return { ...initialState };
      
    case ActionTypes.TRANSITION_SUCCESS:
      return {
        ...state,
        currentState: action.payload.currentState,
        availableTransitions: action.payload.availableTransitions || [],
        activeParallelStates: action.payload.activeParallelStates || [],
        // Merge context updates
        ...(action.payload.context?.customer && { customer: action.payload.context.customer }),
        ...(action.payload.context?.division && { division: action.payload.context.division }),
        ...(action.payload.context?.lines && { lines: action.payload.context.lines }),
        ...(action.payload.context?.pricing && { pricing: action.payload.context.pricing }),
        ...(action.payload.context?.shipping && { shipping: action.payload.context.shipping }),
        ...(action.payload.context?.payment && { payment: action.payload.context.payment }),
        isLoading: false
      };
      
    case ActionTypes.SET_FLOW:
      return {
        ...state,
        flowId: action.payload.flowId,
        screenProgress: action.payload.screens || [],
        progress: 0
      };
      
    case ActionTypes.SCREEN_CHANGED:
      return {
        ...state,
        currentScreen: action.payload.screen,
        progress: action.payload.progress || state.progress
      };
      
    case ActionTypes.PROGRESS_UPDATED:
      return {
        ...state,
        screenProgress: action.payload.screens || state.screenProgress,
        progress: action.payload.progress || state.progress
      };
      
    case ActionTypes.SET_CUSTOMER:
      return { ...state, customer: action.payload };
      
    case ActionTypes.SET_DIVISION:
      return { ...state, division: action.payload };
      
    case ActionTypes.ADD_LINE:
      return { ...state, lines: [...state.lines, action.payload] };
      
    case ActionTypes.UPDATE_LINE:
      return {
        ...state,
        lines: state.lines.map(line => 
          line.id === action.payload.id ? { ...line, ...action.payload } : line
        )
      };
      
    case ActionTypes.REMOVE_LINE:
      return {
        ...state,
        lines: state.lines.filter(line => line.id !== action.payload)
      };
      
    case ActionTypes.SET_LINES:
      return { ...state, lines: action.payload };
      
    case ActionTypes.SET_PRICING:
      return { ...state, pricing: { ...state.pricing, ...action.payload } };
      
    case ActionTypes.SET_SHIPPING:
      return { ...state, shipping: { ...state.shipping, ...action.payload } };
      
    case ActionTypes.SET_PAYMENT:
      return { ...state, payment: { ...state.payment, ...action.payload } };
      
    case ActionTypes.ORDER_SUBMITTED:
      return {
        ...state,
        orderId: action.payload.orderId,
        orderNumber: action.payload.orderNumber
      };
      
    // ========================================
    // PRICING ACTIONS
    // ========================================
    
    case ActionTypes.UPDATE_LINE_PRICING:
      return {
        ...state,
        lines: state.lines.map(line =>
          line.id === action.payload.lineId
            ? {
                ...line,
                pricing: {
                  ...line.pricing,
                  ...action.payload.pricing,
                  calculatedAt: new Date().toISOString()
                }
              }
            : line
        )
      };
      
    case ActionTypes.ADD_DISCOUNT:
      return {
        ...state,
        pricing: {
          ...state.pricing,
          discounts: [...(state.pricing.discounts || []), action.payload]
        }
      };
      
    case ActionTypes.REMOVE_DISCOUNT:
      return {
        ...state,
        pricing: {
          ...state.pricing,
          discounts: (state.pricing.discounts || []).filter(d => d.id !== action.payload)
        }
      };
      
    case ActionTypes.SET_DISCOUNTS:
      return {
        ...state,
        pricing: {
          ...state.pricing,
          discounts: action.payload
        }
      };
      
    case ActionTypes.ADD_PENDING_APPROVAL:
      return {
        ...state,
        pendingApprovals: [
          ...state.pendingApprovals,
          {
            ...action.payload,
            id: action.payload.id || `approval_${Date.now()}`,
            createdAt: new Date().toISOString()
          }
        ]
      };
      
    case ActionTypes.REMOVE_PENDING_APPROVAL:
      return {
        ...state,
        pendingApprovals: state.pendingApprovals.filter(a => a.id !== action.payload)
      };
      
    case ActionTypes.SET_PRICING_WARNINGS:
      return {
        ...state,
        pricingWarnings: action.payload
      };
      
    case ActionTypes.LOCK_PRICING:
      return {
        ...state,
        pricing: {
          ...state.pricing,
          locked: true,
          lockedAt: new Date().toISOString(),
          lockedBy: action.payload?.userId
        }
      };
      
    case ActionTypes.UNLOCK_PRICING:
      return {
        ...state,
        pricing: {
          ...state.pricing,
          locked: false,
          lockedAt: null,
          lockedBy: null
        }
      };
      
    case ActionTypes.RECALCULATE_TOTALS:
      // Calculate totals from lines
      const lineTotals = state.lines.reduce(
        (acc, line) => ({
          subtotal: acc.subtotal + (line.pricing?.extendedPrice || 0),
          processingTotal: acc.processingTotal + (line.pricing?.processingCharge || 0),
          extrasTotal: acc.extrasTotal + (line.pricing?.millExtras || 0) + (line.pricing?.certificationCharges || 0)
        }),
        { subtotal: 0, processingTotal: 0, extrasTotal: 0 }
      );
      
      const discountTotal = (state.pricing.discounts || []).reduce(
        (sum, d) => sum + (d.amount || 0),
        0
      );
      
      const taxableAmount = lineTotals.subtotal - discountTotal;
      const taxAmount = taxableAmount * (state.pricing.taxRate || 0);
      const grandTotal = taxableAmount + taxAmount;
      
      return {
        ...state,
        pricing: {
          ...state.pricing,
          subtotal: lineTotals.subtotal,
          processingTotal: lineTotals.processingTotal,
          extrasTotal: lineTotals.extrasTotal,
          discountTotal,
          taxableAmount,
          taxAmount,
          grandTotal,
          lastCalculatedAt: new Date().toISOString()
        }
      };
      
    case ActionTypes.OPEN_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: true }
      };
      
    case ActionTypes.CLOSE_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: false }
      };
      
    case ActionTypes.RESET:
      return { ...initialState };
      
    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

const POSContext = createContext(null);

// ============================================
// PROVIDER
// ============================================

export function POSProvider({ children }) {
  const [state, dispatch] = useReducer(posReducer, initialState);
  
  // ========================================
  // SESSION ACTIONS
  // ========================================
  
  const createSession = useCallback(async (userId, entryPoint = 'WALK_IN_CUSTOMER', flowId = 'standard_order') => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const session = await posApi.createSession(userId, entryPoint);
      dispatch({ type: ActionTypes.SESSION_CREATED, payload: session });
      
      // Initialize flow
      dispatch({ 
        type: ActionTypes.SET_FLOW, 
        payload: { flowId, screens: [] } 
      });
      
      return session;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);
  
  const loadSession = useCallback(async (sessionId) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const session = await posApi.getSession(sessionId);
      dispatch({ type: ActionTypes.SESSION_LOADED, payload: session });
      return session;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);
  
  const endSession = useCallback(async () => {
    if (!state.sessionId) return;
    
    try {
      await posApi.endSession(state.sessionId);
      dispatch({ type: ActionTypes.SESSION_ENDED });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [state.sessionId]);
  
  // ========================================
  // TRANSITION ACTIONS
  // ========================================
  
  const transition = useCallback(async (trigger, payload = {}) => {
    if (!state.sessionId) {
      throw new Error('No active session');
    }
    
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const result = await posApi.transition(state.sessionId, trigger, payload);
      
      if (result.success) {
        dispatch({ type: ActionTypes.TRANSITION_SUCCESS, payload: result });
      } else {
        dispatch({ type: ActionTypes.SET_ERROR, payload: result.error });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  // ========================================
  // SCREEN NAVIGATION
  // ========================================
  
  const navigateNext = useCallback(async () => {
    if (!state.sessionId || !state.flowId) return;
    
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const result = await posApi.navigateNext(state.sessionId, state.flowId);
      
      if (result.success) {
        dispatch({ type: ActionTypes.SCREEN_CHANGED, payload: result });
        
        if (result.transition?.success) {
          dispatch({ type: ActionTypes.TRANSITION_SUCCESS, payload: result.transition });
        }
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId, state.flowId]);
  
  const navigatePrevious = useCallback(async () => {
    if (!state.sessionId || !state.flowId) return;
    
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const result = await posApi.navigatePrevious(state.sessionId, state.flowId);
      
      if (result.success) {
        dispatch({ type: ActionTypes.SCREEN_CHANGED, payload: result });
        
        if (result.transition?.success) {
          dispatch({ type: ActionTypes.TRANSITION_SUCCESS, payload: result.transition });
        }
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId, state.flowId]);
  
  const refreshProgress = useCallback(async () => {
    if (!state.sessionId || !state.flowId) return;
    
    try {
      const progress = await posApi.getProgress(state.sessionId, state.flowId);
      dispatch({ type: ActionTypes.PROGRESS_UPDATED, payload: progress });
      return progress;
    } catch (error) {
      console.error('Failed to refresh progress:', error);
    }
  }, [state.sessionId, state.flowId]);
  
  // ========================================
  // CUSTOMER ACTIONS
  // ========================================
  
  const searchCustomers = useCallback(async (query) => {
    if (!state.sessionId) return { customers: [] };
    return posApi.searchCustomers(state.sessionId, query);
  }, [state.sessionId]);
  
  const selectCustomer = useCallback(async (customerId) => {
    if (!state.sessionId) return;
    
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const result = await posApi.selectCustomer(state.sessionId, customerId);
      
      if (result.success) {
        dispatch({ type: ActionTypes.TRANSITION_SUCCESS, payload: result });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  const createCustomer = useCallback(async (customerData) => {
    if (!state.sessionId) return;
    
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const result = await posApi.createCustomer(state.sessionId, customerData);
      
      if (result.success) {
        dispatch({ type: ActionTypes.TRANSITION_SUCCESS, payload: result });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  // ========================================
  // PRODUCT ACTIONS
  // ========================================
  
  const searchProducts = useCallback(async (query, filters = {}) => {
    if (!state.sessionId) return { products: [] };
    return posApi.searchProducts(state.sessionId, query, filters);
  }, [state.sessionId]);
  
  const getProductDetails = useCallback(async (productId) => {
    if (!state.sessionId) return null;
    return posApi.getProductDetails(state.sessionId, productId);
  }, [state.sessionId]);
  
  const addProduct = useCallback(async (productData) => {
    if (!state.sessionId) return;
    
    try {
      const result = await posApi.addProduct(state.sessionId, productData);
      
      if (result.success && result.context?.lines) {
        dispatch({ type: ActionTypes.SET_LINES, payload: result.context.lines });
        dispatch({ type: ActionTypes.SET_PRICING, payload: result.context.pricing });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  const addProcessedItem = useCallback(async (productData, processingConfig) => {
    if (!state.sessionId) return;
    
    try {
      const result = await posApi.addProcessedItem(state.sessionId, productData, processingConfig);
      
      if (result.success && result.context?.lines) {
        dispatch({ type: ActionTypes.SET_LINES, payload: result.context.lines });
        dispatch({ type: ActionTypes.SET_PRICING, payload: result.context.pricing });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  // ========================================
  // LINE ACTIONS
  // ========================================
  
  const updateLine = useCallback(async (lineId, updates) => {
    if (!state.sessionId) return;
    
    try {
      const result = await posApi.updateLine(state.sessionId, lineId, updates);
      
      if (result.success) {
        dispatch({ type: ActionTypes.UPDATE_LINE, payload: result.line });
        dispatch({ type: ActionTypes.SET_PRICING, payload: result.pricing });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  const removeLine = useCallback(async (lineId) => {
    if (!state.sessionId) return;
    
    try {
      const result = await posApi.removeLine(state.sessionId, lineId);
      
      if (result.success) {
        dispatch({ type: ActionTypes.REMOVE_LINE, payload: lineId });
        dispatch({ type: ActionTypes.SET_PRICING, payload: result.pricing });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  // ========================================
  // PRICING ACTIONS
  // ========================================
  
  const applyDiscount = useCallback(async (discountData) => {
    if (!state.sessionId) return;
    
    try {
      const result = await posApi.applyDiscount(state.sessionId, discountData);
      
      if (result.success) {
        dispatch({ type: ActionTypes.SET_PRICING, payload: result.pricing });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  const calculateLinePrice = useCallback(async (lineId, lineData) => {
    if (!state.sessionId) return null;
    
    try {
      const result = await posApi.calculatePrice(state.sessionId, {
        lineId,
        ...lineData,
        customerId: state.customer?.id,
        divisionId: state.division?.id
      });
      
      if (result.success) {
        dispatch({ 
          type: ActionTypes.UPDATE_LINE_PRICING, 
          payload: { lineId, pricing: result.pricing } 
        });
        
        // Check for warnings
        if (result.warnings?.length > 0) {
          dispatch({ 
            type: ActionTypes.SET_PRICING_WARNINGS, 
            payload: [...state.pricingWarnings, ...result.warnings.map(w => ({ ...w, lineId }))]
          });
        }
        
        // Check for approval requirements
        if (result.requiresApproval) {
          dispatch({ 
            type: ActionTypes.ADD_PENDING_APPROVAL, 
            payload: {
              type: 'MARGIN',
              lineId,
              reason: result.approvalReason,
              data: result.pricing
            }
          });
        }
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId, state.customer?.id, state.division?.id, state.pricingWarnings]);
  
  const addOrderDiscount = useCallback(async (discount) => {
    if (!state.sessionId) return;
    
    try {
      const result = await posApi.applyDiscount(state.sessionId, {
        ...discount,
        scope: 'ORDER'
      });
      
      if (result.success) {
        dispatch({ 
          type: ActionTypes.ADD_DISCOUNT, 
          payload: {
            id: result.discountId || `discount_${Date.now()}`,
            ...discount,
            amount: result.discountAmount
          }
        });
        
        // Recalculate totals
        dispatch({ type: ActionTypes.RECALCULATE_TOTALS });
        
        // Check if approval required
        if (result.requiresApproval) {
          dispatch({
            type: ActionTypes.ADD_PENDING_APPROVAL,
            payload: {
              type: 'DISCOUNT',
              discountId: result.discountId,
              reason: result.approvalReason,
              data: discount
            }
          });
          
          // Open approval modal
          dispatch({ type: ActionTypes.OPEN_MODAL, payload: 'discountApproval' });
        }
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  const removeOrderDiscount = useCallback(async (discountId) => {
    if (!state.sessionId) return;
    
    try {
      const result = await posApi.removeDiscount(state.sessionId, discountId);
      
      if (result.success) {
        dispatch({ type: ActionTypes.REMOVE_DISCOUNT, payload: discountId });
        dispatch({ type: ActionTypes.RECALCULATE_TOTALS });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  const approveDiscount = useCallback(async (approvalId, approverCredentials) => {
    if (!state.sessionId) return;
    
    try {
      const result = await posApi.approveDiscount(state.sessionId, approvalId, approverCredentials);
      
      if (result.success) {
        dispatch({ type: ActionTypes.REMOVE_PENDING_APPROVAL, payload: approvalId });
        dispatch({ type: ActionTypes.CLOSE_MODAL, payload: 'discountApproval' });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  const rejectDiscount = useCallback(async (approvalId) => {
    if (!state.sessionId) return;
    
    const approval = state.pendingApprovals.find(a => a.id === approvalId);
    
    if (approval?.type === 'DISCOUNT' && approval.discountId) {
      dispatch({ type: ActionTypes.REMOVE_DISCOUNT, payload: approval.discountId });
    }
    
    dispatch({ type: ActionTypes.REMOVE_PENDING_APPROVAL, payload: approvalId });
    dispatch({ type: ActionTypes.CLOSE_MODAL, payload: 'discountApproval' });
    dispatch({ type: ActionTypes.RECALCULATE_TOTALS });
  }, [state.pendingApprovals, state.sessionId]);
  
  const lockPricing = useCallback(async (userId) => {
    dispatch({ type: ActionTypes.LOCK_PRICING, payload: { userId } });
  }, []);
  
  const unlockPricing = useCallback(async () => {
    dispatch({ type: ActionTypes.UNLOCK_PRICING });
  }, []);
  
  const recalculateTotals = useCallback(() => {
    dispatch({ type: ActionTypes.RECALCULATE_TOTALS });
  }, []);
  
  const clearPricingWarnings = useCallback((lineId = null) => {
    if (lineId) {
      dispatch({ 
        type: ActionTypes.SET_PRICING_WARNINGS, 
        payload: state.pricingWarnings.filter(w => w.lineId !== lineId)
      });
    } else {
      dispatch({ type: ActionTypes.SET_PRICING_WARNINGS, payload: [] });
    }
  }, [state.pricingWarnings]);
  
  // Memoized pricing summary for quick access
  const pricingSummary = useMemo(() => ({
    lineCount: state.lines.length,
    subtotal: state.pricing.subtotal,
    processingTotal: state.pricing.processingTotal,
    discountTotal: state.pricing.discountTotal,
    taxAmount: state.pricing.taxAmount,
    grandTotal: state.pricing.grandTotal,
    hasWarnings: state.pricingWarnings.length > 0,
    hasPendingApprovals: state.pendingApprovals.length > 0,
    isLocked: state.pricing.locked
  }), [
    state.lines.length,
    state.pricing.subtotal,
    state.pricing.processingTotal,
    state.pricing.discountTotal,
    state.pricing.taxAmount,
    state.pricing.grandTotal,
    state.pricingWarnings.length,
    state.pendingApprovals.length,
    state.pricing.locked
  ]);
  
  // ========================================
  // ORDER SUBMISSION
  // ========================================
  
  const submitOrder = useCallback(async () => {
    if (!state.sessionId) return;
    
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    try {
      const result = await posApi.submitOrder(state.sessionId);
      
      if (result.success) {
        dispatch({ 
          type: ActionTypes.ORDER_SUBMITTED, 
          payload: { 
            orderId: result.order.id, 
            orderNumber: result.order.orderNumber 
          } 
        });
        
        if (result.transition?.success) {
          dispatch({ type: ActionTypes.TRANSITION_SUCCESS, payload: result.transition });
        }
      }
      
      return result;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);
  
  // ========================================
  // MODAL ACTIONS
  // ========================================
  
  const openModal = useCallback((modalName) => {
    dispatch({ type: ActionTypes.OPEN_MODAL, payload: modalName });
  }, []);
  
  const closeModal = useCallback((modalName) => {
    dispatch({ type: ActionTypes.CLOSE_MODAL, payload: modalName });
  }, []);
  
  // ========================================
  // UTILITY ACTIONS
  // ========================================
  
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);
  
  const reset = useCallback(() => {
    dispatch({ type: ActionTypes.RESET });
  }, []);
  
  // ========================================
  // CONTEXT VALUE
  // ========================================
  
  const value = {
    // State
    ...state,
    
    // Session Actions
    createSession,
    loadSession,
    endSession,
    
    // Transition Actions
    transition,
    
    // Navigation Actions
    navigateNext,
    navigatePrevious,
    refreshProgress,
    
    // Customer Actions
    searchCustomers,
    selectCustomer,
    createCustomer,
    
    // Product Actions
    searchProducts,
    getProductDetails,
    addProduct,
    addProcessedItem,
    
    // Line Actions
    updateLine,
    removeLine,
    
    // Pricing Actions
    applyDiscount,
    calculateLinePrice,
    addOrderDiscount,
    removeOrderDiscount,
    approveDiscount,
    rejectDiscount,
    lockPricing,
    unlockPricing,
    recalculateTotals,
    clearPricingWarnings,
    pricingSummary,
    
    // Order Actions
    submitOrder,
    
    // Modal Actions
    openModal,
    closeModal,
    
    // Utility Actions
    clearError,
    reset
  };
  
  return (
    <POSContext.Provider value={value}>
      {children}
    </POSContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function usePOS() {
  const context = useContext(POSContext);
  
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  
  return context;
}

export default POSContext;
