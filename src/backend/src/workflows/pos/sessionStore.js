/**
 * POS session store, kept in the PosSession table.
 *
 * Machines are cached in memory by version. A read checks the row's version
 * and reuses the cached machine when it matches, so a call that changes the
 * machine and then calls another service method (selectCustomer, then
 * transition) keeps working on the same object. When another server saved a
 * newer version, the machine is rebuilt from the database.
 */
import prisma from '../../lib/db.js';
import POSWorkflowStateMachine from './POSWorkflowStateMachine.js';

const cache = new Map(); // sessionId -> { version, machine }

function db() {
  if (!prisma) throw new Error('Database is not configured');
  return prisma;
}

function snapshot(machine) {
  return JSON.parse(JSON.stringify(machine.toJSON()));
}

export async function getMachine(sessionId) {
  if (!sessionId) return null;
  const row = await db().posSession.findUnique({
    where: { id: sessionId },
    select: { version: true, status: true },
  });
  if (!row || row.status !== 'ACTIVE') {
    cache.delete(sessionId);
    return null;
  }

  const cached = cache.get(sessionId);
  if (cached && cached.version === row.version) return cached.machine;

  const full = await db().posSession.findUnique({ where: { id: sessionId } });
  const machine = POSWorkflowStateMachine.fromJSON({ ...full.data, sessionId });
  cache.set(sessionId, { version: full.version, machine });
  return machine;
}

export async function createMachine(machine, { userId = null, terminalId = null } = {}) {
  const row = await db().posSession.create({
    data: {
      id: machine.sessionId,
      userId,
      terminalId,
      currentState: machine.currentState,
      data: snapshot(machine),
    },
  });
  cache.set(machine.sessionId, { version: row.version, machine });
}

// Writes the cached machine back if this server has it loaded.
export async function saveMachine(sessionId) {
  const cached = cache.get(sessionId);
  if (!cached) return;
  const { machine } = cached;
  const result = await db().posSession.updateMany({
    where: { id: sessionId, status: 'ACTIVE' },
    data: {
      currentState: machine.currentState,
      data: snapshot(machine),
      version: { increment: 1 },
    },
  });
  if (result.count) cached.version += 1;
  else cache.delete(sessionId);
}

export async function endMachine(sessionId) {
  cache.delete(sessionId);
  const result = await db().posSession.updateMany({
    where: { id: sessionId, status: 'ACTIVE' },
    data: { status: 'ENDED' },
  });
  return result.count > 0;
}

export async function listActiveMachines(limit = 200) {
  const rows = await db().posSession.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
  return rows.map(row => POSWorkflowStateMachine.fromJSON({ ...row.data, sessionId: row.id }));
}
