/** Demo web-store orders for the online order inbox. */
const hoursAgo = (h) => new Date(Date.now() - h * 3600_000);

export const demoOnlineOrders = [
  { id: 'on-001', externalOrderId: 'WEB-90201', status: 'NEEDS_REVIEW', customerName: 'ABC Manufacturing', customerEmail: 'orders@abcmfg.com', receivedAt: hoursAgo(3), items: [{ sku: 'HR-A36-PL', description: 'A36 Plate 0.5" × 48" × 120"', qty: 4, unitPrice: 343.73 }], subtotal: 1374.92, shippingMethod: 'FLATBED', notes: 'Need by end of next week' },
  { id: 'on-002', externalOrderId: 'WEB-90205', status: 'NEEDS_REVIEW', customerName: 'Precision Parts Co', customerEmail: 'buy@precparts.com', receivedAt: hoursAgo(2), items: [{ sku: 'SS-304-SH', description: '304 SS Sheet 0.060" × 48" × 120"', qty: 10, unitPrice: 271.95 }, { sku: 'CUT-DISC-9', description: 'Cut-Off Disc 9"', qty: 25, unitPrice: 6.49 }], subtotal: 2881.75, shippingMethod: 'UPS_FREIGHT', notes: '' },
  { id: 'on-003', externalOrderId: 'WEB-90208', status: 'NEEDS_REVIEW', customerName: 'Metro Fabricators', customerEmail: 'purchasing@metrofab.com', receivedAt: hoursAgo(1), items: [{ sku: 'AL-6061-PL', description: '6061-T6 Al Plate 1.0" × 48" × 96"', qty: 2, unitPrice: 1372.8 }], subtotal: 2745.6, shippingMethod: 'WILL_CALL', notes: 'Will pick up at Detroit branch' },
  { id: 'on-004', externalOrderId: 'WEB-90199', status: 'HOLD', customerName: 'Unknown Buyer', customerEmail: 'joe@example.com', receivedAt: hoursAgo(20), items: [{ sku: 'HR-A572-PL', description: 'A572-50 Plate 2" × 96" × 240"', qty: 1, unitPrice: 9408 }], subtotal: 9408, shippingMethod: 'FLATBED', notes: 'Large order — verify credit', holdReason: 'Customer not in system — credit check required' },
];
