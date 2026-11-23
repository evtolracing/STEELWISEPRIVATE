/**
 * The lights on a job's card: one per step of its plan, in order, lit by the step's status (owner, 2026-11-22).
 * Finished is solid green, the running step glows, a step queued at its machine is outlined, a step not started is
 * dim. Pointing at a light names the step, its machine and its status. A job with no plan shows no lights.
 * On the shop floor the step that belongs to the machine being looked at (`here`) is drawn taller.
 */
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { keyframes } from '@mui/system'
import { stepLight, lightsSummary } from '../production/productionView'

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.55); }
  50% { box-shadow: 0 0 0 5px rgba(25, 118, 210, 0); }
`
const TONES = {
  done: { bgcolor: '#2e7d32', border: '1px solid #2e7d32' },
  running: { bgcolor: '#1976d2', border: '1px solid #1976d2', animation: `${glow} 1.6s ease-in-out infinite`, '@media (prefers-reduced-motion: reduce)': { animation: 'none', boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.3)' } },
  paused: { bgcolor: '#ed6c02', border: '1px solid #ed6c02' },
  queued: { bgcolor: 'rgba(237, 108, 2, 0.15)', border: '2px solid #ed6c02' },
  waiting: { bgcolor: 'rgba(0, 0, 0, 0.12)', border: '1px solid rgba(0, 0, 0, 0.18)' },
}

export default function StepLights({ steps, showText = false, sx }) {
  const list = Array.isArray(steps) ? steps : []
  if (!list.length) return null
  const summary = lightsSummary(list)
  return (
    <Box sx={sx} data-testid="step-lights">
      <Stack direction="row" spacing={0.5} alignItems="center" role="img" aria-label={summary} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
        {list.map((step, i) => {
          const light = stepLight(step)
          return (
            <Tooltip key={step.sequence ?? i} title={[`${i + 1}. ${step.name || 'Step'}`, step.machine, light.words, step.here ? 'this machine\'s step' : null].filter(Boolean).join(' · ')}>
              <Box data-testid="step-light" data-tone={light.tone} data-here={step.here ? 'yes' : undefined}
                sx={{ flex: '1 1 14px', minWidth: 14, maxWidth: 44, height: step.here ? 12 : 8, borderRadius: 4, boxSizing: 'border-box', ...TONES[light.tone] }} />
            </Tooltip>
          )
        })}
      </Stack>
      {showText && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }} data-testid="step-lights-text">{summary}</Typography>}
    </Box>
  )
}
