/**
 * PriceBreakdownPanel — shows material, processing, tax, total with price-source chip.
 */
import React from 'react'
import {
  Paper, Box, Typography, Chip, Divider, Skeleton, Alert, Stack, Tooltip,
} from '@mui/material'
import {
  AttachMoney, Warning as WarnIcon, VerifiedUser, LocalOffer, Inventory2,
} from '@mui/icons-material'

const SOURCE_CFG = {
  CONTRACT:       { label: 'Contract Price',  color: 'success', icon: <VerifiedUser fontSize="small" /> },
  RETAIL:         { label: 'Retail Price',     color: 'primary', icon: <LocalOffer fontSize="small" /> },
  REMNANT:        { label: 'Remnant Price',    color: 'warning', icon: <Inventory2 fontSize="small" /> },
  REVIEW_REQUIRED:{ label: 'Needs Review',     color: 'error',   icon: <WarnIcon fontSize="small" /> },
}

function Row({ label, value, bold, color }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.3 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 400} color={color || 'text.primary'}>
        {typeof value === 'number' ? `$${value.toFixed(2)}` : value}
      </Typography>
    </Box>
  )
}

export default function PriceBreakdownPanel({ pricing, loading = false, compact = false }) {
  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Skeleton width={120} height={24} sx={{ mb: 1 }} />
        <Skeleton width="100%" height={20} />
        <Skeleton width="100%" height={20} />
        <Skeleton width="100%" height={20} />
      </Paper>
    )
  }

  if (!pricing) return null

  const { unitPrice, extended, materialCost, processingCost, taxAmount, total,
          priceSource, estimatedWeight, warnings = [], quantity, unit, priceUnit } = pricing

  const src = SOURCE_CFG[priceSource] || SOURCE_CFG.RETAIL
  const showExtended = extended != null && extended !== unitPrice

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <AttachMoney color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>Price Breakdown</Typography>
        <Chip icon={src.icon} label={src.label} size="small" color={src.color} sx={{ ml: 'auto' }} />
      </Box>

      {/* Unit price */}
      <Row label={`Unit price (per ${priceUnit || unit || 'ea'})`} value={unitPrice} />

      {quantity && <Row label="Quantity" value={`× ${quantity}`} />}

      {materialCost != null && <Row label="Material" value={materialCost} />}
      {processingCost != null && processingCost > 0 && <Row label="Processing" value={processingCost} />}
      {estimatedWeight != null && (
        <Row label="Est. weight" value={`${estimatedWeight.toFixed(1)} lb`} />
      )}

      {showExtended && (
        <>
          <Divider sx={{ my: 0.75 }} />
          <Row label="Subtotal" value={extended} bold />
        </>
      )}

      {taxAmount != null && taxAmount > 0 && <Row label="Tax" value={taxAmount} />}

      {total != null && (
        <>
          <Divider sx={{ my: 0.75 }} />
          <Row label="Total" value={total} bold color="primary.main" />
        </>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {warnings.map((w, i) => (
            <Alert key={i} severity="warning" variant="outlined" sx={{ py: 0, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
              {w}
            </Alert>
          ))}
        </Stack>
      )}

      {priceSource === 'REVIEW_REQUIRED' && (
        <Alert severity="info" variant="outlined" sx={{ mt: 1, py: 0, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
          This item requires manual pricing review. Your order will be held for confirmation.
        </Alert>
      )}
    </Paper>
  )
}
