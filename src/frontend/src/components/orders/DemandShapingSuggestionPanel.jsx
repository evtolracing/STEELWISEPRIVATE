/**
 * DemandShapingSuggestionPanel — Gentle suggestion banners for demand shaping.
 *
 * Shows ranked incentive cards: alternate dates, branches, non-rush savings.
 * Never blocks anything — purely soft suggestions the CSR or customer can accept
 * or dismiss.
 *
 * Props:
 *   suggestions  — array from getDemandSuggestions()
 *   loading      — boolean
 *   onAccept     — (suggestion) => void   — apply the suggestion
 *   onDismiss    — (suggestion) => void   — dismiss it
 *   compact      — boolean — smaller for ecommerce sidebar
 */
import React, { useState } from 'react'
import {
  Box, Typography, Paper, Chip, Button, IconButton, Collapse, Stack,
  LinearProgress, Tooltip, Avatar, Fade, Alert,
} from '@mui/material'
import {
  CalendarMonth, LocationOn, Savings, NightsStay, Merge,
  Close, CheckCircle, TrendingDown, LocalOffer, ExpandMore, ExpandLess,
  LightbulbOutlined,
} from '@mui/icons-material'

import { SUGGESTION_TYPE, SUGGESTION_LABELS, formatSavings, suggestionColor } from '../../services/demandShapingApi'

// ─── ICON MAP ────────────────────────────────────────────────────────────────

const ICON_MAP = {
  [SUGGESTION_TYPE.ALT_DATE]:    <CalendarMonth fontSize="small" />,
  [SUGGESTION_TYPE.ALT_BRANCH]:  <LocationOn fontSize="small" />,
  [SUGGESTION_TYPE.NON_RUSH]:    <Savings fontSize="small" />,
  [SUGGESTION_TYPE.CONSOLIDATE]: <Merge fontSize="small" />,
  [SUGGESTION_TYPE.OFF_PEAK]:    <NightsStay fontSize="small" />,
}

// ─── SINGLE SUGGESTION CARD ─────────────────────────────────────────────────

function SuggestionCard({ suggestion, onAccept, onDismiss, compact }) {
  const [dismissed, setDismissed] = useState(false)
  const [accepted, setAccepted] = useState(false)

  if (dismissed) return null

  const color = suggestionColor(suggestion.type)
  const icon = ICON_MAP[suggestion.type] || <LightbulbOutlined fontSize="small" />

  if (accepted) {
    return (
      <Fade in>
        <Alert
          severity="success"
          icon={<CheckCircle fontSize="small" />}
          sx={{ py: 0.5, fontSize: '0.8rem' }}
        >
          Applied: {suggestion.headline}
        </Alert>
      </Fade>
    )
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 1.5 : 2,
        borderColor: `${color}.main`,
        borderLeftWidth: 4,
        bgcolor: `${color}.50`,
        position: 'relative',
        transition: 'all 0.2s',
        '&:hover': { boxShadow: 2 },
      }}
    >
      {/* Dismiss X */}
      <IconButton
        size="small"
        onClick={() => {
          setDismissed(true)
          onDismiss?.(suggestion)
        }}
        sx={{ position: 'absolute', top: 4, right: 4, opacity: 0.5, '&:hover': { opacity: 1 } }}
      >
        <Close fontSize="small" />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pr: 3 }}>
        <Avatar
          sx={{
            bgcolor: `${color}.light`,
            color: `${color}.dark`,
            width: compact ? 28 : 34,
            height: compact ? 28 : 34,
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Type badge + savings */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={SUGGESTION_LABELS[suggestion.type]}
              color={color}
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
            />
            {suggestion.savingsAmount > 0 && (
              <Chip
                size="small"
                icon={<LocalOffer sx={{ fontSize: '0.7rem !important' }} />}
                label={`Save ${formatSavings(suggestion.savingsAmount)}`}
                color="success"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            )}
            {suggestion.savingsPct > 0 && (
              <Typography variant="caption" color="success.dark" fontWeight={600}>
                ({suggestion.savingsPct}% off)
              </Typography>
            )}
          </Box>

          {/* Headline */}
          <Typography variant={compact ? 'body2' : 'subtitle2'} fontWeight={600} sx={{ mb: 0.5, lineHeight: 1.3 }}>
            {suggestion.headline}
          </Typography>

          {/* Description */}
          {!compact && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {suggestion.description}
            </Typography>
          )}

          {/* Action button */}
          <Button
            size="small"
            variant="contained"
            color={color}
            onClick={() => {
              setAccepted(true)
              onAccept?.(suggestion)
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.25,
              px: 1.5,
            }}
          >
            {suggestion.actionLabel || 'Apply'}
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}

// ─── MAIN PANEL ──────────────────────────────────────────────────────────────

export default function DemandShapingSuggestionPanel({
  suggestions = [],
  loading = false,
  onAccept,
  onDismiss,
  compact = false,
}) {
  const [expanded, setExpanded] = useState(true)

  if (!loading && suggestions.length === 0) return null

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingDown color="success" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={700}>
            {compact ? 'Savings Available' : 'Demand Shaping Suggestions'}
          </Typography>
          {suggestions.length > 0 && (
            <Chip
              size="small"
              label={`${suggestions.length}`}
              color="success"
              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
            />
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>

      {loading && <LinearProgress color="success" sx={{ mb: 1, borderRadius: 1 }} />}

      <Collapse in={expanded}>
        <Stack spacing={1}>
          {suggestions.map(s => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={onAccept}
              onDismiss={onDismiss}
              compact={compact}
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  )
}
