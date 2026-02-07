/**
 * OrderStatusTimeline — visual vertical timeline showing order status progression.
 */
import React from 'react'
import { Box, Typography, Paper, Chip, Tooltip } from '@mui/material'
import {
  RadioButtonUnchecked, CheckCircle, FiberManualRecord, Schedule,
  DraftsOutlined, RateReview, Verified, CalendarMonth, Engineering,
  LocalShipping, Warehouse, CheckCircleOutline,
} from '@mui/icons-material'

const ALL_STEPS = [
  { key: 'DRAFT',          label: 'Draft',          icon: DraftsOutlined,       color: '#9e9e9e' },
  { key: 'NEEDS_REVIEW',   label: 'Needs Review',   icon: RateReview,           color: '#ff9800' },
  { key: 'CONFIRMED',      label: 'Confirmed',      icon: Verified,             color: '#2196f3' },
  { key: 'SCHEDULED',      label: 'Scheduled',      icon: CalendarMonth,        color: '#9c27b0' },
  { key: 'IN_PROCESS',     label: 'In Process',     icon: Engineering,          color: '#00bcd4' },
  { key: 'READY_TO_SHIP',  label: 'Ready to Ship',  icon: Warehouse,            color: '#ff5722' },
  { key: 'SHIPPED',        label: 'Shipped',         icon: LocalShipping,        color: '#4caf50' },
  { key: 'COMPLETED',      label: 'Completed',       icon: CheckCircleOutline,   color: '#2e7d32' },
]

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function OrderStatusTimeline({ currentStatus, statusHistory = [], compact = false }) {
  const histMap = {}
  statusHistory.forEach(h => { histMap[h.status] = h })

  const currentIdx = ALL_STEPS.findIndex(s => s.key === currentStatus)

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Order Status</Typography>
      <Box sx={{ position: 'relative' }}>
        {ALL_STEPS.map((step, idx) => {
          const isComplete = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isFuture = idx > currentIdx
          const hist = histMap[step.key]
          const StepIcon = step.icon
          const isLast = idx === ALL_STEPS.length - 1

          return (
            <Box key={step.key} sx={{ display: 'flex', gap: 1.5, position: 'relative', pb: isLast ? 0 : (compact ? 1 : 2) }}>
              {/* Vertical line connector */}
              {!isLast && (
                <Box sx={{
                  position: 'absolute', left: 15, top: 32, bottom: 0, width: 2,
                  bgcolor: isComplete ? step.color : 'divider',
                }} />
              )}

              {/* Icon */}
              <Box sx={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: isCurrent ? step.color : isComplete ? step.color : 'transparent',
                border: 2, borderColor: isFuture ? 'divider' : step.color,
                flexShrink: 0, zIndex: 1, transition: 'all 0.3s',
              }}>
                {isComplete ? (
                  <CheckCircle sx={{ fontSize: 20, color: '#fff' }} />
                ) : isCurrent ? (
                  <StepIcon sx={{ fontSize: 18, color: '#fff' }} />
                ) : (
                  <RadioButtonUnchecked sx={{ fontSize: 18, color: 'divider' }} />
                )}
              </Box>

              {/* Content */}
              <Box sx={{ pt: 0.3, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={isCurrent ? 700 : isComplete ? 500 : 400}
                  color={isFuture ? 'text.disabled' : 'text.primary'}>
                  {step.label}
                  {isCurrent && <Chip label="Current" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem', bgcolor: step.color, color: '#fff' }} />}
                </Typography>

                {hist && (
                  <Box sx={{ mt: 0.2 }}>
                    <Typography variant="caption" color="text.secondary">{fmtDate(hist.at || hist.date)}</Typography>
                    {hist.by && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>by {hist.by}</Typography>}
                    {hist.note && <Typography variant="caption" display="block" color="text.secondary" sx={{ fontStyle: 'italic' }}>{hist.note}</Typography>}
                  </Box>
                )}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Paper>
  )
}
