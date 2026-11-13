/**
 * One stock item: what it is, how much is on hand, available, reserved and on
 * hold, its holds, and everything that has happened to it. Read from
 * /api/coils/:id and /api/coils/:id/history. Nothing here is sample data: an
 * item that cannot be loaded shows the reason.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Paper, Grid, Button, Stack, IconButton, Avatar, Alert, LinearProgress, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Snackbar,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material'
import { ArrowBack as BackIcon, Inventory as InventoryIcon, Edit as EditIcon, Block as HoldIcon, LockOpen as ReleaseIcon, SwapHoriz as MoveIcon } from '@mui/icons-material'
import { StatusChip } from '../../components/common'
import { unitSize } from './UnitListPage'

const HOLD_TYPES = [
  ['QUALITY', 'Quality'], ['PENDING_TEST', 'Waiting for a test'], ['DAMAGE', 'Damage'],
  ['CUSTOMER', 'Customer request'], ['DISPUTE', 'Dispute'], ['OTHER', 'Other'],
]
const EDGES = [['', 'Not set'], ['MILL', 'Mill edge'], ['SLIT', 'Slit edge'], ['TRIMMED', 'Trimmed']]
const EDIT_FIELDS = [
  ['thicknessIn', 'Thickness (in)', true], ['widthIn', 'Width (in)', true], ['lengthIn', 'Length (in)', true],
  ['odIn', 'Outside diameter (in)', true], ['idIn', 'Inside diameter (in)', true], ['gauge', 'Gauge', true],
  ['temper', 'Temper'], ['finish', 'Finish'], ['coating', 'Coating'], ['coatingWeight', 'Coating weight'], ['binLocation', 'Bin'],
]
const when = (d) => (d ? new Date(d).toLocaleString() : '')
const amount = (v, unit) => `${Number(v || 0).toLocaleString()} ${String(unit || 'LB').toLowerCase()}`

async function call(url, method = 'GET', body) {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'The request could not be completed')
  return data
}

const Fact = ({ label, value }) => (
  <Grid item xs={6} md={3}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body1">{value || 'Not set'}</Typography>
  </Grid>
)

export default function UnitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [unit, setUnit] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null) // 'hold' | 'release' | 'edit'
  const [form, setForm] = useState({})
  const [dialogError, setDialogError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [locations, setLocations] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, h] = await Promise.all([call(`/api/coils/${id}`), call(`/api/coils/${id}/history`).catch(() => ({ events: [] }))])
      setUnit(u)
      setEvents(h.events || [])
      setError('')
    } catch (e) {
      setUnit(null)
      setError(e.message)
    }
    setLoading(false)
  }, [id])
  useEffect(() => { load() }, [load])

  const open = (name) => {
    setDialogError('')
    if (name === 'hold') setForm({ holdType: 'QUALITY', holdReason: '' })
    if (name === 'release') setForm({ notes: '' })
    if (name === 'move') {
      setForm({ toLocationId: '' })
      call('/api/inventory/locations?all=true').then((l) => setLocations(Array.isArray(l) ? l : [])).catch(() => setDialogError('The locations could not be loaded.'))
    }
    if (name === 'edit') setForm(Object.fromEntries([...EDIT_FIELDS.map(([k]) => [k, unit[k] ?? '']), ['edgeCondition', unit.edgeCondition || '']]))
    setDialog(name)
  }
  const submit = async () => {
    setSaving(true)
    try {
      if (dialog === 'hold') await call(`/api/coils/${id}/hold`, 'POST', form)
      if (dialog === 'release') await call(`/api/coils/${id}/release`, 'POST', form)
      if (dialog === 'edit') await call(`/api/coils/${id}`, 'PUT', form)
      if (dialog === 'move') await call('/api/inventory/transfer', 'POST', { coilId: id, fromLocationId: unit.locationId, toLocationId: form.toLocationId })
      setNotice(dialog === 'hold' ? 'Item put on hold' : dialog === 'release' ? 'Hold released' : dialog === 'move' ? 'Item moved' : 'Changes saved')
      setDialog(null)
      load()
    } catch (e) {
      setDialogError(e.message)
    }
    setSaving(false)
  }
  const field = (key) => ({ value: form[key] ?? '', onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const inv = unit?.inventory
  const onHold = unit?.status === 'HOLD'
  const closed = ['SHIPPED', 'CONSUMED'].includes(unit?.status)
  const activeHolds = (unit?.qcHolds || []).filter((h) => h.status === 'ACTIVE')

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)' }}>
      <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)', color: 'white', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <IconButton onClick={() => navigate('/units')} sx={{ color: 'white' }} aria-label="Back to units"><BackIcon /></IconButton>
          <Avatar sx={{ width: 56, height: 56, background: 'rgba(255,255,255,0.15)' }}><InventoryIcon sx={{ fontSize: 30 }} /></Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" fontWeight={700}>{unit?.coilNumber || 'Stock item'}</Typography>
              {unit && <StatusChip status={unit.status} />}
            </Box>
            {unit && (
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Heat {unit.heat?.heatNumber || 'not set'}, grade {unit.grade?.code || 'not set'}, {String(unit.form || '').toLowerCase()}
              </Typography>
            )}
          </Box>
          {unit && (
            <Stack direction="row" spacing={1}>
              <Button startIcon={<EditIcon />} variant="outlined" onClick={() => open('edit')} sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>Edit</Button>
              <Button startIcon={<MoveIcon />} variant="outlined" disabled={closed || !unit.inventory} onClick={() => open('move')} sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>Move</Button>
              {onHold
                ? <Button startIcon={<ReleaseIcon />} variant="contained" color="success" onClick={() => open('release')}>Release hold</Button>
                : <Button startIcon={<HoldIcon />} variant="contained" color="warning" disabled={closed} onClick={() => open('hold')}>Put on hold</Button>}
            </Stack>
          )}
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {unit && (
          <>
            {onHold && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                On hold{activeHolds[0] ? `: ${activeHolds[0].holdReason}` : ''}. It cannot be reserved or shipped until the hold is released.
              </Alert>
            )}

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Stock</Typography>
              {inv ? (
                <Grid container spacing={2}>
                  <Fact label="On hand" value={amount(inv.qtyOnHand, inv.unit)} />
                  <Fact label="Available" value={amount(inv.qtyAvailable, inv.unit)} />
                  <Fact label="Reserved for orders" value={amount(inv.qtyAllocated, inv.unit)} />
                  <Fact label="On hold" value={amount(inv.qtyOnHold, inv.unit)} />
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">This item has not been received into stock yet.</Typography>
              )}
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Fact label="Location" value={[unit.location?.name || unit.location?.code, unit.binLocation].filter(Boolean).join(', ')} />
                <Fact label="Product" value={unit.product ? `${unit.product.sku}: ${unit.product.name}` : ''} />
                <Fact label="Net weight" value={amount(unit.netWeightLb, 'lb')} />
                <Fact label="Gross weight" value={amount(unit.grossWeightLb, 'lb')} />
                <Fact label="Size" value={unitSize(unit)} />
                <Fact label="Finish" value={unit.finish} />
                <Fact label="Temper" value={unit.temper} />
                <Fact label="Quality status" value={String(unit.qcStatus || '').toLowerCase()} />
                <Fact label="Mill" value={unit.heat?.mill?.name} />
                <Fact label="List price" value={unit.listPrice == null ? '' : `$${Number(unit.listPrice).toFixed(2)} / ${String(unit.listPriceUnit).toLowerCase()}`} />
                {unit.unitCost !== undefined && <Fact label="Unit cost" value={unit.unitCost == null ? '' : `$${Number(unit.unitCost).toFixed(4)}`} />}
                {unit.parentCoil && <Fact label="Cut from" value={unit.parentCoil.coilNumber} />}
              </Grid>
            </Paper>

            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Holds</Typography>
                  {(unit.qcHolds || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">This item has never been on hold.</Typography>
                  ) : (
                    <Table size="small" aria-label="Holds">
                      <TableHead><TableRow><TableCell>Placed</TableCell><TableCell>Reason</TableCell><TableCell>State</TableCell></TableRow></TableHead>
                      <TableBody>
                        {unit.qcHolds.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell>{when(h.holdDate)}</TableCell>
                            <TableCell>{h.holdReason}</TableCell>
                            <TableCell>
                              <Chip size="small" color={h.status === 'ACTIVE' ? 'warning' : 'default'} label={h.status === 'ACTIVE' ? 'Active' : `Released ${when(h.resolvedDate)}`} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {(unit.childCoils || []).length > 0 && (
                    <>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>Items cut from this one</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {unit.childCoils.map((c) => <Chip key={c.id} label={c.coilNumber} onClick={() => navigate(`/units/${c.id}`)} />)}
                      </Stack>
                    </>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={7}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>History</Typography>
                  <Table size="small" aria-label="History">
                    <TableHead><TableRow><TableCell>When</TableCell><TableCell>What</TableCell><TableCell>Detail</TableCell><TableCell>By</TableCell></TableRow></TableHead>
                    <TableBody>
                      {events.map((e, i) => (
                        <TableRow key={`${e.type}-${e.at}-${i}`}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{when(e.at)}</TableCell>
                          <TableCell>{e.title}</TableCell>
                          <TableCell>{e.detail}</TableCell>
                          <TableCell>{e.by || ''}</TableCell>
                        </TableRow>
                      ))}
                      {events.length === 0 && <TableRow><TableCell colSpan={4}>Nothing recorded yet.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      <Dialog open={Boolean(dialog)} onClose={() => !saving && setDialog(null)} maxWidth={dialog === 'edit' ? 'sm' : 'xs'} fullWidth>
        <DialogTitle>{dialog === 'hold' ? 'Put on hold' : dialog === 'release' ? 'Release hold' : dialog === 'move' ? 'Move to another location' : 'Edit item details'}</DialogTitle>
        <DialogContent>
          {dialog === 'hold' && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">What is available becomes "on hold" and cannot be reserved. Anything already reserved for an order stays reserved, but cannot ship until the hold is released.</Typography>
              <TextField select fullWidth label="Hold type" {...field('holdType')}>
                {HOLD_TYPES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
              </TextField>
              <TextField fullWidth multiline minRows={2} label="Reason" required {...field('holdReason')} />
            </Stack>
          )}
          {dialog === 'release' && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">The held quantity becomes available again and the item can be reserved and shipped. Your name is recorded on the release.</Typography>
              <TextField fullWidth multiline minRows={2} label="Note (optional)" {...field('notes')} />
            </Stack>
          )}
          {dialog === 'move' && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">The whole item moves, with anything reserved on it. It is now at {unit?.location?.name || unit?.location?.code || 'no recorded location'}. The move is recorded in the item history.</Typography>
              <TextField select fullWidth label="Move to" required {...field('toLocationId')}>
                {locations.filter((l) => l.id !== unit?.locationId).map((l) => <MenuItem key={l.id} value={l.id}>{l.code}{l.name && l.name !== l.code ? `: ${l.name}` : ''}</MenuItem>)}
              </TextField>
            </Stack>
          )}
          {dialog === 'edit' && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              {EDIT_FIELDS.map(([key, label, numeric]) => (
                <Grid item xs={6} key={key}>
                  <TextField fullWidth size="small" label={label} type={numeric ? 'number' : 'text'} inputProps={numeric ? { min: 0, step: 'any' } : undefined} {...field(key)} />
                </Grid>
              ))}
              <Grid item xs={6}>
                <TextField select fullWidth size="small" label="Edge" {...field('edgeCondition')}>
                  {EDGES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Status, quantity and location are changed by hold, receiving and transfer, not here.</Typography>
              </Grid>
            </Grid>
          )}
          {dialogError && <Alert severity="error" sx={{ mt: 2 }}>{dialogError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={saving || (dialog === 'hold' && !String(form.holdReason || '').trim()) || (dialog === 'move' && !form.toLocationId)}>
            {dialog === 'hold' ? 'Put on hold' : dialog === 'release' ? 'Release' : dialog === 'move' ? 'Move item' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} message={notice} />
    </Box>
  )
}
