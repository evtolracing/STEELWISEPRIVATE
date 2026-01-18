/**
 * Division Selection Service
 * 
 * Implements the division selection logic from design document 42-AI-ORDER-INTAKE-POS.md
 * Handles multi-division customers, ship-to selection, and tax jurisdiction determination.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CONSTANTS
// ============================================

/**
 * Division selection result types
 */
export const DivisionFlowResult = {
  AUTO_SELECT: 'AUTO_SELECT',           // Single division, single ship-to
  PROMPT_SHIP_TO: 'PROMPT_SHIP_TO',     // Single division, multiple ship-tos
  PROMPT_DIVISION: 'PROMPT_DIVISION',   // Multiple divisions
  PROMPT_BOTH: 'PROMPT_BOTH',           // Multiple divisions and ship-tos
  PROMPT_JOB: 'PROMPT_JOB',             // Job account - select by job
  FROM_QUOTE: 'FROM_QUOTE',             // Quote conversion - pre-filled
  FROM_ORDER: 'FROM_ORDER',             // Will-call - from original order
  QUICK_SALE: 'QUICK_SALE',             // Cash account
  ERROR: 'ERROR'                        // No division found
};

/**
 * Tax types by jurisdiction
 */
export const TaxTypes = {
  ORIGIN_BASED: 'origin_based',
  DESTINATION_BASED: 'destination_based',
  EXEMPT: 'exempt'
};

/**
 * Order source types
 */
export const OrderSources = {
  POS: 'POS',
  QUICK_SALE: 'QUICK_SALE',
  WILL_CALL: 'WILL_CALL',
  QUOTE_CONVERT: 'QUOTE_CONVERT',
  REORDER: 'REORDER',
  PHONE: 'PHONE',
  WEB: 'WEB'
};

// ============================================
// DIVISION SERVICE CLASS
// ============================================

class DivisionService {
  
  // ==========================================
  // MAIN DECISION LOGIC
  // ==========================================
  
  /**
   * Determine the division selection flow based on customer and order source
   * Implements the decision table from design doc section 6
   * 
   * @param {Object} customer - Customer object with divisions
   * @param {string} orderSource - Order source type
   * @param {Object} options - Additional options (quoteId, orderId, etc.)
   * @returns {Object} Division flow result
   */
  async determineDivisionFlow(customer, orderSource = OrderSources.POS, options = {}) {
    // Quick Sale without customer
    if (orderSource === OrderSources.QUICK_SALE && !customer) {
      return this.handleQuickSale();
    }
    
    // Will-call pickup - use original order
    if (orderSource === OrderSources.WILL_CALL && options.orderId) {
      return this.handleWillCall(options.orderId);
    }
    
    // Quote conversion - pre-fill from quote
    if (orderSource === OrderSources.QUOTE_CONVERT && options.quoteId) {
      return this.handleQuoteConvert(options.quoteId);
    }
    
    // Reorder - use original order as defaults
    if (orderSource === OrderSources.REORDER && options.orderId) {
      return this.handleReorder(options.orderId);
    }
    
    // Standard flow - get customer divisions
    const divisions = await this.getCustomerDivisions(customer.id);
    
    // No divisions found
    if (!divisions || divisions.length === 0) {
      return {
        flowType: DivisionFlowResult.ERROR,
        error: 'NO_DIVISION',
        message: 'Customer has no divisions configured',
        action: 'CREATE_DIVISION'
      };
    }
    
    // Job account - special handling
    if (customer.customerType === 'JOB_ACCOUNT') {
      return this.handleJobAccount(customer, divisions);
    }
    
    // Single division
    if (divisions.length === 1) {
      return this.handleSingleDivision(divisions[0]);
    }
    
    // Multiple divisions
    return this.handleMultipleDivisions(customer, divisions);
  }
  
  // ==========================================
  // FLOW HANDLERS
  // ==========================================
  
  /**
   * Handle quick sale (cash account)
   */
  handleQuickSale() {
    return {
      flowType: DivisionFlowResult.QUICK_SALE,
      skipSelection: true,
      division: {
        id: 'SYSTEM_CASH',
        name: 'Cash Sales',
        code: 'CASH',
        isCashAccount: true
      },
      shipTo: {
        id: 'COUNTER_PICKUP',
        name: 'Counter Pickup',
        type: 'PICKUP'
      },
      deliveryMethod: 'WILL_CALL',
      paymentRequired: 'UPFRONT'
    };
  }
  
  /**
   * Handle will-call pickup from existing order
   */
  async handleWillCall(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true
      }
    });
    
    if (!order) {
      return {
        flowType: DivisionFlowResult.ERROR,
        error: 'ORDER_NOT_FOUND',
        message: 'Original order not found'
      };
    }
    
    return {
      flowType: DivisionFlowResult.FROM_ORDER,
      skipSelection: true,
      locked: true,
      division: {
        id: order.divisionId || order.buyerId,
        fromOrder: true
      },
      shipTo: {
        address: {
          line1: order.shipToAddress,
          city: order.shipToCity,
          state: order.shipToState,
          postalCode: order.shipToZip
        },
        type: 'PICKUP'
      },
      originalOrderId: orderId,
      originalOrderNumber: order.orderNumber
    };
  }
  
  /**
   * Handle quote conversion
   */
  async handleQuoteConvert(quoteId) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        customer: true
      }
    });
    
    if (!quote) {
      return {
        flowType: DivisionFlowResult.ERROR,
        error: 'QUOTE_NOT_FOUND',
        message: 'Quote not found'
      };
    }
    
    return {
      flowType: DivisionFlowResult.FROM_QUOTE,
      skipSelection: false,
      editable: true,
      defaultsFrom: 'quote',
      division: {
        id: quote.divisionId,
        fromQuote: true
      },
      shipTo: {
        id: quote.shipToId,
        address: {
          line1: quote.shipToAddress,
          city: quote.shipToCity,
          state: quote.shipToState,
          postalCode: quote.shipToZip
        },
        fromQuote: true
      },
      quoteId,
      quoteNumber: quote.quoteNumber
    };
  }
  
  /**
   * Handle reorder from history
   */
  async handleReorder(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true
      }
    });
    
    if (!order) {
      return {
        flowType: DivisionFlowResult.ERROR,
        error: 'ORDER_NOT_FOUND',
        message: 'Original order not found'
      };
    }
    
    return {
      flowType: DivisionFlowResult.FROM_ORDER,
      skipSelection: false,
      editable: true,
      defaultsFrom: 'order',
      division: {
        id: order.divisionId || order.buyerId,
        fromOrder: true
      },
      shipTo: {
        address: {
          line1: order.shipToAddress,
          city: order.shipToCity,
          state: order.shipToState,
          postalCode: order.shipToZip
        },
        fromOrder: true
      },
      originalOrderId: orderId,
      originalOrderNumber: order.orderNumber
    };
  }
  
  /**
   * Handle job account (project-based)
   */
  async handleJobAccount(customer, divisions) {
    // Get all jobs for this customer
    const jobs = await this.getCustomerJobs(customer.id);
    
    return {
      flowType: DivisionFlowResult.PROMPT_JOB,
      skipSelection: false,
      prompt: 'JOB_SELECT',
      division: divisions[0], // Job accounts typically have one division
      jobOptions: jobs,
      defaultJob: jobs.find(j => j.isDefault) || jobs[0]
    };
  }
  
  /**
   * Handle single division customer
   */
  async handleSingleDivision(division) {
    const shipTos = await this.getDivisionShipTos(division.id);
    
    // Single ship-to - auto-select everything
    if (!shipTos || shipTos.length === 0 || shipTos.length === 1) {
      const shipTo = shipTos?.[0] || this.createDefaultShipTo(division);
      
      return {
        flowType: DivisionFlowResult.AUTO_SELECT,
        skipSelection: true,
        division,
        shipTo,
        taxJurisdiction: await this.determineTaxJurisdiction(division, shipTo, 'DELIVERY')
      };
    }
    
    // Multiple ship-tos - prompt for selection
    return {
      flowType: DivisionFlowResult.PROMPT_SHIP_TO,
      skipSelection: false,
      prompt: 'SHIP_TO_ONLY',
      division,
      shipTo: null,
      shipToOptions: shipTos,
      defaultShipTo: shipTos.find(s => s.isDefault) || shipTos[0]
    };
  }
  
  /**
   * Handle multiple division customer
   */
  async handleMultipleDivisions(customer, divisions) {
    // Get default division
    const defaultDivision = divisions.find(d => d.isPrimary) || 
                            await this.getLastUsedDivision(customer.id) ||
                            divisions[0];
    
    // Check if divisions have multiple ship-tos
    const hasMultipleShipTos = await this.checkMultipleShipTos(divisions);
    
    if (hasMultipleShipTos) {
      return {
        flowType: DivisionFlowResult.PROMPT_BOTH,
        skipSelection: false,
        prompt: 'DIVISION_AND_SHIP_TO',
        division: null,
        shipTo: null,
        divisionOptions: divisions,
        defaultDivision,
        rememberSelection: true
      };
    }
    
    return {
      flowType: DivisionFlowResult.PROMPT_DIVISION,
      skipSelection: false,
      prompt: 'DIVISION_ONLY',
      division: null,
      shipTo: null,
      divisionOptions: divisions,
      defaultDivision,
      rememberSelection: true
    };
  }
  
  // ==========================================
  // TAX JURISDICTION
  // ==========================================
  
  /**
   * Determine tax jurisdiction based on division, ship-to, and delivery method
   * Implements tax jurisdiction logic from design doc
   */
  async determineTaxJurisdiction(division, shipTo, deliveryMethod) {
    // Will-call / Pickup - use seller location (origin-based)
    if (deliveryMethod === 'WILL_CALL' || deliveryMethod === 'PICKUP') {
      return {
        jurisdiction: await this.getSellerState(),
        nexus: true,
        taxType: TaxTypes.ORIGIN_BASED,
        reason: 'Counter pickup - origin based'
      };
    }
    
    // Delivery or Ship - use destination
    if (deliveryMethod === 'DELIVERY' || deliveryMethod === 'SHIP_CARRIER' || deliveryMethod === 'SHIP') {
      const destinationState = shipTo?.address?.state || shipTo?.state;
      
      if (!destinationState) {
        return {
          jurisdiction: await this.getSellerState(),
          nexus: true,
          taxType: TaxTypes.ORIGIN_BASED,
          reason: 'No destination state - defaulting to origin'
        };
      }
      
      const hasNexus = await this.checkNexus(destinationState);
      const stateTaxType = await this.getStateTaxType(destinationState);
      
      return {
        jurisdiction: destinationState,
        nexus: hasNexus,
        taxType: stateTaxType,
        reason: `Shipping to ${destinationState}`
      };
    }
    
    // Default - seller location
    return {
      jurisdiction: await this.getSellerState(),
      nexus: true,
      taxType: TaxTypes.ORIGIN_BASED,
      reason: 'Default - origin based'
    };
  }
  
  // ==========================================
  // SHIP-TO FILTERING
  // ==========================================
  
  /**
   * Filter ship-tos by division
   * Includes shared and all-division ship-tos
   */
  async filterShipTosByDivision(divisionId, allShipTos) {
    const filtered = allShipTos.filter(shipTo => {
      // Belongs to this division
      if (shipTo.divisionId === divisionId) return true;
      
      // Shared across divisions
      if (shipTo.shared === true) return true;
      
      // Available to all divisions
      if (shipTo.allDivisions === true) return true;
      
      return false;
    });
    
    // Sort by usage frequency (most used first)
    filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    
    return filtered;
  }
  
  /**
   * Get ship-tos for a division with filtering
   */
  async getFilteredShipTos(divisionId, customerId) {
    // Get all customer ship-tos
    const allShipTos = await this.getCustomerShipTos(customerId);
    
    // Filter by division
    const filtered = await this.filterShipTosByDivision(divisionId, allShipTos);
    
    return filtered;
  }
  
  // ==========================================
  // DATA ACCESS METHODS
  // ==========================================
  
  /**
   * Get customer divisions
   */
  async getCustomerDivisions(customerId) {
    // Try to get from database
    try {
      const customer = await prisma.organization.findUnique({
        where: { id: customerId },
        include: {
          childOrganizations: {
            where: { orgType: 'DIVISION' }
          }
        }
      });
      
      if (customer?.childOrganizations?.length > 0) {
        return customer.childOrganizations.map(div => ({
          id: div.id,
          name: div.legalName,
          code: div.shortCode,
          isPrimary: div.isPrimary || false,
          isActive: div.isActive,
          address: {
            street1: div.addressLine1,
            city: div.city,
            state: div.state,
            postalCode: div.postalCode
          },
          phone: div.phone,
          paymentTerms: div.paymentTerms,
          taxExempt: div.taxExempt || false
        }));
      }
      
      // If no child divisions, treat customer as single division
      return [{
        id: customer.id,
        name: customer.legalName,
        code: customer.shortCode,
        isPrimary: true,
        isActive: customer.isActive,
        address: {
          street1: customer.addressLine1,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode
        },
        phone: customer.phone,
        paymentTerms: customer.paymentTerms,
        taxExempt: customer.taxExempt || false
      }];
    } catch (error) {
      console.error('Error fetching divisions:', error);
      return [];
    }
  }
  
  /**
   * Get ship-tos for a division
   */
  async getDivisionShipTos(divisionId) {
    try {
      const shipTos = await prisma.address.findMany({
        where: {
          organizationId: divisionId,
          addressType: { in: ['SHIPPING', 'SHIP_TO', 'DELIVERY'] }
        }
      });
      
      return shipTos.map(addr => ({
        id: addr.id,
        name: addr.addressName || 'Shipping Address',
        address: {
          line1: addr.addressLine1,
          line2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode
        },
        isDefault: addr.isPrimary || false,
        divisionId: addr.organizationId
      }));
    } catch (error) {
      console.error('Error fetching ship-tos:', error);
      return [];
    }
  }
  
  /**
   * Get all ship-tos for a customer (across all divisions)
   */
  async getCustomerShipTos(customerId) {
    try {
      const addresses = await prisma.address.findMany({
        where: {
          organization: {
            OR: [
              { id: customerId },
              { parentId: customerId }
            ]
          },
          addressType: { in: ['SHIPPING', 'SHIP_TO', 'DELIVERY'] }
        }
      });
      
      return addresses.map(addr => ({
        id: addr.id,
        name: addr.addressName || 'Shipping Address',
        address: {
          line1: addr.addressLine1,
          line2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode
        },
        isDefault: addr.isPrimary || false,
        divisionId: addr.organizationId,
        shared: addr.shared || false,
        allDivisions: addr.allDivisions || false,
        usageCount: addr.usageCount || 0
      }));
    } catch (error) {
      console.error('Error fetching customer ship-tos:', error);
      return [];
    }
  }
  
  /**
   * Get jobs for job account customer
   */
  async getCustomerJobs(customerId) {
    try {
      const jobs = await prisma.job.findMany({
        where: {
          customerId,
          status: { in: ['ACTIVE', 'IN_PROGRESS'] }
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return jobs.map(job => ({
        id: job.id,
        name: job.jobName,
        number: job.jobNumber,
        siteAddress: {
          line1: job.siteAddress,
          city: job.siteCity,
          state: job.siteState,
          postalCode: job.siteZip
        },
        isDefault: job.isDefault || false
      }));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  }
  
  /**
   * Get last used division for a customer
   */
  async getLastUsedDivision(customerId) {
    try {
      const lastOrder = await prisma.order.findFirst({
        where: { buyerId: customerId },
        orderBy: { createdAt: 'desc' }
      });
      
      if (lastOrder?.divisionId) {
        const division = await prisma.organization.findUnique({
          where: { id: lastOrder.divisionId }
        });
        
        if (division) {
          return {
            id: division.id,
            name: division.legalName,
            code: division.shortCode
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Check if divisions have multiple ship-tos
   */
  async checkMultipleShipTos(divisions) {
    for (const div of divisions) {
      const shipTos = await this.getDivisionShipTos(div.id);
      if (shipTos.length > 1) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get seller state (origin for tax)
   */
  async getSellerState() {
    // This would come from system configuration
    // Default to TX for now
    return 'TX';
  }
  
  /**
   * Check if we have nexus in a state
   */
  async checkNexus(state) {
    // This would query a nexus configuration table
    // For now, assume nexus in all states
    const nexusStates = ['TX', 'CA', 'NY', 'FL', 'IL', 'PA', 'OH'];
    return nexusStates.includes(state);
  }
  
  /**
   * Get tax type for a state (origin vs destination)
   */
  async getStateTaxType(state) {
    // Origin-based states
    const originStates = ['TX', 'PA', 'OH', 'AZ', 'CA', 'IL', 'TN', 'UT', 'VA'];
    
    if (originStates.includes(state)) {
      return TaxTypes.ORIGIN_BASED;
    }
    
    return TaxTypes.DESTINATION_BASED;
  }
  
  /**
   * Create default ship-to from division address
   */
  createDefaultShipTo(division) {
    return {
      id: `${division.id}_default`,
      name: division.name,
      address: division.address,
      isDefault: true,
      divisionId: division.id
    };
  }
  
  // ==========================================
  // SELECTION ACTIONS
  // ==========================================
  
  /**
   * Select a division and optionally a ship-to
   */
  async selectDivision(sessionContext, divisionId, shipToId = null) {
    const customer = sessionContext.customer;
    const divisions = await this.getCustomerDivisions(customer.id);
    const division = divisions.find(d => d.id === divisionId);
    
    if (!division) {
      return {
        success: false,
        error: 'DIVISION_NOT_FOUND',
        message: 'Selected division not found'
      };
    }
    
    // Check if division is active
    if (division.isActive === false) {
      return {
        success: false,
        error: 'DIVISION_INACTIVE',
        message: 'Selected division is not active'
      };
    }
    
    // Get ship-to
    let shipTo = null;
    if (shipToId) {
      const shipTos = await this.getFilteredShipTos(divisionId, customer.id);
      shipTo = shipTos.find(s => s.id === shipToId);
    } else {
      // Try to get default ship-to
      const shipTos = await this.getDivisionShipTos(divisionId);
      shipTo = shipTos.find(s => s.isDefault) || shipTos[0] || this.createDefaultShipTo(division);
    }
    
    // Determine tax jurisdiction
    const taxJurisdiction = await this.determineTaxJurisdiction(
      division, 
      shipTo, 
      sessionContext.deliveryMethod || 'DELIVERY'
    );
    
    // Update usage count for remembering selection
    await this.updateDivisionUsage(customer.id, divisionId);
    
    return {
      success: true,
      division,
      shipTo,
      taxJurisdiction,
      needsShipToSelection: !shipTo && (await this.getDivisionShipTos(divisionId)).length > 1
    };
  }
  
  /**
   * Select a ship-to address
   */
  async selectShipTo(sessionContext, shipToId) {
    const division = sessionContext.division;
    
    if (!division) {
      return {
        success: false,
        error: 'NO_DIVISION',
        message: 'No division selected'
      };
    }
    
    const shipTos = await this.getFilteredShipTos(division.id, sessionContext.customer?.id);
    const shipTo = shipTos.find(s => s.id === shipToId);
    
    if (!shipTo) {
      return {
        success: false,
        error: 'SHIP_TO_NOT_FOUND',
        message: 'Selected ship-to address not found'
      };
    }
    
    // Recalculate tax jurisdiction
    const taxJurisdiction = await this.determineTaxJurisdiction(
      division,
      shipTo,
      sessionContext.deliveryMethod || 'DELIVERY'
    );
    
    return {
      success: true,
      shipTo,
      taxJurisdiction
    };
  }
  
  /**
   * Update division usage for "remember selection" feature
   */
  async updateDivisionUsage(customerId, divisionId) {
    try {
      // This would update a usage tracking table
      // For now, just log it
      console.log(`Division ${divisionId} used for customer ${customerId}`);
    } catch (error) {
      // Non-critical, ignore errors
    }
  }
}

// Export singleton instance
export const divisionService = new DivisionService();
export default DivisionService;
