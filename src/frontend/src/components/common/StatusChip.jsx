import { Chip } from '@mui/material'

const statusConfig = {
  // Unit/Coil statuses
  AVAILABLE: { color: 'success', label: 'Available' },
  ALLOCATED: { color: 'info', label: 'Allocated' },
  ON_HOLD: { color: 'warning', label: 'On Hold' },
  SHIPPED: { color: 'default', label: 'Shipped' },
  CONSUMED: { color: 'default', label: 'Consumed' },
  SCRAPPED: { color: 'error', label: 'Scrapped' },
  
  // Order statuses
  DRAFT: { color: 'default', label: 'Draft' },
  PENDING: { color: 'warning', label: 'Pending' },
  CONFIRMED: { color: 'info', label: 'Confirmed' },
  IN_PROGRESS: { color: 'primary', label: 'In Progress' },
  COMPLETED: { color: 'success', label: 'Completed' },
  CANCELLED: { color: 'error', label: 'Cancelled' },
  
  // Shipment statuses
  LOADING: { color: 'warning', label: 'Loading' },
  IN_TRANSIT: { color: 'info', label: 'In Transit' },
  DELIVERED: { color: 'success', label: 'Delivered' },
  
  // Work order statuses
  SCHEDULED: { color: 'info', label: 'Scheduled' },
  RUNNING: { color: 'primary', label: 'Running' },
  PAUSED: { color: 'warning', label: 'Paused' },
  
  // Priority levels
  URGENT: { color: 'error', label: 'Urgent' },
  HIGH: { color: 'warning', label: 'High' },
  NORMAL: { color: 'info', label: 'Normal' },
  LOW: { color: 'default', label: 'Low' },
  
  // QC results
  PASS: { color: 'success', label: 'Pass' },
  FAIL: { color: 'error', label: 'Fail' },
  
  // Order types
  PURCHASE: { color: 'primary', label: 'Purchase', variant: 'outlined' },
  SALES: { color: 'success', label: 'Sales', variant: 'outlined' },
  TRANSFER: { color: 'info', label: 'Transfer', variant: 'outlined' },
}

export default function StatusChip({ status, size = 'small', ...props }) {
  const config = statusConfig[status] || { color: 'default', label: status }
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant={config.variant || 'filled'}
      {...props}
    />
  )
}
