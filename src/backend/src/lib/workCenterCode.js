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
