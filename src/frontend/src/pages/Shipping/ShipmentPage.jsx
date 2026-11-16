/**
 * One shipment, read from /api/shipments/:id. Dispatch, Deliver and Cancel
 * call the server, which checks the order, its jobs and its stock and gives
 * the reason when it refuses.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box, Typography, Paper, Grid, Button, IconButton, Alert, CircularProgress, Snackbar, Link, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Chip, FormControlLabel, Checkbox,
} from '@mui/material'
import { ArrowBack as BackIcon, LocalShipping as DispatchIcon, CheckCircle as DeliverIcon, Cancel as CancelIcon, Edit as EditIcon, Print as PrintIcon, ReportProblem as ProblemIcon } from '@mui/icons-material'
import client from '../../api/client'
import { SHIPMENT_STATUS_LABELS, ShipmentStatusChip } from './ShippingPage'

const when = (v) => (v ? new Date(v).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '')
const dollars = (v) => Number(v || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
const errorText = (e, fallback) => e.response?.data?.error || fallback
const Fact = ({ name, children }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" display="block">{name}</Typography>
    <Typography variant="body1" component="div">{children || <Typography component="span" variant="body2" color="text.secondary">Not recorded</Typography>}</Typography>
  </Box>
)
const TRUCK_FIELDS = [['carrierName', 'Carrier', 100], ['bolNumber', 'Bill of lading number', 60], ['truckNumber', 'Truck number', 40], ['driverName', 'Driver', 100], ['driverPhone', 'Driver phone', 30]]

function TruckDialog({ shipment, open, onClose, onSaved }) {
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (open) { setError(''); setForm(Object.fromEntries(TRUCK_FIELDS.map(([k]) => [k, shipment[k] || '']))) }
  }, [open, shipment])
  const save = async () => {
    setBusy(true); setError('')
    try {
      await client.put(`/shipments/${shipment.id}`, Object.fromEntries(TRUCK_FIELDS.map(([k]) => [k, form[k].trim() || null])))
      onSaved()
    } catch (e) {
      setError(errorText(e, 'The details could not be saved'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Carrier and truck</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {TRUCK_FIELDS.map(([k, label, max]) => (
          <TextField key={k} fullWidth size="small" label={label} value={form[k] ?? ''} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} inputProps={{ maxLength: max }} sx={{ mt: 2 }} />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

function DeliverDialog({ shipment, open, onClose, onDone }) {
  const [name, setName] = useState('')
  const [noName, setNoName] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setName(''); setReason(''); setNoName(false); setError('') } }, [open])
  const ready = noName ? reason.trim().length >= 3 : name.trim().length > 0
  const save = async () => {
    setBusy(true); setError('')
    try {
      await client.put(`/shipments/${shipment.id}/deliver`, noName ? { noPodReason: reason.trim() } : { podSignature: name.trim() })
      onDone()
    } catch (e) {
      setError(errorText(e, 'The delivery could not be recorded'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Mark {shipment.shipmentNumber} delivered</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!noName && <TextField fullWidth autoFocus label="Received by" helperText="The name of the person who took delivery" value={name} onChange={(e) => setName(e.target.value)} inputProps={{ maxLength: 200 }} sx={{ mt: 1 }} />}
        <FormControlLabel sx={{ mt: 1 }} control={<Checkbox checked={noName} onChange={(e) => setNoName(e.target.checked)} />} label="Nobody signed for it" />
        {noName && <TextField fullWidth autoFocus label="Why there is no name" helperText="For example: left at the gate as the customer asked" value={reason} onChange={(e) => setReason(e.target.value)} inputProps={{ maxLength: 300 }} sx={{ mt: 1 }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="success" onClick={save} disabled={busy || !ready}>Mark delivered</Button>
      </DialogActions>
    </Dialog>
  )
}

const LOST_KINDS = [['LOST', 'Lost in transit'], ['DESTROYED', 'Destroyed in transit'], ['REFUSED', 'Refused and not coming back']]

/** A load that never arrives: a manager ends the shipment and its invoice is credited (N-027). */
function LostDialog({ shipment, open, onClose, onDone }) {
  const [kind, setKind] = useState('LOST')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setKind('LOST'); setReason(''); setError('') } }, [open])
  const save = async () => {
    setBusy(true); setError('')
    try {
      const r = await client.put(`/shipments/${shipment.id}/lost`, { kind, reason: reason.trim() })
      onDone(r.data?.credit ? `Recorded as lost. Credit ${r.data.credit.invoiceNumber} issued.` : 'Recorded as lost. Its invoice was already credited in full.')
    } catch (e) {
      setError(errorText(e, 'The loss could not be recorded'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>End {shipment.shipmentNumber} as lost</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Alert severity="warning" sx={{ mb: 2 }}>A manager's decision. The shipment ends here and everything not yet credited on its invoice is credited to the customer. This cannot be undone. If the material is coming back, use a return instead.</Alert>
        <TextField select fullWidth label="What kind of loss" value={kind} onChange={(e) => setKind(e.target.value)} sx={{ mb: 2 }}>
          {LOST_KINDS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <TextField fullWidth multiline minRows={2} label="What happened" helperText="Kept in the shipment's history and on the credit." value={reason} onChange={(e) => setReason(e.target.value)} inputProps={{ maxLength: 300 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="error" onClick={save} disabled={busy || reason.trim().length < 3}>End as lost and credit</Button>
      </DialogActions>
    </Dialog>
  )
}

function ProblemDialog({ shipment, open, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setReason(''); setError('') } }, [open])
  const save = async () => {
    setBusy(true); setError('')
    try {
      await client.patch(`/shipments/${shipment.id}/status`, { status: 'EXCEPTION', reason: reason.trim() })
      onDone()
    } catch (e) {
      setError(errorText(e, 'The problem could not be recorded'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Report a problem with {shipment.shipmentNumber}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField fullWidth autoFocus multiline minRows={2} label="What happened" helperText="For example: refused at the door, damaged in transit, truck broke down. It is kept in the history." value={reason} onChange={(e) => setReason(e.target.value)} inputProps={{ maxLength: 300 }} sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={save} disabled={busy || reason.trim().length < 3}>Record the problem</Button>
      </DialogActions>
    </Dialog>
  )
}

const PAPER_NAMES = { PACKING_LIST: 'Packing list', BOL: 'Bill of lading' }

/** Shows the paper exactly as it will print. It is drawn by the server from what is on file. */
function PaperDialog({ paper, onClose }) {
  const frame = useRef(null)
  if (!paper) return null
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{PAPER_NAMES[paper.type] || 'Paper'}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <iframe ref={frame} title={PAPER_NAMES[paper.type] || 'Paper'} srcDoc={paper.html} sandbox="allow-same-origin allow-modals" style={{ width: '100%', height: '70vh', border: 0, background: '#fff' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print() }}>Print</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ShipmentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [confirm, setConfirm] = useState(null)
  // The question being asked is remembered while its dialog fades out. Without this the closing dialog
  // turned into the other question for a moment, and the second click of a double click on "Dispatch now"
  // landed on "Cancel the shipment" and cancelled it.
  const lastConfirm = useRef(null)
  if (confirm) lastConfirm.current = confirm
  const asking = confirm || lastConfirm.current
  const [toast, setToast] = useState('')
  const [papers, setPapers] = useState(null)
  const [paper, setPaper] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { data } = await client.get(`/shipments/${id}`)
      setShipment(data)
      // What the pick list, packing list and bill of lading will say. The screen still works without it.
      client.get(`/shipments/${id}/documents`).then((r) => setPapers(r.data)).catch(() => setPapers(null))
    } catch (e) {
      setShipment(null)
      setError(e.response?.status === 404 ? 'This shipment is not on file.' : errorText(e, 'The shipment could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => { load() }, [load])

  const act = async (call, done) => {
    setBusy(true); setActionError(''); setConfirm(null)
    try {
      const { data } = await call()
      setToast(typeof done === 'function' ? done(data) : done)
      await load()
    } catch (e) {
      setActionError(errorText(e, 'That could not be done'))
      // No answer came back, so the step may or may not have been saved. Read the shipment
      // again: what the screen shows next is what the server has.
      if (!e.response?.status) await load()
    } finally {
      setBusy(false)
    }
  }
  const dispatch = () => act(() => client.put(`/shipments/${id}/dispatch`, {}), (d) => {
    if (d?.invoiceWarning) { setActionError(d.invoiceWarning); return 'Dispatched. The invoice was not raised.' }
    return d?.invoice ? `Dispatched. Invoice ${d.invoice.invoiceNumber} raised.` : 'Dispatched.'
  })
  const print = async (type) => {
    setBusy(true); setActionError('')
    try {
      const { data } = await client.post('/print-queue/trigger-shipment', { shipmentId: id })
      const job = (data.papers || []).find((p) => p.type === type)
      if (!job) throw new Error('none')
      const drawn = await client.get(`/print-queue/${job.id}/render`, { responseType: 'text', transformResponse: [(v) => v] })
      setPaper({ type, html: drawn.data })
    } catch (e) {
      setActionError(errorText(e, 'The paper could not be drawn'))
    } finally {
      setBusy(false)
    }
  }
  const cancel = () => act(() => client.patch(`/shipments/${id}/status`, { status: 'CANCELLED' }), 'Shipment cancelled')

  if (loading && !shipment) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>
  if (!shipment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button color="inherit" onClick={() => navigate('/shipping')}>Shipping</Button>}>{error}</Alert>
      </Box>
    )
  }

  const onDock = ['PENDING', 'LOADING'].includes(shipment.status)
  const onRoad = ['IN_TRANSIT', 'EXCEPTION'].includes(shipment.status)
  const buyer = shipment.order?.buyer
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/shipping')} aria-label="Back to shipping"><BackIcon /></IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography component="h1" variant="h5" fontWeight={700}>{shipment.shipmentNumber}</Typography>
            <ShipmentStatusChip status={shipment.status} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Order <Link component={RouterLink} to={`/orders/${shipment.order?.id}`}>{shipment.order?.orderNumber}</Link>{buyer?.name ? `, ${buyer.name}` : ''}
          </Typography>
        </Box>
        {onDock && <Button startIcon={<EditIcon />} disabled={busy} onClick={() => setDialog('truck')}>Carrier and truck</Button>}
        {onDock && <Button variant="contained" startIcon={<DispatchIcon />} disabled={busy} onClick={() => setConfirm('dispatch')}>Dispatch</Button>}
        {shipment.status === 'EXCEPTION' && <Button variant="contained" startIcon={<DispatchIcon />} disabled={busy} onClick={dispatch}>Back on the road</Button>}
        {onRoad && <Button variant="contained" color="success" startIcon={<DeliverIcon />} disabled={busy} onClick={() => setDialog('deliver')}>Mark delivered</Button>}
        {shipment.status === 'EXCEPTION' && <Button color="error" disabled={busy} onClick={() => setDialog('lost')}>Lost for good</Button>}
        {shipment.status === 'IN_TRANSIT' && <Button color="warning" startIcon={<ProblemIcon />} disabled={busy} onClick={() => setDialog('problem')}>Report a problem</Button>}
        {shipment.status !== 'CANCELLED' && <Button startIcon={<PrintIcon />} disabled={busy} onClick={() => print('PACKING_LIST')}>Packing list</Button>}
        {shipment.status !== 'CANCELLED' && <Button startIcon={<PrintIcon />} disabled={busy} onClick={() => print('BOL')}>Bill of lading</Button>}
        {onDock && <Button color="error" startIcon={<CancelIcon />} disabled={busy} onClick={() => setConfirm('cancel')}>Cancel shipment</Button>}
      </Box>

      {actionError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>{actionError}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>What is on it</Typography>
            <TableContainer>
              <Table size="small" aria-label="Shipment lines">
                <TableHead><TableRow><TableCell>Line</TableCell><TableCell>Description</TableCell><TableCell align="right">On this shipment</TableCell><TableCell align="right">Ordered</TableCell><TableCell align="right">Shipped so far</TableCell></TableRow></TableHead>
                <TableBody>
                  {shipment.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.orderLine?.lineNumber}</TableCell>
                      <TableCell>{it.orderLine?.description}</TableCell>
                      <TableCell align="right">{Number(it.qtyShipped)} {it.orderLine?.unit}</TableCell>
                      <TableCell align="right">{Number(it.orderLine?.qtyOrdered)}</TableCell>
                      <TableCell align="right">{Number(it.orderLine?.qtyShipped)}</TableCell>
                    </TableRow>
                  ))}
                  {!shipment.items.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Nothing has been put on this shipment.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {papers && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>{papers.stage === 'BEFORE_DISPATCH' ? 'Stock to pick' : 'Stock that left'}</Typography>
              {papers.missing?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  The papers will print with blanks for what is not on file:
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>{papers.missing.map((m) => <li key={m}>{m}</li>)}</Box>
                </Alert>
              )}
              <TableContainer>
                <Table size="small" aria-label="Stock on this shipment">
                  <TableHead><TableRow><TableCell>Line</TableCell><TableCell>Tag</TableCell><TableCell>Heat</TableCell><TableCell>Grade</TableCell><TableCell>Bin</TableCell><TableCell align="right">Quantity</TableCell></TableRow></TableHead>
                  <TableBody>
                    {papers.lines.flatMap((l) => l.stock.map((x, i) => (
                      <TableRow key={`${l.orderLineId}-${i}`}>
                        <TableCell>{l.lineNumber}</TableCell>
                        <TableCell>{x.tag}{x.atThisDock === false && <Chip size="small" color="error" label="At another branch" sx={{ ml: 1 }} />}</TableCell>
                        <TableCell>{x.heatNumber || 'None on file'}</TableCell>
                        <TableCell>{x.grade || ''}</TableCell>
                        <TableCell>{x.bin || 'No bin'}</TableCell>
                        <TableCell align="right">{x.quantity} {x.unit}</TableCell>
                      </TableRow>
                    )))}
                    {!papers.lines.some((l) => l.stock.length) && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>{papers.stage === 'BEFORE_DISPATCH' ? 'No stock is reserved for these lines yet.' : 'No stock movement names this shipment.'}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
              {papers.lines.some((l) => l.quantityStillToShip > 0) && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Back order after this shipment: {papers.lines.filter((l) => l.quantityStillToShip > 0).map((l) => `line ${l.lineNumber}, ${l.quantityStillToShip} ${l.unit || ''}`.trim()).join('; ')}.
                </Typography>
              )}
            </Paper>
          )}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>History</Typography>
            {shipment.history?.length ? (
              <TableContainer>
                <Table size="small" aria-label="Shipment history">
                  <TableHead><TableRow><TableCell>When</TableCell><TableCell>What happened</TableCell><TableCell>By</TableCell><TableCell>Note</TableCell></TableRow></TableHead>
                  <TableBody>
                    {shipment.history.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{when(h.timestamp)}</TableCell>
                        <TableCell>{h.from ? <>{SHIPMENT_STATUS_LABELS[h.from] || h.from} to <strong>{SHIPMENT_STATUS_LABELS[h.to] || h.to}</strong></> : 'Shipment created'}</TableCell>
                        <TableCell>{h.by || 'Not recorded'}</TableCell>
                        <TableCell>{h.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">Created {when(shipment.createdAt)}. Who created and moved it was not recorded at the time.</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Truck</Typography>
            <Fact name="Ships from">{shipment.fromLocation ? `${shipment.fromLocation.name} (${shipment.fromLocation.code})` : ''}</Fact>
            <Fact name="Carrier">{shipment.carrierName}</Fact>
            <Fact name="Bill of lading number">{shipment.bolNumber}</Fact>
            <Fact name="Truck number">{shipment.truckNumber}</Fact>
            <Fact name="Driver">{[shipment.driverName, shipment.driverPhone].filter(Boolean).join(', ')}</Fact>
          </Paper>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Dates</Typography>
            <Fact name="Left the dock">{when(shipment.shippedAt)}</Fact>
            <Fact name="Delivered">{when(shipment.deliveredAt)}</Fact>
            <Fact name="Received by">{shipment.podSignature}</Fact>
            {shipment.noPodReason && <Fact name="Why there is no name">{shipment.noPodReason}</Fact>}
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Invoice</Typography>
            {shipment.invoices?.length ? shipment.invoices.map((inv) => (
              <Fact key={inv.id} name={inv.kind === 'CREDIT' ? 'Credit' : 'Invoice'}>
                <Link component={RouterLink} to="/orders/invoices">{inv.invoiceNumber}</Link> {inv.totalAmount == null ? '' : dollars(inv.totalAmount)} ({String(inv.status).toLowerCase()})
              </Fact>
            )) : (
              <Typography variant="body2" color="text.secondary">
                {onDock ? 'The invoice is raised when the shipment is dispatched.' : shipment.status === 'CANCELLED' ? 'A cancelled shipment is not invoiced.' : 'No invoice is tied to this shipment. Check the Invoices screen for the order.'}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{asking === 'dispatch' ? `Dispatch ${shipment.shipmentNumber}?` : `Cancel ${shipment.shipmentNumber}?`}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {asking === 'dispatch'
              ? 'The stock reserved for these lines is taken out of inventory, the order is updated and the invoice is raised. This cannot be undone here.'
              : 'Nothing has left the dock, so stock and the order are not changed. The lines can go on another shipment.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Go back</Button>
          {asking === 'dispatch'
            ? <Button variant="contained" disabled={!confirm || busy} onClick={dispatch}>Dispatch now</Button>
            : <Button variant="contained" color="error" disabled={!confirm || busy} onClick={cancel}>Cancel the shipment</Button>}
        </DialogActions>
      </Dialog>
      <TruckDialog shipment={shipment} open={dialog === 'truck'} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setToast('Saved'); load() }} />
      <LostDialog shipment={shipment} open={dialog === 'lost'} onClose={() => setDialog(null)} onDone={(text) => { setDialog(null); setToast(text); load() }} />
      <ProblemDialog shipment={shipment} open={dialog === 'problem'} onClose={() => setDialog(null)} onDone={() => { setDialog(null); setToast('Problem recorded'); load() }} />
      <PaperDialog paper={paper} onClose={() => setPaper(null)} />
      <DeliverDialog shipment={shipment} open={dialog === 'deliver'} onClose={() => setDialog(null)} onDone={() => { setDialog(null); setToast('Marked delivered'); load() }} />
      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast('')} message={toast} />
    </Box>
  )
}
