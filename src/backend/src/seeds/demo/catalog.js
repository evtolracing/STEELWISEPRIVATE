/**
 * Demo product catalog and stock on hand for the order-intake screens
 * (material picker, retail POS). Prices are per pound unless priceUnit is EA.
 */
export const demoGrades = [
  { code: 'A36', name: 'ASTM A36 Carbon Structural', family: 'CARBON', specStandard: 'ASTM A36' },
  { code: '1018', name: 'AISI 1018 Low Carbon', family: 'CARBON', specStandard: 'ASTM A108' },
  { code: '304', name: '304 Stainless', family: 'STAINLESS', specStandard: 'ASTM A240' },
  { code: '6061-T6', name: 'Aluminum 6061-T6', family: 'ALUMINUM', specStandard: 'ASTM B209' },
  { code: 'A572-50', name: 'ASTM A572 Grade 50 HSLA', family: 'HSLA', specStandard: 'ASTM A572' },
  { code: 'HDPE', name: 'High-Density Polyethylene', family: 'PLASTIC', specStandard: 'ASTM D4976' },
  { code: 'UHMW', name: 'Ultra-High Molecular Weight PE', family: 'PLASTIC', specStandard: 'ASTM D4020' },
];

export const demoProducts = [
  { sku: 'HR-A36-PL', name: 'Hot Rolled A36 Plate', form: 'PLATE', productType: 'FLAT', grade: 'A36', division: 'METALS', category: 'Carbon Steel', thicknessMin: 0.25, thicknessMax: 4, widthMin: 48, widthMax: 96, price: 0.42 },
  { sku: 'CR-1018-BR', name: 'Cold Rolled 1018 Bar', form: 'BAR', productType: 'LONG', grade: '1018', division: 'METALS', category: 'Carbon Steel', thicknessMin: 0.5, thicknessMax: 6, price: 0.68 },
  { sku: 'SS-304-SH', name: 'Stainless 304 Sheet', form: 'SHEET', productType: 'FLAT', grade: '304', division: 'METALS', category: 'Stainless Steel', thicknessMin: 0.024, thicknessMax: 0.187, widthMin: 36, widthMax: 60, price: 1.85 },
  { sku: 'AL-6061-PL', name: 'Aluminum 6061-T6 Plate', form: 'PLATE', productType: 'FLAT', grade: '6061-T6', division: 'METALS', category: 'Aluminum', thicknessMin: 0.25, thicknessMax: 6, widthMin: 48, widthMax: 60, price: 2.45 },
  { sku: 'HR-A572-PL', name: 'Hot Rolled A572-50 Plate', form: 'PLATE', productType: 'FLAT', grade: 'A572-50', division: 'METALS', category: 'HSLA Steel', thicknessMin: 0.25, thicknessMax: 4, widthMin: 48, widthMax: 120, price: 0.48 },
  { sku: 'HDPE-SH-NAT', name: 'HDPE Sheet Natural', form: 'SHEET', productType: 'FLAT', grade: 'HDPE', division: 'PLASTICS', category: 'Polyethylene', thicknessMin: 0.125, thicknessMax: 4, widthMin: 48, widthMax: 60, price: 3.2 },
  { sku: 'UHMW-ROD-WH', name: 'UHMW Rod White', form: 'ROD', productType: 'LONG', grade: 'UHMW', division: 'PLASTICS', category: 'Ultra-High MW', thicknessMin: 1, thicknessMax: 12, price: 5.1 },
  { sku: 'WG-25', name: 'Welding Gloves – Heavy Duty', form: 'SUPPLY', productType: 'OTHER', division: 'SUPPLIES', category: 'Safety', price: 24.99, priceUnit: 'EACH' },
  { sku: 'CUT-DISC-9', name: 'Cut-Off Disc 9"', form: 'SUPPLY', productType: 'OTHER', division: 'SUPPLIES', category: 'Abrasives', price: 6.49, priceUnit: 'EACH' },
  { sku: 'REM-A36-PL', name: 'Remnant A36 Plate (various)', form: 'PLATE', productType: 'FLAT', grade: 'A36', division: 'OUTLET', category: 'Remnants', price: 0.28, isRemnant: true },
];

// One coil/plate per entry, stocked at the demo location. weight = pounds on hand.
export const demoStock = [
  { coilNumber: 'DEMO-L-0891', sku: 'HR-A36-PL', form: 'PLATE', thicknessIn: 0.5, widthIn: 48, lengthIn: 120, weight: 9792, unitCost: 0.31 },
  { coilNumber: 'DEMO-L-0902', sku: 'HR-A36-PL', form: 'PLATE', thicknessIn: 1, widthIn: 96, lengthIn: 240, weight: 19584, unitCost: 0.31 },
  { coilNumber: 'DEMO-L-1001', sku: 'SS-304-SH', form: 'SHEET', thicknessIn: 0.06, widthIn: 48, lengthIn: 120, weight: 3675, unitCost: 1.38 },
  { coilNumber: 'DEMO-L-1102', sku: 'AL-6061-PL', form: 'PLATE', thicknessIn: 0.5, widthIn: 48, lengthIn: 120, weight: 2240, unitCost: 1.9 },
  { coilNumber: 'DEMO-L-1150', sku: 'HR-A572-PL', form: 'PLATE', thicknessIn: 0.75, widthIn: 96, lengthIn: 240, weight: 14688, unitCost: 0.36 },
  { coilNumber: 'DEMO-L-1201', sku: 'HDPE-SH-NAT', form: 'SHEET', thicknessIn: 1, widthIn: 48, lengthIn: 96, weight: 2820, unitCost: 2.25 },
  { coilNumber: 'DEMO-R-0045', sku: 'REM-A36-PL', form: 'PLATE', thicknessIn: 0.75, widthIn: 24, lengthIn: 36, weight: 184, unitCost: 0.31 },
  { coilNumber: 'DEMO-R-0046', sku: 'REM-A36-PL', form: 'PLATE', thicknessIn: 1.5, widthIn: 18, lengthIn: 48, weight: 367, unitCost: 0.31 },
];
