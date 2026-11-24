/**
 * The lights on a job's card: one per step of its plan, in order, each with the step's name written on it and lit
 * by the step's status (owner, 2026-11-22). Everything is readable without pointing at it: finished is solid green
 * with a tick, the running step is solid blue and glows, a step queued at its machine is outlined orange, a step
 * not started is grey. Pointing at a light adds the machine. A job with no plan shows no lights.
 * On the shop floor the step that belongs to the machine being looked at (`here`) has a dark ring.
 */
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { keyframes } from '@mui/system'
import { Check as DoneIcon, PlayArrow as RunningIcon, Pause as PausedIcon, Schedule as QueuedIcon } from '@mui/icons-material'
import { stepLight, lightsSummary, detailRows } from '../production/productionView'

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.6); }
  50% { box-shadow: 0 0 0 5px rgba(25, 118, 210, 0); }
`
const TONES = {
  done: { bgcolor: '#2e7d32', color: '#fff', border: '1px solid #2e7d32' },
  running: { bgcolor: '#1565c0', color: '#fff', border: '1px solid #1565c0', animation: `${glow} 1.6s ease-in-out infinite`, '@media (prefers-reduced-motion: reduce)': { animation: 'none', boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.3)' } },
  paused: { bgcolor: '#b45309', color: '#fff', border: '1px solid #b45309' },
  queued: { bgcolor: '#fff7ed', color: '#9a3412', border: '1px solid #ea580c' },
  waiting: { bgcolor: '#f1f3f5', color: '#495057', border: '1px solid #ced4da' },
}
const ICONS = { done: DoneIcon, running: RunningIcon, paused: PausedIcon, queued: QueuedIcon }

// showDetails: 'all' lists what to do at every step that says; 'current' only the step the job is on now.
export default function StepLights({ steps, showText = false, showDetails = false, sx }) {
  const list = Array.isArray(steps) ? steps : []
  if (!list.length) return null
  const summary = lightsSummary(list)
  return (
    <Box sx={sx} data-testid="step-lights">
      <Stack direction="row" alignItems="center" role="list" aria-label={summary} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
        {list.map((step, i) => {
          const light = stepLight(step)
          const Icon = ICONS[light.tone]
          const name = step.name || `Step ${i + 1}`
          return (
            <Tooltip key={step.sequence ?? i} title={[`${i + 1}. ${name}`, step.machine, light.words, step.detail, step.here ? 'this machine\'s step' : null].filter(Boolean).join(' · ')}>
              <Box role="listitem" aria-label={`Step ${i + 1}, ${name}: ${light.words}${step.here ? ', this machine\'s step' : ''}`} data-testid="step-light" data-tone={light.tone} data-here={step.here ? 'yes' : undefined}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, maxWidth: 150, height: 20, px: 0.75, borderRadius: 10, boxSizing: 'border-box', fontSize: '0.68rem', fontWeight: 600, lineHeight: 1,
                  ...TONES[light.tone], ...(step.here ? { outline: '2px solid #212529', outlineOffset: 1 } : {}) }}>
                {Icon && <Icon sx={{ fontSize: 12, flexShrink: 0 }} />}
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Box>
              </Box>
            </Tooltip>
          )
        })}
      </Stack>
      {showText && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }} data-testid="step-lights-text">{summary}</Typography>}
      {showDetails && detailRows(list, showDetails).map((row) => (
        <Typography key={row.n} variant="caption" display="block" data-testid="step-detail" sx={{ mt: 0.25, color: 'text.primary', fontWeight: row.now ? 600 : 400 }}>
          {row.n}. {row.name}: {row.detail}
        </Typography>
      ))}
    </Box>
  )
}
