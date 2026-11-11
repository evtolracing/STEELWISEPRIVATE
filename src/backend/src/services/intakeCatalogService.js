/**
 * Product and stock search in the shape the order-intake screens use
 * (material picker, retail POS). Reads Product, Coil, Inventory, Location.
 */
import prisma from '../lib/db.js';
import { ci } from '../lib/dbText.js';

const num = (v) => (v == null ? null : Number(v));
const fmt = (v) => {
  const n = num(v);
  return n == null ? null : `${Number(n.toFixed(3))}"`;
};
const range = (min, max) => {
  if (min == null && max == null) return 'N/A';
  if (min != null && max != null && Number(min) !== Number(max)) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max);
};

/** Price per pound (or per each) from the stored base price. */
export function unitPrice(product) {
  const base = num(product.basePriceCwt);
  if (base == null) return { basePrice: null, priceUnit: product.priceUnit === 'EACH' ? 'EA' : 'LB' };
  switch (product.priceUnit) {
    case 'CWT': return { basePrice: Number((base / 100).toFixed(4)), priceUnit: 'LB' };
    case 'TON': return { basePrice: Number((base / 2000).toFixed(4)), priceUnit: 'LB' };
    case 'EACH': return { basePrice: base, priceUnit: 'EA' };
    case 'LF': return { basePrice: base, priceUnit: 'LF' };
    default: return { basePrice: base, priceUnit: 'LB' };
  }
}

function toIntakeProduct(p, inStockIds) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    form: p.form,
    grade: p.grade?.code || 'N/A',
    spec: p.specStandard || p.grade?.specStandard || 'N/A',
    division: p.division,
    category: p.category || 'Uncategorized',
    thicknessRange: range(p.thicknessMin, p.thicknessMax),
    widthRange: range(p.widthMin, p.widthMax),
    ...unitPrice(p),
    inStock: inStockIds.has(p.id),
    isRemnant: p.isRemnant,
  };
}

async function productIdsInStock(productIds) {
  if (!productIds.length) return new Set();
  const rows = await prisma.coil.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds }, status: 'AVAILABLE' },
    _count: { _all: true },
  });
  return new Set(rows.map((r) => r.productId));
}

export async function searchProducts({ search, division, category, limit = 25 } = {}) {
  const where = { isActive: true };
  if (division) where.division = division;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, ...ci } },
      { sku: { contains: search, ...ci } },
      { grade: { code: { contains: search, ...ci } } },
    ];
  }
  const take = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 200);
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, include: { grade: true }, orderBy: { sku: 'asc' }, take }),
    prisma.product.count({ where }),
  ]);
  const inStock = await productIdsInStock(rows.map((r) => r.id));
  return { data: rows.map((p) => toIntakeProduct(p, inStock)), meta: { total } };
}

export async function getIntakeProduct(id) {
  const p = await prisma.product.findUnique({ where: { id }, include: { grade: true } });
  if (!p) return null;
  return toIntakeProduct(p, await productIdsInStock([p.id]));
}

export async function productCategories(division) {
  const rows = await prisma.product.groupBy({
    by: ['category'],
    where: { isActive: true, ...(division ? { division } : {}) },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ name: r.category || 'Uncategorized', count: r._count._all }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function dims(c) {
  const parts = [c.thicknessIn, c.widthIn, c.lengthIn].filter((v) => v != null).map(fmt);
  return parts.join(' × ');
}

function toIntakeStock(inv) {
  const c = inv.coil;
  const p = c.product;
  const weight = num(inv.qtyAvailable);
  return {
    id: inv.id,
    productId: c.productId,
    sku: p?.sku || c.coilNumber,
    name: p?.name || null,
    description: [p?.name || `${c.grade?.code || ''} ${c.form}`.trim(), dims(c)].filter(Boolean).join(' '),
    locationId: inv.locationId,
    locationName: inv.location?.name || null,
    division: p?.division || 'METALS',
    form: c.form,
    grade: c.grade?.code || null,
    thickness: num(c.thicknessIn),
    width: num(c.widthIn),
    length: num(c.lengthIn),
    weight,
    qty: 1,
    unit: inv.unit,
    status: c.status,
    isRemnant: Boolean(p?.isRemnant),
    lotNumber: c.coilNumber,
    heatNumber: c.heat?.heatNumber || null,
    ...(p ? unitPrice(p) : { basePrice: null, priceUnit: 'LB' }),
    unitCost: num(inv.unitCost),
  };
}

export async function searchStock({ search, locationId, division, isRemnant, limit = 50 } = {}) {
  const where = { status: 'ACTIVE', qtyAvailable: { gt: 0 } };
  if (locationId) where.locationId = locationId;
  const coil = {};
  const product = {};
  if (division) product.division = division;
  if (isRemnant !== undefined) product.isRemnant = isRemnant;
  if (Object.keys(product).length) coil.product = product;
  if (search) {
    coil.OR = [
      { coilNumber: { contains: search, ...ci } },
      { grade: { code: { contains: search, ...ci } } },
      { product: { name: { contains: search, ...ci } } },
      { product: { sku: { contains: search, ...ci } } },
    ];
  }
  if (Object.keys(coil).length) where.coil = coil;
  const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  const [rows, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: { coil: { include: { grade: true, product: true, heat: true } }, location: true },
      orderBy: { updatedAt: 'desc' },
      take,
    }),
    prisma.inventory.count({ where }),
  ]);
  return { data: rows.map(toIntakeStock), meta: { total } };
}
