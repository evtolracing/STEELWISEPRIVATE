/**
 * One shipment, read from /api/shipments/:id. Dispatch, Deliver and Cancel
 * call the server, which checks the order, its jobs and its stock and gives
 * the reason when it refuses.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box, Typography, Paper, Grid, Button, IconButton, Alert, CircularProgress, Snackbar, Link, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material'
import { ArrowBack as BackIcon, LocalShipping as DispatchIcon, CheckCircle as DeliverIcon, Cancel as CancelIcon, Edit as EditIcon } from '@mui/icons-material'
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
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setName(''); setError('') } }, [open])
  const save = async () => {
    setBusy(true); setError('')
    try {
      await client.put(`/shipments/${shipment.id}/deliver`, name.trim() ? { podSignature: name.trim() } : {})
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
        <TextField fullWidth label="Signed for by" helperText="The name on the delivery receipt, if there is one" value={name} onChange={(e) => setName(e.target.value)} inputProps={{ maxLength: 200 }} sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="success" onClick={save} disabled={busy}>Mark delivered</Button>
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
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { data } = await client.get(`/shipments/${id}`)
      setShipment(data)
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
            <Typography variant="h5" fontWeight={700}>{shipment.shipmentNumber}</Typography>
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
            <Fact name="Signed for by">{shipment.podSignature}</Fact>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Invoice</Typography>
            {shipment.invoices?.length ? shipment.invoices.map((inv) => (
              <Fact key={inv.id} name={inv.kind === 'CREDIT' ? 'Credit' : 'Invoice'}>
                <Link component={RouterLink} to="/orders/invoices">{inv.invoiceNumber}</Link> {dollars(inv.totalAmount)} ({String(inv.status).toLowerCase()})
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
        <DialogTitle>{confirm === 'dispatch' ? `Dispatch ${shipment.shipmentNumber}?` : `Cancel ${shipment.shipmentNumber}?`}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirm === 'dispatch'
              ? 'The stock reserved for these lines is taken out of inventory, the order is updated and the invoice is raised. This cannot be undone here.'
              : 'Nothing has left the dock, so stock and the order are not changed. The lines can go on another shipment.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Go back</Button>
          {confirm === 'dispatch'
            ? <Button variant="contained" onClick={dispatch}>Dispatch now</Button>
            : <Button variant="contained" color="error" onClick={cancel}>Cancel the shipment</Button>}
        </DialogActions>
      </Dialog>
      <TruckDialog shipment={shipment} open={dialog === 'truck'} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setToast('Saved'); load() }} />
      <DeliverDialog shipment={shipment} open={dialog === 'deliver'} onClose={() => setDialog(null)} onDone={() => { setDialog(null); setToast('Marked delivered'); load() }} />
      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast('')} message={toast} />
    </Box>
  )
}
