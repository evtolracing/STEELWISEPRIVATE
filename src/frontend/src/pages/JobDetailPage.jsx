/**
 * One job: what it is for, where it stands, and everything that has happened
 * to it. All of it is read from /api/jobs/:id and /api/jobs/:id/history.
 * Nothing on this screen is sample data.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box, Typography, Paper, Grid, Button, IconButton, Chip, Alert, CircularProgress, Snackbar, Link, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material'
import { ArrowBack as BackIcon, SwapHoriz as MoveIcon, Refresh as RefreshIcon, AltRoute as PlanIcon } from '@mui/icons-material'
import client from '../api/client'
import { JOB_STATUS_CONFIG } from '../constants/jobStatuses'
import { readableNotes } from '../utils/readableNotes.js'
import StepLights from '../components/jobs/StepLights'
import PlanChangeDialog, { stepStatusLabel } from '../components/jobs/PlanChangeDialog'

export const jobStatusLabel = (status) => JOB_STATUS_CONFIG[status]?.label || String(status || '').replace(/_/g, ' ').toLowerCase()
const when = (v) => (v ? new Date(v).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '')
const pounds = (v) => (v == null || v === '' ? '' : `${Number(v).toLocaleString()} lb`)
const dollars = (v) => (v == null ? '' : Number(v).toLocaleString(undefined, { style: 'currency', currency: 'USD' }))
const person = (u) => (u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : '')
const PRIORITY_LABELS = { LOW: 'Low', NORMAL: 'Normal', HIGH: 'High', HOT: 'Hot' }

// Every status a job can be moved to by hand. The server decides whether a
// particular move is allowed and says why when it is not.
const ALL_STATUSES = ['ORDERED', 'SCHEDULED', 'IN_PROCESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'ON_HOLD', 'COMPLETED', 'CANCELLED']

const Fact = ({ name, children }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" display="block">{name}</Typography>
    <Typography variant="body1" component="div">{children || <Typography component="span" variant="body2" color="text.secondary">Not recorded</Typography>}</Typography>
  </Box>
)

export function JobStatusChip({ status }) {
  const cfg = JOB_STATUS_CONFIG[status]
  return <Chip label={jobStatusLabel(status)} size="small" sx={{ fontWeight: 600, color: cfg?.color, bgcolor: cfg?.bgColor }} />
}

function ChangeStatusDialog({ job, open, onClose, onSaved }) {
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (open) { setStatus(''); setNote(''); setError('') }
  }, [open])
  const save = async () => {
    setBusy(true); setError('')
    try {
      const { data } = await client.post(`/jobs/${job.id}/status`, { status, note: note.trim() || undefined })
      onSaved(data)
    } catch (e) {
      setError(e.response?.data?.error || 'The status could not be changed')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change status of {job.jobNumber}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Now: {jobStatusLabel(job.status)}. The change is recorded in the job history with your name.
        </Typography>
        <TextField select fullWidth label="New status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ mb: 2 }}>
          {ALL_STATUSES.filter((s) => s !== job.status).map((s) => <MenuItem key={s} value={s}>{jobStatusLabel(s)}</MenuItem>)}
        </TextField>
        <TextField fullWidth multiline minRows={2} label="Reason (optional)" value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 500 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || !status}>{busy ? 'Saving…' : 'Change status'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(false)
  const [toast, setToast] = useState('')
  const [plan, setPlan] = useState(null)
  const [planDialog, setPlanDialog] = useState(false)
  // What the job used and made, from the coil work orders raised for it; and its cost, for the roles that see cost.
  const [material, setMaterial] = useState(null)
  const [cost, setCost] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [j, h] = await Promise.all([client.get(`/jobs/${id}`), client.get(`/jobs/${id}/history`)])
      setJob(j.data)
      setHistory(Array.isArray(h.data) ? h.data : [])
      client.get(`/jobs/${id}/material`).then((r) => setMaterial(r.data)).catch(() => setMaterial(null))
      // 403 means this person does not see cost: the section is simply not shown.
      client.get(`/jobs/${id}/cost`).then((r) => setCost(r.data)).catch(() => setCost(null))
      // The plan: its steps, their machines, and whether this person may change it.
      client.get(`/jobs/${id}/plan/change`).then((r) => setPlan(r.data)).catch(() => setPlan(null))
    } catch (e) {
      setJob(null)
      setError(e.response?.status === 404 ? 'This job is not on file.' : (e.response?.data?.error || 'The job could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => { load() }, [load])

  if (loading) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>
  if (!job) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button color="inherit" onClick={() => navigate('/order-board')}>Order Board</Button>}>{error}</Alert>
      </Box>
    )
  }

  const closed = ['COMPLETED', 'CANCELLED'].includes(job.status)
  const size = [job.thicknessIn && `${Number(job.thicknessIn)} in thick`, job.widthIn && `${Number(job.widthIn)} in wide`, job.lengthIn && `${Number(job.lengthIn)} in long`].filter(Boolean).join(', ')

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate(-1)} aria-label="Back"><BackIcon /></IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography component="h1" variant="h5" fontWeight={700}>{job.jobNumber}</Typography>
            <JobStatusChip status={job.status} />
            <Chip label={`${PRIORITY_LABELS[job.priority] || job.priority} priority`} size="small" variant="outlined" color={job.priority === 'HOT' ? 'error' : job.priority === 'HIGH' ? 'warning' : 'default'} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {job.order ? <>For order <Link component={RouterLink} to={`/orders/${job.order.id}`}>{job.order.orderNumber}</Link>{job.order.buyer?.name ? `, ${job.order.buyer.name}` : ''}</> : 'Not tied to a customer order'}
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
        {plan?.exists && <Button variant="outlined" startIcon={<PlanIcon />} onClick={() => setPlanDialog(true)} data-testid="job-change-plan">{plan.mayChange ? 'Change plan' : 'View plan'}</Button>}
        <Button variant="contained" startIcon={<MoveIcon />} onClick={() => setDialog(true)} disabled={closed}>Change status</Button>
      </Box>

      {closed && <Alert severity="info" sx={{ mb: 2 }}>This job is {jobStatusLabel(job.status).toLowerCase()}, so it can no longer be changed.</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          {plan?.exists && (
            <Paper sx={{ p: 3, mb: 3 }} data-testid="job-plan">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Plan</Typography>
                {plan.mayChange && <Button size="small" startIcon={<PlanIcon />} onClick={() => setPlanDialog(true)}>Change plan</Button>}
              </Box>
              <StepLights steps={plan.steps.map((st) => ({ ...st, machine: st.machineName }))} showText sx={{ mb: 1.5 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Step</TableCell><TableCell>Machine</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                  <TableBody>
                    {plan.steps.map((s) => (
                      <TableRow key={s.id} data-testid="job-plan-step">
                        <TableCell>{s.sequence}. {s.name}</TableCell>
                        <TableCell>{s.machineName || <Typography component="span" variant="body2" color="text.secondary">No machine yet</Typography>}</TableCell>
                        <TableCell>{stepStatusLabel(s.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Work</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><Fact name="Operation">{job.operationType ? String(job.operationType).replace(/_/g, ' ') : ''}</Fact></Grid>
              <Grid item xs={12} sm={6}><Fact name="Work center">{job.workCenter ? `${job.workCenter.name} (${job.workCenter.code})` : ''}</Fact></Grid>
              <Grid item xs={12} sm={6}><Fact name="Assigned to">{person(job.assignedTo)}</Fact></Grid>
              <Grid item xs={12} sm={6}><Fact name="Created by">{person(job.createdBy)}</Fact></Grid>
              <Grid item xs={12}><Fact name="Instructions">{readableNotes(job.instructions)}</Fact></Grid>
              {size && <Grid item xs={12}><Fact name="Finished size">{size}</Fact></Grid>}
              <Grid item xs={12}><Fact name="Notes"><span style={{ whiteSpace: 'pre-wrap' }}>{readableNotes(job.notes)}</span></Fact></Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>History</Typography>
            <TableContainer>
              <Table size="small" aria-label="Job history">
                <TableHead>
                  <TableRow><TableCell>When</TableCell><TableCell>What happened</TableCell><TableCell>By</TableCell><TableCell>Note</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{when(h.timestamp)}</TableCell>
                      <TableCell>
                        {h.type === 'STATUS'
                          ? <>{h.from ? `${jobStatusLabel(h.from)} to ` : 'Moved to '}<strong>{jobStatusLabel(h.status)}</strong></>
                          : h.type === 'CREATED' ? 'Job created' : h.note}
                      </TableCell>
                      <TableCell>{h.by || <Typography component="span" variant="body2" color="text.secondary">{h.recorded ? 'System' : 'Not recorded'}</Typography>}</TableCell>
                      <TableCell>{h.type === 'STATUS' ? h.note : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {history.some((h) => !h.recorded) && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Some steps happened before status changes were recorded with a name, so only their times are known.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Dates</Typography>
            <Fact name="Scheduled start">{when(job.scheduledStart)}</Fact>
            <Fact name="Scheduled finish">{when(job.scheduledEnd)}</Fact>
            <Divider sx={{ my: 1.5 }} />
            <Fact name="Work started">{when(job.actualStart)}</Fact>
            <Fact name="Work finished">{when(job.actualEnd)}</Fact>
            <Fact name="Shipped">{when(job.shippedAt)}</Fact>
          </Paper>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6">Material</Typography>
              {!closed && <Button size="small" component={RouterLink} to={`/work-orders/new?jobId=${job.id}`}>Cut material for this job</Button>}
            </Box>
            {!material || material.workOrders.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No coil work order has been raised for this job, so no material, scrap or yield is recorded against it.
              </Typography>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mt: 0 }}>
                  <Grid item xs={6}><Fact name="Material used">{pounds(material.totals.usedLb)}</Fact></Grid>
                  <Grid item xs={6}><Fact name="Made">{pounds(material.totals.outputLb)}</Fact></Grid>
                  <Grid item xs={6}><Fact name="Scrap">{pounds(material.totals.scrapLb)}</Fact></Grid>
                  <Grid item xs={6}><Fact name="Yield">{material.totals.yieldPct == null ? '' : `${material.totals.yieldPct}%`}</Fact></Grid>
                </Grid>
                <Table size="small" aria-label="Coil work orders for this job">
                  <TableHead><TableRow><TableCell>Work order</TableCell><TableCell>Cut from</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                  <TableBody>
                    {material.workOrders.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell><Link component={RouterLink} to={`/work-orders/${w.id}`}>{w.woNumber}</Link></TableCell>
                        <TableCell>{w.source?.coilNumber}{w.source?.heatNumber ? `, heat ${w.source.heatNumber}` : ''}</TableCell>
                        <TableCell>{String(w.status).replace(/_/g, ' ').toLowerCase()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Paper>
          {cost && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Cost</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><Fact name="Material">{cost.materialComplete || cost.materialCost > 0 ? dollars(cost.materialCost) : ''}</Fact></Grid>
                <Grid item xs={6}><Fact name="Labor">{cost.laborComplete || cost.laborCost > 0 ? dollars(cost.laborCost) : ''}</Fact></Grid>
                <Grid item xs={12}><Fact name={cost.complete ? 'Total' : 'Total so far'}>{cost.totalCost > 0 || cost.complete ? dollars(cost.totalCost) : ''}</Fact></Grid>
              </Grid>
              {cost.missing?.length > 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  This cost is not complete. {cost.missing.slice(0, 3).join('. ')}.
                </Alert>
              )}
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>{cost.basis}</Typography>
            </Paper>
          )}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Shipping</Typography>
            <Fact name="Carrier">{job.shippingCarrier}</Fact>
            <Fact name="Tracking number">{job.trackingNumber}</Fact>
          </Paper>
        </Grid>
      </Grid>

      <ChangeStatusDialog
        job={job}
        open={dialog}
        onClose={() => setDialog(false)}
        onSaved={() => { setDialog(false); setToast('Status changed'); load() }}
      />
      <PlanChangeDialog jobId={job.id} open={planDialog} onClose={() => setPlanDialog(false)} onSaved={() => { setToast('The plan was changed.'); load() }} />
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  )
}
