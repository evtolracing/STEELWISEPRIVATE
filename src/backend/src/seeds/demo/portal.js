/**
 * Demo customer-portal history for the ACME account (run the customers and
 * catalog parts first): sales orders across its divisions with shipments and
 * invoices, plus web orders placed through the store.
 * Days are relative to when the seed runs (negative = in the past).
 */
export const portalTier = { tierCode: 'B', marginFloor: 10, marginTarget: 18, paymentTerms: 'Net 30', creditLimit: 250000 };

export const portalOrders = [
  {
    id: 'portal-so-1', orderNumber: 'SO-P1001', buyer: 'ACME-AUTO', status: 'CONFIRMED', placedDays: -14, requiredDays: -8, po: 'PO-ACME-1028',
    lines: [
      { sku: 'HR-A36-PL', description: 'HR A36 Plate 0.50" – Cut 24" × 48"', qty: 4, unit: 'EA', price: 159.3 },
      { sku: 'CUT-DISC-9', description: 'Cut-Off Disc 9"', qty: 10, unit: 'EA', price: 6.49 },
    ],
    shipments: [{ n: 'SHP-P0812', status: 'DELIVERED', shippedDays: -9, deliveredDays: -8, carrier: 'FedEx Freight', bol: 'BOL-77120', ship: [4, 10], weight: [680, 12] }],
    invoice: { n: 'INV-P1001', days: -8, status: 'SENT' },
  },
  {
    id: 'portal-so-2', orderNumber: 'SO-P1002', buyer: 'ACME', status: 'PARTIAL', placedDays: -10, requiredDays: -4, po: 'PO-ACME-1031',
    lines: [
      { sku: 'HR-A572-PL', description: 'HR A572-50 Plate 1.0" – Cut 36" × 60"', qty: 6, unit: 'EA', price: 288.0 },
      { sku: 'SS-304-SH', description: 'SS 304 Sheet 0.060" × 48" × 120"', qty: 4, unit: 'EA', price: 271.95 },
    ],
    shipments: [
      { n: 'SHP-P0845', status: 'DELIVERED', shippedDays: -5, deliveredDays: -4, carrier: 'ABF Freight', bol: 'BOL-77188', ship: [6, 2], weight: [3672, 300] },
      { n: 'SHP-P0860', status: 'PENDING', scheduledDays: 2, carrier: null, bol: null, ship: [0, 2], weight: [0, 300] },
    ],
  },
  {
    id: 'portal-so-3', orderNumber: 'SO-P1003', buyer: 'ACME-AERO', status: 'CONFIRMED', placedDays: -4, requiredDays: 1, po: 'PO-ACME-1037',
    lines: [{ sku: 'AL-6061-PL', description: 'Al 6061-T6 Plate 0.50" – Cut 12" × 24"', qty: 6, unit: 'EA', price: 81.4 }],
    shipments: [{ n: 'SHP-P0870', status: 'IN_TRANSIT', shippedDays: -1, scheduledDays: 1, carrier: 'XPO Logistics', bol: 'BOL-77231', ship: [6], weight: [68] }],
  },
  {
    id: 'portal-so-4', orderNumber: 'SO-P1004', buyer: 'ACME', status: 'CONFIRMED', placedDays: -2, requiredDays: 5, po: 'PO-ACME-1041', web: 'portal-web-1',
    lines: [
      { sku: 'HR-A36-PL', description: 'Hot Rolled A36 Plate 0.75" × 48" × 96"', qty: 2, unit: 'EA', price: 392.0 },
      { sku: 'WG-25', description: 'Welding Gloves – Heavy Duty', qty: 12, unit: 'EA', price: 24.99 },
    ],
    shipments: [],
  },
  {
    id: 'portal-so-5', orderNumber: 'SO-P1005', buyer: 'ACME-AUTO', status: 'PENDING', placedDays: -1, requiredDays: 9, po: 'PO-ACME-1042',
    lines: [{ sku: 'SS-304-SH', description: 'SS 304 Sheet 0.048" – Laser profile (quote)', qty: 20, unit: 'EA', price: 145.0 }],
    shipments: [],
  },
  {
    id: 'portal-so-6', orderNumber: 'SO-P0998', buyer: 'ACME', status: 'COMPLETE', placedDays: -30, requiredDays: -25, po: 'PO-ACME-1020',
    lines: [
      { sku: 'CR-1018-BR', description: 'CR 1018 Bar 1.5" dia × 18"', qty: 30, unit: 'EA', price: 12.4 },
      { sku: 'HR-A36-PL', description: 'HR A36 Plate 0.25" × 48" × 96"', qty: 5, unit: 'EA', price: 138.6 },
    ],
    shipments: [{ n: 'SHP-P0790', status: 'DELIVERED', shippedDays: -26, deliveredDays: -24, carrier: 'Company Truck', bol: 'BOL-76980', ship: [30, 5], weight: [240, 1640] }],
    invoice: { n: 'INV-P0998', days: -25, status: 'PAID' },
  },
];

/** Web orders placed by ACME in the store. portal-web-1 was accepted into SO-P1004. */
export const portalWebOrders = [
  {
    id: 'portal-web-1', externalOrderId: 'WEB-P4001', status: 'ACCEPTED', receivedDays: -2, orderId: 'portal-so-4', shippingMethod: 'DELIVERY',
    notes: 'PO PO-ACME-1041 · Payment: ACCOUNT_TERMS',
    items: [
      { lineNumber: 1, sku: 'HR-A36-PL', description: 'Hot Rolled A36 Plate 0.75" × 48" × 96"', qty: 2, unitPrice: 392.0, extended: 784.0, priceSource: 'CONTRACT', dimensions: { thickness: 0.75, width: 48, length: 96 } },
      { lineNumber: 2, sku: 'WG-25', description: 'Welding Gloves – Heavy Duty', qty: 12, unitPrice: 24.99, extended: 299.88, priceSource: 'CONTRACT' },
    ],
  },
  {
    id: 'portal-web-2', externalOrderId: 'WEB-P4002', status: 'NEEDS_REVIEW', receivedDays: 0, shippingMethod: 'WILL_CALL', source: 'ONLINE_QUOTE',
    notes: 'QUOTE REQUEST · PO PO-ACME-1044 · Need 316L profile cut, please quote',
    items: [{ lineNumber: 1, sku: 'SS-304-SH', description: 'Stainless 304 Sheet 0.06" × 48" × 120"', qty: 3, unitPrice: 0, extended: 0, priceSource: 'REVIEW_REQUIRED', dimensions: { thickness: 0.06, width: 48, length: 120 } }],
  },
];
