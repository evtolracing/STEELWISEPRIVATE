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
      role: 'MILL_OPERATOR',
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
      specStandard: 'ASTM A36/A36M',
    },
  });

  const gradeA572 = await prisma.grade.upsert({
    where: { code: 'A572-50' },
    update: {},
    create: {
      code: 'A572-50',
      name: 'ASTM A572 Grade 50',
      family: 'ALLOY',
      specStandard: 'ASTM A572/A572M',
    },
  });

  const grade304 = await prisma.grade.upsert({
    where: { code: '304SS' },
    update: {},
    create: {
      code: '304SS',
      name: '304 Stainless Steel',
      family: 'STAINLESS',
      specStandard: 'ASTM A240',
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
      productType: 'FLAT',
      form: 'COIL',
      gradeId: gradeA36.id,
      thicknessMin: 0.048,
      widthMin: 48,
    },
  });

  const productCRC = await prisma.product.upsert({
    where: { sku: 'CRC-A36-060' },
    update: {},
    create: {
      sku: 'CRC-A36-060',
      name: 'Cold Rolled Coil A36 0.060"',
      productType: 'FLAT',
      form: 'COIL',
      gradeId: gradeA36.id,
      thicknessMin: 0.060,
      widthMin: 60,
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
      ownerId: org.id,
      form: 'COIL',
      thicknessIn: 0.048,
      widthIn: 48,
      grossWeightLb: 25000,
      netWeightLb: 24800,
      status: 'AVAILABLE',
      qcStatus: 'PASSED',
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
      ownerId: org.id,
      form: 'COIL',
      thicknessIn: 0.048,
      widthIn: 48,
      grossWeightLb: 28000,
      netWeightLb: 27800,
      status: 'AVAILABLE',
      qcStatus: 'PASSED',
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
      qtyOnHand: coil1.grossWeightLb,
      qtyAvailable: coil1.grossWeightLb,
      qtyAllocated: 0,
      qtyOnHold: 0,
    },
  });

  await prisma.inventory.create({
    data: {
      coilId: coil2.id,
      locationId: warehouse.id,
      qtyOnHand: coil2.grossWeightLb,
      qtyAvailable: coil2.grossWeightLb,
      qtyAllocated: 0,
      qtyOnHold: 0,
    },
  });

  console.log('Created inventory records');

  // Create a sample order (if not exists)
  let order = await prisma.order.findUnique({ where: { orderNumber: 'SO-000001' } });
  if (!order) {
    order = await prisma.order.create({
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
  } else {
    console.log('Sample order already exists:', order.orderNumber);
  }

  // Create default roles with permissions
  const defaultRoles = [
    {
      name: 'SUPER_ADMIN',
      displayName: 'Super Admin',
      description: 'Full system access across all tenants',
      permissions: ['*'],
      isSystem: true,
    },
    {
      name: 'TENANT_OWNER',
      displayName: 'Tenant Owner',
      description: 'Full access within tenant',
      permissions: ['iam.*', 'tenant.*', 'crm.*', 'rfq.*', 'quote.*', 'order.*', 'inv.*', 'po.*', 'recv.*', 'bom.*', 'job.*', 'dispatch.*', 'floor.*', 'qc.*', 'pack.*', 'ship.*', 'fin.*', 'analytics.*', 'sim.*', 'int.*', 'master.*', 'trace.*', 'support.*'],
      isSystem: true,
    },
    {
      name: 'BRANCH_MANAGER',
      displayName: 'Branch Manager',
      description: 'Full access within assigned branch',
      permissions: ['crm.*', 'rfq.*', 'quote.*', 'order.*', 'inv.*', 'job.*', 'dispatch.*', 'floor.view', 'floor.list', 'floor.time.approve', 'qc.*', 'pack.*', 'ship.*', 'recv.*', 'analytics.*', 'iam.user.view', 'iam.user.list'],
      isSystem: true,
    },
    {
      name: 'OPS_MANAGER',
      displayName: 'Operations Manager',
      description: 'Manage production and operations',
      permissions: ['job.*', 'dispatch.*', 'floor.*', 'bom.*', 'inv.*', 'qc.*', 'pack.*', 'ship.*', 'recv.*', 'order.promise.override', 'analytics.*'],
      isSystem: true,
    },
    {
      name: 'SALES_REP',
      displayName: 'Sales Representative',
      description: 'Manage assigned customer accounts',
      permissions: ['crm.contact.*', 'crm.note.*', 'rfq.*', 'quote.view', 'quote.list', 'quote.create', 'quote.update', 'quote.line.*', 'quote.send', 'quote.clone', 'quote.accept', 'order.view', 'order.list', 'order.create', 'order.notes.add', 'inv.view', 'inv.list'],
      isSystem: true,
    },
    {
      name: 'OPERATOR',
      displayName: 'Shop Floor Operator',
      description: 'Execute shop floor operations',
      permissions: ['floor.op.*', 'floor.time.log', 'floor.downtime.*', 'floor.scan.*', 'floor.output.record', 'floor.defect.record', 'floor.queue.view', 'job.view'],
      isSystem: true,
    },
    {
      name: 'QC_INSPECTOR',
      displayName: 'QC Inspector',
      description: 'Perform quality inspections',
      permissions: ['qc.*', 'inv.hold', 'inv.release', 'job.view', 'job.operation.view', 'recv.inspect.*', 'trace.*'],
      isSystem: true,
    },
    {
      name: 'SHIPPING_COORDINATOR',
      displayName: 'Shipping Coordinator',
      description: 'Manage shipping operations',
      permissions: ['ship.*', 'pack.view', 'pack.list', 'pack.stage', 'order.view', 'inv.view'],
      isSystem: true,
    },
    {
      name: 'RECEIVING_CLERK',
      displayName: 'Receiving Clerk',
      description: 'Process incoming materials',
      permissions: ['recv.*', 'po.view', 'po.list', 'inv.view', 'inv.lot.assign', 'pack.label.print'],
      isSystem: true,
    },
    {
      name: 'VIEWER',
      displayName: 'Viewer',
      description: 'Read-only access',
      permissions: ['*.view', '*.list'],
      isSystem: true,
    },
  ];

  for (const role of defaultRoles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { 
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions,
      },
      create: role,
    });
  }

  console.log('Created default roles:', defaultRoles.length);

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
