/**
 * Demo exception feed. Times are minutes before the seed runs, so the feed
 * always looks current after a reload.
 */
export const exceptionEvents = [
  { id: 'EXC-DEMO-001', type: 'SCRAP', message: 'Material scrap on JOB-2026-003 - 15 lbs aluminum', severity: 'WARNING', locationId: 'FWA', workCenterId: 'SAW-01', acknowledged: false, minutesAgo: 15 },
  { id: 'EXC-DEMO-002', type: 'QC_HOLD', message: 'QC hold on JOB-2026-005 - dimension check required', severity: 'CRITICAL', locationId: 'FWA', workCenterId: 'SHEAR-01', acknowledged: false, minutesAgo: 30 },
  { id: 'EXC-DEMO-003', type: 'DOWNTIME', message: 'Saw Line 1 blade change - 20 min delay', severity: 'WARNING', locationId: 'FWA', workCenterId: 'SAW-01', acknowledged: true, minutesAgo: 45 },
  { id: 'EXC-DEMO-004', type: 'REWORK', message: 'Rework needed on JOB-2026-002 - edge finish issue', severity: 'INFO', locationId: 'FWA', workCenterId: 'RTR-01', acknowledged: false, minutesAgo: 60 },
  { id: 'EXC-DEMO-005', type: 'LATE_MATERIAL', message: 'Material late for JOB-2026-008 - ETA 2 hours', severity: 'WARNING', locationId: 'FWA', workCenterId: null, acknowledged: false, minutesAgo: 90 },
  { id: 'EXC-DEMO-006', type: 'MACHINE_ALERT', message: 'Router spindle temp elevated - monitoring', severity: 'INFO', locationId: 'FWA', workCenterId: 'RTR-01', acknowledged: true, minutesAgo: 120 },
  { id: 'EXC-DEMO-007', type: 'PRIORITY_CHANGE', message: 'JOB-2026-010 upgraded to HOT by customer request', severity: 'WARNING', locationId: 'FWA', workCenterId: null, acknowledged: false, minutesAgo: 150 },
  { id: 'EXC-DEMO-008', type: 'INVENTORY_LOW', message: 'SS-304-0125 below reorder point - 45 lbs remaining', severity: 'CRITICAL', locationId: 'FWA', workCenterId: null, acknowledged: false, minutesAgo: 180 },
];
