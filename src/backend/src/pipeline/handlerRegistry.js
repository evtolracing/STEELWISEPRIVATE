/**
 * PIPELINE HANDLER REGISTRY
 * ==========================
 * Registers all domain handlers with the pipeline orchestrator.
 */

import { orchestrator, PIPELINE_STAGES } from './orchestrator.js';
import commercialHandlers from './handlers/commercial.js';
import operationsHandlers from './handlers/operations.js';
import fulfillmentHandlers from './handlers/fulfillment.js';

// ============================================================================
// REGISTER COMMERCIAL HANDLERS
// ============================================================================

orchestrator.registerHandler(PIPELINE_STAGES.LEAD_CAPTURE, commercialHandlers.handleLeadCapture);
orchestrator.registerHandler(PIPELINE_STAGES.RFQ_RECEIVED, commercialHandlers.handleRfqReceived);
orchestrator.registerHandler(PIPELINE_STAGES.RFQ_PARSING, commercialHandlers.handleRfqParsing);
orchestrator.registerHandler(PIPELINE_STAGES.RFQ_CSR_REVIEW, commercialHandlers.handleCsrReview);
orchestrator.registerHandler(PIPELINE_STAGES.QUOTE_BUILDING, commercialHandlers.handleQuoteBuilding);
orchestrator.registerHandler(PIPELINE_STAGES.QUOTE_PRICING, commercialHandlers.handleQuotePricing);
orchestrator.registerHandler(PIPELINE_STAGES.QUOTE_ACCEPTED, commercialHandlers.handleQuoteAcceptance);

// ============================================================================
// REGISTER OPERATIONS HANDLERS
// ============================================================================

orchestrator.registerHandler(PIPELINE_STAGES.ORDER_CREATED, async (ctx, payload) => {
  // Order creation is handled by quote acceptance
  ctx.order.status = 'CREATED';
});
orchestrator.registerHandler(PIPELINE_STAGES.ORDER_PLANNING, operationsHandlers.handleOrderPlanning);
orchestrator.registerHandler(PIPELINE_STAGES.ORDER_INVENTORY_CHECK, operationsHandlers.handleInventoryCheck);
orchestrator.registerHandler(PIPELINE_STAGES.ORDER_ALLOCATION, operationsHandlers.handleOrderAllocation);
orchestrator.registerHandler(PIPELINE_STAGES.ORDER_CONFIRMED, operationsHandlers.handleOrderConfirmation);
orchestrator.registerHandler(PIPELINE_STAGES.JOB_CREATED, operationsHandlers.handleJobCreation);
orchestrator.registerHandler(PIPELINE_STAGES.JOB_BOM_MATCHED, operationsHandlers.handleBomMatching);
orchestrator.registerHandler(PIPELINE_STAGES.JOB_SCHEDULED, operationsHandlers.handleJobScheduling);
orchestrator.registerHandler(PIPELINE_STAGES.JOB_DISPATCHED, operationsHandlers.handleJobDispatch);
orchestrator.registerHandler(PIPELINE_STAGES.JOB_IN_PROGRESS, operationsHandlers.handleJobInProgress);
orchestrator.registerHandler(PIPELINE_STAGES.JOB_QC_CHECK, operationsHandlers.handleQcCheck);
orchestrator.registerHandler(PIPELINE_STAGES.JOB_COMPLETED, operationsHandlers.handleJobCompletion);

// ============================================================================
// REGISTER FULFILLMENT HANDLERS
// ============================================================================

orchestrator.registerHandler(PIPELINE_STAGES.PACK_CREATED, fulfillmentHandlers.handlePackCreation);
orchestrator.registerHandler(PIPELINE_STAGES.PACK_LABELED, fulfillmentHandlers.handlePackLabeling);
orchestrator.registerHandler(PIPELINE_STAGES.SHIP_READY, fulfillmentHandlers.handleShipReady);
orchestrator.registerHandler(PIPELINE_STAGES.SHIP_DISPATCHED, fulfillmentHandlers.handleShipDispatch);
orchestrator.registerHandler(PIPELINE_STAGES.SHIP_IN_TRANSIT, fulfillmentHandlers.handleShipInTransit);
orchestrator.registerHandler(PIPELINE_STAGES.SHIP_DELIVERED, fulfillmentHandlers.handleShipDelivered);
orchestrator.registerHandler(PIPELINE_STAGES.INVOICE_CREATED, fulfillmentHandlers.handleInvoiceCreation);
orchestrator.registerHandler(PIPELINE_STAGES.INVOICE_SENT, fulfillmentHandlers.handleInvoiceSent);
orchestrator.registerHandler(PIPELINE_STAGES.INVOICE_PAID, fulfillmentHandlers.handleInvoicePaid);
orchestrator.registerHandler(PIPELINE_STAGES.COMPLETED, fulfillmentHandlers.handleCompletion);

// ============================================================================
// EXPORT CONFIGURED ORCHESTRATOR
// ============================================================================

export { orchestrator };
export default orchestrator;
