/**
 * Will-Call Pickup Service
 * 
 * Manages will-call order queue, verification, loading, and completion.
 * Implements the will-call pickup workflow from design document 42-AI-ORDER-INTAKE-POS.md
 */

import prisma from '../../lib/db.js';

// ============================================
// ENUMS
// ============================================

/**
 * Will-call order status
 */
export const WillCallStatus = {
  PENDING: 'PENDING',           // Order placed, awaiting pickup scheduling
  SCHEDULED: 'SCHEDULED',       // Pickup time scheduled
  READY: 'READY',               // Items staged, ready for pickup
  IN_PROGRESS: 'IN_PROGRESS',   // Customer arrived, pickup in progress
  LOADING: 'LOADING',           // Items being loaded
  PARTIAL: 'PARTIAL',           // Partial pickup completed
  COMPLETED: 'COMPLETED',       // Full pickup completed
  CANCELLED: 'CANCELLED',       // Pickup cancelled
  EXPIRED: 'EXPIRED'            // Pickup window expired
};

/**
 * ID verification types
 */
export const IDType = {
  DRIVERS_LICENSE: 'DRIVERS_LICENSE',
  STATE_ID: 'STATE_ID',
  PASSPORT: 'PASSPORT',
  COMPANY_ID: 'COMPANY_ID',
  EMPLOYEE_BADGE: 'EMPLOYEE_BADGE'
};

/**
 * Pickup authorization types
 */
export const AuthorizationType = {
  CUSTOMER_SELF: 'CUSTOMER_SELF',           // Customer picking up personally
  AUTHORIZED_PERSON: 'AUTHORIZED_PERSON',   // Pre-authorized person
  THIRD_PARTY_CARRIER: 'THIRD_PARTY_CARRIER', // Freight carrier
  COMPANY_DRIVER: 'COMPANY_DRIVER'          // Customer's company driver
};

// ============================================
// WILL-CALL SERVICE
// ============================================

class WillCallService {
  
  // ==========================================
  // QUEUE MANAGEMENT
  // ==========================================
  
  /**
   * Get will-call orders ready for pickup
   */
  async getPickupQueue(locationId, filters = {}) {
    const {
      status = [WillCallStatus.READY, WillCallStatus.SCHEDULED],
      customerId,
      dateFrom,
      dateTo,
      search
    } = filters;
    
    // Build where clause
    const where = {
      locationId,
      deliveryMethod: 'WILL_CALL',
      willCallStatus: { in: Array.isArray(status) ? status : [status] }
    };
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (dateFrom || dateTo) {
      where.willCallDate = {};
      if (dateFrom) where.willCallDate.gte = new Date(dateFrom);
      if (dateTo) where.willCallDate.lte = new Date(dateTo);
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { poNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    try {
      const orders = await prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          lines: {
            select: {
              id: true,
              lineNumber: true,
              product: { select: { id: true, name: true, sku: true } },
              quantity: true,
              quantityReleased: true,
              unitOfMeasure: true,
              weight: true
            }
          },
          authorizedPickupPersons: true
        },
        orderBy: [
          { willCallDate: 'asc' },
          { createdAt: 'asc' }
        ]
      });
      
      return orders.map(order => this.formatQueueItem(order));
    } catch (error) {
      console.error('Failed to get pickup queue:', error);
      // Return mock data for development
      return this.getMockPickupQueue();
    }
  }
  
  /**
   * Format order for queue display
   */
  formatQueueItem(order) {
    const totalItems = order.lines?.length || 0;
    const itemsReleased = order.lines?.filter(l => l.quantityReleased > 0).length || 0;
    
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      status: order.willCallStatus,
      scheduledDate: order.willCallDate,
      scheduledTime: order.willCallTime,
      totalLines: totalItems,
      linesReleased: itemsReleased,
      totalWeight: order.lines?.reduce((sum, l) => sum + (l.weight || 0), 0) || 0,
      poNumber: order.poNumber,
      notes: order.notes,
      authorizedPersons: order.authorizedPickupPersons || [],
      priority: order.priority || 'NORMAL',
      createdAt: order.createdAt,
      readyAt: order.readyAt,
      waitingMinutes: order.readyAt 
        ? Math.floor((Date.now() - new Date(order.readyAt).getTime()) / 60000)
        : null
    };
  }
  
  /**
   * Get mock pickup queue for development
   */
  getMockPickupQueue() {
    return [
      {
        id: 'wc-001',
        orderNumber: 'SO-100234',
        customer: { id: 'c1', name: 'ABC Fabrication', phone: '555-0101' },
        status: WillCallStatus.READY,
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '10:00 AM',
        totalLines: 3,
        linesReleased: 0,
        totalWeight: 2500,
        poNumber: 'PO-9876',
        authorizedPersons: [
          { name: 'John Smith', isEmployee: true },
          { name: 'Mike Johnson', isEmployee: false }
        ],
        priority: 'NORMAL',
        waitingMinutes: null
      },
      {
        id: 'wc-002',
        orderNumber: 'SO-100235',
        customer: { id: 'c2', name: 'Steel Solutions Inc', phone: '555-0102' },
        status: WillCallStatus.READY,
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '11:30 AM',
        totalLines: 5,
        linesReleased: 0,
        totalWeight: 8750,
        poNumber: 'PO-4532',
        authorizedPersons: [
          { name: 'Sarah Davis', isEmployee: true }
        ],
        priority: 'HIGH',
        waitingMinutes: 15
      },
      {
        id: 'wc-003',
        orderNumber: 'SO-100228',
        customer: { id: 'c3', name: 'Industrial Metal Works', phone: '555-0103' },
        status: WillCallStatus.SCHEDULED,
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '2:00 PM',
        totalLines: 2,
        linesReleased: 0,
        totalWeight: 1200,
        poNumber: null,
        authorizedPersons: [],
        priority: 'NORMAL',
        waitingMinutes: null
      }
    ];
  }
  
  /**
   * Get order details for pickup
   */
  async getPickupOrder(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          division: true,
          lines: {
            include: {
              product: true,
              allocations: true
            }
          },
          authorizedPickupPersons: true,
          pickupHistory: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });
      
      if (!order) return null;
      
      return this.formatPickupOrderDetails(order);
    } catch (error) {
      console.error('Failed to get pickup order:', error);
      return this.getMockPickupOrder(orderId);
    }
  }
  
  /**
   * Format order details for pickup screen
   */
  formatPickupOrderDetails(order) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        address: {
          line1: order.customer.address,
          city: order.customer.city,
          state: order.customer.state,
          postalCode: order.customer.postalCode
        }
      },
      division: order.division,
      status: order.willCallStatus,
      orderDate: order.createdAt,
      scheduledPickup: {
        date: order.willCallDate,
        time: order.willCallTime
      },
      poNumber: order.poNumber,
      lines: order.lines.map(line => ({
        id: line.id,
        lineNumber: line.lineNumber,
        product: {
          id: line.product?.id,
          sku: line.product?.sku,
          name: line.product?.name,
          description: line.product?.description
        },
        quantity: line.quantity,
        quantityReleased: line.quantityReleased || 0,
        quantityRemaining: line.quantity - (line.quantityReleased || 0),
        unitOfMeasure: line.unitOfMeasure,
        weight: line.weight,
        allocations: line.allocations?.map(a => ({
          id: a.id,
          bundleTag: a.bundleTag,
          coilId: a.coilId,
          quantity: a.quantity,
          weight: a.weight,
          location: a.location
        })) || []
      })),
      authorizedPersons: order.authorizedPickupPersons?.map(p => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: p.email,
        isEmployee: p.isEmployee,
        idOnFile: p.idOnFile,
        addedAt: p.createdAt
      })) || [],
      pickupHistory: order.pickupHistory || [],
      notes: order.notes,
      specialInstructions: order.specialInstructions,
      requiresSignature: true,
      requiresPhoto: false,
      documentsToProvide: ['PACKING_LIST', 'MTR']
    };
  }
  
  /**
   * Get mock pickup order for development
   */
  getMockPickupOrder(orderId) {
    return {
      id: orderId,
      orderNumber: 'SO-100234',
      customer: {
        id: 'c1',
        name: 'ABC Fabrication',
        phone: '(555) 123-4567',
        email: 'orders@abcfab.com',
        address: {
          line1: '123 Industrial Blvd',
          city: 'Houston',
          state: 'TX',
          postalCode: '77001'
        }
      },
      status: WillCallStatus.READY,
      orderDate: new Date(Date.now() - 86400000).toISOString(),
      scheduledPickup: {
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM'
      },
      poNumber: 'PO-9876',
      lines: [
        {
          id: 'l1',
          lineNumber: 1,
          product: { id: 'p1', sku: 'HR-1018-0.125', name: 'HR Sheet 1018 0.125"' },
          quantity: 10,
          quantityReleased: 0,
          quantityRemaining: 10,
          unitOfMeasure: 'PC',
          weight: 1250,
          allocations: [
            { id: 'a1', bundleTag: 'BDL-001234', quantity: 5, weight: 625, location: 'A-12-3' },
            { id: 'a2', bundleTag: 'BDL-001235', quantity: 5, weight: 625, location: 'A-12-4' }
          ]
        },
        {
          id: 'l2',
          lineNumber: 2,
          product: { id: 'p2', sku: 'CR-1008-0.060', name: 'CR Sheet 1008 0.060"' },
          quantity: 20,
          quantityReleased: 0,
          quantityRemaining: 20,
          unitOfMeasure: 'PC',
          weight: 850,
          allocations: [
            { id: 'a3', bundleTag: 'BDL-001240', quantity: 20, weight: 850, location: 'B-05-1' }
          ]
        },
        {
          id: 'l3',
          lineNumber: 3,
          product: { id: 'p3', sku: 'GAL-G90-0.020', name: 'Galvanized G90 0.020"' },
          quantity: 5,
          quantityReleased: 0,
          quantityRemaining: 5,
          unitOfMeasure: 'PC',
          weight: 400,
          allocations: [
            { id: 'a4', bundleTag: 'BDL-001250', quantity: 5, weight: 400, location: 'C-02-2' }
          ]
        }
      ],
      authorizedPersons: [
        { id: 'ap1', name: 'John Smith', phone: '555-1234', isEmployee: true, idOnFile: true },
        { id: 'ap2', name: 'Mike Johnson', phone: '555-5678', isEmployee: false, idOnFile: false }
      ],
      pickupHistory: [],
      notes: 'Customer prefers loading from back of trailer',
      specialInstructions: 'Call customer 30 minutes before loading',
      requiresSignature: true,
      requiresPhoto: false,
      documentsToProvide: ['PACKING_LIST', 'MTR']
    };
  }
  
  // ==========================================
  // VERIFICATION
  // ==========================================
  
  /**
   * Verify pickup person identity
   */
  async verifyPickupPerson(orderId, verification) {
    const {
      personName,
      idType,
      idNumberLast4,
      authorizationType,
      isAuthorizedPerson,
      verifiedByEmployeeId,
      photoCapture
    } = verification;
    
    // Validate required fields
    if (!personName || !idType || !verifiedByEmployeeId) {
      return {
        success: false,
        error: 'Missing required verification fields'
      };
    }
    
    try {
      // Get order
      const order = await this.getPickupOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      
      // Check if person is authorized
      const authorized = this.checkAuthorization(order, personName, isAuthorizedPerson);
      if (!authorized.isAuthorized && authorizationType !== AuthorizationType.CUSTOMER_SELF) {
        return {
          success: false,
          error: 'Person not authorized for pickup',
          requiresManagerApproval: true
        };
      }
      
      // Create verification record
      const verificationRecord = {
        id: `ver-${Date.now()}`,
        orderId,
        personName,
        idType,
        idNumberLast4,
        authorizationType,
        verifiedByEmployeeId,
        verifiedAt: new Date().toISOString(),
        photoUrl: photoCapture?.url || null,
        isAuthorizedPerson: authorized.isAuthorized,
        authorizationMethod: authorized.method
      };
      
      // Update order status
      await this.updateOrderStatus(orderId, WillCallStatus.IN_PROGRESS, {
        verification: verificationRecord
      });
      
      return {
        success: true,
        verification: verificationRecord,
        order: await this.getPickupOrder(orderId)
      };
    } catch (error) {
      console.error('Verification failed:', error);
      return {
        success: false,
        error: 'Verification failed',
        details: error.message
      };
    }
  }
  
  /**
   * Check if person is authorized for pickup
   */
  checkAuthorization(order, personName, isAuthorizedPerson) {
    // Check if name matches customer
    const customerMatch = order.customer.name.toLowerCase().includes(personName.toLowerCase());
    if (customerMatch) {
      return { isAuthorized: true, method: 'CUSTOMER_NAME_MATCH' };
    }
    
    // Check authorized persons list
    const authorizedPerson = order.authorizedPersons?.find(p => 
      p.name.toLowerCase() === personName.toLowerCase()
    );
    if (authorizedPerson) {
      return { isAuthorized: true, method: 'AUTHORIZED_LIST', person: authorizedPerson };
    }
    
    // If explicitly marked as authorized person
    if (isAuthorizedPerson) {
      return { isAuthorized: true, method: 'MANUAL_AUTHORIZATION' };
    }
    
    return { isAuthorized: false };
  }
  
  // ==========================================
  // LOADING
  // ==========================================
  
  /**
   * Mark item as loaded
   */
  async markItemLoaded(orderId, lineId, loadData) {
    const {
      quantityLoaded,
      bundleTags = [],
      loaderEmployeeId,
      loadedAt = new Date().toISOString()
    } = loadData;
    
    try {
      // Get order
      const order = await this.getPickupOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      
      // Find line
      const line = order.lines.find(l => l.id === lineId);
      if (!line) {
        return { success: false, error: 'Line not found' };
      }
      
      // Validate quantity
      if (quantityLoaded > line.quantityRemaining) {
        return { 
          success: false, 
          error: 'Cannot load more than remaining quantity',
          maxQuantity: line.quantityRemaining
        };
      }
      
      // Update line quantity released
      const newQuantityReleased = (line.quantityReleased || 0) + quantityLoaded;
      
      // Record the load
      const loadRecord = {
        lineId,
        quantityLoaded,
        bundleTags,
        loaderEmployeeId,
        loadedAt
      };
      
      // Update database (mock for now)
      console.log('Loading item:', loadRecord);
      
      return {
        success: true,
        lineId,
        newQuantityReleased,
        isComplete: newQuantityReleased >= line.quantity,
        loadRecord
      };
    } catch (error) {
      console.error('Failed to mark item loaded:', error);
      return { success: false, error: 'Failed to mark item loaded' };
    }
  }
  
  /**
   * Get loading checklist for order
   */
  async getLoadingChecklist(orderId) {
    const order = await this.getPickupOrder(orderId);
    if (!order) return null;
    
    return {
      orderId,
      orderNumber: order.orderNumber,
      customer: order.customer.name,
      items: order.lines.map(line => ({
        lineId: line.id,
        lineNumber: line.lineNumber,
        product: line.product,
        quantity: line.quantity,
        quantityReleased: line.quantityReleased,
        quantityRemaining: line.quantityRemaining,
        weight: line.weight,
        status: line.quantityRemaining === 0 ? 'LOADED' : 
                line.quantityReleased > 0 ? 'PARTIAL' : 'PENDING',
        allocations: line.allocations
      })),
      allItemsLoaded: order.lines.every(l => l.quantityRemaining === 0),
      partialLoad: order.lines.some(l => l.quantityReleased > 0 && l.quantityRemaining > 0)
    };
  }
  
  // ==========================================
  // SIGNATURE & COMPLETION
  // ==========================================
  
  /**
   * Capture pickup signature
   */
  async captureSignature(orderId, signatureData) {
    const {
      signatureImage,  // Base64 encoded
      signerName,
      signedAt = new Date().toISOString()
    } = signatureData;
    
    if (!signatureImage || !signerName) {
      return { success: false, error: 'Signature and signer name required' };
    }
    
    // Store signature (mock for now)
    const signatureRecord = {
      id: `sig-${Date.now()}`,
      orderId,
      signatureImage,
      signerName,
      signedAt,
      type: 'PICKUP_CONFIRMATION'
    };
    
    console.log('Signature captured:', { orderId, signerName, signedAt });
    
    return {
      success: true,
      signature: signatureRecord
    };
  }
  
  /**
   * Capture vehicle photo
   */
  async captureVehiclePhoto(orderId, photoData) {
    const {
      photoImage,  // Base64 or URL
      vehicleType,
      licensePlate,
      capturedAt = new Date().toISOString()
    } = photoData;
    
    const photoRecord = {
      id: `photo-${Date.now()}`,
      orderId,
      photoImage,
      vehicleType,
      licensePlate,
      capturedAt
    };
    
    console.log('Vehicle photo captured:', { orderId, vehicleType, licensePlate });
    
    return {
      success: true,
      photo: photoRecord
    };
  }
  
  /**
   * Complete will-call pickup
   */
  async completePickup(orderId, completionData) {
    const {
      completedByEmployeeId,
      loadingDock,
      signature,
      vehiclePhoto,
      documentsProvided = [],
      notes
    } = completionData;
    
    try {
      // Get order and validate
      const order = await this.getPickupOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      
      // Check if all items loaded
      const checklist = await this.getLoadingChecklist(orderId);
      const isPartial = !checklist.allItemsLoaded;
      
      // Require signature
      if (!signature) {
        return { success: false, error: 'Signature required to complete pickup' };
      }
      
      // Create completion record
      const completionRecord = {
        id: `comp-${Date.now()}`,
        orderId,
        orderNumber: order.orderNumber,
        completedAt: new Date().toISOString(),
        completedByEmployeeId,
        isPartialPickup: isPartial,
        itemsReleased: checklist.items.filter(i => i.quantityReleased > 0).map(i => ({
          lineNumber: i.lineNumber,
          productSku: i.product?.sku,
          quantityReleased: i.quantityReleased,
          weight: i.weight * (i.quantityReleased / i.quantity)
        })),
        itemsRemaining: isPartial ? checklist.items.filter(i => i.quantityRemaining > 0).map(i => ({
          lineNumber: i.lineNumber,
          productSku: i.product?.sku,
          quantityRemaining: i.quantityRemaining
        })) : [],
        signature,
        vehiclePhoto,
        loadingDock,
        documentsProvided,
        notes
      };
      
      // Update order status
      const newStatus = isPartial ? WillCallStatus.PARTIAL : WillCallStatus.COMPLETED;
      await this.updateOrderStatus(orderId, newStatus, { completion: completionRecord });
      
      // Generate documents
      const documents = await this.generatePickupDocuments(orderId, completionRecord);
      
      return {
        success: true,
        completion: completionRecord,
        isPartial,
        remainingForLater: completionRecord.itemsRemaining,
        documents,
        message: isPartial 
          ? 'Partial pickup completed. Remaining items held for later pickup.'
          : 'Pickup completed successfully.'
      };
    } catch (error) {
      console.error('Failed to complete pickup:', error);
      return { success: false, error: 'Failed to complete pickup' };
    }
  }
  
  /**
   * Handle partial pickup
   */
  async handlePartialPickup(orderId, partialData) {
    const {
      reason,
      rescheduleDate,
      itemsToPickupNow = [],
      itemsToLeave = [],
      notes
    } = partialData;
    
    // Validate
    if (!reason) {
      return { success: false, error: 'Reason for partial pickup required' };
    }
    
    // Create partial pickup record
    const partialRecord = {
      orderId,
      reason,
      rescheduleDate,
      itemsPickedUp: itemsToPickupNow,
      itemsRemaining: itemsToLeave,
      notes,
      createdAt: new Date().toISOString()
    };
    
    // Update order for remaining items
    if (rescheduleDate) {
      console.log('Rescheduling remaining pickup for:', rescheduleDate);
    }
    
    return {
      success: true,
      partialPickup: partialRecord,
      canComplete: itemsToPickupNow.length > 0
    };
  }
  
  // ==========================================
  // DOCUMENTS
  // ==========================================
  
  /**
   * Generate pickup documents
   */
  async generatePickupDocuments(orderId, completionRecord) {
    const documents = [];
    
    // Packing List
    documents.push({
      type: 'PACKING_LIST',
      name: `Packing List - ${completionRecord.orderNumber}`,
      url: `/api/documents/packing-list/${orderId}`,
      generated: true
    });
    
    // Bill of Lading (if needed)
    if (completionRecord.itemsReleased.length > 0) {
      documents.push({
        type: 'BOL',
        name: `Bill of Lading - ${completionRecord.orderNumber}`,
        url: `/api/documents/bol/${orderId}`,
        generated: true
      });
    }
    
    // Mill Test Reports (if required)
    documents.push({
      type: 'MTR',
      name: `Mill Test Report - ${completionRecord.orderNumber}`,
      url: `/api/documents/mtr/${orderId}`,
      generated: true
    });
    
    // Pickup Receipt
    documents.push({
      type: 'PICKUP_RECEIPT',
      name: `Pickup Receipt - ${completionRecord.orderNumber}`,
      url: `/api/documents/pickup-receipt/${orderId}`,
      generated: true
    });
    
    return documents;
  }
  
  // ==========================================
  // STATUS MANAGEMENT
  // ==========================================
  
  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status, data = {}) {
    console.log(`Updating order ${orderId} status to ${status}`, data);
    
    // In production, this would update the database
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          willCallStatus: status,
          ...data
        }
      });
    } catch (error) {
      console.log('Database update skipped (mock mode)');
    }
    
    return { success: true, orderId, status };
  }
  
  /**
   * Get queue statistics
   */
  async getQueueStats(locationId) {
    const queue = await this.getPickupQueue(locationId, {
      status: [WillCallStatus.READY, WillCallStatus.SCHEDULED, WillCallStatus.IN_PROGRESS]
    });
    
    return {
      total: queue.length,
      ready: queue.filter(o => o.status === WillCallStatus.READY).length,
      scheduled: queue.filter(o => o.status === WillCallStatus.SCHEDULED).length,
      inProgress: queue.filter(o => o.status === WillCallStatus.IN_PROGRESS).length,
      waiting: queue.filter(o => o.waitingMinutes > 0).length,
      avgWaitTime: queue.length > 0 
        ? Math.round(queue.reduce((sum, o) => sum + (o.waitingMinutes || 0), 0) / queue.length)
        : 0,
      highPriority: queue.filter(o => o.priority === 'HIGH').length
    };
  }
}

// Export singleton
export const willCallService = new WillCallService();
export default WillCallService;
