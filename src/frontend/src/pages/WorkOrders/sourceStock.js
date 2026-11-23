/**
 * The stock items offered as the source of a work order: how each one reads in the list and what
 * typing in the box matches. Pure, so it is unit tested (src/backend/test/sourceStock.test.js).
 */
const FORM_WORDS = { COIL: 'Coil', SHEET: 'Sheet', PLATE: 'Plate', BAR: 'Bar', TUBE: 'Tube', BEAM: 'Beam', REBAR: 'Rebar', WIRE: 'Wire', ROD: 'Rod', SUPPLY: 'Supply' }

const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))
const inches = (v) => (num(v) == null ? null : `${Number(num(v).toFixed(4))}"`)

/** What is on hand to cut, in pounds: the stock balance when there is one, otherwise the item's weight. */
export function stockOnHandLb(item) {
  const onHand = num(item?.inventory?.qtyOnHand)
  return onHand != null ? onHand : num(item?.netWeightLb)
}

/** 0.25" x 48" x 96": only the sizes on file, thickness first. '' when none is on file. */
export function stockSize(item) {
  return [inches(item?.thicknessIn), inches(item?.widthIn), inches(item?.lengthIn)].filter(Boolean).join(' x ')
}

export function stockNumber(item) {
  return item?.coilNumber || item?.unitNumber || item?.id || ''
}

/** The first line of a row: "DEMO-R-0046 · A36 Plate". */
export function stockTitle(item) {
  const what = [item?.grade?.code, FORM_WORDS[item?.form] || null].filter(Boolean).join(' ')
  return [stockNumber(item), what].filter(Boolean).join(' · ')
}

/** The second line: material name, size, weight on hand, branch. Nothing is shown as "?" or "Unknown". */
export function stockDetail(item) {
  const lb = stockOnHandLb(item)
  return [
    item?.product?.name || item?.grade?.name || null,
    stockSize(item) || null,
    lb == null ? null : `${Math.round(lb).toLocaleString('en-US')} lb`,
    item?.location?.name || null,
  ].filter(Boolean).join(' · ')
}

/** Everything typing in the box may match: number, material, grade, form, heat, size, branch. Lower case. */
export function stockSearchText(item) {
  return [
    stockNumber(item), item?.product?.name, item?.product?.sku, item?.grade?.code, item?.grade?.name,
    FORM_WORDS[item?.form], item?.form, item?.heat?.heatNumber, stockSize(item), item?.location?.name, item?.location?.code, item?.binLocation,
  ].filter(Boolean).join(' ').toLowerCase()
}

/** Every word typed must be found somewhere on the item, in any order: "a36 plate 48". */
export function stockMatches(item, typed) {
  const words = String(typed || '').toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const text = stockSearchText(item)
  return words.every((w) => text.includes(w))
}

/** Items a work order can be cut from: something on hand, and not on hold or failed at quality. */
export function canBeCut(item) {
  if (!item || ['FAILED', 'HOLD'].includes(item.qcStatus)) return false
  const lb = stockOnHandLb(item)
  return lb == null || lb > 0
}
