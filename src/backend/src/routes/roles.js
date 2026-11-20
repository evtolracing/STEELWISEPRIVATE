/**
 * Roles and what each may do (role matrix, phase 2). Mounted at /api/users/roles.
 *
 * Reading is open to any signed-in staff login (the user form lists roles). Every change needs a
 * system administrator, and lib/roleEditRules.js then decides what that person may change. Every
 * change is written to the audit log with the role before and after.
 *
 * Since phase 3 what is saved here decides access: lib/roleStore.js reads it, at once on this server
 * copy and within a minute on the others. A custom role decides for the people it is given
 * to on the user screen (phase 4, routes/userAccess.js).
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ACTION_LABELS, AREAS } from '../lib/permissionCatalog.js';
import { BUILTIN_DEFAULTS } from '../lib/builtinRoleDefaults.js';
import { forgetRoles, matrixOff } from '../lib/roleStore.js';
import { editorsAfter } from '../lib/accessFacts.js';
import { baseOf } from '../lib/userAccess.js';
import { cleanGrants, grantsDiff, isLocked, roleChangeDenial, roleDeleteDenial, roleName, SENSITIVE } from '../lib/roleEditRules.js';

const router = Router();

const UPDATE_19 = { error: 'Database update 19 (role permission matrix) has to be applied first.', code: 'DATABASE_UPDATE_REQUIRED' };
/** true when the database does not have the columns or the table of update 19 yet. */
export const update19Missing = (error) => (error?.code === 'P2022' || error?.code === 'P2021') && /grants|audience|branchScope|baseRole|updatedById|UserPermissionOverride/.test(`${error?.meta?.column || ''} ${error?.meta?.table || ''} ${error?.message || ''}`);
const OLD_COLUMNS = { id: true, name: true, displayName: true, description: true, isSystem: true, isActive: true };

const fail = (res, label, error, req) => {
  if (update19Missing(error)) return res.status(503).json(UPDATE_19);
  if (error?.code === 'P2002') return res.status(409).json({ error: 'There is already a role with that name.' });
  console.error(JSON.stringify({ level: 'error', msg: 'roles_failed', label, id: req.id }), error);
  return res.status(500).json({ error: `Could not ${label}`, requestId: req.id });
};

const isBuiltin = (role) => Boolean(role.isSystem) && Object.hasOwn(BUILTIN_DEFAULTS, role.name);

/** How many logins of this company hold each role: by their login's role, plus roles given on top. */
async function holderCounts(organizationId) {
  const [primary, extra, main] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], where: { organizationId }, _count: { _all: true } }),
    prisma.userRoleAssignment.groupBy({ by: ['roleId'], where: { user: { organizationId } }, _count: { _all: true } }),
    // People with a custom role as their main role (none until database update 20 is applied).
    prisma.userPrimaryRole.groupBy({ by: ['roleId'], where: { user: { organizationId } }, _count: { _all: true } }).catch(() => []),
  ]);
  const byName = Object.fromEntries(primary.map((r) => [r.role, r._count._all]));
  const byId = Object.fromEntries(extra.map((r) => [r.roleId, r._count._all]));
  for (const r of main) byId[r.roleId] = (byId[r.roleId] || 0) + r._count._all;
  return (role) => (isBuiltin(role) ? byName[role.name] || 0 : 0) + (byId[role.id] || 0);
}

const shown = (role, holders) => ({
  id: role.id, name: role.name, displayName: role.displayName, description: role.description,
  grants: role.grants, audience: role.audience, branchScope: role.branchScope,
  builtIn: isBuiltin(role), locked: isLocked(role), isSystem: role.isSystem, isActive: role.isActive,
  holders, updatedAt: role.updatedAt, baseRole: role.isSystem ? role.name : baseOf(role),
});

/** What the signed-in login holds now: its roles and personal exceptions together (lib/userAccess.js). */
async function actorOf(req) {
  return { id: req.user.id, role: req.user.role, mainRoleId: req.realAccess?.primary?.id || null, grants: [...req.access.grants] };
}

const audit = (tx, req, eventType, role, before, after) => {
  const { added, removed } = grantsDiff(before?.grants || [], after?.grants || []);
  return tx.auditLog.create({ data: {
    tenantId: req.user.organizationId, category: 'AUTHZ', eventType, userId: req.user.id, resourceType: 'Role', resourceId: role.id,
    severity: [...added, ...removed].some((p) => SENSITIVE.has(p)) ? 'WARNING' : 'INFO', action: `role.${eventType.replace('ROLE_', '').toLowerCase()}`,
    details: { name: role.name, added, removed },
    fieldChanges: { before, after },
  } });
};
const snapshot = (role) => (role ? { displayName: role.displayName, description: role.description ?? null, grants: role.grants, branchScope: role.branchScope, isActive: role.isActive } : null);

// The grid: every area, its boxes and its single rights.
router.get('/catalog', authenticate, (req, res) => {
  // enforced: whether what is saved here decides access now (false only while ROLE_MATRIX=off).
  res.json({ actions: ACTION_LABELS, areas: AREAS, enforced: !matrixOff() });
});

// The roles. ?all=1 includes roles that are switched off.
router.get('/list', authenticate, async (req, res) => {
  const where = req.query.all ? {} : { isActive: true };
  try {
    const [roles, count] = await Promise.all([prisma.role.findMany({ where, orderBy: { name: 'asc' } }), holderCounts(req.user.organizationId)]);
    res.json(roles.map((r) => shown(r, count(r))));
  } catch (error) {
    if (!update19Missing(error)) return fail(res, 'list the roles', error, req);
    // The user form still gets its list of roles while update 19 is waiting.
    try { res.json(await prisma.role.findMany({ where, orderBy: { name: 'asc' }, select: OLD_COLUMNS })); } catch (e) { fail(res, 'list the roles', e, req); }
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const role = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    const builtIn = isBuiltin(role);
    const [count, primary, extra, actor, main] = await Promise.all([
      holderCounts(req.user.organizationId),
      builtIn ? prisma.user.findMany({ where: { organizationId: req.user.organizationId, role: role.name }, select: { id: true, firstName: true, lastName: true, email: true, isActive: true }, orderBy: { lastName: 'asc' }, take: 200 }) : [],
      prisma.userRoleAssignment.findMany({ where: { roleId: role.id, user: { organizationId: req.user.organizationId } }, select: { user: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true } } }, take: 200 }),
      actorOf(req),
      prisma.userPrimaryRole.findMany({ where: { roleId: role.id, user: { organizationId: req.user.organizationId } }, select: { user: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true } } }, take: 200 }).catch(() => []),
    ]);
    res.json({
      ...shown(role, count(role)),
      users: [...new Map([...primary, ...main.map((x) => x.user), ...extra.map((x) => x.user)].map((u) => [u.id, u])).values()],
      defaults: builtIn ? BUILTIN_DEFAULTS[role.name] : null,
      // What the person looking may tick: their own permissions.
      myGrants: actor.grants,
    });
  } catch (error) { fail(res, 'read the role', error, req); }
});

// Who changed the role, when, and what it was before and after. Newest first.
router.get('/:id/history', authenticate, requireRole(), async (req, res) => {
  try {
    const rows = await prisma.auditLog.findMany({
      where: { resourceType: 'Role', resourceId: req.params.id, category: 'AUTHZ' }, orderBy: { timestamp: 'desc' }, take: 100,
      select: { id: true, eventType: true, timestamp: true, details: true, fieldChanges: true, user: { select: { firstName: true, lastName: true, email: true } } },
    });
    res.json(rows.map((r) => ({ id: r.id, event: r.eventType, at: r.timestamp, by: r.user ? `${r.user.firstName} ${r.user.lastName}`.trim() || r.user.email : 'Unknown', added: r.details?.added || [], removed: r.details?.removed || [], before: r.fieldChanges?.before || null, after: r.fieldChanges?.after || null })));
  } catch (error) { fail(res, 'read the role history', error, req); }
});

router.post('/', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER'), async (req, res) => {
  try {
    const { displayName, description, grants = [], branchScope = 'ASSIGNED' } = req.body || {};
    // The built-in role the new one stands on: the role it was copied from, or the plainest one.
    const baseRole = Object.hasOwn(BUILTIN_DEFAULTS, req.body?.baseRole) && BUILTIN_DEFAULTS[req.body.baseRole].audience === 'STAFF' && !isLocked({ isSystem: true, name: req.body.baseRole }) ? req.body.baseRole : baseOf(null);
    const name = roleName(req.body?.name || displayName);
    const [actor, existing] = await Promise.all([actorOf(req), prisma.role.findMany({ select: { name: true } })]);
    const change = { name, displayName, grants, branchScope };
    const denial = roleChangeDenial(actor, null, change, { takenNames: [...Object.keys(BUILTIN_DEFAULTS), ...existing.map((r) => r.name)] });
    if (denial) return res.status(400).json({ error: denial });
    const role = await prisma.$transaction(async (tx) => {
      const made = await tx.role.create({ data: { name, displayName: String(displayName).trim(), description: description ? String(description).slice(0, 300) : null, permissions: [], grants: cleanGrants(grants), audience: 'STAFF', branchScope, baseRole, isSystem: false, updatedById: req.user.id } });
      await audit(tx, req, 'ROLE_CREATED', made, null, snapshot(made));
      return made;
    });
    forgetRoles();
    res.status(201).json(shown(role, 0));
  } catch (error) { fail(res, 'create the role', error, req); }
});

async function change(req, res, eventType, build) {
  const role = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!role) return res.status(404).json({ error: 'Role not found' });
  const sent = build(role);
  if (sent.error) return res.status(400).json({ error: sent.error });
  const [actor, count] = await Promise.all([actorOf(req), holderCounts(req.user.organizationId)]);
  const facts = { holders: count(role) };
  if (sent.grants !== undefined && role.grants.includes('roles:edit') && !sent.grants.includes('roles:edit')) facts.editorsAfter = await editorsAfter(req.user.organizationId, { role: { id: role.id, grants: cleanGrants(sent.grants) } });
  const denial = roleChangeDenial(actor, role, sent, facts);
  if (denial) return res.status(400).json({ error: denial });
  const data = {
    ...(sent.displayName !== undefined && { displayName: String(sent.displayName).trim() }),
    ...(sent.description !== undefined && { description: sent.description ? String(sent.description).slice(0, 300) : null }),
    ...(sent.grants !== undefined && { grants: cleanGrants(sent.grants) }),
    ...(sent.branchScope !== undefined && { branchScope: sent.branchScope }),
    ...(sent.isActive !== undefined && { isActive: Boolean(sent.isActive) }),
    updatedById: req.user.id,
  };
  const saved = await prisma.$transaction(async (tx) => {
    const next = await tx.role.update({ where: { id: role.id }, data });
    await audit(tx, req, eventType, next, snapshot(role), snapshot(next));
    return next;
  });
  forgetRoles();
  return res.json(shown(saved, facts.holders));
}

router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER'), async (req, res) => {
  try {
    const { displayName, description, grants, branchScope, isActive } = req.body || {};
    await change(req, res, 'ROLE_UPDATED', () => ({ displayName, description, grants, branchScope, isActive }));
  } catch (error) { fail(res, 'save the role', error, req); }
});

// A built-in role back to what today's rules give it.
router.post('/:id/reset', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER'), async (req, res) => {
  try {
    await change(req, res, 'ROLE_RESET', (role) => (isBuiltin(role) ? { grants: BUILTIN_DEFAULTS[role.name].grants, branchScope: BUILTIN_DEFAULTS[role.name].branchScope } : { error: 'Only a built-in role has a default to go back to.' }));
  } catch (error) { fail(res, 'reset the role', error, req); }
});

router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER'), async (req, res) => {
  try {
    const role = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    const [actor, count] = await Promise.all([actorOf(req), holderCounts(req.user.organizationId)]);
    const denial = roleDeleteDenial(actor, role, { holders: count(role) });
    if (denial) return res.status(400).json({ error: denial });
    await prisma.$transaction(async (tx) => {
      await audit(tx, req, 'ROLE_DELETED', role, snapshot(role), null);
      await tx.role.delete({ where: { id: role.id } });
    });
    forgetRoles();
    res.json({ success: true });
  } catch (error) { fail(res, 'delete the role', error, req); }
});

export default router;
