/**
 * Demo data loader. Safe to run more than once: every record is upserted by
 * a stable key, so re-running updates instead of duplicating.
 *
 *   npm run db:seed:demo            (terminal)
 *   POST /api/admin/seed-demo        (signed in as an owner or super admin)
 *
 * This grows as modules move off in-memory data; Phase 1 ends with one
 * realistic seed for the whole system.
 */
import prisma from '../../lib/db.js';
import { executiveDecisions } from './executiveDecisions.js';

const customers = [
  {
    code: 'ACME',
    name: 'Acme Manufacturing',
    type: 'OEM',
    city: 'Cleveland',
    state: 'OH',
    postalCode: '44114',
    phone: '216-555-0140',
    paymentTerms: 'NET30',
    divisions: [
      {
        code: 'ACME-AUTO',
        name: 'Acme Manufacturing – Automotive',
        city: 'Toledo',
        state: 'OH',
        postalCode: '43604',
        addresses: [
          { key: 'ACME-AUTO-DOCK', addressName: 'Toledo Plant Dock 3', addressLine1: '1200 Industrial Pkwy', city: 'Toledo', state: 'OH', postalCode: '43604', isPrimary: true },
        ],
      },
      {
        code: 'ACME-AERO',
        name: 'Acme Manufacturing – Aerospace',
        city: 'Wichita',
        state: 'KS',
        postalCode: '67202',
        taxExempt: true,
        addresses: [
          { key: 'ACME-AERO-RCV', addressName: 'Wichita Receiving', addressLine1: '88 Airport Rd', city: 'Wichita', state: 'KS', postalCode: '67202', isPrimary: true },
        ],
      },
    ],
    addresses: [
      { key: 'ACME-HQ-BILL', addressType: 'BILLING', addressName: 'Accounts Payable', addressLine1: '500 Lakeside Ave', city: 'Cleveland', state: 'OH', postalCode: '44114', isPrimary: true },
      { key: 'ACME-HQ-SHARED', addressName: 'Central Warehouse (all divisions)', addressLine1: '4100 E 49th St', city: 'Cleveland', state: 'OH', postalCode: '44125', shared: true, allDivisions: true },
    ],
  },
];

async function upsertOrg(data, parentId = null) {
  const { divisions, addresses, ...fields } = data;
  const org = await prisma.organization.upsert({
    where: { code: fields.code },
    update: { ...fields, type: fields.type || 'OEM', parentId },
    create: { ...fields, type: fields.type || 'OEM', parentId },
  });

  for (const { key, ...address } of addresses || []) {
    // Addresses have no natural unique key, so the seed uses a fixed id.
    const id = `seed-address-${key.toLowerCase()}`;
    await prisma.address.upsert({
      where: { id },
      update: { ...address, organizationId: org.id },
      create: { id, ...address, organizationId: org.id },
    });
  }

  for (const division of divisions || []) {
    await upsertOrg({ ...division, type: data.type }, org.id);
  }
  return org;
}

async function seedCustomers() {
  for (const customer of customers) await upsertOrg(customer);
  console.log(`  customers: ${customers.length} with divisions and ship-tos`);
}

async function seedExecutive() {
  for (const d of executiveDecisions) {
    const data = {
      type: d.type,
      title: d.title,
      description: d.description,
      decisionMaker: d.decisionMaker,
      role: d.role,
      status: d.status,
      scenarioId: d.scenarioId,
      predictedOutcome: d.predictedOutcome ?? undefined,
      actualOutcome: d.actualOutcome ?? undefined,
      variance: d.variance ?? undefined,
      conditions: d.conditions || [],
      aiRecommendation: d.aiRecommendation,
      aiConfidence: d.aiConfidence,
      decidedAt: new Date(d.timestamp),
    };
    await prisma.executiveDecision.upsert({
      where: { decisionNumber: d.id },
      update: data,
      create: { decisionNumber: d.id, ...data },
    });
  }

  await prisma.simulationScenario.upsert({
    where: { id: 'SCENARIO-001' },
    update: {},
    create: {
      id: 'SCENARIO-001',
      name: 'Accept RFQ-2026-089',
      status: 'READY',
      changes: [{ type: 'DEMAND', description: 'Add 15,000 lbs 4140 Round Bar order', value: '+15000 lbs' }],
    },
  });
  console.log(`  executive: ${executiveDecisions.length} decisions, 1 scenario`);
}

/**
 * Loads all demo data. Returns a summary of what was loaded.
 */
export async function seedDemo() {
  if (!prisma) throw new Error('DATABASE_URL is not set');
  console.log('Seeding demo data…');
  await seedCustomers();
  await seedExecutive();
  console.log('Done.');
  return { customers: customers.length, executiveDecisions: executiveDecisions.length, scenarios: 1 };
}
