/**
 * One coil work order, read from /api/work-orders/:id. The buttons call the
 * server; a move the work order's status does not allow is refused there and
 * the reason is shown. Nothing on this screen is sample data.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box, Typography, Paper, Grid, Button, IconButton, Chip, Alert, CircularProgress, Snackbar, Link,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material'
import { ArrowBack as BackIcon, PlayArrow as StartIcon, CheckCircle as CompleteIcon, Cancel as CancelIcon, Send as ReleaseIcon } from '@mui/icons-material'
import client from '../../api/client'

export const WO_TYPE_LABELS = { SLIT: 'Slitting', CTL: 'Cut to length', BLANK: 'Blanking', LEVELCUT: 'Level cut', MULTIBLANKING: 'Multi-blanking', SHEAR: 'Shearing' }
export const WO_STATUS_LABELS = { DRAFT: 'Draft', READY: 'Ready', IN_PROGRESS: 'In progress', QC_HOLD: 'Quality hold', COMPLETE: 'Complete', CANCELLED: 'Cancelled' }
const WO_STATUS_COLORS = { DRAFT: 'default', READY: 'info', IN_PROGRESS: 'primary', QC_HOLD: 'warning', COMPLETE: 'success', CANCELLED: 'error' }
export const WO_PRIORITY_LABELS = { 1: 'Critical', 2: 'High', 3: 'Normal', 4: 'Low', 5: 'Low' }

export const WorkOrderStatusChip = ({ status }) => <Chip size="small" label={WO_STATUS_LABELS[status] || status} color={WO_STATUS_COLORS[status] || 'default'} />
const when = (v) => (v ? new Date(v).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '')
const pounds = (v) => (v == null || v === '' ? '' : `${Number(v).toLocaleString()} lb`)
const Fact = ({ name, children }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" display="block">{name}</Typography>
    <Typography variant="body1" component="div">{children || <Typography component="span" variant="body2" color="text.secondary">Not recorded</Typography>}</Typography>
  </Box>
)

function CompleteDialog({ wo, open, onClose, onDone }) {
  const [out, setOut] = useState('')
  const [scrap, setScrap] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setOut(''); setScrap(''); setError('') } }, [open])
  const save = async () => {
    setBusy(true); setError('')
    try {
      await client.put(`/work-orders/${wo.id}/complete`, { outputWeightLb: out, scrapWeightLb: scrap === '' ? 0 : scrap })
      onDone('Work order completed')
    } catch (e) {
      setError(e.response?.data?.error || 'The work order could not be completed')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Complete {wo.woNumber}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Weight in: {pounds(wo.inputWeightLb) || 'not recorded'}. Yield is worked out from what you enter.
        </Typography>
        <TextField fullWidth type="number" label="Good weight out (lb)" value={out} onChange={(e) => setOut(e.target.value)} inputProps={{ min: 0, step: 'any' }} sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Scrap (lb)" value={scrap} onChange={(e) => setScrap(e.target.value)} inputProps={{ min: 0, step: 'any' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="success" onClick={save} disabled={busy || out === ''}>{busy ? 'Saving…' : 'Complete work order'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function WorkOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [wo, setWo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { data } = await client.get(`/work-orders/${id}`)
      setWo(data)
    } catch (e) {
      setWo(null)
      setError(e.response?.status === 404 ? 'This work order is not on file.' : (e.response?.data?.error || 'The work order could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => { load() }, [load])

  const act = async (action, done) => {
    setBusy(true); setActionError('')
    try {
      await client.put(`/work-orders/${id}/${action}`, {})
      setToast(done)
      await load()
    } catch (e) {
      setActionError(e.response?.data?.error || 'That could not be done')
    } finally {
      setBusy(false)
    }
  }

  if (loading && !wo) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>
  if (!wo) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button color="inherit" onClick={() => navigate('/work-orders')}>Work orders</Button>}>{error}</Alert>
      </Box>
    )
  }

  const coil = wo.sourceCoil
  const open = !['COMPLETE', 'CANCELLED'].includes(wo.status)
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/work-orders')} aria-label="Back to work orders"><BackIcon /></IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h5" fontWeight={700}>{wo.woNumber}</Typography>
            <WorkOrderStatusChip status={wo.status} />
            <Chip size="small" variant="outlined" label={`${WO_PRIORITY_LABELS[wo.priority] || 'Normal'} priority`} />
          </Box>
          <Typography variant="body2" color="text.secondary">{WO_TYPE_LABELS[wo.woType] || wo.woType}</Typography>
        </Box>
        {wo.status === 'DRAFT' && <Button startIcon={<ReleaseIcon />} variant="outlined" disabled={busy} onClick={() => act('release', 'Released to the floor')}>Release</Button>}
        {['DRAFT', 'READY', 'QC_HOLD'].includes(wo.status) && <Button startIcon={<StartIcon />} variant="contained" color="success" disabled={busy} onClick={() => act('start', 'Work started')}>Start</Button>}
        {['IN_PROGRESS', 'QC_HOLD'].includes(wo.status) && <Button startIcon={<CompleteIcon />} variant="contained" color="success" disabled={busy} onClick={() => setCompleting(true)}>Complete</Button>}
        {open && <Button startIcon={<CancelIcon />} color="error" disabled={busy} onClick={() => act('cancel', 'Work order cancelled')}>Cancel work order</Button>}
      </Box>

      {actionError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>{actionError}</Alert>}
      <Alert severity="info" sx={{ mb: 2 }}>
        A work order records the plan and the weights. It does not yet change stock: the source item is not used up and the pieces made are not added to inventory by completing it.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Source stock item</Typography>
            <Fact name="Item">{coil ? <Link component={RouterLink} to={`/units/${coil.id}`}>{coil.coilNumber}</Link> : ''}</Fact>
            <Fact name="Grade">{coil?.grade?.code}</Fact>
            <Fact name="Heat">{coil?.heat?.heatNumber}</Fact>
            <Fact name="Location">{coil?.location ? `${coil.location.name} (${coil.location.code})` : ''}</Fact>
            <Fact name="Item weight">{pounds(coil?.netWeightLb)}</Fact>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Plan and result</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}><Fact name="Scheduled for">{wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString() : ''}</Fact></Grid>
              <Grid item xs={6}><Fact name="Weight in">{pounds(wo.inputWeightLb)}</Fact></Grid>
              <Grid item xs={6}><Fact name="Started">{when(wo.startedAt)}</Fact></Grid>
              <Grid item xs={6}><Fact name="Completed">{when(wo.completedAt)}</Fact></Grid>
              <Grid item xs={4}><Fact name="Good weight out">{pounds(wo.outputWeightLb)}</Fact></Grid>
              <Grid item xs={4}><Fact name="Scrap">{pounds(wo.scrapWeightLb)}</Fact></Grid>
              <Grid item xs={4}><Fact name="Yield">{wo.yieldPct == null ? '' : `${Number(wo.yieldPct)}%`}</Fact></Grid>
              <Grid item xs={12}><Fact name="Notes"><span style={{ whiteSpace: 'pre-wrap' }}>{wo.notes}</span></Fact></Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>History</Typography>
            {wo.history?.length ? (
              <TableContainer>
                <Table size="small" aria-label="Work order history">
                  <TableHead><TableRow><TableCell>When</TableCell><TableCell>What happened</TableCell><TableCell>By</TableCell><TableCell>Note</TableCell></TableRow></TableHead>
                  <TableBody>
                    {wo.history.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{when(h.timestamp)}</TableCell>
                        <TableCell>{h.type === 'CREATED' ? 'Work order created' : <>{WO_STATUS_LABELS[h.from] || h.from} to <strong>{WO_STATUS_LABELS[h.to] || h.to}</strong></>}</TableCell>
                        <TableCell>{h.by || 'Not recorded'}</TableCell>
                        <TableCell>{h.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">Created {when(wo.createdAt)}. No changes have been recorded since.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <CompleteDialog wo={wo} open={completing} onClose={() => setCompleting(false)} onDone={(m) => { setCompleting(false); setToast(m); load() }} />
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  )
}
