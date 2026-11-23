/**
 * Change the plan of a job in production: move a step to another machine, reorder the steps still to do, add a step
 * or take one out. Finished steps are shown and locked. A reason is required and is kept in the job's history.
 * Reads GET /api/jobs/:id/plan/change and saves with PUT; the server holds the rules (lib/planChange.js).
 */
import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material'
import { Add as AddIcon, ArrowDownward as DownIcon, ArrowUpward as UpIcon, DeleteOutline as RemoveIcon, Lock as LockIcon } from '@mui/icons-material'
import client from '../../api/client'

const STEP_WORDS = { PENDING: 'Not started', SCHEDULED: 'Scheduled', IN_PROCESS: 'Running', PAUSED: 'Paused', COMPLETE: 'Finished' }
export const stepStatusLabel = (status) => STEP_WORDS[status] || String(status || '').replace(/_/g, ' ').toLowerCase()
let nextKey = 0

export default function PlanChangeDialog({ jobId, open, onClose, onSaved }) {
  const [data, setData] = useState(null)
  const [rows, setRows] = useState([])
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || !jobId) return
    let live = true
    setLoading(true); setError(''); setReason(''); setData(null)
    client.get(`/jobs/${jobId}/plan/change`)
      .then((r) => { if (!live) return; setData(r.data); setRows((r.data.steps || []).filter((s) => !s.finished).map((s) => ({ key: s.id, id: s.id, name: s.name, kind: s.requiredWorkCenterType, machine: s.assignedWorkCenterId || '', worked: s.worked, status: s.status }))) })
      .catch((e) => { if (live) setError(e.response?.data?.error || 'The plan could not be loaded.') })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [open, jobId])

  const finished = (data?.steps || []).filter((s) => s.finished)
  const machinesOf = (kind) => (data?.machines || []).filter((m) => m.type === kind)
  const kindLabel = (id) => (data?.kinds || []).find((k) => k.id === id)?.label || id
  const set = (key, patch) => setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const move = (i, by) => setRows((list) => { const out = [...list]; const j = i + by; if (j < 0 || j >= out.length) return list; [out[i], out[j]] = [out[j], out[i]]; return out })
  const add = () => { nextKey += 1; const kind = data?.kinds?.[0]?.id || ''; setRows((list) => [...list, { key: `new-${nextKey}`, id: null, name: '', kind, machine: '', worked: false, status: 'PENDING' }]) }
  const canSave = data?.mayChange && reason.trim() && !busy && rows.every((r) => r.kind)

  const save = async () => {
    setBusy(true); setError('')
    try {
      const { data: saved } = await client.put(`/jobs/${jobId}/plan/change`, {
        reason: reason.trim(),
        steps: rows.map((r) => ({ ...(r.id ? { id: r.id } : {}), name: r.name.trim() || undefined, workCenterType: r.kind, workCenterId: r.machine || null })),
      })
      onSaved?.(saved)
      onClose()
    } catch (e) {
      // The server says what is wrong in words; nothing is changed until it accepts the whole plan.
      setError(e.response?.data?.error || 'The plan could not be changed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth data-testid="plan-change-dialog">
      <DialogTitle>Change plan{data?.jobNumber ? `: ${data.jobNumber}` : ''}</DialogTitle>
      <DialogContent dividers>
        {loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress aria-label="Loading the plan" /></Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }} data-testid="plan-change-error">{error}</Alert>}
        {data && !data.mayChange && <Alert severity="info" sx={{ mb: 2 }} data-testid="plan-change-closed">{data.whyNot}</Alert>}
        {data?.exists && (
          <Stack spacing={1.5}>
            {finished.map((s) => (
              <Paper key={s.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }} data-testid="plan-step-finished">
                <Stack direction="row" spacing={1} alignItems="center">
                  <LockIcon fontSize="small" color="disabled" />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}><strong>{s.sequence}. {s.name}</strong> · {kindLabel(s.requiredWorkCenterType)}{s.machineName ? ` · ${s.machineName}` : ''}</Typography>
                  <Chip size="small" label="Finished" />
                </Stack>
              </Paper>
            ))}
            {rows.map((r, i) => (
              <Paper key={r.key} variant="outlined" sx={{ p: 1.5 }} data-testid="plan-step">
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
                  <Typography variant="body2" fontWeight={700} sx={{ minWidth: 24 }}>{finished.length + i + 1}.</Typography>
                  <TextField size="small" label="Step" value={r.name} onChange={(e) => set(r.key, { name: e.target.value })} placeholder={kindLabel(r.kind)} sx={{ flex: 1.5 }} disabled={!data.mayChange} />
                  <TextField size="small" select label="Kind of work" value={r.kind} onChange={(e) => set(r.key, { kind: e.target.value, machine: '' })} sx={{ flex: 1.5 }} disabled={!data.mayChange || r.worked}
                    helperText={r.worked ? 'Work is recorded, so the kind stays' : undefined}>
                    {(data.kinds || []).concat((data.kinds || []).some((k) => k.id === r.kind) ? [] : [{ id: r.kind, label: r.kind }]).map((k) => <MenuItem key={k.id} value={k.id}>{k.label}</MenuItem>)}
                  </TextField>
                  <TextField size="small" select label="Machine" value={r.machine} onChange={(e) => set(r.key, { machine: e.target.value })} sx={{ flex: 3 }} disabled={!data.mayChange} inputProps={{ 'data-testid': 'plan-step-machine' }}>
                    <MenuItem value="">No machine yet</MenuItem>
                    {machinesOf(r.kind).map((m) => (
                      <MenuItem key={m.id} value={m.id} disabled={m.isActive === false && m.id !== r.machine}>
                        {m.name}{m.isActive === false ? ' (offline)' : ` · ${m.stepsWaiting} ${m.stepsWaiting === 1 ? 'step' : 'steps'} waiting`}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Chip size="small" label={stepStatusLabel(r.status)} color={r.status === 'IN_PROCESS' ? 'primary' : 'default'} variant={r.id ? 'filled' : 'outlined'} />
                  <Stack direction="row">
                    <IconButton size="small" aria-label={`Move step ${finished.length + i + 1} up`} onClick={() => move(i, -1)} disabled={!data.mayChange || i === 0}><UpIcon fontSize="small" /></IconButton>
                    <IconButton size="small" aria-label={`Move step ${finished.length + i + 1} down`} onClick={() => move(i, 1)} disabled={!data.mayChange || i === rows.length - 1}><DownIcon fontSize="small" /></IconButton>
                    <IconButton size="small" aria-label={`Remove step ${finished.length + i + 1}`} onClick={() => setRows((list) => list.filter((x) => x.key !== r.key))} disabled={!data.mayChange || r.worked}><RemoveIcon fontSize="small" /></IconButton>
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {data.mayChange && (
              <>
                <Box><Button startIcon={<AddIcon />} onClick={add} data-testid="plan-step-add">Add a step</Button></Box>
                <TextField label="Why is the plan changing?" value={reason} onChange={(e) => setReason(e.target.value)} required fullWidth multiline minRows={2}
                  helperText="Kept in the job's history with your name. Time already recorded stays with the machine it was worked on." inputProps={{ 'data-testid': 'plan-change-reason', maxLength: 500 }} />
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!canSave} data-testid="plan-change-save">{busy ? 'Saving…' : 'Save the plan'}</Button>
      </DialogActions>
    </Dialog>
  )
}
