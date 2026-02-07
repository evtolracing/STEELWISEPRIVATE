/**
 * PromiseBadge — Chip-style indicator with GREEN/YELLOW/RED status + tooltip details.
 *
 * Props:
 *   evaluation: PromiseEvaluation object from promiseApi
 *   size: 'small' | 'medium' (default 'small')
 *   showMessage: boolean (default true)
 */
import React from 'react'
import { Chip, Tooltip, Box, Typography } from '@mui/material'
import {
  CheckCircle, Warning, Error as ErrorIcon, Schedule, LocalShipping,
} from '@mui/icons-material'

const STATUS_CONFIG = {
  GREEN: {
    color: 'success',
    icon: <CheckCircle fontSize="small" />,
    bgcolor: '#e8f5e9',
    borderColor: '#4caf50',
    label: 'Next-day available',
  },
  YELLOW: {
    color: 'warning',
    icon: <Warning fontSize="small" />,
    bgcolor: '#fff8e1',
    borderColor: '#ff9800',
    label: 'Review recommended',
  },
  RED: {
    color: 'error',
    icon: <ErrorIcon fontSize="small" />,
    bgcolor: '#ffebee',
    borderColor: '#f44336',
    label: 'Cutoff passed',
  },
}

function formatTime12(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function TooltipContent({ evaluation }) {
  if (!evaluation) return null
  const { cutoffLocal, cutoffMet, earliestShipDate, requestedShipDate, reasons, message, capacityNote } = evaluation

  return (
    <Box sx={{ p: 0.5, maxWidth: 280 }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>{message}</Typography>
      {cutoffLocal && (
        <Typography variant="caption" display="block">
          Branch cutoff: <b>{formatTime12(cutoffLocal)}</b> local
          {cutoffMet != null && (cutoffMet ? ' ✓ met' : ' ✗ passed')}
        </Typography>
      )}
      {earliestShipDate && (
        <Typography variant="caption" display="block">
          Earliest ship: <b>{earliestShipDate}</b>
        </Typography>
      )}
      {requestedShipDate && (
        <Typography variant="caption" display="block">
          Requested: {requestedShipDate}
        </Typography>
      )}
      {capacityNote && (
        <Typography variant="caption" display="block" color="warning.main" sx={{ mt: 0.3 }}>
          ⚠ {capacityNote}
        </Typography>
      )}
      {reasons?.length > 0 && (
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.3 }}>
          {reasons.filter(r => !r.startsWith('BLACKOUT:')).join(' • ')}
        </Typography>
      )}
    </Box>
  )
}

export default function PromiseBadge({ evaluation, size = 'small', showMessage = true }) {
  if (!evaluation) return null

  const cfg = STATUS_CONFIG[evaluation.status] || STATUS_CONFIG.YELLOW

  return (
    <Tooltip title={<TooltipContent evaluation={evaluation} />} arrow placement="top">
      <Chip
        icon={cfg.icon}
        label={showMessage ? evaluation.message : cfg.label}
        size={size}
        color={cfg.color}
        variant="outlined"
        sx={{
          fontWeight: 600,
          fontSize: size === 'small' ? '0.7rem' : '0.8rem',
          bgcolor: cfg.bgcolor,
          borderColor: cfg.borderColor,
          '& .MuiChip-icon': { fontSize: size === 'small' ? 14 : 18 },
        }}
      />
    </Tooltip>
  )
}
