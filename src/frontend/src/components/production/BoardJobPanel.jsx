/**
 * The window a card on the Production Workflow board opens: what the job is, every step of its plan with what to do
 * there, and everything a drag can do as buttons (move to a column, move up or down its column), so the board works
 * on a touch screen and from the keyboard too. It decides nothing itself: the page does the move.
 */
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography } from '@mui/material'
import {
  ArrowDownward as DownIcon, ArrowUpward as UpIcon, VerticalAlignTop as TopIcon, VerticalAlignBottom as BottomIcon, OpenInNew as OpenIcon,
} from '@mui/icons-material'
import StepLights from '../jobs/StepLights'
import ChangePlanButton from '../jobs/ChangePlanButton'
import { stepLight, stepText } from './productionView'
import { moveChoices, boardMove } from './boardMoves'
import { calendarDate } from '../../utils/calendarDate'

const MOVE_WORDS = { plan: 'Plan this job', machine: 'Put on a machine', unmachine: 'Take off its machine' }

export default function BoardJobPanel({ job, stages = [], open, onClose, onMove, onNudge, onPlanChanged, canArrange, whyNoArrange }) {
  if (!job) return null
  const stage = stages.find((s) => s.key === job.stage)
  const choices = moveChoices(job, stages)
  // One button for each different thing a move does: several columns can mean the same thing (put back into production).
  const seen = new Set()
  const buttons = choices.map((s) => {
    const m = boardMove(job, s.key)
    const key = m.kind === 'status' ? `status:${m.status}` : m.kind
    if (seen.has(key)) return null
    seen.add(key)
    return { stage: s.key, label: m.kind === 'status' ? (m.back ? 'Put back into production' : `Move to ${s.label}`) : MOVE_WORDS[m.kind] }
  }).filter(Boolean)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth data-testid="board-job-panel">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <span>{job.jobNumber}</span>
          {stage && <Chip size="small" label={stage.label} color="primary" variant="outlined" />}
          {job.priority >= 4 && <Chip size="small" color="error" label="Hot" />}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2">{[job.orderNumber || 'No order', job.customerName].filter(Boolean).join(' · ')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {[job.locationName || 'No branch on file', job.division, job.dueDate ? `Due ${calendarDate(job.dueDate)}` : 'No due date'].filter(Boolean).join(' · ')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{stepText(job)}{job.workCenterName ? ` · ${job.workCenterName}` : ''}</Typography>

        {job.planSteps?.length > 0 ? (
          <>
            <StepLights steps={job.planSteps} sx={{ mb: 1 }} />
            <Stack spacing={0.75} data-testid="panel-steps">
              {job.planSteps.map((s, i) => (
                <Box key={`${s.sequence}-${i}`} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body2"><strong>{i + 1}. {s.name || `Step ${i + 1}`}</strong> · {stepLight(s).words}{s.machine ? ` · ${s.machine}` : ' · no machine yet'}</Typography>
                  <Typography variant="caption" color={s.detail ? 'text.primary' : 'text.secondary'}>{s.detail || 'The plan does not say what to do at this step.'}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        ) : <Alert severity="warning">This job has no plan yet.</Alert>}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>Move this job</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap data-testid="panel-moves">
          {buttons.map((b) => <Button key={b.stage} size="small" variant="outlined" onClick={() => onMove(b.stage)} data-testid={`panel-move-${b.stage}`}>{b.label}</Button>)}
          {job.stepCount > 0 && <ChangePlanButton jobId={job.id} status={job.status} variant="outlined" onSaved={() => { onPlanChanged?.(); onClose() }} />}
        </Stack>
        {(job.stage === 'QUEUED' || job.stage === 'RUNNING') && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Steps are started and finished at the machine on the Shop Floor, where the operator, pieces and time are recorded.
          </Typography>
        )}

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Place in its column</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button size="small" startIcon={<TopIcon />} disabled={!canArrange} onClick={() => onNudge('top')} data-testid="panel-top">Top</Button>
          <Button size="small" startIcon={<UpIcon />} disabled={!canArrange} onClick={() => onNudge('up')} data-testid="panel-up">Up</Button>
          <Button size="small" startIcon={<DownIcon />} disabled={!canArrange} onClick={() => onNudge('down')} data-testid="panel-down">Down</Button>
          <Button size="small" startIcon={<BottomIcon />} disabled={!canArrange} onClick={() => onNudge('bottom')} data-testid="panel-bottom">Bottom</Button>
        </Stack>
        {!canArrange && whyNoArrange && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{whyNoArrange}</Typography>}
      </DialogContent>
      <DialogActions>
        {job.workCenterId && job.locationId && (
          <Button component={RouterLink} to={`/shopfloor/${job.workCenterId}?locationId=${job.locationId}`} sx={{ mr: 'auto' }} data-testid="panel-queue">Machine queue</Button>
        )}
        {job.orderId && <Button component={RouterLink} to={`/orders/${job.orderId}`}>Open the order</Button>}
        <Button component={RouterLink} to={`/jobs/${job.id}`} endIcon={<OpenIcon />} data-testid="panel-open-job">Open the job</Button>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  )
}
