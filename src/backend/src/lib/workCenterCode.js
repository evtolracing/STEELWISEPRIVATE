/**
 * The code of a new work center: the kind and the next free number, "ROUTER-03". Codes are one list for the
 * whole company, so the number is taken from every work center of that kind at every branch, online or not.
 *
 * Before 2026-11-22 the number was "how many of this kind there are, plus one", counted inside the branch the
 * person was working in. A second router at another branch, or at the same branch after one had been taken
 * offline or renamed, was given a number already in use and the save failed ("already exists", or "Failed to
 * create work center").
 */
export function nextWorkCenterCode(kind, codesInUse = []) {
  const prefix = `${kind}-`;
  let highest = 0;
  for (const code of codesInUse) {
    if (typeof code !== 'string' || !code.toUpperCase().startsWith(prefix.toUpperCase())) continue;
    const n = /^\d+$/.test(code.slice(prefix.length)) ? Number(code.slice(prefix.length)) : 0;
    if (n > highest) highest = n;
  }
  return `${prefix}${String(highest + 1).padStart(2, '0')}`;
}

/**
 * A work center's code carries its branch in front: "CT-ROUTER-01" (owner, 2026-11-22: "if I have Router 1 in one
 * location I should be able to have Router 1 at other locations"). Codes stay one list for the company, and each
 * branch numbers its own machines from 01. Codes saved before this keep the form they have.
 */
export function branchWorkCenterCode(branchCode, kind, codesInUse = []) {
  return nextWorkCenterCode(`${branchCode}-${kind}`, codesInUse);
}

/** A code typed by hand is kept under its branch the same way, so "ROUTER-1" can be typed at every branch. */
export function typedWorkCenterCode(branchCode, typed) {
  const code = String(typed || '').trim();
  return code.toUpperCase().startsWith(`${branchCode}-`.toUpperCase()) ? code : `${branchCode}-${code}`;
}
