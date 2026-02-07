/**
 * CutoffClockChip — Persistent header chip showing next-day cutoff countdown.
 *
 * Fetches cutoff rules for the active location/division, computes time remaining,
 * and refreshes every 30 seconds. Clicking opens CutoffClockPopover.
 *
 * Color states:
 *   GREEN  — > 60 min remaining
 *   YELLOW — ≤ 60 min remaining (or non-ship day / blackout)
 *   RED    — cutoff passed
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Chip, Tooltip } from '@mui/material'
import { Schedule, CheckCircle, Warning, ErrorOutline } from '@mui/icons-material'

import { getLocationCutoffRules } from '../../services/cutoffRulesApi'
import { minutesUntilCutoff, formatTime12, formatCountdown, getNowInTz } from '../../utils/timeUtils'
import { useCustomerSession } from '../../contexts/CustomerSessionContext'
import { useAuth } from '../../hooks/useAuth'
import CutoffClockPopover from './CutoffClockPopover'

const ADMIN_ROLES = ['ADMIN', 'BRANCH_MANAGER', 'DIVISION_MANAGER']
const REFRESH_MS = 30_000 // 30 seconds

export default function CutoffClockChip() {
  // Session context provides flat values
  const { locationId, locationName, division } = useCustomerSession()
  const { user } = useAuth()

  const [rules, setRules] = useState(null)
  const [minsLeft, setMinsLeft] = useState(null)
  const [isNonShipDay, setIsNonShipDay] = useState(false)
  const [isBlackout, setIsBlackout] = useState(false)
  const [popoverAnchor, setPopoverAnchor] = useState(null)

  const intervalRef = useRef(null)

  // Derived rule for current division
  const divRule = rules?.divisionRules?.[division] || rules?.divisionRules?.METALS || null
  const cutoffLocal = divRule?.cutoffLocal || null
  const shipDays = divRule?.shipDays || []
  const nextDayEnabled = divRule?.nextDayEnabled !== false

  // Fetch rules when location changes
  const fetchRules = useCallback(async () => {
    if (!locationId) { setRules(null); return }
    try {
      const res = await getLocationCutoffRules(locationId)
      setRules(res.data || null)
    } catch {
      setRules(null)
    }
  }, [locationId])

  useEffect(() => { fetchRules() }, [fetchRules])

  // Compute countdown + status flags
  const recompute = useCallback(() => {
    if (!rules || !cutoffLocal || !rules.timezone) {
      setMinsLeft(null)
      setIsNonShipDay(false)
      setIsBlackout(false)
      return
    }
    const tz = rules.timezone
    const mins = minutesUntilCutoff({ tz, cutoffLocalHHMM: cutoffLocal })
    setMinsLeft(mins)

    // Check if today is a ship day
    const now = getNowInTz(tz)
    setIsNonShipDay(!shipDays.includes(now.dayOfWeek))

    // Check blackout
    const todayStr = now.dateStr
    const inBlackout = (rules.blackoutWindows || []).some(bw => todayStr >= bw.start && todayStr <= bw.end)
    setIsBlackout(inBlackout)
  }, [rules, cutoffLocal, shipDays])

  // Initial compute + interval
  useEffect(() => {
    recompute()
    intervalRef.current = setInterval(recompute, REFRESH_MS)
    return () => clearInterval(intervalRef.current)
  }, [recompute])

  // Don't render if no location/division selected or no rules available
  if (!locationId || !division || !rules || !divRule) return null

  // Determine status
  let status = 'GREEN'
  let label = ''

  if (!nextDayEnabled) {
    status = 'YELLOW'
    label = 'Next-day shipping not available'
  } else if (isBlackout) {
    status = 'RED'
    label = 'Blackout — next-day promise not available today'
  } else if (isNonShipDay) {
    status = 'YELLOW'
    label = 'Non-ship day — next-day promise not available today'
  } else if (minsLeft == null) {
    status = 'YELLOW'
    label = 'Cutoff time unavailable'
  } else if (minsLeft <= 0) {
    status = 'RED'
    label = `Next-day cutoff passed — earliest ships next business day`
  } else if (minsLeft <= 60) {
    status = 'YELLOW'
    label = `Cutoff ${formatTime12(cutoffLocal)} (${formatCountdown(minsLeft)})`
  } else {
    status = 'GREEN'
    label = `Cutoff ${formatTime12(cutoffLocal)} (${formatCountdown(minsLeft)})`
  }

  const chipColor = status === 'GREEN' ? 'success' : status === 'YELLOW' ? 'warning' : 'error'
  const ChipIcon = status === 'GREEN' ? CheckCircle : status === 'YELLOW' ? Warning : ErrorOutline

  const canViewRules = user?.role && (
    ADMIN_ROLES.includes(user.role) || user.canManageCutoffRules === true
  )

  const tooltipText = `${locationName} • ${division} — ${label}`

  return (
    <>
      <Tooltip title={tooltipText} arrow>
        <Chip
          icon={<ChipIcon sx={{ fontSize: 16 }} />}
          label={label}
          size="small"
          color={chipColor}
          variant="outlined"
          onClick={(e) => setPopoverAnchor(e.currentTarget)}
          sx={{
            cursor: 'pointer',
            maxWidth: 320,
            fontWeight: 500,
            fontSize: '0.75rem',
            '& .MuiChip-icon': { fontSize: 16 },
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }}
        />
      </Tooltip>

      <CutoffClockPopover
        anchorEl={popoverAnchor}
        open={Boolean(popoverAnchor)}
        onClose={() => setPopoverAnchor(null)}
        locationName={locationName}
        timezone={rules?.timezone}
        division={division}
        cutoffLocal={cutoffLocal}
        minutesLeft={minsLeft}
        shipDays={shipDays}
        blackoutWindows={rules?.blackoutWindows}
        canViewRules={canViewRules}
      />
    </>
  )
}
