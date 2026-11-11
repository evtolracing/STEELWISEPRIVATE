/**
 * Demo data for the v1 inventory screens (RFID / etched-ID tracking):
 * catalog, sites, inventory units, transfers and RFID scan history.
 * Built at seed time so the "last scanned" times always look recent.
 */
export function buildInventoryV1DemoData() {
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
  const inventoryUnits = [
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
  const transfers = [
  { id: 'TRF-001', fromLocationId: 'LOC-JACKSON', toLocationId: 'LOC-DETROIT', materialCode: 'SS-304-0048-48', quantity: 2000, status: 'IN_TRANSIT', eta: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'TRF-002', fromLocationId: 'LOC-CHICAGO', toLocationId: 'LOC-JACKSON', materialCode: 'HR-0125-48', quantity: 15000, status: 'REQUESTED', eta: null, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: 'TRF-003', fromLocationId: 'LOC-DETROIT', toLocationId: 'LOC-CLEVELAND', materialCode: 'AL-6061-100', quantity: 800, status: 'COMPLETED', eta: null, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

// RFID Events log
  const rfidEvents = [
  { id: 'EVT-001', rfidTagId: 'RFID-HR-001-A7F3', inventoryId: 'INV-001', locationId: 'DOCK-RECV-01', eventType: 'SEEN', createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
  { id: 'EVT-002', rfidTagId: 'RFID-HR-001-A7F3', inventoryId: 'INV-001', locationId: 'RACK-A12', eventType: 'SEEN', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'EVT-003', rfidTagId: 'RFID-SS-004-D1A6', inventoryId: 'INV-004', locationId: 'RACK-A12', eventType: 'SEEN', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'EVT-004', rfidTagId: 'RFID-SS-004-D1A6', inventoryId: 'INV-004', locationId: 'WC-SAW-01', eventType: 'SEEN', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'EVT-005', rfidTagId: 'RFID-GA-007-G4D9', inventoryId: 'INV-007', locationId: 'DOCK-RECV-01', eventType: 'ATTACHED', createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
];

  return { catalogItems, locations, inventoryUnits, transfers, rfidEvents };
}
