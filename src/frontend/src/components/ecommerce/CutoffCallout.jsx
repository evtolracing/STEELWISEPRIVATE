/**
 * CutoffCallout — Inline callout showing the branch cutoff time.
 *
 * "Order by 3:30 PM local for next-day shipping"
 *
 * Props:
 *   cutoffLocal: "15:30" (HH:MM)
 *   cutoffMet: boolean | null
 *   locationName: string
 *   division: string
 *   compact: boolean (default false)
 */
import React from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { Schedule, CheckCircle, ErrorOutline } from '@mui/icons-material'

function formatTime12(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function CutoffCallout({ cutoffLocal, cutoffMet, locationName, division, compact = false }) {
  if (!cutoffLocal) return null

  const time12 = formatTime12(cutoffLocal)
  const passed = cutoffMet === false

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Schedule sx={{ fontSize: 14, color: passed ? 'error.main' : 'text.secondary' }} />
        <Typography variant="caption" color={passed ? 'error.main' : 'text.secondary'} fontWeight={passed ? 600 : 400}>
          {passed ? `Cutoff passed (${time12})` : `Order by ${time12} for next-day`}
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 1.5,
        borderRadius: 1, border: 1,
        borderColor: passed ? 'error.light' : 'success.light',
        bgcolor: passed ? 'error.50' : 'success.50',
        backgroundColor: passed ? '#fff5f5' : '#f0fdf4',
      }}
    >
      {passed ? (
        <ErrorOutline sx={{ fontSize: 18, color: 'error.main' }} />
      ) : (
        <Schedule sx={{ fontSize: 18, color: 'success.main' }} />
      )}
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600} color={passed ? 'error.main' : 'success.dark'}>
          {passed
            ? `Cutoff has passed (${time12} local)`
            : `Order by ${time12} local for next-day shipping`}
        </Typography>
        {locationName && (
          <Typography variant="caption" color="text.secondary">
            {locationName} branch{division ? ` • ${division}` : ''}
          </Typography>
        )}
      </Box>
      {cutoffMet != null && (
        <Chip
          icon={cutoffMet ? <CheckCircle /> : <ErrorOutline />}
          label={cutoffMet ? 'On time' : 'Passed'}
          size="small"
          color={cutoffMet ? 'success' : 'error'}
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
        />
      )}
    </Box>
  )
}
