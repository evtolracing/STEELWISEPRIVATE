/**
 * CutoffClockPopover — Detail popover shown when clicking the cutoff clock chip.
 *
 * Props:
 *   anchorEl        : DOM element for Popover anchor
 *   open            : boolean
 *   onClose         : () => void
 *   locationName    : string
 *   timezone        : string (IANA)
 *   division        : string
 *   cutoffLocal     : string "HH:MM"
 *   minutesLeft     : number (negative = passed)
 *   shipDays        : number[]
 *   blackoutWindows : { start, end, reason }[]
 *   canViewRules    : boolean
 */
import React from 'react'
import {
  Popover, Box, Typography, Divider, Chip, Button, Stack,
} from '@mui/material'
import {
  Schedule, LocationOn, Category, CalendarToday,
  LocalShipping, Block, Settings, Close, AccessTime,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { formatTime12, formatCountdown, formatShipDays, getNowInTz } from '../../utils/timeUtils'

export default function CutoffClockPopover({
  anchorEl, open, onClose,
  locationName, timezone, division,
  cutoffLocal, minutesLeft, shipDays,
  blackoutWindows, canViewRules,
}) {
  const navigate = useNavigate()

  // Get upcoming blackouts (next 14 days)
  const nowInfo = timezone ? getNowInTz(timezone) : null
  const upcomingBlackouts = (blackoutWindows || []).filter(bw => {
    if (!nowInfo) return false
    const endDate = new Date(bw.end + 'T23:59:59')
    const nowDate = new Date(nowInfo.dateStr + 'T00:00:00')
    const limitDate = new Date(nowDate)
    limitDate.setDate(limitDate.getDate() + 14)
    return endDate >= nowDate && new Date(bw.start + 'T00:00:00') <= limitDate
  })

  const statusColor = minutesLeft == null
    ? 'text.secondary'
    : minutesLeft > 60
      ? 'success.main'
      : minutesLeft > 0
        ? 'warning.main'
        : 'error.main'

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{ paper: { sx: { width: 340, borderRadius: 2 } } }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" fontWeight={700}>
            <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
            Next-Day Cutoff Details
          </Typography>
          <Button size="small" onClick={onClose}
            sx={{ color: 'primary.contrastText', minWidth: 'auto', p: 0.5 }}>
            <Close fontSize="small" />
          </Button>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Location */}
        <InfoRow icon={<LocationOn sx={{ fontSize: 16 }} />} label="Location" value={locationName || '—'} />

        {/* Timezone */}
        <InfoRow icon={<AccessTime sx={{ fontSize: 16 }} />} label="Timezone"
          value={timezone ? timezone.replace(/_/g, ' ') : '—'} />

        {/* Division */}
        <InfoRow icon={<Category sx={{ fontSize: 16 }} />} label="Division"
          value={<Chip label={division || '—'} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />} />

        <Divider sx={{ my: 1.5 }} />

        {/* Cutoff time */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            <Schedule sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom', color: statusColor }} />
            Cutoff
          </Typography>
          <Typography variant="body2" fontWeight={700} color={statusColor}>
            {formatTime12(cutoffLocal)} local
          </Typography>
        </Box>

        {/* Time remaining */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">Time remaining</Typography>
          <Typography variant="body2" fontWeight={600} color={statusColor}>
            {minutesLeft != null ? formatCountdown(minutesLeft) : '—'}
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Ship days */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <LocalShipping sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
            Ship days
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {formatShipDays(shipDays)}
          </Typography>
        </Box>

        {/* Blackouts */}
        {upcomingBlackouts.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              <Block sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'text-bottom' }} />
              Blackouts (next 14 days)
            </Typography>
            <Stack spacing={0.5}>
              {upcomingBlackouts.map((bw, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="error.main">
                    {bw.start === bw.end ? bw.start : `${bw.start} → ${bw.end}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{bw.reason}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}
        {upcomingBlackouts.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            No blackout windows in the next 14 days.
          </Typography>
        )}

        {/* Actions */}
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {canViewRules && (
            <Button
              size="small" variant="outlined" startIcon={<Settings />}
              onClick={() => { onClose(); navigate('/admin/online-settings') }}
              sx={{ fontSize: '0.75rem' }}
            >
              View Rules
            </Button>
          )}
          <Button size="small" onClick={onClose}>Close</Button>
        </Box>
      </Box>
    </Popover>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {icon}
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
      {typeof value === 'string'
        ? <Typography variant="body2" fontWeight={500}>{value}</Typography>
        : value
      }
    </Box>
  )
}
