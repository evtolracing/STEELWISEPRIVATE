import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
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
    const { coilId, locationId, qty, userId } = req.body;
    const [inventory, movement] = await prisma.$transaction([
      prisma.inventory.upsert({
        where: { coilId },
        create: { coilId, locationId, qtyOnHand: qty, qtyAvailable: qty },
        update: { qtyOnHand: { increment: qty }, qtyAvailable: { increment: qty } }
      }),
      prisma.materialMovement.create({
        data: {
          coilId, toLocationId: locationId, movementType: 'RECEIVE',
          qtyMoved: qty, createdById: userId
        }
      })
    ]);
    res.status(201).json({ inventory, movement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to receive inventory' });
  }
});

router.post('/transfer', async (req, res) => {
  try {
    const { coilId, fromLocationId, toLocationId, qty, userId } = req.body;
    const [inventory, movement] = await prisma.$transaction([
      prisma.inventory.update({
        where: { coilId },
        data: { locationId: toLocationId }
      }),
      prisma.materialMovement.create({
        data: {
          coilId, fromLocationId, toLocationId, movementType: 'TRANSFER',
          qtyMoved: qty, createdById: userId
        }
      })
    ]);
    res.json({ inventory, movement });
  } catch (error) {
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
                { name: { contains: locCode, mode: 'insensitive' } }
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
