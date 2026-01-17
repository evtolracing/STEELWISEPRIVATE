// Priority Levels and Material Configuration

export const PRIORITY_LEVELS = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  RUSH: 'RUSH',
  HOT: 'HOT',
}

export const PRIORITY_CONFIG = {
  [PRIORITY_LEVELS.LOW]: {
    label: 'Low',
    color: '#9E9E9E',
    bgColor: '#F5F5F5',
    sortOrder: 5,
  },
  [PRIORITY_LEVELS.NORMAL]: {
    label: 'Normal',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    sortOrder: 4,
  },
  [PRIORITY_LEVELS.HIGH]: {
    label: 'High',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    sortOrder: 3,
  },
  [PRIORITY_LEVELS.RUSH]: {
    label: 'Rush',
    color: '#F44336',
    bgColor: '#FFEBEE',
    sortOrder: 2,
  },
  [PRIORITY_LEVELS.HOT]: {
    label: 'HOT',
    color: '#D32F2F',
    bgColor: '#FFCDD2',
    sortOrder: 1,
    pulse: true,
  },
}

// Material Ownership Types
export const MATERIAL_OWNERSHIP = {
  CUSTOMER_OWNED: 'CUSTOMER_OWNED',
  HOUSE_OWNED: 'HOUSE_OWNED',
}

export const OWNERSHIP_CONFIG = {
  [MATERIAL_OWNERSHIP.CUSTOMER_OWNED]: {
    label: 'Customer Owned',
    shortLabel: 'Toll',
    description: 'Customer provides material for processing',
    color: '#1976D2',
  },
  [MATERIAL_OWNERSHIP.HOUSE_OWNED]: {
    label: 'House Owned',
    shortLabel: 'Stock',
    description: 'Material from house inventory',
    color: '#388E3C',
  },
}

// Material Forms
export const MATERIAL_FORMS = {
  COIL: 'COIL',
  SHEET: 'SHEET',
  PLATE: 'PLATE',
  BAR: 'BAR',
  BEAM: 'BEAM',
  TUBE: 'TUBE',
  PIPE: 'PIPE',
  SLIT_COIL: 'SLIT_COIL',
  BLANK: 'BLANK',
}

export const MATERIAL_FORM_CONFIG = {
  [MATERIAL_FORMS.COIL]: { label: 'Coil', icon: 'Rotate90DegreesCcw' },
  [MATERIAL_FORMS.SHEET]: { label: 'Sheet', icon: 'CropSquare' },
  [MATERIAL_FORMS.PLATE]: { label: 'Plate', icon: 'CropSquare' },
  [MATERIAL_FORMS.BAR]: { label: 'Bar', icon: 'Straighten' },
  [MATERIAL_FORMS.BEAM]: { label: 'Beam', icon: 'ViewColumn' },
  [MATERIAL_FORMS.TUBE]: { label: 'Tube', icon: 'Circle' },
  [MATERIAL_FORMS.PIPE]: { label: 'Pipe', icon: 'Circle' },
  [MATERIAL_FORMS.SLIT_COIL]: { label: 'Slit Coil', icon: 'Rotate90DegreesCcw' },
  [MATERIAL_FORMS.BLANK]: { label: 'Blank', icon: 'CropSquare' },
}

// Common Steel Grades
export const COMMON_GRADES = [
  'A36',
  'A572-50',
  'A572-60',
  'A529',
  '1008',
  '1010',
  '1018',
  '1020',
  '1045',
  '4140',
  'A653',
  'A792',
  '304 SS',
  '316 SS',
  '409 SS',
  '430 SS',
  'Galvanized',
  'Galvannealed',
  'Aluminized',
]

// Unit of Measure
export const UNITS_OF_MEASURE = {
  LBS: 'LBS',
  TONS: 'TONS',
  KG: 'KG',
  MT: 'MT',
  PIECES: 'PIECES',
  FEET: 'FEET',
  INCHES: 'INCHES',
  METERS: 'METERS',
}

export const UOM_CONFIG = {
  [UNITS_OF_MEASURE.LBS]: { label: 'lbs', fullLabel: 'Pounds' },
  [UNITS_OF_MEASURE.TONS]: { label: 'tons', fullLabel: 'Short Tons' },
  [UNITS_OF_MEASURE.KG]: { label: 'kg', fullLabel: 'Kilograms' },
  [UNITS_OF_MEASURE.MT]: { label: 'MT', fullLabel: 'Metric Tons' },
  [UNITS_OF_MEASURE.PIECES]: { label: 'pcs', fullLabel: 'Pieces' },
  [UNITS_OF_MEASURE.FEET]: { label: 'ft', fullLabel: 'Feet' },
  [UNITS_OF_MEASURE.INCHES]: { label: 'in', fullLabel: 'Inches' },
  [UNITS_OF_MEASURE.METERS]: { label: 'm', fullLabel: 'Meters' },
}

// Alias for backwards compatibility
export const PRIORITY_LEVELS_CONFIG = PRIORITY_CONFIG
