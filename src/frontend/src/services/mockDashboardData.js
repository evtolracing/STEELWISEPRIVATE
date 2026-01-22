// src/services/mockDashboardData.js
/**
 * Mock Data Providers for Dashboard Widgets
 */

export function getMockJobs() {
  return [
    { id: 'JOB-001', jobNumber: 'J-2026-001', customerName: 'Acme Corp', status: 'ORDERED', priority: 'HOT', dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), workCenterType: 'SAW', estimatedMinutes: 45 },
    { id: 'JOB-002', jobNumber: 'J-2026-002', customerName: 'BuildRight', status: 'SCHEDULED', priority: 'NORMAL', dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), workCenterType: 'SHEAR', estimatedMinutes: 30 },
    { id: 'JOB-003', jobNumber: 'J-2026-003', customerName: 'Steel Masters', status: 'IN_PROCESS', priority: 'RUSH', dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), workCenterType: 'ROUTER', estimatedMinutes: 60 },
    { id: 'JOB-004', jobNumber: 'J-2026-004', customerName: 'Metro Fab', status: 'IN_PROCESS', priority: 'NORMAL', dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), workCenterType: 'SAW', estimatedMinutes: 25 },
    { id: 'JOB-005', jobNumber: 'J-2026-005', customerName: 'QuickParts', status: 'PACKAGING', priority: 'HOT', dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), workCenterType: 'PACK', estimatedMinutes: 15 },
    { id: 'JOB-006', jobNumber: 'J-2026-006', customerName: 'Industrial Co', status: 'READY_TO_SHIP', priority: 'NORMAL', dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), workCenterType: 'SHIP', estimatedMinutes: 10 },
    { id: 'JOB-007', jobNumber: 'J-2026-007', customerName: 'Titan Metals', status: 'SHIPPED', priority: 'NORMAL', dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), workCenterType: 'SHIP', estimatedMinutes: 0 },
    { id: 'JOB-008', jobNumber: 'J-2026-008', customerName: 'ProCut Inc', status: 'ORDERED', priority: 'RUSH', dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), workCenterType: 'WATERJET', estimatedMinutes: 90 },
    { id: 'JOB-009', jobNumber: 'J-2026-009', customerName: 'Alloy Works', status: 'SCHEDULED', priority: 'HOT', dueDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), workCenterType: 'SAW', estimatedMinutes: 35 },
    { id: 'JOB-010', jobNumber: 'J-2026-010', customerName: 'Custom Fab', status: 'IN_PROCESS', priority: 'NORMAL', dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), workCenterType: 'DEBURR', estimatedMinutes: 20 },
  ];
}

export function getMockWorkCenters() {
  return [
    { id: 'WC-SAW-01', name: 'Saw Line 1', workCenterType: 'SAW', utilizationPercent: 92, status: 'CRITICAL', isOnline: true, activeJobs: 3 },
    { id: 'WC-SAW-02', name: 'Saw Line 2', workCenterType: 'SAW', utilizationPercent: 78, status: 'NORMAL', isOnline: true, activeJobs: 2 },
    { id: 'WC-SHEAR-01', name: 'Shear 1', workCenterType: 'SHEAR', utilizationPercent: 65, status: 'NORMAL', isOnline: true, activeJobs: 1 },
    { id: 'WC-ROUTER-01', name: 'CNC Router', workCenterType: 'ROUTER', utilizationPercent: 88, status: 'WARNING', isOnline: true, activeJobs: 2 },
    { id: 'WC-WATERJET-01', name: 'Waterjet', workCenterType: 'WATERJET', utilizationPercent: 45, status: 'NORMAL', isOnline: true, activeJobs: 1 },
    { id: 'WC-DEBURR-01', name: 'Deburr Station', workCenterType: 'DEBURR', utilizationPercent: 30, status: 'NORMAL', isOnline: true, activeJobs: 1 },
    { id: 'WC-PACK-01', name: 'Packaging', workCenterType: 'PACK', utilizationPercent: 55, status: 'NORMAL', isOnline: true, activeJobs: 2 },
  ];
}

export function getMockInventory() {
  return [
    { id: 'INV-001', materialCode: 'AL-6061-0500', description: 'Aluminum 6061 0.5"', locationId: 'LOC-A1', status: 'OK', availableQty: 1500, reorderPoint: 500 },
    { id: 'INV-002', materialCode: 'HR-A36-0250', description: 'Hot Rolled A36 0.25"', locationId: 'LOC-A2', status: 'LOW', availableQty: 200, reorderPoint: 300 },
    { id: 'INV-003', materialCode: 'SS-304-0125', description: 'Stainless 304 0.125"', locationId: 'LOC-B1', status: 'CRITICAL', availableQty: 50, reorderPoint: 200 },
    { id: 'INV-004', materialCode: 'ACRY-CLR-0250', description: 'Acrylic Clear 0.25"', locationId: 'LOC-C1', status: 'OK', availableQty: 800, reorderPoint: 150 },
    { id: 'INV-005', materialCode: 'BRASS-360-0500', description: 'Brass 360 0.5"', locationId: 'LOC-B2', status: 'LOW', availableQty: 100, reorderPoint: 150 },
    { id: 'INV-006', materialCode: 'CR-1018-0375', description: 'Cold Rolled 1018 0.375"', locationId: 'LOC-A3', status: 'OK', availableQty: 2000, reorderPoint: 400 },
  ];
}

export function getMockTransfers() {
  return [
    { id: 'TRF-001', fromLocationId: 'WAREHOUSE-DETROIT', toLocationId: 'BRANCH-JACKSON', status: 'IN_TRANSIT', eta: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), items: 12 },
    { id: 'TRF-002', fromLocationId: 'BRANCH-JACKSON', toLocationId: 'BRANCH-LANSING', status: 'PENDING', eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), items: 5 },
    { id: 'TRF-003', fromLocationId: 'WAREHOUSE-CHICAGO', toLocationId: 'BRANCH-JACKSON', status: 'DELIVERED', eta: null, items: 8 },
    { id: 'TRF-004', fromLocationId: 'SUPPLIER-EXT', toLocationId: 'WAREHOUSE-DETROIT', status: 'IN_TRANSIT', eta: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), items: 25 },
  ];
}

export function getMockExceptions() {
  return [
    { id: 'EXC-001', type: 'SCRAP', message: 'Material scrap on JOB-003 - 15 lbs', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), severity: 'WARNING' },
    { id: 'EXC-002', type: 'QC_HOLD', message: 'QC hold on JOB-005 - dimension check required', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), severity: 'CRITICAL' },
    { id: 'EXC-003', type: 'DOWNTIME', message: 'Saw Line 1 maintenance - 30 min delay', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), severity: 'WARNING' },
    { id: 'EXC-004', type: 'REWORK', message: 'Rework needed on JOB-002 - edge finish', timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), severity: 'INFO' },
    { id: 'EXC-005', type: 'LATE_ARRIVAL', message: 'Material late for JOB-008', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), severity: 'WARNING' },
  ];
}

export function getMockShipments() {
  return {
    staged: 5,
    readyToShip: 8,
    dispatched: 12,
    shipments: [
      { id: 'SHP-001', customerName: 'Acme Corp', status: 'READY', carrier: 'FedEx', scheduledTime: '2:00 PM' },
      { id: 'SHP-002', customerName: 'BuildRight', status: 'STAGED', carrier: 'UPS', scheduledTime: '3:30 PM' },
      { id: 'SHP-003', customerName: 'Metro Fab', status: 'DISPATCHED', carrier: 'Customer Pickup', scheduledTime: '1:00 PM' },
      { id: 'SHP-004', customerName: 'QuickParts', status: 'READY', carrier: 'FedEx', scheduledTime: '4:00 PM' },
    ],
  };
}

export function getMockBomQuality() {
  return [
    { id: 'BOM-001', recipeName: 'Standard Saw Cut - Aluminum', warningsCount: 0, overridesCount: 2, status: 'ACTIVE' },
    { id: 'BOM-002', recipeName: 'Precision Shear - Steel', warningsCount: 3, overridesCount: 0, status: 'REVIEW' },
    { id: 'BOM-003', recipeName: 'CNC Router - Complex', warningsCount: 1, overridesCount: 5, status: 'ACTIVE' },
    { id: 'BOM-004', recipeName: 'Waterjet Cut - Stainless', warningsCount: 0, overridesCount: 0, status: 'ACTIVE' },
  ];
}

export function getMockForecast() {
  return {
    today: { load: 420, capacity: 480, utilizationPercent: 87.5, jobsPlanned: 18 },
    tomorrow: { load: 380, capacity: 480, utilizationPercent: 79.2, jobsPlanned: 15 },
    trend: 'DECREASING',
    hotJobsToday: 4,
    hotJobsTomorrow: 2,
  };
}

export function getMockRfqFunnel() {
  return {
    rfqCount: 45,
    quotedCount: 32,
    orderedCount: 18,
    rfqToQuoteRate: 71,
    quoteToOrderRate: 56,
    avgQuoteValue: 4500,
    totalPipelineValue: 144000,
  };
}

export function getMockMarginInsights() {
  return {
    avgMargin: 28.5,
    marginTrend: 'UP',
    discountedOrdersPercent: 15,
    avgDiscount: 8.2,
    topMarginCustomer: 'Acme Corp',
    lowMarginAlert: 2,
  };
}

export function getMockSlaRiskJobs() {
  const jobs = getMockJobs();
  return jobs.map((job) => {
    const hoursUntilDue = (new Date(job.dueDate) - Date.now()) / (1000 * 60 * 60);
    let risk = 'SAFE';
    if (job.priority === 'HOT' || hoursUntilDue < 4) risk = 'HOT';
    else if (hoursUntilDue < 12) risk = 'AT_RISK';
    return { ...job, risk, hoursUntilDue: Math.round(hoursUntilDue * 10) / 10 };
  });
}
