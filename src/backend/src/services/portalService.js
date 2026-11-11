/**
 * Customer portal: "My Orders" (web orders placed by the customer) and the
 * enterprise account view (all sales orders, shipments and documents across
 * the customer's divisions / branches). Reads Organization, Order, OrderLine,
 * Shipment, Invoice, Job, Document and OnlineOrder.
 *
 * Customers are identified by organization id or code. Until customer
 * logins exist, the portal passes the id from the store session.
 */
import prisma from '../lib/db.js';
import { ci } from '../lib/dbText.js';
import { unpackNotes } from '../routes/intakeOrders.js';

const num = (v) => (v == null ? 0 : Number(v));
const money = (n) => Math.round(n * 100) / 100;
const iso = (d) => (d ? new Date(d).toISOString() : null);
const day = (d) => (d ? new Date(d).toISOString().split('T')[0] : null);
const DAY = 86400000;

// ─── Customer resolution ──────────────────────────────────────────────────

export async function resolveCustomer(idOrCode) {
  if (!idOrCode) return null;
  const key = String(idOrCode);
  return prisma.organization.findFirst({ where: { OR: [{ id: key }, { code: key }] } });
}

/** The account root and every division under it (two levels). */
async function accountTree(idOrCode) {
  let org = await resolveCustomer(idOrCode);
  if (!org) return null;
  for (let i = 0; i < 5 && org.parentId; i++) {
    const parent = await prisma.organization.findUnique({ where: { id: org.parentId } });
    if (!parent) break;
    org = parent;
  }
  const children = await prisma.organization.findMany({ where: { parentId: org.id }, orderBy: { name: 'asc' } });
  const grandchildren = children.length
    ? await prisma.organization.findMany({ where: { parentId: { in: children.map((c) => c.id) } }, orderBy: { name: 'asc' } })
    : [];
  const all = [org, ...children, ...grandchildren];
  return { root: org, orgs: all, ids: all.map((o) => o.id), byId: new Map(all.map((o) => [o.id, o])) };
}

const address = (o) => [o.address, o.city, [o.state, o.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
const toBranch = (o, root) => ({ id: o.id, name: o.name, code: o.code, address: address(o), primary: o.id === root.id });

// ─── Status ───────────────────────────────────────────────────────────────

const OPEN_STATUSES = new Set(['NEEDS_REVIEW', 'CONFIRMED', 'SCHEDULED', 'IN_PROCESS', 'READY_TO_SHIP']);

/** Customer-facing status for a sales order, from its shipments, jobs and own status. */
function customerStatus(order) {
  if (order.status === 'CANCELLED') return 'CANCELLED';
  if (order.status === 'COMPLETE') return 'COMPLETED';
  const ships = order.shipments || [];
  if (ships.length && ships.every((s) => s.status === 'DELIVERED' || s.status === 'IN_TRANSIT')) {
    const fullyShipped = (order.lines || []).every((l) => num(l.qtyShipped) >= num(l.qtyOrdered));
    if (fullyShipped || order.status === 'PARTIAL') return 'SHIPPED';
  }
  if (ships.some((s) => ['DELIVERED', 'IN_TRANSIT'].includes(s.status))) return 'SHIPPED';
  const jobs = order.jobs || [];
  if (jobs.some((j) => ['READY_TO_SHIP', 'PACKAGING'].includes(j.status))) return 'READY_TO_SHIP';
  if (jobs.some((j) => ['IN_PROCESS', 'WAITING_QC'].includes(j.status))) return 'IN_PROCESS';
  if (jobs.some((j) => j.status === 'SCHEDULED')) return 'SCHEDULED';
  if (order.status === 'CONFIRMED' || order.status === 'PARTIAL') return 'CONFIRMED';
  return 'NEEDS_REVIEW';
}

function lineStatus(line, orderStatus, delivered) {
  const ordered = num(line.qtyOrdered);
  const shipped = num(line.qtyShipped);
  if (ordered > 0 && shipped >= ordered) return delivered ? 'DELIVERED' : 'SHIPPED';
  if (shipped > 0) return 'PARTIAL';
  if (orderStatus === 'NEEDS_REVIEW') return 'REVIEW';
  return ['IN_PROCESS', 'SCHEDULED', 'CONFIRMED'].includes(orderStatus) ? orderStatus : 'PENDING';
}

const orderInclude = {
  lines: { orderBy: { lineNumber: 'asc' } },
  shipments: { include: { items: true }, orderBy: { createdAt: 'asc' } },
  jobs: { select: { status: true } },
  invoices: true,
  createdBy: { select: { firstName: true, lastName: true } },
};

function orderSource(order, onlineByOrder) {
  if (onlineByOrder.has(order.id)) return 'ONLINE';
  const { meta } = unpackNotes(order.notes);
  return meta?.source || 'REP';
}

function toAccountOrder(order, tree, onlineByOrder) {
  const status = customerStatus(order);
  const ships = order.shipments || [];
  const shipped = ships.filter((s) => s.shippedAt).sort((a, b) => a.shippedAt - b.shippedAt);
  const allDelivered = ships.length > 0 && ships.every((s) => s.status === 'DELIVERED');
  const subtotal = num(order.subtotal) || (order.lines || []).reduce((s, l) => s + num(l.extendedPrice), 0);
  const total = num(order.totalAmount) || subtotal + num(order.taxAmount) + num(order.freightAmount);
  const branch = tree.byId.get(order.buyerId);
  const online = onlineByOrder.get(order.id);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status,
    source: orderSource(order, onlineByOrder),
    webOrderNumber: online?.externalOrderId || null,
    branchId: order.buyerId,
    branchName: branch?.name || null,
    createdAt: iso(order.orderDate || order.createdAt),
    requestedShipDate: day(order.requiredDate),
    actualShipDate: day(shipped[0]?.shippedAt),
    estimatedDelivery: day(order.promisedDate || ships.find((s) => s.scheduledDate)?.scheduledDate),
    lineCount: (order.lines || []).length,
    subtotal: money(subtotal),
    tax: money(num(order.taxAmount)),
    total: money(total),
    poNumber: order.poReference,
    placedBy: order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}`.trim() : null,
    trackingNumber: shipped.find((s) => s.bolNumber)?.bolNumber || null,
    lines: (order.lines || []).map((l) => ({
      lineNumber: l.lineNumber,
      description: l.description || 'Material',
      qty: num(l.qtyOrdered),
      shipped: num(l.qtyShipped),
      unit: l.unit,
      unitPrice: num(l.unitPrice),
      extPrice: num(l.extendedPrice),
      status: lineStatus(l, status, allDelivered),
    })),
  };
}

async function onlineLinks(orderIds) {
  if (!orderIds.length) return new Map();
  const rows = await prisma.onlineOrder.findMany({ where: { internalOrderId: { in: orderIds } } });
  return new Map(rows.map((r) => [r.internalOrderId, r]));
}

async function loadAccountOrders(tree, { branchId, from, to } = {}) {
  const buyerIds = branchId && tree.ids.includes(branchId) ? [branchId] : tree.ids;
  const where = { orderType: 'SO', buyerId: { in: buyerIds } };
  if (from || to) where.orderDate = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(`${String(to).slice(0, 10)}T23:59:59Z`) } : {}) };
  const orders = await prisma.order.findMany({ where, include: orderInclude, orderBy: { orderDate: 'desc' }, take: 1000 });
  const links = await onlineLinks(orders.map((o) => o.id));
  return { orders, links };
}

// ─── Enterprise account ───────────────────────────────────────────────────

const TIER_TO_LEVEL = { A: 'CONTRACT_B', B: 'CONTRACT_A', C: 'VOLUME', D: 'RETAIL' };

export async function accountProfile(idOrCode) {
  const tree = await accountTree(idOrCode);
  if (!tree) return null;
  const { root } = tree;
  const tier = await prisma.customerPricingTier.findUnique({ where: { customerId: root.id } }).catch(() => null);
  const { orders, links } = await loadAccountOrders(tree);
  const mapped = orders.map((o) => toAccountOrder(o, tree, links));
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const ytd = mapped.filter((o) => new Date(o.createdAt) >= yearStart).reduce((s, o) => s + o.total, 0);
  const open = mapped.filter((o) => OPEN_STATUSES.has(o.status));
  const invoices = orders.flatMap((o) => o.invoices || []);
  const unpaid = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED')
    .reduce((s, i) => s + num(i.totalAmount) - num(i.paidAmount), 0);
  return {
    id: root.id,
    companyName: root.name,
    accountNumber: root.code,
    priceLevel: TIER_TO_LEVEL[tier?.tierCode] || 'RETAIL',
    creditLimit: tier?.creditLimit != null ? num(tier.creditLimit) : null,
    creditUsed: money(unpaid + open.reduce((s, o) => s + o.total, 0)),
    paymentTerms: tier?.paymentTerms || root.paymentTerms || null,
    accountRep: null,
    branches: tree.orgs.map((o) => toBranch(o, root)),
    userRole: 'ADMIN', // customer logins and roles come with portal authentication
    stats: {
      totalOrders: mapped.length,
      openOrders: open.length,
      ytdSpend: money(ytd),
      avgOrderValue: mapped.length ? money(mapped.reduce((s, o) => s + o.total, 0) / mapped.length) : 0,
      onTimeDelivery: onTimeRate(orders),
    },
  };
}

/** Share of delivered shipments that arrived by the order's promised (or required) date. */
function onTimeRate(orders) {
  let due = 0, onTime = 0;
  for (const o of orders) {
    const target = o.promisedDate || o.requiredDate;
    for (const s of o.shipments || []) {
      if (!s.deliveredAt || !target) continue;
      due += 1;
      if (new Date(s.deliveredAt) <= new Date(new Date(target).getTime() + DAY - 1)) onTime += 1;
    }
  }
  return due ? Math.round((onTime / due) * 1000) / 10 : null;
}

export async function accountKpis(idOrCode) {
  const tree = await accountTree(idOrCode);
  if (!tree) return null;
  const { orders, links } = await loadAccountOrders(tree);
  const mapped = orders.map((o) => toAccountOrder(o, tree, links));
  const open = mapped.filter((o) => OPEN_STATUSES.has(o.status));
  const ships = orders.flatMap((o) => o.shipments || []);
  const weekAgo = Date.now() - 7 * DAY;
  const docs = await accountDocuments(tree, {});
  return {
    openOrders: open.length,
    totalOrders: mapped.length,
    openValue: money(open.reduce((s, o) => s + o.total, 0)),
    shippedThisWeek: ships.filter((s) => s.shippedAt && new Date(s.shippedAt).getTime() >= weekAgo).length,
    pendingShipments: ships.filter((s) => ['PENDING', 'LOADING'].includes(s.status)).length,
    documentsAvailable: docs.length,
    partialShipments: mapped.filter((o) => o.lines.some((l) => l.status === 'PARTIAL')).length,
    onTimeRate: onTimeRate(orders),
    branchBreakdown: tree.orgs.map((b) => {
      const mine = mapped.filter((o) => o.branchId === b.id);
      return {
        branchId: b.id,
        name: b.name,
        openOrders: mine.filter((o) => OPEN_STATUSES.has(o.status)).length,
        totalSpend: money(mine.reduce((s, o) => s + o.total, 0)),
      };
    }),
  };
}

export async function listAccountOrders(params = {}) {
  const tree = await accountTree(params.accountId || params.customerId);
  if (!tree) return null;
  const { orders, links } = await loadAccountOrders(tree, { branchId: params.branchId, from: params.dateFrom, to: params.dateTo });
  let mapped = orders.map((o) => toAccountOrder(o, tree, links));
  if (params.status) mapped = mapped.filter((o) => o.status === params.status);
  if (params.search) {
    const q = String(params.search).toLowerCase();
    mapped = mapped.filter((o) => [o.orderNumber, o.poNumber, o.placedBy, o.webOrderNumber, ...o.lines.map((l) => l.description)]
      .some((v) => v && String(v).toLowerCase().includes(q)));
  }
  if (params.sortBy === 'total') mapped.sort((a, b) => b.total - a.total);
  return { data: mapped, meta: { total: mapped.length, openCount: mapped.filter((o) => OPEN_STATUSES.has(o.status)).length } };
}

export async function accountOrderDetail(orderId, accountId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) return null;
  const tree = await accountTree(accountId || order.buyerId);
  if (!tree || !tree.ids.includes(order.buyerId)) return null;
  return toAccountOrder(order, tree, await onlineLinks([order.id]));
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function exportOrdersCsv(params = {}) {
  const res = await listAccountOrders(params);
  if (!res) return null;
  const header = ['Order #', 'PO', 'Branch', 'Status', 'Date', 'Items', 'Total', 'Placed By', 'Tracking'];
  const rows = res.data.map((o) => [o.orderNumber, o.poNumber, o.branchName, o.status, (o.createdAt || '').slice(0, 10), o.lineCount, o.total, o.placedBy, o.trackingNumber]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

// ─── Shipments ────────────────────────────────────────────────────────────

export async function listAccountShipments(params = {}) {
  const tree = await accountTree(params.accountId || params.customerId);
  if (!tree) return null;
  const buyerIds = params.branchId && tree.ids.includes(params.branchId) ? [params.branchId] : tree.ids;
  const where = { order: { buyerId: { in: buyerIds } } };
  if (params.status) where.status = String(params.status);
  if (params.search) {
    const q = String(params.search);
    where.OR = [
      { shipmentNumber: { contains: q, ...ci } }, { bolNumber: { contains: q, ...ci } },
      { order: { orderNumber: { contains: q, ...ci } } },
    ];
  }
  const rows = await prisma.shipment.findMany({
    where,
    include: { items: { include: { orderLine: { select: { description: true } } } }, order: { select: { id: true, orderNumber: true, buyerId: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  const data = rows.map((s) => {
    const items = s.items.map((i) => ({ description: i.orderLine?.description || 'Material', qty: num(i.qtyShipped), weight: i.weightLb != null ? num(i.weightLb) : null }));
    const weight = s.totalWeightLb != null ? num(s.totalWeightLb) : items.reduce((t, i) => t + (i.weight || 0), 0);
    return {
      id: s.id,
      shipmentNumber: s.shipmentNumber,
      orderId: s.orderId,
      orderNumber: s.order.orderNumber,
      branchId: s.order.buyerId,
      branchName: tree.byId.get(s.order.buyerId)?.name || null,
      status: s.status,
      carrier: s.carrierName || 'TBD',
      trackingNumber: s.bolNumber,
      shipDate: day(s.shippedAt),
      estimatedDelivery: day(s.scheduledDate),
      actualDelivery: day(s.deliveredAt),
      pieces: items.length,
      totalPieces: items.reduce((t, i) => t + i.qty, 0),
      weight: Math.round(weight),
      totalWeight: Math.round(weight),
      pallets: null,
      items,
    };
  });
  return { data, meta: { total: data.length } };
}

// ─── Documents ────────────────────────────────────────────────────────────
// Packing lists, bills of lading and invoices are generated from shipment and
// invoice records; uploaded documents owned by the customer are listed too.

async function accountDocuments(tree, { branchId, orderId } = {}) {
  const buyerIds = branchId && tree.ids.includes(branchId) ? [branchId] : tree.ids;
  const orders = await prisma.order.findMany({
    where: { orderType: 'SO', buyerId: { in: buyerIds }, ...(orderId ? { id: orderId } : {}) },
    select: { id: true, orderNumber: true, buyerId: true, shipments: true, invoices: true },
  });
  const docs = [];
  for (const o of orders) {
    const base = { orderId: o.id, orderNumber: o.orderNumber, branchName: tree.byId.get(o.buyerId)?.name || null };
    for (const s of o.shipments) {
      if (!s.shippedAt && s.status === 'PENDING') continue;
      docs.push({ ...base, id: `pl-${s.id}`, type: 'PACKING_LIST', name: `Packing List ${s.shipmentNumber}.txt`, createdAt: day(s.shippedAt || s.createdAt) });
      if (s.bolNumber) docs.push({ ...base, id: `bol-${s.id}`, type: 'BOL', name: `BOL ${s.bolNumber}.txt`, createdAt: day(s.shippedAt || s.createdAt) });
    }
    for (const inv of o.invoices) {
      docs.push({ ...base, id: `inv-${inv.id}`, type: 'INVOICE', name: `Invoice ${inv.invoiceNumber}.txt`, createdAt: day(inv.invoiceDate) });
    }
  }
  if (!orderId) {
    const owned = await prisma.document.findMany({ where: { ownerId: { in: buyerIds } }, orderBy: { createdAt: 'desc' }, take: 200 });
    for (const d of owned) {
      docs.push({
        id: `doc-${d.id}`, type: d.documentType === 'CERT' ? 'COC' : d.documentType, name: d.title || d.fileName,
        orderId: null, orderNumber: d.documentNumber || null, branchName: tree.byId.get(d.ownerId)?.name || null,
        createdAt: day(d.issueDate || d.createdAt), fileSize: d.fileSizeBytes || null,
      });
    }
  }
  return docs.map((d) => ({ ...d, size: d.fileSize ? `${Math.max(1, Math.round(d.fileSize / 1024))} KB` : null, url: null }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function listAccountDocuments(params = {}) {
  const tree = await accountTree(params.accountId || params.customerId);
  if (!tree) return null;
  let docs = await accountDocuments(tree, params);
  if (params.type) docs = docs.filter((d) => d.type === params.type);
  if (params.search) {
    const q = String(params.search).toLowerCase();
    docs = docs.filter((d) => [d.name, d.orderNumber].some((v) => v && v.toLowerCase().includes(q)));
  }
  return { data: docs, meta: { total: docs.length } };
}

const pad = (s, n) => String(s ?? '').padEnd(n);

/** Render a generated document as plain text. Returns { name, content } or null. */
export async function renderDocument(docId) {
  const [kind, ...rest] = String(docId).split('-');
  const id = rest.join('-');
  if (kind === 'pl' || kind === 'bol') {
    const s = await prisma.shipment.findUnique({
      where: { id },
      include: { items: { include: { orderLine: true } }, order: { include: { buyer: true } }, fromLocation: true },
    });
    if (!s) return null;
    const title = kind === 'pl' ? 'PACKING LIST' : 'BILL OF LADING';
    const lines = [
      `${title}`, '',
      `Shipment:  ${s.shipmentNumber}`, `Order:     ${s.order.orderNumber}`, s.order.poReference ? `PO:        ${s.order.poReference}` : null,
      kind === 'bol' ? `BOL #:     ${s.bolNumber}` : null,
      `Ship from: ${s.fromLocation?.name || ''}`,
      `Ship to:   ${s.order.buyer?.name || ''}${s.order.shipToAddress ? `, ${s.order.shipToAddress}` : ''}`,
      `Carrier:   ${s.carrierName || 'TBD'}`, `Shipped:   ${day(s.shippedAt) || 'not yet shipped'}`, '',
      `${pad('Line', 6)}${pad('Description', 48)}${pad('Qty', 10)}Weight (lb)`,
      ...s.items.map((i) => `${pad(i.orderLine?.lineNumber, 6)}${pad(i.orderLine?.description || 'Material', 48)}${pad(num(i.qtyShipped), 10)}${i.weightLb != null ? num(i.weightLb) : ''}`),
      '', `Total weight: ${s.totalWeightLb != null ? num(s.totalWeightLb) : ''} lb`,
    ].filter((l) => l !== null);
    return { name: `${kind === 'pl' ? 'Packing List' : 'BOL'} ${kind === 'pl' ? s.shipmentNumber : s.bolNumber}.txt`, content: lines.join('\n') };
  }
  if (kind === 'inv') {
    const inv = await prisma.invoice.findUnique({ where: { id }, include: { order: { include: { buyer: true, lines: { orderBy: { lineNumber: 'asc' } } } } } });
    if (!inv) return null;
    const lines = [
      'INVOICE', '', `Invoice:  ${inv.invoiceNumber}`, `Date:     ${day(inv.invoiceDate)}`, `Due:      ${day(inv.dueDate) || ''}`,
      `Customer: ${inv.order.buyer?.name || ''}`, `Order:    ${inv.order.orderNumber}`, inv.order.poReference ? `PO:       ${inv.order.poReference}` : null, '',
      `${pad('Line', 6)}${pad('Description', 48)}${pad('Qty', 10)}Amount`,
      ...inv.order.lines.map((l) => `${pad(l.lineNumber, 6)}${pad(l.description || 'Material', 48)}${pad(num(l.qtyOrdered), 10)}${num(l.extendedPrice).toFixed(2)}`),
      '', `Subtotal: ${num(inv.subtotal).toFixed(2)}`, `Tax:      ${num(inv.taxAmount).toFixed(2)}`, `Freight:  ${num(inv.freightAmount).toFixed(2)}`,
      `Total:    ${num(inv.totalAmount).toFixed(2)}`, `Paid:     ${num(inv.paidAmount).toFixed(2)}`,
    ].filter((l) => l !== null);
    return { name: `Invoice ${inv.invoiceNumber}.txt`, content: lines.join('\n') };
  }
  if (kind === 'doc') {
    const d = await prisma.document.findUnique({ where: { id } });
    if (!d) return null;
    const content = [d.title || d.fileName, '', `Type: ${d.documentType}`, d.documentNumber ? `Number: ${d.documentNumber}` : null,
      `Issued: ${day(d.issueDate || d.createdAt)}`, '', 'The original file is held by your account rep; ask them for a copy.']
      .filter((l) => l !== null).join('\n');
    return { name: `${(d.title || d.fileName).replace(/\.[a-z0-9]+$/i, '')}.txt`, content };
  }
  return null;
}

// ─── My Orders (web orders) ───────────────────────────────────────────────

const WEB_STATUS = { NEEDS_REVIEW: 'NEEDS_REVIEW', HOLD: 'NEEDS_REVIEW', REJECTED: 'CANCELLED' };

async function toMyOrder(o, salesOrder) {
  const items = Array.isArray(o.items) ? o.items : [];
  const status = o.status === 'ACCEPTED' ? (salesOrder ? customerStatus(salesOrder) : 'CONFIRMED') : WEB_STATUS[o.status] || 'NEEDS_REVIEW';
  const history = [{ status: 'NEEDS_REVIEW', at: iso(o.receivedAt) }];
  if (o.status === 'ACCEPTED') history.push({ status: 'CONFIRMED', at: iso(o.decidedAt) });
  if (o.status === 'REJECTED') history.push({ status: 'CANCELLED', at: iso(o.decidedAt) });
  for (const s of salesOrder?.shipments || []) {
    if (s.shippedAt) history.push({ status: 'SHIPPED', at: iso(s.shippedAt) });
    if (s.deliveredAt) history.push({ status: 'DELIVERED', at: iso(s.deliveredAt) });
  }
  const subtotal = num(o.subtotal);
  const tax = salesOrder ? num(salesOrder.taxAmount) : 0;
  const note = o.notes || '';
  const po = /PO ([^·]+)/.exec(note)?.[1]?.trim() || salesOrder?.poReference || null;
  const pay = /Payment: ([^·]+)/.exec(note)?.[1]?.trim() || null;
  const ship = (salesOrder?.shipments || []).find((s) => s.bolNumber);
  return {
    id: o.id,
    orderNumber: o.externalOrderId,
    salesOrderNumber: salesOrder?.orderNumber || null,
    status,
    source: 'ONLINE',
    quoteRequested: o.source === 'ONLINE_QUOTE',
    createdAt: iso(o.receivedAt),
    updatedAt: iso(o.updatedAt),
    poNumber: po,
    paymentMethod: pay,
    deliveryMethod: o.shippingMethod,
    notes: note,
    holdReason: o.holdReason,
    rejectReason: o.rejectReason,
    trackingNumber: ship?.bolNumber || null,
    carrier: ship?.carrierName || null,
    lineCount: items.length,
    subtotal: money(subtotal),
    tax: money(tax),
    taxAmount: money(tax),
    total: money(subtotal + tax),
    statusHistory: history,
    lines: items.map((i, idx) => ({
      id: `${o.id}-${idx + 1}`,
      lineNumber: i.lineNumber || idx + 1,
      sku: i.sku || null,
      name: i.description || i.sku || 'Item',
      productName: i.description || i.sku || 'Item',
      description: i.description || i.sku || 'Item',
      quantity: num(i.qty),
      qty: num(i.qty),
      unitPrice: num(i.unitPrice),
      extended: i.extended != null ? num(i.extended) : money(num(i.qty) * num(i.unitPrice)),
      extPrice: i.extended != null ? num(i.extended) : money(num(i.qty) * num(i.unitPrice)),
      priceSource: i.priceSource || null,
      dimensions: i.dimensions || null,
    })),
  };
}

async function salesOrdersFor(onlineOrders) {
  const ids = onlineOrders.map((o) => o.internalOrderId).filter(Boolean);
  if (!ids.length) return new Map();
  const rows = await prisma.order.findMany({ where: { id: { in: ids } }, include: orderInclude });
  return new Map(rows.map((r) => [r.id, r]));
}

export async function listMyOrders({ customerId, status, search } = {}) {
  const tree = await accountTree(customerId);
  if (!tree) return { data: [], meta: { total: 0 } };
  const rows = await prisma.onlineOrder.findMany({ where: { customerId: { in: tree.ids } }, orderBy: { receivedAt: 'desc' }, take: 500 });
  const sos = await salesOrdersFor(rows);
  let data = await Promise.all(rows.map((o) => toMyOrder(o, sos.get(o.internalOrderId))));
  if (status) data = data.filter((o) => o.status === status);
  if (search) {
    const q = String(search).toLowerCase();
    data = data.filter((o) => [o.orderNumber, o.poNumber, o.salesOrderNumber, ...o.lines.map((l) => l.name)].some((v) => v && String(v).toLowerCase().includes(q)));
  }
  return { data, meta: { total: data.length } };
}

export async function getMyOrder(id) {
  const o = await prisma.onlineOrder.findUnique({ where: { id } });
  if (!o) return null;
  const sos = await salesOrdersFor([o]);
  return toMyOrder(o, sos.get(o.internalOrderId));
}

export async function myOrderDocuments(id) {
  const o = await prisma.onlineOrder.findUnique({ where: { id }, select: { internalOrderId: true, customerId: true } });
  if (!o?.internalOrderId || !o.customerId) return [];
  const tree = await accountTree(o.customerId);
  return tree ? accountDocuments(tree, { orderId: o.internalOrderId }) : [];
}
