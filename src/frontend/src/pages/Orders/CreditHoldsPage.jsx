/**
 * Credit holds: orders that would put a customer over their credit limit.
 * They are saved on hold; a manager releases each one here. Every release is recorded.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Typography, Button, Alert, CircularProgress, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Link as MuiLink,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

const usd = (n) => (n === null || n === undefined ? '' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
const when = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '')

export async function releaseCreditHold(orderId, note) {
  const res = await fetch(`/api/orders/${orderId}/credit-release`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'The credit hold could not be released')
  return body
}

/** Asks for an optional note, then releases the hold. Used here and on the order screen. */
export function ReleaseHoldDialog({ order, onClose, onReleased }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setNote(''); setError('') }, [order?.id])
  const release = async () => {
    setBusy(true); setError('')
    try { await releaseCreditHold(order.id, note.trim()); onReleased(order) } catch (e) { setError(e.message) }
    setBusy(false)
  }
  return (
    <Dialog open={Boolean(order)} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Release credit hold on {order?.orderNumber}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          The order will go ahead even though it takes the customer over their credit limit. Your name, the time and your note are recorded.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} fullWidth multiline minRows={2} inputProps={{ maxLength: 500 }} helperText="For example: payment promised Friday, approved by phone." />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={release} disabled={busy}>{busy ? 'Releasing…' : 'Release hold'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function CreditHoldsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [canRelease, setCanRelease] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [releasing, setReleasing] = useState(null)
  const [done, setDone] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/orders/credit-holds')
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'The credit holds could not be loaded')
      setRows(body.data || []); setCanRelease(Boolean(body.canRelease))
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700}>Credit holds</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Orders that would take a customer over their credit limit wait here. {canRelease ? 'Release an order to let it go ahead.' : 'A manager releases them.'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={load}>Try again</Button>}>{error}</Alert>}
      {done && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setDone('')}>{done}</Alert>}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="Orders on credit hold">
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell align="right">Order total</TableCell>
              <TableCell align="right">Account would be at</TableCell><TableCell align="right">Credit limit</TableCell><TableCell align="right">Over by</TableCell>
              <TableCell>Entered by</TableCell><TableCell>On hold since</TableCell><TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>}
            {!loading && !error && rows.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}>No orders are on credit hold.</TableCell></TableRow>}
            {!loading && rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell><MuiLink component="button" underline="hover" onClick={() => navigate(`/orders/${r.id}`)}>{r.orderNumber}</MuiLink></TableCell>
                <TableCell>{r.customer}</TableCell>
                <TableCell align="right">{usd(r.total)}</TableCell>
                <TableCell align="right">{usd(r.exposure)}</TableCell>
                <TableCell align="right">{usd(r.limit)}</TableCell>
                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{usd(r.overBy)}</TableCell>
                <TableCell>{r.enteredBy}</TableCell>
                <TableCell>{when(r.heldAt)}</TableCell>
                <TableCell align="right">{canRelease && <Button size="small" variant="outlined" color="warning" onClick={() => setReleasing(r)}>Release</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ReleaseHoldDialog order={releasing} onClose={() => setReleasing(null)} onReleased={(o) => { setReleasing(null); setDone(`${o.orderNumber} was released and is going ahead.`); load() }} />
    </Box>
  )
}
