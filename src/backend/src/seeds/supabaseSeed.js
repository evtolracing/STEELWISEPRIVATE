import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSupabaseData() {
  try {
    console.log('🌱 Seeding Supabase database...');

    // Check if data already exists
    const existingJobs = await prisma.job.count();
    if (existingJobs > 0) {
      console.log(`✅ Database already has ${existingJobs} jobs, skipping seed`);
      return;
    }

    // ═══════════════════════════════════════════════════════════
    //  ORGANIZATIONS
    // ═══════════════════════════════════════════════════════════
    const alroSteel = await prisma.organization.create({
      data: { code: 'ALRO', name: 'Alro Steel', type: 'SERVICE_CENTER', email: 'info@alrosteel.com', phone: '(517) 787-5500', city: 'Jackson', state: 'MI', isActive: true }
    });
    const nucor = await prisma.organization.create({
      data: { code: 'NUCOR', name: 'Nucor Steel', type: 'MILL', email: 'sales@nucor.com', phone: '(704) 366-7000', city: 'Charlotte', state: 'NC', isActive: true }
    });
    const usSteel = await prisma.organization.create({
      data: { code: 'USS', name: 'U.S. Steel', type: 'MILL', email: 'sales@ussteel.com', phone: '(412) 433-1121', city: 'Pittsburgh', state: 'PA', isActive: true }
    });
    const abcFab = await prisma.organization.create({
      data: { code: 'ABCFAB', name: 'ABC Fabrication', type: 'FABRICATOR', email: 'orders@abcfab.com', phone: '(313) 555-0100', city: 'Detroit', state: 'MI', isActive: true }
    });
    const metroMfg = await prisma.organization.create({
      data: { code: 'METRO', name: 'Metro Manufacturing', type: 'OEM', email: 'purchasing@metromfg.com', phone: '(616) 555-0200', city: 'Grand Rapids', state: 'MI', isActive: true }
    });
    // ── Customer Organizations ──
    const rostonInd = await prisma.organization.create({
      data: { code: 'ROSTON', name: 'Terry Roston - Roston Industries', type: 'OEM', email: 'terry@rostonindustries.com', phone: '(313) 555-8800', city: 'Detroit', state: 'MI', isActive: true }
    });
    const glMfg = await prisma.organization.create({
      data: { code: 'GLMFG', name: 'Great Lakes Manufacturing', type: 'FABRICATOR', email: 'purchasing@glmfg.com', phone: '(734) 555-1200', city: 'Ann Arbor', state: 'MI', isActive: true }
    });
    const precParts = await prisma.organization.create({
      data: { code: 'PREC-01', name: 'Precision Parts Co', type: 'OEM', email: 'ap@precisionparts.com', phone: '(517) 555-3300', city: 'Lansing', state: 'MI', isActive: true }
    });
    const steelSol = await prisma.organization.create({
      data: { code: 'STLSOL', name: 'Steel Solutions Inc', type: 'DISTRIBUTOR', email: 'orders@steelsol.com', phone: '(419) 555-4400', city: 'Toledo', state: 'OH', isActive: true }
    });
    const jmWeld = await prisma.organization.create({
      data: { code: 'JMWELD', name: 'JM Welding & Fabrication', type: 'FABRICATOR', email: 'info@jmwelding.com', phone: '(616) 555-5500', city: 'Grand Rapids', state: 'MI', isActive: true }
    });
    console.log('✅ Seeded 10 organizations (5 internal + 5 customers)');

    // ═══════════════════════════════════════════════════════════
    //  USERS
    // ═══════════════════════════════════════════════════════════
    const systemUser = await prisma.user.upsert({
      where: { email: 'system@alrosteel.com' },
      update: {},
      create: { email: 'system@alrosteel.com', passwordHash: '$2b$10$seedhashplaceholder000000000000000000000000000', firstName: 'System', lastName: 'Admin', role: 'SUPER_ADMIN', organizationId: alroSteel.id, isActive: true }
    });
    const csrUser = await prisma.user.upsert({
      where: { email: 'sarah.johnson@alrosteel.com' },
      update: {},
      create: { email: 'sarah.johnson@alrosteel.com', passwordHash: '$2b$10$seedhashplaceholder000000000000000000000000000', firstName: 'Sarah', lastName: 'Johnson', role: 'CSR', organizationId: alroSteel.id, isActive: true }
    });
    const opsManager = await prisma.user.upsert({
      where: { email: 'mike.davis@alrosteel.com' },
      update: {},
      create: { email: 'mike.davis@alrosteel.com', passwordHash: '$2b$10$seedhashplaceholder000000000000000000000000000', firstName: 'Mike', lastName: 'Davis', role: 'OPS_MANAGER', organizationId: alroSteel.id, isActive: true }
    });
    console.log('✅ Seeded 3 users');

    // ═══════════════════════════════════════════════════════════
    //  LOCATIONS
    // ═══════════════════════════════════════════════════════════
    const jackson = await prisma.location.create({
      data: { code: 'JAX-WH', name: 'Jackson Main Warehouse', type: 'WAREHOUSE', ownerId: alroSteel.id, addressLine1: '3100 E Michigan Ave', city: 'Jackson', state: 'MI', postalCode: '49202', hasCrane: true, isActive: true }
    });
    const detroitA = await prisma.location.create({
      data: { code: 'DET-A', name: 'Detroit Branch - Bay A', type: 'WAREHOUSE', ownerId: alroSteel.id, addressLine1: '14000 W 8 Mile Rd', city: 'Detroit', state: 'MI', postalCode: '48235', hasCrane: true, isActive: true }
    });
    const detroitB = await prisma.location.create({
      data: { code: 'DET-B', name: 'Detroit Branch - Bay B', type: 'WAREHOUSE', ownerId: alroSteel.id, addressLine1: '14000 W 8 Mile Rd', city: 'Detroit', state: 'MI', postalCode: '48235', hasCrane: false, isActive: true }
    });
    const grYard = await prisma.location.create({
      data: { code: 'GR-YARD', name: 'Grand Rapids Yard', type: 'YARD', ownerId: alroSteel.id, addressLine1: '4500 Division Ave S', city: 'Grand Rapids', state: 'MI', postalCode: '49548', isOutdoor: true, hasCrane: true, isActive: true }
    });
    console.log('✅ Seeded 4 locations');

    // ═══════════════════════════════════════════════════════════
    //  GRADES
    // ═══════════════════════════════════════════════════════════
    const gradeA36 = await prisma.grade.create({ data: { code: 'A36', name: 'ASTM A36 Structural', family: 'CARBON', specStandard: 'ASTM A36/A36M', isActive: true } });
    const gradeCQ = await prisma.grade.create({ data: { code: 'CQ', name: 'Commercial Quality', family: 'CARBON', specStandard: 'ASTM A1008 CQ', isActive: true } });
    const grade1018 = await prisma.grade.create({ data: { code: '1018', name: 'AISI 1018 Cold Rolled', family: 'CARBON', specStandard: 'ASTM A108', isActive: true } });
    const gradeA572 = await prisma.grade.create({ data: { code: 'A572-50', name: 'ASTM A572 Grade 50 HSLA', family: 'HSLA', specStandard: 'ASTM A572/A572M', isActive: true } });
    const grade304 = await prisma.grade.create({ data: { code: '304', name: 'Type 304 Stainless', family: 'STAINLESS', specStandard: 'ASTM A240', isActive: true } });
    const grade4140 = await prisma.grade.create({ data: { code: '4140', name: 'AISI 4140 Alloy', family: 'ALLOY', specStandard: 'ASTM A829', isActive: true } });
    const gradeA500 = await prisma.grade.create({ data: { code: 'A500B', name: 'ASTM A500 Grade B', family: 'CARBON', specStandard: 'ASTM A500/A500M', isActive: true } });
    const gradeW1 = await prisma.grade.create({ data: { code: 'W1', name: 'W1 Tool Steel', family: 'TOOL', specStandard: 'ASTM A686', isActive: true } });
    console.log('✅ Seeded 8 grades');

    // ═══════════════════════════════════════════════════════════
    //  HEATS
    // ═══════════════════════════════════════════════════════════
    const heat1 = await prisma.heat.create({ data: { heatNumber: 'HT-2024-001', millId: nucor.id, gradeId: gradeA36.id, castDate: new Date('2024-01-15'), totalWeightLb: 100000, meltType: 'EAF', status: 'ACTIVE', createdById: systemUser.id } });
    const heat2 = await prisma.heat.create({ data: { heatNumber: 'HT-2024-002', millId: nucor.id, gradeId: gradeCQ.id, castDate: new Date('2024-02-10'), totalWeightLb: 80000, meltType: 'EAF', status: 'ACTIVE', createdById: systemUser.id } });
    const heat3 = await prisma.heat.create({ data: { heatNumber: 'HT-2024-003', millId: usSteel.id, gradeId: gradeA572.id, castDate: new Date('2024-03-05'), totalWeightLb: 120000, meltType: 'BOF', status: 'ACTIVE', createdById: systemUser.id } });
    const heat4 = await prisma.heat.create({ data: { heatNumber: 'HT-2024-004', millId: usSteel.id, gradeId: grade304.id, castDate: new Date('2024-04-12'), totalWeightLb: 50000, meltType: 'AOD', status: 'ACTIVE', createdById: systemUser.id } });
    const heat5 = await prisma.heat.create({ data: { heatNumber: 'HT-2024-005', millId: nucor.id, gradeId: grade1018.id, castDate: new Date('2024-05-20'), totalWeightLb: 60000, meltType: 'EAF', status: 'ACTIVE', createdById: systemUser.id } });
    const heat6 = await prisma.heat.create({ data: { heatNumber: 'HT-2024-006', millId: usSteel.id, gradeId: grade4140.id, castDate: new Date('2024-06-01'), totalWeightLb: 40000, meltType: 'EAF', status: 'ACTIVE', createdById: systemUser.id } });
    const heat7 = await prisma.heat.create({ data: { heatNumber: 'HT-2024-007', millId: nucor.id, gradeId: gradeA500.id, castDate: new Date('2024-07-14'), totalWeightLb: 75000, meltType: 'EAF', status: 'ACTIVE', createdById: systemUser.id } });
    const heat8 = await prisma.heat.create({ data: { heatNumber: 'HT-2024-008', millId: nucor.id, gradeId: gradeA36.id, castDate: new Date('2024-08-03'), totalWeightLb: 95000, meltType: 'EAF', status: 'ACTIVE', createdById: systemUser.id } });
    console.log('✅ Seeded 8 heats');

    // ═══════════════════════════════════════════════════════════
    //  COILS / INVENTORY — All ProductForm types
    // ═══════════════════════════════════════════════════════════
    const coilData = [
      // ── COILS (master coils) ──
      { coilNumber: 'U-2024-0001', heatId: heat1.id, gradeId: gradeA36.id, form: 'COIL', thicknessIn: 0.075, widthIn: 48, odIn: 72, idIn: 20, gauge: 14, grossWeightLb: 12500, netWeightLb: 12450, finish: 'Hot Rolled Pickled & Oiled', edgeCondition: 'MILL', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: jackson.id, unitCost: 0.38, landedCost: 0.41 },
      { coilNumber: 'U-2024-0002', heatId: heat2.id, gradeId: gradeCQ.id, form: 'COIL', thicknessIn: 0.060, widthIn: 60, odIn: 72, idIn: 24, gauge: 16, grossWeightLb: 18000, netWeightLb: 17950, finish: 'Cold Rolled', edgeCondition: 'MILL', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: detroitA.id, unitCost: 0.42, landedCost: 0.45 },
      { coilNumber: 'U-2024-0003', heatId: heat8.id, gradeId: gradeA36.id, form: 'COIL', thicknessIn: 0.125, widthIn: 48, odIn: 60, idIn: 20, gauge: 11, grossWeightLb: 22000, netWeightLb: 21950, finish: 'Hot Rolled', edgeCondition: 'MILL', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: jackson.id, unitCost: 0.35, landedCost: 0.38 },
      { coilNumber: 'U-2024-0004', heatId: heat2.id, gradeId: gradeCQ.id, form: 'COIL', thicknessIn: 0.036, widthIn: 48, odIn: 60, idIn: 20, gauge: 20, grossWeightLb: 9500, netWeightLb: 9480, finish: 'Cold Rolled', edgeCondition: 'MILL', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: detroitB.id, unitCost: 0.44, landedCost: 0.47 },
      { coilNumber: 'U-2024-0005', heatId: heat3.id, gradeId: gradeA572.id, form: 'COIL', thicknessIn: 0.187, widthIn: 72, odIn: 72, idIn: 24, gauge: 7, grossWeightLb: 42000, netWeightLb: 41900, finish: 'Hot Rolled Pickled & Oiled', edgeCondition: 'MILL', status: 'ALLOCATED', qcStatus: 'PASSED', locationId: jackson.id, binLocation: 'R3-A', unitCost: 0.46, landedCost: 0.50 },
      // ── SHEETS (cut from coil or plate) ──
      { coilNumber: 'SH-2024-0001', heatId: heat1.id, gradeId: gradeA36.id, form: 'SHEET', thicknessIn: 0.075, widthIn: 48, lengthIn: 120, grossWeightLb: 1224, netWeightLb: 1224, finish: 'Hot Rolled Pickled & Oiled', edgeCondition: 'SLIT', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: jackson.id, binLocation: 'SH-01', unitCost: 0.42, landedCost: 0.45 },
      { coilNumber: 'SH-2024-0002', heatId: heat4.id, gradeId: grade304.id, form: 'SHEET', thicknessIn: 0.048, widthIn: 48, lengthIn: 120, grossWeightLb: 784, netWeightLb: 784, finish: '2B Mill', edgeCondition: 'TRIMMED', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: detroitA.id, binLocation: 'SS-03', unitCost: 1.85, landedCost: 1.92 },
      { coilNumber: 'SH-2024-0003', heatId: heat4.id, gradeId: grade304.id, form: 'SHEET', thicknessIn: 0.060, widthIn: 48, lengthIn: 96, grossWeightLb: 752, netWeightLb: 752, finish: '#4 Brushed', edgeCondition: 'TRIMMED', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: detroitA.id, binLocation: 'SS-04', unitCost: 2.10, landedCost: 2.18 },
      { coilNumber: 'SH-2024-0004', heatId: heat2.id, gradeId: gradeCQ.id, form: 'SHEET', thicknessIn: 0.036, widthIn: 48, lengthIn: 120, grossWeightLb: 588, netWeightLb: 588, finish: 'Cold Rolled', edgeCondition: 'MILL', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: jackson.id, binLocation: 'SH-05', unitCost: 0.48, landedCost: 0.51 },
      // ── PLATES ──
      { coilNumber: 'PL-2024-0001', heatId: heat1.id, gradeId: gradeA36.id, form: 'PLATE', thicknessIn: 0.250, widthIn: 48, lengthIn: 120, grossWeightLb: 4082, netWeightLb: 4082, finish: 'Hot Rolled', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: jackson.id, binLocation: 'PL-A1', unitCost: 0.38, landedCost: 0.41 },
      { coilNumber: 'PL-2024-0002', heatId: heat1.id, gradeId: gradeA36.id, form: 'PLATE', thicknessIn: 0.500, widthIn: 96, lengthIn: 240, grossWeightLb: 32640, netWeightLb: 32640, finish: 'Hot Rolled', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: grYard.id, binLocation: 'YD-01', unitCost: 0.36, landedCost: 0.39 },
      { coilNumber: 'PL-2024-0003', heatId: heat3.id, gradeId: gradeA572.id, form: 'PLATE', thicknessIn: 0.375, widthIn: 96, lengthIn: 240, grossWeightLb: 24480, netWeightLb: 24480, finish: 'Hot Rolled', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: grYard.id, binLocation: 'YD-02', unitCost: 0.46, landedCost: 0.50 },
      { coilNumber: 'PL-2024-0004', heatId: heat3.id, gradeId: gradeA572.id, form: 'PLATE', thicknessIn: 1.000, widthIn: 96, lengthIn: 240, grossWeightLb: 65280, netWeightLb: 65280, finish: 'Hot Rolled', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: grYard.id, binLocation: 'YD-03', unitCost: 0.48, landedCost: 0.52 },
      { coilNumber: 'PL-2024-0005', heatId: heat4.id, gradeId: grade304.id, form: 'PLATE', thicknessIn: 0.250, widthIn: 48, lengthIn: 96, grossWeightLb: 3264, netWeightLb: 3264, finish: 'Hot Rolled Annealed Pickled', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: detroitA.id, binLocation: 'SS-P1', unitCost: 2.40, landedCost: 2.50 },
      // ── BARS ──
      { coilNumber: 'BR-2024-0001', heatId: heat5.id, gradeId: grade1018.id, form: 'BAR', thicknessIn: 1.000, widthIn: 1.000, lengthIn: 144, grossWeightLb: 48.9, netWeightLb: 48.9, finish: 'Cold Drawn', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: jackson.id, binLocation: 'BR-01', unitCost: 0.65, landedCost: 0.70 },
      { coilNumber: 'BR-2024-0002', heatId: heat5.id, gradeId: grade1018.id, form: 'BAR', thicknessIn: 2.000, widthIn: 2.000, lengthIn: 240, grossWeightLb: 272.2, netWeightLb: 272.2, finish: 'Cold Drawn', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: jackson.id, binLocation: 'BR-02', unitCost: 0.62, landedCost: 0.67 },
      { coilNumber: 'BR-2024-0003', heatId: heat6.id, gradeId: grade4140.id, form: 'BAR', thicknessIn: 3.000, widthIn: 3.000, lengthIn: 240, grossWeightLb: 612.5, netWeightLb: 612.5, finish: 'Annealed', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: detroitB.id, binLocation: 'AL-01', unitCost: 1.10, landedCost: 1.18 },
      { coilNumber: 'BR-2024-0004', heatId: heat6.id, gradeId: grade4140.id, form: 'BAR', thicknessIn: 1.500, widthIn: 1.500, lengthIn: 144, grossWeightLb: 91.9, netWeightLb: 91.9, finish: 'Quenched & Tempered', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: detroitB.id, binLocation: 'AL-02', unitCost: 1.25, landedCost: 1.32 },
      // ── TUBES (structural / mechanical) ──
      { coilNumber: 'TB-2024-0001', heatId: heat7.id, gradeId: gradeA500.id, form: 'TUBE', thicknessIn: 0.188, widthIn: 4.000, lengthIn: 240, grossWeightLb: 242.4, netWeightLb: 242.4, finish: 'Black', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: jackson.id, binLocation: 'TU-01', unitCost: 0.55, landedCost: 0.60 },
      { coilNumber: 'TB-2024-0002', heatId: heat7.id, gradeId: gradeA500.id, form: 'TUBE', thicknessIn: 0.250, widthIn: 6.000, lengthIn: 240, grossWeightLb: 484.8, netWeightLb: 484.8, finish: 'Black', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: grYard.id, binLocation: 'TU-02', unitCost: 0.52, landedCost: 0.57 },
      { coilNumber: 'TB-2024-0003', heatId: heat7.id, gradeId: gradeA500.id, form: 'TUBE', thicknessIn: 0.125, widthIn: 2.000, lengthIn: 240, grossWeightLb: 63.2, netWeightLb: 63.2, finish: 'Black', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: jackson.id, binLocation: 'TU-03', unitCost: 0.58, landedCost: 0.63 },
      // ── BEAMS (structural W-shapes) ──
      { coilNumber: 'BM-2024-0001', heatId: heat8.id, gradeId: gradeA36.id, form: 'BEAM', thicknessIn: 0.300, widthIn: 8.000, lengthIn: 480, grossWeightLb: 2400, netWeightLb: 2400, finish: 'Hot Rolled', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: grYard.id, binLocation: 'BM-01', unitCost: 0.40, landedCost: 0.44 },
      { coilNumber: 'BM-2024-0002', heatId: heat8.id, gradeId: gradeA36.id, form: 'BEAM', thicknessIn: 0.455, widthIn: 10.000, lengthIn: 480, grossWeightLb: 4800, netWeightLb: 4800, finish: 'Hot Rolled', status: 'AVAILABLE', qcStatus: 'PASSED', locationId: grYard.id, binLocation: 'BM-02', unitCost: 0.39, landedCost: 0.43 },
      // ── HOLD / QC items ──
      { coilNumber: 'U-2024-0006', heatId: heat2.id, gradeId: gradeCQ.id, form: 'COIL', thicknessIn: 0.048, widthIn: 36, odIn: 60, idIn: 20, gauge: 18, grossWeightLb: 7200, netWeightLb: 7180, finish: 'Cold Rolled', status: 'HOLD', qcStatus: 'HOLD', holdCode: 'SURFACE_DEFECT', locationId: jackson.id, unitCost: 0.44, landedCost: 0.47 },
      { coilNumber: 'SH-2024-0005', heatId: heat4.id, gradeId: grade304.id, form: 'SHEET', thicknessIn: 0.036, widthIn: 36, lengthIn: 96, grossWeightLb: 373, netWeightLb: 373, finish: '2B Mill', status: 'AVAILABLE', qcStatus: 'PENDING', locationId: detroitA.id, unitCost: 1.85, landedCost: 1.92 },
    ];

    for (const c of coilData) {
      await prisma.coil.create({
        data: { ...c, ownerId: alroSteel.id, createdById: systemUser.id }
      });
    }
    console.log(`✅ Seeded ${coilData.length} inventory items (coils, sheets, plates, bars, tubes, beams)`);

    // ═══════════════════════════════════════════════════════════
    //  JOBS
    // ═══════════════════════════════════════════════════════════
    const jobs = [
      { jobNumber: 'JOB-000001', operationType: 'SLITTING', instructions: 'Slit 48" HR A36 coil into (4) 12" strips', priority: 5, status: 'SCHEDULED', scheduledStart: new Date('2026-02-10T08:00:00Z'), scheduledEnd: new Date('2026-02-10T12:00:00Z') },
      { jobNumber: 'JOB-000002', operationType: 'CUTTING', instructions: 'Plasma cut A36 plate 0.50" to customer DXF profiles', priority: 3, status: 'SCHEDULED', scheduledStart: new Date('2026-02-10T13:00:00Z'), scheduledEnd: new Date('2026-02-10T16:00:00Z') },
      { jobNumber: 'JOB-000003', operationType: 'GRINDING', instructions: 'Grind and deburr edges on SS 304 sheets', priority: 4, status: 'IN_PROCESS', scheduledStart: new Date('2026-02-09T08:00:00Z'), scheduledEnd: new Date('2026-02-09T17:00:00Z'), actualStart: new Date('2026-02-09T08:15:00Z') },
      { jobNumber: 'JOB-000004', operationType: 'SHEARING', instructions: 'Shear 60" CQ coil to 48" x 120" blanks (qty 25)', priority: 5, status: 'SCHEDULED', scheduledStart: new Date('2026-02-11T07:00:00Z'), scheduledEnd: new Date('2026-02-11T11:00:00Z') },
      { jobNumber: 'JOB-000005', operationType: 'LEVELING', instructions: 'Level and flatten A572-50 plate 0.375" x 96" x 240"', priority: 3, status: 'ORDERED', scheduledStart: new Date('2026-02-12T08:00:00Z'), scheduledEnd: new Date('2026-02-12T15:00:00Z') },
    ];
    for (const j of jobs) {
      await prisma.job.create({ data: j });
    }
    console.log(`✅ Seeded ${jobs.length} jobs`);

    // ═══════════════════════════════════════════════════════════
    //  SUMMARY
    // ═══════════════════════════════════════════════════════════
    console.log('✅ Supabase seed complete - Summary:');
    console.log('  - Organizations: 10 (5 internal + 5 customers incl. Terry Roston)');
    console.log('  - Users: 3 (System Admin, CSR, Ops Manager)');
    console.log('  - Locations: 4 (Jackson, Detroit A/B, Grand Rapids Yard)');
    console.log('  - Grades: 8 (A36, CQ, 1018, A572-50, 304 SS, 4140, A500B, W1)');
    console.log('  - Heats: 8');
    console.log(`  - Inventory: ${coilData.length} items across COIL/SHEET/PLATE/BAR/TUBE/BEAM`);
    console.log(`  - Jobs: ${jobs.length}`);
    
    return { organizations: 5, users: 3, locations: 4, grades: 8, heats: 8, coils: coilData.length, jobs: jobs.length };
  } catch (error) {
    console.error('❌ Error seeding Supabase data:', error);
    throw error;
  }
}

export async function clearSupabaseData() {
  try {
    console.log('🗑️  Clearing Supabase database...');
    
    // Use raw SQL TRUNCATE CASCADE to handle all FK constraints at once
    // Get all table names from the public schema
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations'
    `;
    
    if (tables.length > 0) {
      const tableNames = tables.map(t => `"public"."${t.tablename}"`).join(', ');
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE`);
    }
    
    console.log(`✅ All ${tables.length} database tables cleared`);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}
