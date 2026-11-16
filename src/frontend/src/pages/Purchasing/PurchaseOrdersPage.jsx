/**
 * Purchase orders (Phase 6, findings I-007 and K-002).
 *
 * What was ordered from a supplier, line by line, and how much of each line has been received.
 * A buyer or the inventory manager writes and places them (and any manager). Receiving fills a line
 * from the Receiving screen. No approval rule exists for purchase orders, so none is applied here.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, Snackbar, LinearProgress, Chip, Stack, Grid, IconButton, FormControlLabel, Checkbox, Tabs, Tab,
} from '@mui/material'
import { ShoppingCart as PoIcon, Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'

// A list answer is the rows themselves, or { data } when a page of them was asked for.
const listOf = (b) => (Array.isArray(b) ? b : b?.data || [])

const UNITS = [['LB', 'Pounds'], ['CWT', 'Hundredweight'], ['TON', 'Tons'], ['EA', 'Pieces']]
const PRICE_UNITS = [['LB', 'per lb'], ['CWT', 'per cwt'], ['TON', 'per ton'], ['EACH', 'each']]
const LABEL = { DRAFT: 'Draft', PENDING: 'Placed', CONFIRMED: 'Confirmed', PARTIAL: 'Part received', COMPLETE: 'Closed', CANCELLED: 'Cancelled', HOLD: 'On hold' }
const per = { LB: 1, CWT: 100, TON: 2000, EA: 1, EACH: 1 }
const money = (n) => Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const BLANK_LINE = { gradeId: '', description: '', thicknessIn: '', widthIn: '', lengthIn: '', qtyOrdered: '', unit: 'LB', unitPrice: '', priceUnit: 'CWT', mtr: true }

async function call(url, method = 'GET', body) {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  const out = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(out.error || 'The request failed')
  return out
}
// The amount of a line: quantity in its unit, price per price unit.
export function lineAmount(l) {
  const q = Number(l.qtyOrdered) || 0
  const p = Number(l.unitPrice) || 0
  const weightUnit = ['LB', 'CWT', 'TON'].includes(l.unit)
  if (weightUnit && ['LB', 'CWT', 'TON'].includes(l.priceUnit)) return Math.round(((q * per[l.unit]) / per[l.priceUnit]) * p * 100) / 100
  return Math.round(q * p * 100) / 100
}

function NewPoDialog({ open, onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([])
  const [grades, setGrades] = useState([])
  const [sellerId, setSellerId] = useState('')
  const [requiredDate, setRequiredDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([{ ...BLANK_LINE }])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!open) return
    setSellerId(''); setRequiredDate(''); setNotes(''); setLines([{ ...BLANK_LINE }]); setError('')
    Promise.all([call('/api/purchase-orders/suppliers'), call('/api/grades?isActive=true')]).then(([s, g]) => { setSuppliers(s || []); setGrades(g || []) }).catch(() => setError('Suppliers and grades could not be loaded'))
  }, [open])
  const set = (i, k) => (e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: k === 'mtr' ? e.target.checked : e.target.value } : l)))
  const ready = sellerId && lines.every((l) => l.description.trim() && Number(l.qtyOrdered) > 0 && Number(l.unitPrice) >= 0 && l.unitPrice !== '')
  const save = async () => {
    setBusy(true); setError('')
    try {
      const built = lines.map((l) => ({
        gradeId: l.gradeId || undefined, description: l.description.trim(), qtyOrdered: Number(l.qtyOrdered), unit: l.unit, unitPrice: Number(l.unitPrice), priceUnit: l.priceUnit,
        ...(l.thicknessIn && { thicknessIn: Number(l.thicknessIn) }), ...(l.widthIn && { widthIn: Number(l.widthIn) }), ...(l.lengthIn && { lengthIn: Number(l.lengthIn) }),
        extendedPrice: lineAmount(l), ...(l.mtr && { certRequirements: ['MTR'] }),
      }))
      const subtotal = Math.round(built.reduce((n, l) => n + l.extendedPrice, 0) * 100) / 100
      const po = await call('/api/purchase-orders', 'POST', { sellerId, status: 'DRAFT', notes: notes || undefined, requiredDate: requiredDate ? new Date(requiredDate).toISOString() : undefined, subtotal, taxAmount: 0, freightAmount: 0, totalAmount: subtotal, lines: built })
      onSaved(po)
    } catch (e) { setError(e.message) }
    setBusy(false)
  }
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle>New purchase order</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0, mb: 2 }}>
          <Grid item xs={12} md={5}><TextField select fullWidth required label="Supplier" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>{suppliers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Wanted by" InputLabelProps={{ shrink: true }} value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} inputProps={{ maxLength: 500 }} /></Grid>
        </Grid>
        {lines.map((l, i) => (
          <Grid container spacing={1} key={i} sx={{ mb: 1 }} alignItems="center">
            <Grid item xs={12} md={2}><TextField select fullWidth size="small" label="Grade" value={l.gradeId} onChange={set(i, 'gradeId')}><MenuItem value="">Any</MenuItem>{grades.map((g) => <MenuItem key={g.id} value={g.id}>{g.code}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth size="small" required label="Description" value={l.description} onChange={set(i, 'description')} inputProps={{ maxLength: 200 }} /></Grid>
            <Grid item xs={4} md={1}><TextField fullWidth size="small" type="number" label="Thick (in)" value={l.thicknessIn} onChange={set(i, 'thicknessIn')} /></Grid>
            <Grid item xs={4} md={1}><TextField fullWidth size="small" type="number" label="Width (in)" value={l.widthIn} onChange={set(i, 'widthIn')} /></Grid>
            <Grid item xs={4} md={1}><TextField fullWidth size="small" type="number" label="Length (in)" value={l.lengthIn} onChange={set(i, 'lengthIn')} /></Grid>
            <Grid item xs={4} md={1}><TextField fullWidth size="small" required type="number" label="Quantity" value={l.qtyOrdered} onChange={set(i, 'qtyOrdered')} /></Grid>
            <Grid item xs={4} md={1}><TextField select fullWidth size="small" label="Unit" value={l.unit} onChange={set(i, 'unit')}>{UNITS.map(([v, t]) => <MenuItem key={v} value={v}>{t}</MenuItem>)}</TextField></Grid>
            <Grid item xs={4} md={1}><TextField fullWidth size="small" required type="number" label="Price" value={l.unitPrice} onChange={set(i, 'unitPrice')} /></Grid>
            <Grid item xs={4} md={1}><TextField select fullWidth size="small" label="Per" value={l.priceUnit} onChange={set(i, 'priceUnit')}>{PRICE_UNITS.map(([v, t]) => <MenuItem key={v} value={v}>{t}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6} md={0.5}><FormControlLabel control={<Checkbox size="small" checked={l.mtr} onChange={set(i, 'mtr')} />} label="MTR" /></Grid>
            <Grid item xs={6} md={0.5}><IconButton aria-label="Remove line" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><DeleteIcon /></IconButton></Grid>
          </Grid>
        ))}
        <Button startIcon={<AddIcon />} onClick={() => setLines((ls) => [...ls, { ...BLANK_LINE }])}>Add line</Button>
        <Typography sx={{ mt: 2 }} fontWeight={600}>Total {money(lines.reduce((n, l) => n + lineAmount(l), 0))}</Typography>
        <Typography variant="caption" color="text.secondary">MTR: the supplier must send a mill certificate. Material received against the line without one on file is held until it arrives.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || !ready}>{busy ? 'Saving…' : 'Save as draft'}</Button>
      </DialogActions>
    </Dialog>
  )
}


const lbs = (n) => Math.round(Number(n || 0)).toLocaleString()
/**
 * Supply position: for each branch and grade, what is on hand and how it is split, what is coming on
 * open purchase orders and transfers, and open sales not yet reserved. It suggests nothing: there is
 * no reorder point for material on file, so the buyer decides.
 */
export function SupplyPosition() {
  const [rows, setRows] = useState([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  useEffect(() => {
    call('/api/purchase-orders/supply-position').then((b) => { setRows(b.data || []); setNote(b.note || ''); setError('') }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])
  const shown = rows.filter((r) => !filter || `${r.branchCode} ${r.gradeCode}`.toLowerCase().includes(filter.toLowerCase()))
  return (
    <Paper>
      {loading && <LinearProgress />}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
        <TextField size="small" label="Branch or grade" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{note}</Typography>
      </Stack>
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      <TableContainer>
        <Table size="small" aria-label="Supply position">
          <TableHead><TableRow>
            <TableCell>Branch</TableCell><TableCell>Grade</TableCell><TableCell align="right">On hand lb</TableCell><TableCell align="right">Free</TableCell><TableCell align="right">Reserved</TableCell>
            <TableCell align="right">On hold</TableCell><TableCell align="right">Sent, in transit</TableCell><TableCell align="right">On order</TableCell><TableCell align="right">Coming by transfer</TableCell>
            <TableCell align="right">Open sales not reserved</TableCell><TableCell align="right">Projected free</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {shown.map((r) => (
              <TableRow key={`${r.locationId}-${r.gradeId}`}>
                <TableCell>{r.branchCode}</TableCell><TableCell>{r.gradeCode}</TableCell><TableCell align="right">{lbs(r.onHandLb)}</TableCell><TableCell align="right">{lbs(r.availableLb)}</TableCell>
                <TableCell align="right">{lbs(r.reservedLb)}</TableCell><TableCell align="right">{lbs(r.onHoldLb)}</TableCell><TableCell align="right">{lbs(r.inTransitOutLb)}</TableCell><TableCell align="right">{lbs(r.onOrderLb)}</TableCell>
                <TableCell align="right">{lbs(r.inboundTransferLb)}</TableCell><TableCell align="right">{lbs(r.unreservedDemandLb)}</TableCell>
                <TableCell align="right" sx={{ color: r.projectedFreeLb < 0 ? 'error.main' : undefined, fontWeight: r.projectedFreeLb < 0 ? 700 : undefined }}>{lbs(r.projectedFreeLb)}</TableCell>
              </TableRow>
            ))}
            {!loading && !error && shown.length === 0 && <TableRow><TableCell colSpan={11} align="center" sx={{ py: 5 }}>Nothing to show.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(null)
  const [snack, setSnack] = useState(null)
  const [tab, setTab] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try { setRows(listOf(await call('/api/purchase-orders?limit=100'))); setError('') } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  const show = async (id) => { try { setOpen(await call(`/api/purchase-orders/${id}`)) } catch (e) { setSnack({ severity: 'error', msg: e.message }) } }
  const move = async (status, what) => {
    try { await call(`/api/purchase-orders/${open.id}`, 'PUT', { status }); setSnack({ severity: 'success', msg: what }); show(open.id); load() } catch (e) { setSnack({ severity: 'error', msg: e.message }) }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <PoIcon color="primary" sx={{ fontSize: 36 }} />
        <Box sx={{ flex: 1 }}>
          <Typography component="h1" variant="h4" fontWeight={700}>Purchase orders</Typography>
          <Typography variant="body2" color="text.secondary">What has been ordered from suppliers, and how much of it has arrived.</Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>New purchase order</Button>
      </Stack>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Purchase orders" />
        <Tab label="Supply position" />
      </Tabs>
      {tab === 1 && <SupplyPosition />}
      {tab === 0 && error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {tab === 0 && <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table size="small" aria-label="Purchase orders">
            <TableHead><TableRow><TableCell>Number</TableCell><TableCell>Supplier</TableCell><TableCell>Ordered</TableCell><TableCell align="right">Lines</TableCell><TableCell align="right">Total</TableCell><TableCell>Received</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
            <TableBody>
              {rows.map((po) => {
                const ordered = (po.lines || []).reduce((n, l) => n + Number(l.qtyOrdered || 0), 0)
                const got = (po.lines || []).reduce((n, l) => n + Number(l.qtyReceived || 0), 0)
                return (
                  <TableRow key={po.id} hover sx={{ cursor: 'pointer' }} onClick={() => show(po.id)}>
                    <TableCell>{po.orderNumber}</TableCell>
                    <TableCell>{po.seller?.name}</TableCell>
                    <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{(po.lines || []).length}</TableCell>
                    <TableCell align="right">{money(po.totalAmount)}</TableCell>
                    <TableCell>{ordered ? `${Math.round((got / ordered) * 100)}%` : ''}</TableCell>
                    <TableCell><Chip size="small" label={LABEL[po.status] || po.status} /></TableCell>
                  </TableRow>
                )
              })}
              {!loading && !error && rows.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>No purchase orders yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>}

      <Dialog open={Boolean(open)} onClose={() => setOpen(null)} maxWidth="md" fullWidth>
        <DialogTitle>Purchase order {open?.orderNumber}: {open?.seller?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>{LABEL[open?.status] || open?.status}. For {open?.location?.name || open?.location?.code || 'no branch'}. Total {money(open?.totalAmount)}.</Typography>
          <Table size="small" aria-label="Purchase order lines">
            <TableHead><TableRow><TableCell>#</TableCell><TableCell>Material</TableCell><TableCell align="right">Ordered</TableCell><TableCell align="right">Received</TableCell><TableCell>Items received</TableCell></TableRow></TableHead>
            <TableBody>
              {(open?.lines || []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.lineNumber}</TableCell>
                  <TableCell>{[l.grade?.code, l.description, [l.thicknessIn, l.widthIn, l.lengthIn].filter(Boolean).map(Number).join(' x ')].filter(Boolean).join(', ')}{Array.isArray(l.certRequirements) && l.certRequirements.length ? ` (needs ${l.certRequirements.join(', ')})` : ''}</TableCell>
                  <TableCell align="right">{Number(l.qtyOrdered).toLocaleString()} {l.unit}</TableCell>
                  <TableCell align="right">{Number(l.qtyReceived).toLocaleString()} {l.unit}</TableCell>
                  <TableCell>{(l.receipts || []).map((r) => <Chip key={r.id} size="small" sx={{ mr: 0.5 }} color={r.coil?.status === 'HOLD' ? 'warning' : 'default'} label={`${r.coil?.coilNumber}${r.coil?.status === 'HOLD' ? ' (on hold)' : ''}`} onClick={() => navigate(`/units/${r.coil?.id}`)} />)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          {open?.status === 'DRAFT' && <Button variant="contained" onClick={() => move('CONFIRMED', 'Purchase order placed')}>Place with supplier</Button>}
          {['DRAFT', 'PENDING', 'CONFIRMED', 'PARTIAL'].includes(open?.status) && <Button color="warning" onClick={() => move('CANCELLED', 'Purchase order cancelled')}>Cancel</Button>}
          {['CONFIRMED', 'PARTIAL'].includes(open?.status) && <Button onClick={() => move('COMPLETE', 'Purchase order closed')}>Close (nothing more to come)</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpen(null)}>Close window</Button>
        </DialogActions>
      </Dialog>

      <NewPoDialog open={creating} onClose={() => setCreating(false)} onSaved={(po) => { setCreating(false); setSnack({ severity: 'success', msg: `${po.orderNumber} saved as a draft` }); load(); show(po.id) }} />
      <Snackbar open={Boolean(snack)} autoHideDuration={6000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(null)}>{snack.msg}</Alert> : <span />}
      </Snackbar>
    </Box>
  )
}
