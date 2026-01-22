/**
 * Quick Sale Service
 * 
 * Manages simplified cash sale workflow for walk-in customers.
 * Implements the quick sale flow from design document 42-AI-ORDER-INTAKE-POS.md
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// ENUMS
// ============================================

/**
 * Quick sale customer types
 */
export const QuickSaleCustomerType = {
  WALK_IN: 'WALK_IN',       // Anonymous cash customer
  CASH_ACCOUNT: 'CASH_ACCOUNT', // System cash account
  KNOWN: 'KNOWN'            // Known customer paying cash
};

/**
 * Payment methods for quick sale
 */
export const QuickSalePaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  CHECK: 'CHECK'
};

/**
 * Quick sale status
 */
export const QuickSaleStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  COMPLETED: 'COMPLETED',
  VOIDED: 'VOIDED'
};

// ============================================
// QUICK SALE SERVICE
// ============================================

class QuickSaleService {
  
  // ==========================================
  // SALE MANAGEMENT
  // ==========================================
  
  /**
   * Create a new quick sale
   */
  createSale(terminalId, cashierId) {
    const sale = {
      id: `qs-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      terminalId,
      cashierId,
      timestamp: new Date().toISOString(),
      customerType: QuickSaleCustomerType.WALK_IN,
      customerId: null,
      items: [],
      subtotal: 0,
      taxRate: 0.0825, // Default tax rate - would come from location config
      tax: 0,
      total: 0,
      payment: null,
      status: QuickSaleStatus.IN_PROGRESS
    };
    
    return sale;
  }
  
  /**
   * Look up product by barcode/SKU
   */
  async lookupProduct(barcode) {
    try {
      // Try exact SKU match first
      let product = await prisma.product.findFirst({
        where: {
          OR: [
            { sku: barcode },
            { upc: barcode },
            { barcode: barcode }
          ],
          isActive: true
        },
        include: {
          grade: true
        }
      });
      
      if (product) {
        return this.formatProductForQuickSale(product);
      }
      
      // Try partial match
      product = await prisma.product.findFirst({
        where: {
          sku: { contains: barcode, mode: 'insensitive' },
          isActive: true
        },
        include: {
          grade: true
        }
      });
      
      if (product) {
        return this.formatProductForQuickSale(product);
      }
      
      return null;
    } catch (error) {
      console.error('Product lookup failed:', error);
      // Return mock product for development
      return this.getMockProduct(barcode);
    }
  }
  
  /**
   * Format product for quick sale display
   */
  formatProductForQuickSale(product) {
    return {
      id: product.id,
      sku: product.sku,
      barcode: product.barcode || product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      unitPrice: product.quickSalePrice || product.basePriceCwt || 0,
      priceUnit: product.priceUnit || 'EACH',
      taxable: product.taxable !== false,
      grade: product.grade?.code,
      inStock: true,
      availableQty: 999 // Would check inventory
    };
  }
  
  /**
   * Get mock product for development
   */
  getMockProduct(barcode) {
    const mockProducts = {
      'HR-001': { id: 'p1', sku: 'HR-001', name: 'HR Flat Bar 1" x 3" x 20\'', unitPrice: 45.00, priceUnit: 'EACH' },
      'CR-002': { id: 'p2', sku: 'CR-002', name: 'CR Sheet 4\' x 8\' x 0.060"', unitPrice: 125.00, priceUnit: 'EACH' },
      'RND-003': { id: 'p3', sku: 'RND-003', name: 'Round Bar 1" x 12\'', unitPrice: 28.50, priceUnit: 'EACH' },
      'SQ-004': { id: 'p4', sku: 'SQ-004', name: 'Square Tube 2" x 2" x 20\'', unitPrice: 62.00, priceUnit: 'EACH' },
      'ANG-005': { id: 'p5', sku: 'ANG-005', name: 'Angle Iron 2" x 2" x 1/4" x 20\'', unitPrice: 55.00, priceUnit: 'EACH' }
    };
    
    // Return matching mock or generate random one
    if (mockProducts[barcode]) {
      return { ...mockProducts[barcode], barcode, taxable: true, inStock: true };
    }
    
    // Generate random product
    return {
      id: `mock-${barcode}`,
      sku: barcode,
      barcode,
      name: `Product ${barcode}`,
      description: 'Quick sale item',
      unitPrice: Math.round(Math.random() * 100 + 10),
      priceUnit: 'EACH',
      taxable: true,
      inStock: true
    };
  }
  
  /**
   * Add item to sale
   */
  addItem(sale, product, quantity = 1) {
    // Check if item already exists
    const existingIndex = sale.items.findIndex(i => i.productId === product.id);
    
    if (existingIndex >= 0) {
      // Update quantity
      sale.items[existingIndex].quantity += quantity;
      sale.items[existingIndex].extended = 
        sale.items[existingIndex].quantity * sale.items[existingIndex].unitPrice;
    } else {
      // Add new item
      sale.items.push({
        lineNumber: sale.items.length + 1,
        barcode: product.barcode || product.sku,
        productId: product.id,
        sku: product.sku,
        description: product.name,
        quantity,
        unitPrice: product.unitPrice,
        extended: quantity * product.unitPrice,
        taxable: product.taxable !== false
      });
    }
    
    // Recalculate totals
    this.recalculateTotals(sale);
    
    return sale;
  }
  
  /**
   * Update item quantity
   */
  updateItemQuantity(sale, lineNumber, quantity) {
    const item = sale.items.find(i => i.lineNumber === lineNumber);
    
    if (!item) {
      return { success: false, error: 'Item not found' };
    }
    
    if (quantity <= 0) {
      // Remove item
      return this.removeItem(sale, lineNumber);
    }
    
    item.quantity = quantity;
    item.extended = quantity * item.unitPrice;
    
    this.recalculateTotals(sale);
    
    return { success: true, sale };
  }
  
  /**
   * Remove item from sale
   */
  removeItem(sale, lineNumber) {
    const index = sale.items.findIndex(i => i.lineNumber === lineNumber);
    
    if (index < 0) {
      return { success: false, error: 'Item not found' };
    }
    
    sale.items.splice(index, 1);
    
    // Renumber lines
    sale.items.forEach((item, idx) => {
      item.lineNumber = idx + 1;
    });
    
    this.recalculateTotals(sale);
    
    return { success: true, sale };
  }
  
  /**
   * Clear all items
   */
  clearItems(sale) {
    sale.items = [];
    this.recalculateTotals(sale);
    return sale;
  }
  
  /**
   * Recalculate sale totals
   */
  recalculateTotals(sale) {
    sale.subtotal = sale.items.reduce((sum, item) => sum + item.extended, 0);
    
    // Calculate tax on taxable items
    const taxableAmount = sale.items
      .filter(i => i.taxable)
      .reduce((sum, item) => sum + item.extended, 0);
    
    sale.tax = Math.round(taxableAmount * sale.taxRate * 100) / 100;
    sale.total = Math.round((sale.subtotal + sale.tax) * 100) / 100;
    
    return sale;
  }
  
  // ==========================================
  // PAYMENT PROCESSING
  // ==========================================
  
  /**
   * Process payment
   */
  async processPayment(sale, paymentData) {
    const { method, amountTendered, reference } = paymentData;
    
    if (!method) {
      return { success: false, error: 'Payment method required' };
    }
    
    if (sale.items.length === 0) {
      return { success: false, error: 'No items in sale' };
    }
    
    // Validate payment
    const validation = this.validatePayment(sale, method, amountTendered);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Calculate change for cash
    let change = 0;
    if (method === QuickSalePaymentMethod.CASH) {
      change = Math.round((amountTendered - sale.total) * 100) / 100;
    }
    
    // Create payment record
    sale.payment = {
      method,
      amountTendered: amountTendered || sale.total,
      change,
      reference: reference || null,
      processedAt: new Date().toISOString()
    };
    
    // For card payments, would integrate with payment terminal
    if (method === QuickSalePaymentMethod.CARD) {
      const cardResult = await this.processCardPayment(sale, paymentData);
      if (!cardResult.success) {
        return cardResult;
      }
      sale.payment.reference = cardResult.transactionId;
      sale.payment.cardLast4 = cardResult.cardLast4;
    }
    
    sale.status = QuickSaleStatus.COMPLETED;
    
    // Save to database
    await this.saveSale(sale);
    
    return {
      success: true,
      sale,
      change,
      receipt: this.generateReceipt(sale)
    };
  }
  
  /**
   * Validate payment
   */
  validatePayment(sale, method, amountTendered) {
    switch (method) {
      case QuickSalePaymentMethod.CASH:
        if (!amountTendered || amountTendered < sale.total) {
          return { valid: false, error: 'Insufficient payment amount' };
        }
        break;
        
      case QuickSalePaymentMethod.CARD:
        // Card validation handled by terminal
        break;
        
      case QuickSalePaymentMethod.CHECK:
        // Check validation - would verify check acceptance
        break;
        
      default:
        return { valid: false, error: 'Invalid payment method' };
    }
    
    return { valid: true };
  }
  
  /**
   * Process card payment (mock)
   */
  async processCardPayment(sale, paymentData) {
    // In production, this would integrate with payment terminal
    // Simulate card processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      cardLast4: '1234',
      approvalCode: 'A12345'
    };
  }
  
  /**
   * Save sale to database
   */
  async saveSale(sale) {
    try {
      // In production, would save to QuickSale table
      console.log('Saving quick sale:', sale.id);
      
      // Also create inventory transactions
      for (const item of sale.items) {
        console.log(`Inventory adjustment: ${item.sku} qty: -${item.quantity}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save sale:', error);
      return { success: false, error: 'Failed to save sale' };
    }
  }
  
  // ==========================================
  // RECEIPT GENERATION
  // ==========================================
  
  /**
   * Generate receipt data
   */
  generateReceipt(sale) {
    return {
      type: 'QUICK_SALE_RECEIPT',
      saleId: sale.id,
      terminalId: sale.terminalId,
      cashierId: sale.cashierId,
      timestamp: sale.timestamp,
      completedAt: sale.payment?.processedAt || new Date().toISOString(),
      items: sale.items.map(item => ({
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        extended: item.extended
      })),
      subtotal: sale.subtotal,
      taxRate: sale.taxRate,
      tax: sale.tax,
      total: sale.total,
      payment: {
        method: sale.payment?.method,
        amountTendered: sale.payment?.amountTendered,
        change: sale.payment?.change,
        cardLast4: sale.payment?.cardLast4
      },
      footer: {
        returnPolicy: 'Returns accepted within 30 days with receipt',
        taxId: 'TAX-ID-12345678'
      }
    };
  }
  
  /**
   * Format receipt for printing
   */
  formatReceiptForPrint(receipt) {
    const lines = [];
    const width = 40;
    
    // Header
    lines.push('='.repeat(width));
    lines.push('          STEELWISE');
    lines.push('      Quick Sale Receipt');
    lines.push('='.repeat(width));
    lines.push(`Date: ${new Date(receipt.timestamp).toLocaleString()}`);
    lines.push(`Sale #: ${receipt.saleId}`);
    lines.push('-'.repeat(width));
    
    // Items
    for (const item of receipt.items) {
      const desc = item.description.substring(0, 20);
      const qty = `${item.quantity}x`;
      const price = `$${item.extended.toFixed(2)}`;
      lines.push(`${desc.padEnd(20)} ${qty.padStart(5)} ${price.padStart(12)}`);
    }
    
    lines.push('-'.repeat(width));
    
    // Totals
    lines.push(`${'Subtotal:'.padEnd(28)} $${receipt.subtotal.toFixed(2).padStart(10)}`);
    lines.push(`${'Tax:'.padEnd(28)} $${receipt.tax.toFixed(2).padStart(10)}`);
    lines.push(`${'TOTAL:'.padEnd(28)} $${receipt.total.toFixed(2).padStart(10)}`);
    
    lines.push('-'.repeat(width));
    
    // Payment
    lines.push(`Payment: ${receipt.payment.method}`);
    if (receipt.payment.method === 'CASH') {
      lines.push(`Tendered: $${receipt.payment.amountTendered.toFixed(2)}`);
      lines.push(`Change: $${receipt.payment.change.toFixed(2)}`);
    } else if (receipt.payment.cardLast4) {
      lines.push(`Card: ****${receipt.payment.cardLast4}`);
    }
    
    lines.push('='.repeat(width));
    lines.push('      Thank you!');
    lines.push('='.repeat(width));
    
    return lines.join('\n');
  }
  
  // ==========================================
  // VOID / REFUND
  // ==========================================
  
  /**
   * Void a sale
   */
  async voidSale(saleId, reason, employeeId) {
    // In production, would update database
    console.log(`Voiding sale ${saleId}: ${reason}`);
    
    return {
      success: true,
      saleId,
      voidedAt: new Date().toISOString(),
      voidedBy: employeeId,
      reason
    };
  }
  
  // ==========================================
  // QUICK AMOUNTS
  // ==========================================
  
  /**
   * Get quick cash amounts for payment
   */
  getQuickCashAmounts(total) {
    const amounts = [];
    
    // Exact amount
    amounts.push({ label: 'Exact', amount: total });
    
    // Round up amounts
    const roundUps = [1, 5, 10, 20, 50, 100];
    for (const round of roundUps) {
      const roundedUp = Math.ceil(total / round) * round;
      if (roundedUp > total && roundedUp <= total + round) {
        amounts.push({ label: `$${roundedUp}`, amount: roundedUp });
      }
    }
    
    // Common bills
    const bills = [10, 20, 50, 100];
    for (const bill of bills) {
      if (bill >= total && !amounts.find(a => a.amount === bill)) {
        amounts.push({ label: `$${bill}`, amount: bill });
      }
    }
    
    return amounts.slice(0, 6); // Max 6 quick amounts
  }
  
  // ==========================================
  // STATS & REPORTING
  // ==========================================
  
  /**
   * Get daily quick sale stats
   */
  async getDailyStats(terminalId, date = new Date()) {
    // In production, would query database
    return {
      date: date.toISOString().split('T')[0],
      terminalId,
      transactionCount: 0,
      totalSales: 0,
      totalTax: 0,
      cashSales: 0,
      cardSales: 0,
      checkSales: 0,
      voidCount: 0,
      avgTransactionValue: 0
    };
  }
}

// Export singleton
export const quickSaleService = new QuickSaleService();
export default QuickSaleService;
