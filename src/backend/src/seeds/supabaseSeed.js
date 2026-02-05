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

    // Create sample jobs
    const job1 = await prisma.job.create({
      data: {
        jobNumber: 'JOB-000001',
        operationType: 'SLITTING',
        instructions: 'Slit 48" x 0.125" CR coil into 12" strips',
        priority: 5,
        status: 'SCHEDULED',
        scheduledStart: new Date('2026-02-05T08:00:00Z'),
        scheduledEnd: new Date('2026-02-05T12:00:00Z'),
      },
    });

    const job2 = await prisma.job.create({
      data: {
        jobNumber: 'JOB-000002',
        operationType: 'CUTTING',
        instructions: 'Cut 1" x 12" HR plate to 24" lengths',
        priority: 3,
        status: 'SCHEDULED',
        scheduledStart: new Date('2026-02-05T13:00:00Z'),
        scheduledEnd: new Date('2026-02-05T16:00:00Z'),
      },
    });

    const job3 = await prisma.job.create({
      data: {
        jobNumber: 'JOB-000003',
        operationType: 'PROCESSING',
        instructions: 'Grind and deburr edges on SS sheet',
        priority: 4,
        status: 'IN_PROCESS',
        scheduledStart: new Date('2026-02-04T08:00:00Z'),
        scheduledEnd: new Date('2026-02-04T17:00:00Z'),
        actualStart: new Date('2026-02-04T08:15:00Z'),
      },
    });

    console.log(`✅ Seeded ${3} jobs to Supabase database`);
    return { jobs: 3 };
  } catch (error) {
    console.error('❌ Error seeding Supabase data:', error);
    throw error;
  }
}

export async function clearSupabaseData() {
  try {
    console.log('🗑️  Clearing Supabase database...');
    await prisma.job.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}
