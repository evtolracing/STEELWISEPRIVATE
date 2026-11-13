import { Router } from 'express';
import prisma from '../lib/db.js';
import { positiveQty } from '../lib/workflowRules.js';
import { ci } from '../lib/dbText.js';
import { searchStock } from '../services/intakeCatalogService.js';
import { COST_VIEWERS } from '../lib/roleAccess.js';

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
    const inventory = await prisma.inventory.findMany({
      where: {
        ...(locationId && { locationId }),
        ...(status && { status })
      },
      include: {
        coil: { include: { grade: true, product: true, heat: true } },
        location: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 200
    });
    res.json(inventory.map((row) => withoutCost(req, row)));
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
      return { inventory: await tx.inventory.findUnique({ where: { coilId } }), movement };
    });
    if (!result) return res.status(409).json({ error: 'This item was just moved by someone else. Reload and try again.' });
    res.json(result);
  } catch (error) {
    console.error('Inventory: transfer failed:', error);
    res.status(500).json({ error: 'Failed to transfer inventory' });
  }
});

router.get('/locations', async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Bulk inventory upload endpoint
router.post('/bulk-upload', async (req, res) => {
  try {
    const { templateType, items, locationCode, userId } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided for upload' });
    }
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: [],
    };
    
    // Process each item
    for (const item of items) {
      try {
        // Find or use provided location
        const locCode = item.location_code || locationCode;
        let location = null;
        
        if (locCode) {
          location = await prisma.location.findFirst({
            where: { 
              OR: [
                { code: locCode },
                { name: { contains: locCode, ...ci } }
              ]
            }
          });
        }
        
        // Map ownership to enum value
        let ownership = 'HOUSE_OWNED';
        if (item.ownership) {
          const ownershipUpper = item.ownership.toUpperCase();
          if (ownershipUpper === 'CUSTOMER_OWNED' || ownershipUpper === 'TOLL') {
            ownership = 'CUSTOMER_OWNED';
          } else if (ownershipUpper === 'CONSIGNMENT') {
            ownership = 'CONSIGNMENT';
          }
        }
        
        // Create inventory record based on template type
        const inventoryData = {
          tagNumber: item.tag_number || `TAG-${Date.now()}-${results.imported}`,
          materialCode: item.material_code,
          heatNumber: item.heat_number || null,
          grade: item.grade || null,
          weight: parseFloat(item.weight_lbs) || 0,
          thickness: parseFloat(item.thickness) || null,
          width: parseFloat(item.width) || null,
          length: parseFloat(item.length) || null,
          quantity: parseInt(item.quantity_pcs) || 1,
          locationId: location?.id || null,
          bayPosition: item.bay_position || null,
          ownership,
          customerName: item.customer_name || null,
          poNumber: item.po_number || null,
          millName: item.mill_name || null,
          notes: item.notes || null,
          status: 'AVAILABLE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Additional fields based on template type
        if (templateType === 'coils') {
          inventoryData.coilOd = parseFloat(item.coil_od) || null;
          inventoryData.coilId = parseFloat(item.coil_id) || null;
        } else if (templateType === 'remnants') {
          inventoryData.parentTag = item.parent_tag || null;
          inventoryData.isRemnant = true;
          inventoryData.priceOverride = parseFloat(item.price_override) || null;
          inventoryData.condition = item.condition || 'GOOD';
        } else if (templateType === 'bars') {
          inventoryData.bundleNumber = item.bundle_number || null;
          inventoryData.lengthFt = parseFloat(item.length_ft) || null;
          inventoryData.sizeDescription = item.size_description || null;
        } else if (templateType === 'plastics') {
          inventoryData.lotNumber = item.lot_number || null;
          inventoryData.materialType = item.material_type || null;
          inventoryData.color = item.color || null;
        }
        
        // For now, store in a generic inventory table or create movement
        // This is a simplified version - in production would create proper coil/unit records
        await prisma.materialMovement.create({
          data: {
            movementType: 'RECEIVE',
            qtyMoved: inventoryData.quantity,
            weightMoved: inventoryData.weight,
            toLocationId: location?.id,
            notes: JSON.stringify({
              bulkUpload: true,
              templateType,
              ...inventoryData,
            }),
            createdAt: new Date(),
          }
        });
        
        results.imported++;
      } catch (itemError) {
        results.skipped++;
        results.errors.push({
          tag: item.tag_number,
          error: itemError.message,
        });
      }
    }
    
    res.status(201).json({
      success: true,
      imported: results.imported,
      skipped: results.skipped,
      errors: results.errors.slice(0, 10), // Limit error details
      message: `Successfully imported ${results.imported} of ${items.length} items`,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to process bulk upload', details: error.message });
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
