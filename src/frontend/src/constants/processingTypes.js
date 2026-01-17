// Processing Types and Work Center Configuration

export const PROCESSING_TYPES = {
  SLITTING: 'SLITTING',
  CUT_TO_LENGTH: 'CUT_TO_LENGTH',
  SHEARING: 'SHEARING',
  LEVELING: 'LEVELING',
  SAWING: 'SAWING',
  BLANKING: 'BLANKING',
  WELDING: 'WELDING',
  MULTI_STEP: 'MULTI_STEP',
}

export const PROCESSING_TYPE_CONFIG = {
  [PROCESSING_TYPES.SLITTING]: {
    label: 'Slitting',
    description: 'Slit coil to narrower widths',
    icon: 'ContentCut',
    color: '#E91E63',
    defaultWorkCenter: 'SLITTER',
  },
  [PROCESSING_TYPES.CUT_TO_LENGTH]: {
    label: 'Cut-to-Length',
    description: 'Cut coil into flat sheets',
    icon: 'Straighten',
    color: '#9C27B0',
    defaultWorkCenter: 'CTL_LINE',
  },
  [PROCESSING_TYPES.SHEARING]: {
    label: 'Shearing',
    description: 'Shear sheets to size',
    icon: 'Carpenter',
    color: '#673AB7',
    defaultWorkCenter: 'SHEAR',
  },
  [PROCESSING_TYPES.LEVELING]: {
    label: 'Leveling',
    description: 'Flatten and level material',
    icon: 'AlignVerticalBottom',
    color: '#3F51B5',
    defaultWorkCenter: 'LEVELER',
  },
  [PROCESSING_TYPES.SAWING]: {
    label: 'Sawing',
    description: 'Saw bars, beams, or plate',
    icon: 'Handyman',
    color: '#2196F3',
    defaultWorkCenter: 'SAW',
  },
  [PROCESSING_TYPES.BLANKING]: {
    label: 'Blanking',
    description: 'Cut blanks from sheet',
    icon: 'GridOn',
    color: '#00BCD4',
    defaultWorkCenter: 'PRESS',
  },
  [PROCESSING_TYPES.WELDING]: {
    label: 'Welding/Fab',
    description: 'Welding and fabrication',
    icon: 'FlashOn',
    color: '#FF5722',
    defaultWorkCenter: 'WELDER',
  },
  [PROCESSING_TYPES.MULTI_STEP]: {
    label: 'Multi-Step',
    description: 'Multiple processing steps',
    icon: 'AccountTree',
    color: '#795548',
    defaultWorkCenter: null,
  },
}

// Work Center Types
export const WORK_CENTER_TYPES = {
  SLITTER: 'SLITTER',
  CTL_LINE: 'CTL_LINE',
  SHEAR: 'SHEAR',
  SAW: 'SAW',
  LEVELER: 'LEVELER',
  PRESS: 'PRESS',
  WELDER: 'WELDER',
  INSPECTION: 'INSPECTION',
  PACKAGING: 'PACKAGING',
}

export const WORK_CENTER_TYPE_CONFIG = {
  [WORK_CENTER_TYPES.SLITTER]: {
    label: 'Slitter',
    icon: 'ContentCut',
    color: '#E91E63',
    processingTypes: [PROCESSING_TYPES.SLITTING],
  },
  [WORK_CENTER_TYPES.CTL_LINE]: {
    label: 'CTL Line',
    icon: 'Straighten',
    color: '#9C27B0',
    processingTypes: [PROCESSING_TYPES.CUT_TO_LENGTH, PROCESSING_TYPES.LEVELING],
  },
  [WORK_CENTER_TYPES.SHEAR]: {
    label: 'Shear',
    icon: 'Carpenter',
    color: '#673AB7',
    processingTypes: [PROCESSING_TYPES.SHEARING],
  },
  [WORK_CENTER_TYPES.SAW]: {
    label: 'Saw',
    icon: 'Handyman',
    color: '#2196F3',
    processingTypes: [PROCESSING_TYPES.SAWING],
  },
  [WORK_CENTER_TYPES.LEVELER]: {
    label: 'Leveler',
    icon: 'AlignVerticalBottom',
    color: '#3F51B5',
    processingTypes: [PROCESSING_TYPES.LEVELING],
  },
  [WORK_CENTER_TYPES.PRESS]: {
    label: 'Press/Blanker',
    icon: 'GridOn',
    color: '#00BCD4',
    processingTypes: [PROCESSING_TYPES.BLANKING],
  },
  [WORK_CENTER_TYPES.WELDER]: {
    label: 'Welder',
    icon: 'FlashOn',
    color: '#FF5722',
    processingTypes: [PROCESSING_TYPES.WELDING],
  },
  [WORK_CENTER_TYPES.INSPECTION]: {
    label: 'Inspection',
    icon: 'FactCheck',
    color: '#9C27B0',
    processingTypes: [],
  },
  [WORK_CENTER_TYPES.PACKAGING]: {
    label: 'Packaging',
    icon: 'Inventory2',
    color: '#00BCD4',
    processingTypes: [],
  },
}

// Default work centers for demo/mock data
export const DEFAULT_WORK_CENTERS = [
  { id: 'wc_slitter1', name: 'Slitter #1', type: WORK_CENTER_TYPES.SLITTER, capacity: 50000, status: 'ACTIVE' },
  { id: 'wc_slitter2', name: 'Slitter #2', type: WORK_CENTER_TYPES.SLITTER, capacity: 40000, status: 'ACTIVE' },
  { id: 'wc_ctl1', name: 'CTL Line #1', type: WORK_CENTER_TYPES.CTL_LINE, capacity: 30000, status: 'ACTIVE' },
  { id: 'wc_shear1', name: 'Shear #1', type: WORK_CENTER_TYPES.SHEAR, capacity: 20000, status: 'ACTIVE' },
  { id: 'wc_saw1', name: 'Saw #1', type: WORK_CENTER_TYPES.SAW, capacity: 15000, status: 'ACTIVE' },
  { id: 'wc_leveler1', name: 'Leveler #1', type: WORK_CENTER_TYPES.LEVELER, capacity: 25000, status: 'ACTIVE' },
  { id: 'wc_pack1', name: 'Packaging #1', type: WORK_CENTER_TYPES.PACKAGING, capacity: 100000, status: 'ACTIVE' },
]

// Work center status
export const WORK_CENTER_STATUS = {
  ACTIVE: 'ACTIVE',
  RUNNING: 'RUNNING',
  IDLE: 'IDLE',
  MAINTENANCE: 'MAINTENANCE',
  OFFLINE: 'OFFLINE',
}

// Helper to get processing type label
export const getProcessingTypeLabel = (type) => {
  return PROCESSING_TYPE_CONFIG[type]?.label || type
}
