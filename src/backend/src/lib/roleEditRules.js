/**
 * What may be changed about a role, and by whom (role matrix, phase 2).
 *
 *  - Only a login that holds "roles:edit" changes roles (owner, 2026-11-20: super admin, tenant owner, admin).
 *  - Super admin and tenant owner always hold everything. Those two roles cannot be changed by anyone.
 *  - Nobody gives a permission they do not hold themselves.
 *  - Nobody takes the right to edit roles away from their own role, and a change may not leave the
 *    company with no active login that can edit roles.
 *  - A built-in role keeps its name, is never deleted and never switched off: logins point at it.
 *  - A role people still hold is not deleted or switched off until they are moved.
 *  - A customer or partner role holds the web shop and nothing of the staff side.
 *
 * Pure: no database. routes/roles.js loads the facts and asks here.
 */
import { AREAS, PERMISSION_SET } from './permissionCatalog.js';
import { ALL, has } from './permissions.js';

export const LOCKED_ROLES = new Set(['SUPER_ADMIN', 'TENANT_OWNER']);
export const BRANCH_SCOPES = ['ALL', 'ASSIGNED', 'OWN'];
export const EXTERNAL_PERMISSIONS = new Set(['ecommerce:view']);
const NAME = /^[A-Z][A-Z0-9_]{2,39}$/;

const LABEL = Object.fromEntries(AREAS.flatMap((a) => [
  ...a.actions.map((action) => [`${a.id}:${action}`, `${a.label}: ${action}`]),
  ...a.special.map((s) => [`${a.id}:${s.action}`, s.label]),
]));
export const SENSITIVE = new Set(AREAS.flatMap((a) => a.special.filter((s) => s.sensitive).map((s) => `${a.id}:${s.action}`)));
export const permissionLabel = (key) => LABEL[key] || key;

/** A role name as the database keeps it: "Night shift lead" -> NIGHT_SHIFT_LEAD. */
export const roleName = (text) => String(text || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

export const isLocked = (role) => Boolean(role?.isSystem) && LOCKED_ROLES.has(role.name);

/** What changed between two sets of permissions. */
export function grantsDiff(before = [], after = []) {
  const was = new Set(before);
  const now = new Set(after);
  return { added: [...now].filter((p) => !was.has(p)).sort(), removed: [...was].filter((p) => !now.has(p)).sort() };
}

/** The permissions as they are stored: known ones only, once each, in catalog order. */
export function cleanGrants(grants) {
  const set = new Set(grants);
  return [...PERMISSION_SET].filter((p) => set.has(p));
}

/**
 * actor:    { role, grants }  the signed-in login and what it holds
 * existing: the role as it is now, or null when creating
 * change:   { name?, displayName?, grants?, branchScope?, isActive? } as sent; undefined = not changed
 * facts:    { holders, editorsAfter, takenNames }
 *             holders       how many logins hold the role now
 *             editorsAfter  how many active logins could still edit roles after the change
 *             takenNames    role names already used (the database's role names and existing roles)
 * Returns a sentence to refuse with, or null.
 */
export function roleChangeDenial(actor, existing, change = {}, facts = {}) {
  if (!has(actor?.grants, 'roles:edit')) return 'Changing roles needs an administrator.';
  if (existing && isLocked(existing)) return `The ${existing.displayName || existing.name} role always holds everything and cannot be changed.`;

  if (!existing) {
    const name = roleName(change.name || change.displayName);
    if (!NAME.test(name)) return 'Give the role a name of 3 to 40 letters or numbers.';
    if ((facts.takenNames || []).includes(name)) return `There is already a role named ${name}.`;
  }
  if (change.displayName !== undefined || !existing) {
    const shown = String(change.displayName || '').trim();
    if (!shown || shown.length > 60) return 'Give the role a display name of up to 60 characters.';
  }
  if (change.branchScope !== undefined && !BRANCH_SCOPES.includes(change.branchScope)) return 'Pick which branches the role sees: every branch, assigned branches, or the home branch only.';
  if (existing?.isSystem && change.isActive === false) return 'A built-in role cannot be switched off: logins point at it. Take permissions away from it instead.';
  if (existing && change.isActive === false && facts.holders > 0) return `${facts.holders} ${facts.holders === 1 ? 'person holds' : 'people hold'} this role. Move them to another role first.`;

  if (change.grants !== undefined) {
    if (!Array.isArray(change.grants)) return 'The permissions were not sent as a list.';
    const unknown = change.grants.filter((p) => !PERMISSION_SET.has(p));
    if (change.grants.includes(ALL)) return 'Only the super admin and tenant owner roles hold everything.';
    if (unknown.length) return `Not a permission: ${unknown.slice(0, 3).join(', ')}.`;
    const audience = existing?.audience || 'STAFF';
    if (audience !== 'STAFF') {
      const outside = change.grants.filter((p) => !EXTERNAL_PERMISSIONS.has(p));
      if (outside.length) return 'A customer or partner role can hold the web shop only.';
    }
    const { added, removed } = grantsDiff(existing?.grants || [], change.grants);
    const beyond = added.filter((p) => !has(actor.grants, p));
    if (beyond.length) return `You cannot give a permission you do not hold: ${beyond.slice(0, 3).map(permissionLabel).join('; ')}.`;
    if (removed.includes('roles:edit')) {
      if (existing?.name === actor.role) return 'You cannot take the right to edit roles away from your own role.';
      if (facts.editorsAfter !== undefined && facts.editorsAfter < 1) return 'This would leave nobody who can edit roles.';
    }
  }
  return null;
}

/** null when the role may be deleted, otherwise why not. */
export function roleDeleteDenial(actor, existing, facts = {}) {
  if (!has(actor?.grants, 'roles:edit')) return 'Changing roles needs an administrator.';
  if (existing.isSystem) return 'A built-in role cannot be deleted. You can change what it may do, or reset it to its default.';
  if (facts.holders > 0) return `${facts.holders} ${facts.holders === 1 ? 'person holds' : 'people hold'} this role. Move them to another role first.`;
  return null;
}
