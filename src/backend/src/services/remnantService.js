/**
 * Remnant inventory and aging-based remnant pricing.
 *
 * Pricing: list price per lb (from the catalog product for the grade, falling
 * back to a default table) less an aging discount (25/35/50/65% for
 * <30 / 30-60 / 60-90 / 90+ days) plus a condition discount (B +5%, C +15%),
 * capped at 85% off and never below the family's scrap value.
 */
import prisma from '../lib/db.js';
import { ci } from '../lib/dbText.js';
import { unitPrice } from './intakeCatalogService.js';

const DAY = 86400000;

export const AGING_DISCOUNT = {
  FRESH: { maxDays: 30, discount: 0.25, label: 'Fresh (−25%)' },
  MID: { maxDays: 60, discount: 0.35, label: 'Mid-Age (−35%)' },
  OLD: { maxDays: 90, discount: 0.5, label: 'Clearance (−50%)' },
  STALE: { maxDays: 9999, discount: 0.65, label: 'Deep Clearance (−65%)' },
};
const AGING_RANGES = { FRESH: [0, 30], MID: [30, 60], OLD: [60, 90], STALE: [90, null] };

export const CONDITION_ADJUSTMENT = {
  A: { extra: 0, label: 'Prime — no extra discount' },
  B: { extra: 0.05, label: 'Good — additional 5% off' },
  C: { extra: 0.15, label: 'Fair — additional 15% off' },
};

const SCRAP_FLOOR_PER_LB = {
  'Carbon Steel': 0.08, 'HSLA Steel': 0.09, 'Stainless Steel': 0.45, Aluminum: 0.5,
  'Brass & Copper': 1.2, Polyethylene: 0.3, 'Ultra-High MW': 0.4,
};
const DEFAULT_SCRAP = 0.05;

// Used only when the catalog has no priced product for the grade.
const DEFAULT_LIST_PRICES = {
  A36: 0.42, 'A572-50': 0.48, 1018: 0.68, 304: 1.85, '316L': 2.95,
  '6061-T6': 2.45, C360: 3.8, HDPE: 3.2, UHMW: 5.1,
};

const TYPES = ['DROP', 'OFFCUT', 'OVERRUN', 'RETURN', 'SKELETON'];

export const ageDays = (cutDate) => (cutDate ? Math.floor((Date.now() - new Date(cutDate).getTime()) / DAY) : 999);

function agingKey(days) {
  if (days < 30) return 'FRESH';
  if (days < 60) return 'MID';
  if (days < 90) return 'OLD';
  return 'STALE';
}

const day = (d) => (d ? d.toISOString().split('T')[0] : null);

export function toApi(r) {
  return {
    id: r.id, sku: r.sku, name: r.name, grade: r.grade, spec: r.spec, form: r.form, family: r.family,
    type: r.type, condition: r.condition,
    thickness: r.thickness, width: r.width, length: r.length, uom: r.uom,
    estimatedWeight: r.estimatedWeight, pricePerLb: Number(r.pricePerLb),
    location: r.location, locationName: r.locationName || r.location,
    heatNumber: r.heatNumber, parentJobId: r.parentJobId,
    cutDate: day(r.cutDate), receivedDate: day(r.receivedDate),
    qtyAvailable: r.qtyAvailable, reserved: r.reserved, reservedFor: r.reservedFor,
    imageUrl: r.imageUrl, notes: r.notes, division: r.division,
    ageDays: ageDays(r.cutDate), agingKey: agingKey(ageDays(r.cutDate)),
  };
}

const num = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

function buildWhere(p) {
  const where = {};
  for (const k of ['grade', 'form', 'family', 'location', 'condition', 'type']) if (p[k]) where[k] = String(p[k]);
  const range = (field, min, max) => {
    const f = {};
    if (num(min) !== null) f.gte = num(min);
    if (num(max) !== null) f.lte = num(max);
    if (Object.keys(f).length) where[field] = f;
  };
  range('thickness', p.minThickness, p.maxThickness);
  range('width', p.minWidth, p.maxWidth);
  range('length', p.minLength, p.maxLength);
  if (p.agingBucket && AGING_RANGES[p.agingBucket]) {
    const [lo, hi] = AGING_RANGES[p.agingBucket];
    const cut = { lte: new Date(Date.now() - lo * DAY) };
    if (hi !== null) cut.gt = new Date(Date.now() - hi * DAY);
    where.cutDate = p.agingBucket === 'STALE' ? undefined : cut;
    if (p.agingBucket === 'STALE') where.OR = [{ cutDate: null }, { cutDate: cut }];
  }
  if (p.query) {
    const q = String(p.query);
    const text = [
      { name: { contains: q, ...ci } }, { sku: { contains: q, ...ci } }, { grade: { contains: q, ...ci } },
      { notes: { contains: q, ...ci } }, { heatNumber: { contains: q, ...ci } },
    ];
    where.AND = [...(where.AND || []), { OR: text }];
  }
  return where;
}

const ORDER = { cutDate: 'cutDate', price: 'pricePerLb', weight: 'estimatedWeight' };

export async function searchRemnants(p = {}) {
  const where = buildWhere(p);
  const take = Math.min(Math.max(parseInt(p.limit, 10) || 50, 1), 200);
  const skip = Math.max(parseInt(p.offset, 10) || 0, 0);
  const dir = p.sortDir === 'asc' ? 'asc' : 'desc';
  const [rows, total, facetRows] = await Promise.all([
    prisma.remnant.findMany({ where, orderBy: [{ [ORDER[p.sortBy] || 'cutDate']: dir }, { sku: 'asc' }], take, skip }),
    prisma.remnant.count({ where }),
    prisma.remnant.findMany({ select: { grade: true, form: true, family: true, location: true } }),
  ]);
  const uniq = (k) => [...new Set(facetRows.map((r) => r[k]))].sort();
  return {
    data: rows.map(toApi),
    meta: { total, limit: take, offset: skip },
    facets: {
      grades: uniq('grade'), forms: uniq('form'), families: uniq('family'), locations: uniq('location'),
      conditions: Object.keys(CONDITION_ADJUSTMENT), types: TYPES, agingBuckets: Object.keys(AGING_DISCOUNT),
    },
  };
}

export async function getRemnant(id) {
  const r = await prisma.remnant.findUnique({ where: { id } });
  return r ? toApi(r) : null;
}

export async function remnantStats() {
  const all = await prisma.remnant.findMany();
  const byAging = { FRESH: 0, MID: 0, OLD: 0, STALE: 0 };
  const byCondition = { A: 0, B: 0, C: 0 };
  const byLocation = {};
  let totalPieces = 0, totalWeight = 0, totalValue = 0;
  for (const r of all) {
    const q = r.qtyAvailable;
    totalPieces += q;
    totalWeight += r.estimatedWeight * q;
    totalValue += r.estimatedWeight * Number(r.pricePerLb) * q;
    byAging[agingKey(ageDays(r.cutDate))] += q;
    byCondition[r.condition] = (byCondition[r.condition] || 0) + q;
    byLocation[r.location] = (byLocation[r.location] || 0) + q;
  }
  return {
    totalPieces, totalWeight: +totalWeight.toFixed(1), totalValue: +totalValue.toFixed(2),
    uniqueItems: all.length, byAging, byCondition, byLocation,
  };
}

/** List price per lb for a grade: the catalog's non-remnant product, else the default table. */
export async function listPriceForGrade(grade) {
  if (grade) {
    const product = await prisma.product.findFirst({
      where: { isActive: true, isRemnant: false, grade: { code: String(grade) } },
      orderBy: { sku: 'asc' },
    });
    if (product) {
      const { basePrice, priceUnit } = unitPrice(product);
      if (basePrice > 0 && priceUnit === 'LB') return basePrice;
    }
  }
  return DEFAULT_LIST_PRICES[grade] || 1.0;
}

export async function suggestRemnants({ grade, form, thickness, width, length, location }) {
  const where = { qtyAvailable: { gte: 1 }, reserved: false };
  if (grade) where.grade = String(grade);
  if (form) where.form = String(form);
  if (num(thickness)) where.thickness = { gte: num(thickness) - 0.01 };
  if (num(width)) where.width = { gte: num(width) - 0.5 };
  if (num(length)) where.length = { gte: num(length) - 0.5 };
  const matches = (await prisma.remnant.findMany({ where, take: 200 })).map(toApi);
  // Same location first, then oldest first (push aged stock).
  matches.sort((a, b) => {
    if (location) {
      const d = (a.location === location ? 0 : 1) - (b.location === location ? 0 : 1);
      if (d) return d;
    }
    return b.ageDays - a.ageDays;
  });
  const top = matches.slice(0, 5);
  const listPrices = new Map();
  for (const g of new Set(top.map((r) => r.grade))) listPrices.set(g, await listPriceForGrade(g));
  return {
    data: top.map((r) => ({
      ...r,
      savingsVsNewCut: +(r.estimatedWeight * (listPrices.get(r.grade) - r.pricePerLb)).toFixed(2),
    })),
    meta: { totalMatches: matches.length },
  };
}

export async function reserveRemnant(id, orderId) {
  const r = await prisma.remnant.findUnique({ where: { id } });
  if (!r) return { status: 404, error: 'Remnant not found' };
  if (r.reserved && r.reservedFor !== (orderId || null)) return { status: 409, error: `Remnant is already reserved for ${r.reservedFor || 'another order'}` };
  if (r.qtyAvailable < 1) return { status: 409, error: 'Remnant is no longer available' };
  const updated = await prisma.remnant.update({ where: { id }, data: { reserved: true, reservedFor: orderId || null, reservedAt: new Date() } });
  return { data: toApi(updated) };
}

export async function releaseRemnant(id) {
  const r = await prisma.remnant.findUnique({ where: { id } });
  if (!r) return { status: 404, error: 'Remnant not found' };
  await prisma.remnant.update({ where: { id }, data: { reserved: false, reservedFor: null, reservedAt: null } });
  return { success: true };
}

export async function priceRemnant({ grade, condition = 'A', ageDays: days = 0, weight = 0, family, qty = 1 } = {}) {
  const listPrice = await listPriceForGrade(grade);
  const tier = AGING_DISCOUNT[agingKey(Number(days) || 0)];
  const cond = CONDITION_ADJUSTMENT[condition] || CONDITION_ADJUSTMENT.A;
  const totalDiscount = Math.min(tier.discount + cond.extra, 0.85);
  const scrapFloor = SCRAP_FLOOR_PER_LB[family] ?? DEFAULT_SCRAP;
  const remnantPrice = Math.max(+(listPrice * (1 - totalDiscount)).toFixed(4), scrapFloor);
  const w = Number(weight) || 0, q = Number(qty) || 1;
  const lineTotal = +(remnantPrice * w * q).toFixed(2);
  const listTotal = +(listPrice * w * q).toFixed(2);
  return {
    listPricePerLb: listPrice,
    remnantPricePerLb: +remnantPrice.toFixed(4),
    agingDiscount: tier.discount,
    agingTierLabel: tier.label,
    conditionDiscount: cond.extra,
    conditionLabel: cond.label,
    totalDiscount,
    totalDiscountPct: +(totalDiscount * 100).toFixed(1),
    lineTotal,
    listTotal,
    savingsVsList: +(listTotal - lineTotal).toFixed(2),
    savingsPct: listTotal > 0 ? +((1 - lineTotal / listTotal) * 100).toFixed(1) : 0,
    scrapFloor,
    atFloor: remnantPrice <= scrapFloor,
    pricingTier: tier.label,
  };
}

export async function batchPrice(items = []) {
  const data = [];
  let totalList = 0, totalRemnant = 0, totalSavings = 0;
  for (const item of items) {
    const p = await priceRemnant(item);
    data.push({ remnantId: item.remnantId, ...p });
    totalList += p.listTotal; totalRemnant += p.lineTotal; totalSavings += p.savingsVsList;
  }
  return {
    data,
    summary: {
      totalList: +totalList.toFixed(2), totalRemnant: +totalRemnant.toFixed(2), totalSavings: +totalSavings.toFixed(2),
      avgDiscount: totalList > 0 ? +((1 - totalRemnant / totalList) * 100).toFixed(1) : 0,
    },
  };
}

/** Lowest price per lb a CSR may approve without a manager: max(scrap + 10%, 15% of list). */
export async function csrPriceFloor(grade, family) {
  const scrap = SCRAP_FLOOR_PER_LB[family] ?? DEFAULT_SCRAP;
  const list = await listPriceForGrade(grade);
  const floor = Math.max(scrap * 1.1, list * 0.15);
  return { floor: +floor.toFixed(4), scrapValue: scrap, listPrice: list, maxDiscountPct: +((1 - floor / list) * 100).toFixed(1) };
}
