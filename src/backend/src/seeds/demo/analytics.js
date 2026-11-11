/**
 * Demo history for the analytics dashboards: four branches, four CSRs, and 90
 * days of sales orders that each carry a full timeline (quote or web order →
 * order → job → shipment), plus 12 weeks of demand-shaping suggestion events.
 * Generated from a fixed seed, so every run produces the same shape; dates are
 * relative to when the seed runs.
 */
export const analyticsBranches = [
  { code: 'DEMO-JAX', name: 'Jackson Service Center', city: 'Jackson', key: 'JACKSON', speed: 1.0 },
  { code: 'DEMO-DET', name: 'Detroit Service Center', city: 'Detroit', key: 'DETROIT', speed: 1.5 },
  { code: 'DEMO-KZO', name: 'Kalamazoo Service Center', city: 'Kalamazoo', key: 'KALAMAZOO', speed: 0.7 },
  { code: 'DEMO-GR', name: 'Grand Rapids Service Center', city: 'Grand Rapids', key: 'GRAND_RAPIDS', speed: 0.9 },
];

// passwordHash '!' never matches a bcrypt hash, so these demo users cannot sign in.
export const analyticsCsrs = [
  { id: 'demo-csr-1', email: 'sarah.wilson@csr.steelwise.demo', firstName: 'Sarah', lastName: 'Wilson', branch: 'DEMO-JAX', pace: 0.8 },
  { id: 'demo-csr-2', email: 'john.davis@csr.steelwise.demo', firstName: 'John', lastName: 'Davis', branch: 'DEMO-DET', pace: 1.3 },
  { id: 'demo-csr-3', email: 'lisa.chen@csr.steelwise.demo', firstName: 'Lisa', lastName: 'Chen', branch: 'DEMO-KZO', pace: 0.7 },
  { id: 'demo-csr-4', email: 'tom.bradley@csr.steelwise.demo', firstName: 'Tom', lastName: 'Bradley', branch: 'DEMO-GR', pace: 1.0 },
];

const SKUS = [
  { sku: 'HR-A36-PL', desc: 'HR A36 Plate 0.50" – Cut 24" × 48"', price: 159.3 },
  { sku: 'HR-A572-PL', desc: 'HR A572-50 Plate 1.0" – Cut 36" × 60"', price: 288.0 },
  { sku: 'SS-304-SH', desc: 'SS 304 Sheet 0.060" × 48" × 120"', price: 271.95 },
  { sku: 'AL-6061-PL', desc: 'Al 6061-T6 Plate 0.50" – Cut 12" × 24"', price: 81.4 },
  { sku: 'CR-1018-BR', desc: 'CR 1018 Bar 1.5" dia × 18"', price: 12.4 },
  { sku: 'HDPE-SH-NAT', desc: 'HDPE Sheet 1.0" × 48" × 96"', price: 214.0 },
  { sku: 'UHMW-ROD-WH', desc: 'UHMW Rod 2" dia × 48"', price: 96.5 },
  { sku: 'WG-25', desc: 'Welding Gloves – Heavy Duty', price: 24.99 },
];

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Order timelines in hours relative to "now". Every number is fixed by the
 * seed, so the dashboard looks the same after each run.
 */
export function buildAnalyticsOrders(count = 48) {
  const r = rng(20261111);
  const between = (a, b) => a + r() * (b - a);
  const out = [];
  for (let i = 0; i < count; i++) {
    const n = String(i + 1).padStart(2, '0');
    const csr = analyticsCsrs[i % analyticsCsrs.length];
    const branch = analyticsBranches.find((b) => b.code === csr.branch);
    const item = SKUS[Math.floor(r() * SKUS.length)];
    const qty = 2 + Math.floor(r() * 18);
    const source = ['ONLINE', 'QUOTE', 'ONLINE', 'QUOTE', 'DIRECT'][i % 5];
    const orderAgo = between(6, 88 * 24); // hours before now the order was placed
    const quoteHours = source === 'QUOTE' ? between(3, 70) * csr.pace : null;
    const onlineHours = source === 'ONLINE' ? between(0.2, 3.2) * csr.pace : null;
    const schedHours = between(2, 30) * branch.speed;
    const shipHours = between(10, 90) * branch.speed;
    const scheduledAgo = orderAgo - schedHours;
    const shippedAgo = scheduledAgo - shipHours;
    out.push({
      n, source, csrId: csr.id, branchCode: branch.code, sku: item.sku, description: item.desc, qty, price: item.price,
      quoteAgo: quoteHours != null ? orderAgo + quoteHours : null,
      webReceivedAgo: onlineHours != null ? orderAgo + onlineHours : null,
      orderAgo,
      scheduledAgo: scheduledAgo > 0 ? scheduledAgo : null,
      shippedAgo: scheduledAgo > 0 && shippedAgo > 0 ? shippedAgo : null,
    });
  }
  return out;
}

const SUGGESTION_MIX = [
  { type: 'ALT_DATE', weight: 0.38, accept: 0.42, savings: [60, 260] },
  { type: 'NON_RUSH', weight: 0.25, accept: 0.37, savings: [80, 340] },
  { type: 'ALT_BRANCH', weight: 0.22, accept: 0.39, savings: [0, 0] },
  { type: 'OFF_PEAK', weight: 0.1, accept: 0.27, savings: [30, 140] },
  { type: 'CONSOLIDATE', weight: 0.05, accept: 0.18, savings: [20, 90] },
];

/** About 60 suggestions a week for 12 weeks, with accept/dismiss outcomes. */
export function buildDemandEvents(weeks = 12) {
  const r = rng(424242);
  const DAY = 86400000;
  const now = Date.now();
  const events = [];
  let k = 0;
  for (let w = weeks - 1; w >= 0; w--) {
    const perWeek = 45 + Math.floor(r() * 30);
    for (let i = 0; i < perWeek; i++) {
      let x = r();
      const mix = SUGGESTION_MIX.find((m) => (x -= m.weight) < 0) || SUGGESTION_MIX[0];
      const at = new Date(now - (w * 7 + r() * 7) * DAY);
      const savings = Math.round(mix.savings[0] + r() * (mix.savings[1] - mix.savings[0]));
      const suggestionId = `seed-ds-${String(++k).padStart(4, '0')}`;
      const source = r() < 0.6 ? 'CSR' : 'ECOMMERCE';
      const branchKey = analyticsBranches[Math.floor(r() * analyticsBranches.length)].key;
      const base = { suggestionId, type: mix.type, savingsAmount: savings, source, branchKey };
      events.push({ ...base, action: 'SHOWN', createdAt: at });
      const outcome = r();
      if (outcome < mix.accept) events.push({ ...base, action: 'ACCEPTED', createdAt: new Date(at.getTime() + 60000) });
      else if (outcome < mix.accept + 0.35) events.push({ ...base, action: 'DISMISSED', reason: 'user_dismissed', createdAt: new Date(at.getTime() + 60000) });
    }
  }
  return events;
}
