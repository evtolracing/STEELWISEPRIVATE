import { listWindow, sendWindow } from '../lib/listing.js';
import { acrossBranches, currentScope } from '../lib/branchScope.js';
import { Router } from 'express';
import prisma from '../lib/db.js';
import { positiveQty } from '../lib/workflowRules.js';
import { ci } from '../lib/dbText.js';
import { searchStock } from '../services/intakeCatalogService.js';
import { COST_VIEWERS } from '../lib/roleAccess.js';
import { receiveStock, recentReceipts } from '../lib/receiving.js';
import { TEMPLATE_FORMS, MAX_UPLOAD_ROWS } from '../lib/receivingRules.js';
import { adjustStock, ADJUST_REASONS, STOCK_ADJUSTERS } from '../lib/stockChanges.js';
import { retryOverlap } from '../lib/numbering.js';

/** Cost goes only to the roles that manage it. */
const withoutCost = (req, row) => {
  if (!row || COST_VIEWERS.has(req.user?.role)) return row;
  const { unitCost, landedCost, avgCost, ...rest } = row;
  if (rest.coil) { const { unitCost: c1, landedCost: c2, ...coil } = rest.coil; rest.coil = coil; }
  return rest;
};

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { locationId, status } = req.query;
    const where = {
      ...(locationId && { locationId }),
      ...(status && { status })
    };
    const window = listWindow(req.query, { max: 200 });
    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          coil: { include: { grade: true, product: true, heat: true } },
          location: true
        },
        orderBy: { updatedAt: 'desc' },
        take: window.take,
        skip: window.skip,
      }),
      window.windowed ? prisma.inventory.count({ where }) : null,
    ]);
    sendWindow(res, inventory.map((row) => withoutCost(req, row)), { ...window, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// GET /api/inventory/search?search=&locationId=&division=&isRemnant=&limit=
// Order-intake shape: { data: [...], meta: { total } }
router.get('/search', async (req, res) => {
  try {
    const { search, locationId, division, isRemnant, limit } = req.query;
    const found = await searchStock({
      search,
      locationId,
      division,
      isRemnant: isRemnant === undefined ? undefined : isRemnant === 'true',
      limit,
    });
    res.json({ ...found, data: (found.data || []).map((row) => withoutCost(req, row)) });
  } catch (error) {
    console.error('Stock search failed:', error);
    res.status(500).json({ error: 'Stock search failed' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const [total, available, allocated, onHold] = await Promise.all([
      prisma.inventory.aggregate({ _sum: { qtyOnHand: true } }),
      prisma.inventory.aggregate({ _sum: { qtyAvailable: true } }),
      prisma.inventory.aggregate({ _sum: { qtyAllocated: true } }),
      prisma.inventory.aggregate({ _sum: { qtyOnHold: true } })
    ]);
    res.json({
      totalOnHand: total._sum.qtyOnHand || 0,
      totalAvailable: available._sum.qtyAvailable || 0,
      totalAllocated: allocated._sum.qtyAllocated || 0,
      totalOnHold: onHold._sum.qtyOnHold || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

router.post('/receive', async (req, res) => {
  try {
    const { coilId, locationId } = req.body || {};
    const qty = positiveQty(req.body?.qty);
    if (!coilId || !locationId) return res.status(400).json({ error: 'coilId and locationId are required' });
    if (qty === null) return res.status(400).json({ error: 'qty must be more than zero' });
    const [coil, location] = await Promise.all([
      prisma.coil.findUnique({ where: { id: coilId }, select: { id: true, inventory: { select: { locationId: true } } } }),
      prisma.location.findUnique({ where: { id: locationId }, select: { id: true } }),
    ]);
    if (!coil) return res.status(404).json({ error: 'Stock item not found' });
    if (!location) return res.status(400).json({ error: 'Location not found' });
    if (coil.inventory && coil.inventory.locationId !== locationId) {
      return res.status(409).json({ error: 'This item is stocked at another location. Transfer it first, or receive it where it is.' });
    }
    const [inventory, movement] = await prisma.$transaction([
      prisma.inventory.upsert({
        where: { coilId },
        create: { coilId, locationId, qtyOnHand: qty, qtyAvailable: qty },
        update: { qtyOnHand: { increment: qty }, qtyAvailable: { increment: qty }, lastMovement: new Date() },
      }),
      prisma.materialMovement.create({
        data: { coilId, toLocationId: locationId, movementType: 'RECEIVE', qtyMoved: qty, createdById: req.user.id },
      }),
    ]);
    res.status(201).json({ inventory, movement });
  } catch (error) {
    console.error('Inventory: receive failed:', error);
    res.status(500).json({ error: 'Failed to receive inventory' });
  }
});

// A tracked item (coil, plate, bundle) moves as one piece, so the whole
// quantity transfers. Splitting an item is a processing job, not a transfer.
router.post('/transfer', async (req, res) => {
  try {
    const { coilId, fromLocationId, toLocationId } = req.body || {};
    if (!coilId || !toLocationId) return res.status(400).json({ error: 'coilId and toLocationId are required' });
    const inv = await prisma.inventory.findUnique({ where: { coilId } });
    if (!inv) return res.status(404).json({ error: 'Stock item not found' });
    if (fromLocationId && fromLocationId !== inv.locationId) return res.status(409).json({ error: 'This item is not at the location you are transferring from' });
    if (toLocationId === inv.locationId) return res.status(400).json({ error: 'The item is already at that location' });
    if (!(await prisma.location.findUnique({ where: { id: toLocationId }, select: { id: true } }))) {
      return res.status(400).json({ error: 'Destination location not found' });
    }
    const onHand = Number(inv.qtyOnHand);
    if (onHand <= 0) return res.status(409).json({ error: 'There is nothing on hand to transfer' });
    // A reservation travels with its item: stock reserved at one branch for an order is often
    // transferred to the branch that will process and ship it. The whole item moves, so the
    // reserved quantity and the reservation rows stay in step.
    if (req.body.qty != null) {
      const qty = positiveQty(req.body.qty);
      if (qty === null) return res.status(400).json({ error: 'qty must be more than zero' });
      if (Math.abs(qty - onHand) > 1e-6) {
        return res.status(409).json({ error: `A tracked item transfers whole: ${onHand} ${inv.unit} is on hand. To move part of it, cut it into a new item first.` });
      }
    }
    const result = await prisma.$transaction(async (tx) => {
      const moved = await tx.inventory.updateMany({ where: { coilId, locationId: inv.locationId }, data: { locationId: toLocationId, lastMovement: new Date() } });
      if (!moved.count) return null;
      await tx.coil.update({ where: { id: coilId }, data: { locationId: toLocationId } });
      const movement = await tx.materialMovement.create({
        data: { coilId, fromLocationId: inv.locationId, toLocationId, movementType: 'TRANSFER', qtyMoved: onHand, unit: inv.unit, createdById: req.user.id },
      });
      // The item is now at the other branch; the sender is shown the result of their own transfer once.
      return { inventory: await acrossBranches(() => tx.inventory.findUnique({ where: { coilId } })), movement };
    });
    if (!result) return res.status(409).json({ error: 'This item was just moved by someone else. Reload and try again.' });
    res.json(result);
  } catch (error) {
    console.error('Inventory: transfer failed:', error);
    res.status(500).json({ error: 'Failed to transfer inventory' });
  }
});

/**
 * Corrects a stock balance after a count, or for damage, scrap, found stock or a keying error.
 * Managers and the inventory manager only. A reason and a note are required, and the change is a
 * movement in the item's history: the balance is never simply overwritten.
 */
router.post('/adjust', async (req, res) => {
  try {
    if (!STOCK_ADJUSTERS.has(req.user?.role)) return res.status(403).json({ error: 'Correcting a stock balance is for a manager or the inventory manager' });
    const { coilId } = req.body || {};
    if (!coilId || typeof coilId !== 'string') return res.status(400).json({ error: 'coilId is required' });
    const reason = String(req.body.reason || req.body.reasonCode || '').toUpperCase();
    if (!ADJUST_REASONS.includes(reason)) return res.status(400).json({ error: `reason must be one of: ${ADJUST_REASONS.join(', ')}` });
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, 1000) : '';
    if (notes.length < 5) return res.status(400).json({ error: 'A note saying what was found is required (at least 5 characters)' });
    const hasCount = req.body.countedQty != null && req.body.countedQty !== '';
    const hasChange = req.body.change != null && req.body.change !== '';
    if (hasCount === hasChange) return res.status(400).json({ error: 'Give either countedQty (what is actually there) or change (the difference), not both' });
    const value = Number(hasCount ? req.body.countedQty : req.body.change);
    if (!Number.isFinite(value) || Math.abs(value) > 10000000) return res.status(400).json({ error: `${hasCount ? 'countedQty' : 'change'} must be a number` });
    if (hasCount && value < 0) return res.status(400).json({ error: 'countedQty cannot be less than zero' });
    if (hasChange && value === 0) return res.status(400).json({ error: 'change cannot be zero' });
    if (Math.round(value * 10000) / 10000 !== value) return res.status(400).json({ error: 'Quantities are kept to four decimal places' });
    if (reason === 'FOUND' && hasChange && value < 0) return res.status(400).json({ error: 'Found stock adds to the balance' });
    if (['DAMAGE', 'SCRAP'].includes(reason) && hasChange && value > 0) return res.status(400).json({ error: 'Damage and scrap take away from the balance' });
    // The branch boundary applies: an item at another branch is not found.
    if (!(await prisma.inventory.findUnique({ where: { coilId }, select: { id: true } }))) return res.status(404).json({ error: 'Stock item not found' });
    const result = await retryOverlap(() => prisma.$transaction((tx) => adjustStock(tx, {
      coilId, reason, notes, userId: req.user.id, ...(hasCount ? { countedQty: value } : { change: value }),
    })));
    res.status(result.movement ? 201 : 200).json(result);
  } catch (error) {
    if (error?.refuse) return res.status(error.status).json({ error: error.message });
    console.error('Inventory: adjustment failed:', error);
    res.status(500).json({ error: 'Failed to adjust inventory' });
  }
});

router.get('/locations', async (req, res) => {
  try {
    // The branches to offer in a "which branch" list: the user's own (lib/branchScope.js).
    // ?all=true lists every branch, for choosing where a transfer goes.
    const mine = req.query.all === 'true' ? null : currentScope()?.branches;
    const locations = await prisma.location.findMany({
      where: { isActive: true, ...(mine && { id: { in: mine } }) },
      orderBy: { code: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// POST /api/inventory/receipts: receive one stock item (the Receive form).
router.post('/receipts', async (req, res) => {
  try {
    const done = await receiveStock({ input: req.body, user: req.user });
    res.status(201).json({ item: withoutCost(req, done.coil), inventory: withoutCost(req, done.inventory), movement: done.movement, ...(done.warning && { warning: done.warning }) });
  } catch (error) {
    if (error?.refuse) return res.status(error.status).json({ error: error.message });
    console.error('Inventory: receipt failed:', error);
    res.status(500).json({ error: 'The item could not be received' });
  }
});

// GET /api/inventory/receipts?limit=&days=: what was received lately, newest first.
router.get('/receipts', async (req, res) => {
  try {
    res.json({ data: await recentReceipts({ limit: req.query.limit, days: req.query.days }) });
  } catch (error) {
    console.error('Inventory: receipts list failed:', error);
    res.status(500).json({ error: 'The receipts could not be loaded' });
  }
});

// POST /api/inventory/bulk-upload { templateType, items, locationCode? }
// Each row is received by the same rule as the Receive form. A row that cannot be received is
// reported with its reason; the reply says how many rows were really saved.
router.post('/bulk-upload', async (req, res) => {
  try {
    const { templateType, items, locationCode } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items provided for upload' });
    if (items.length > MAX_UPLOAD_ROWS) return res.status(400).json({ error: `An upload can hold ${MAX_UPLOAD_ROWS} rows at most. Split the file and upload it in parts.` });
    if (!Object.prototype.hasOwnProperty.call(TEMPLATE_FORMS, templateType)) return res.status(400).json({ error: `Unknown upload type. Use one of: ${Object.keys(TEMPLATE_FORMS).join(', ')}` });
    const results = { imported: 0, skipped: 0, errors: [], warnings: [] };
    for (const [index, item] of items.entries()) {
      const row = item && typeof item === 'object' ? { ...item, location_code: item.location_code || locationCode } : item;
      try {
        const done = await receiveStock({ input: row, templateType, user: req.user, source: 'UPLOAD' });
        results.imported++;
        if (done.warning) results.warnings.push({ row: index + 1, tag: done.coil.coilNumber, warning: done.warning });
      } catch (rowError) {
        if (!rowError?.refuse) console.error('Inventory: upload row failed:', rowError);
        results.skipped++;
        results.errors.push({ row: index + 1, tag: item?.tag_number ? String(item.tag_number).slice(0, 60) : null, error: rowError?.refuse ? rowError.message : 'This row could not be saved' });
      }
    }
    res.status(results.imported ? 201 : 400).json({
      success: results.imported > 0,
      imported: results.imported,
      skipped: results.skipped,
      errors: results.errors.slice(0, 200),
      warnings: results.warnings.slice(0, 200),
      message: results.skipped
        ? `${results.imported} of ${items.length} items were received. ${results.skipped} could not be received.`
        : `${results.imported} items were received.`,
      ...(results.imported === 0 && { error: `None of the ${items.length} items could be received. First reason: ${results.errors[0]?.error}` }),
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'The upload could not be processed' });
  }
});

// Download template endpoint
router.get('/templates/:type', (req, res) => {
  const { type } = req.params;
  
  const templates = {
    coils: {
      filename: 'inventory_coils_template.csv',
      headers: ['tag_number', 'heat_number', 'material_code', 'grade', 'thickness', 'width', 'weight_lbs', 'coil_od', 'coil_id', 'location_code', 'bay_position', 'ownership', 'customer_name', 'po_number', 'mill_name', 'notes'],
      example: ['TAG-001', 'HT-2024-001', 'HR-COIL-125-48', 'A36', '0.125', '48', '45000', '72', '24', 'DET-A', 'A-01', 'HOUSE_OWNED', '', 'PO-12345', 'Nucor', 'Mill cert attached'],
    },
    sheets: {
      filename: 'inventory_sheets_template.csv',
      headers: ['tag_number', 'heat_number', 'material_code', 'grade', 'thickness', 'width', 'length', 'quantity_pcs', 'weight_lbs', 'location_code', 'bay_position', 'ownership', 'customer_name', 'po_number', 'notes'],
      example: ['SHT-001', 'HT-2024-002', 'CR-SHT-16GA-48-96', 'CQ', '0.060', '48', '96', '50', '2450', 'DET-B', 'B-12', 'HOUSE_OWNED', '', 'PO-12346', ''],
    },
    plates: {
      filename: 'inventory_plates_template.csv',
      headers: ['tag_number', 'heat_number', 'material_code', 'grade', 'thickness', 'width', 'length', 'quantity_pcs', 'weight_lbs', 'location_code', 'bay_position', 'ownership', 'customer_name', 'po_number', 'notes'],
      example: ['PLT-001', 'HT-2024-004', 'HR-PLT-500-96-240', 'A36', '0.500', '96', '240', '1', '3267', 'DET-B', 'B-02', 'HOUSE_OWNED', '', 'PO-12348', ''],
    },
    bars: {
      filename: 'inventory_bars_template.csv',
      headers: ['tag_number', 'heat_number', 'material_code', 'grade', 'size_description', 'length_ft', 'quantity_pcs', 'weight_lbs', 'location_code', 'bay_position', 'bundle_number', 'ownership', 'customer_name', 'po_number', 'notes'],
      example: ['BAR-001', 'HT-2024-003', 'RND-1018-1.5', '1018', '1.5 Round', '20', '25', '1875', 'DET-C', 'C-05', 'BDL-001', 'HOUSE_OWNED', '', 'PO-12347', ''],
    },
    remnants: {
      filename: 'inventory_remnants_template.csv',
      headers: ['tag_number', 'parent_tag', 'material_code', 'grade', 'thickness', 'width', 'length', 'weight_lbs', 'location_code', 'bay_position', 'condition', 'price_override', 'notes'],
      example: ['REM-001', 'TAG-001', 'HR-COIL-125-48', 'A36', '0.125', '36', '48', '350', 'DET-REM', 'R-01', 'GOOD', '0.45', 'Clean edges'],
    },
    plastics: {
      filename: 'inventory_plastics_template.csv',
      headers: ['tag_number', 'lot_number', 'material_code', 'material_type', 'color', 'thickness', 'width', 'length', 'quantity_pcs', 'weight_lbs', 'location_code', 'bay_position', 'ownership', 'customer_name', 'notes'],
      example: ['PLS-001', 'LOT-2024-001', 'HDPE-SHT-0.5-48-96', 'HDPE', 'Natural', '0.500', '48', '96', '20', '640', 'DET-P', 'P-03', 'HOUSE_OWNED', '', ''],
    },
  };
  
  const template = templates[type];
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  const csv = [template.headers.join(','), template.example.join(',')].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
  res.send(csv);
});

export default router;
