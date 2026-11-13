/**
 * Customer returns: open a return against a shipped order, then receive it.
 * Receiving puts restocked material back on hand and credits the customer.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import client from '../../api/client'

const usd = (n) => `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const day = (d) => (d ? new Date(d).toLocaleDateString() : '')
const errorText = (e, fallback) => e?.response?.data?.error || fallback
const STATUS = { PENDING: ['Waiting for material', 'warning'], COMPLETE: ['Received', 'success'], CANCELLED: ['Cancelled', 'default'] }

function NewReturnDialog({ onClose, onSaved }) {
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [qty, setQty] = useState({})
  const [disposition, setDisposition] = useState({})
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const find = async (e) => {
    e?.preventDefault()
    setError(null); setOrder(null)
    try {
      const r = await client.get('/returns/eligible', { params: { orderNumber: orderNumber.trim() } })
      setOrder(r.data); setQty({}); setDisposition({})
    } catch (err) { setError(errorText(err, 'Order not found')) }
  }
  const lines = order ? order.lines.filter((l) => Number(qty[l.orderLineId]) > 0).map((l) => ({ orderLineId: l.orderLineId, quantity: Number(qty[l.orderLineId]), disposition: disposition[l.orderLineId] || 'RESTOCK' })) : []
  const save = async () => {
    setBusy(true); setError(null)
    try {
      await client.post('/returns', { orderId: order.orderId, reason, lines })
      onSaved()
    } catch (err) { setError(errorText(err, 'The return did not save')) } finally { setBusy(false) }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>New return</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack component="form" direction="row" spacing={1} onSubmit={find} sx={{ mb: 2 }}>
          <TextField autoFocus size="small" label="Sales order number" placeholder="SO-00123" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
          <Button type="submit" variant="outlined" disabled={!orderNumber.trim()}>Find order</Button>
        </Stack>
        {order && (
          <>
            <Typography variant="body2" gutterBottom>{order.orderNumber} · {order.customer?.name || 'No customer'}</Typography>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>Line</TableCell><TableCell align="right">Shipped</TableCell><TableCell align="right">Can return</TableCell><TableCell>Returning</TableCell><TableCell>What happens to it</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {order.lines.map((l) => (
                  <TableRow key={l.orderLineId}>
                    <TableCell>{l.lineNumber}. {l.description}</TableCell>
                    <TableCell align="right">{l.shipped} {l.unit}</TableCell>
                    <TableCell align="right">{l.returnable} {l.unit}</TableCell>
                    <TableCell>
                      <TextField
                        size="small" type="number" sx={{ width: 110 }} disabled={l.returnable <= 0} value={qty[l.orderLineId] || ''}
                        error={Number(qty[l.orderLineId]) > l.returnable} inputProps={{ min: 0, max: l.returnable }}
                        onChange={(e) => setQty({ ...qty, [l.orderLineId]: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" select sx={{ width: 190 }} disabled={l.returnable <= 0} value={disposition[l.orderLineId] || 'RESTOCK'} onChange={(e) => setDisposition({ ...disposition, [l.orderLineId]: e.target.value })}>
                        <MenuItem value="RESTOCK">Put back in stock</MenuItem>
                        <MenuItem value="SCRAP">Scrap (damaged)</MenuItem>
                      </TextField>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TextField fullWidth size="small" sx={{ mt: 2 }} label="Reason for the return (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" disabled={busy || !lines.length || !reason.trim()} onClick={save}>Open return</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ReturnsPage() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    client.get('/returns', { params: { limit: 100 } }).then((r) => { setRows(r.data?.data || []); setError(null) }).catch((e) => setError(errorText(e, 'Could not load returns')))
  }, [])
  useEffect(load, [load])

  const act = async (ret, action) => {
    setBusyId(ret.id); setError(null); setNotice(null)
    try {
      const r = await client.post(`/returns/${ret.id}/${action}`, {})
      if (action === 'receive') {
        const credit = (r.data?.credits || []).reduce((s, c) => s + Math.abs(c.totalAmount), 0)
        setNotice(r.data?.warning || `${ret.returnNumber} received.${credit ? ` ${usd(credit)} credited to the customer.` : ' Nothing was invoiced for it, so no credit was issued.'}`)
      }
      load()
    } catch (e) { setError(errorText(e, 'That did not save')) } finally { setBusyId(null) }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>Returns</Typography>
        <Button variant="contained" onClick={() => setCreating(true)}>New return</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Open a return when the customer says material is coming back. Press Receive when it is on the dock: restocked material goes back on hand and the customer is credited.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Return</TableCell><TableCell>Customer</TableCell><TableCell>Order</TableCell><TableCell>Opened</TableCell>
              <TableCell>What is coming back</TableCell><TableCell>Reason</TableCell><TableCell align="right">Value</TableCell><TableCell>Status</TableCell><TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((ret) => (
              <TableRow key={ret.id}>
                <TableCell>{ret.returnNumber}</TableCell>
                <TableCell>{ret.customer?.name || ''}</TableCell>
                <TableCell>{ret.originalOrder?.orderNumber || ''}</TableCell>
                <TableCell>{day(ret.createdAt)}</TableCell>
                <TableCell>{ret.lines.map((l) => `${l.quantity} ${l.unit} ${l.description || ''} (${l.disposition === 'SCRAP' ? 'scrap' : 'restock'})`).join('; ')}</TableCell>
                <TableCell>{ret.reason}</TableCell>
                <TableCell align="right">{usd(ret.totalAmount)}</TableCell>
                <TableCell><Chip size="small" label={(STATUS[ret.status] || [ret.status])[0]} color={(STATUS[ret.status] || [])[1] || 'default'} /></TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {ret.status === 'PENDING' && (
                    <>
                      <Button size="small" variant="contained" disabled={busyId === ret.id} onClick={() => act(ret, 'receive')}>Receive</Button>
                      <Button size="small" disabled={busyId === ret.id} onClick={() => act(ret, 'cancel')} sx={{ ml: 1 }}>Cancel</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={9}><Typography align="center" color="text.secondary" sx={{ py: 3 }}>No returns yet.</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
      {creating && <NewReturnDialog onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load() }} />}
    </Box>
  )
}
