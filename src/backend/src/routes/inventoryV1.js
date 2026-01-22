/**
 * Inventory API v1 Routes
 * RESTful inventory management with RFID + Etched ID support
 * In-memory data for development
 */

import { Router } from 'express';

const router = Router();

// ============================================
// IN-MEMORY DATABASE
// ============================================

// Catalog Items (materials available)
const catalogItems = [
  { materialCode: 'HR-0125-48', description: 'Hot Rolled 0.125" x 48"', commodity: 'STEEL', form: 'COIL', grade: 'A36', thickness: 0.125, unit: 'LBS' },
  { materialCode: 'CR-0060-36', description: 'Cold Rolled 0.060" x 36"', commodity: 'STEEL', form: 'SHEET', grade: 'CQ', thickness: 0.060, unit: 'LBS' },
  { materialCode: 'SS-304-0048-48', description: 'Stainless 304 0.048" x 48"', commodity: 'STAINLESS', form: 'COIL', grade: '304', thickness: 0.048, unit: 'LBS' },
  { materialCode: 'AL-6061-100', description: 'Aluminum 6061 1.00" Plate', commodity: 'ALUMINUM', form: 'PLATE', grade: '6061-T6', thickness: 1.0, unit: 'LBS' },
  { materialCode: 'GALV-0060-48', description: 'Galvanized 0.060" x 48"', commodity: 'STEEL', form: 'COIL', grade: 'G90', thickness: 0.060, unit: 'LBS' },
  { materialCode: 'POLY-HDPE-0500', description: 'HDPE Sheet 0.500"', commodity: 'PLASTICS', form: 'SHEET', grade: 'HDPE', thickness: 0.500, unit: 'LBS' },
  { materialCode: 'ACRY-CLR-0250', description: 'Acrylic Clear 0.250"', commodity: 'PLASTICS', form: 'SHEET', grade: 'ACRYLIC', thickness: 0.250, unit: 'SQFT' },
  { materialCode: 'BR-C260-0125', description: 'Brass C260 0.125" Sheet', commodity: 'BRASS', form: 'SHEET', grade: 'C260', thickness: 0.125, unit: 'LBS' },
];

// Locations (including work centers, docks, racks)
const locations = [
  { id: 'LOC-JACKSON', name: 'Jackson Main', code: 'JAX', address: 'Jackson, MI', type: 'WAREHOUSE' },
  { id: 'LOC-DETROIT', name: 'Detroit Branch', code: 'DET', address: 'Detroit, MI', type: 'BRANCH' },
  { id: 'LOC-CHICAGO', name: 'Chicago Hub', code: 'CHI', address: 'Chicago, IL', type: 'HUB' },
  { id: 'LOC-CLEVELAND', name: 'Cleveland Branch', code: 'CLE', address: 'Cleveland, OH', type: 'BRANCH' },
  { id: 'LOC-INDIANAPOLIS', name: 'Indianapolis Branch', code: 'IND', address: 'Indianapolis, IN', type: 'BRANCH' },
  // Work Centers / Racks / Docks within Jackson
  { id: 'WC-SAW-01', name: 'Saw Station 1', code: 'SAW1', address: 'Jackson, MI', type: 'WORK_CENTER', parentId: 'LOC-JACKSON' },
  { id: 'WC-SHEAR-02', name: 'Shear Station 2', code: 'SHR2', address: 'Jackson, MI', type: 'WORK_CENTER', parentId: 'LOC-JACKSON' },
  { id: 'WC-ROUTER-01', name: 'Router Station 1', code: 'RTR1', address: 'Jackson, MI', type: 'WORK_CENTER', parentId: 'LOC-JACKSON' },
  { id: 'RACK-A12', name: 'Rack A-12', code: 'A12', address: 'Jackson, MI', type: 'RACK', parentId: 'LOC-JACKSON' },
  { id: 'RACK-B05', name: 'Rack B-05', code: 'B05', address: 'Jackson, MI', type: 'RACK', parentId: 'LOC-JACKSON' },
  { id: 'DOCK-RECV-01', name: 'Receiving Dock 1', code: 'RD1', address: 'Jackson, MI', type: 'DOCK', parentId: 'LOC-JACKSON' },
  { id: 'DOCK-SHIP-02', name: 'Shipping Dock 2', code: 'SD2', address: 'Jackson, MI', type: 'DOCK', parentId: 'LOC-JACKSON' },
  { id: 'STAGE-01', name: 'Staging Area 1', code: 'STG1', address: 'Jackson, MI', type: 'STAGING', parentId: 'LOC-JACKSON' },
];

// Inventory Units with RFID + Etched IDs
let inventoryUnits = [
  // Units WITH RFID + Etched IDs
  { id: 'INV-001', materialCode: 'HR-0125-48', locationId: 'LOC-JACKSON', division: 'METALS', quantity: 45000, unit: 'LBS', isRemnant: false, status: 'AVAILABLE', rfidTagId: 'RFID-HR-001-A7F3', etchedId: 'JAX-HR-2024-00147', lastScanLocationId: 'RACK-A12', lastScanAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  { id: 'INV-002', materialCode: 'HR-0125-48', locationId: 'LOC-DETROIT', division: 'METALS', quantity: 32000, unit: 'LBS', isRemnant: false, status: 'AVAILABLE', rfidTagId: 'RFID-HR-002-B8E4', etchedId: 'DET-HR-2024-00089', lastScanLocationId: 'LOC-DETROIT', lastScanAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  { id: 'INV-003', materialCode: 'CR-0060-36', locationId: 'LOC-JACKSON', division: 'METALS', quantity: 18500, unit: 'LBS', isRemnant: false, status: 'AVAILABLE', rfidTagId: 'RFID-CR-003-C9D5', etchedId: 'JAX-CR-2024-00203', lastScanLocationId: 'RACK-B05', lastScanAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  { id: 'INV-004', materialCode: 'SS-304-0048-48', locationId: 'LOC-JACKSON', division: 'METALS', quantity: 8200, unit: 'LBS', isRemnant: false, status: 'AVAILABLE', rfidTagId: 'RFID-SS-004-D1A6', etchedId: 'JAX-SS-2024-00056', lastScanLocationId: 'WC-SAW-01', lastScanAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  { id: 'INV-005', materialCode: 'SS-304-0048-48', locationId: 'LOC-CHICAGO', division: 'METALS', quantity: 12400, unit: 'LBS', isRemnant: false, status: 'AVAILABLE', rfidTagId: 'RFID-SS-005-E2B7', etchedId: 'CHI-SS-2024-00078', lastScanLocationId: 'LOC-CHICAGO', lastScanAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  { id: 'INV-006', materialCode: 'AL-6061-100', locationId: 'LOC-DETROIT', division: 'METALS', quantity: 5600, unit: 'LBS', isRemnant: false, status: 'AVAILABLE', rfidTagId: 'RFID-AL-006-F3C8', etchedId: 'DET-AL-2024-00034', lastScanLocationId: 'LOC-DETROIT', lastScanAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  { id: 'INV-007', materialCode: 'GALV-0060-48', locationId: 'LOC-JACKSON', division: 'METALS', quantity: 28000, unit: 'LBS', isRemnant: false, status: 'AVAILABLE', rfidTagId: 'RFID-GA-007-G4D9', etchedId: 'JAX-GA-2024-00112', lastScanLocationId: 'DOCK-RECV-01', lastScanAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  // Remnants with RFID
  { id: 'INV-008', materialCode: 'HR-0125-48', locationId: 'LOC-JACKSON', division: 'METALS', quantity: 1250, unit: 'LBS', isRemnant: true, status: 'AVAILABLE', rfidTagId: 'RFID-HR-008-H5E0', etchedId: 'JAX-HR-2024-00147-R1', lastScanLocationId: 'WC-SHEAR-02', lastScanAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  { id: 'INV-009', materialCode: 'SS-304-0048-48', locationId: 'LOC-DETROIT', division: 'METALS', quantity: 450, unit: 'LBS', isRemnant: true, status: 'AVAILABLE', rfidTagId: 'RFID-SS-009-I6F1', etchedId: 'DET-SS-2024-00023-R1', lastScanLocationId: 'LOC-DETROIT', lastScanAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  // Plastics
  { id: 'INV-010', materialCode: 'POLY-HDPE-0500', locationId: 'LOC-JACKSON', division: 'PLASTICS', quantity: 2400, unit: 'LBS', isRemnant: false, status: 'AVAILABLE', rfidTagId: 'RFID-PL-010-J7G2', etchedId: 'JAX-PL-2024-00089', lastScanLocationId: 'RACK-A12', lastScanAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  { id: 'INV-011', materialCode: 'ACRY-CLR-0250', locationId: 'LOC-CHICAGO', division: 'PLASTICS', quantity: 850, unit: 'SQFT', isRemnant: false, status: 'AVAILABLE', rfidTagId: 'RFID-AC-011-K8H3', etchedId: 'CHI-AC-2024-00045', lastScanLocationId: 'LOC-CHICAGO', lastScanAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  { id: 'INV-012', materialCode: 'BR-C260-0125', locationId: 'LOC-JACKSON', division: 'METALS', quantity: 1800, unit: 'LBS', isRemnant: false, status: 'AVAILABLE', rfidTagId: 'RFID-BR-012-L9I4', etchedId: 'JAX-BR-2024-00021', lastScanLocationId: 'STAGE-01', lastScanAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  // Allocated/Hold status
  { id: 'INV-013', materialCode: 'HR-0125-48', locationId: 'LOC-CHICAGO', division: 'METALS', quantity: 22000, unit: 'LBS', isRemnant: false, status: 'ALLOCATED', rfidTagId: 'RFID-HR-013-M0J5', etchedId: 'CHI-HR-2024-00156', lastScanLocationId: 'LOC-CHICAGO', lastScanAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  { id: 'INV-014', materialCode: 'CR-0060-36', locationId: 'LOC-DETROIT', division: 'METALS', quantity: 9800, unit: 'LBS', isRemnant: false, status: 'ON_HOLD', rfidTagId: 'RFID-CR-014-N1K6', etchedId: 'DET-CR-2024-00067', lastScanLocationId: 'LOC-DETROIT', lastScanAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
  // In-process at work center
  { id: 'INV-015', materialCode: 'SS-304-0048-48', locationId: 'LOC-JACKSON', division: 'METALS', quantity: 3200, unit: 'LBS', isRemnant: false, status: 'IN_PROCESS', rfidTagId: 'RFID-SS-015-O2L7', etchedId: 'JAX-SS-2024-00099', lastScanLocationId: 'WC-ROUTER-01', lastScanAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), lastUpdated: new Date().toISOString() },
];

// Transfers
let transfers = [
  { id: 'TRF-001', fromLocationId: 'LOC-JACKSON', toLocationId: 'LOC-DETROIT', materialCode: 'SS-304-0048-48', quantity: 2000, status: 'IN_TRANSIT', eta: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'TRF-002', fromLocationId: 'LOC-CHICAGO', toLocationId: 'LOC-JACKSON', materialCode: 'HR-0125-48', quantity: 15000, status: 'REQUESTED', eta: null, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: 'TRF-003', fromLocationId: 'LOC-DETROIT', toLocationId: 'LOC-CLEVELAND', materialCode: 'AL-6061-100', quantity: 800, status: 'COMPLETED', eta: null, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

// RFID Events log
let rfidEvents = [
  { id: 'EVT-001', rfidTagId: 'RFID-HR-001-A7F3', inventoryId: 'INV-001', locationId: 'DOCK-RECV-01', eventType: 'SEEN', createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
  { id: 'EVT-002', rfidTagId: 'RFID-HR-001-A7F3', inventoryId: 'INV-001', locationId: 'RACK-A12', eventType: 'SEEN', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'EVT-003', rfidTagId: 'RFID-SS-004-D1A6', inventoryId: 'INV-004', locationId: 'RACK-A12', eventType: 'SEEN', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'EVT-004', rfidTagId: 'RFID-SS-004-D1A6', inventoryId: 'INV-004', locationId: 'WC-SAW-01', eventType: 'SEEN', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'EVT-005', rfidTagId: 'RFID-GA-007-G4D9', inventoryId: 'INV-007', locationId: 'DOCK-RECV-01', eventType: 'ATTACHED', createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
];

// Adjustment History
let adjustments = [];

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCatalogItem(materialCode) {
  return catalogItems.find(c => c.materialCode === materialCode);
}

function getLocation(locationId) {
  return locations.find(l => l.id === locationId);
}

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

// ============================================
// INVENTORY ENDPOINTS
// ============================================

// GET /v1/inventory - List inventory units with filters (including RFID/etchedId)
router.get('/', (req, res) => {
  try {
    const { materialCode, locationId, division, isRemnant, status, rfidTagId, etchedId } = req.query;
    
    let filtered = [...inventoryUnits];
    
    if (materialCode) {
      filtered = filtered.filter(inv => 
        inv.materialCode.toLowerCase().includes(materialCode.toLowerCase())
      );
    }
    if (locationId) {
      filtered = filtered.filter(inv => inv.locationId === locationId);
    }
    if (division) {
      filtered = filtered.filter(inv => inv.division === division);
    }
    if (isRemnant !== undefined) {
      const remnantBool = isRemnant === 'true' || isRemnant === true;
      filtered = filtered.filter(inv => inv.isRemnant === remnantBool);
    }
    if (status) {
      filtered = filtered.filter(inv => inv.status === status);
    }
    if (rfidTagId) {
      filtered = filtered.filter(inv => inv.rfidTagId === rfidTagId);
    }
    if (etchedId) {
      filtered = filtered.filter(inv => 
        inv.etchedId && inv.etchedId.toLowerCase().includes(etchedId.toLowerCase())
      );
    }
    
    // Enrich with catalog and location data
    const enriched = filtered.map(inv => ({
      ...inv,
      catalogItem: getCatalogItem(inv.materialCode),
      location: getLocation(inv.locationId),
      lastScanLocation: getLocation(inv.lastScanLocationId),
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// GET /v1/inventory/locations - Get all locations
router.get('/locations', (req, res) => {
  res.json(locations);
});

// GET /v1/inventory/catalog - Get catalog items
router.get('/catalog', (req, res) => {
  res.json(catalogItems);
});

// GET /v1/inventory/summary - Inventory summary stats
router.get('/summary', (req, res) => {
  try {
    const totalUnits = inventoryUnits.length;
    const totalQuantity = inventoryUnits.reduce((sum, inv) => sum + inv.quantity, 0);
    const remnantCount = inventoryUnits.filter(inv => inv.isRemnant).length;
    const availableCount = inventoryUnits.filter(inv => inv.status === 'AVAILABLE').length;
    const allocatedCount = inventoryUnits.filter(inv => inv.status === 'ALLOCATED').length;
    const onHoldCount = inventoryUnits.filter(inv => inv.status === 'ON_HOLD').length;
    const inProcessCount = inventoryUnits.filter(inv => inv.status === 'IN_PROCESS').length;
    const rfidTaggedCount = inventoryUnits.filter(inv => inv.rfidTagId).length;
    
    const byLocation = locations
      .filter(loc => loc.type === 'WAREHOUSE' || loc.type === 'BRANCH' || loc.type === 'HUB')
      .map(loc => ({
        locationId: loc.id,
        locationName: loc.name,
        unitCount: inventoryUnits.filter(inv => inv.locationId === loc.id).length,
        totalQuantity: inventoryUnits
          .filter(inv => inv.locationId === loc.id)
          .reduce((sum, inv) => sum + inv.quantity, 0),
      }));
    
    const byDivision = ['METALS', 'PLASTICS'].map(div => ({
      division: div,
      unitCount: inventoryUnits.filter(inv => inv.division === div).length,
      totalQuantity: inventoryUnits
        .filter(inv => inv.division === div)
        .reduce((sum, inv) => sum + inv.quantity, 0),
    }));
    
    res.json({
      totalUnits,
      totalQuantity,
      remnantCount,
      rfidTaggedCount,
      statusBreakdown: { available: availableCount, allocated: allocatedCount, onHold: onHoldCount, inProcess: inProcessCount },
      byLocation,
      byDivision,
      pendingTransfers: transfers.filter(t => t.status !== 'COMPLETED').length,
      recentRfidEvents: rfidEvents.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /v1/inventory/transfers - List all transfers
router.get('/transfers', (req, res) => {
  try {
    const { status } = req.query;
    let filtered = [...transfers];
    
    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }
    
    // Enrich with location names
    const enriched = filtered.map(t => ({
      ...t,
      fromLocation: getLocation(t.fromLocationId),
      toLocation: getLocation(t.toLocationId),
      catalogItem: getCatalogItem(t.materialCode),
    }));
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

// GET /v1/inventory/:id - Get single inventory unit
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const inventoryUnit = inventoryUnits.find(inv => inv.id === id);
    
    if (!inventoryUnit) {
      return res.status(404).json({ error: 'Inventory unit not found' });
    }
    
    // Get RFID event history for this unit
    const rfidHistory = rfidEvents
      .filter(e => e.inventoryId === id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(e => ({
        ...e,
        location: getLocation(e.locationId),
      }));
    
    const enriched = {
      ...inventoryUnit,
      catalogItem: getCatalogItem(inventoryUnit.materialCode),
      location: getLocation(inventoryUnit.locationId),
      lastScanLocation: getLocation(inventoryUnit.lastScanLocationId),
      rfidHistory,
    };
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory unit' });
  }
});

// POST /v1/inventory/adjust - Adjust inventory quantity
router.post('/adjust', (req, res) => {
  try {
    const { inventoryId, deltaQuantity, reason } = req.body;
    
    if (!inventoryId || deltaQuantity === undefined) {
      return res.status(400).json({ error: 'inventoryId and deltaQuantity are required' });
    }
    
    const index = inventoryUnits.findIndex(inv => inv.id === inventoryId);
    if (index === -1) {
      return res.status(404).json({ error: 'Inventory unit not found' });
    }
    
    const oldQuantity = inventoryUnits[index].quantity;
    const newQuantity = oldQuantity + deltaQuantity;
    
    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Adjustment would result in negative quantity' });
    }
    
    inventoryUnits[index].quantity = newQuantity;
    inventoryUnits[index].lastUpdated = new Date().toISOString();
    
    // Record adjustment
    const adjustment = {
      id: generateId('ADJ'),
      inventoryId,
      oldQuantity,
      newQuantity,
      deltaQuantity,
      reason: reason || 'Manual adjustment',
      timestamp: new Date().toISOString(),
    };
    adjustments.push(adjustment);
    
    res.json({
      ...inventoryUnits[index],
      catalogItem: getCatalogItem(inventoryUnits[index].materialCode),
      location: getLocation(inventoryUnits[index].locationId),
      lastScanLocation: getLocation(inventoryUnits[index].lastScanLocationId),
      adjustment,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to adjust inventory' });
  }
});

// ============================================
// RFID ENDPOINTS
// ============================================

// POST /v1/inventory/rfid-scan - Record an RFID scan event
router.post('/rfid-scan', (req, res) => {
  try {
    const { rfidTagId, locationId, timestamp, eventType = 'SEEN' } = req.body;
    
    if (!rfidTagId || !locationId) {
      return res.status(400).json({ error: 'rfidTagId and locationId are required' });
    }
    
    // Find inventory by RFID tag
    const inventoryIndex = inventoryUnits.findIndex(inv => inv.rfidTagId === rfidTagId);
    let inventoryUnit = null;
    
    if (inventoryIndex !== -1) {
      // Update last scan info on the inventory unit
      inventoryUnits[inventoryIndex].lastScanLocationId = locationId;
      inventoryUnits[inventoryIndex].lastScanAt = timestamp || new Date().toISOString();
      inventoryUnits[inventoryIndex].lastUpdated = new Date().toISOString();
      inventoryUnit = inventoryUnits[inventoryIndex];
    }
    
    // Create RFID event
    const event = {
      id: generateId('EVT'),
      rfidTagId,
      inventoryId: inventoryUnit ? inventoryUnit.id : null,
      locationId,
      eventType,
      createdAt: timestamp || new Date().toISOString(),
    };
    rfidEvents.push(event);
    
    res.json({
      inventory: inventoryUnit ? {
        ...inventoryUnit,
        catalogItem: getCatalogItem(inventoryUnit.materialCode),
        location: getLocation(inventoryUnit.locationId),
        lastScanLocation: getLocation(inventoryUnit.lastScanLocationId),
      } : null,
      event: {
        ...event,
        location: getLocation(locationId),
      },
      matched: inventoryUnit !== null,
    });
  } catch (error) {
    console.error('RFID scan error:', error);
    res.status(500).json({ error: 'Failed to process RFID scan' });
  }
});

// GET /v1/inventory/rfid/:rfidTagId - Lookup inventory by RFID tag
router.get('/rfid/:rfidTagId', (req, res) => {
  try {
    const { rfidTagId } = req.params;
    
    const inventoryUnit = inventoryUnits.find(inv => inv.rfidTagId === rfidTagId);
    
    if (!inventoryUnit) {
      // Return recent events for this tag even if not matched to inventory
      const tagEvents = rfidEvents
        .filter(e => e.rfidTagId === rfidTagId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(e => ({ ...e, location: getLocation(e.locationId) }));
      
      return res.json({
        found: false,
        inventory: null,
        lastKnownLocation: tagEvents.length > 0 ? getLocation(tagEvents[0].locationId) : null,
        recentEvents: tagEvents,
      });
    }
    
    // Get RFID event history
    const rfidHistory = rfidEvents
      .filter(e => e.rfidTagId === rfidTagId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(e => ({ ...e, location: getLocation(e.locationId) }));
    
    res.json({
      found: true,
      inventory: {
        ...inventoryUnit,
        catalogItem: getCatalogItem(inventoryUnit.materialCode),
        location: getLocation(inventoryUnit.locationId),
        lastScanLocation: getLocation(inventoryUnit.lastScanLocationId),
      },
      lastKnownLocation: getLocation(inventoryUnit.lastScanLocationId),
      recentEvents: rfidHistory,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup by RFID' });
  }
});

// GET /v1/inventory/etched/:etchedId - Lookup inventory by etched ID
router.get('/etched/:etchedId', (req, res) => {
  try {
    const { etchedId } = req.params;
    
    const inventoryUnit = inventoryUnits.find(inv => 
      inv.etchedId && inv.etchedId.toLowerCase() === etchedId.toLowerCase()
    );
    
    if (!inventoryUnit) {
      return res.json({
        found: false,
        inventory: null,
        message: `No inventory found with etched ID: ${etchedId}`,
      });
    }
    
    // Get RFID event history if tagged
    const rfidHistory = inventoryUnit.rfidTagId 
      ? rfidEvents
          .filter(e => e.rfidTagId === inventoryUnit.rfidTagId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map(e => ({ ...e, location: getLocation(e.locationId) }))
      : [];
    
    res.json({
      found: true,
      inventory: {
        ...inventoryUnit,
        catalogItem: getCatalogItem(inventoryUnit.materialCode),
        location: getLocation(inventoryUnit.locationId),
        lastScanLocation: getLocation(inventoryUnit.lastScanLocationId),
      },
      lastKnownLocation: getLocation(inventoryUnit.lastScanLocationId),
      recentEvents: rfidHistory,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup by etched ID' });
  }
});

// ============================================
// TRANSFER ENDPOINTS
// ============================================

// POST /v1/inventory/transfers - Create new transfer
router.post('/transfers', (req, res) => {
  try {
    const { fromLocationId, toLocationId, materialCode, quantity } = req.body;
    
    if (!fromLocationId || !toLocationId || !materialCode || !quantity) {
      return res.status(400).json({ error: 'fromLocationId, toLocationId, materialCode, and quantity are required' });
    }
    
    // Verify source inventory exists
    const sourceInventory = inventoryUnits.find(
      inv => inv.locationId === fromLocationId && inv.materialCode === materialCode
    );
    
    if (!sourceInventory) {
      return res.status(400).json({ error: 'No inventory found at source location for this material' });
    }
    
    if (sourceInventory.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity at source location' });
    }
    
    const transfer = {
      id: generateId('TRF'),
      fromLocationId,
      toLocationId,
      materialCode,
      quantity,
      status: 'REQUESTED',
      eta: null,
      createdAt: new Date().toISOString(),
    };
    
    transfers.push(transfer);
    
    res.status(201).json({
      ...transfer,
      fromLocation: getLocation(fromLocationId),
      toLocation: getLocation(toLocationId),
      catalogItem: getCatalogItem(materialCode),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

// POST /v1/inventory/transfers/:id/status - Update transfer status
router.post('/transfers/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, eta } = req.body;
    
    const index = transfers.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    
    const validStatuses = ['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    transfers[index].status = status;
    if (eta) {
      transfers[index].eta = eta;
    }
    
    // If completed, update inventory
    if (status === 'COMPLETED') {
      const transfer = transfers[index];
      
      // Reduce source inventory
      const sourceIdx = inventoryUnits.findIndex(
        inv => inv.locationId === transfer.fromLocationId && inv.materialCode === transfer.materialCode
      );
      if (sourceIdx !== -1) {
        inventoryUnits[sourceIdx].quantity -= transfer.quantity;
        inventoryUnits[sourceIdx].lastUpdated = new Date().toISOString();
      }
      
      // Increase destination inventory (or create new)
      const destIdx = inventoryUnits.findIndex(
        inv => inv.locationId === transfer.toLocationId && inv.materialCode === transfer.materialCode && !inv.isRemnant
      );
      if (destIdx !== -1) {
        inventoryUnits[destIdx].quantity += transfer.quantity;
        inventoryUnits[destIdx].lastUpdated = new Date().toISOString();
      } else {
        // Create new inventory at destination
        const catalogItem = getCatalogItem(transfer.materialCode);
        inventoryUnits.push({
          id: generateId('INV'),
          materialCode: transfer.materialCode,
          locationId: transfer.toLocationId,
          division: catalogItem?.commodity === 'PLASTICS' ? 'PLASTICS' : 'METALS',
          quantity: transfer.quantity,
          unit: catalogItem?.unit || 'LBS',
          isRemnant: false,
          status: 'AVAILABLE',
          rfidTagId: null,
          etchedId: null,
          lastScanLocationId: null,
          lastScanAt: null,
          lastUpdated: new Date().toISOString(),
        });
      }
    }
    
    res.json({
      ...transfers[index],
      fromLocation: getLocation(transfers[index].fromLocationId),
      toLocation: getLocation(transfers[index].toLocationId),
      catalogItem: getCatalogItem(transfers[index].materialCode),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transfer status' });
  }
});

// ============================================
// AI INVENTORY ASSISTANT ENDPOINT
// ============================================

router.post('/ai-assistant', (req, res) => {
  try {
    const { user, query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const queryLower = query.toLowerCase();
    let answer = '';
    let actions = [];
    let supportingData = null;
    
    // Check for RFID tag in query
    const rfidMatch = query.match(/RFID[-\s]?([A-Z0-9-]+)/i);
    const extractedRfid = rfidMatch ? `RFID-${rfidMatch[1].toUpperCase().replace(/^RFID[-\s]?/i, '')}` : null;
    
    // Check for etched ID in query (format like JAX-HR-2024-00147)
    const etchedMatch = query.match(/([A-Z]{3}-[A-Z]{2}-\d{4}-\d{5}(-R\d)?)/i);
    const extractedEtched = etchedMatch ? etchedMatch[1].toUpperCase() : null;
    
    // Parse material codes from query
    const materialCodeMatch = queryLower.match(/\b(hr|cr|ss|al|galv|poly|acry|br)[-\s]?[\w-]+/i);
    const extractedMaterialCode = materialCodeMatch ? materialCodeMatch[0].toUpperCase().replace(/\s/g, '-') : null;
    
    // ---- Handle "where" queries with RFID or Etched ID ----
    if ((queryLower.includes('where') || queryLower.includes('find') || queryLower.includes('locate') || queryLower.includes('location')) && (extractedRfid || extractedEtched)) {
      let foundUnit = null;
      
      if (extractedRfid) {
        foundUnit = inventoryUnits.find(inv => inv.rfidTagId === extractedRfid);
      }
      if (!foundUnit && extractedEtched) {
        foundUnit = inventoryUnits.find(inv => inv.etchedId && inv.etchedId.toUpperCase() === extractedEtched);
      }
      
      if (foundUnit) {
        const lastLoc = getLocation(foundUnit.lastScanLocationId);
        const scanAge = foundUnit.lastScanAt 
          ? Math.round((Date.now() - new Date(foundUnit.lastScanAt).getTime()) / (1000 * 60)) 
          : null;
        
        answer = `Found it! Material ${foundUnit.materialCode} (${foundUnit.etchedId || foundUnit.rfidTagId}) was last seen at **${lastLoc?.name || foundUnit.lastScanLocationId}**`;
        if (scanAge !== null) {
          if (scanAge < 60) {
            answer += ` about ${scanAge} minute(s) ago.`;
          } else {
            answer += ` about ${Math.round(scanAge / 60)} hour(s) ago.`;
          }
        }
        answer += ` Current quantity: ${foundUnit.quantity.toLocaleString()} ${foundUnit.unit}. Status: ${foundUnit.status}.`;
        
        supportingData = {
          inventoryId: foundUnit.id,
          materialCode: foundUnit.materialCode,
          etchedId: foundUnit.etchedId,
          rfidTagId: foundUnit.rfidTagId,
          lastScanLocation: lastLoc,
          lastScanAt: foundUnit.lastScanAt,
          quantity: foundUnit.quantity,
          status: foundUnit.status,
        };
        
        actions.push({
          type: 'VIEW_DETAIL',
          label: 'View Full Details',
          params: { inventoryId: foundUnit.id },
        });
      } else {
        const searchTerm = extractedRfid || extractedEtched;
        answer = `I couldn't find any inventory matching "${searchTerm}". The tag may not be registered in the system, or the material may have been consumed.`;
        actions.push({
          type: 'SEARCH_RFID_EVENTS',
          label: 'Search RFID Event Log',
          params: { searchTerm },
        });
      }
    }
    // ---- Handle "where" queries for material codes (availability lookup) ----
    else if ((queryLower.includes('where') || queryLower.includes('find') || queryLower.includes('available') || queryLower.includes('stock')) && !extractedRfid && !extractedEtched) {
      let searchMaterial = extractedMaterialCode;
      
      // Also try to find by partial match
      if (!searchMaterial) {
        if (queryLower.includes('304') || queryLower.includes('stainless')) searchMaterial = 'SS-304';
        else if (queryLower.includes('hot rolled') || queryLower.includes('hr')) searchMaterial = 'HR-';
        else if (queryLower.includes('cold rolled') || queryLower.includes('cr')) searchMaterial = 'CR-';
        else if (queryLower.includes('aluminum') || queryLower.includes('al')) searchMaterial = 'AL-';
        else if (queryLower.includes('galv')) searchMaterial = 'GALV-';
      }
      
      if (searchMaterial) {
        const matchingInventory = inventoryUnits.filter(inv => 
          inv.materialCode.toUpperCase().includes(searchMaterial.toUpperCase()) &&
          inv.status === 'AVAILABLE'
        );
        
        if (matchingInventory.length > 0) {
          const availabilityByLocation = matchingInventory.map(inv => ({
            inventoryId: inv.id,
            location: getLocation(inv.locationId)?.name || inv.locationId,
            locationId: inv.locationId,
            quantity: inv.quantity,
            unit: inv.unit,
            isRemnant: inv.isRemnant,
            rfidTagId: inv.rfidTagId,
            etchedId: inv.etchedId,
            lastScanLocation: getLocation(inv.lastScanLocationId)?.name,
          }));
          
          const totalQty = matchingInventory.reduce((sum, inv) => sum + inv.quantity, 0);
          
          answer = `Found ${matchingInventory.length} inventory record(s) matching "${searchMaterial}" with a total of ${totalQty.toLocaleString()} units available across ${new Set(matchingInventory.map(m => m.locationId)).size} location(s).`;
          supportingData = { availabilityByLocation, totalQuantity: totalQty };
        } else {
          answer = `No available inventory found matching "${searchMaterial}". You may want to check pending transfers or create a new transfer request.`;
          actions.push({
            type: 'SEARCH_TRANSFERS',
            label: 'Check Pending Transfers',
            params: { materialCode: searchMaterial },
          });
        }
      } else {
        answer = 'Please specify a material code, RFID tag, or etched ID to search for. For example:\n• "Where is RFID-HR-001-A7F3?"\n• "Find JAX-HR-2024-00147"\n• "Where is SS-304 available?"';
      }
    }
    // ---- Handle transfer-related queries ----
    else if (queryLower.includes('transfer') || queryLower.includes('move') || queryLower.includes('ship')) {
      const pendingTransfers = transfers.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
      
      if (queryLower.includes('status') || queryLower.includes('pending')) {
        answer = `There are ${pendingTransfers.length} pending transfer(s).`;
        supportingData = {
          pendingTransfers: pendingTransfers.map(t => ({
            id: t.id,
            material: t.materialCode,
            from: getLocation(t.fromLocationId)?.name,
            to: getLocation(t.toLocationId)?.name,
            quantity: t.quantity,
            status: t.status,
            eta: t.eta,
          })),
        };
      } else {
        // Suggest creating a transfer
        answer = 'I can help you create a transfer. Based on current inventory levels, here are some suggestions:';
        
        // Find imbalances
        const materialGroups = {};
        inventoryUnits.forEach(inv => {
          if (!materialGroups[inv.materialCode]) {
            materialGroups[inv.materialCode] = [];
          }
          materialGroups[inv.materialCode].push(inv);
        });
        
        const suggestions = [];
        Object.entries(materialGroups).forEach(([code, items]) => {
          if (items.length > 1) {
            const quantities = items.map(i => i.quantity);
            const max = Math.max(...quantities);
            const min = Math.min(...quantities);
            if (max > min * 3 && min < 5000) {
              const highLoc = items.find(i => i.quantity === max);
              const lowLoc = items.find(i => i.quantity === min);
              suggestions.push({
                materialCode: code,
                fromLocationId: highLoc.locationId,
                fromLocation: getLocation(highLoc.locationId)?.name,
                toLocationId: lowLoc.locationId,
                toLocation: getLocation(lowLoc.locationId)?.name,
                suggestedQuantity: Math.round((max - min) / 4),
              });
            }
          }
        });
        
        if (suggestions.length > 0) {
          supportingData = { transferSuggestions: suggestions.slice(0, 3) };
          actions.push({
            type: 'SUGGEST_TRANSFER',
            label: 'Create Suggested Transfer',
            params: suggestions[0],
          });
        }
      }
    }
    // ---- Handle low stock / reorder queries ----
    else if (queryLower.includes('low') || queryLower.includes('reorder') || queryLower.includes('shortage')) {
      const lowStockThreshold = 2000;
      const lowStock = inventoryUnits.filter(inv => inv.quantity < lowStockThreshold && !inv.isRemnant);
      
      answer = `Found ${lowStock.length} inventory item(s) below the threshold of ${lowStockThreshold.toLocaleString()} units.`;
      supportingData = {
        lowStockItems: lowStock.map(inv => ({
          id: inv.id,
          materialCode: inv.materialCode,
          location: getLocation(inv.locationId)?.name,
          quantity: inv.quantity,
          status: inv.status,
          rfidTagId: inv.rfidTagId,
          etchedId: inv.etchedId,
        })),
      };
      
      if (lowStock.length > 0) {
        actions.push({
          type: 'CREATE_REORDER',
          label: 'Create Reorder Request',
          params: { items: lowStock.map(i => i.materialCode) },
        });
      }
    }
    // ---- Handle remnant queries ----
    else if (queryLower.includes('remnant') || queryLower.includes('scrap') || queryLower.includes('leftover')) {
      const remnants = inventoryUnits.filter(inv => inv.isRemnant);
      const totalRemnantValue = remnants.reduce((sum, inv) => sum + inv.quantity, 0);
      
      answer = `There are ${remnants.length} remnant piece(s) in inventory totaling ${totalRemnantValue.toLocaleString()} units.`;
      supportingData = {
        remnants: remnants.map(inv => ({
          id: inv.id,
          materialCode: inv.materialCode,
          location: getLocation(inv.locationId)?.name,
          quantity: inv.quantity,
          rfidTagId: inv.rfidTagId,
          etchedId: inv.etchedId,
          lastScanLocation: getLocation(inv.lastScanLocationId)?.name,
        })),
      };
      
      actions.push({
        type: 'VIEW_REMNANTS',
        label: 'View All Remnants',
        params: {},
      });
    }
    // ---- Handle RFID / scan related queries ----
    else if (queryLower.includes('rfid') || queryLower.includes('scan') || queryLower.includes('tag')) {
      const recentEvents = rfidEvents
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(e => ({
          ...e,
          location: getLocation(e.locationId),
        }));
      
      const taggedCount = inventoryUnits.filter(inv => inv.rfidTagId).length;
      
      answer = `${taggedCount} of ${inventoryUnits.length} inventory units have RFID tags. There have been ${rfidEvents.length} RFID scan events recorded.`;
      supportingData = {
        taggedCount,
        totalInventory: inventoryUnits.length,
        recentEvents,
      };
    }
    // ---- Handle summary / overview queries ----
    else if (queryLower.includes('summary') || queryLower.includes('overview') || queryLower.includes('total')) {
      const totalQty = inventoryUnits.reduce((sum, inv) => sum + inv.quantity, 0);
      const uniqueMaterials = new Set(inventoryUnits.map(i => i.materialCode)).size;
      const uniqueLocations = new Set(inventoryUnits.map(i => i.locationId)).size;
      const taggedCount = inventoryUnits.filter(i => i.rfidTagId).length;
      
      answer = `Inventory Overview:\n• ${inventoryUnits.length} inventory units\n• ${totalQty.toLocaleString()} total units of material\n• ${uniqueMaterials} different materials\n• ${uniqueLocations} locations\n• ${inventoryUnits.filter(i => i.isRemnant).length} remnants\n• ${taggedCount} RFID-tagged pieces`;
      
      supportingData = {
        totalUnits: inventoryUnits.length,
        totalQuantity: totalQty,
        uniqueMaterials,
        uniqueLocations,
        remnantCount: inventoryUnits.filter(i => i.isRemnant).length,
        rfidTaggedCount: taggedCount,
        statusBreakdown: {
          available: inventoryUnits.filter(i => i.status === 'AVAILABLE').length,
          allocated: inventoryUnits.filter(i => i.status === 'ALLOCATED').length,
          onHold: inventoryUnits.filter(i => i.status === 'ON_HOLD').length,
          inProcess: inventoryUnits.filter(i => i.status === 'IN_PROCESS').length,
        },
      };
    }
    // ---- Default response ----
    else {
      answer = 'I can help you with inventory questions. Try asking:\n• "Where is RFID-HR-001-A7F3?" (locate by RFID tag)\n• "Find JAX-HR-2024-00147" (locate by etched ID)\n• "Where is SS-304 available?" (check material availability)\n• "What\'s the transfer status?"\n• "Show low stock items"\n• "Remnant inventory"\n• "Inventory summary"\n• "Recent RFID scans"';
    }
    
    res.json({
      answer,
      actions,
      supportingData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

export default router;
