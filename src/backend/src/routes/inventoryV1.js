/**
 * Inventory API v1 Routes
 * RESTful inventory management with RFID + Etched ID support
 * Stored in the InventoryUnit, InventoryTransfer, RfidScanEvent,
 * InventoryAdjustment, InventoryCatalogItem and InventorySite tables.
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import {
  loadInventoryState, saveUnit, saveTransfer, saveRfidEvent, saveAdjustment,
} from './inventoryV1Store.js';

const router = Router();

// ============================================
// DATA
// ============================================

// Loaded from the database at the start of each request (see refresh()).
let catalogItems = [];
let locations = [];
let inventoryUnits = [];
let transfers = [];
let rfidEvents = [];

async function refresh() {
  ({ catalogItems, locations, inventoryUnits, transfers, rfidEvents } = await loadInventoryState());
}

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
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

// ============================================
// INVENTORY ENDPOINTS
// ============================================

// GET /v1/inventory - List inventory units with filters (including RFID/etchedId)
router.get('/', async (req, res) => {
  try {
    await refresh();
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
router.get('/locations', async (req, res) => {
  try {
    await refresh();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// GET /v1/inventory/catalog - Get catalog items
router.get('/catalog', async (req, res) => {
  try {
    await refresh();
    res.json(catalogItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// GET /v1/inventory/summary - Inventory summary stats
router.get('/summary', async (req, res) => {
  try {
    await refresh();
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
router.get('/transfers', async (req, res) => {
  try {
    await refresh();
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
router.get('/:id', async (req, res) => {
  try {
    await refresh();
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
router.post('/adjust', async (req, res) => {
  try {
    await refresh();
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
    await saveUnit(inventoryUnits[index]);
    await saveAdjustment(adjustment);
    
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
router.post('/rfid-scan', async (req, res) => {
  try {
    await refresh();
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
      await saveUnit(inventoryUnit);
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
    await saveRfidEvent(event);
    
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
router.get('/rfid/:rfidTagId', async (req, res) => {
  try {
    await refresh();
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
router.get('/etched/:etchedId', async (req, res) => {
  try {
    await refresh();
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
router.post('/transfers', async (req, res) => {
  try {
    await refresh();
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
    await saveTransfer(transfer);
    
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
router.post('/transfers/:id/status', async (req, res) => {
  try {
    await refresh();
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
    if (['COMPLETED', 'CANCELLED'].includes(transfers[index].status)) {
      return res.status(409).json({ error: `Transfer is already ${transfers[index].status}` });
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
        await saveUnit(inventoryUnits[sourceIdx]);
      }
      
      // Increase destination inventory (or create new)
      const destIdx = inventoryUnits.findIndex(
        inv => inv.locationId === transfer.toLocationId && inv.materialCode === transfer.materialCode && !inv.isRemnant
      );
      if (destIdx !== -1) {
        inventoryUnits[destIdx].quantity += transfer.quantity;
        inventoryUnits[destIdx].lastUpdated = new Date().toISOString();
        await saveUnit(inventoryUnits[destIdx]);
      } else {
        // Create new inventory at destination
        const catalogItem = getCatalogItem(transfer.materialCode);
        const newUnit = {
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
        };
        inventoryUnits.push(newUnit);
        await saveUnit(newUnit);
      }
    }
    await saveTransfer(transfers[index]);
    
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

router.post('/ai-assistant', async (req, res) => {
  try {
    await refresh();
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
