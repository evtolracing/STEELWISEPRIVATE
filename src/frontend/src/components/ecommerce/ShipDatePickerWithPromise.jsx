/**
 * ShipDatePickerWithPromise — Date picker + inline promise evaluation + suggested dates.
 *
 * Props:
 *   value: "YYYY-MM-DD" or ""
 *   onChange: (dateStr) => void
 *   locationId: string
 *   division: string
 *   itemsSummary: { totalQty, totalWeight, processingStepsCount } (optional)
 *   evaluation: PromiseEvaluation | null (externally provided, optional)
 *   onEvaluationChange: (evaluation) => void (optional callback)
 *   disabled: boolean
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Paper, Box, Typography, TextField, Button, Chip, CircularProgress,
} from '@mui/material'
import {
  CalendarToday, AutoFixHigh, Schedule,
} from '@mui/icons-material'
import { evaluatePromise } from '../../services/promiseApi'
import PromiseBadge from './PromiseBadge'

export default function ShipDatePickerWithPromise({
  value, onChange, locationId, division, itemsSummary,
  evaluation: externalEval, onEvaluationChange, disabled = false,
}) {
  const [internalEval, setInternalEval] = useState(null)
  const [loading, setLoading] = useState(false)

  const evaluation = externalEval || internalEval

  const runEvaluation = useCallback(async (dateStr) => {
    if (!locationId || !division) return
    setLoading(true)
    try {
      const res = await evaluatePromise({
        locationId,
        division,
        requestedShipDate: dateStr || undefined,
        itemsSummary,
      })
      const ev = res.data
      setInternalEval(ev)
      onEvaluationChange?.(ev)
    } catch {
      setInternalEval(null)
      onEvaluationChange?.(null)
    } finally {
      setLoading(false)
    }
  }, [locationId, division, itemsSummary, onEvaluationChange])

  // Evaluate whenever date/location/division changes
  useEffect(() => {
    const timer = setTimeout(() => runEvaluation(value), 200)
    return () => clearTimeout(timer)
  }, [value, runEvaluation])

  const handleDateChange = (e) => {
    onChange(e.target.value)
  }

  const handleSuggestedClick = (dateStr) => {
    onChange(dateStr)
  }

  const handleEarliestClick = () => {
    if (evaluation?.earliestShipDate) {
      onChange(evaluation.earliestShipDate)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <CalendarToday color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>Requested Ship Date</Typography>
        {loading && <CircularProgress size={14} sx={{ ml: 0.5 }} />}
      </Box>

      <TextField
        size="small"
        type="date"
        fullWidth
        value={value || ''}
        onChange={handleDateChange}
        inputProps={{ min: today }}
        disabled={disabled}
        helperText={!value ? 'Leave blank for earliest available' : undefined}
        sx={{ mb: 1 }}
      />

      {/* Promise badge */}
      {evaluation && !loading && (
        <Box sx={{ mb: 1 }}>
          <PromiseBadge evaluation={evaluation} size="small" />
        </Box>
      )}

      {/* Cutoff line */}
      {evaluation?.cutoffLocal && !loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Schedule sx={{ fontSize: 14, color: evaluation.cutoffMet ? 'success.main' : 'error.main' }} />
          <Typography variant="caption" color={evaluation.cutoffMet ? 'success.main' : 'error.main'} fontWeight={500}>
            {evaluation.cutoffMet
              ? `Cutoff: ${formatTime12(evaluation.cutoffLocal)} — still open`
              : `Cutoff: ${formatTime12(evaluation.cutoffLocal)} — passed`}
          </Typography>
        </Box>
      )}

      {/* Earliest ship date */}
      {evaluation?.earliestShipDate && evaluation.status !== 'GREEN' && !loading && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Earliest available: <b>{evaluation.earliestShipDate}</b>
          </Typography>
          <Button size="small" variant="text" sx={{ ml: 0.5, fontSize: '0.7rem', minWidth: 0, p: '0 4px' }}
            onClick={handleEarliestClick} disabled={disabled}>
            Use this date
          </Button>
        </Box>
      )}

      {/* Suggested dates */}
      {evaluation?.suggestedDates?.length > 0 && evaluation.status !== 'GREEN' && !loading && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            <AutoFixHigh sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'text-bottom' }} />
            Suggested dates:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {evaluation.suggestedDates.map(d => {
              const dayName = new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              const isSelected = d === value
              return (
                <Chip
                  key={d}
                  label={dayName}
                  size="small"
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={() => !disabled && handleSuggestedClick(d)}
                  clickable={!disabled}
                  sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                />
              )
            })}
          </Box>
        </Box>
      )}
    </Paper>
  )
}

function formatTime12(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}
