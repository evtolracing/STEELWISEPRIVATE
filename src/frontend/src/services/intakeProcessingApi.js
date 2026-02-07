/**
 * Processing API — Order Intake Module
 * List processing operations, routing templates, by division + machine capabilities.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const MOCK_PROCESSES = [
  { id: 'proc-001', code: 'SAW-CUT', name: 'Saw Cut to Length', division: 'METALS', type: 'CUT', estimatedMinutes: 15, pricePerOp: 12.00, priceUnit: 'CUT', machines: ['SAW-1', 'SAW-2'], params: [{ key: 'cutLength', label: 'Cut Length', unit: 'in', required: true }, { key: 'qty', label: 'Number of Cuts', unit: 'ea', required: true }] },
  { id: 'proc-002', code: 'SHEAR', name: 'Shear to Size', division: 'METALS', type: 'CUT', estimatedMinutes: 10, pricePerOp: 8.50, priceUnit: 'CUT', machines: ['SHEAR-1'], params: [{ key: 'width', label: 'Finished Width', unit: 'in', required: true }, { key: 'length', label: 'Finished Length', unit: 'in', required: true }] },
  { id: 'proc-003', code: 'PLASMA', name: 'Plasma Cut (Shape)', division: 'METALS', type: 'CUT', estimatedMinutes: 30, pricePerOp: 0.0, priceUnit: 'IN', machines: ['PLASMA-1'], params: [{ key: 'cutInches', label: 'Total Cut Inches', unit: 'in', required: true }, { key: 'pierces', label: 'Number of Pierces', unit: 'ea', required: false }] },
  { id: 'proc-004', code: 'BRAKE-BEND', name: 'Press Brake Bend', division: 'METALS', type: 'FORM', estimatedMinutes: 20, pricePerOp: 18.00, priceUnit: 'BEND', machines: ['BRAKE-1', 'BRAKE-2'], params: [{ key: 'bends', label: 'Number of Bends', unit: 'ea', required: true }, { key: 'angle', label: 'Bend Angle', unit: 'deg', required: false }] },
  { id: 'proc-005', code: 'ROLL', name: 'Plate Roll', division: 'METALS', type: 'FORM', estimatedMinutes: 45, pricePerOp: 35.00, priceUnit: 'EA', machines: ['ROLL-1'], params: [{ key: 'diameter', label: 'Inside Diameter', unit: 'in', required: true }] },
  { id: 'proc-006', code: 'DRILL', name: 'Drill Holes', division: 'METALS', type: 'MACHINE', estimatedMinutes: 5, pricePerOp: 4.50, priceUnit: 'HOLE', machines: ['DRILL-1', 'MILL-1'], params: [{ key: 'holeDia', label: 'Hole Diameter', unit: 'in', required: true }, { key: 'holeQty', label: 'Number of Holes', unit: 'ea', required: true }] },
  { id: 'proc-007', code: 'GRIND', name: 'Surface Grind', division: 'METALS', type: 'FINISH', estimatedMinutes: 60, pricePerOp: 55.00, priceUnit: 'SQFT', machines: ['GRINDER-1'], params: [{ key: 'sqft', label: 'Area (sq ft)', unit: 'sqft', required: true }, { key: 'finish', label: 'Surface Finish', unit: 'Ra', required: false }] },
  { id: 'proc-008', code: 'PLAS-SAW', name: 'Plastic Saw Cut', division: 'PLASTICS', type: 'CUT', estimatedMinutes: 10, pricePerOp: 8.00, priceUnit: 'CUT', machines: ['PSAW-1'], params: [{ key: 'cutLength', label: 'Cut Length', unit: 'in', required: true }, { key: 'qty', label: 'Number of Cuts', unit: 'ea', required: true }] },
  { id: 'proc-009', code: 'PLAS-ROUTE', name: 'CNC Route (Plastic)', division: 'PLASTICS', type: 'MACHINE', estimatedMinutes: 40, pricePerOp: 0.0, priceUnit: 'MIN', machines: ['CNC-P1'], params: [{ key: 'minutes', label: 'Est. Machine Minutes', unit: 'min', required: true }] },
  { id: 'proc-010', code: 'DEBURR', name: 'Deburr / Edge Finish', division: 'METALS', type: 'FINISH', estimatedMinutes: 15, pricePerOp: 6.00, priceUnit: 'EA', machines: ['DEBURR-1'], params: [] },
]

const MOCK_TEMPLATES = [
  { id: 'tpl-001', name: 'Plate – Cut to Size', division: 'METALS', steps: [{ processId: 'proc-002', seq: 1 }, { processId: 'proc-010', seq: 2 }] },
  { id: 'tpl-002', name: 'Plate – Cut + Bend', division: 'METALS', steps: [{ processId: 'proc-002', seq: 1 }, { processId: 'proc-004', seq: 2 }, { processId: 'proc-010', seq: 3 }] },
  { id: 'tpl-003', name: 'Plate – Plasma Profile', division: 'METALS', steps: [{ processId: 'proc-003', seq: 1 }, { processId: 'proc-006', seq: 2 }, { processId: 'proc-010', seq: 3 }] },
  { id: 'tpl-004', name: 'Plastic – Cut to Length', division: 'PLASTICS', steps: [{ processId: 'proc-008', seq: 1 }] },
  { id: 'tpl-005', name: 'Plastic – CNC Profile', division: 'PLASTICS', steps: [{ processId: 'proc-009', seq: 1 }] },
  { id: 'tpl-006', name: 'Bar – Saw Cut to Length', division: 'METALS', steps: [{ processId: 'proc-001', seq: 1 }] },
]

const USE_MOCK = true

export async function listProcesses({ division, type } = {}) {
  if (USE_MOCK) {
    let list = [...MOCK_PROCESSES]
    if (division) list = list.filter(p => p.division === division)
    if (type) list = list.filter(p => p.type === type)
    return { data: list }
  }
  const params = new URLSearchParams()
  if (division) params.set('division', division)
  if (type) params.set('type', type)
  const res = await fetch(`${API_BASE}/processing/operations?${params}`)
  if (!res.ok) throw new Error('Failed to list processes')
  return res.json()
}

export async function listTemplates({ division } = {}) {
  if (USE_MOCK) {
    let list = [...MOCK_TEMPLATES]
    if (division) list = list.filter(t => t.division === division)
    return { data: list.map(t => ({ ...t, steps: t.steps.map(s => ({ ...s, process: MOCK_PROCESSES.find(p => p.id === s.processId) })) })) }
  }
  const res = await fetch(`${API_BASE}/processing/templates${division ? `?division=${division}` : ''}`)
  if (!res.ok) throw new Error('Failed to list templates')
  return res.json()
}

export async function getProcessById(id) {
  if (USE_MOCK) {
    return MOCK_PROCESSES.find(p => p.id === id) || null
  }
  const res = await fetch(`${API_BASE}/processing/operations/${id}`)
  if (!res.ok) throw new Error('Failed to fetch process')
  return res.json()
}
