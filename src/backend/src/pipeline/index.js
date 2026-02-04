/**
 * STEELWISE PIPELINE MODULE
 * ==========================
 * Main export for the complete pipeline system.
 * 
 * This module provides:
 * - Pipeline Orchestrator (state machine)
 * - Domain Handlers (commercial, operations, fulfillment)
 * - AI Decision Engine
 * - Pipeline Context tracking
 */

// Core orchestrator
export {
  orchestrator,
  PipelineOrchestrator,
  PipelineContext,
  PIPELINE_STAGES,
  STAGE_TRANSITIONS,
  INPUT_CHANNELS,
  ROLES,
  ROLE_PERMISSIONS,
  PRIORITY,
  formatPipelineOutput,
} from './orchestrator.js';

// AI Decision Engine
export {
  aiDecisionEngine,
  AIDecisionEngine,
  DECISION_TYPES,
  RISK_LEVELS,
} from './aiDecisionEngine.js';

// Handlers (for direct access if needed)
export { default as commercialHandlers } from './handlers/commercial.js';
export { default as operationsHandlers } from './handlers/operations.js';
export { default as fulfillmentHandlers } from './handlers/fulfillment.js';

// Import handler registry to auto-register all handlers
import './handlerRegistry.js';

// Re-export configured orchestrator as default
import { orchestrator } from './handlerRegistry.js';
export default orchestrator;
