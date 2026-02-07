/**
 * PartialFulfillmentBanner.jsx — Inline banner showing fulfillment progress
 * with remaining quantity / weight indicators.
 *
 * Designed for:
 *  - Order detail pages
 *  - Packaging page job cards
 *  - Shipping desk shipment cards
 *  - Customer-facing order status
 */
import React from 'react'
import {
  Box,
  Typography,
  Stack,
  Chip,
  LinearProgress,
  Tooltip,
  alpha,
} from '@mui/material'
import {
  CallSplit as SplitIcon,
  CheckCircle as CompleteIcon,
  HourglassBottom as PendingIcon,
  Warning as PartialIcon,
  Scale as WeightIcon,
  Numbers as QtyIcon,
  LocalShipping as ShipIcon,
} from '@mui/icons-material'
import {
  ORDER_FULFILLMENT_STATUS,
  lineShippedPct,
} from '../../services/splitShipmentApi'

const FULFILLMENT_CONFIG = {
  [ORDER_FULFILLMENT_STATUS.UNFULFILLED]: {
    label: 'Unfulfilled',
    color: '#9e9e9e',
    chipColor: 'default',
    icon: PendingIcon,
  },
  [ORDER_FULFILLMENT_STATUS.PARTIAL]: {
    label: 'Partially Shipped',
    color: '#ed6c02',
    chipColor: 'warning',
    icon: PartialIcon,
  },
  [ORDER_FULFILLMENT_STATUS.FULFILLED]: {
    label: 'Fully Shipped',
    color: '#2e7d32',
    chipColor: 'success',
    icon: CompleteIcon,
  },
  [ORDER_FULFILLMENT_STATUS.OVERSHIPPED]: {
    label: 'Over-Shipped',
    color: '#d32f2f',
    chipColor: 'error',
    icon: PartialIcon,
  },
}

const formatWeight = (lbs) => {
  if (!lbs) return '0 lbs'
  return lbs >= 1000 ? `${(lbs / 1000).toFixed(1)}k lbs` : `${lbs} lbs`
}

/**
 * Line-level mini progress row
 */
function LineMiniBar({ line }) {
  const pct = lineShippedPct(line)
  return (
    <Tooltip
      title={`Line #${line.lineNumber}: ${line.qtyShipped}/${line.qtyOrdered} shipped (${line.qtyRemaining} remaining)`}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Typography variant="caption" noWrap sx={{ minWidth: 50 }}>
          #{line.lineNumber}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              bgcolor: pct >= 100 ? 'success.main' : pct > 0 ? 'warning.main' : 'grey.400',
            },
          }}
        />
        <Typography variant="caption" fontWeight={600} sx={{ minWidth: 30, textAlign: 'right' }}>
          {pct.toFixed(0)}%
        </Typography>
      </Box>
    </Tooltip>
  )
}

/**
 * @param {object}   props
 * @param {object}   props.order             — Order with .lines[], .fulfillmentStatus
 * @param {number}   props.shippedPct        — Overall % shipped
 * @param {object}   props.remaining         — { totalQtyRemaining, totalWeightRemaining }
 * @param {number}   [props.splitCount]      — Number of split shipments created
 * @param {boolean}  [props.compact]         — Compact mode
 * @param {boolean}  [props.showLines]       — Show per-line progress bars
 * @param {boolean}  [props.customerFacing]  — Simpler display for customers
 */
export default function PartialFulfillmentBanner({
  order,
  shippedPct = 0,
  remaining = {},
  splitCount = 0,
  compact = false,
  showLines = false,
  customerFacing = false,
}) {
  if (!order) return null

  const status = order.fulfillmentStatus || ORDER_FULFILLMENT_STATUS.UNFULFILLED
  const cfg = FULFILLMENT_CONFIG[status] || FULFILLMENT_CONFIG.UNFULFILLED
  const Icon = cfg.icon

  // Customer-facing: simplified
  if (customerFacing) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: status === 'PARTIAL' ? 'warning.main' : status === 'FULFILLED' ? 'success.main' : 'divider',
          bgcolor: alpha(cfg.color, 0.04),
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Icon sx={{ color: cfg.color }} />
          <Typography variant="subtitle2" fontWeight={700}>
            {status === 'PARTIAL'
              ? `${shippedPct.toFixed(0)}% of your order has shipped`
              : status === 'FULFILLED'
                ? 'Your order is fully shipped!'
                : 'Your order is being prepared'}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={shippedPct}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: cfg.color },
          }}
        />
        {status === 'PARTIAL' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {splitCount} shipment{splitCount !== 1 ? 's' : ''} sent so far •{' '}
            {remaining.totalQtyRemaining || 0} pcs remaining
          </Typography>
        )}
      </Box>
    )
  }

  // Internal: full detail
  return (
    <Box
      sx={{
        p: compact ? 1.5 : 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(cfg.color, 0.3),
        bgcolor: alpha(cfg.color, 0.04),
      }}
    >
      {/* Header row */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Icon sx={{ color: cfg.color, fontSize: compact ? 18 : 22 }} />
        <Typography variant={compact ? 'body2' : 'subtitle2'} fontWeight={700}>
          {cfg.label}
        </Typography>
        <Chip label={`${shippedPct.toFixed(0)}%`} size="small" color={cfg.chipColor} />
        {splitCount > 0 && (
          <Chip
            icon={<SplitIcon />}
            label={`${splitCount} split${splitCount !== 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
          />
        )}
      </Stack>

      {/* Progress */}
      <LinearProgress
        variant="determinate"
        value={shippedPct}
        sx={{
          height: compact ? 6 : 8,
          borderRadius: 4,
          bgcolor: 'grey.200',
          mb: 1,
          '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: cfg.color },
        }}
      />

      {/* Stats */}
      <Stack direction="row" spacing={compact ? 2 : 3} flexWrap="wrap">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <QtyIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Box>
            <Typography variant="caption" color="text.secondary">Remaining</Typography>
            <Typography variant={compact ? 'caption' : 'body2'} fontWeight={600}>
              {remaining.totalQtyRemaining || 0} pcs
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <WeightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Box>
            <Typography variant="caption" color="text.secondary">Weight Remaining</Typography>
            <Typography variant={compact ? 'caption' : 'body2'} fontWeight={600}>
              {formatWeight(remaining.totalWeightRemaining || 0)}
            </Typography>
          </Box>
        </Box>
        {splitCount > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ShipIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">Shipments</Typography>
              <Typography variant={compact ? 'caption' : 'body2'} fontWeight={600}>
                {splitCount}
              </Typography>
            </Box>
          </Box>
        )}
      </Stack>

      {/* Per-line breakdown */}
      {showLines && order.lines?.length > 0 && (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            LINE PROGRESS
          </Typography>
          <Stack spacing={0.5}>
            {order.lines.map((line) => (
              <LineMiniBar key={line.id} line={line} />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
