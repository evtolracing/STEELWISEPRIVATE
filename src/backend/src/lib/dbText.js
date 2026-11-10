/**
 * Database-portable text matching helpers.
 *
 * Postgres compares text case-sensitively, so Prisma needs the
 * "insensitive" mode there. MySQL's default collation is already
 * case-insensitive and Prisma rejects that mode option on MySQL. Spread
 * `ci` into a string filter to get case-insensitive matching on either:
 *
 *   where: { name: { contains: search, ...ci } }
 */
import '../config/env.js';

const url = process.env.DATABASE_URL || '';
const provider = (process.env.DATABASE_PROVIDER || (url.startsWith('mysql') ? 'mysql' : 'postgresql')).toLowerCase();

export const isMySQL = provider === 'mysql';

export const ci = Object.freeze(isMySQL ? {} : { mode: 'insensitive' });
