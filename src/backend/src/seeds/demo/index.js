/**
 * Demo data loader. Safe to run more than once: every record is upserted by
 * a stable key, so re-running updates instead of duplicating.
 *
 *   npm run db:seed:demo                    (terminal, all parts)
 *   POST /api/admin/seed-demo?part=<name>    (signed in as an owner or super
 *                                            admin; GET /api/admin/seed-demo
 *                                            lists the parts)
 *
 * This grows as modules move off in-memory data; Phase 1 ends with one
 * realistic seed for the whole system.
 */
import prisma from '../../lib/db.js';
import { executiveDecisions } from './executiveDecisions.js';
import { buildOrderHubDemoData } from './orderHubData.js';
import { exceptionEvents } from './exceptionEvents.js';
import { buildInventoryV1DemoData } from './inventoryV1Data.js';
import {
  saveCatalogItem, saveSite, saveUnit, saveTransfer, saveRfidEvent,
} from '../../routes/inventoryV1Store.js';
import { demoPriceLevels, demoTaxRates, demoProcesses, demoTemplates } from './intakeSetup.js';
import { demoGrades, demoProducts, demoStock } from './catalog.js';
import { demoOnlineOrders } from './onlineOrders.js';
import { demoRemnants } from './remnants.js';
import { demoStoreListings } from './storeListings.js';
import { portalTier, portalOrders, portalWebOrders } from './portal.js';
import { demoRecipes, demoRoutingTemplates } from './processingRecipes.js';
import { demoOwner, demoLocation, demoWorkCenters, demoOrders, demoJobs } from './shopFloor.js';

const customers = [
  {
    code: 'ACME',
    name: 'Acme Manufacturing',
    type: 'OEM',
    city: 'Cleveland',
    state: 'OH',
    postalCode: '44114',
    phone: '216-555-0140',
    paymentTerms: 'NET30',
    divisions: [
      {
        code: 'ACME-AUTO',
        name: 'Acme Manufacturing – Automotive',
        city: 'Toledo',
        state: 'OH',
        postalCode: '43604',
        addresses: [
          { key: 'ACME-AUTO-DOCK', addressName: 'Toledo Plant Dock 3', addressLine1: '1200 Industrial Pkwy', city: 'Toledo', state: 'OH', postalCode: '43604', isPrimary: true },
        ],
      },
      {
        code: 'ACME-AERO',
        name: 'Acme Manufacturing – Aerospace',
        city: 'Wichita',
        state: 'KS',
        postalCode: '67202',
        taxExempt: true,
        addresses: [
          { key: 'ACME-AERO-RCV', addressName: 'Wichita Receiving', addressLine1: '88 Airport Rd', city: 'Wichita', state: 'KS', postalCode: '67202', isPrimary: true },
        ],
      },
    ],
    addresses: [
      { key: 'ACME-HQ-BILL', addressType: 'BILLING', addressName: 'Accounts Payable', addressLine1: '500 Lakeside Ave', city: 'Cleveland', state: 'OH', postalCode: '44114', isPrimary: true },
      { key: 'ACME-HQ-SHARED', addressName: 'Central Warehouse (all divisions)', addressLine1: '4100 E 49th St', city: 'Cleveland', state: 'OH', postalCode: '44125', shared: true, allDivisions: true },
    ],
  },
];

async function upsertOrg(data, parentId = null) {
  const { divisions, addresses, ...fields } = data;
  const org = await prisma.organization.upsert({
    where: { code: fields.code },
    update: { ...fields, type: fields.type || 'OEM', parentId },
    create: { ...fields, type: fields.type || 'OEM', parentId },
  });

  for (const { key, ...address } of addresses || []) {
    // Addresses have no natural unique key, so the seed uses a fixed id.
    const id = `seed-address-${key.toLowerCase()}`;
    await prisma.address.upsert({
      where: { id },
      update: { ...address, organizationId: org.id },
      create: { id, ...address, organizationId: org.id },
    });
  }

  for (const division of divisions || []) {
    await upsertOrg({ ...division, type: data.type }, org.id);
  }
  return org;
}

async function seedCustomers() {
  for (const customer of customers) await upsertOrg(customer);
  console.log(`  customers: ${customers.length} with divisions and ship-tos`);
}

async function seedExecutive() {
  for (const d of executiveDecisions) {
    const data = {
      type: d.type,
      title: d.title,
      description: d.description,
      decisionMaker: d.decisionMaker,
      role: d.role,
      status: d.status,
      scenarioId: d.scenarioId,
      predictedOutcome: d.predictedOutcome ?? undefined,
      actualOutcome: d.actualOutcome ?? undefined,
      variance: d.variance ?? undefined,
      conditions: d.conditions || [],
      aiRecommendation: d.aiRecommendation,
      aiConfidence: d.aiConfidence,
      decidedAt: new Date(d.timestamp),
    };
    await prisma.executiveDecision.upsert({
      where: { decisionNumber: d.id },
      update: data,
      create: { decisionNumber: d.id, ...data },
    });
  }

  await prisma.simulationScenario.upsert({
    where: { id: 'SCENARIO-001' },
    update: {},
    create: {
      id: 'SCENARIO-001',
      name: 'Accept RFQ-2026-089',
      status: 'READY',
      changes: [{ type: 'DEMAND', description: 'Add 15,000 lbs 4140 Round Bar order', value: '+15000 lbs' }],
    },
  });
  console.log(`  executive: ${executiveDecisions.length} decisions, 1 scenario`);
}

async function seedOrderHub() {
  const { contacts, rfqs, quotes, orders, jobs } = buildOrderHubDemoData();
  const upsert = (model, id, data) =>
    prisma[model].upsert({ where: { id }, update: data, create: { id, ...data } });
  const when = value => (value ? new Date(value) : undefined);

  for (const { id, createdAt, ...c } of contacts) {
    await upsert('intakeContact', id, { ...c, createdAt: when(createdAt) });
  }
  for (const { id, createdAt, contact, ...r } of rfqs) {
    await upsert('intakeRfq', id, { ...r, createdAt: when(createdAt) });
  }
  for (const { id, createdAt, contact, rfq, ...q } of quotes) {
    await upsert('intakeQuote', id, { ...q, createdAt: when(createdAt) });
  }
  for (const { id, createdAt, contact, quote, ...o } of orders) {
    await upsert('intakeOrder', id, { ...o, createdAt: when(createdAt) });
  }
  for (const { id, orderId, orderLineId, locationId, division, status, createdAt, ...details } of jobs) {
    await upsert('intakeJob', id, {
      orderId, orderLineId, locationId, division, status, details, createdAt: when(createdAt),
    });
  }
  console.log(`  orderhub: ${contacts.length} contacts, ${rfqs.length} RFQs, ${quotes.length} quotes, ${orders.length} orders, ${jobs.length} jobs`);
  return { contacts: contacts.length, rfqs: rfqs.length, quotes: quotes.length, orders: orders.length, jobs: jobs.length };
}

async function seedExceptions() {
  const now = Date.now();
  for (const { id, minutesAgo, ...fields } of exceptionEvents) {
    const data = {
      ...fields,
      occurredAt: new Date(now - minutesAgo * 60 * 1000),
      acknowledgedAt: fields.acknowledged ? new Date(now - (minutesAgo - 5) * 60 * 1000) : null,
      acknowledgedBy: fields.acknowledged ? 'demo' : null,
    };
    await prisma.exceptionEvent.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  console.log(`  exceptions: ${exceptionEvents.length}`);
  return exceptionEvents.length;
}

async function seedShopFloor() {
  const now = Date.now();
  const hours = (h) => new Date(now + h * 60 * 60 * 1000);
  const owner = await prisma.organization.upsert({ where: { code: demoOwner.code }, update: demoOwner, create: demoOwner });
  const locData = { ...demoLocation, ownerId: owner.id };
  const location = await prisma.location.upsert({ where: { code: demoLocation.code }, update: locData, create: locData });

  for (const { id, division, ...wc } of demoWorkCenters) {
    const data = { ...wc, locationId: location.id, isActive: true, capacity: { division, shiftCapacityMinutesPerDay: 480 } };
    await prisma.workCenter.upsert({ where: { id }, update: data, create: { id, ...data } });
  }

  // Sales orders need a creator; use the oldest user. Without one, jobs get no due date.
  const creator = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  const orderIds = new Set();
  if (creator) {
    for (const { id, dueInHours, ...o } of demoOrders) {
      const data = { ...o, orderType: 'SO', status: 'CONFIRMED', sellerId: owner.id, promisedDate: hours(dueInHours), requiredDate: hours(dueInHours), createdById: creator.id };
      await prisma.order.upsert({ where: { id }, update: data, create: { id, ...data } });
      orderIds.add(id);
    }
  }

  // Jobs go back to the unplanned queue on every run; start/end only carry the run time.
  for (const { id, minutes, orderId, ...job } of demoJobs) {
    const data = {
      ...job,
      orderId: orderIds.has(orderId) ? orderId : null,
      status: 'SCHEDULED',
      workCenterId: null,
      scheduledStart: hours(0),
      scheduledEnd: hours(minutes / 60),
    };
    await prisma.job.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  console.log(`  shop floor: ${demoWorkCenters.length} work centers, ${orderIds.size} orders, ${demoJobs.length} jobs`);
  return { workCenters: demoWorkCenters.length, orders: orderIds.size, jobs: demoJobs.length };
}

async function seedInventoryV1() {
  const { catalogItems, locations, inventoryUnits, transfers, rfidEvents } = buildInventoryV1DemoData();
  for (const item of catalogItems) await saveCatalogItem(item);
  for (const site of locations) await saveSite(site);
  for (const unit of inventoryUnits) await saveUnit(unit);
  for (const transfer of transfers) await saveTransfer(transfer);
  for (const event of rfidEvents) await saveRfidEvent(event);
  console.log(`  v1 inventory: ${catalogItems.length} materials, ${locations.length} sites, ${inventoryUnits.length} units, ${transfers.length} transfers, ${rfidEvents.length} RFID scans`);
  return { materials: catalogItems.length, sites: locations.length, units: inventoryUnits.length, transfers: transfers.length, rfidScans: rfidEvents.length };
}

async function seedCatalog() {
  const grades = {};
  for (const g of demoGrades) {
    // Keep a grade that already exists as it is; only fill in missing ones.
    grades[g.code] = await prisma.grade.upsert({ where: { code: g.code }, update: {}, create: g });
  }

  const products = {};
  for (const { grade, price, priceUnit = 'CWT', ...p } of demoProducts) {
    const data = {
      ...p,
      gradeId: grade ? grades[grade].id : null,
      specStandard: grade ? grades[grade].specStandard : null,
      priceUnit,
      basePriceCwt: priceUnit === 'CWT' ? Math.round(price * 100 * 100) / 100 : price,
      isRemnant: Boolean(p.isRemnant),
      isActive: true,
    };
    products[p.sku] = await prisma.product.upsert({ where: { sku: p.sku }, update: data, create: data });
  }

  // Stock needs a location, a mill/owner and a creating user.
  const creator = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  const location = await prisma.location.findUnique({ where: { code: demoLocation.code } });
  const owner = await prisma.organization.findUnique({ where: { code: demoOwner.code } });
  let stocked = 0;
  if (creator && location && owner) {
    for (const s of demoStock) {
      const product = products[s.sku];
      const heatNumber = `DEMO-H-${s.coilNumber.slice(-4)}`;
      const heatData = { millId: owner.id, gradeId: product.gradeId, castDate: new Date('2026-06-01'), createdById: creator.id };
      const heat = await prisma.heat.upsert({ where: { heatNumber }, update: heatData, create: { heatNumber, ...heatData } });
      const coilData = {
        heatId: heat.id, productId: product.id, gradeId: product.gradeId, ownerId: owner.id, form: s.form,
        thicknessIn: s.thicknessIn, widthIn: s.widthIn, lengthIn: s.lengthIn,
        grossWeightLb: s.weight, netWeightLb: s.weight, status: 'AVAILABLE', qcStatus: 'PASSED',
        locationId: location.id, unitCost: s.unitCost, createdById: creator.id,
      };
      const coil = await prisma.coil.upsert({ where: { coilNumber: s.coilNumber }, update: coilData, create: { coilNumber: s.coilNumber, ...coilData } });
      const invData = { locationId: location.id, qtyOnHand: s.weight, qtyAvailable: s.weight, qtyAllocated: 0, qtyOnHold: 0, unit: 'LB', unitCost: s.unitCost, status: 'ACTIVE' };
      await prisma.inventory.upsert({ where: { coilId: coil.id }, update: invData, create: { coilId: coil.id, ...invData } });
      stocked++;
    }
  }
  console.log(`  catalog: ${demoGrades.length} grades, ${demoProducts.length} products, ${stocked} stock items`);
  return { grades: demoGrades.length, products: demoProducts.length, stock: stocked };
}

/**
 * Loads all demo data. Returns a summary of what was loaded.
 */
async function seedIntakeSetup() {
  for (const { code, ...l } of demoPriceLevels) {
    await prisma.priceLevel.upsert({ where: { code }, update: l, create: { code, ...l } });
  }
  for (const { state, rate } of demoTaxRates) {
    await prisma.salesTaxRate.upsert({ where: { state }, update: { rate }, create: { state, rate } });
  }
  for (const { id, ...op } of demoProcesses) {
    await prisma.processingOperation.upsert({ where: { id }, update: op, create: { id, ...op } });
  }
  for (const { id, ...t } of demoTemplates) {
    await prisma.processingTemplate.upsert({ where: { id }, update: t, create: { id, ...t } });
  }
  console.log(`  intake set-up: ${demoPriceLevels.length} price levels, ${demoTaxRates.length} tax rates, ${demoProcesses.length} operations, ${demoTemplates.length} templates`);
  return { priceLevels: demoPriceLevels.length, taxRates: demoTaxRates.length, operations: demoProcesses.length, templates: demoTemplates.length };
}

/**
 * The demo data set in parts. Each part is safe to re-run on its own, and the
 * parts are small enough to finish inside one serverless request. Order
 * matters only for "catalog", which stocks the location "shop-floor" creates.
 */
/** Reset the demo web orders to their starting state (re-running reopens them). */
async function seedOnlineOrders() {
  for (const { id, ...o } of demoOnlineOrders) {
    const data = { ...o, holdReason: o.holdReason || null, rejectReason: null, internalOrderId: null, decidedAt: null, customerId: null };
    await prisma.onlineOrder.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  return demoOnlineOrders.length;
}

/** Remnant pieces; re-running resets their age, reservations and quantities. */
async function seedRemnants() {
  for (const { id, ageDays, ...r } of demoRemnants) {
    const cut = new Date(Date.now() - ageDays * 86400000);
    const data = { ...r, cutDate: cut, receivedDate: cut, reserved: false, reservedFor: null, reservedAt: null };
    await prisma.remnant.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  return demoRemnants.length;
}

/** Online-store listing details for the demo catalog products (run the catalog part first). */
async function seedStoreListings() {
  let n = 0;
  for (const { sku, ...l } of demoStoreListings) {
    const product = await prisma.product.findUnique({ where: { sku }, select: { id: true } });
    if (!product) continue;
    const data = { visible: true, featured: false, ...l };
    await prisma.storeListing.upsert({ where: { productId: product.id }, update: data, create: { productId: product.id, ...data } });
    n += 1;
  }
  return n;
}

/** Customer-portal history for ACME (run customers and catalog first). Re-running resets it. */
async function seedPortal() {
  const days = (d) => new Date(Date.now() + d * 86400000);
  const orgs = await prisma.organization.findMany({ where: { code: { in: ['ACME', 'ACME-AUTO', 'ACME-AERO'] } } });
  const org = Object.fromEntries(orgs.map((o) => [o.code, o]));
  if (!org.ACME) throw new Error('Run the customers part first (ACME account missing)');
  const creator = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (!creator) throw new Error('No user to own the demo orders');
  const location = await prisma.location.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  const products = await prisma.product.findMany({ select: { id: true, sku: true, gradeId: true } });
  const bySku = new Map(products.map((p) => [p.sku, p]));

  await prisma.customerPricingTier.upsert({ where: { customerId: org.ACME.id }, update: portalTier, create: { customerId: org.ACME.id, ...portalTier } });

  const ids = portalOrders.map((o) => o.id);
  await prisma.onlineOrder.deleteMany({ where: { id: { in: portalWebOrders.map((w) => w.id) } } });
  await prisma.shipmentItem.deleteMany({ where: { shipment: { orderId: { in: ids } } } });
  await prisma.shipment.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.invoice.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.orderLine.deleteMany({ where: { orderId: { in: ids } } });

  let shipments = 0;
  for (const o of portalOrders) {
    const buyer = org[o.buyer] || org.ACME;
    const subtotal = o.lines.reduce((s, l) => s + l.qty * l.price, 0);
    const tax = buyer.taxExempt ? 0 : Math.round(subtotal * 0.06 * 100) / 100;
    const data = {
      orderNumber: o.orderNumber, orderType: 'SO', status: o.status, buyerId: buyer.id,
      orderDate: days(o.placedDays), requiredDate: days(o.requiredDays), promisedDate: days(o.requiredDays),
      subtotal, taxAmount: tax, totalAmount: Math.round((subtotal + tax) * 100) / 100,
      poReference: o.po, paymentTerms: 'Net 30', createdById: creator.id,
      shipToAddress: buyer.address || null, shipToCity: buyer.city || null, shipToState: buyer.state || null, shipToZip: buyer.postalCode || null,
    };
    await prisma.order.upsert({ where: { id: o.id }, update: data, create: { id: o.id, ...data } });
    const lineIds = [];
    for (const [i, l] of o.lines.entries()) {
      const p = bySku.get(l.sku);
      const shipped = o.shipments.reduce((s, sh) => s + (sh.status === 'PENDING' ? 0 : sh.ship[i] || 0), 0);
      const line = await prisma.orderLine.create({
        data: {
          id: `${o.id}-L${i + 1}`, orderId: o.id, lineNumber: i + 1, productId: p?.id || null, gradeId: p?.gradeId || null,
          description: l.description, qtyOrdered: l.qty, qtyShipped: shipped, unit: l.unit, unitPrice: l.price, priceUnit: 'EACH',
          extendedPrice: Math.round(l.qty * l.price * 100) / 100,
          lineStatus: shipped >= l.qty ? 'COMPLETE' : shipped > 0 ? 'PARTIAL' : 'OPEN',
        },
      });
      lineIds.push(line.id);
    }
    if (location) {
      for (const sh of o.shipments) {
        const weight = sh.weight.reduce((s, w) => s + w, 0);
        await prisma.shipment.create({
          data: {
            id: `${o.id}-${sh.n}`, shipmentNumber: sh.n, orderId: o.id, fromLocationId: location.id, carrierName: sh.carrier, status: sh.status,
            scheduledDate: sh.scheduledDays != null ? days(sh.scheduledDays) : sh.deliveredDays != null ? days(sh.deliveredDays) : null,
            shippedAt: sh.shippedDays != null ? days(sh.shippedDays) : null, deliveredAt: sh.deliveredDays != null ? days(sh.deliveredDays) : null,
            totalWeightLb: weight, bolNumber: sh.bol, podCaptured: sh.status === 'DELIVERED',
            items: { create: sh.ship.map((q, i) => ({ orderLineId: lineIds[i], qtyShipped: q, weightLb: sh.weight[i] })).filter((it) => Number(it.qtyShipped) > 0) },
          },
        });
        shipments += 1;
      }
    }
    if (o.invoice) {
      await prisma.invoice.create({
        data: {
          id: `${o.id}-inv`, invoiceNumber: o.invoice.n, orderId: o.id, invoiceDate: days(o.invoice.days), dueDate: days(o.invoice.days + 30),
          subtotal, taxAmount: tax, totalAmount: data.totalAmount, paidAmount: o.invoice.status === 'PAID' ? data.totalAmount : 0, status: o.invoice.status,
        },
      });
    }
  }

  for (const { id, receivedDays, orderId, source, ...w } of portalWebOrders) {
    const subtotal = w.items.reduce((s, i) => s + i.extended, 0);
    await prisma.onlineOrder.create({
      data: {
        id, ...w, source: source || 'ONLINE', customerName: org.ACME.name, customerEmail: 'purchasing@acme.example', customerId: org.ACME.id,
        subtotal, receivedAt: days(receivedDays), internalOrderId: orderId || null, decidedAt: orderId ? days(receivedDays) : null,
      },
    });
  }
  return { orders: portalOrders.length, shipments, webOrders: portalWebOrders.length };
}

/** Processing recipes and routing templates (re-running restores the demo values). */
async function seedProcessingRecipes() {
  for (const { id, ...r } of demoRecipes) {
    await prisma.processingRecipe.upsert({ where: { id }, update: r, create: { id, ...r } });
  }
  for (const { id, ...t } of demoRoutingTemplates) {
    await prisma.recipeRoutingTemplate.upsert({ where: { id }, update: t, create: { id, ...t } });
  }
  return { recipes: demoRecipes.length, routingTemplates: demoRoutingTemplates.length };
}

export const DEMO_PARTS = {
  customers: async () => { await seedCustomers(); return customers.length; },
  executive: async () => { await seedExecutive(); return { executiveDecisions: executiveDecisions.length, scenarios: 1 }; },
  orderhub: seedOrderHub,
  exceptions: seedExceptions,
  'shop-floor': seedShopFloor,
  'inventory-v1': seedInventoryV1,
  catalog: seedCatalog,
  'intake-setup': seedIntakeSetup,
  'online-orders': seedOnlineOrders,
  remnants: seedRemnants,
  'store-listings': seedStoreListings,
  portal: seedPortal,
  'processing-recipes': seedProcessingRecipes,
};

/**
 * Loads demo data: every part, or only the named one. Returns what was loaded.
 */
export async function seedDemo(part) {
  if (!prisma) throw new Error('DATABASE_URL is not set');
  const names = part ? [part] : Object.keys(DEMO_PARTS);
  for (const name of names) {
    if (!DEMO_PARTS[name]) throw new Error(`Unknown demo part "${name}". Parts: ${Object.keys(DEMO_PARTS).join(', ')}`);
  }
  console.log('Seeding demo data…');
  const loaded = {};
  for (const name of names) loaded[name] = await DEMO_PARTS[name]();
  console.log('Done.');
  return loaded;
}
