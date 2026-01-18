/**
 * POS Workflow Module Index
 * 
 * Exports all POS workflow components.
 */

export { 
  POSWorkflowStateMachine,
  POSWorkflowDefinition,
  POSStates,
  POSTriggers,
  POSGuards,
  POSEffects,
  POSStateType
} from './POSWorkflowStateMachine.js';

export { 
  evaluateGuard, 
  evaluateGuards, 
  getAllGuardResults 
} from './guards.js';

export { 
  executeEffect, 
  executeEffects,
  calculateExtendedPrice,
  recalculatePricing,
  buildProcessedDescription
} from './effects.js';

export { 
  posWorkflowService,
  default as POSWorkflowService 
} from './POSWorkflowService.js';

// Screen Flow
export {
  ScreenFlows,
  StandardOrderScreens,
  QuickSaleScreens,
  WillCallPickupScreens,
  QuoteConversionScreens,
  POSComponents,
  ValidationRules,
  ScreenType,
  ScreenStatus
} from './screens.js';

export {
  screenFlowManager,
  default as ScreenFlowService
} from './ScreenFlowService.js';

// Validation Service
export {
  posValidationService,
  POSValidationService,
  FieldValidators,
  BusinessRules,
  ScreenValidationRules,
  ValidationSeverity,
  ValidationCategory,
  CustomerValidationSchema,
  AddressValidationSchema,
  LineItemValidationSchema,
  PaymentValidationSchema,
  DeliveryValidationSchema,
  QuickSaleItemSchema,
  WillCallVerificationSchema
} from './POSValidationService.js';

// Real-Time Pricing
export {
  realTimePricingCalculator,
  RealTimePricingConfig,
  MarginStatus
} from './RealTimePricingCalculator.js';

// Type definitions (for documentation/IDE support)
export * from './types.js';
