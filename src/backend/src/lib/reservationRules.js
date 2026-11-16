/**
 * What may be reserved for an order line (Phase 6). Pure: no database access, unit tested.
 *
 * A reservation promises one physical item to one line. The server refuses a promise that cannot
 * be kept, whatever the screen sent:
 *   - the item is on its way to another branch (it is not on anyone's shelf);
 *   - the line counts in one unit and the stock in another (3 pieces are not 3 pounds);
 *   - the line names a grade and the item is another grade (no rule for substitutes exists, so none is assumed);
 *   - the item is thinner or thicker than the line allows, where the line gives its own thickness tolerance;
 *   - the item is narrower or shorter than the line needs (cutting cannot make it bigger);
 *   - the item belongs to a customer who is not the buyer on this order (customer-owned material).
 * Returns null when the reservation may go ahead, else { status, code, error }.
 */
const UNIT_ALIASES = { LB: 'LB', LBS: 'LB', POUND: 'LB', POUNDS: 'LB', EA: 'EA', EACH: 'EA', PC: 'EA', PCS: 'EA', PIECE: 'EA', PIECES: 'EA' };
export const unitKey = (u) => UNIT_ALIASES[String(u || 'LB').trim().toUpperCase()] || String(u || '').trim().toUpperCase();

const n = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const EPS = 1e-6;
const fail = (code, error, status = 409) => ({ status, code, error });

export function reservationProblem({ line, order, coil, inventory, houseOrgIds = [] }) {
  if (inventory?.status === 'IN_TRANSIT') return fail('IN_TRANSIT', `Stock item ${coil.coilNumber} is on its way to another branch. Reserve it after the receiving branch has received it.`);
  if (unitKey(line.unit) !== unitKey(inventory?.unit)) {
    return fail('UNIT_MISMATCH', `Line ${line.lineNumber} is counted in ${line.unit} and stock item ${coil.coilNumber} in ${inventory?.unit}. Reserve stock counted in the line's unit.`);
  }
  if (line.gradeId && coil.gradeId && line.gradeId !== coil.gradeId) {
    return fail('GRADE_MISMATCH', `Line ${line.lineNumber} is for grade ${line.gradeCode || 'ordered'}, and stock item ${coil.coilNumber} is ${coil.gradeCode || 'another grade'}. No rule for substitute grades is set, so only the grade ordered can be reserved.`);
  }
  const lt = n(line.thicknessIn); const ct = n(coil.thicknessIn);
  const plus = n(line.thkTolerancePlus); const minus = n(line.thkToleranceMinus);
  if (lt !== null && ct !== null && (plus !== null || minus !== null)) {
    if (ct > lt + (plus ?? 0) + EPS || ct < lt - (minus ?? 0) - EPS) {
      return fail('SIZE_MISMATCH', `Stock item ${coil.coilNumber} is ${ct}" thick; line ${line.lineNumber} allows ${lt - (minus ?? 0)}" to ${lt + (plus ?? 0)}".`);
    }
  }
  for (const [field, label] of [['widthIn', 'wide'], ['lengthIn', 'long']]) {
    const need = n(line[field]); const have = n(coil[field]);
    if (need !== null && have !== null && have + EPS < need) {
      return fail('SIZE_MISMATCH', `Stock item ${coil.coilNumber} is ${have}" ${label}; line ${line.lineNumber} needs ${need}". A smaller piece cannot be cut to a bigger size.`);
    }
  }
  if (coil.ownerId && !houseOrgIds.includes(coil.ownerId) && coil.ownerId !== order?.buyerId) {
    return fail('OWNER_MISMATCH', `Stock item ${coil.coilNumber} belongs to ${coil.ownerName || 'a customer'}, not to the buyer on this order. Customer-owned material can be reserved only for its owner.`);
  }
  return null;
}
