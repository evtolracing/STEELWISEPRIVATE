/**
 * TimeEstimatePreview.jsx — Inline time estimate display for processing steps.
 *
 * Shows estimated processing time based on recipe standards.
 * Used in:
 *   - CSRIntakePage (next to processing steps on each line)
 *   - ShopProductDetailPage (processing option time preview)
 *   - OrderDetailPage (line items tab)
 *
 * Two display modes:
 *   compact  — single line with total time + risk chip
 *   expanded — breakdown per step with modifiers shown
 */
import React, { useMemo } from 'react'
import {
  Box, Typography, Chip, Tooltip, Paper, LinearProgress, Stack,
  Collapse, IconButton,
} from '@mui/material'
import {
  Timer as TimerIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  CheckCircle as GreenIcon,
  Schedule as YellowIcon,
  Error as RedIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material'

import {
  estimateFromIntakeSteps,
  formatMinutes,
  TOLERANCE_CLASS,
} from '../../services/timeEstimationHelper'

const RISK_CONFIG = {
  LOW:    { color: 'success', icon: <GreenIcon fontSize="inherit" />, label: 'Low risk' },
  MEDIUM: { color: 'warning', icon: <YellowIcon fontSize="inherit" />, label: 'Medium risk' },
  HIGH:   { color: 'error',   icon: <RedIcon fontSize="inherit" />,   label: 'High risk' },
}

/**
 * @param {{
 *   steps: Array,            // Processing steps from order line
 *   materialGrade?: string,
 *   thickness?: number,
 *   toleranceClass?: string,
 *   division?: string,
 *   qty?: number,
 *   form?: string,
 *   compact?: boolean,       // Single-line mode (default: true)
 *   showBreakdown?: boolean, // Show per-step details
 *   showRisk?: boolean,      // Show capacity risk chip
 * }} props
 */
export default function TimeEstimatePreview({
  steps = [],
  materialGrade,
  thickness,
  toleranceClass = TOLERANCE_CLASS.STANDARD,
  division = 'METALS',
  qty = 1,
  form,
  compact = true,
  showBreakdown = false,
  showRisk = true,
}) {
  const [expanded, setExpanded] = React.useState(false)

  const estimate = useMemo(() => {
    if (!steps || steps.length === 0) return null
    return estimateFromIntakeSteps(steps, {
      materialGrade,
      thickness,
      toleranceClass,
      division,
      qty,
      form,
    })
  }, [steps, materialGrade, thickness, toleranceClass, division, qty, form])

  if (!estimate || estimate.totalMinutes === 0) return null

  const risk = RISK_CONFIG[estimate.capacityRisk] || RISK_CONFIG.LOW

  // ── Compact mode ──
  if (compact && !showBreakdown) {
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="caption" fontWeight={700}>Processing Time Estimate</Typography>
            <br />
            <Typography variant="caption">Setup: {estimate.steps.reduce((s, st) => s + st.setupMinutes, 0)} min</Typography>
            <br />
            <Typography variant="caption">Run: {estimate.steps.reduce((s, st) => s + st.runMinutes, 0)} min</Typography>
            <br />
            <Typography variant="caption">Total: {estimate.formattedTotal}</Typography>
            {estimate.usingRecipeStandards && (
              <>
                <br />
                <Typography variant="caption" color="success.light">✓ Based on recipe time standards</Typography>
              </>
            )}
          </Box>
        }
      >
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            {estimate.formattedTotal}
          </Typography>
          {showRisk && estimate.capacityRisk !== 'LOW' && (
            <Chip
              label={risk.label}
              color={risk.color}
              size="small"
              icon={risk.icon}
              sx={{ height: 20, fontSize: 10 }}
            />
          )}
          {estimate.usingRecipeStandards && (
            <Chip
              label="Recipe"
              size="small"
              color="info"
              variant="outlined"
              sx={{ height: 18, fontSize: 10, ml: 0.5 }}
            />
          )}
        </Box>
      </Tooltip>
    )
  }

  // ── Expanded mode ──
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: showBreakdown || expanded ? 1 : 0 }}>
        <SpeedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="subtitle2" fontWeight={700}>
          Processing Estimate: {estimate.formattedTotal}
        </Typography>
        {showRisk && (
          <Chip
            label={`${risk.label} — ${estimate.totalHours}h`}
            color={risk.color}
            size="small"
            icon={risk.icon}
            sx={{ height: 22, fontSize: 11 }}
          />
        )}
        {estimate.usingRecipeStandards && (
          <Chip label="Based on time standards" size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
        )}
        <Box sx={{ flex: 1 }} />
        {!showBreakdown && (
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      <Collapse in={showBreakdown || expanded}>
        <Stack spacing={0.5}>
          {estimate.steps.map((step, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: 16, textAlign: 'right' }}>{step.seq}.</Typography>
              <Typography variant="caption" fontWeight={500} sx={{ flex: 1 }}>
                {step.name}
                {step.usingRecipe && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    ({step.recipeCode})
                  </Typography>
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {step.setupMinutes > 0 ? `${step.setupMinutes}m setup + ` : ''}{step.runMinutes}m run
              </Typography>
              <Typography variant="caption" fontWeight={700} sx={{ width: 48, textAlign: 'right' }}>
                {formatMinutes(step.totalMinutes)}
              </Typography>
            </Box>
          ))}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.5, mt: 0.5, display: 'flex', justifyContent: 'space-between', px: 1 }}>
            <Typography variant="caption" fontWeight={600}>Total</Typography>
            <Typography variant="caption" fontWeight={700}>{estimate.formattedTotal}</Typography>
          </Box>
          {/* Modifiers note */}
          {estimate.usingRecipeStandards && (
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontStyle: 'italic' }}>
              Estimates include material ({materialGrade || 'standard'}), thickness ({thickness || '—'}" ), and tolerance ({toleranceClass}) modifiers
            </Typography>
          )}
        </Stack>
      </Collapse>
    </Paper>
  )
}

/**
 * Minimal "time badge" for use in table cells.
 */
export function TimeBadge({ minutes }) {
  if (!minutes || minutes <= 0) return null
  let color = 'success'
  if (minutes > 480) color = 'error'
  else if (minutes > 240) color = 'warning'

  return (
    <Chip
      icon={<TimerIcon />}
      label={formatMinutes(minutes)}
      size="small"
      color={color}
      variant="outlined"
      sx={{ height: 24, fontSize: 11 }}
    />
  )
}
