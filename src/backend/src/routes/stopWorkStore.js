/**
 * Stop-Work store. Each record is saved whole in `data`, with the fields the
 * routes filter on copied into columns. Every function is async and returns
 * plain objects in the shape the stop-work API has always used.
 */
import prisma from '../lib/db.js';

function db() {
  if (!prisma) throw new Error('Database is not configured');
  return prisma;
}

const plain = obj => JSON.parse(JSON.stringify(obj));
const when = value => (value ? new Date(value) : new Date());

function collection(model, columns) {
  const table = () => db()[model];
  return {
    async get(id) {
      const row = await table().findUnique({ where: { id } });
      return row ? row.data : null;
    },
    async set(id, obj) {
      const data = plain(obj);
      const cols = columns(obj);
      await table().upsert({
        where: { id },
        create: { id, ...cols, data },
        update: { ...cols, data },
      });
    },
    async all(where = {}, orderBy = undefined) {
      const rows = await table().findMany({ where, orderBy, take: 5000 });
      return rows.map(r => r.data);
    },
    async forEvent(eventId) {
      return this.all({ eventId });
    },
  };
}

export const stopWorkEvents = collection('stopWorkEvent', e => ({
  eventNumber: e.eventNumber,
  status: e.status,
  scopeType: e.scopeType,
  scopeId: String(e.scopeId),
  severity: e.severity,
  initiatedAt: when(e.initiatedAt),
}));

export const auditEntries = collection('stopWorkAudit', a => ({
  eventId: a.stopWorkEventId,
  performedAt: when(a.performedAt),
}));

export const clearanceSteps = collection('stopWorkStep', s => ({
  eventId: s.stopWorkEventId,
  stepNumber: Number(s.stepNumber) || 0,
  status: s.status || 'PENDING',
}));

export const evidence = collection('stopWorkEvidence', e => ({
  eventId: e.stopWorkEventId,
}));

// Next number in SWA-YYYY-NNNN for this year.
export async function nextEventNumber() {
  const prefix = `SWA-${new Date().getFullYear()}-`;
  const last = await db().stopWorkEvent.findFirst({
    where: { eventNumber: { startsWith: prefix } },
    orderBy: { eventNumber: 'desc' },
    select: { eventNumber: true },
  });
  const n = last ? parseInt(last.eventNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(4, '0')}`;
}
