import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  await prisma.testResult.deleteMany();
  await prisma.qCHold.deleteMany();
  await prisma.shipmentItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.coil.deleteMany();
  await prisma.heat.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.mill.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@steelwise.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const operator = await prisma.user.create({
    data: {
      email: 'operator@steelwise.com',
      password: hashedPassword,
      name: 'Operator User',
      role: 'OPERATOR',
    },
  });

  console.log('Created users');

  // Create mills
  const mills = await Promise.all([
    prisma.mill.create({
      data: {
        name: 'US Steel Gary Works',
        location: 'Gary, Indiana',
        country: 'USA',
      },
    }),
    prisma.mill.create({
      data: {
        name: 'Nucor Steel Berkeley',
        location: 'Berkeley County, SC',
        country: 'USA',
      },
    }),
    prisma.mill.create({
      data: {
        name: 'ArcelorMittal Cleveland',
        location: 'Cleveland, OH',
        country: 'USA',
      },
    }),
  ]);

  console.log('Created mills');

  // Create grades
  const grades = await Promise.all([
    prisma.grade.create({
      data: {
        name: 'A36',
        specification: 'ASTM A36/A36M-19',
        type: 'CARBON',
        description: 'Carbon structural steel',
      },
    }),
    prisma.grade.create({
      data: {
        name: 'A572-50',
        specification: 'ASTM A572/A572M',
        type: 'HSLA',
        description: 'High-strength low-alloy structural steel',
      },
    }),
    prisma.grade.create({
      data: {
        name: '304 SS',
        specification: 'ASTM A240',
        type: 'STAINLESS',
        description: '304 Stainless steel',
      },
    }),
    prisma.grade.create({
      data: {
        name: '316 SS',
        specification: 'ASTM A240',
        type: 'STAINLESS',
        description: '316 Stainless steel',
      },
    }),
  ]);

  console.log('Created grades');

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Hot Rolled Coil',
        category: 'COIL',
        description: 'Standard hot rolled steel coil',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cold Rolled Coil',
        category: 'COIL',
        description: 'Cold rolled steel coil',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Galvanized Coil',
        category: 'COIL',
        description: 'Hot-dip galvanized steel coil',
      },
    }),
  ]);

  console.log('Created products');

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Acme Steel Co',
        type: 'FABRICATOR',
        address: '456 Manufacturing Ave',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA',
        phone: '312-555-0100',
        email: 'orders@acmesteel.com',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'BuildRight LLC',
        type: 'CONTRACTOR',
        address: '789 Construction Blvd',
        city: 'Detroit',
        state: 'MI',
        zipCode: '48201',
        country: 'USA',
        phone: '313-555-0200',
        email: 'purchasing@buildright.com',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Metal Works Inc',
        type: 'DISTRIBUTOR',
        address: '321 Industrial Way',
        city: 'Cleveland',
        state: 'OH',
        zipCode: '44101',
        country: 'USA',
        phone: '216-555-0300',
        email: 'sales@metalworks.com',
      },
    }),
  ]);

  console.log('Created customers');

  // Create heats
  const heats = await Promise.all([
    prisma.heat.create({
      data: {
        heatNumber: 'HT-2024-001',
        millId: mills[0].id,
        gradeId: grades[0].id,
        castDate: new Date('2024-01-15'),
        chemistry: {
          carbon: 0.25,
          manganese: 0.85,
          phosphorus: 0.012,
          sulfur: 0.008,
          silicon: 0.22,
          copper: 0.20,
        },
        mechanicalProperties: {
          yieldStrength: 36000,
          tensileStrength: 58000,
          elongation: 23,
        },
        status: 'RECEIVED',
      },
    }),
    prisma.heat.create({
      data: {
        heatNumber: 'HT-2024-002',
        millId: mills[1].id,
        gradeId: grades[1].id,
        castDate: new Date('2024-01-20'),
        chemistry: {
          carbon: 0.23,
          manganese: 1.35,
          phosphorus: 0.010,
          sulfur: 0.007,
          silicon: 0.40,
          chromium: 0.15,
        },
        mechanicalProperties: {
          yieldStrength: 50000,
          tensileStrength: 65000,
          elongation: 21,
        },
        status: 'RECEIVED',
      },
    }),
    prisma.heat.create({
      data: {
        heatNumber: 'HT-2024-003',
        millId: mills[2].id,
        gradeId: grades[2].id,
        castDate: new Date('2024-02-01'),
        chemistry: {
          carbon: 0.08,
          manganese: 2.0,
          phosphorus: 0.045,
          sulfur: 0.030,
          silicon: 0.75,
          chromium: 18.0,
          nickel: 8.0,
        },
        status: 'RECEIVED',
      },
    }),
  ]);

  console.log('Created heats');

  // Create coils
  const coils = [];
  for (let i = 0; i < 20; i++) {
    const heatIndex = i % heats.length;
    const coil = await prisma.coil.create({
      data: {
        coilNumber: `U-2024-${String(i + 1).padStart(4, '0')}`,
        heatId: heats[heatIndex].id,
        gradeId: heats[heatIndex].gradeId,
        width: [36, 48, 60, 72][Math.floor(Math.random() * 4)],
        gauge: [0.048, 0.060, 0.075, 0.105][Math.floor(Math.random() * 4)],
        weight: 8000 + Math.floor(Math.random() * 8000),
        innerDiameter: 20,
        outerDiameter: 60 + Math.floor(Math.random() * 20),
        location: `Bay ${String.fromCharCode(65 + Math.floor(i / 5))}-${String(
          (i % 5) + 1
        ).padStart(2, '0')}`,
        status: ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'ALLOCATED', 'ON_HOLD'][
          Math.floor(Math.random() * 5)
        ],
        receivedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
    coils.push(coil);
  }

  console.log('Created coils');

  // Create inventory records
  for (const grade of grades) {
    for (const product of products) {
      await prisma.inventory.create({
        data: {
          gradeId: grade.id,
          productId: product.id,
          location: 'Main Warehouse',
          qtyOnHand: Math.floor(Math.random() * 100000) + 50000,
          qtyAvailable: Math.floor(Math.random() * 80000) + 30000,
          qtyAllocated: Math.floor(Math.random() * 20000),
          qtyOnHold: Math.floor(Math.random() * 5000),
          unitOfMeasure: 'lbs',
        },
      });
    }
  }

  console.log('Created inventory records');

  // Create orders
  const orders = [];
  for (let i = 0; i < 10; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const orderType = ['PURCHASE', 'SALES'][Math.floor(Math.random() * 2)];
    const order = await prisma.order.create({
      data: {
        orderNumber: `${orderType === 'SALES' ? 'SO' : 'PO'}-2024-${String(i + 1).padStart(
          3,
          '0'
        )}`,
        type: orderType,
        status: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'][
          Math.floor(Math.random() * 4)
        ],
        buyerId: orderType === 'SALES' ? customer.id : undefined,
        sellerId: orderType === 'PURCHASE' ? customer.id : undefined,
        orderDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        requiredDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        totalAmount: 10000 + Math.floor(Math.random() * 90000),
      },
    });
    orders.push(order);
  }

  console.log('Created orders');

  // Create work orders
  for (let i = 0; i < 5; i++) {
    await prisma.workOrder.create({
      data: {
        workOrderNumber: `WO-2024-${String(i + 1).padStart(3, '0')}`,
        type: ['SLITTING', 'CUT_TO_LENGTH', 'BLANKING'][Math.floor(Math.random() * 3)],
        status: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 3)],
        scheduledStart: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Created work orders');

  // Create shipments
  for (let i = 0; i < 5; i++) {
    const order = orders[Math.floor(Math.random() * orders.length)];
    await prisma.shipment.create({
      data: {
        shipmentNumber: `SHP-2024-${String(i + 1).padStart(3, '0')}`,
        orderId: order.id,
        status: ['PENDING', 'IN_TRANSIT', 'DELIVERED'][Math.floor(Math.random() * 3)],
        carrier: ['FedEx Freight', 'XPO Logistics', 'Old Dominion'][
          Math.floor(Math.random() * 3)
        ],
        trackingNumber: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        origin: 'Pittsburgh, PA',
        destination: customers[Math.floor(Math.random() * customers.length)].city,
        scheduledPickup: new Date(Date.now() + Math.random() * 5 * 24 * 60 * 60 * 1000),
        estimatedDelivery: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Created shipments');

  // Create some QC test results
  for (let i = 0; i < 10; i++) {
    const coil = coils[Math.floor(Math.random() * coils.length)];
    await prisma.testResult.create({
      data: {
        coilId: coil.id,
        heatId: coil.heatId,
        testType: ['TENSILE', 'HARDNESS', 'CHEMISTRY', 'DIMENSIONAL'][
          Math.floor(Math.random() * 4)
        ],
        result: Math.random() > 0.1 ? 'PASS' : 'FAIL',
        testedBy: operator.id,
        testedAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
        values: {
          yieldStrength: 35000 + Math.random() * 5000,
          tensileStrength: 58000 + Math.random() * 5000,
        },
      },
    });
  }

  console.log('Created test results');

  // Create some QC holds
  const holdCoils = coils.filter((c) => c.status === 'ON_HOLD');
  for (const coil of holdCoils.slice(0, 3)) {
    await prisma.qCHold.create({
      data: {
        coilId: coil.id,
        reason: [
          'Failed hardness test',
          'Dimensional variance',
          'Customer complaint',
          'Surface defect',
        ][Math.floor(Math.random() * 4)],
        status: 'ACTIVE',
        placedBy: operator.id,
        placedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Created QC holds');

  console.log('✅ Database seed completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - Users: 2`);
  console.log(`   - Mills: ${mills.length}`);
  console.log(`   - Grades: ${grades.length}`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Heats: ${heats.length}`);
  console.log(`   - Coils: ${coils.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Test Results: 10`);
  console.log(`\n🔑 Login credentials:`);
  console.log(`   Email: admin@steelwise.com`);
  console.log(`   Password: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
