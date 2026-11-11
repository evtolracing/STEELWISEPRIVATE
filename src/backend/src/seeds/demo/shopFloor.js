/**
 * Demo shop floor: one service-center location with four work centers and a
 * queue of scheduled jobs, so the schedule optimizer has real rows to plan.
 * Hours are relative to the moment the seed runs.
 */
export const demoOwner = { code: 'STEELWISE-DEMO', name: 'SteelWise Demo Metals', type: 'SERVICE_CENTER', city: 'Jackson', state: 'MI' };

export const demoLocation = { code: 'DEMO-JAX', name: 'Jackson Service Center', type: 'WAREHOUSE', city: 'Jackson', state: 'MI' };

export const demoWorkCenters = [
  { id: 'DEMO-WC-SAW-01', code: 'DEMO-SAW-01', name: 'Saw #1', type: 'SAW', division: 'METALS' },
  { id: 'DEMO-WC-SAW-02', code: 'DEMO-SAW-02', name: 'Saw #2', type: 'SAW', division: 'METALS' },
  { id: 'DEMO-WC-SHEAR-01', code: 'DEMO-SHEAR-01', name: 'Shear #1', type: 'SHEAR', division: 'METALS' },
  { id: 'DEMO-WC-ROUTER-01', code: 'DEMO-ROUTER-01', name: 'Router #1', type: 'ROUTER', division: 'PLASTICS' },
];

// dueInHours becomes the sales order's promised date.
export const demoOrders = [
  { id: 'DEMO-SO-001', orderNumber: 'SO-DEMO-001', dueInHours: 8, poReference: 'PO-44120' },
  { id: 'DEMO-SO-002', orderNumber: 'SO-DEMO-002', dueInHours: 20, poReference: 'PO-44187' },
  { id: 'DEMO-SO-003', orderNumber: 'SO-DEMO-003', dueInHours: 36, poReference: 'PO-44203' },
  { id: 'DEMO-SO-004', orderNumber: 'SO-DEMO-004', dueInHours: 60, poReference: 'PO-44251' },
];

// priority: 5 = HOT, 4 = HIGH, 3 = NORMAL, 1 = LOW. minutes = estimated run time.
export const demoJobs = [
  { id: 'DEMO-JOB-001', jobNumber: 'J-DEMO-001', orderId: 'DEMO-SO-001', operationType: 'SAW', priority: 5, minutes: 25, thicknessIn: 1.0, gradeOverride: '6061-T6', inputWeightLb: 640 },
  { id: 'DEMO-JOB-002', jobNumber: 'J-DEMO-002', orderId: 'DEMO-SO-001', operationType: 'SHEAR', priority: 5, minutes: 40, thicknessIn: 0.125, gradeOverride: 'A36', inputWeightLb: 4200 },
  { id: 'DEMO-JOB-003', jobNumber: 'J-DEMO-003', orderId: 'DEMO-SO-002', operationType: 'SAW', priority: 4, minutes: 90, thicknessIn: 2.0, gradeOverride: '4140', inputWeightLb: 1850 },
  { id: 'DEMO-JOB-004', jobNumber: 'J-DEMO-004', orderId: 'DEMO-SO-002', operationType: 'SHEAR', priority: 3, minutes: 120, thicknessIn: 0.06, gradeOverride: 'CQ', inputWeightLb: 9800 },
  { id: 'DEMO-JOB-005', jobNumber: 'J-DEMO-005', orderId: 'DEMO-SO-003', operationType: 'ROUTER', priority: 3, minutes: 75, thicknessIn: 0.5, gradeOverride: 'HDPE', inputWeightLb: 310 },
  { id: 'DEMO-JOB-006', jobNumber: 'J-DEMO-006', orderId: 'DEMO-SO-003', operationType: 'SAW', priority: 3, minutes: 180, thicknessIn: 3.0, gradeOverride: '1018', inputWeightLb: 5200 },
  { id: 'DEMO-JOB-007', jobNumber: 'J-DEMO-007', orderId: 'DEMO-SO-004', operationType: 'SHEAR', priority: 1, minutes: 240, thicknessIn: 0.25, gradeOverride: 'A36', inputWeightLb: 15000 },
  { id: 'DEMO-JOB-008', jobNumber: 'J-DEMO-008', orderId: 'DEMO-SO-004', operationType: 'ROUTER', priority: 4, minutes: 150, thicknessIn: 0.25, gradeOverride: 'ACRYLIC', inputWeightLb: 180 },
  { id: 'DEMO-JOB-009', jobNumber: 'J-DEMO-009', orderId: 'DEMO-SO-002', operationType: 'SAW', priority: 3, minutes: 210, thicknessIn: 1.5, gradeOverride: '304', inputWeightLb: 2700 },
  { id: 'DEMO-JOB-010', jobNumber: 'J-DEMO-010', orderId: null, operationType: 'LASER', priority: 3, minutes: 60, thicknessIn: 0.188, gradeOverride: 'A36', inputWeightLb: 900 },
];
