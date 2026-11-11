/**
 * Named settings documents stored in AppSetting. Each key has a default, so a
 * fresh database behaves sensibly before anyone saves a value.
 */
import prisma from './db.js';

export const SETTING_DEFAULTS = {
  'online.checkoutRules': {
    autoApproveThreshold: 5000,
    requireQuoteAbove: 25000,
    maxLinesPerOrder: 50,
    allowGuestCheckout: false,
    defaultPriority: 'STANDARD',
    defaultOwnership: 'HOUSE',
    enableBackorder: true,
  },
  'online.cutoffs': [
    { locationId: 'loc-1', locationName: 'Jackson', cutoffTime: '14:00', timezone: 'America/Detroit', sameDayProcessing: true, active: true },
    { locationId: 'loc-2', locationName: 'Detroit', cutoffTime: '13:00', timezone: 'America/Detroit', sameDayProcessing: true, active: true },
    { locationId: 'loc-3', locationName: 'Kalamazoo', cutoffTime: '14:00', timezone: 'America/Detroit', sameDayProcessing: false, active: true },
    { locationId: 'loc-4', locationName: 'Grand Rapids', cutoffTime: '12:00', timezone: 'America/Detroit', sameDayProcessing: false, active: true },
  ],
  'online.allowedProcesses': {
    METALS: ['SAW-CUT', 'SHEAR', 'PLASMA', 'DRILL', 'DEBURR'],
    PLASTICS: ['PLAS-SAW', 'PLAS-ROUTE'],
    SUPPLIES: [],
    OUTLET: [],
  },
  'demandShaping.config': {
    branches: {
      JACKSON: { id: 'loc-1', name: 'Jackson', load: 0.82, queueDays: 2.5 },
      DETROIT: { id: 'loc-2', name: 'Detroit', load: 0.94, queueDays: 4.0 },
      KALAMAZOO: { id: 'loc-3', name: 'Kalamazoo', load: 0.55, queueDays: 1.0 },
      GRAND_RAPIDS: { id: 'loc-4', name: 'Grand Rapids', load: 0.71, queueDays: 1.5 },
    },
    highLoadThreshold: 0.8,
    dateShiftDiscounts: [
      { daysLater: 1, pct: 2, label: '+1 day' },
      { daysLater: 2, pct: 4, label: '+2 days' },
      { daysLater: 3, pct: 5, label: '+3 days' },
      { daysLater: 5, pct: 7, label: '+5 days' },
    ],
    nonRushSavings: {
      RUSH: { downTo: 'STANDARD', pctOff: 12, label: 'Rush → Standard' },
      HOT: { downTo: 'STANDARD', pctOff: 18, label: 'Hot → Standard' },
      EMERGENCY: { downTo: 'RUSH', pctOff: 15, label: 'Emergency → Rush' },
    },
    offPeakWindows: [
      { label: 'Tues–Wed next week', pctOff: 3, daysOut: 5 },
      { label: 'Following Monday', pctOff: 5, daysOut: 8 },
    ],
    consolidatePct: 2,
  },
  'metrics.slaTargets': {
    QUOTE_TO_ORDER: { target: 48, warning: 36, unit: 'hours' },
    ONLINE_TO_CSR: { target: 2, warning: 1.5, unit: 'hours' },
    ORDER_TO_SCHEDULED: { target: 24, warning: 16, unit: 'hours' },
    SCHEDULED_TO_SHIP: { target: 72, warning: 48, unit: 'hours' },
    END_TO_END: { target: 120, warning: 96, unit: 'hours' },
  },
};

export async function getSetting(key) {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row ? row.value : SETTING_DEFAULTS[key];
}

export async function putSetting(key, value) {
  const row = await prisma.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  return row.value;
}
