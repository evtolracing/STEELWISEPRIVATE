/**
 * What the pick list, the packing list and the bill of lading print (Phase 8; findings F-011, U-036, N-014).
 *
 * One answer serves all three, built only from what is on file:
 *   - who ships: the branch's own name and address,
 *   - who receives: the customer and the ship-to address on the order,
 *   - what is on it: each line, and under it the stock items with their heat,
 *       before dispatch: the stock reserved for the line, in the order it will be taken (the pick list),
 *       after dispatch:  the stock that actually left (the packing list and the bill of lading).
 * Nothing is filled in. A fact that is not on file comes back empty and is named in `missing`, so the
 * paper shows a blank to be written in by hand and never an invented address, weight or number.
 */
import prisma from './db.js';
import { acrossBranches } from './branchScope.js';

const num = (v) => (v == null ? null : Number(v));
const round4 = (v) => Math.round((v + Number.EPSILON) * 10000) / 10000;
const OPEN = ['PENDING', 'LOADING'];

const STOCK = { select: { id: true, coilNumber: true, form: true, binLocation: true, thicknessIn: true, widthIn: true, lengthIn: true, heat: { select: { heatNumber: true } }, grade: { select: { code: true } }, inventory: { select: { unit: true, locationId: true } } } };
const stockRow = (coil, qty, unit) => ({
  stockItemId: coil?.id || null, tag: coil?.coilNumber || null, heatNumber: coil?.heat?.heatNumber || null, grade: coil?.grade?.code || null,
  form: coil?.form || null, bin: coil?.binLocation || null, quantity: round4(qty), unit: unit || coil?.inventory?.unit || null,
});

/** Pure: the reserved stock a line will draw, oldest reservation first, up to the quantity on the shipment. */
export function pickPlan(allocations, qty) {
  let left = Number(qty) || 0;
  const rows = [];
  for (const a of allocations) {
    if (left <= 1e-9) break;
    const take = Math.min(left, Number(a.qtyAllocated) || 0);
    if (take <= 0) continue;
    rows.push({ allocation: a, quantity: round4(take) });
    left -= take;
  }
  return { rows, short: left > 1e-6 ? round4(left) : 0 };
}

export async function shipmentDocuments(id) {
  // Found under the reader's own branch rule: the dock it leaves from, or the branch that sold the order.
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    select: {
      id: true, shipmentNumber: true, status: true, bolNumber: true, carrierName: true, truckNumber: true, driverName: true, driverPhone: true,
      scheduledDate: true, shippedAt: true, deliveredAt: true, totalWeightLb: true, notes: true, podSignature: true, noPodReason: true, orderId: true, fromLocationId: true,
      carrier: { select: { name: true } },
      fromLocation: { select: { code: true, name: true, addressLine1: true, city: true, state: true, postalCode: true, country: true } },
      items: { orderBy: { createdAt: 'asc' }, select: { id: true, orderLineId: true, qtyShipped: true, weightLb: true } },
    },
  });
  if (!shipment) return null;
  // The rest is read whichever branch sold the order: the paper travels with the truck.
  return acrossBranches(async () => {
    const lineIds = [...new Set(shipment.items.map((i) => i.orderLineId))];
    const [order, allocations, moved, packages] = await Promise.all([
      prisma.order.findUnique({
        where: { id: shipment.orderId },
        select: {
          orderNumber: true, poReference: true, freightTerms: true, paymentTerms: true, requiredDate: true,
          shipToAddress: true, shipToCity: true, shipToState: true, shipToZip: true,
          buyer: { select: { name: true, code: true, phone: true } }, location: { select: { name: true, code: true } },
          lines: { where: { id: { in: lineIds } }, orderBy: { lineNumber: 'asc' }, select: { id: true, lineNumber: true, description: true, unit: true, qtyOrdered: true, qtyShipped: true, lineStatus: true } },
        },
      }),
      prisma.orderLineAllocation.findMany({ where: { orderLineId: { in: lineIds } }, orderBy: { allocatedAt: 'asc' }, select: { orderLineId: true, qtyAllocated: true, coil: STOCK } }),
      prisma.materialMovement.findMany({ where: { shipmentId: shipment.id, movementType: 'SHIP' }, orderBy: { createdAt: 'asc' }, select: { orderLineId: true, qtyMoved: true, unit: true, coil: STOCK } }),
      prisma.package.findMany({
        where: { orderLineId: { in: lineIds } }, orderBy: { createdAt: 'asc' }, take: 500,
        select: { packageId: true, packageType: true, status: true, orderLineId: true, netWeightLbs: true, grossWeightLbs: true, sealId: true, packageItems: { select: { pieces: true } }, dropTags: { where: { status: { not: 'VOID' } }, select: { dropTagId: true, status: true } } },
      }),
    ]);
    const left = OPEN.includes(shipment.status) || shipment.status === 'CANCELLED';
    const lines = shipment.items.map((item) => {
      const line = order?.lines.find((l) => l.id === item.orderLineId);
      const qty = num(item.qtyShipped) || 0;
      let stock; let shortOfReserved = 0;
      if (left) {
        const plan = pickPlan(allocations.filter((a) => a.orderLineId === item.orderLineId), qty);
        stock = plan.rows.map((r) => ({ ...stockRow(r.allocation.coil, r.quantity), atThisDock: r.allocation.coil?.inventory?.locationId === shipment.fromLocationId }));
        shortOfReserved = plan.short;
      } else {
        // Movements written before Phase 8 do not name their line; a shipment with one line still reads right.
        stock = moved.filter((m) => m.orderLineId === item.orderLineId || (!m.orderLineId && lineIds.length === 1)).map((m) => stockRow(m.coil, num(m.qtyMoved), m.unit));
      }
      const ordered = num(line?.qtyOrdered) || 0; const shippedSoFar = num(line?.qtyShipped) || 0;
      return {
        orderLineId: item.orderLineId, lineNumber: line?.lineNumber ?? null, description: line?.description || null, unit: line?.unit || null,
        quantity: qty, weightLb: num(item.weightLb), quantityOrdered: ordered,
        // Before dispatch this shipment is not yet in "shipped so far".
        quantityStillToShip: round4(Math.max(0, ordered - shippedSoFar - (left && shipment.status !== 'CANCELLED' ? qty : 0))),
        stock, shortOfReserved,
      };
    });
    const weights = lines.map((l) => l.weightLb);
    const lineWeight = weights.length && weights.every((x) => x != null) ? round4(weights.reduce((a, b) => a + b, 0)) : null;
    const shipTo = {
      name: order?.buyer?.name || null, phone: order?.buyer?.phone || null,
      address: order?.shipToAddress || null, city: order?.shipToCity || null, state: order?.shipToState || null, postalCode: order?.shipToZip || null,
    };
    const from = shipment.fromLocation;
    const missing = [];
    if (!from?.addressLine1 || !from?.city) missing.push('The branch this ships from has no street address on file.');
    if (!shipTo.address || !shipTo.city) missing.push('The order has no ship-to address.');
    if (!shipment.carrierName && !shipment.carrier?.name) missing.push('No carrier is named.');
    if (!shipment.bolNumber) missing.push('No bill of lading number has been entered.');
    if (num(shipment.totalWeightLb) == null && lineWeight == null) missing.push('No weight is recorded for this shipment.');
    if (lines.some((l) => l.shortOfReserved > 0)) missing.push('Less stock is reserved than this shipment carries, so the pick list is incomplete.');
    if (lines.some((l) => l.stock.some((x) => x.atThisDock === false))) missing.push('Some reserved stock stands at another branch and cannot leave from this dock.');
    return {
      stage: left ? 'BEFORE_DISPATCH' : 'AFTER_DISPATCH',
      shipment: {
        id: shipment.id, shipmentNumber: shipment.shipmentNumber, status: shipment.status, bolNumber: shipment.bolNumber || null,
        carrier: shipment.carrierName || shipment.carrier?.name || null, truckNumber: shipment.truckNumber || null, driverName: shipment.driverName || null,
        scheduledDate: shipment.scheduledDate, shippedAt: shipment.shippedAt, deliveredAt: shipment.deliveredAt, notes: shipment.notes || null,
        receivedBy: shipment.podSignature || null, noSignatureReason: shipment.noPodReason || null,
      },
      shipFrom: { name: from?.name || null, code: from?.code || null, address: from?.addressLine1 || null, city: from?.city || null, state: from?.state || null, postalCode: from?.postalCode || null, country: from?.country || null },
      shipTo,
      order: { orderNumber: order?.orderNumber || null, customerPo: order?.poReference || null, freightTerms: order?.freightTerms || null, requiredDate: order?.requiredDate || null, soldBy: order?.location ? `${order.location.name} (${order.location.code})` : null },
      lines,
      packages: packages.map((p) => ({ packageId: p.packageId, type: p.packageType, status: p.status, lineNumber: order?.lines.find((l) => l.id === p.orderLineId)?.lineNumber ?? null, pieces: p.packageItems.reduce((a, i) => a + (i.pieces || 0), 0), netWeightLb: num(p.netWeightLbs), grossWeightLb: num(p.grossWeightLbs), seal: p.sealId || null, tags: p.dropTags.map((t) => t.dropTagId) })),
      totals: { lines: lines.length, weightLb: num(shipment.totalWeightLb) ?? lineWeight, weightFrom: num(shipment.totalWeightLb) != null ? 'entered on the shipment' : lineWeight != null ? 'added up from the lines' : null, packages: packages.length },
      missing,
    };
  });
}
