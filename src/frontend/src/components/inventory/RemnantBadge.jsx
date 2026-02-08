/**
 * RemnantBadge.jsx — Visual badge/indicator for remnant items.
 *
 * Shows:
 *   - Aging indicator (color-coded 30/60/90+ day badges)
 *   - Condition grade (A/B/C)
 *   - Remnant type (DROP, OFFCUT, OVERRUN, etc.)
 *   - Discount percentage
 *   - "Limited Qty" warning
 */
import React from 'react'
import { Box, Chip, Tooltip, Typography, Badge } from '@mui/material'
import {
  LocalOffer   as TagIcon,
  Schedule     as ClockIcon,
  Star         as GradeIcon,
  Warning      as LimitedIcon,
  ContentCut   as CutIcon,
  Recycling    as RecycleIcon,
} from '@mui/icons-material'
import {
  AGING_BUCKET, REMNANT_CONDITION, REMNANT_TYPE, getAgingBucket, getAgeDays,
} from '../../services/remnantInventoryApi'

// ─── Aging Badge ─────────────────────────────────────────────────────────────

export function AgingBadge({ cutDate, size = 'small', showDays = false }) {
  const bucket = getAgingBucket(cutDate)
  const days = getAgeDays(cutDate)

  return (
    <Tooltip title={`${days} days old — ${bucket.label}`}>
      <Chip
        icon={<ClockIcon />}
        label={showDays ? `${days}d` : bucket.badge}
        size={size}
        sx={{
          bgcolor: `${bucket.color}18`,
          color: bucket.color,
          fontWeight: 700,
          border: `1px solid ${bucket.color}40`,
          fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        }}
      />
    </Tooltip>
  )
}

// ─── Condition Grade Badge ───────────────────────────────────────────────────

export function ConditionBadge({ condition, size = 'small' }) {
  const def = REMNANT_CONDITION[condition] || REMNANT_CONDITION.B

  return (
    <Tooltip title={def.label}>
      <Chip
        icon={<GradeIcon />}
        label={`Grade ${def.code}`}
        size={size}
        sx={{
          bgcolor: `${def.color}18`,
          color: def.color,
          fontWeight: 700,
          border: `1px solid ${def.color}40`,
          fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        }}
      />
    </Tooltip>
  )
}

// ─── Remnant Type Badge ──────────────────────────────────────────────────────

const TYPE_LABELS = {
  [REMNANT_TYPE.DROP]:     'Drop',
  [REMNANT_TYPE.OFFCUT]:   'Offcut',
  [REMNANT_TYPE.OVERRUN]:  'Overrun',
  [REMNANT_TYPE.RETURN]:   'Return',
  [REMNANT_TYPE.SKELETON]: 'Skeleton',
}

export function RemnantTypeBadge({ type, size = 'small' }) {
  return (
    <Chip
      icon={<CutIcon />}
      label={TYPE_LABELS[type] || type}
      size={size}
      variant="outlined"
      sx={{ fontSize: size === 'small' ? '0.7rem' : '0.8rem' }}
    />
  )
}

// ─── Discount Badge ──────────────────────────────────────────────────────────

export function DiscountBadge({ discountPct, size = 'small' }) {
  if (!discountPct || discountPct <= 0) return null
  return (
    <Chip
      icon={<TagIcon />}
      label={`−${Math.round(discountPct)}% OFF`}
      size={size}
      color="error"
      sx={{ fontWeight: 700, fontSize: size === 'small' ? '0.7rem' : '0.85rem' }}
    />
  )
}

// ─── Limited Quantity Warning ────────────────────────────────────────────────

export function LimitedQtyBadge({ qty, threshold = 3, size = 'small' }) {
  if (qty > threshold) return null
  return (
    <Tooltip title={`Only ${qty} piece${qty !== 1 ? 's' : ''} available — limited quantity`}>
      <Chip
        icon={<LimitedIcon />}
        label={qty <= 1 ? 'Last One!' : `Only ${qty} left`}
        size={size}
        sx={{
          bgcolor: '#fff3e0',
          color: '#e65100',
          fontWeight: 700,
          border: '1px solid #ffcc80',
          fontSize: size === 'small' ? '0.7rem' : '0.8rem',
          animation: qty <= 1 ? 'pulse 1.5s infinite' : undefined,
          '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        }}
      />
    </Tooltip>
  )
}

// ─── Combined Remnant Badge Row ──────────────────────────────────────────────

/**
 * Full remnant badge row showing all indicators.
 *
 * @param {{ cutDate, condition, type, discountPct, qty, compact? }} props
 */
export default function RemnantBadge({
  cutDate,
  condition,
  type,
  discountPct,
  qty,
  compact = false,
  size = 'small',
}) {
  if (compact) {
    return (
      <Box sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <AgingBadge cutDate={cutDate} size={size} />
        {discountPct > 0 && <DiscountBadge discountPct={discountPct} size={size} />}
        <LimitedQtyBadge qty={qty} size={size} />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
      <Chip
        icon={<RecycleIcon />}
        label="REMNANT"
        size={size}
        sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, border: '1px solid #a5d6a7' }}
      />
      <AgingBadge cutDate={cutDate} size={size} />
      <ConditionBadge condition={condition} size={size} />
      {type && <RemnantTypeBadge type={type} size={size} />}
      {discountPct > 0 && <DiscountBadge discountPct={discountPct} size={size} />}
      <LimitedQtyBadge qty={qty} size={size} />
    </Box>
  )
}
