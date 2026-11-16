/**
 * Transfers between branches (Phase 6, finding G-007).
 *
 * Material sent from a stock item's page (Send to another branch) is in transit: off the sender's
 * shelf, not yet on the receiver's. The receiving branch receives it here and says what arrived. What
 * was short, missing or damaged goes on hold with the reason; a manager or the inventory manager
 * settles a shortage (written off, or found). The sender can call back a transfer not yet received.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Paper, Typography, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, Snackbar, LinearProgress, Chip, Stack, Link as MuiLink,
} from '@mui/material'
import { LocalShipping as TransferIcon, Refresh as RefreshIcon } from '@mui/icons-material'

// A list answer is the rows themselves, or { data } when a page of them was asked for.
const listOf = (b) => (Array.isArray(b) ? b : b?.data || [])

const CONDITIONS = [['GOOD', 'Arrived whole'], ['SHORT', 'Short'], ['DAMAGED', 'Damaged'], ['NOT_RECEIVED', 'Did not arrive']]
const STATUS_COLOR = { SHIPPED: 'info', RECEIVED: 'success', CANCELLED: 'default' }
const STATUS_LABEL = { SHIPPED: 'In transit', RECEIVED: 'Received', CANCELLED: 'Cancelled' }
const when = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '')
const branch = (l) => (l ? `${l.code}${l.name && l.name !== l.code ? `: ${l.name}` : ''}` : '')
const qty = (n, unit) => `${Number(n || 0).toLocaleString()} ${String(unit || 'LB').toLowerCase()}`

async function call(url, method = 'GET', body) {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  const out = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(out.error || 'The request failed')
  return out
}

function ReceiveDialog({ transfer, onClose, onDone }) {
  const [lines, setLines] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    setError('')
    setLines((transfer?.lines || []).map((l) => ({ coilId: l.coilId, coilNumber: l.coil?.coilNumber, unit: l.unit, shipped: l.qtyShipped, qtyReceived: String(l.qtyShipped), condition: 'GOOD', notes: '' })))
  }, [transfer])
  const set = (i, k) => (e) => setLines((ls) => ls.map((l, j) => {
    if (j !== i) return l
    const next = { ...l, [k]: e.target.value }
    if (k === 'condition' && e.target.value === 'NOT_RECEIVED') next.qtyReceived = '0'
    if (k === 'condition' && e.target.value === 'GOOD') next.qtyReceived = String(l.shipped)
    if (k === 'qtyReceived' && next.condition !== 'DAMAGED') {
      const n = Number(e.target.value)
      next.condition = n <= 0 ? 'NOT_RECEIVED' : n < l.shipped ? 'SHORT' : 'GOOD'
    }
    return next
  }))
  const missingNote = lines.some((l) => l.condition !== 'GOOD' && l.notes.trim().length < 5)
  const save = async () => {
    setBusy(true); setError('')
    try {
      const out = await call(`/api/inventory/transfers/${transfer.id}/receive`, 'POST', {
        lines: lines.map((l) => ({ coilId: l.coilId, qtyReceived: Number(l.qtyReceived), condition: l.condition, notes: l.notes })),
      })
      onDone(out)
    } catch (e) { setError(e.message) }
    setBusy(false)
  }
  return (
    <Dialog open={Boolean(transfer)} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Receive transfer {transfer?.transferNumber}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" sx={{ mb: 2 }}>Count what arrived from {branch(transfer?.fromLocation)}. Anything short, missing or damaged goes on hold with your note until a manager or the inventory manager checks it.</Typography>
        <Table size="small" aria-label="Items on this transfer">
          <TableHead><TableRow><TableCell>Item</TableCell><TableCell align="right">Sent</TableCell><TableCell>Received</TableCell><TableCell>Condition</TableCell><TableCell>Note</TableCell></TableRow></TableHead>
          <TableBody>
            {lines.map((l, i) => (
              <TableRow key={l.coilId}>
                <TableCell>{l.coilNumber}</TableCell>
                <TableCell align="right">{qty(l.shipped, l.unit)}</TableCell>
                <TableCell sx={{ width: 140 }}><TextField size="small" type="number" value={l.qtyReceived} onChange={set(i, 'qtyReceived')} inputProps={{ min: 0, step: 'any', 'aria-label': `Received of ${l.coilNumber}` }} /></TableCell>
                <TableCell sx={{ width: 170 }}>
                  <TextField size="small" select value={l.condition} onChange={set(i, 'condition')} inputProps={{ 'aria-label': `Condition of ${l.coilNumber}` }} fullWidth>
                    {CONDITIONS.map(([v, t]) => <MenuItem key={v} value={v}>{t}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell><TextField size="small" value={l.notes} onChange={set(i, 'notes')} placeholder={l.condition === 'GOOD' ? '' : 'What was found (required)'} error={l.condition !== 'GOOD' && l.notes.trim().length < 5} inputProps={{ maxLength: 500, 'aria-label': `Note for ${l.coilNumber}` }} fullWidth /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Close</Button>
        <Button variant="contained" onClick={save} disabled={busy || missingNote}>{busy ? 'Receiving…' : 'Receive'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function TransfersPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('in')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)
  const [receiving, setReceiving] = useState(null)
  const [action, setAction] = useState(null) // { kind: 'cancel' | 'settle', line? }
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState('CONFIRM_SHORT')
  const [actionError, setActionError] = useState('')
  const [snack, setSnack] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = tab === 'in' ? 'direction=in&status=SHIPPED' : tab === 'out' ? 'direction=out' : ''
      setRows(listOf(await call(`/api/inventory/transfers?${params}&limit=100`)))
      setError('')
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [tab])
  useEffect(() => { load() }, [load])

  const refreshOpen = async (id) => { try { setOpen(await call(`/api/inventory/transfers/${id}`)) } catch { setOpen(null) } }
  const runAction = async () => {
    setActionError('')
    try {
      if (action.kind === 'cancel') await call(`/api/inventory/transfers/${open.id}/cancel`, 'POST', { reason: note })
      else await call(`/api/inventory/transfers/${open.id}/settle`, 'POST', { coilId: action.line.coilId, decision, notes: note })
      setSnack({ severity: 'success', msg: action.kind === 'cancel' ? 'Transfer called back. The items are free again where they were.' : 'Shortage settled' })
      setAction(null); setNote('')
      refreshOpen(open.id); load()
    } catch (e) { setActionError(e.message) }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <TransferIcon color="primary" sx={{ fontSize: 36 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700}>Transfers</Typography>
          <Typography variant="body2" color="text.secondary">Material on its way between branches. Send an item from its page; receive it here when it arrives.</Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} aria-label="Which transfers">
          <Tab value="in" label="Coming in" />
          <Tab value="out" label="Sent by my branch" />
          <Tab value="all" label="All I can see" />
        </Tabs>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table size="small" aria-label="Transfers">
            <TableHead><TableRow><TableCell>Transfer</TableCell><TableCell>From</TableCell><TableCell>To</TableCell><TableCell align="right">Items</TableCell><TableCell align="right">Sent</TableCell><TableCell>Shipped</TableCell><TableCell>Status</TableCell><TableCell>Found at receipt</TableCell></TableRow></TableHead>
            <TableBody>
              {rows.map((t) => {
                const odd = (t.lines || []).filter((l) => l.condition && !['GOOD', 'SETTLED_FOUND'].includes(l.condition))
                return (
                  <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => setOpen(t)}>
                    <TableCell>{t.transferNumber}</TableCell>
                    <TableCell>{branch(t.fromLocation)}</TableCell>
                    <TableCell>{branch(t.toLocation)}</TableCell>
                    <TableCell align="right">{(t.lines || []).length}</TableCell>
                    <TableCell align="right">{(t.lines || []).map((l) => qty(l.qtyShipped, l.unit)).join(', ')}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{when(t.shippedAt)}</TableCell>
                    <TableCell><Chip size="small" label={STATUS_LABEL[t.status] || t.status} color={STATUS_COLOR[t.status] || 'default'} /></TableCell>
                    <TableCell>{odd.length ? <Chip size="small" color="warning" label={`${odd.length} short, missing or damaged`} /> : ''}</TableCell>
                  </TableRow>
                )
              })}
              {!loading && !error && rows.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}>{tab === 'in' ? 'Nothing is on its way to your branch.' : 'No transfers.'}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(open) && !receiving} onClose={() => setOpen(null)} maxWidth="md" fullWidth>
        <DialogTitle>Transfer {open?.transferNumber}: {branch(open?.fromLocation)} to {branch(open?.toLocation)}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {STATUS_LABEL[open?.status] || open?.status}. Sent {when(open?.shippedAt)}{open?.carrier ? ` by ${open.carrier}` : ''}{open?.reference ? `, reference ${open.reference}` : ''}.
            {open?.receivedAt ? ` Received ${when(open.receivedAt)}.` : ''}{open?.cancelReason ? ` Called back: ${open.cancelReason}` : ''}
          </Typography>
          <Table size="small" aria-label="Transfer items">
            <TableHead><TableRow><TableCell>Item</TableCell><TableCell>Heat</TableCell><TableCell>Grade</TableCell><TableCell align="right">Sent</TableCell><TableCell align="right">Received</TableCell><TableCell>Condition</TableCell><TableCell>Note</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>
              {(open?.lines || []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell><MuiLink component="button" underline="hover" onClick={() => navigate(`/units/${l.coilId}`)}>{l.coil?.coilNumber}</MuiLink></TableCell>
                  <TableCell>{l.coil?.heat?.heatNumber}</TableCell>
                  <TableCell>{l.coil?.grade?.code}</TableCell>
                  <TableCell align="right">{qty(l.qtyShipped, l.unit)}</TableCell>
                  <TableCell align="right">{l.qtyReceived == null ? '' : qty(l.qtyReceived, l.unit)}</TableCell>
                  <TableCell>{l.condition ? String(l.condition).replace(/_/g, ' ').toLowerCase() : ''}</TableCell>
                  <TableCell>{l.notes}</TableCell>
                  <TableCell>{['SHORT', 'NOT_RECEIVED'].includes(l.condition) && <Button size="small" onClick={() => { setAction({ kind: 'settle', line: l }); setNote(''); setDecision('CONFIRM_SHORT'); setActionError('') }}>Settle</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          {open?.status === 'SHIPPED' && <Button color="warning" onClick={() => { setAction({ kind: 'cancel' }); setNote(''); setActionError('') }}>Call back</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpen(null)}>Close</Button>
          {open?.status === 'SHIPPED' && <Button variant="contained" onClick={() => setReceiving(open)}>Receive</Button>}
        </DialogActions>
      </Dialog>

      <ReceiveDialog transfer={receiving} onClose={() => setReceiving(null)}
        onDone={(out) => { setReceiving(null); setOpen(out); setSnack({ severity: out.warning ? 'warning' : 'success', msg: out.warning || `Transfer ${out.transferNumber} received` }); load() }} />

      <Dialog open={Boolean(action)} onClose={() => setAction(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{action?.kind === 'cancel' ? 'Call the transfer back' : `Settle ${action?.line?.coil?.coilNumber}`}</DialogTitle>
        <DialogContent>
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          {action?.kind === 'settle' && (
            <TextField select fullWidth label="What happened" value={decision} onChange={(e) => setDecision(e.target.value)} sx={{ mt: 1, mb: 2 }}>
              <MenuItem value="CONFIRM_SHORT">It is really missing: take it off the books</MenuItem>
              <MenuItem value="FOUND">It turned up: keep the full quantity</MenuItem>
            </TextField>
          )}
          <TextField fullWidth multiline minRows={2} label={action?.kind === 'cancel' ? 'Why it is called back' : 'What was found'} value={note} onChange={(e) => setNote(e.target.value)} sx={{ mt: action?.kind === 'cancel' ? 1 : 0 }} inputProps={{ maxLength: 500 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAction(null)}>Close</Button>
          <Button variant="contained" onClick={runAction} disabled={note.trim().length < 5}>{action?.kind === 'cancel' ? 'Call back' : 'Settle'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snack)} autoHideDuration={8000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(null)}>{snack.msg}</Alert> : <span />}
      </Snackbar>
    </Box>
  )
}
