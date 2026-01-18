/**
 * POS Screen Flow Service
 * 
 * Manages screen-by-screen navigation, validation, and progress tracking.
 * Integrates with the workflow state machine to ensure valid transitions.
 */

import { 
  ScreenFlows, 
  StandardOrderScreens, 
  QuickSaleScreens, 
  WillCallPickupScreens,
  QuoteConversionScreens,
  ValidationRules,
  ScreenStatus,
  POSComponents
} from './screens.js';
import { posWorkflowService } from './POSWorkflowService.js';

// ============================================
// SCREEN FLOW MANAGER
// ============================================

class ScreenFlowManager {
  
  /**
   * Get screen flow definition
   */
  getFlow(flowId) {
    return ScreenFlows[flowId] || null;
  }
  
  /**
   * Get all available flows
   */
  getAllFlows() {
    return Object.values(ScreenFlows).map(flow => ({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      estimatedTime: flow.estimatedTime,
      screenCount: flow.screens.length
    }));
  }
  
  /**
   * Get screens for a flow
   */
  getFlowScreens(flowId) {
    const flow = this.getFlow(flowId);
    return flow?.screens || [];
  }
  
  /**
   * Get screen definition by ID within a flow
   */
  getScreen(flowId, screenId) {
    const screens = this.getFlowScreens(flowId);
    return screens.find(s => s.screenId === screenId) || null;
  }
  
  /**
   * Get screen definition by workflow state ID
   */
  getScreenByState(flowId, stateId) {
    const screens = this.getFlowScreens(flowId);
    return screens.find(s => s.stateId === stateId) || null;
  }
  
  /**
   * Initialize screen flow for a session
   */
  initializeFlow(sessionId, flowId) {
    const session = posWorkflowService.getSession(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    
    const flow = this.getFlow(flowId);
    if (!flow) {
      return { error: 'Flow not found' };
    }
    
    // Build screen progress tracking
    const screenProgress = flow.screens.map(screen => ({
      screenId: screen.screenId,
      seq: screen.seq,
      name: screen.name,
      status: ScreenStatus.PENDING,
      required: screen.required,
      skipped: false,
      startedAt: null,
      completedAt: null,
      timeSpent: 0,
      validationErrors: [],
      dataCaptured: {}
    }));
    
    return {
      flowId: flow.id,
      flowName: flow.name,
      currentScreenIndex: 0,
      currentScreen: flow.screens[0],
      screens: screenProgress,
      totalScreens: flow.screens.length,
      estimatedTime: flow.estimatedTime,
      progress: 0
    };
  }
  
  /**
   * Get current screen for a session based on workflow state
   */
  getCurrentScreen(sessionId, flowId) {
    const session = posWorkflowService.getSession(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    
    const flow = this.getFlow(flowId);
    if (!flow) {
      return { error: 'Flow not found' };
    }
    
    // Find screen that matches current workflow state
    const currentScreen = this.getScreenByState(flowId, session.currentState);
    
    if (!currentScreen) {
      return {
        warning: 'No screen defined for current state',
        currentState: session.currentState,
        flowId
      };
    }
    
    // Calculate progress
    const screenIndex = flow.screens.findIndex(s => s.screenId === currentScreen.screenId);
    const progress = Math.round((screenIndex / flow.screens.length) * 100);
    
    // Evaluate show conditions
    const shouldShow = this.evaluateShowConditions(currentScreen, session.context);
    
    // Get component definitions
    const components = this.getScreenComponents(currentScreen);
    
    return {
      screen: {
        ...currentScreen,
        shouldShow,
        components
      },
      screenIndex,
      totalScreens: flow.screens.length,
      progress,
      isFirst: screenIndex === 0,
      isLast: screenIndex === flow.screens.length - 1,
      canGoBack: screenIndex > 0,
      canGoForward: this.canProceedToNext(session, currentScreen),
      previousScreen: screenIndex > 0 ? flow.screens[screenIndex - 1] : null,
      nextScreen: screenIndex < flow.screens.length - 1 ? flow.screens[screenIndex + 1] : null
    };
  }
  
  /**
   * Get full screen configuration with components
   */
  getScreenComponents(screen) {
    return screen.components.map(componentId => {
      const component = POSComponents[componentId];
      return component ? { ...component } : { id: componentId, type: 'unknown' };
    });
  }
  
  /**
   * Evaluate show conditions for a screen
   */
  evaluateShowConditions(screen, context) {
    if (!screen.showConditions || screen.showConditions.length === 0) {
      return true;
    }
    
    for (const condition of screen.showConditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Evaluate skip conditions for a screen
   */
  evaluateSkipConditions(screen, context) {
    if (!screen.skipConditions || screen.skipConditions.length === 0) {
      return false;
    }
    
    for (const condition of screen.skipConditions) {
      if (this.evaluateCondition(condition, context)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Evaluate a single condition expression
   */
  evaluateCondition(condition, context) {
    // Handle predefined conditions
    const predefinedConditions = {
      'customer_preselected': () => context.customer?.id != null,
      'walk_in_cash_sale': () => context.flags?.walkInCashSale === true,
      'customer.divisions.length > 1': () => (context.customer?.divisions?.length || 0) > 1,
      'delivery_method == "delivery"': () => context.shipping?.method === 'delivery',
      'delivery_method == "will_call"': () => context.shipping?.method === 'will_call',
      'delivery_method == "DELIVERY"': () => context.shipping?.method === 'delivery',
      'delivery_method == "WILL_CALL"': () => context.shipping?.method === 'will_call',
      'payment_now == true': () => context.payment?.paidUpfront === true || 
                                   ['CASH', 'CARD', 'CHECK'].includes(context.payment?.method)
    };
    
    if (predefinedConditions[condition]) {
      return predefinedConditions[condition]();
    }
    
    // For other conditions, return true by default
    console.warn(`Unknown condition: ${condition}`);
    return true;
  }
  
  /**
   * Validate current screen data
   */
  validateScreen(sessionId, flowId, screenId = null) {
    const session = posWorkflowService.getSession(sessionId);
    if (!session) {
      return { valid: false, errors: [{ message: 'Session not found' }] };
    }
    
    const flow = this.getFlow(flowId);
    if (!flow) {
      return { valid: false, errors: [{ message: 'Flow not found' }] };
    }
    
    // Get screen to validate
    const screen = screenId 
      ? this.getScreen(flowId, screenId)
      : this.getScreenByState(flowId, session.currentState);
    
    if (!screen) {
      return { valid: true, errors: [], warnings: ['No screen to validate'] };
    }
    
    const errors = [];
    const warnings = [];
    
    // Run validation rules
    for (const ruleId of (screen.validation || [])) {
      const rule = ValidationRules[ruleId];
      if (!rule) {
        warnings.push({ ruleId, message: `Unknown validation rule: ${ruleId}` });
        continue;
      }
      
      try {
        if (!rule.validate(session.context)) {
          errors.push({
            ruleId,
            field: rule.field,
            message: rule.message
          });
        }
      } catch (error) {
        warnings.push({ ruleId, message: `Validation error: ${error.message}` });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      screenId: screen.screenId
    };
  }
  
  /**
   * Check if can proceed to next screen
   */
  canProceedToNext(session, screen) {
    // Validate current screen
    if (!screen.validation || screen.validation.length === 0) {
      return true;
    }
    
    for (const ruleId of screen.validation) {
      const rule = ValidationRules[ruleId];
      if (rule && !rule.validate(session.context)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get next screen in flow (accounting for skip/show conditions)
   */
  getNextScreen(sessionId, flowId) {
    const session = posWorkflowService.getSession(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    
    const flow = this.getFlow(flowId);
    if (!flow) {
      return { error: 'Flow not found' };
    }
    
    const currentScreen = this.getScreenByState(flowId, session.currentState);
    if (!currentScreen) {
      return { screen: flow.screens[0] }; // Start from beginning
    }
    
    const currentIndex = flow.screens.findIndex(s => s.screenId === currentScreen.screenId);
    
    // Find next applicable screen
    for (let i = currentIndex + 1; i < flow.screens.length; i++) {
      const nextScreen = flow.screens[i];
      
      // Check if should skip
      if (this.evaluateSkipConditions(nextScreen, session.context)) {
        continue;
      }
      
      // Check if should show
      if (!this.evaluateShowConditions(nextScreen, session.context)) {
        continue;
      }
      
      return { screen: nextScreen, index: i };
    }
    
    // No more screens
    return { complete: true };
  }
  
  /**
   * Get previous screen in flow
   */
  getPreviousScreen(sessionId, flowId) {
    const session = posWorkflowService.getSession(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    
    const flow = this.getFlow(flowId);
    if (!flow) {
      return { error: 'Flow not found' };
    }
    
    const currentScreen = this.getScreenByState(flowId, session.currentState);
    if (!currentScreen) {
      return { error: 'Current screen not found' };
    }
    
    const currentIndex = flow.screens.findIndex(s => s.screenId === currentScreen.screenId);
    
    if (currentIndex <= 0) {
      return { atStart: true };
    }
    
    // Find previous applicable screen (that was shown, not skipped)
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevScreen = flow.screens[i];
      
      // Only go back to screens that would have been shown
      if (this.evaluateShowConditions(prevScreen, session.context)) {
        return { screen: prevScreen, index: i };
      }
    }
    
    return { atStart: true };
  }
  
  /**
   * Navigate to next screen
   */
  async navigateNext(sessionId, flowId) {
    // Validate current screen first
    const validation = this.validateScreen(sessionId, flowId);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      };
    }
    
    const nextScreen = this.getNextScreen(sessionId, flowId);
    
    if (nextScreen.error) {
      return { success: false, error: nextScreen.error };
    }
    
    if (nextScreen.complete) {
      return { success: true, complete: true, message: 'Flow complete' };
    }
    
    // Find the trigger to transition to next screen's state
    const session = posWorkflowService.getSession(sessionId);
    const availableActions = posWorkflowService.getAvailableActions(sessionId);
    
    // Find action that leads to the next screen's state
    const transitionAction = availableActions.actions?.find(
      a => a.targetState === nextScreen.screen.stateId && a.guardPasses
    );
    
    if (transitionAction) {
      const result = await posWorkflowService.transition(sessionId, transitionAction.trigger, {});
      return {
        success: result.success,
        screen: nextScreen.screen,
        transition: result
      };
    }
    
    // If no direct transition, return the next screen info
    return {
      success: true,
      screen: nextScreen.screen,
      requiresManualTransition: true
    };
  }
  
  /**
   * Navigate to previous screen
   */
  async navigatePrevious(sessionId, flowId) {
    const prevScreen = this.getPreviousScreen(sessionId, flowId);
    
    if (prevScreen.error) {
      return { success: false, error: prevScreen.error };
    }
    
    if (prevScreen.atStart) {
      return { success: false, atStart: true, message: 'Already at first screen' };
    }
    
    // Find the back trigger
    const availableActions = posWorkflowService.getAvailableActions(sessionId);
    const backAction = availableActions.actions?.find(a => a.trigger === 'back');
    
    if (backAction) {
      const result = await posWorkflowService.transition(sessionId, 'back', {});
      return {
        success: result.success,
        screen: prevScreen.screen,
        transition: result
      };
    }
    
    return {
      success: true,
      screen: prevScreen.screen,
      requiresManualTransition: true
    };
  }
  
  /**
   * Get flow progress summary
   */
  getFlowProgress(sessionId, flowId) {
    const session = posWorkflowService.getSession(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    
    const flow = this.getFlow(flowId);
    if (!flow) {
      return { error: 'Flow not found' };
    }
    
    const currentScreen = this.getScreenByState(flowId, session.currentState);
    const currentIndex = currentScreen 
      ? flow.screens.findIndex(s => s.screenId === currentScreen.screenId)
      : 0;
    
    // Build progress for each screen
    const screenProgress = flow.screens.map((screen, index) => {
      let status = ScreenStatus.PENDING;
      
      if (index < currentIndex) {
        // Check if it was skipped or completed
        if (!this.evaluateShowConditions(screen, session.context)) {
          status = ScreenStatus.SKIPPED;
        } else {
          status = ScreenStatus.COMPLETED;
        }
      } else if (index === currentIndex) {
        status = ScreenStatus.ACTIVE;
      }
      
      return {
        screenId: screen.screenId,
        name: screen.name,
        seq: screen.seq,
        status,
        required: screen.required
      };
    });
    
    const completedCount = screenProgress.filter(
      s => s.status === ScreenStatus.COMPLETED || s.status === ScreenStatus.SKIPPED
    ).length;
    
    return {
      flowId,
      flowName: flow.name,
      currentScreenIndex: currentIndex,
      currentScreenId: currentScreen?.screenId,
      screens: screenProgress,
      totalScreens: flow.screens.length,
      completedScreens: completedCount,
      progress: Math.round((completedCount / flow.screens.length) * 100),
      estimatedTimeRemaining: this.estimateTimeRemaining(flow, currentIndex)
    };
  }
  
  /**
   * Estimate remaining time based on average screen times
   */
  estimateTimeRemaining(flow, currentIndex) {
    let remaining = 0;
    
    for (let i = currentIndex; i < flow.screens.length; i++) {
      remaining += flow.screens[i].avgTimeSeconds || 30;
    }
    
    return remaining;
  }
  
  /**
   * Get keyboard shortcuts for current screen
   */
  getScreenShortcuts(flowId, screenId) {
    const screen = this.getScreen(flowId, screenId);
    if (!screen) {
      return [];
    }
    
    // Default shortcuts that apply to all screens
    const defaultShortcuts = [
      { key: 'Escape', action: 'cancel', label: 'Cancel' },
      { key: 'F1', action: 'help', label: 'Help' }
    ];
    
    return [...defaultShortcuts, ...(screen.shortcuts || [])];
  }
  
  /**
   * Get sub-screens for a screen (modals, drawers)
   */
  getSubScreens(flowId, screenId) {
    const screen = this.getScreen(flowId, screenId);
    return screen?.subScreens || [];
  }
}

// Export singleton instance
export const screenFlowManager = new ScreenFlowManager();
export default screenFlowManager;
