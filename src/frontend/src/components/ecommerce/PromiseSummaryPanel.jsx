/**
 * PromiseSummaryPanel — Full promise summary for Product detail / Cart / Checkout.
 *
 * Props:
 *   evaluation: PromiseEvaluation (single or overall)
 *   lineEvaluations: PromiseEvaluation[] (optional, for cart-level)
 *   locationName: string
 *   compact: boolean (default false)
 *   onApplyEarliestAll: () => void (optional, for cart "apply earliest to all" action)
 */
import React from 'react'
import {
  Paper, Box, Typography, Divider, Chip, Button, Alert, Stack,
} from '@mui/material'
import {
  LocalShipping, Schedule, CalendarToday, CheckCircle,
  Warning, ErrorOutline, FlashOn,
} from '@mui/icons-material'
import PromiseBadge from './PromiseBadge'

const STATUS_ICON = {
  GREEN: <CheckCircle sx={{ fontSize: 20, color: 'success.main' }} />,
  YELLOW: <Warning sx={{ fontSize: 20, color: 'warning.main' }} />,
  RED: <ErrorOutline sx={{ fontSize: 20, color: 'error.main' }} />,
}

function formatTime12(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDateShort(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function PromiseSummaryPanel({
  evaluation, lineEvaluations, locationName, compact = false, onApplyEarliestAll,
}) {
  if (!evaluation) return null

  const { status, message, cutoffLocal, cutoffMet, earliestShipDate, requestedShipDate, reasons, capacityNote } = evaluation

  // Compute worst status from line evaluations
  const worstLine = lineEvaluations?.length > 0
    ? lineEvaluations.reduce((worst, ev) => {
        const rank = { RED: 3, YELLOW: 2, GREEN: 1 }
        return (rank[ev.status] || 0) > (rank[worst.status] || 0) ? ev : worst
      }, lineEvaluations[0])
    : null

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
        {STATUS_ICON[status]}
        <Typography variant="body2" fontWeight={500}>{message}</Typography>
        {cutoffLocal && (
          <Typography variant="caption" color="text.secondary">
            Cutoff: {formatTime12(cutoffLocal)}
          </Typography>
        )}
      </Box>
    )
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Header bar */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25,
          bgcolor: status === 'GREEN' ? '#f0fdf4' : status === 'YELLOW' ? '#fffbeb' : '#fef2f2',
          borderBottom: 1, borderColor: 'divider',
        }}
      >
        <LocalShipping sx={{ fontSize: 20, color: status === 'GREEN' ? 'success.main' : status === 'YELLOW' ? 'warning.main' : 'error.main' }} />
        <Typography variant="subtitle2" fontWeight={700}>Shipping Promise</Typography>
        <Box sx={{ ml: 'auto' }}>
          <PromiseBadge evaluation={evaluation} size="small" />
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Cutoff line */}
        {cutoffLocal && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Schedule sx={{ fontSize: 16, color: cutoffMet ? 'success.main' : 'error.main' }} />
            <Typography variant="body2">
              Branch cutoff: <b>{formatTime12(cutoffLocal)}</b> local
            </Typography>
            <Chip
              label={cutoffMet ? 'Open' : 'Passed'}
              size="small"
              color={cutoffMet ? 'success' : 'error'}
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
            />
          </Box>
        )}

        {/* Dates */}
        <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
          {requestedShipDate && (
            <Box>
              <Typography variant="caption" color="text.secondary">Requested</Typography>
              <Typography variant="body2" fontWeight={500}>
                <CalendarToday sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'text-bottom' }} />
                {formatDateShort(requestedShipDate)}
              </Typography>
            </Box>
          )}
          {earliestShipDate && (
            <Box>
              <Typography variant="caption" color="text.secondary">Earliest Available</Typography>
              <Typography variant="body2" fontWeight={600} color={status === 'GREEN' ? 'success.main' : 'primary.main'}>
                <FlashOn sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'text-bottom' }} />
                {formatDateShort(earliestShipDate)}
              </Typography>
            </Box>
          )}
          {locationName && (
            <Box>
              <Typography variant="caption" color="text.secondary">Branch</Typography>
              <Typography variant="body2" fontWeight={500}>{locationName}</Typography>
            </Box>
          )}
        </Box>

        {/* Capacity warning */}
        {capacityNote && (
          <Alert severity="warning" variant="outlined" sx={{ py: 0, mb: 1, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
            {capacityNote}
          </Alert>
        )}

        {/* Reasons (for non-green) */}
        {status !== 'GREEN' && reasons?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            {reasons.filter(r => !r.startsWith('BLACKOUT:')).map((r, i) => (
              <Chip key={i} label={r.replace(/_/g, ' ')} size="small" variant="outlined"
                color={r.includes('CUTOFF') || r.includes('BLACKOUT') ? 'error' : 'warning'}
                sx={{ height: 20, fontSize: '0.6rem' }} />
            ))}
          </Box>
        )}

        {/* Line evaluations summary (cart-level) */}
        {lineEvaluations?.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              Per-item status:
            </Typography>
            <Stack spacing={0.3}>
              {lineEvaluations.map((ev, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {STATUS_ICON[ev.status]}
                  <Typography variant="caption" sx={{ flex: 1 }}>{ev.division || 'Item'} — {ev.message}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}

        {/* Apply earliest to all */}
        {onApplyEarliestAll && status !== 'GREEN' && (
          <Button
            size="small" variant="outlined" color="primary"
            startIcon={<FlashOn />}
            onClick={onApplyEarliestAll}
            sx={{ mt: 1, fontSize: '0.75rem' }}
          >
            Apply earliest valid date to all items
          </Button>
        )}
      </Box>
    </Paper>
  )
}
