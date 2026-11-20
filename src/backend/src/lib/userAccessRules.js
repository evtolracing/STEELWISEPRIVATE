/**
 * What may be changed about one person's access, and by whom (role matrix, phase 4).
 *
 *  - Nobody changes their own roles or exceptions.
 *  - Super admin and tenant owner logins hold everything: no custom role, extra role or exception
 *    applies to them, so none is saved on them. Customer and partner logins have their one role.
 *  - Nobody gives a role that holds a permission they do not hold themselves, and never one of the
 *    two locked roles, a customer or partner role, or a role that is switched off.
 *  - Exceptions need the right to edit roles. A granted permission must be one the giver holds.
 *    Every exception carries a reason. An end date, when given, is in the future.
 *  - A change may not leave the company with no active login that can edit roles.
 *
 * Who may change which login at all (branch managers and their own branches, the two top roles)
 * stays with lib/userAdminRules.js. Pure: no database. routes/userAccess.js loads the facts.
 */
import { LOCKED_ROLES, permissionLabel } from './roleEditRules.js';
import { PERMISSION_SET } from './permissionCatalog.js';
import { ALL, has } from './permissions.js';

export const MOST_EXCEPTIONS = 60;
const future = (value, now) => { if (value === null || value === undefined || value === '') return true; const t = new Date(value).getTime(); return Number.isFinite(t) && t > now; };
const grantsOf = (role) => (Array.isArray(role?.grants) ? role.grants : []);

/** Why this role may not be given by this actor, or null. */
export function roleGiftDenial(actor, role) {
  if (!role) return 'That role does not exist.';
  const name = role.displayName || role.name;
  if (LOCKED_ROLES.has(role.name) || grantsOf(role).includes(ALL)) return `The ${name} role is not given on top of another role. Make it the person's role instead.`;
  if (role.audience && role.audience !== 'STAFF') return `${name} is a customer or partner role and cannot be given to staff.`;
  if (role.isActive === false) return `The ${name} role is switched off.`;
  const beyond = grantsOf(role).filter((p) => !has(actor.grants, p));
  if (beyond.length) return `You cannot give the ${name} role: it holds what you do not (${beyond.slice(0, 3).map(permissionLabel).join('; ')}).`;
  return null;
}

/**
 * actor:  { id, grants }                         the signed-in login and what it holds now
 * target: { id, role, audience, extraIds, exceptions }  the person as they are (extraIds: role ids held on top; exceptions: [{ permission, effect }])
 * change: { primary?, extras?, exceptions? }     undefined = not changed
 *           primary     a custom role row, or null to go back to the built-in role
 *           extras      [{ role, expiresAt }]    role rows
 *           exceptions  [{ permission, effect, reason, expiresAt }]
 * facts:  { editorsAfter }                       active logins that could still edit roles afterwards (when it could drop)
 */
export function accessChangeDenial(actor, target, change = {}, facts = {}, now = Date.now()) {
  const touches = change.primary !== undefined || change.extras !== undefined || change.exceptions !== undefined;
  if (!touches) return null;
  if (target.id === actor.id) return 'You cannot change your own roles or exceptions.';
  const clears = (change.primary === undefined || change.primary === null) && (change.extras === undefined || change.extras.length === 0) && (change.exceptions === undefined || change.exceptions.length === 0);
  if (LOCKED_ROLES.has(target.role) && !clears) return 'This login holds everything already. Extra roles and exceptions do not apply to it.';
  if (target.audience !== 'STAFF' && !clears) return 'A customer or partner login has its one role. Extra roles and exceptions are for staff.';

  if (change.primary) {
    if (change.primary.isSystem) return 'Pick a built-in role in the Role box of the login itself.';
    const no = roleGiftDenial(actor, change.primary);
    if (no) return no;
  }
  if (change.extras !== undefined) {
    if (!Array.isArray(change.extras)) return 'The extra roles were not sent as a list.';
    const had = new Set(target.extraIds || []);
    const ids = new Set();
    for (const e of change.extras) {
      if (!e?.role) return 'That role does not exist.';
      if (ids.has(e.role.id)) return `${e.role.displayName || e.role.name} is listed twice.`;
      ids.add(e.role.id);
      if (!future(e.expiresAt, now)) return 'An end date has to be in the future.';
      // A role the person already holds may stay; only a role being added is judged.
      if (!had.has(e.role.id)) { const no = roleGiftDenial(actor, e.role); if (no) return no; }
    }
  }
  if (change.exceptions !== undefined) {
    if (!has(actor.grants, 'roles:edit')) return 'Exceptions for one person need the right to edit roles.';
    if (!Array.isArray(change.exceptions)) return 'The exceptions were not sent as a list.';
    if (change.exceptions.length > MOST_EXCEPTIONS) return `At most ${MOST_EXCEPTIONS} exceptions for one person. Give a role instead.`;
    const was = new Map((target.exceptions || []).map((x) => [x.permission, x.effect]));
    const seen = new Set();
    for (const x of change.exceptions) {
      if (!x || !PERMISSION_SET.has(x.permission)) return `Not a permission: ${String(x?.permission).slice(0, 60)}.`;
      if (seen.has(x.permission)) return `${permissionLabel(x.permission)} is listed twice.`;
      seen.add(x.permission);
      if (x.effect !== 'GRANT' && x.effect !== 'DENY') return 'An exception either gives or takes away.';
      const reason = String(x.reason || '').trim();
      if (!reason) return `Say why: ${permissionLabel(x.permission)} has no reason.`;
      if (reason.length > 300) return 'Keep a reason under 300 characters.';
      if (!future(x.expiresAt, now)) return 'An end date has to be in the future.';
      if (x.effect === 'GRANT' && was.get(x.permission) !== 'GRANT' && !has(actor.grants, x.permission)) return `You cannot give a permission you do not hold: ${permissionLabel(x.permission)}.`;
    }
  }
  if (facts.editorsAfter !== undefined && facts.editorsAfter < 1) return 'This would leave nobody who can edit roles.';
  return null;
}
