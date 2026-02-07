/**
 * OrderStatusTimeline.jsx — Vertical timeline showing partial fulfillment events.
 *
 * Displays:
 *   - Split creation events
 *   - Shipment status transitions
 *   - Delivery confirmations
 *   - Color-coded by event type
 */
import React from 'react'
import {
  Box,
  Typography,
  Stack,
  Chip,
  Paper,
  LinearProgress,
  alpha,
} from '@mui/material'
import {
  CallSplit as SplitIcon,
  LocalShipping as ShipIcon,
  CheckCircle as DeliveredIcon,
  Schedule as PendingIcon,
  Edit as EditIcon,
  Warning as ExceptionIcon,
  Inventory as PkgIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material'

const EVENT_CONFIG = {
  SPLIT_CREATED:   { label: 'Split Created',   color: '#1976d2', icon: SplitIcon },
  SPLIT_READY:     { label: 'Ready to Ship',   color: '#ed6c02', icon: PkgIcon },
  SPLIT_PACKED:    { label: 'Packed',           color: '#0288d1', icon: PkgIcon },
  SPLIT_SHIPPED:   { label: 'Shipped',          color: '#7b1fa2', icon: ShipIcon },
  SPLIT_IN_TRANSIT:{ label: 'In Transit',       color: '#0288d1', icon: ShipIcon },
  SPLIT_DELIVERED: { label: 'Delivered',         color: '#2e7d32', icon: DeliveredIcon },
  SPLIT_EXCEPTION: { label: 'Exception',         color: '#d32f2f', icon: ExceptionIcon },
  ORDER_UPDATED:   { label: 'Order Updated',    color: '#757575', icon: EditIcon },
  STATUS_CHANGE:   { label: 'Status Changed',   color: '#757575', icon: PendingIcon },
}

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatDateShort = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TimelineEvent({ event, isLast }) {
  const cfg = EVENT_CONFIG[event.action] || EVENT_CONFIG.STATUS_CHANGE
  const Icon = cfg.icon

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {/* Dot + line */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: alpha(cfg.color, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 16, color: cfg.color }} />
        </Box>
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              bgcolor: 'divider',
              mt: 0.5,
              mb: 0.5,
              minHeight: 20,
            }}
          />
        )}
      </Box>

      {/* Content */}
      <Box sx={{ pb: isLast ? 0 : 2, flex: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" fontWeight={600}>
            {cfg.label}
          </Typography>
          {event.splitShipmentId && (
            <Chip label={event.splitShipmentId} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {event.details}
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.disabled">
            {formatDate(event.timestamp)}
          </Typography>
          {event.user && (
            <Typography variant="caption" color="text.disabled">
              by {event.user}
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  )
}

/**
 * @param {object}   props
 * @param {object[]} props.events          — Array of timeline event objects
 * @param {boolean}  [props.loading]
 * @param {number}   [props.shippedPct]    — Overall order % shipped
 * @param {string}   [props.fulfillmentStatus] — UNFULFILLED / PARTIAL / FULFILLED
 * @param {boolean}  [props.compact]
 */
export default function OrderStatusTimeline({
  events = [],
  loading,
  shippedPct = 0,
  fulfillmentStatus,
  compact,
}) {
  if (loading) {
    return (
      <Box sx={{ py: 2 }}>
        <LinearProgress />
      </Box>
    )
  }

  const sorted = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      {/* Header */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <TimelineIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight={700}>
          Fulfillment Timeline
        </Typography>
        {fulfillmentStatus && (
          <Chip
            label={fulfillmentStatus.replace(/_/g, ' ')}
            size="small"
            color={
              fulfillmentStatus === 'FULFILLED' ? 'success' :
              fulfillmentStatus === 'PARTIAL' ? 'warning' : 'default'
            }
          />
        )}
      </Stack>

      {/* Progress bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Overall Fulfillment
          </Typography>
          <Typography variant="caption" fontWeight={600}>
            {shippedPct.toFixed(0)}% shipped
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={shippedPct}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor:
                shippedPct >= 100 ? 'success.main' :
                shippedPct > 0 ? 'warning.main' : 'grey.400',
            },
          }}
        />
      </Box>

      {sorted.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No fulfillment events yet
        </Typography>
      ) : (
        <Box>
          {sorted.map((event, idx) => (
            <TimelineEvent
              key={event.id || idx}
              event={event}
              isLast={idx === sorted.length - 1}
            />
          ))}
        </Box>
      )}
    </Paper>
  )
}
