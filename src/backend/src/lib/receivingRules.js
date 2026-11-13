/**
 * Receiving stock: reading one receipt, with no database access so it can be unit tested.
 *
 * A receipt comes from the Receive form (field names as the API uses them) or
 * from a row of an upload file (the column names of the templates). Both are
 * turned into one shape here, so the two ways of receiving follow one rule.
 */
export const FORMS = ['COIL', 'SHEET', 'PLATE', 'BAR', 'TUBE', 'BEAM', 'REBAR', 'WIRE', 'ROD', 'SUPPLY'];
export const TEMPLATE_FORMS = { coils: 'COIL', sheets: 'SHEET', plates: 'PLATE', bars: 'BAR', plastics: 'SHEET', remnants: null };
export const OWNERSHIPS = ['HOUSE_OWNED', 'CUSTOMER_OWNED'];
export const MAX_UPLOAD_ROWS = 2000;

const text = (v, max = 200) => (v === null || v === undefined ? '' : String(v).trim().slice(0, max));
const pick = (row, ...names) => { for (const n of names) if (text(row[n])) return row[n]; return undefined; };

function measure(name, value, { required = false, max = 100000000 } = {}) {
  if (value === null || value === undefined || text(value) === '') return required ? { error: `${name} is required` } : { value: null };
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
  if (!Number.isFinite(n)) return { error: `${name} must be a number` };
  if (n <= 0) return { error: `${name} must be more than zero` };
  if (n > max) return { error: `${name} is too large` };
  return { value: n };
}

/**
 * { receipt, error }. receipt:
 *   coilNumber, form (null when it comes from the parent item), heatNumber, gradeCode, parentTag,
 *   thicknessIn, widthIn, lengthIn, odIn, idIn, weightLb, locationCode, locationId, binLocation,
 *   ownership, customerName, ownerId, productSku, poReference, notes
 */
export function readReceipt(input, templateType = null) {
  const row = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const fail = (error) => ({ receipt: null, error });

  const coilNumber = text(pick(row, 'coilNumber', 'tag_number'), 60);
  if (!coilNumber) return fail('An item number (tag) is required');
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._\/#-]*$/.test(coilNumber)) return fail('The item number may use letters, numbers, spaces and . _ / # - only');

  const parentTag = text(pick(row, 'parentTag', 'parent_tag'), 60) || null;
  let form = text(pick(row, 'form')).toUpperCase() || (templateType ? TEMPLATE_FORMS[templateType] : null) || null;
  if (templateType && !(templateType in TEMPLATE_FORMS)) return fail(`Unknown upload type "${templateType}"`);
  if (form && !FORMS.includes(form)) return fail(`Unknown form "${form}"`);
  if (!form && !parentTag) return fail('The form (coil, sheet, plate, bar) is required');

  // Plastics carry a lot number where metals carry a heat number: it is the same traceability key.
  const heatNumber = text(pick(row, 'heatNumber', 'heat_number', 'lot_number'), 60) || null;
  const gradeCode = text(pick(row, 'gradeCode', 'grade', 'material_type'), 40) || null;
  if (!parentTag && !heatNumber) return fail('A heat or lot number is required');
  if (!parentTag && !gradeCode) return fail('A grade is required');

  const sizes = {};
  for (const [field, label, ...names] of [
    ['thicknessIn', 'Thickness', 'thicknessIn', 'thickness'], ['widthIn', 'Width', 'widthIn', 'width'], ['lengthIn', 'Length', 'lengthIn', 'length'],
    ['odIn', 'Outside diameter', 'odIn', 'coil_od'], ['idIn', 'Inside diameter', 'idIn', 'coil_id'],
  ]) {
    const got = measure(label, pick(row, ...names), { max: 100000 });
    if (got.error) return fail(got.error);
    sizes[field] = got.value;
  }
  if (sizes.lengthIn === null && text(row.length_ft)) {
    const feet = measure('Length', row.length_ft, { max: 10000 });
    if (feet.error) return fail(feet.error);
    sizes.lengthIn = Math.round(feet.value * 12 * 10000) / 10000;
  }
  if (sizes.odIn !== null && sizes.idIn !== null && sizes.idIn >= sizes.odIn) return fail('The inside diameter must be smaller than the outside diameter');

  const weight = measure('Weight', pick(row, 'weightLb', 'weight_lbs', 'netWeightLb'), { required: true });
  if (weight.error) return fail(weight.error);

  const locationId = text(row.locationId, 64) || null;
  const locationCode = text(pick(row, 'locationCode', 'location_code'), 60) || null;
  if (!locationId && !locationCode) return fail('A location is required');

  const rawOwnership = text(pick(row, 'ownership')).toUpperCase().replace(/[\s-]+/g, '_');
  const ownership = !rawOwnership || rawOwnership === 'HOUSE' || rawOwnership === 'HOUSE_OWNED' ? 'HOUSE_OWNED'
    : ['CUSTOMER_OWNED', 'CUSTOMER', 'TOLL'].includes(rawOwnership) ? 'CUSTOMER_OWNED' : null;
  if (!ownership) return fail(`Ownership must be HOUSE_OWNED or CUSTOMER_OWNED, not "${text(row.ownership, 30)}"`);
  const ownerId = text(row.ownerId, 64) || null;
  const customerName = text(pick(row, 'customerName', 'customer_name'), 200) || null;
  if (ownership === 'CUSTOMER_OWNED' && !ownerId && !customerName) return fail('Customer-owned stock needs the customer');

  const pieces = text(pick(row, 'pieces', 'quantity_pcs'));
  if (pieces && !(Number.isInteger(Number(pieces)) && Number(pieces) > 0)) return fail('The piece count must be a whole number more than zero');
  const noteParts = [
    text(pick(row, 'notes'), 500),
    pieces ? `${Number(pieces)} pcs` : '', text(row.size_description, 80), text(row.bundle_number, 60) && `Bundle ${text(row.bundle_number, 60)}`,
    text(row.color, 40) && `Color ${text(row.color, 40)}`, text(row.condition, 40) && `Condition ${text(row.condition, 40)}`,
    text(pick(row, 'millName', 'mill_name'), 80) && `Mill ${text(pick(row, 'millName', 'mill_name'), 80)}`,
  ].filter(Boolean);

  return {
    error: null,
    receipt: {
      coilNumber, form, heatNumber, gradeCode, parentTag, ...sizes, weightLb: weight.value,
      locationId, locationCode, binLocation: text(pick(row, 'binLocation', 'bay_position'), 60) || null,
      ownership, ownerId, customerName,
      productSku: text(pick(row, 'productSku', 'material_code'), 60) || null,
      poReference: text(pick(row, 'poReference', 'po_number'), 60) || null,
      notes: noteParts.join('. ').slice(0, 900) || null,
    },
  };
}
