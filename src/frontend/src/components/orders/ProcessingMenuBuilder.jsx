/**
 * ProcessingMenuBuilder — select processing operations + parameters per line.
 */
import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  List, ListItemButton, ListItemText, ListItemIcon, Chip, Divider, TextField,
  Grid, IconButton, Paper, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material'
import {
  ContentCut as CutIcon, Autorenew as FormIcon, Build as MachineIcon,
  AutoFixHigh as FinishIcon, Close as CloseIcon, Add as AddIcon,
  Delete as DeleteIcon, DragIndicator as DragIcon, PlaylistAdd as TemplateIcon,
} from '@mui/icons-material'
import { listProcesses, listTemplates } from '../../services/intakeProcessingApi'

const TYPE_ICON = { CUT: CutIcon, FORM: FormIcon, MACHINE: MachineIcon, FINISH: FinishIcon }
const TYPE_COLOR = { CUT: 'error', FORM: 'primary', MACHINE: 'info', FINISH: 'success' }

export default function ProcessingMenuBuilder({ open, onClose, onSave, division, existingProcesses = [] }) {
  const [processes, setProcesses] = useState([])
  const [templates, setTemplates] = useState([])
  const [selected, setSelected] = useState(existingProcesses)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setSelected(existingProcesses)
    ;(async () => {
      setLoading(true)
      try {
        const [procRes, tplRes] = await Promise.all([listProcesses({ division }), listTemplates({ division })])
        setProcesses(procRes.data || [])
        setTemplates(tplRes.data || [])
      } catch { /* ignore */ }
      finally { setLoading(false) }
    })()
  }, [open, division])

  // Helper: update selected and immediately save to parent
  const updateAndSave = (newSelected) => {
    setSelected(newSelected)
    if (onSave) onSave(newSelected)
  }

  const addProcess = (proc) => {
    const entry = { id: proc.id, code: proc.code, name: proc.name, type: proc.type, pricePerOp: proc.pricePerOp, priceUnit: proc.priceUnit, estimatedMinutes: proc.estimatedMinutes, params: {}, estimatedCost: proc.pricePerOp }
    updateAndSave([...selected, entry])
  }

  const applyTemplate = (tpl) => {
    const entries = tpl.steps.map(s => {
      const p = s.process || {}
      return { id: p.id, code: p.code, name: p.name, type: p.type, pricePerOp: p.pricePerOp, priceUnit: p.priceUnit, estimatedMinutes: p.estimatedMinutes, params: {}, estimatedCost: p.pricePerOp }
    })
    updateAndSave(entries)
  }

  const removeStep = (idx) => {
    const next = selected.filter((_, i) => i !== idx)
    updateAndSave(next)
  }

  const updateParam = (idx, key, val) => {
    const next = selected.map((s, i) => i === idx ? { ...s, params: { ...s.params, [key]: val } } : s)
    updateAndSave(next)
  }

  const handleDone = () => {
    if (onSave) onSave(selected)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Processing Steps
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', gap: 2, minHeight: 400 }}>
        {/* Left: available operations + templates */}
        <Box sx={{ width: 260, flexShrink: 0, borderRight: 1, borderColor: 'divider', pr: 2, overflowY: 'auto' }}>
          {loading ? <CircularProgress size={24} sx={{ m: 3 }} /> : (
            <>
              <Typography variant="overline" color="text.secondary">Templates</Typography>
              <List dense>
                {templates.map(t => (
                  <ListItemButton key={t.id} onClick={() => applyTemplate(t)} sx={{ borderRadius: 1, mb: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}><TemplateIcon fontSize="small" color="primary" /></ListItemIcon>
                    <ListItemText primary={t.name} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} secondary={`${t.steps.length} steps`} />
                  </ListItemButton>
                ))}
              </List>
              <Divider sx={{ my: 1 }} />
              <Typography variant="overline" color="text.secondary">Operations</Typography>
              <List dense>
                {processes.map(p => {
                  const Icon = TYPE_ICON[p.type] || MachineIcon
                  return (
                    <ListItemButton key={p.id} onClick={() => addProcess(p)} sx={{ borderRadius: 1, mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}><Icon fontSize="small" color={TYPE_COLOR[p.type]} /></ListItemIcon>
                      <ListItemText primary={p.name} primaryTypographyProps={{ variant: 'body2' }} secondary={`$${p.pricePerOp}/${p.priceUnit}`} />
                    </ListItemButton>
                  )
                })}
              </List>
            </>
          )}
        </Box>

        {/* Right: selected steps */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <Typography variant="overline" color="text.secondary">Selected Steps ({selected.length})</Typography>
          {selected.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>Choose a template or add individual operations from the left panel.</Alert>
          )}
          {selected.map((step, idx) => {
            const Icon = TYPE_ICON[step.type] || MachineIcon
            const proc = processes.find(p => p.id === step.id)
            return (
              <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DragIcon fontSize="small" color="disabled" />
                  <Chip icon={<Icon />} label={step.name} size="small" color={TYPE_COLOR[step.type] || 'default'} variant="outlined" />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>~{step.estimatedMinutes} min</Typography>
                  <IconButton size="small" color="error" onClick={() => removeStep(idx)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
                {proc?.params?.length > 0 && (
                  <Grid container spacing={1}>
                    {proc.params.map(pm => (
                      <Grid item xs={4} key={pm.key}>
                        <TextField
                          size="small" fullWidth label={pm.label}
                          value={step.params[pm.key] || ''} onChange={e => updateParam(idx, pm.key, e.target.value)}
                          InputProps={{ endAdornment: pm.unit ? <Typography variant="caption" color="text.secondary">{pm.unit}</Typography> : null }}
                          required={pm.required}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            )
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, pl: 2 }}>
          Est. cost: ${selected.reduce((s, p) => s + (p.estimatedCost || 0), 0).toFixed(2)}
        </Typography>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleDone}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}
