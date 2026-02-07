/**
 * E-Commerce Catalog API
 * Product search, detail, availability for customer-facing portal.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = true

const MOCK_PRODUCTS = [
  { id: 'prod-001', sku: 'HR-A36-PL', name: 'Hot Rolled A36 Plate', description: 'General purpose structural steel plate. Excellent weldability.', form: 'PLATE', grade: 'A36', spec: 'ASTM A36', family: 'Carbon Steel', division: 'METALS', category: 'Carbon Steel', thicknessOptions: ['0.25"','0.375"','0.50"','0.75"','1.0"','1.5"','2.0"'], widthOptions: ['48"','60"','72"','96"'], lengthOptions: ['96"','120"','144"','240"'], basePrice: 0.42, priceUnit: 'LB', inStock: true, imageUrl: null, tags: ['structural','weldable','plate'], minOrderQty: 1, leadTimeDays: 3, allowCutToSize: true, allowProcessing: true },
  { id: 'prod-002', sku: 'CR-1018-BR', name: 'Cold Rolled 1018 Bar', description: 'Low carbon steel bar for general machining, pins, and shafts.', form: 'BAR', grade: '1018', spec: 'ASTM A108', family: 'Carbon Steel', division: 'METALS', category: 'Carbon Steel', thicknessOptions: ['0.5" dia','0.75" dia','1.0" dia','1.5" dia','2.0" dia','3.0" dia'], widthOptions: [], lengthOptions: ['12"','24"','36"','48"','72"','144"'], basePrice: 0.68, priceUnit: 'LB', inStock: true, imageUrl: null, tags: ['bar','machinable','cold-rolled'], minOrderQty: 1, leadTimeDays: 2, allowCutToSize: true, allowProcessing: true },
  { id: 'prod-003', sku: 'SS-304-SH', name: 'Stainless 304 Sheet', description: 'Austenitic stainless steel sheet with excellent corrosion resistance.', form: 'SHEET', grade: '304', spec: 'ASTM A240', family: 'Stainless Steel', division: 'METALS', category: 'Stainless Steel', thicknessOptions: ['0.024"','0.036"','0.048"','0.060"','0.075"','0.105"','0.135"'], widthOptions: ['36"','48"','60"'], lengthOptions: ['96"','120"','144"'], basePrice: 1.85, priceUnit: 'LB', inStock: true, imageUrl: null, tags: ['stainless','corrosion-resistant','sheet'], minOrderQty: 1, leadTimeDays: 3, allowCutToSize: true, allowProcessing: true },
  { id: 'prod-004', sku: 'AL-6061-PL', name: 'Aluminum 6061-T6 Plate', description: 'Heat-treated aluminum plate with high strength and good machinability.', form: 'PLATE', grade: '6061-T6', spec: 'ASTM B209', family: 'Aluminum', division: 'METALS', category: 'Aluminum', thicknessOptions: ['0.25"','0.375"','0.50"','0.75"','1.0"','2.0"','4.0"'], widthOptions: ['48"','60"'], lengthOptions: ['96"','120"','144"'], basePrice: 2.45, priceUnit: 'LB', inStock: true, imageUrl: null, tags: ['aluminum','lightweight','machinable'], minOrderQty: 1, leadTimeDays: 3, allowCutToSize: true, allowProcessing: true },
  { id: 'prod-005', sku: 'HDPE-SH-NAT', name: 'HDPE Sheet Natural', description: 'High-density polyethylene sheet for chemical resistance and food contact.', form: 'SHEET', grade: 'HDPE', spec: 'ASTM D4976', family: 'Polyethylene', division: 'PLASTICS', category: 'Polyethylene', thicknessOptions: ['0.125"','0.25"','0.50"','1.0"','2.0"'], widthOptions: ['48"','60"'], lengthOptions: ['96"','120"'], basePrice: 3.20, priceUnit: 'LB', inStock: true, imageUrl: null, tags: ['plastic','chemical-resistant','fda'], minOrderQty: 1, leadTimeDays: 4, allowCutToSize: true, allowProcessing: true },
  { id: 'prod-006', sku: 'UHMW-ROD-WH', name: 'UHMW Rod White', description: 'Ultra-high molecular weight polyethylene rod for wear parts and bushings.', form: 'ROD', grade: 'UHMW', spec: 'ASTM D4020', family: 'Ultra-High MW', division: 'PLASTICS', category: 'Ultra-High MW', thicknessOptions: ['1" dia','2" dia','3" dia','4" dia','6" dia'], widthOptions: [], lengthOptions: ['12"','24"','48"','96"'], basePrice: 5.10, priceUnit: 'LB', inStock: false, imageUrl: null, tags: ['plastic','wear-resistant','bushing'], minOrderQty: 1, leadTimeDays: 7, allowCutToSize: true, allowProcessing: false },
  { id: 'prod-007', sku: 'WG-25', name: 'Welding Gloves – Heavy Duty', description: 'Premium leather welding gloves with reinforced thumb.', form: 'SUPPLY', grade: 'N/A', spec: 'N/A', family: 'Safety', division: 'SUPPLIES', category: 'Safety', thicknessOptions: [], widthOptions: [], lengthOptions: [], basePrice: 24.99, priceUnit: 'EA', inStock: true, imageUrl: null, tags: ['safety','welding','gloves'], minOrderQty: 1, leadTimeDays: 1, allowCutToSize: false, allowProcessing: false },
  { id: 'prod-008', sku: 'CUT-DISC-9', name: 'Cut-Off Disc 9"', description: 'High-performance abrasive cutting disc for metal.', form: 'SUPPLY', grade: 'N/A', spec: 'N/A', family: 'Abrasives', division: 'SUPPLIES', category: 'Abrasives', thicknessOptions: [], widthOptions: [], lengthOptions: [], basePrice: 6.49, priceUnit: 'EA', inStock: true, imageUrl: null, tags: ['abrasive','cutting','disc'], minOrderQty: 1, leadTimeDays: 1, allowCutToSize: false, allowProcessing: false },
  { id: 'prod-009', sku: 'REM-A36-PL', name: 'Remnant A36 Plate (Assorted)', description: 'Discounted remnant/drop pieces. Various sizes. Limited availability.', form: 'PLATE', grade: 'A36', spec: 'ASTM A36', family: 'Carbon Steel', division: 'OUTLET', category: 'Remnants', thicknessOptions: ['Various'], widthOptions: ['Various'], lengthOptions: ['Various'], basePrice: 0.28, priceUnit: 'LB', inStock: true, imageUrl: null, tags: ['remnant','discount','outlet'], minOrderQty: 1, leadTimeDays: 1, allowCutToSize: false, allowProcessing: false, isRemnant: true },
  { id: 'prod-010', sku: 'HR-A572-PL', name: 'Hot Rolled A572-50 Plate', description: 'High-strength low-alloy structural plate for bridges and buildings.', form: 'PLATE', grade: 'A572-50', spec: 'ASTM A572', family: 'HSLA Steel', division: 'METALS', category: 'HSLA Steel', thicknessOptions: ['0.25"','0.375"','0.50"','0.75"','1.0"','1.5"','2.0"','3.0"'], widthOptions: ['48"','72"','96"','120"'], lengthOptions: ['120"','144"','240"','480"'], basePrice: 0.48, priceUnit: 'LB', inStock: true, imageUrl: null, tags: ['structural','hsla','plate'], minOrderQty: 1, leadTimeDays: 3, allowCutToSize: true, allowProcessing: true },
  { id: 'prod-011', sku: 'SS-316-PL', name: 'Stainless 316L Plate', description: 'Molybdenum-bearing stainless with superior corrosion resistance.', form: 'PLATE', grade: '316L', spec: 'ASTM A240', family: 'Stainless Steel', division: 'METALS', category: 'Stainless Steel', thicknessOptions: ['0.25"','0.375"','0.50"','0.75"','1.0"'], widthOptions: ['48"','60"'], lengthOptions: ['96"','120"','144"'], basePrice: 2.95, priceUnit: 'LB', inStock: true, imageUrl: null, tags: ['stainless','marine','chemical'], minOrderQty: 1, leadTimeDays: 5, allowCutToSize: true, allowProcessing: true },
  { id: 'prod-012', sku: 'BR-C360-RD', name: 'Brass C360 Round Bar', description: 'Free-machining brass rod for fittings and connectors.', form: 'BAR', grade: 'C360', spec: 'ASTM B16', family: 'Brass', division: 'METALS', category: 'Brass & Copper', thicknessOptions: ['0.25" dia','0.50" dia','0.75" dia','1.0" dia','1.5" dia'], widthOptions: [], lengthOptions: ['12"','36"','72"','144"'], basePrice: 3.80, priceUnit: 'LB', inStock: true, imageUrl: null, tags: ['brass','machinable','fittings'], minOrderQty: 1, leadTimeDays: 4, allowCutToSize: true, allowProcessing: false },
]

const MOCK_DIVISIONS = [
  { id: 'METALS', name: 'Metals', description: 'Steel, stainless, aluminum, brass & copper', icon: 'metals', productCount: 8 },
  { id: 'PLASTICS', name: 'Plastics', description: 'HDPE, UHMW, acetal, nylon & more', icon: 'plastics', productCount: 2 },
  { id: 'SUPPLIES', name: 'Industrial Supplies', description: 'Abrasives, safety, welding & tooling', icon: 'supplies', productCount: 2 },
  { id: 'OUTLET', name: 'Outlet / Remnants', description: 'Discounted remnant & drop pieces', icon: 'outlet', productCount: 1 },
]

const MOCK_FAMILIES = {
  METALS: ['Carbon Steel', 'Stainless Steel', 'Aluminum', 'HSLA Steel', 'Brass & Copper'],
  PLASTICS: ['Polyethylene', 'Ultra-High MW', 'Acetal', 'Nylon'],
  SUPPLIES: ['Safety', 'Abrasives', 'Welding', 'Tooling'],
  OUTLET: ['Remnants'],
}

const MOCK_FORMS = ['PLATE', 'SHEET', 'BAR', 'ROD', 'TUBE', 'ANGLE', 'CHANNEL', 'BEAM', 'SUPPLY']

const MOCK_AVAILABILITY = {
  'prod-001': [
    { locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 12, weightAvailable: 9792, leadTimeDays: 0 },
    { locationId: 'loc-2', locationName: 'Detroit', qtyAvailable: 5, weightAvailable: 4080, leadTimeDays: 0 },
    { locationId: 'loc-4', locationName: 'Grand Rapids', qtyAvailable: 3, weightAvailable: 2448, leadTimeDays: 1 },
  ],
  'prod-002': [{ locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 40, weightAvailable: 2800, leadTimeDays: 0 }],
  'prod-003': [{ locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 25, weightAvailable: 3675, leadTimeDays: 0 }],
  'prod-004': [{ locationId: 'loc-2', locationName: 'Detroit', qtyAvailable: 8, weightAvailable: 2240, leadTimeDays: 0 }],
  'prod-005': [{ locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 15, weightAvailable: 2820, leadTimeDays: 0 }],
  'prod-006': [{ locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 0, weightAvailable: 0, leadTimeDays: 7 }],
  'prod-007': [{ locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 200, weightAvailable: null, leadTimeDays: 0 }],
  'prod-008': [{ locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 500, weightAvailable: null, leadTimeDays: 0 }],
  'prod-009': [{ locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 2, weightAvailable: 551, leadTimeDays: 0 }],
  'prod-010': [{ locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 6, weightAvailable: 4800, leadTimeDays: 0 }, { locationId: 'loc-2', locationName: 'Detroit', qtyAvailable: 4, weightAvailable: 3200, leadTimeDays: 0 }],
  'prod-011': [{ locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 3, weightAvailable: 1800, leadTimeDays: 0 }],
  'prod-012': [{ locationId: 'loc-1', locationName: 'Jackson', qtyAvailable: 20, weightAvailable: 600, leadTimeDays: 0 }],
}

export async function searchProducts(params = {}) {
  if (USE_MOCK) {
    const { query = '', division, category, family, form, grade, inStockOnly, limit = 50, offset = 0 } = params
    const q = query.toLowerCase()
    let results = [...MOCK_PRODUCTS]
    if (q) results = results.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) ||
      p.grade.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.includes(q))
    )
    if (division) results = results.filter(p => p.division === division)
    if (category) results = results.filter(p => p.category === category)
    if (family) results = results.filter(p => p.family === family)
    if (form) results = results.filter(p => p.form === form)
    if (grade) results = results.filter(p => p.grade.toLowerCase().includes(grade.toLowerCase()))
    if (inStockOnly) results = results.filter(p => p.inStock)
    const total = results.length
    return { data: results.slice(offset, offset + limit), meta: { total, limit, offset }, facets: { divisions: MOCK_DIVISIONS, families: MOCK_FAMILIES, forms: MOCK_FORMS } }
  }
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') qs.set(k, v) })
  const res = await fetch(`${API_BASE}/ecom/catalog?${qs}`)
  if (!res.ok) throw new Error('Catalog search failed')
  return res.json()
}

export async function getProduct(id) {
  if (USE_MOCK) {
    const p = MOCK_PRODUCTS.find(x => x.id === id)
    if (!p) throw new Error('Product not found')
    return { ...p }
  }
  const res = await fetch(`${API_BASE}/ecom/catalog/${id}`)
  if (!res.ok) throw new Error('Failed to fetch product')
  return res.json()
}

export async function getAvailability(productId, locationId) {
  if (USE_MOCK) {
    let avail = MOCK_AVAILABILITY[productId] || []
    if (locationId) avail = avail.filter(a => a.locationId === locationId)
    return { productId, availability: avail }
  }
  const qs = new URLSearchParams({ productId })
  if (locationId) qs.set('locationId', locationId)
  const res = await fetch(`${API_BASE}/ecom/catalog/availability?${qs}`)
  if (!res.ok) throw new Error('Availability check failed')
  return res.json()
}

export async function getDivisions() {
  if (USE_MOCK) return { data: MOCK_DIVISIONS }
  const res = await fetch(`${API_BASE}/ecom/catalog/divisions`)
  if (!res.ok) throw new Error('Failed to fetch divisions')
  return res.json()
}

export async function getFamilies(division) {
  if (USE_MOCK) return { data: MOCK_FAMILIES[division] || [] }
  const res = await fetch(`${API_BASE}/ecom/catalog/families?division=${division}`)
  if (!res.ok) throw new Error('Failed to fetch families')
  return res.json()
}
