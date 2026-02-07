/**
 * PricingSummaryPanel — displays pricing breakdown for an order.
 */
import React from 'react'
import {
  Box, Typography, Divider, Chip, Paper, Skeleton, Tooltip,
} from '@mui/material'
import {
  Receipt as ReceiptIcon, LocalOffer as OfferIcon, Percent as PctIcon,
} from '@mui/icons-material'

const SOURCE_LABEL = {
  CONTRACT: 'Contract', RETAIL: 'List Price', REMNANT: 'Remnant Discount',
  VOLUME: 'Volume Discount', MANUAL: 'Manual Override',
}
const SOURCE_COLOR = {
  CONTRACT: 'primary', RETAIL: 'default', REMNANT: 'warning', VOLUME: 'info', MANUAL: 'secondary',
}

function Row({ label, value, bold, color, tooltip }) {
  const content = (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant={bold ? 'subtitle2' : 'body2'} color={color || 'text.secondary'}>{label}</Typography>
      <Typography variant={bold ? 'subtitle2' : 'body2'} color={color || 'text.primary'} fontWeight={bold ? 700 : 400}>{value}</Typography>
    </Box>
  )
  return tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content
}

const fmt = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PricingSummaryPanel({ lines = [], taxRate = 0, taxAmount, priceSource, contractName, loading }) {
  if (loading) return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      {[...Array(6)].map((_, i) => <Skeleton key={i} height={24} sx={{ my: 0.5 }} />)}
    </Paper>
  )

  const materialTotal = lines.filter(l => l.lineType === 'MATERIAL').reduce((s, l) => s + (l.extPrice || 0), 0)
  const processingTotal = lines.filter(l => l.lineType === 'PROCESSING').reduce((s, l) => s + (l.extPrice || 0), 0)
  const suppliesTotal = lines.filter(l => l.lineType === 'SUPPLIES').reduce((s, l) => s + (l.extPrice || 0), 0)
  const feeTotal = lines.filter(l => l.lineType === 'FEE').reduce((s, l) => s + (l.extPrice || 0), 0)
  const subtotal = materialTotal + processingTotal + suppliesTotal + feeTotal
  const computedTax = taxAmount ?? subtotal * (taxRate / 100)
  const grandTotal = subtotal + computedTax

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ReceiptIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" fontWeight={600}>Pricing Summary</Typography>
        {priceSource && (
          <Chip icon={<OfferIcon />} label={SOURCE_LABEL[priceSource] || priceSource} size="small" color={SOURCE_COLOR[priceSource] || 'default'} variant="outlined" />
        )}
      </Box>
      {contractName && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Contract: {contractName}</Typography>
      )}
      <Row label="Material" value={fmt(materialTotal)} tooltip={`${lines.filter(l => l.lineType === 'MATERIAL').length} line(s)`} />
      <Row label="Processing" value={fmt(processingTotal)} />
      <Row label="Supplies" value={fmt(suppliesTotal)} />
      {feeTotal > 0 && <Row label="Fees" value={fmt(feeTotal)} />}
      <Divider sx={{ my: 1 }} />
      <Row label="Subtotal" value={fmt(subtotal)} bold />
      <Row label={`Tax (${taxRate}%)`} value={fmt(computedTax)} />
      <Divider sx={{ my: 1 }} />
      <Row label="Grand Total" value={fmt(grandTotal)} bold color="primary.main" />
    </Paper>
  )
}
