/**
 * Shared Prisma Client Instance
 * Prevents connection pool exhaustion by using a singleton pattern
 */
import '../config/env.js';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const globalForPrisma = global;

// Only initialize Prisma if DATABASE_URL is configured
const isDatabaseConfigured = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';

export const prisma = isDatabaseConfigured
  ? (globalForPrisma.prisma || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    }))
  : null;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

if (!isDatabaseConfigured) {
  console.warn('⚠️  DATABASE_URL not configured - running with mock data only');
}

export default prisma;
