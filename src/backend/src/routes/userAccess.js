/**
 * One person's access (role matrix, phase 4). Mounted at /api/users, before the user routes.
 *
 *   GET /api/users/:id/access   their main role, extra roles, exceptions, and what it all adds up to
 *   PUT /api/users/:id/access   { primaryRoleId?, extras?, exceptions? }  each replaces what is there; leave one out to keep it
 *
 * lib/userAccessRules.js and lib/userAdminRules.js decide what the signed-in person may change.
 * Every change is written to the audit log with the person's access before and after.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma from '../lib/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { allRoles, can, forgetUser, grantList, matrixOff } from '../lib/roleStore.js';
import { baseOf, effectiveAccess } from '../lib/userAccess.js';
import { accessChangeDenial, roleGiftDenial } from '../lib/userAccessRules.js';
import { userChangeDenial } from '../lib/userAdminRules.js';
import { editorsAfter } from '../lib/accessFacts.js';
import { SENSITIVE } from '../lib/roleEditRules.js';
import { has } from '../lib/permissions.js';

const router = Router();
const UPDATE_20 = { error: 'Database update 20 (custom role as a main role) has to be applied first.', code: 'DATABASE_UPDATE_REQUIRED' };
const update20Missing = (error) => error?.code === 'P2021' && /UserPrimaryRole/.test(`${error?.meta?.table || ''} ${error?.message || ''}`);
const nameOf = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email : null);
const date = (value) => (value ? new Date(value) : null);

/** The person and everything set on them. primaryReady is false while update 20 is waiting. */
async function load(id, organizationId) {
  const user = await prisma.user.findFirst({ where: { id, organizationId }, select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, homeLocationId: true, userLocations: { select: { locationId: true } } } });
  if (!user) return null;
  let primaryReady = true;
  const [primary, extras, overrides] = await Promise.all([
    prisma.userPrimaryRole.findUnique({ where: { userId: id }, select: { roleId: true } }).catch((error) => { if (!update20Missing(error)) throw error; primaryReady = false; return null; }),
    prisma.userRoleAssignment.findMany({ where: { userId: id }, select: { roleId: true, expiresAt: true, grantedAt: true }, orderBy: { grantedAt: 'asc' } }),
    prisma.userPermissionOverride.findMany({ where: { userId: id }, select: { permission: true, effect: true, reason: true, expiresAt: true, createdAt: true, createdById: true }, orderBy: { createdAt: 'asc' } }),
  ]);
  return { user, primaryReady, facts: { primaryRoleId: primary?.roleId || null, extras, overrides } };
}

const snapshot = (access, facts) => ({
  role: access.role, mainRole: access.primary.displayName, customMainRole: access.primary.custom ? access.primary.name : null,
  extraRoles: access.extras.map((e) => ({ name: e.name, until: e.expiresAt || null })),
  exceptions: (facts.overrides || []).map((o) => ({ permission: o.permission, effect: o.effect, reason: o.reason, until: o.expiresAt || null })),
  permissions: [...access.grants].sort(), branchScope: access.branchScope,
});

router.get('/:id/access', authenticate, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id && !can(req, 'adminUsers:view')) return res.status(403).json({ error: 'Looking at another person\'s access needs the user administration pages.' });
    const [found, every] = await Promise.all([load(req.params.id, req.user.organizationId), allRoles()]);
    if (!found) return res.status(404).json({ error: 'User not found' });
    const { user, facts, primaryReady } = found;
    const now = Date.now();
    const access = effectiveAccess(user.role, every, facts, now);
    const counted = new Set(access.extras.map((e) => e.id));
    const who = await prisma.user.findMany({ where: { id: { in: [...new Set(facts.overrides.map((o) => o.createdById).filter(Boolean))] } }, select: { id: true, firstName: true, lastName: true, email: true } });
    const by = Object.fromEntries(who.map((u) => [u.id, nameOf(u)]));
    const actor = { id: req.user.id, grants: req.access.grants };
    const roles = Object.values(every.byId).filter((r) => r.audience === 'STAFF').map((r) => ({
      id: r.id, name: r.name, displayName: r.displayName, custom: !r.isSystem, isActive: r.isActive !== false, baseRole: r.isSystem ? r.name : baseOf(r),
      // Why the person looking may not give it, or null.
      cannotGive: roleGiftDenial(actor, r),
    })).sort((a, b) => a.displayName.localeCompare(b.displayName));
    res.json({
      user: { id: user.id, name: nameOf(user), email: user.email, role: user.role, isActive: user.isActive },
      audience: access.audience,
      locked: access.grants.has('*'),
      mainRole: access.primary,
      // A custom main role that is saved but does not count (switched off, or the login's role was changed since).
      mainRoleIgnored: Boolean(facts.primaryRoleId) && !access.primary.custom ? (every.byId[facts.primaryRoleId]?.displayName || 'A custom role') : null,
      extras: facts.extras.map((e) => ({ roleId: e.roleId, name: every.byId[e.roleId]?.name || null, displayName: every.byId[e.roleId]?.displayName || 'A role that no longer exists', expiresAt: e.expiresAt, counts: counted.has(e.roleId) })),
      exceptions: facts.overrides.map((o) => ({ permission: o.permission, effect: o.effect, reason: o.reason, expiresAt: o.expiresAt, createdAt: o.createdAt, by: by[o.createdById] || null, counts: !o.expiresAt || new Date(o.expiresAt).getTime() > now })),
      effective: { permissions: grantList(access), sources: access.sources, denied: access.denied, branchScope: access.branchScope },
      roles,
      myGrants: grantList(req.access),
      canChange: req.params.id !== req.user.id && can(req, 'adminUsers:edit'),
      canSetExceptions: req.params.id !== req.user.id && can(req, 'adminUsers:edit') && can(req, 'roles:edit'),
      customMainRoleReady: primaryReady,
      enforced: !matrixOff(),
    });
  } catch (error) { next(error); }
});

router.put('/:id/access', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER'), async (req, res, next) => {
  try {
    const body = req.body || {};
    const [found, every] = await Promise.all([load(req.params.id, req.user.organizationId), allRoles()]);
    if (!found) return res.status(404).json({ error: 'User not found' });
    const { user, facts, primaryReady } = found;
    const now = Date.now();
    const before = effectiveAccess(user.role, every, facts, now);
    const roleOf = (id) => (typeof id === 'string' ? every.byId[id] || null : null);

    const change = {};
    if (body.primaryRoleId !== undefined) {
      change.primary = body.primaryRoleId === null ? null : roleOf(body.primaryRoleId);
      if (body.primaryRoleId !== null && !change.primary) return res.status(400).json({ error: 'That role does not exist.' });
      if (change.primary && !primaryReady) return res.status(503).json(UPDATE_20);
    }
    if (body.extras !== undefined) change.extras = Array.isArray(body.extras) ? body.extras.map((e) => ({ role: roleOf(e?.roleId), expiresAt: e?.expiresAt || null })) : body.extras;
    if (body.exceptions !== undefined) change.exceptions = Array.isArray(body.exceptions) ? body.exceptions.map((x) => ({ permission: x?.permission, effect: x?.effect, reason: x?.reason, expiresAt: x?.expiresAt || null })) : body.exceptions;

    // The login's role follows a custom main role: the built-in role the custom one stands on.
    const nextRole = change.primary ? baseOf(change.primary) : user.role;
    const whoMay = userChangeDenial(req.user, user, { ...(nextRole !== user.role && { role: nextRole }), ...(change.extras !== undefined && { roleIds: change.extras.map((e) => e.role?.id).filter((id) => !facts.extras.some((had) => had.roleId === id)) }) });
    if (whoMay) return res.status(403).json({ error: whoMay });

    const nextFacts = {
      primaryRoleId: change.primary === undefined ? facts.primaryRoleId : change.primary?.id || null,
      extras: change.extras === undefined || !Array.isArray(change.extras) ? facts.extras : change.extras.filter((e) => e.role).map((e) => ({ roleId: e.role.id, expiresAt: e.expiresAt })),
      overrides: change.exceptions === undefined || !Array.isArray(change.exceptions) ? facts.overrides : change.exceptions,
    };
    const actor = { id: req.user.id, grants: req.access.grants };
    const target = { id: user.id, role: user.role, audience: before.audience, extraIds: facts.extras.map((e) => e.roleId), exceptions: facts.overrides };
    let denial = accessChangeDenial(actor, target, change, {}, now);
    if (denial) return res.status(400).json({ error: denial });
    const after = effectiveAccess(nextRole, every, nextFacts, now);
    if (user.isActive && has(before.grants, 'roles:edit') && !has(after.grants, 'roles:edit')) {
      denial = accessChangeDenial(actor, target, change, { editorsAfter: await editorsAfter(req.user.organizationId, { person: { id: user.id, role: nextRole, facts: nextFacts } }) }, now);
      if (denial) return res.status(400).json({ error: denial });
    }

    await prisma.$transaction(async (tx) => {
      if (change.primary !== undefined) {
        if (change.primary) {
          await tx.userPrimaryRole.upsert({ where: { userId: user.id }, create: { userId: user.id, roleId: change.primary.id, setById: req.user.id }, update: { roleId: change.primary.id, setById: req.user.id, setAt: new Date() } });
          if (nextRole !== user.role) await tx.user.update({ where: { id: user.id }, data: { role: nextRole } });
        } else if (primaryReady) await tx.userPrimaryRole.deleteMany({ where: { userId: user.id } });
      }
      if (change.extras !== undefined) {
        const kept = new Map(facts.extras.map((e) => [e.roleId, e]));
        await tx.userRoleAssignment.deleteMany({ where: { userId: user.id } });
        if (nextFacts.extras.length) await tx.userRoleAssignment.createMany({ data: nextFacts.extras.map((e) => ({ id: randomUUID(), userId: user.id, roleId: e.roleId, expiresAt: date(e.expiresAt), grantedBy: req.user.id, ...(kept.has(e.roleId) && { grantedAt: kept.get(e.roleId).grantedAt }) })) });
      }
      if (change.exceptions !== undefined) {
        const kept = new Map(facts.overrides.map((o) => [`${o.permission} ${o.effect}`, o]));
        await tx.userPermissionOverride.deleteMany({ where: { userId: user.id } });
        if (nextFacts.overrides.length) await tx.userPermissionOverride.createMany({ data: nextFacts.overrides.map((o) => { const had = kept.get(`${o.permission} ${o.effect}`); return { id: randomUUID(), userId: user.id, permission: o.permission, effect: o.effect, reason: String(o.reason).trim(), expiresAt: date(o.expiresAt), createdById: had?.createdById ?? req.user.id, ...(had && { createdAt: had.createdAt }) }; }) });
      }
      const was = snapshot(before, facts);
      const now2 = snapshot(after, nextFacts);
      const added = now2.permissions.filter((p) => !was.permissions.includes(p));
      const removed = was.permissions.filter((p) => !now2.permissions.includes(p));
      await tx.auditLog.create({ data: {
        tenantId: req.user.organizationId, category: 'AUTHZ', eventType: 'USER_ACCESS_CHANGED', userId: req.user.id, resourceType: 'User', resourceId: user.id,
        severity: [...added, ...removed].some((p) => SENSITIVE.has(p) || p === 'roles:edit') ? 'WARNING' : 'INFO', action: 'user.access',
        details: { person: nameOf(user), added, removed, changed: Object.keys(change) },
        fieldChanges: { before: was, after: now2 },
      } });
    });
    forgetUser(user.id);
    res.json({ ok: true });
  } catch (error) {
    if (update20Missing(error)) return res.status(503).json(UPDATE_20);
    next(error);
  }
});

// Who changed this person's access, when, and what it was before and after. Newest first.
router.get('/:id/access/history', authenticate, async (req, res, next) => {
  try {
    if (!can(req, 'adminUsers:view')) return res.status(403).json({ error: 'Looking at another person\'s access needs the user administration pages.' });
    const rows = await prisma.auditLog.findMany({ where: { tenantId: req.user.organizationId, category: 'AUTHZ', eventType: 'USER_ACCESS_CHANGED', resourceType: 'User', resourceId: req.params.id }, orderBy: { timestamp: 'desc' }, take: 50, include: { user: { select: { firstName: true, lastName: true, email: true } } } });
    res.json(rows.map((r) => ({ id: r.id, at: r.timestamp, by: nameOf(r.user) || 'Unknown', added: r.details?.added || [], removed: r.details?.removed || [], changed: r.details?.changed || [], before: r.fieldChanges?.before || null, after: r.fieldChanges?.after || null })));
  } catch (error) { next(error); }
});

export default router;
