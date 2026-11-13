/**
 * Shipping: the real shipments, read from /api/shipments. Search and the
 * status filter are applied by the server and the count is the server's.
 * A new shipment is built from what is still open on a confirmed order.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Paper, Button, TextField, MenuItem, Alert, LinearProgress, Chip, Grid,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import { Add as AddIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material'
import client from '../../api/client'

export const SHIPMENT_STATUS_LABELS = { PENDING: 'Not yet loaded', LOADING: 'Loading', IN_TRANSIT: 'On the road', DELIVERED: 'Delivered', EXCEPTION: 'Problem', CANCELLED: 'Cancelled' }
const STATUS_COLORS = { PENDING: 'default', LOADING: 'info', IN_TRANSIT: 'primary', DELIVERED: 'success', EXCEPTION: 'error', CANCELLED: 'default' }
export const ShipmentStatusChip = ({ status }) => <Chip size="small" label={SHIPMENT_STATUS_LABELS[status] || status} color={STATUS_COLORS[status] || 'default'} variant={status === 'CANCELLED' ? 'outlined' : 'filled'} />
export const shortDate = (v) => (v ? new Date(v).toLocaleDateString() : '')
const errorText = (e, fallback) => e.response?.data?.error || fallback
const LIMIT = 100

/** Find a confirmed order, choose what goes on the truck, create the shipment. */
function NewShipmentDialog({ open, onClose, onCreated }) {
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [qty, setQty] = useState({})
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState({ fromLocationId: '', carrierName: '', bolNumber: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setOrderNumber(''); setOrder(null); setQty({}); setError(''); setForm({ fromLocationId: '', carrierName: '', bolNumber: '' })
    client.get('/inventory/locations').then((r) => setLocations(Array.isArray(r.data) ? r.data : (r.data?.data || []))).catch(() => setError('The list of locations could not be loaded.'))
  }, [open])

  const find = async () => {
    setBusy(true); setError(''); setOrder(null)
    try {
      const { data } = await client.get('/shipments/shippable', { params: { orderNumber: orderNumber.trim() } })
      setOrder(data)
      setQty(Object.fromEntries(data.lines.map((l) => [l.orderLineId, l.waitingOn.length ? '' : (l.qtyOpen > 0 ? String(l.qtyOpen) : '')])))
      setForm((f) => ({ ...f, fromLocationId: data.suggestedLocationId || f.fromLocationId }))
    } catch (e) {
      setError(errorText(e, 'The order could not be looked up'))
    } finally {
      setBusy(false)
    }
  }

  const items = order ? order.lines.filter((l) => Number(qty[l.orderLineId]) > 0).map((l) => ({ orderLineId: l.orderLineId, qtyShipped: Number(qty[l.orderLineId]) })) : []
  const create = async () => {
    setBusy(true); setError('')
    try {
      const { data } = await client.post('/shipments', {
        orderId: order.orderId, fromLocationId: form.fromLocationId, items,
        ...(form.carrierName.trim() && { carrierName: form.carrierName.trim() }), ...(form.bolNumber.trim() && { bolNumber: form.bolNumber.trim() }),
      })
      onCreated(data)
    } catch (e) {
      setError(errorText(e, 'The shipment could not be created'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>New shipment</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
          <TextField
            size="small" label="Order number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} sx={{ minWidth: 240 }}
            onKeyDown={(e) => { if (e.key === 'Enter' && orderNumber.trim()) find() }}
          />
          <Button variant="outlined" startIcon={<SearchIcon />} onClick={find} disabled={busy || !orderNumber.trim()}>Find order</Button>
        </Box>
        {order && (
          <>
            <Typography variant="subtitle2">{order.orderNumber}{order.customer?.name ? `, ${order.customer.name}` : ''}</Typography>
            {order.reason && <Alert severity="warning" sx={{ my: 1 }}>{order.reason}</Alert>}
            <TableContainer sx={{ my: 1 }}>
              <Table size="small" aria-label="Order lines to ship">
                <TableHead>
                  <TableRow>
                    <TableCell>Line</TableCell><TableCell>Description</TableCell><TableCell align="right">Ordered</TableCell>
                    <TableCell align="right">Shipped</TableCell><TableCell align="right">Left to ship</TableCell><TableCell align="right" sx={{ width: 150 }}>Ship now</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.lines.map((l) => (
                    <TableRow key={l.orderLineId}>
                      <TableCell>{l.lineNumber}</TableCell>
                      <TableCell>
                        {l.description}
                        {l.waitingOn.length > 0 && <Typography variant="caption" color="warning.main" display="block">Waiting on {l.waitingOn.join(', ')}: not finished</Typography>}
                        {l.qtyOnOpenShipments > 0 && <Typography variant="caption" color="text.secondary" display="block">{l.qtyOnOpenShipments} already on a shipment that has not left</Typography>}
                      </TableCell>
                      <TableCell align="right">{l.qtyOrdered} {l.unit}</TableCell>
                      <TableCell align="right">{l.qtyShipped}</TableCell>
                      <TableCell align="right">{l.qtyOpen}</TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small" type="number" value={qty[l.orderLineId] ?? ''} disabled={l.qtyOpen <= 0}
                          onChange={(e) => setQty((q) => ({ ...q, [l.orderLineId]: e.target.value }))}
                          inputProps={{ min: 0, max: l.qtyOpen, step: 'any', 'aria-label': `Quantity to ship for line ${l.lineNumber}` }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth size="small" label="Ships from" value={form.fromLocationId} onChange={(e) => setForm((f) => ({ ...f, fromLocationId: e.target.value }))}>
                  {locations.map((l) => <MenuItem key={l.id} value={l.id}>{l.code}{l.name && l.name !== l.code ? `: ${l.name}` : ''}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Carrier" value={form.carrierName} onChange={(e) => setForm((f) => ({ ...f, carrierName: e.target.value }))} inputProps={{ maxLength: 100 }} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Bill of lading number" value={form.bolNumber} onChange={(e) => setForm((f) => ({ ...f, bolNumber: e.target.value }))} inputProps={{ maxLength: 60 }} /></Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={create} disabled={busy || !order || !!order.reason || !items.length || !form.fromLocationId}>Create shipment</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ShippingPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typed, setTyped] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearch(typed.trim()), 300)
    return () => clearTimeout(t)
  }, [typed])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await client.get('/shipments', { params: { limit: LIMIT, ...(search && { search }), ...(status && { status }) } })
      setRows(Array.isArray(res.data) ? res.data : [])
      setTotal(Number(res.headers?.['x-total-count']) || (Array.isArray(res.data) ? res.data.length : 0))
    } catch (e) {
      setRows([]); setTotal(0)
      setError(errorText(e, 'Shipments could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [search, status])
  useEffect(() => { load() }, [load])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700}>Shipping</Typography>
          <Typography variant="body2" color="text.secondary">Every shipment against a customer order. Dispatching one takes the stock out, updates the order and raises the invoice.</Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>New shipment</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField size="small" label="Search shipments" placeholder="Shipment, order, customer, carrier or BOL" value={typed} onChange={(e) => setTyped(e.target.value)} sx={{ minWidth: 320 }} />
        <TextField size="small" select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All</MenuItem>
          {Object.entries(SHIPMENT_STATUS_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table size="small" aria-label="Shipments">
            <TableHead>
              <TableRow>
                <TableCell>Shipment</TableCell><TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Ships from</TableCell>
                <TableCell>Carrier</TableCell><TableCell align="right">Lines</TableCell><TableCell>Created</TableCell><TableCell>Left</TableCell><TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/shipping/${s.id}`)}>
                  <TableCell><Typography variant="body2" fontWeight={600} color="primary">{s.shipmentNumber}</Typography></TableCell>
                  <TableCell>{s.order?.orderNumber}</TableCell>
                  <TableCell>{s.order?.buyer?.name || ''}</TableCell>
                  <TableCell>{s.fromLocation?.code || ''}</TableCell>
                  <TableCell>{s.carrierName || ''}</TableCell>
                  <TableCell align="right">{s.items?.length ?? 0}</TableCell>
                  <TableCell>{shortDate(s.createdAt)}</TableCell>
                  <TableCell>{shortDate(s.shippedAt)}</TableCell>
                  <TableCell><ShipmentStatusChip status={s.status} /></TableCell>
                </TableRow>
              ))}
              {!loading && !rows.length && !error && (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  {search || status ? 'No shipments match.' : 'No shipments yet.'}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            {total > rows.length ? `Showing the newest ${rows.length} of ${total.toLocaleString()}. Search or filter to narrow the list.` : `${total.toLocaleString()} shipment${total === 1 ? '' : 's'}`}
          </Typography>
        </Box>
      </Paper>

      <NewShipmentDialog open={creating} onClose={() => setCreating(false)} onCreated={(s) => { setCreating(false); navigate(`/shipping/${s.id}`) }} />
    </Box>
  )
}
