// Job Status Constants and Configuration
import {
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  PrecisionManufacturing as PrecisionManufacturingIcon,
  FactCheck as FactCheckIcon,
  Inventory2 as Inventory2Icon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
} from '@mui/icons-material'

export const JOB_STATUSES = {
  ORDERED: 'ORDERED',
  SCHEDULED: 'SCHEDULED',
  IN_PROCESS: 'IN_PROCESS',
  WAITING_QC: 'WAITING_QC',
  PACKAGING: 'PACKAGING',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
}

export const JOB_STATUS_CONFIG = {
  [JOB_STATUSES.ORDERED]: {
    label: 'Ordered',
    color: '#9E9E9E',
    bgColor: '#F5F5F5',
    icon: ReceiptIcon,
    next: [JOB_STATUSES.SCHEDULED],
    kanbanColumn: 0,
  },
  [JOB_STATUSES.SCHEDULED]: {
    label: 'Scheduled',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    icon: ScheduleIcon,
    next: [JOB_STATUSES.IN_PROCESS, JOB_STATUSES.ON_HOLD],
    kanbanColumn: 1,
  },
  [JOB_STATUSES.IN_PROCESS]: {
    label: 'In Process',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    icon: PrecisionManufacturingIcon,
    next: [JOB_STATUSES.WAITING_QC, JOB_STATUSES.PACKAGING, JOB_STATUSES.ON_HOLD],
    kanbanColumn: 2,
  },
  [JOB_STATUSES.WAITING_QC]: {
    label: 'Waiting QC',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    icon: FactCheckIcon,
    next: [JOB_STATUSES.PACKAGING, JOB_STATUSES.IN_PROCESS],
    kanbanColumn: 2,
  },
  [JOB_STATUSES.PACKAGING]: {
    label: 'Packaging',
    color: '#00BCD4',
    bgColor: '#E0F7FA',
    icon: Inventory2Icon,
    next: [JOB_STATUSES.READY_TO_SHIP],
    kanbanColumn: 3,
  },
  [JOB_STATUSES.READY_TO_SHIP]: {
    label: 'Ready to Ship',
    color: '#3F51B5',
    bgColor: '#E8EAF6',
    icon: LocalShippingIcon,
    next: [JOB_STATUSES.SHIPPED],
    kanbanColumn: 4,
  },
  [JOB_STATUSES.SHIPPED]: {
    label: 'Shipped',
    color: '#009688',
    bgColor: '#E0F2F1',
    icon: LocalShippingIcon,
    next: [JOB_STATUSES.COMPLETED],
    kanbanColumn: 5,
  },
  [JOB_STATUSES.COMPLETED]: {
    label: 'Completed',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    icon: CheckCircleIcon,
    next: [],
    kanbanColumn: 6,
  },
  [JOB_STATUSES.CANCELLED]: {
    label: 'Cancelled',
    color: '#F44336',
    bgColor: '#FFEBEE',
    icon: CancelIcon,
    next: [],
    kanbanColumn: 7,
  },
  [JOB_STATUSES.ON_HOLD]: {
    label: 'On Hold',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    icon: PauseIcon,
    next: [JOB_STATUSES.SCHEDULED, JOB_STATUSES.IN_PROCESS],
    kanbanColumn: 7,
  },
}

// Kanban board columns for Order Board view
export const KANBAN_COLUMNS = [
  { id: 'new', title: 'New Orders', statuses: [JOB_STATUSES.ORDERED] },
  { id: 'planned', title: 'Planned Jobs', statuses: [JOB_STATUSES.SCHEDULED] },
  { id: 'processing', title: 'In Process', statuses: [JOB_STATUSES.IN_PROCESS, JOB_STATUSES.WAITING_QC] },
  { id: 'packaging', title: 'Packaging', statuses: [JOB_STATUSES.PACKAGING] },
  { id: 'shipping', title: 'Ready to Ship', statuses: [JOB_STATUSES.READY_TO_SHIP] },
  { id: 'completed', title: 'Completed', statuses: [JOB_STATUSES.SHIPPED, JOB_STATUSES.COMPLETED] },
  { id: 'other', title: 'Other', statuses: [JOB_STATUSES.ON_HOLD, JOB_STATUSES.CANCELLED] },
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
