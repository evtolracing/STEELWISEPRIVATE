/**
 * Shared Prisma Client Instance
 * Prevents connection pool exhaustion by using a singleton pattern
 */
import '../config/env.js';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { requestContext, isBadFilterValue, isRecordNotFound, isRejectedShape, ruleRefusal } from './requestContext.js';
import { scopedArgs } from './branchScope.js';
import { roundedArgs } from './moneyColumns.js';

const globalForPrisma = global;

// Only initialize Prisma if DATABASE_URL is configured
const isDatabaseConfigured = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';

// Notes on the current request when a query is refused because of a value the
// caller sent (for example ?status=nonsense), so the reply can be a 400.
const withBadFilterNote = (client) => client.$extends({
  query: {
    async $allOperations({ model, operation, args, query }) {
      try {
        // The branch boundary: see lib/branchScope.js.
        const store = requestContext.getStore();
        if (model && store?.branchScope) args = scopedArgs(model, operation, args, store.branchScope);
        // Amounts are saved to the cent: see lib/moneyColumns.js.
        if (model) args = roundedArgs(model, operation, args);
        return await query(args);
      } catch (error) {
        const store = requestContext.getStore();
        if (store && error?.name === 'OutsideBranch') store.outsideBranch = true;
        if (store && isBadFilterValue(error)) store.badFilterValue = String(error.message || '');
        if (store && isRecordNotFound(error)) store.recordNotFound = true;
        if (store && isRejectedShape(error)) store.rejectedShape = String(error.message || '').slice(-400);
        if (store && ruleRefusal(error)) { store.ruleRefusal = ruleRefusal(error); store.ruleRefusalDetail = String(error.message || '').slice(-300); }
        throw error;
      }
    },
  },
});

export const prisma = isDatabaseConfigured
  ? (globalForPrisma.prisma || withBadFilterNote(new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })))
  : null;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

if (!isDatabaseConfigured) {
  console.warn('⚠️  DATABASE_URL not configured - running with mock data only');
}

export default prisma;
