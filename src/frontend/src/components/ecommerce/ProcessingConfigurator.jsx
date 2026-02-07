/**
 * ProcessingConfigurator — select processing operations for e-commerce product config.
 * Division-aware, uses allowed processes from onlineEventsApi.
 */
import React, { useState, useEffect } from 'react'
import {
  Paper, Box, Typography, Chip, IconButton, Button, List, ListItemButton,
  ListItemText, ListItemIcon, Grid, TextField, CircularProgress, Collapse, Alert,
} from '@mui/material'
import {
  ContentCut as CutIcon, Autorenew as FormIcon, Build as MachineIcon,
  AutoFixHigh as FinishIcon, Add as AddIcon, Delete as DeleteIcon, ExpandMore, ExpandLess,
} from '@mui/icons-material'
import { listProcesses } from '../../services/intakeProcessingApi'

const TYPE_ICON = { CUT: CutIcon, FORM: FormIcon, MACHINE: MachineIcon, FINISH: FinishIcon }
const TYPE_COLOR = { CUT: 'error', FORM: 'primary', MACHINE: 'info', FINISH: 'success' }

export default function ProcessingConfigurator({ steps = [], onChange, division, disabled = false }) {
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (!division) return
    setLoading(true)
    listProcesses({ division }).then(res => setProcesses(res.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [division])

  const addStep = (proc) => {
    onChange([...steps, {
      processId: proc.id, code: proc.code, name: proc.name, type: proc.type,
      pricePerOp: proc.pricePerOp, priceUnit: proc.priceUnit, estimatedMinutes: proc.estimatedMinutes,
      estimatedCost: proc.pricePerOp, params: {},
    }])
  }

  const removeStep = (idx) => onChange(steps.filter((_, i) => i !== idx))

  const updateParam = (idx, key, val) => {
    onChange(steps.map((s, i) => i === idx ? { ...s, params: { ...s.params, [key]: val } } : s))
  }

  const totalCost = steps.reduce((s, st) => s + (st.estimatedCost || 0), 0)
  const totalMinutes = steps.reduce((s, st) => s + (st.estimatedMinutes || 0), 0)

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
      >
        <MachineIcon color="info" />
        <Typography variant="subtitle1" fontWeight={600}>Processing Options</Typography>
        {steps.length > 0 && <Chip label={`${steps.length} step(s)`} size="small" color="info" />}
        {totalCost > 0 && <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', mr: 1 }}>+${totalCost.toFixed(2)}</Typography>}
        {expanded ? <ExpandLess /> : <ExpandMore />}
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          {steps.length === 0 && (
            <Alert severity="info" variant="outlined" sx={{ mb: 1 }}>No processing added. Select operations below (optional).</Alert>
          )}

          {/* Selected steps */}
          {steps.map((step, idx) => {
            const Icon = TYPE_ICON[step.type] || MachineIcon
            const proc = processes.find(p => p.id === step.processId)
            return (
              <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip icon={<Icon />} label={step.name} size="small" color={TYPE_COLOR[step.type] || 'default'} variant="outlined" />
                  <Typography variant="caption" color="text.secondary">${step.estimatedCost?.toFixed(2)}/{step.priceUnit}</Typography>
                  {!disabled && <IconButton size="small" color="error" onClick={() => removeStep(idx)} sx={{ ml: 'auto' }}><DeleteIcon fontSize="small" /></IconButton>}
                </Box>
                {proc?.params?.length > 0 && (
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    {proc.params.map(pm => (
                      <Grid item xs={6} sm={4} key={pm.key}>
                        <TextField size="small" fullWidth label={pm.label} disabled={disabled}
                          value={step.params[pm.key] || ''} onChange={e => updateParam(idx, pm.key, e.target.value)}
                          InputProps={{ endAdornment: pm.unit ? <Typography variant="caption" color="text.secondary">{pm.unit}</Typography> : null }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            )
          })}

          {/* Available processes */}
          {!disabled && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Add processing:</Typography>
              {loading ? <CircularProgress size={20} sx={{ ml: 2 }} /> : (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {processes.map(p => {
                    const Icon = TYPE_ICON[p.type] || MachineIcon
                    return (
                      <Chip key={p.id} icon={<Icon />} label={`${p.name} ($${p.pricePerOp})`} size="small"
                        color={TYPE_COLOR[p.type] || 'default'} variant="outlined" clickable onClick={() => addStep(p)} />
                    )
                  })}
                  {processes.length === 0 && <Typography variant="caption" color="text.secondary">No processing available for this division.</Typography>}
                </Box>
              )}
            </Box>
          )}

          {steps.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, mt: 1.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">Est. time: {totalMinutes} min</Typography>
              <Typography variant="caption" fontWeight={600}>Processing total: ${totalCost.toFixed(2)}</Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}
