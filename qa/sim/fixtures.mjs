// Loads the synthetic QA data set: 80 branches, work centers for metals and
// plastics, 16 customers, coils/sheets/bars in stock at every branch, and test
// logins for each role. Safe to re-run (everything is keyed by a QA- code).
//   DATABASE_URL=postgresql://…/steelwise_qa node qa/sim/fixtures.mjs
import { prismaClient, bcrypt, QA_USERS, QA_PASSWORD, rng } from './lib.mjs';

const prisma = prismaClient();
const r = rng(80);

const STATES = ['MI', 'OH', 'IN', 'IL', 'WI', 'PA', 'NY', 'TX', 'CA', 'AZ', 'CO', 'GA', 'FL', 'WA', 'OR', 'TN'];
const BRANCH_KINDS = ['METALS', 'METALS', 'METALS', 'PLASTICS', 'MIXED', 'MIXED', 'OUTLET'];
const METAL_WC = ['SAW', 'SHEAR', 'LASER', 'PLASMA', 'WATERJET'];
const PLASTIC_WC = ['ROUTER', 'CNC', 'PLASTIC_SAW'];

async function main() {
  const tenant = await prisma.organization.upsert({
    where: { code: 'QA-TENANT' }, update: {},
    create: { code: 'QA-TENANT', name: 'QA Steel Service Co', type: 'SERVICE_CENTER' },
  });
  const hash = await bcrypt().hash(QA_PASSWORD, 10);

  const customers = [];
  for (let i = 1; i <= 16; i++) {
    const code = `QA-C${String(i).padStart(2, '0')}`;
    customers.push(await prisma.organization.upsert({
      where: { code }, update: {},
      create: { code, name: `QA Customer ${i}`, type: i % 3 ? 'FABRICATOR' : 'OEM', city: 'Testville', state: r.pick(STATES), paymentTerms: i % 4 ? 'NET30' : 'COD' },
    }));
  }

  // Customer A has two divisions; one login belongs to the first division only.
  const divisions = [];
  for (const n of [1, 2]) {
    divisions.push(await prisma.organization.upsert({
      where: { code: `QA-C01-D${n}` }, update: { parentId: customers[0].id },
      create: { code: `QA-C01-D${n}`, name: `QA Customer 1 Division ${n}`, type: 'FABRICATOR', city: 'Testville', state: customers[0].state, parentId: customers[0].id },
    }));
  }

  const roleUsers = [
    ['admin', 'SUPER_ADMIN', null], ['csr', 'CSR', null], ['operator', 'OPERATOR_SAW', null], ['shipping', 'SHIPPING_COORDINATOR', null],
    ['custA', 'CUSTOMER_BUYER', customers[0].id], ['custB', 'CUSTOMER_BUYER', customers[1].id],
    ['custDiv', 'CUSTOMER_BUYER', divisions[0].id],
  ];
  const users = {};
  for (const [key, role, customerId] of roleUsers) {
    users[key] = await prisma.user.upsert({
      where: { email: QA_USERS[key] },
      update: { passwordHash: hash, role, customerId, isActive: true, organizationId: tenant.id },
      create: { email: QA_USERS[key], passwordHash: hash, firstName: 'QA', lastName: key, role, organizationId: tenant.id, customerId },
    });
  }

  const grades = Object.fromEntries((await prisma.grade.findMany()).map((g) => [g.code, g]));
  const need = ['A36', '304SS', '6061-T6', 'HDPE', 'UHMW', '1018'];
  for (const g of need) if (!grades[g]) throw new Error(`Grade ${g} missing: run the demo seed first`);
  const mill = customers[15];
  const heats = {};
  for (const g of need) {
    const heatNumber = `QA-H-${g}`;
    heats[g] = await prisma.heat.upsert({
      where: { heatNumber }, update: {},
      create: { heatNumber, millId: mill.id, gradeId: grades[g].id, castDate: new Date('2026-06-01'), createdById: users.admin.id },
    });
  }

  let coilCount = 0, wcCount = 0;
  for (let n = 1; n <= 80; n++) {
    const code = `QA-L${String(n).padStart(2, '0')}`;
    const kind = BRANCH_KINDS[(n - 1) % BRANCH_KINDS.length];
    const loc = await prisma.location.upsert({
      where: { code }, update: {},
      create: { code, name: `QA Branch ${n} (${kind})`, type: 'WAREHOUSE', ownerId: tenant.id, city: `City ${n}`, state: STATES[n % STATES.length], hasCrane: kind !== 'PLASTICS' },
    });
    const wcTypes = kind === 'PLASTICS' ? PLASTIC_WC : kind === 'MIXED' ? [...METAL_WC.slice(0, 3), ...PLASTIC_WC.slice(0, 2)] : kind === 'OUTLET' ? ['SAW'] : METAL_WC.slice(0, 2 + (n % 4));
    for (const t of wcTypes) {
      const wcCode = `${code}-${t}`;
      await prisma.workCenter.upsert({ where: { code: wcCode }, update: {}, create: { code: wcCode, name: `${t} @ ${code}`, locationId: loc.id, type: t, capacity: { hoursPerDay: 8 + (n % 3) * 4 } } });
      wcCount++;
    }
    const stock = kind === 'PLASTICS' ? [['HDPE', 'SHEET'], ['UHMW', 'ROD'], ['HDPE', 'SHEET']]
      : kind === 'MIXED' ? [['A36', 'PLATE'], ['304SS', 'SHEET'], ['HDPE', 'SHEET'], ['UHMW', 'ROD']]
      : kind === 'OUTLET' ? [['A36', 'PLATE'], ['6061-T6', 'PLATE']]
      : [['A36', 'PLATE'], ['A36', 'COIL'], ['304SS', 'SHEET'], ['1018', 'BAR'], ['6061-T6', 'PLATE']];
    for (let s = 0; s < stock.length; s++) {
      const [g, form] = stock[s];
      const coilNumber = `${code}-S${s + 1}`;
      const weight = 2000 + r.int(0, 28) * 1000;
      const coil = await prisma.coil.upsert({
        where: { coilNumber }, update: {},
        create: { coilNumber, heatId: heats[g].id, gradeId: grades[g].id, ownerId: tenant.id, form, grossWeightLb: weight, netWeightLb: weight, status: 'AVAILABLE', qcStatus: 'PASSED', locationId: loc.id, createdById: users.admin.id, thicknessIn: 0.25, widthIn: 48, lengthIn: 96 },
      });
      await prisma.inventory.upsert({
        where: { coilId: coil.id }, update: {},
        create: { coilId: coil.id, locationId: loc.id, qtyOnHand: weight, qtyAvailable: weight, unitCost: 0.45 },
      });
      coilCount++;
    }
  }
  console.log(`QA fixtures: 80 branches, ${wcCount} work centers, ${coilCount} stock items, 16 customers, ${roleUsers.length} logins`);
}
main().finally(() => prisma.$disconnect());
