/**
 * Packing: open a package for an order line, put material in it, send it to quality, release it,
 * make its tag and seal it. Every step is checked by the server (/api/drop-tags/packages), which
 * gives the reason when it refuses. Tags are printed and applied on the Tag Management screen.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Snackbar, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Link,
} from '@mui/material'
import client from '../../api/client'

const errorText = (e, fallback) => e.response?.data?.error || fallback
const TYPES = [['BUNDLE', 'Bundle'], ['SKID', 'Skid'], ['BOX', 'Box'], ['CRATE', 'Crate'], ['DRUM', 'Drum']]
const STATUS = {
  OPEN: ['Empty', 'default'], PACKING: ['Being packed', 'default'], READY_FOR_QC: ['Waiting for quality', 'warning'], QC_HOLD: ['Held by quality', 'error'], QC_RELEASED: ['Released by quality', 'success'],
}
const liveTag = (p) => (p.dropTags || []).find((t) => t.status !== 'VOID')

function NewPackageDialog({ onClose, onSaved }) {
  const [number, setNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [lineId, setLineId] = useState('')
  const [type, setType] = useState('BUNDLE')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const find = async (e) => {
    e?.preventDefault(); setError(''); setOrder(null); setLineId('')
    try {
      const found = await client.get('/orders/closeout', { params: { search: number.trim(), limit: 5 } })
      const hit = (found.data?.data || []).find((o) => o.orderNumber.toLowerCase() === number.trim().toLowerCase())
      if (!hit) { setError('No open order has that number.'); return }
      const { data } = await client.get(`/orders/${hit.id}`)
      setOrder(data); setLineId(data.lines?.[0]?.id || '')
    } catch (err) { setError(errorText(err, 'The order could not be read')) }
  }
  const save = async () => {
    setBusy(true); setError('')
    try { await client.post('/drop-tags/packages', { packageType: type, orderId: order.id, orderLineId: lineId }); onSaved() } catch (err) { setError(errorText(err, 'The package could not be opened')) } finally { setBusy(false) }
  }
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Open a package</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack component="form" direction="row" spacing={1} onSubmit={find} sx={{ mb: 2 }}>
          <TextField size="small" autoFocus label="Order number" value={number} onChange={(e) => setNumber(e.target.value)} />
          <Button type="submit" variant="outlined" disabled={!number.trim()}>Find order</Button>
        </Stack>
        {order && (
          <Stack spacing={2}>
            <Typography variant="body2">{order.orderNumber}, {order.buyer?.name || ''}</Typography>
            <TextField select size="small" label="Order line" value={lineId} onChange={(e) => setLineId(e.target.value)}>
              {(order.lines || []).map((l) => <MenuItem key={l.id} value={l.id}>{l.lineNumber}. {l.description} ({Number(l.qtyOrdered)} {l.unit})</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Kind of package" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map(([v, label]) => <MenuItem key={v} value={v}>{label}</MenuItem>)}
            </TextField>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" disabled={busy || !order || !lineId} onClick={save}>Open package</Button>
      </DialogActions>
    </Dialog>
  )
}

function AddItemDialog({ pkg, onClose, onSaved }) {
  const [stock, setStock] = useState(null)
  const [coilId, setCoilId] = useState('')
  const [pieces, setPieces] = useState('1')
  const [weight, setWeight] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    // The stock reserved for this order line is what can be packed for it.
    client.get(`/orders/${pkg.orderId}`).then((r) => {
      const line = (r.data?.lines || []).find((l) => l.id === pkg.orderLineId)
      const items = (line?.allocations || []).map((a) => a.coil).filter(Boolean)
      setStock(items); setCoilId(items[0]?.id || '')
    }).catch((e) => { setStock([]); setError(errorText(e, 'The reserved stock could not be read')) })
  }, [pkg])
  const save = async () => {
    setBusy(true); setError('')
    try { await client.post(`/drop-tags/packages/${pkg.id}/items`, { coilId, pieces: Number(pieces), weightLbs: Number(weight) }); onSaved() } catch (e) { setError(errorText(e, 'That could not be added')) } finally { setBusy(false) }
  }
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add to {pkg.packageId}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {stock && !stock.length && <Alert severity="info">No stock is reserved for this order line. Reserve the stock on the order first.</Alert>}
        {stock?.length > 0 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select size="small" label="Stock item" value={coilId} onChange={(e) => setCoilId(e.target.value)} helperText="The heat and grade are taken from the stock item">
              {stock.map((c) => <MenuItem key={c.id} value={c.id}>{c.coilNumber}</MenuItem>)}
            </TextField>
            <TextField size="small" type="number" label="Pieces" value={pieces} onChange={(e) => setPieces(e.target.value)} inputProps={{ min: 1, step: 1 }} />
            <TextField size="small" type="number" label="Weight, lb" value={weight} onChange={(e) => setWeight(e.target.value)} inputProps={{ min: 0, step: 'any' }} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" disabled={busy || !coilId || !(Number(pieces) >= 1) || !(Number(weight) > 0)} onClick={save}>Add</Button>
      </DialogActions>
    </Dialog>
  )
}

/** One typed line before a step that needs it (a hold reason, a seal number). */
function AskDialog({ ask, onClose }) {
  const [text, setText] = useState('')
  if (!ask) return null
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{ask.title}</DialogTitle>
      <DialogContent><TextField fullWidth autoFocus label={ask.label} helperText={ask.help} value={text} onChange={(e) => setText(e.target.value)} inputProps={{ maxLength: 200 }} sx={{ mt: 1 }} /></DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={ask.required && text.trim().length < 3} onClick={() => ask.go(text.trim())}>{ask.button}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function PackagesPage() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [adding, setAdding] = useState(null)
  const [ask, setAsk] = useState(null)
  const load = useCallback(() => {
    client.get('/drop-tags/packages/ready').then((r) => { setRows(Array.isArray(r.data) ? r.data : []); setError('') }).catch((e) => setError(errorText(e, 'The packages could not be loaded')))
  }, [])
  useEffect(load, [load])
  const step = async (pkg, path, body, done) => {
    setBusyId(pkg.id); setError(''); setAsk(null)
    try { await client.post(path, body || {}); setToast(done); load() } catch (e) { setError(`${pkg.packageId}: ${errorText(e, 'that could not be done')}`) } finally { setBusyId(null) }
  }
  const base = (p) => `/drop-tags/packages/${p.id}`
  // The package is already released by quality here, so its new tag is checked and made ready to print in one go.
  const makeTag = async (pkg) => {
    setBusyId(pkg.id); setError('')
    try {
      const made = await client.post('/drop-tags', { packageId: pkg.id })
      await client.post(`/drop-tags/${made.data.dropTag.id}/validate`, {})
      setToast('Tag made and ready to print'); load()
    } catch (e) { setError(`${pkg.packageId}: ${errorText(e, 'the tag could not be made')}`); load() } finally { setBusyId(null) }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography component="h1" variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>Packing</Typography>
        <Button variant="contained" onClick={() => setCreating(true)}>Open a package</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        A package is packed, sent to quality, released, tagged and sealed, in that order. Print and apply its tag on <Link component={RouterLink} to="/material-tracking/tags">Tag Management</Link>.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Paper>
        <TableContainer>
          <Table size="small" aria-label="Open packages">
            <TableHead><TableRow><TableCell>Package</TableCell><TableCell>Order</TableCell><TableCell>Kind</TableCell><TableCell>In it</TableCell><TableCell>Status</TableCell><TableCell>Tag</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>
              {rows.map((p) => {
                const tag = liveTag(p); const busy = busyId === p.id
                const pieces = (p.packageItems || []).reduce((a, i) => a + (i.pieces || 0), 0)
                return (
                  <TableRow key={p.id}>
                    <TableCell>{p.packageId}</TableCell>
                    <TableCell>{p.order?.orderNumber || ''}{p.orderLine ? `, line ${p.orderLine.lineNumber}` : ''}</TableCell>
                    <TableCell>{(TYPES.find(([v]) => v === p.packageType) || [null, p.packageType])[1]}</TableCell>
                    <TableCell>{p.packageItems?.length ? `${pieces} piece${pieces === 1 ? '' : 's'}, ${Number(p.netWeightLbs || 0).toLocaleString()} lb, heat ${[...new Set(p.packageItems.map((i) => i.heatNumber).filter(Boolean))].join(', ') || 'none on file'}` : 'Empty'}</TableCell>
                    <TableCell><Chip size="small" label={(STATUS[p.status] || [p.status])[0]} color={(STATUS[p.status] || [])[1] || 'default'} /></TableCell>
                    <TableCell>{tag ? `${tag.dropTagId} (${String(tag.status).toLowerCase().replace(/_/g, ' ')})` : ''}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {['OPEN', 'PACKING'].includes(p.status) && <Button size="small" disabled={busy} onClick={() => setAdding(p)}>Add material</Button>}
                      {p.status === 'PACKING' && <Button size="small" variant="contained" disabled={busy || !p.packageItems?.length} onClick={() => step(p, `${base(p)}/ready`, {}, 'Sent to quality')} sx={{ ml: 1 }}>Send to quality</Button>}
                      {['READY_FOR_QC', 'QC_HOLD'].includes(p.status) && <Button size="small" variant="contained" color="success" disabled={busy} onClick={() => step(p, `${base(p)}/qc-release`, {}, 'Released')}>Release</Button>}
                      {p.status === 'READY_FOR_QC' && <Button size="small" color="error" disabled={busy} onClick={() => setAsk({ title: `Hold ${p.packageId}`, label: 'Why it is held', required: true, button: 'Hold', go: (reason) => step(p, `${base(p)}/qc-hold`, { reason }, 'Held') })} sx={{ ml: 1 }}>Hold</Button>}
                      {p.status === 'QC_RELEASED' && !tag && <Button size="small" variant="contained" disabled={busy} onClick={() => makeTag(p)}>Make tag</Button>}
                      {p.status === 'QC_RELEASED' && tag?.status === 'APPLIED' && <Button size="small" variant="contained" disabled={busy} onClick={() => setAsk({ title: `Seal ${p.packageId}`, label: 'Seal number', help: 'The number on the seal', required: true, button: 'Seal', go: (sealId) => step(p, `${base(p)}/seal`, { sealId }, 'Sealed') })}>Seal</Button>}
                    </TableCell>
                  </TableRow>
                )
              })}
              {!rows.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>No package is open.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {creating && <NewPackageDialog onClose={() => setCreating(false)} onSaved={() => { setCreating(false); setToast('Package opened'); load() }} />}
      {adding && <AddItemDialog pkg={adding} onClose={() => setAdding(null)} onSaved={() => { setAdding(null); setToast('Added'); load() }} />}
      <AskDialog ask={ask} onClose={() => setAsk(null)} />
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Box>
  )
}
