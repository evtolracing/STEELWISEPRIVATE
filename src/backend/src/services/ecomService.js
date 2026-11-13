/**
 * Online store: catalog, availability, configured-item pricing, cart
 * validation and checkout. Reads Product, StoreListing, Coil/Inventory,
 * PriceLevel, SalesTaxRate and ProcessingOperation; checkout writes an
 * OnlineOrder that lands in the CSR online order inbox.
 */
import crypto from 'node:crypto';
import prisma from '../lib/db.js';
import { createNumbered } from '../lib/numbering.js';
import { ci } from '../lib/dbText.js';
import { unitPrice } from './intakeCatalogService.js';

const num = (v) => (v == null ? null : Number(v));
const money = (n) => Math.round(n * 100) / 100;

export const DIVISIONS = [
  { id: 'METALS', name: 'Metals', description: 'Steel, stainless, aluminum, brass & copper', icon: 'metals' },
  { id: 'PLASTICS', name: 'Plastics', description: 'HDPE, UHMW, acetal, nylon & more', icon: 'plastics' },
  { id: 'SUPPLIES', name: 'Industrial Supplies', description: 'Abrasives, safety, welding & tooling', icon: 'supplies' },
  { id: 'OUTLET', name: 'Steel Outlet', description: 'Discounted remnant & drop pieces', icon: 'outlet' },
];
const FORMS = ['PLATE', 'SHEET', 'BAR', 'ROD', 'TUBE', 'ANGLE', 'CHANNEL', 'BEAM', 'SUPPLY'];

// Standard stock sizes (inches), filtered to each product's range when the listing has none.
const STD_THICKNESS = [0.024, 0.036, 0.048, 0.06, 0.075, 0.105, 0.125, 0.135, 0.1875, 0.25, 0.375, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12];
const STD_WIDTH = [36, 48, 60, 72, 96, 120];
const FLAT_LENGTHS = [96, 120, 144, 240];
const LONG_LENGTHS = [12, 24, 36, 48, 72, 144];
const LONG_FORMS = new Set(['BAR', 'ROD', 'TUBE', 'ANGLE', 'CHANNEL', 'BEAM', 'COIL']);

// Density in lb per cubic inch, by catalog category.
const DENSITY = {
  'Stainless Steel': 0.289, Aluminum: 0.0975, 'Brass & Copper': 0.307, Brass: 0.307,
  Polyethylene: 0.0343, 'Ultra-High MW': 0.0336, Acetal: 0.0513, Nylon: 0.0412,
};
const STEEL_DENSITY = 0.2836;

function inRange(values, min, max) {
  const lo = num(min), hi = num(max);
  if (lo == null && hi == null) return [];
  return values.filter((v) => (lo == null || v >= lo - 1e-9) && (hi == null || v <= hi + 1e-9)).map(String);
}

function options(p, l) {
  if (p.form === 'SUPPLY' || p.isRemnant) return { thicknessOptions: [], widthOptions: [], lengthOptions: [] };
  const long = LONG_FORMS.has(p.form);
  return {
    thicknessOptions: Array.isArray(l?.thicknessOptions) ? l.thicknessOptions : inRange(STD_THICKNESS, p.thicknessMin, p.thicknessMax),
    widthOptions: Array.isArray(l?.widthOptions) ? l.widthOptions : long ? [] : inRange(STD_WIDTH, p.widthMin, p.widthMax),
    lengthOptions: Array.isArray(l?.lengthOptions) ? l.lengthOptions : (long ? LONG_LENGTHS : FLAT_LENGTHS).map(String),
  };
}

async function stockByProduct(productIds, locationId) {
  if (!productIds.length) return new Map();
  const rows = await prisma.inventory.findMany({
    where: {
      status: 'ACTIVE', qtyAvailable: { gt: 0 },
      coil: { productId: { in: productIds }, status: 'AVAILABLE' },
      ...(locationId ? { locationId } : {}),
    },
    select: { qtyAvailable: true, locationId: true, location: { select: { name: true } }, coil: { select: { productId: true } } },
  });
  const map = new Map();
  for (const r of rows) {
    const list = map.get(r.coil.productId) || [];
    list.push(r);
    map.set(r.coil.productId, list);
  }
  return map;
}

/** Use the location only if it exists; the store's default session location may be a placeholder. */
async function realLocationId(locationId) {
  if (!locationId) return null;
  const loc = await prisma.location.findUnique({ where: { id: String(locationId) }, select: { id: true } });
  return loc?.id || null;
}

export function toStoreProduct(p, stock = []) {
  const l = p.storeListing;
  const { basePrice, priceUnit } = unitPrice(p);
  const inStock = stock.length > 0;
  const cutOk = p.form !== 'SUPPLY' && !p.isRemnant;
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    form: p.form,
    grade: p.grade?.code || 'N/A',
    spec: p.specStandard || p.grade?.specStandard || 'N/A',
    family: l?.family || p.category || 'Other',
    division: p.division,
    category: p.category || 'Other',
    ...options(p, l),
    basePrice,
    priceUnit,
    inStock,
    imageUrl: null,
    tags: Array.isArray(l?.tags) ? l.tags : [],
    minOrderQty: l?.minOrderQty || 1,
    leadTimeDays: l?.leadTimeDays ?? (inStock ? 1 : 7),
    allowCutToSize: l?.allowCutToSize ?? cutOk,
    allowProcessing: l?.allowProcessing ?? cutOk,
    isRemnant: p.isRemnant,
    featured: Boolean(l?.featured),
    unit: priceUnit === 'EA' ? 'ea' : 'pcs',
  };
}

const visibleWhere = { isActive: true, OR: [{ storeListing: { is: null } }, { storeListing: { visible: true } }] };
const include = { grade: true, storeListing: true };
const orderBy = (rows) => rows.sort((a, b) =>
  Number(Boolean(b.storeListing?.featured)) - Number(Boolean(a.storeListing?.featured))
  || (a.storeListing?.sortOrder ?? 9999) - (b.storeListing?.sortOrder ?? 9999)
  || a.sku.localeCompare(b.sku));

async function divisionsWithCounts() {
  const counts = await prisma.product.groupBy({ by: ['division'], where: visibleWhere, _count: { _all: true } });
  const byDiv = Object.fromEntries(counts.map((c) => [c.division, c._count._all]));
  return DIVISIONS.map((d) => ({ ...d, productCount: byDiv[d.id] || 0 }));
}

export async function familiesFor(division) {
  const rows = await prisma.product.findMany({
    where: { ...visibleWhere, ...(division ? { division: String(division) } : {}) },
    select: { category: true, storeListing: { select: { family: true } } },
  });
  return [...new Set(rows.map((r) => r.storeListing?.family || r.category || 'Other'))].sort();
}

export async function searchCatalog(params = {}) {
  const { query, division, category, family, form, grade, inStockOnly, locationId } = params;
  const where = { ...visibleWhere, AND: [] };
  if (division) where.division = String(division);
  if (category) where.category = String(category);
  if (form) where.form = String(form);
  if (grade) where.grade = { code: { contains: String(grade), ...ci } };
  if (family) where.AND.push({ OR: [{ storeListing: { family: String(family) } }, { category: String(family) }] });
  if (query) {
    const q = String(query);
    where.AND.push({ OR: [
      { name: { contains: q, ...ci } }, { sku: { contains: q, ...ci } },
      { description: { contains: q, ...ci } }, { grade: { code: { contains: q, ...ci } } },
    ] });
  }
  const rows = orderBy(await prisma.product.findMany({ where, include, take: 1000 }));
  const stock = await stockByProduct(rows.map((r) => r.id), await realLocationId(locationId));
  let products = rows.map((p) => toStoreProduct(p, stock.get(p.id)));
  if (inStockOnly && String(inStockOnly) !== 'false') products = products.filter((p) => p.inStock);
  const limit = Math.min(Math.max(parseInt(params.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(params.offset, 10) || 0, 0);
  const total = products.length;
  const families = {};
  for (const d of DIVISIONS) families[d.id] = await familiesFor(d.id);
  return {
    data: products.slice(offset, offset + limit),
    total,
    meta: { total, limit, offset },
    facets: { divisions: await divisionsWithCounts(), families, forms: FORMS },
  };
}

export async function getStoreProduct(id) {
  const p = await prisma.product.findFirst({ where: { id, ...visibleWhere }, include });
  if (!p) return null;
  const stock = await stockByProduct([p.id]);
  return toStoreProduct(p, stock.get(p.id));
}

export async function availability(productId, locationId) {
  const stock = (await stockByProduct([productId])).get(productId) || [];
  const byLoc = new Map();
  for (const s of stock) {
    const cur = byLoc.get(s.locationId) || { locationId: s.locationId, locationName: s.location?.name || s.locationId, qtyAvailable: 0, weightAvailable: 0, leadTimeDays: 0 };
    cur.qtyAvailable += 1;
    cur.weightAvailable += Number(s.qtyAvailable);
    byLoc.set(s.locationId, cur);
  }
  const all = [...byLoc.values()].map((a) => ({ ...a, weightAvailable: Math.round(a.weightAvailable) }));
  const real = await realLocationId(locationId);
  const scoped = real ? all.filter((a) => a.locationId === real) : all;
  const summary = {
    locationId: real,
    quantityOnHand: scoped.reduce((s, a) => s + a.qtyAvailable, 0),
    weightAvailable: scoped.reduce((s, a) => s + a.weightAvailable, 0),
    locations: all,
  };
  return { productId, availability: scoped, data: summary };
}

async function priceLevel(code) {
  if (!code) return { code: 'RETAIL', multiplier: 1 };
  const row = await prisma.priceLevel.findUnique({ where: { code: String(code) } });
  return row && row.isActive ? { code: row.code, multiplier: Number(row.multiplier) } : { code: 'RETAIL', multiplier: 1 };
}

/** Estimated weight in lb for one piece. Long forms treat thickness as diameter. */
export function pieceWeight(product, dims = {}) {
  const t = parseFloat(dims.thickness) || 0;
  const w = parseFloat(dims.width) || 0;
  const l = parseFloat(dims.length) || 0;
  const density = DENSITY[product.storeListing?.family] || DENSITY[product.category] || STEEL_DENSITY;
  if (LONG_FORMS.has(product.form)) return t && l ? (Math.PI / 4) * t * t * l * density : 0;
  return t && w && l ? t * w * l * density : 0;
}

async function processingCost(steps, quantity) {
  if (!Array.isArray(steps) || !steps.length) return 0;
  const ids = steps.map((s) => s.processId || s.id).filter(Boolean);
  const codes = steps.map((s) => s.code).filter(Boolean);
  const ops = await prisma.processingOperation.findMany({ where: { OR: [{ id: { in: ids } }, { code: { in: codes } }] } });
  const find = (s) => ops.find((o) => o.id === (s.processId || s.id) || o.code === s.code);
  return steps.reduce((sum, s) => {
    if (Number(s.estimatedCost)) return sum + Number(s.estimatedCost);
    const op = find(s);
    return sum + (op ? Number(op.pricePerOp) * quantity : 0);
  }, 0);
}

/** Price one configured store line. */
export async function priceConfig(payload = {}) {
  const { productId } = payload;
  const config = payload.config || {};
  const quantity = Math.max(1, parseInt(payload.quantity ?? config.qty ?? config.quantity, 10) || 1);
  const dims = payload.dimensions || config.dimensions || {};
  const steps = payload.processing || payload.processingSteps || config.processingSteps || [];
  const warnings = [];

  const product = productId ? await prisma.product.findUnique({ where: { id: productId }, include: { storeListing: true } }) : null;
  if (!product) return { status: 404, error: 'Product not found' };

  const { basePrice, priceUnit } = unitPrice(product);
  const level = await priceLevel(payload.priceLevel);
  let priceSource = level.code === 'RETAIL' ? 'RETAIL' : 'CONTRACT';
  let price = (basePrice || 0) * level.multiplier;
  if (product.isRemnant || payload.isRemnant) {
    priceSource = 'REMNANT';
    price = (basePrice || 0) * (1 - (Number(payload.remnantDiscount) || 0));
  }

  const estimatedWeight = Math.round(pieceWeight(product, dims) * quantity * 10) / 10;
  let materialCost = 0;
  if (basePrice == null) {
    priceSource = 'REVIEW_REQUIRED';
    warnings.push('Price not on file – will require review');
  } else if (priceUnit === 'LB') {
    if (estimatedWeight > 0) materialCost = estimatedWeight * price;
    else {
      priceSource = 'REVIEW_REQUIRED';
      warnings.push('Enter dimensions to get a price, or request a quote');
    }
  } else {
    materialCost = quantity * price;
  }
  if (estimatedWeight > 10000) warnings.push('Large order – may require freight quote');

  const procCost = await processingCost(steps, quantity);
  const result = {
    unitPrice: Number(price.toFixed(4)),
    priceUnit,
    extended: money(materialCost + procCost),
    priceSource,
    materialCost: money(materialCost),
    processingCost: money(procCost),
    estimatedWeight,
    quantity,
    warnings,
  };
  return { ...result, data: result };
}

export async function taxEstimate({ subtotal = 0, shipToState = 'MI', customerId } = {}) {
  let rate = 0;
  let exempt = false;
  if (customerId) {
    const key = String(customerId);
    const c = await prisma.organization.findFirst({ where: { OR: [{ id: key }, { code: key }] }, select: { taxExempt: true } });
    exempt = Boolean(c?.taxExempt);
  }
  if (!exempt) {
    const row = await prisma.salesTaxRate.findUnique({ where: { state: String(shipToState || 'MI').toUpperCase() } });
    rate = row ? Number(row.rate) : 0;
  }
  const result = { taxRate: rate, taxAmount: money((Number(subtotal) || 0) * rate), exempt };
  return { ...result, data: result };
}

const lineQty = (i) => Math.max(0, parseInt(i.quantity ?? i.config?.qty ?? i.qty, 10) || 0);

export async function validateCart({ items = [] } = {}) {
  const ids = items.map((i) => i.productId).filter(Boolean);
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, include: { storeListing: true } });
  const byId = new Map(products.map((p) => [p.id, p]));
  const errors = [];
  const warnings = [];
  items.forEach((item, idx) => {
    const p = byId.get(item.productId);
    if (!item.productId || !p) return errors.push({ line: idx, msg: 'Product not found' });
    if (!p.isActive || p.storeListing?.visible === false) errors.push({ line: idx, msg: `${p.name} is no longer available online` });
    const min = p.storeListing?.minOrderQty || 1;
    if (lineQty(item) < min) errors.push({ line: idx, msg: `${p.name}: minimum quantity is ${min}` });
    const source = item.priceSource || item.pricingPreview?.priceSource;
    if (source === 'REVIEW_REQUIRED') warnings.push({ line: idx, msg: `${p.name}: price requires review` });
  });
  const result = { valid: errors.length === 0, errors, warnings, itemCount: items.length };
  return { ...result, data: result };
}

function describe(item) {
  const d = item.dimensions || item.config?.dimensions || {};
  const size = [d.thickness, d.width, d.length].filter((v) => v !== undefined && v !== null && v !== '').map((v) => `${v}"`).join(' × ');
  const base = item.name || item.description || item.sku || 'Item';
  return size ? `${base} ${size}` : base;
}

const webYear = () => new Date().getFullYear();
const countWebOrders = () => prisma.onlineOrder.count({ where: { externalOrderId: { startsWith: `WEB-${webYear()}-` } } });
const webNumber = (n) => `WEB-${webYear()}-${String(n + 5000).padStart(4, '0')}`;

/** Create the web order in the CSR inbox. `quote` marks a request for quote. */
export async function checkout(payload = {}, { quote = false } = {}) {
  const raw = Array.isArray(payload.items) ? payload.items : Array.isArray(payload.lines) ? payload.lines : [];
  if (!raw.length) return { status: 400, error: 'Cart is empty' };
  const check = await validateCart({ items: raw });
  if (!check.valid) return { status: 422, error: check.errors.map((e) => e.msg).join('; '), errors: check.errors };

  for (const [idx, i] of raw.entries()) {
    const sent = i.extended ?? i.pricingPreview?.extended;
    if (sent != null && !(Number(sent) >= 0)) return { status: 400, error: `Line ${idx + 1}: price is not valid` };
    if (lineQty(i) < 0 || (i.quantity != null && !(Number(i.quantity) > 0))) return { status: 400, error: `Line ${idx + 1}: quantity must be more than zero` };
  }

  const products = await prisma.product.findMany({ where: { id: { in: raw.map((i) => i.productId) } }, select: { id: true, sku: true } });
  const skuById = new Map(products.map((p) => [p.id, p.sku]));
  const lines = raw.map((i, idx) => {
    const qty = lineQty(i) || 1;
    const pricing = i.pricingPreview || {};
    const extended = money(Number(i.extended ?? pricing.extended) || 0);
    return {
      lineNumber: idx + 1,
      productId: i.productId,
      sku: skuById.get(i.productId) || i.sku || null,
      description: describe(i),
      qty,
      unitPrice: qty ? money(extended / qty) : 0,
      extended,
      priceSource: i.priceSource || pricing.priceSource || null,
      dimensions: i.dimensions || i.config?.dimensions || null,
      processing: i.processing || i.config?.processingSteps || [],
      estimatedWeight: Number(i.estimatedWeight ?? pricing.estimatedWeight) || null,
    };
  });
  const subtotal = money(lines.reduce((s, l) => s + l.extended, 0));
  const tax = money(Number(payload.taxAmount ?? payload.tax) || 0);
  const needsReview = quote || lines.some((l) => l.priceSource === 'REVIEW_REQUIRED');

  const shipping = payload.deliveryMethod || payload.shippingMethod || null;
  const shipTo = payload.deliveryMethod === 'DELIVERY' || payload.shipToAddress
    ? [payload.shipToName, payload.shipToAddress, payload.shipToCity, payload.shipToState, payload.shipToZip].filter(Boolean).join(', ')
    : null;
  const notes = [
    quote ? 'QUOTE REQUEST' : null,
    payload.poNumber ? `PO ${payload.poNumber}` : null,
    payload.requestedDate || payload.requestedShipDate ? `Requested ${payload.requestedDate || payload.requestedShipDate}` : null,
    shipTo ? `Ship to: ${shipTo}` : null,
    payload.paymentMethod ? `Payment: ${payload.paymentMethod}` : null,
    payload.orderNotes || payload.notes || null,
  ].filter(Boolean).join(' · ');

  let customerId = null;
  if (payload.customerId) {
    const key = String(payload.customerId);
    const org = await prisma.organization.findFirst({ where: { OR: [{ id: key }, { code: key }] }, select: { id: true } });
    customerId = org?.id || null;
  }

  const order = await createNumbered({ count: countWebOrders, format: webNumber, create: (externalOrderId) => prisma.onlineOrder.create({
    data: {
      id: crypto.randomUUID(),
      externalOrderId,
      source: quote ? 'ONLINE_QUOTE' : 'ONLINE',
      status: 'NEEDS_REVIEW',
      customerName: payload.customerName || payload.shipToName || 'Online Customer',
      customerEmail: payload.customerEmail || payload.email || null,
      customerId,
      items: lines,
      subtotal,
      shippingMethod: shipping,
      notes: notes || null,
    },
  }) });

  return {
    success: true,
    data: {
      id: order.id,
      orderNumber: order.externalOrderId,
      source: order.source,
      status: needsReview ? 'NEEDS_REVIEW' : 'SUBMITTED',
      quoteRequested: quote,
      customerName: order.customerName,
      lines,
      subtotal,
      tax,
      total: money(subtotal + tax),
      promiseStatus: payload.promiseStatus || null,
      createdAt: order.receivedAt.toISOString(),
    },
  };
}

// ─── Admin: store listings ────────────────────────────────────────────────

function toAdminItem(p, idx) {
  const l = p.storeListing;
  return {
    id: p.id, sku: p.sku, name: p.name, description: p.description, division: p.division,
    visible: l?.visible ?? true, featured: l?.featured ?? false, sortOrder: l?.sortOrder ?? idx + 1,
    tags: Array.isArray(l?.tags) ? l.tags : [], leadTimeDays: l?.leadTimeDays ?? null, minOrderQty: l?.minOrderQty ?? 1,
    family: l?.family || p.category || null, isActive: p.isActive,
  };
}

export async function listCatalogItems({ division, visibleOnly, search } = {}) {
  const where = { isActive: true };
  if (division) where.division = String(division);
  if (search) where.OR = [{ name: { contains: String(search), ...ci } }, { sku: { contains: String(search), ...ci } }];
  let items = orderBy(await prisma.product.findMany({ where, include })).map(toAdminItem);
  if (visibleOnly && String(visibleOnly) !== 'false') items = items.filter((i) => i.visible);
  return { data: items, meta: { total: items.length } };
}

const LISTING_FIELDS = ['visible', 'featured', 'sortOrder', 'family', 'tags', 'leadTimeDays', 'minOrderQty', 'thicknessOptions', 'widthOptions', 'lengthOptions', 'allowCutToSize', 'allowProcessing'];

export async function updateListing(productId, changes = {}) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return { status: 404, error: 'Product not found' };
  const data = {};
  for (const k of LISTING_FIELDS) if (changes[k] !== undefined) data[k] = changes[k];
  if (data.sortOrder !== undefined) data.sortOrder = parseInt(data.sortOrder, 10) || 0;
  if (data.minOrderQty !== undefined) data.minOrderQty = Math.max(1, parseInt(data.minOrderQty, 10) || 1);
  if (data.leadTimeDays !== undefined) data.leadTimeDays = data.leadTimeDays === null || data.leadTimeDays === '' ? null : parseInt(data.leadTimeDays, 10) || 0;
  if (data.tags !== undefined) data.tags = Array.isArray(data.tags) ? data.tags.map(String) : String(data.tags).split(',').map((t) => t.trim()).filter(Boolean);
  for (const b of ['visible', 'featured']) if (data[b] !== undefined) data[b] = Boolean(data[b]);
  await prisma.storeListing.upsert({ where: { productId }, update: data, create: { productId, ...data } });
  if (changes.description !== undefined) {
    await prisma.product.update({ where: { id: productId }, data: { description: String(changes.description || '') || null } });
  }
  const p = await prisma.product.findUnique({ where: { id: productId }, include });
  return { success: true, item: toAdminItem(p, 0) };
}
