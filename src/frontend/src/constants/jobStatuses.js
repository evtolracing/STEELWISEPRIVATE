// Job Status Constants and Configuration
export const JOB_STATUSES = {
  ORDERED: 'ORDERED',
  RECEIVED: 'RECEIVED',
  SCHEDULED: 'SCHEDULED',
  IN_PROCESS: 'IN_PROCESS',
  WAITING_QC: 'WAITING_QC',
  PACKAGING: 'PACKAGING',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  BILLED: 'BILLED',
}

export const JOB_STATUS_CONFIG = {
  [JOB_STATUSES.ORDERED]: {
    label: 'Ordered',
    color: '#9E9E9E',
    bgColor: '#F5F5F5',
    icon: 'Receipt',
    next: [JOB_STATUSES.RECEIVED, JOB_STATUSES.SCHEDULED],
    kanbanColumn: 0,
  },
  [JOB_STATUSES.RECEIVED]: {
    label: 'Received',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    icon: 'Inventory',
    next: [JOB_STATUSES.SCHEDULED],
    kanbanColumn: 1,
  },
  [JOB_STATUSES.SCHEDULED]: {
    label: 'Scheduled',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    icon: 'Schedule',
    next: [JOB_STATUSES.IN_PROCESS],
    kanbanColumn: 2,
  },
  [JOB_STATUSES.IN_PROCESS]: {
    label: 'In Process',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    icon: 'PrecisionManufacturing',
    next: [JOB_STATUSES.WAITING_QC, JOB_STATUSES.PACKAGING],
    kanbanColumn: 3,
  },
  [JOB_STATUSES.WAITING_QC]: {
    label: 'Waiting QC',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    icon: 'FactCheck',
    next: [JOB_STATUSES.PACKAGING, JOB_STATUSES.IN_PROCESS],
    kanbanColumn: 3,
  },
  [JOB_STATUSES.PACKAGING]: {
    label: 'Packaging',
    color: '#00BCD4',
    bgColor: '#E0F7FA',
    icon: 'Inventory2',
    next: [JOB_STATUSES.READY_TO_SHIP],
    kanbanColumn: 4,
  },
  [JOB_STATUSES.READY_TO_SHIP]: {
    label: 'Ready to Ship',
    color: '#3F51B5',
    bgColor: '#E8EAF6',
    icon: 'LocalShipping',
    next: [JOB_STATUSES.SHIPPED],
    kanbanColumn: 5,
  },
  [JOB_STATUSES.SHIPPED]: {
    label: 'Shipped',
    color: '#009688',
    bgColor: '#E0F2F1',
    icon: 'LocalShipping',
    next: [JOB_STATUSES.COMPLETED],
    kanbanColumn: 6,
  },
  [JOB_STATUSES.COMPLETED]: {
    label: 'Completed',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    icon: 'CheckCircle',
    next: [JOB_STATUSES.BILLED],
    kanbanColumn: 7,
  },
  [JOB_STATUSES.BILLED]: {
    label: 'Billed',
    color: '#607D8B',
    bgColor: '#ECEFF1',
    icon: 'Paid',
    next: [],
    kanbanColumn: 7,
  },
}

// Kanban board columns for Order Board view
export const KANBAN_COLUMNS = [
  { id: 'new', title: 'New Orders', statuses: [JOB_STATUSES.ORDERED] },
  { id: 'received', title: 'Received', statuses: [JOB_STATUSES.RECEIVED] },
  { id: 'scheduled', title: 'Scheduled', statuses: [JOB_STATUSES.SCHEDULED] },
  { id: 'processing', title: 'In Process', statuses: [JOB_STATUSES.IN_PROCESS, JOB_STATUSES.WAITING_QC] },
  { id: 'packaging', title: 'Packaging', statuses: [JOB_STATUSES.PACKAGING] },
  { id: 'shipping', title: 'Ready to Ship', statuses: [JOB_STATUSES.READY_TO_SHIP] },
  { id: 'completed', title: 'Completed', statuses: [JOB_STATUSES.SHIPPED, JOB_STATUSES.COMPLETED, JOB_STATUSES.BILLED] },
]

// Status transition validation
export function canTransitionTo(currentStatus, targetStatus) {
  const config = JOB_STATUS_CONFIG[currentStatus]
  return config?.next?.includes(targetStatus) || false
}

// Get allowed next statuses
export function getNextStatuses(currentStatus) {
  return JOB_STATUS_CONFIG[currentStatus]?.next || []
}
