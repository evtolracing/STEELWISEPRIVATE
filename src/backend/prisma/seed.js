import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create Organization first
  const org = await prisma.organization.upsert({
    where: { code: 'STEELWISE' },
    update: {},
    create: {
      code: 'STEELWISE',
      name: 'SteelWise Service Center',
      type: 'SERVICE_CENTER',
      isActive: true,
    },
  });

  console.log('Created organization:', org.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@steelwise.com' },
    update: {},
    create: {
      email: 'admin@steelwise.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create operator user
  const operator = await prisma.user.upsert({
    where: { email: 'operator@steelwise.com' },
    update: {},
    create: {
      email: 'operator@steelwise.com',
      passwordHash: hashedPassword,
      firstName: 'Operator',
      lastName: 'User',
      role: 'OPERATOR',
      organizationId: org.id,
    },
  });

  console.log('Created operator user:', operator.email);

  // Create some grades
  const gradeA36 = await prisma.grade.upsert({
    where: { code: 'A36' },
    update: {},
    create: {
      code: 'A36',
      name: 'ASTM A36',
      family: 'CARBON',
      spec: 'ASTM A36/A36M',
      description: 'Carbon structural steel',
    },
  });

  const gradeA572 = await prisma.grade.upsert({
    where: { code: 'A572-50' },
    update: {},
    create: {
      code: 'A572-50',
      name: 'ASTM A572 Grade 50',
      family: 'HSLA',
      spec: 'ASTM A572/A572M',
      description: 'High-strength low-alloy structural steel',
    },
  });

  const grade304 = await prisma.grade.upsert({
    where: { code: '304SS' },
    update: {},
    create: {
      code: '304SS',
      name: '304 Stainless Steel',
      family: 'STAINLESS',
      spec: 'ASTM A240',
      description: 'Austenitic stainless steel',
    },
  });

  console.log('Created grades');

  // Create a mill organization
  const mill = await prisma.organization.upsert({
    where: { code: 'NUCOR-BERKLEY' },
    update: {},
    create: {
      code: 'NUCOR-BERKLEY',
      name: 'Nucor Steel Berkeley',
      type: 'MILL',
      isActive: true,
    },
  });

  console.log('Created mill:', mill.name);

  // Create a customer organization
  const customer = await prisma.organization.upsert({
    where: { code: 'ACME-STEEL' },
    update: {},
    create: {
      code: 'ACME-STEEL',
      name: 'Acme Steel Fabricators',
      type: 'FABRICATOR',
      paymentTerms: 'NET30',
      creditLimit: 100000,
      isActive: true,
    },
  });

  console.log('Created customer:', customer.name);

  // Create a location
  const warehouse = await prisma.location.upsert({
    where: { code: 'WH-MAIN' },
    update: {},
    create: {
      code: 'WH-MAIN',
      name: 'Main Warehouse',
      type: 'WAREHOUSE',
      ownerId: org.id,
      isActive: true,
    },
  });

  console.log('Created location:', warehouse.name);

  // Create some products
  const productHRC = await prisma.product.upsert({
    where: { sku: 'HRC-A36-048' },
    update: {},
    create: {
      sku: 'HRC-A36-048',
      name: 'Hot Rolled Coil A36 0.048"',
      type: 'FLAT',
      form: 'COIL',
      gradeId: gradeA36.id,
      thicknessIn: 0.048,
      widthIn: 48,
    },
  });

  const productCRC = await prisma.product.upsert({
    where: { sku: 'CRC-A36-060' },
    update: {},
    create: {
      sku: 'CRC-A36-060',
      name: 'Cold Rolled Coil A36 0.060"',
      type: 'FLAT',
      form: 'COIL',
      gradeId: gradeA36.id,
      thicknessIn: 0.060,
      widthIn: 60,
    },
  });

  console.log('Created products');

  // Create a heat
  const heat = await prisma.heat.upsert({
    where: { heatNumber: 'HEAT-2026-001' },
    update: {},
    create: {
      heatNumber: 'HEAT-2026-001',
      millId: mill.id,
      gradeId: gradeA36.id,
      castDate: new Date('2026-01-10'),
      meltType: 'EAF',
      castType: 'CONTINUOUS',
      status: 'ACTIVE',
      createdById: admin.id,
    },
  });

  console.log('Created heat:', heat.heatNumber);

  // Create some coils
  const coil1 = await prisma.coil.create({
    data: {
      coilNumber: `COIL-${Date.now()}-001`,
      heatId: heat.id,
      gradeId: gradeA36.id,
      productId: productHRC.id,
      thicknessIn: 0.048,
      widthIn: 48,
      weightLb: 25000,
      status: 'AVAILABLE',
      qcStatus: 'APPROVED',
      locationId: warehouse.id,
      createdById: admin.id,
    },
  });

  const coil2 = await prisma.coil.create({
    data: {
      coilNumber: `COIL-${Date.now()}-002`,
      heatId: heat.id,
      gradeId: gradeA36.id,
      productId: productHRC.id,
      thicknessIn: 0.048,
      widthIn: 48,
      weightLb: 28000,
      status: 'AVAILABLE',
      qcStatus: 'APPROVED',
      locationId: warehouse.id,
      createdById: admin.id,
    },
  });

  console.log('Created coils');

  // Create inventory records
  await prisma.inventory.create({
    data: {
      coilId: coil1.id,
      locationId: warehouse.id,
      qtyOnHand: coil1.weightLb,
      qtyAvailable: coil1.weightLb,
      qtyAllocated: 0,
      qtyOnHold: 0,
    },
  });

  await prisma.inventory.create({
    data: {
      coilId: coil2.id,
      locationId: warehouse.id,
      qtyOnHand: coil2.weightLb,
      qtyAvailable: coil2.weightLb,
      qtyAllocated: 0,
      qtyOnHold: 0,
    },
  });

  console.log('Created inventory records');

  // Create a sample order
  const order = await prisma.order.create({
    data: {
      orderNumber: 'SO-000001',
      orderType: 'SO',
      buyerId: customer.id,
      sellerId: org.id,
      status: 'CONFIRMED',
      createdById: admin.id,
      lines: {
        create: [
          {
            lineNumber: 1,
            productId: productHRC.id,
            gradeId: gradeA36.id,
            description: 'Hot Rolled Coil A36',
            thicknessIn: 0.048,
            widthIn: 48,
            qtyOrdered: 25000,
            unit: 'LB',
            unitPrice: 0.45,
            priceUnit: 'LB',
          },
        ],
      },
    },
    include: { lines: true },
  });

  console.log('Created sample order:', order.orderNumber);

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
