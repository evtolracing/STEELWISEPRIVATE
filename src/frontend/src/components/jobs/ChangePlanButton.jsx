/**
 * The "Change plan" control for a job's card on a board. It opens the same window as the job screen, so a plan can
 * be changed where the job is seen (owner, 2026-11-22). Nothing is shown for a job that is through production.
 */
import { useState } from 'react'
import { Box, Button, IconButton, Tooltip } from '@mui/material'
import { AltRoute as PlanIcon } from '@mui/icons-material'
import PlanChangeDialog from './PlanChangeDialog'

const OPEN = ['ORDERED', 'SCHEDULED', 'IN_PROCESS', 'ON_HOLD']
/** A plan can still change until the job is through production. A card that does not say its status still gets the control. */
export const planCanChange = (status) => !status || OPEN.includes(String(status))
// A card is itself clickable, so nothing done in the button or its window may count as a click on the card.
const stop = (e) => e.stopPropagation()

export default function ChangePlanButton({ jobId, status, onSaved, onOpenJob, variant = 'icon', size = 'small', sx }) {
  const [open, setOpen] = useState(false)
  if (!jobId || !planCanChange(status)) return null
  const show = (e) => { e.stopPropagation(); setOpen(true) }
  return (
    <Box component="span" onClick={stop} onMouseDown={stop} onKeyDown={stop} onDragStart={(e) => { e.preventDefault(); e.stopPropagation() }} sx={{ display: 'inline-flex', ...sx }}>
      {variant === 'icon' ? (
        <Tooltip title="Change plan">
          <IconButton size={size} aria-label="Change plan" onClick={show} data-testid="card-change-plan"><PlanIcon fontSize="small" /></IconButton>
        </Tooltip>
      ) : (
        <Button size={size} variant={variant === 'outlined' ? 'outlined' : 'text'} startIcon={<PlanIcon />} onClick={show} data-testid="card-change-plan">Change plan</Button>
      )}
      {open && <PlanChangeDialog jobId={jobId} open onClose={() => setOpen(false)} onOpenJob={onOpenJob} onSaved={() => { setOpen(false); onSaved?.() }} />}
    </Box>
  )
}
