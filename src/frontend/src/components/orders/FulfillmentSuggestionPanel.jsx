/**
 * FulfillmentSuggestionPanel — Inline panel showing ranked branch fulfillment options.
 *
 * Props:
 *   suggestions       : FulfillmentSuggestion[]  (from compareBranches)
 *   loading           : boolean
 *   currentLocationId : string (the user's currently-selected branch)
 *   onSelectBranch    : (locationId, locationName) => void
 *   compact           : boolean (default false — set true for checkout sidebar)
 *   readOnly          : boolean (default false — hides Select button)
 */
import React, { useState } from 'react'
import {
  Paper, Box, Typography, Chip, Button, Skeleton, Divider,
  Tooltip, Collapse, IconButton, LinearProgress, Alert,
} from '@mui/material'
import {
  EmojiEvents, Warehouse, Schedule, Build, LocalShipping,
  CheckCircle, Warning, ErrorOutline, ExpandMore, ExpandLess,
  SwapHoriz, Star,
} from '@mui/icons-material'

const IMPACT_COLOR = { positive: 'success', neutral: 'warning', negative: 'error' }
const IMPACT_ICON = {
  positive: <CheckCircle sx={{ fontSize: 14 }} />,
  neutral: <Warning sx={{ fontSize: 14 }} />,
  negative: <ErrorOutline sx={{ fontSize: 14 }} />,
}

function ScoreBar({ score, max = 100 }) {
  const pct = Math.min(100, Math.round((score / max) * 100))
  const color = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'error'
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
      <LinearProgress
        variant="determinate" value={pct} color={color}
        sx={{ flex: 1, height: 6, borderRadius: 3 }}
      />
      <Typography variant="caption" fontWeight={600} color={`${color}.main`}>
        {score}
      </Typography>
    </Box>
  )
}

function BranchCard({ suggestion, isCurrent, onSelect, compact, readOnly }) {
  const [expanded, setExpanded] = useState(false)
  const { locationId, locationName, rank, score, recommended, reasons, inventory, cutoff, processing, distance } = suggestion

  const borderColor = recommended ? 'success.main' : isCurrent ? 'primary.main' : 'divider'
  const bgColor = recommended ? 'success.50' : isCurrent ? 'primary.50' : 'transparent'

  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 1.5 : 2,
        borderRadius: 1.5,
        borderColor,
        borderWidth: recommended ? 2 : 1,
        bgcolor: recommended ? '#f0fdf4' : isCurrent ? '#eff6ff' : 'background.paper',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: compact ? 0.5 : 1 }}>
        {recommended && (
          <Tooltip title="Recommended fulfillment branch">
            <Star sx={{ fontSize: 20, color: 'warning.main' }} />
          </Tooltip>
        )}
        <Typography variant={compact ? 'body2' : 'subtitle2'} fontWeight={700} sx={{ flex: 1 }}>
          {rank}. {locationName}
        </Typography>
        {isCurrent && <Chip label="Current" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
        {recommended && <Chip label="Best Match" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />}
        <ScoreBar score={score} />
      </Box>

      {/* Quick stat chips */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: compact ? 0.5 : 1 }}>
        <Tooltip title="Inventory">
          <Chip
            icon={<Warehouse sx={{ fontSize: 14 }} />}
            label={inventory.available ? `${inventory.totalQty} pcs` : 'None'}
            size="small" variant="outlined"
            color={inventory.available ? 'success' : 'error'}
            sx={{ height: 22, fontSize: '0.65rem' }}
          />
        </Tooltip>
        <Tooltip title="Cutoff status">
          <Chip
            icon={<Schedule sx={{ fontSize: 14 }} />}
            label={cutoff.cutoffMet
              ? `${Math.floor((cutoff.minutesLeft || 0) / 60)}h ${(cutoff.minutesLeft || 0) % 60}m left`
              : 'Passed'}
            size="small" variant="outlined"
            color={cutoff.cutoffMet ? (cutoff.minutesLeft > 60 ? 'success' : 'warning') : 'error'}
            sx={{ height: 22, fontSize: '0.65rem' }}
          />
        </Tooltip>
        <Tooltip title="Processing capability">
          <Chip
            icon={<Build sx={{ fontSize: 14 }} />}
            label={processing.capable ? 'Full' : `Missing ${processing.missingOps.length}`}
            size="small" variant="outlined"
            color={processing.capable ? 'success' : 'warning'}
            sx={{ height: 22, fontSize: '0.65rem' }}
          />
        </Tooltip>
        {distance.miles != null && (
          <Tooltip title="Estimated distance">
            <Chip
              icon={<LocalShipping sx={{ fontSize: 14 }} />}
              label={`~${distance.miles} mi`}
              size="small" variant="outlined"
              sx={{ height: 22, fontSize: '0.65rem' }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Expandable reasons */}
      {!compact && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              size="small" onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              sx={{ fontSize: '0.7rem', px: 0.5 }}
            >
              {expanded ? 'Hide' : 'Show'} details
            </Button>
            {!readOnly && !isCurrent && (
              <Button
                size="small" variant={recommended ? 'contained' : 'outlined'}
                color={recommended ? 'success' : 'primary'}
                startIcon={<SwapHoriz />}
                onClick={() => onSelect?.(locationId, locationName)}
                sx={{ fontSize: '0.7rem' }}
              >
                {recommended ? 'Use This Branch' : 'Select'}
              </Button>
            )}
            {isCurrent && !readOnly && (
              <Chip label="Selected" size="small" color="primary" sx={{ height: 22, fontSize: '0.65rem' }} />
            )}
          </Box>
          <Collapse in={expanded}>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
              {reasons.map((r, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {IMPACT_ICON[r.impact]}
                  <Typography variant="caption" color={`${IMPACT_COLOR[r.impact]}.main`} fontWeight={500}>
                    {r.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Collapse>
        </>
      )}

      {/* Compact mode: inline select */}
      {compact && !readOnly && !isCurrent && (
        <Button
          size="small" variant={recommended ? 'contained' : 'text'}
          color={recommended ? 'success' : 'primary'}
          onClick={() => onSelect?.(locationId, locationName)}
          sx={{ fontSize: '0.7rem', mt: 0.5, py: 0 }}
          fullWidth
        >
          {recommended ? 'Use This Branch' : 'Select'}
        </Button>
      )}
    </Paper>
  )
}

export default function FulfillmentSuggestionPanel({
  suggestions, loading, currentLocationId, onSelectBranch, compact = false, readOnly = false,
}) {
  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Skeleton width={20} height={20} variant="circular" />
          <Skeleton width={200} height={24} />
        </Box>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="rectangular" height={compact ? 60 : 80} sx={{ borderRadius: 1, mb: 1 }} />
        ))}
      </Paper>
    )
  }

  if (!suggestions || suggestions.length === 0) return null

  const best = suggestions[0]
  const isBestCurrent = best?.locationId === currentLocationId

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25,
        bgcolor: isBestCurrent ? '#f0fdf4' : '#fffbeb',
        borderBottom: 1, borderColor: 'divider',
      }}>
        <EmojiEvents sx={{ fontSize: 20, color: isBestCurrent ? 'success.main' : 'warning.main' }} />
        <Typography variant="subtitle2" fontWeight={700}>
          Branch Fulfillment{compact ? '' : ' Suggestions'}
        </Typography>
        {isBestCurrent ? (
          <Chip label="Current branch is best" size="small" color="success" variant="outlined"
            sx={{ ml: 'auto', height: 20, fontSize: '0.65rem' }} />
        ) : (
          <Chip label="Better option available" size="small" color="warning"
            sx={{ ml: 'auto', height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
        )}
      </Box>

      {/* Non-current-best alert */}
      {!isBestCurrent && !readOnly && (
        <Alert severity="info" variant="outlined"
          sx={{ mx: 2, mt: 1.5, py: 0, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
          <b>{best.locationName}</b> scores higher for this order.
          Consider switching for better next-day reliability.
        </Alert>
      )}

      {/* Branch cards */}
      <Box sx={{ p: compact ? 1 : 2, display: 'flex', flexDirection: 'column', gap: compact ? 0.75 : 1 }}>
        {suggestions.map(s => (
          <BranchCard
            key={s.locationId}
            suggestion={s}
            isCurrent={s.locationId === currentLocationId}
            onSelect={onSelectBranch}
            compact={compact}
            readOnly={readOnly}
          />
        ))}
      </Box>
    </Paper>
  )
}
