/**
 * Put a job's next step on a machine, or take it off, from the Production Workflow board. It changes the plan the
 * same way the Change plan window does (PUT /api/jobs/:id/plan/change), touching only the step the job is on, so the
 * server's rules and the job's history apply. `mode` is 'machine' or 'unmachine'.
 */
import { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material'
import client from '../../api/client'

export default function PutOnMachineDialog({ job, mode = 'machine', open, onClose, onSaved }) {
  const [data, setData] = useState(null)
  const [machine, setMachine] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || !job?.id) return undefined
    let live = true
    setData(null); setError(''); setMachine('')
    setReason(mode === 'machine' ? 'Put on a machine from the production board' : 'Taken off its machine from the production board')
    client.get(`/jobs/${job.id}/plan/change`)
      .then((r) => { if (live) setData(r.data) })
      .catch((e) => { if (live) setError(e.response?.data?.error || 'The plan could not be loaded.') })
    return () => { live = false }
  }, [open, job?.id, mode])

  const todo = (data?.steps || []).filter((s) => !s.finished)
  const step = todo.find((s) => s.status === 'IN_PROCESS') || todo[0] || null
  const machines = (data?.machines || []).filter((m) => step && m.type === step.requiredWorkCenterType && m.isActive !== false)
  const canSave = data?.mayChange && step && reason.trim() && !busy && (mode === 'unmachine' || machine)

  const save = async () => {
    setBusy(true); setError('')
    try {
      await client.put(`/jobs/${job.id}/plan/change`, {
        reason: reason.trim(),
        steps: todo.map((s) => ({ id: s.id, name: s.name || undefined, workCenterType: s.requiredWorkCenterType, workCenterId: s.id === step.id ? (mode === 'machine' ? machine : null) : (s.assignedWorkCenterId || null) })),
      })
      onSaved?.(mode === 'machine' ? machines.find((m) => m.id === machine)?.name : null)
    } catch (e) {
      setError(e.response?.data?.error || 'The plan could not be changed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth data-testid="put-on-machine-dialog">
      <DialogTitle>{mode === 'machine' ? 'Put on a machine' : 'Take off its machine'}: {job?.jobNumber}</DialogTitle>
      <DialogContent dividers>
        {!data && !error && <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress aria-label="Loading the plan" /></Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }} data-testid="put-on-machine-error">{error}</Alert>}
        {data && !data.mayChange && <Alert severity="info" sx={{ mb: 2 }}>{data.whyNot}</Alert>}
        {data && !step && <Alert severity="info">This job has no step left to do.</Alert>}
        {data && step && (
          <Stack spacing={2}>
            <Typography variant="body2">
              Step {step.sequence}: <strong>{step.name}</strong>{step.detail ? ` · ${step.detail}` : ''}
              {mode === 'unmachine' && step.machineName ? `. It is on ${step.machineName} now and will wait to be given a machine again.` : ''}
            </Typography>
            {mode === 'machine' && (
              machines.length ? (
                <TextField select size="small" label="Machine" value={machine} onChange={(e) => setMachine(e.target.value)} disabled={!data.mayChange} inputProps={{ 'data-testid': 'put-on-machine-pick' }}>
                  {machines.map((m) => <MenuItem key={m.id} value={m.id}>{m.name} · {m.stepsWaiting} {m.stepsWaiting === 1 ? 'step' : 'steps'} waiting</MenuItem>)}
                </TextField>
              ) : <Alert severity="warning">No machine at this job's branch does this kind of work. Use Change plan to change the step.</Alert>
            )}
            <TextField size="small" label="Why?" value={reason} onChange={(e) => setReason(e.target.value)} required disabled={!data.mayChange}
              helperText="Kept in the job's history with your name." inputProps={{ maxLength: 500, 'data-testid': 'put-on-machine-reason' }} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!canSave} data-testid="put-on-machine-save">{busy ? 'Saving…' : mode === 'machine' ? 'Put on this machine' : 'Take off its machine'}</Button>
      </DialogActions>
    </Dialog>
  )
}
