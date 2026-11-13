/**
 * Receiving: stock coming into the building.
 *
 * Receive one item with the form, or many with an upload file. Each receipt
 * makes a real stock item with its balance and a movement record
 * (POST /api/inventory/receipts). The list below is what was really received.
 *
 * Expected deliveries are not shown: the system has no purchase orders yet,
 * so there is nothing true to list (finding I-007).
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Paper, Typography, Grid, Chip, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Avatar,
  LinearProgress, Link as MuiLink, InputAdornment,
} from '@mui/material'
import { MoveToInbox as ReceivingIcon, Refresh as RefreshIcon, Add as AddIcon, Upload as UploadIcon, Search as SearchIcon } from '@mui/icons-material'
import { InventoryUpload } from '../components/inventory'
import { bulkUploadInventory } from '../api/inventory'
import { StatusChip } from '../components/common'
import { unitSize } from './Units/UnitListPage'

const FORMS = [['COIL', 'Coil'], ['SHEET', 'Sheet'], ['PLATE', 'Plate'], ['BAR', 'Bar'], ['TUBE', 'Tube'], ['BEAM', 'Beam'], ['REBAR', 'Rebar'], ['WIRE', 'Wire'], ['ROD', 'Rod'], ['SUPPLY', 'Supply']]
const BLANK = { coilNumber: '', form: 'COIL', heatNumber: '', gradeCode: '', thicknessIn: '', widthIn: '', lengthIn: '', weightLb: '', locationId: '', binLocation: '', ownership: 'HOUSE_OWNED', customerName: '', productSku: '', poReference: '', notes: '' }
const when = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '')
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

async function getJson(url) {
  const res = await fetch(url)
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error || 'The request failed')
  return body
}

function ReceiveDialog({ open, onClose, onReceived }) {
  const [form, setForm] = useState(BLANK)
  const [locations, setLocations] = useState([])
  const [grades, setGrades] = useState([])
  const [heat, setHeat] = useState(null) // null: not looked up, false: not on file, object: found
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(BLANK); setHeat(null); setError('')
    Promise.all([getJson('/api/inventory/locations'), getJson('/api/grades?isActive=true')])
      .then(([l, g]) => { setLocations(l || []); setGrades(g || []) })
      .catch(() => setError('The locations and grades could not be loaded. Close this box and try again.'))
  }, [open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  // The heat fixes the grade: look it up when the number is typed.
  const lookUpHeat = async () => {
    const number = form.heatNumber.trim()
    if (!number) { setHeat(null); return }
    try {
      const found = (await getJson(`/api/heats?search=${encodeURIComponent(number)}&limit=20`)).find((h) => h.heatNumber.toLowerCase() === number.toLowerCase())
      setHeat(found || false)
      if (found) setForm((f) => ({ ...f, heatNumber: found.heatNumber, gradeCode: found.grade?.code || f.gradeCode }))
    } catch { setHeat(null) }
  }
  const ready = form.coilNumber.trim() && form.heatNumber.trim() && form.gradeCode && Number(form.weightLb) > 0 && form.locationId && (form.ownership === 'HOUSE_OWNED' || form.customerName.trim())

  const save = async () => {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/inventory/receipts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'The item could not be received')
      onReceived(body)
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Receive a stock item</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={4}><TextField label="Item number (tag)" value={form.coilNumber} onChange={set('coilNumber')} fullWidth required autoFocus inputProps={{ maxLength: 60 }} /></Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Form" value={form.form} onChange={set('form')} fullWidth required>
              {FORMS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}><TextField label="Weight (lb)" type="number" value={form.weightLb} onChange={set('weightLb')} fullWidth required inputProps={{ min: 0, step: 'any' }} /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Heat or lot number" value={form.heatNumber} onChange={(e) => { setHeat(null); set('heatNumber')(e) }} onBlur={lookUpHeat} fullWidth required
              error={heat === false}
              helperText={heat === false ? 'This heat is not on file. Add it under Heats first, so the item can be traced to its mill certificate.' : heat ? `On file: ${heat.mill?.name || 'mill not recorded'}, grade ${heat.grade?.code}` : 'As printed on the mill certificate'} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Grade" value={form.gradeCode} onChange={set('gradeCode')} fullWidth required disabled={Boolean(heat)} helperText={heat ? 'Set by the heat' : ''}>
              {grades.map((g) => <MenuItem key={g.id} value={g.code}>{g.code}: {g.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={4}><TextField label="Thickness (in)" type="number" value={form.thicknessIn} onChange={set('thicknessIn')} fullWidth inputProps={{ min: 0, step: 'any' }} /></Grid>
          <Grid item xs={4}><TextField label="Width (in)" type="number" value={form.widthIn} onChange={set('widthIn')} fullWidth inputProps={{ min: 0, step: 'any' }} /></Grid>
          <Grid item xs={4}><TextField label="Length (in)" type="number" value={form.lengthIn} onChange={set('lengthIn')} fullWidth inputProps={{ min: 0, step: 'any' }} /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Location" value={form.locationId} onChange={set('locationId')} fullWidth required>
              {locations.map((l) => <MenuItem key={l.id} value={l.id}>{l.code}{l.name && l.name !== l.code ? `: ${l.name}` : ''}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}><TextField label="Bay or bin" value={form.binLocation} onChange={set('binLocation')} fullWidth inputProps={{ maxLength: 60 }} /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Who owns it" value={form.ownership} onChange={set('ownership')} fullWidth>
              <MenuItem value="HOUSE_OWNED">Our stock</MenuItem>
              <MenuItem value="CUSTOMER_OWNED">Customer-owned (toll)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            {form.ownership === 'CUSTOMER_OWNED' && <TextField label="Customer name or code" value={form.customerName} onChange={set('customerName')} fullWidth required helperText="Exactly as it is on the customer record" />}
          </Grid>
          <Grid item xs={12} sm={6}><TextField label="Product SKU (optional)" value={form.productSku} onChange={set('productSku')} fullWidth helperText="Links the item to the catalog and its list price" inputProps={{ maxLength: 60 }} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Purchase order reference (optional)" value={form.poReference} onChange={set('poReference')} fullWidth inputProps={{ maxLength: 60 }} /></Grid>
          <Grid item xs={12}><TextField label="Notes (optional)" value={form.notes} onChange={set('notes')} fullWidth multiline minRows={2} inputProps={{ maxLength: 500 }} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || !ready || heat === false}>{busy ? 'Receiving…' : 'Receive item'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ReceivingPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [receiving, setReceiving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows((await getJson('/api/inventory/receipts?limit=200&days=30')).data || [])
      setError('')
    } catch (e) {
      setError(e.message === 'The request failed' ? 'The receipts could not be loaded' : e.message)
    }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  // The upload box shows what was received and why any row was not; this screen only refreshes.
  const handleBulkUpload = async (data) => {
    const result = await bulkUploadInventory(data)
    if (result?.imported) load()
    return result
  }

  const today = rows.filter((r) => sameDay(r.receivedAt, Date.now()))
  const needle = search.trim().toLowerCase()
  const shown = needle ? rows.filter((r) => [r.item?.coilNumber, r.item?.heatNumber, r.item?.grade, r.notes, r.location?.code].some((v) => String(v || '').toLowerCase().includes(needle))) : rows

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)', mx: -3, mt: -3 }}>
      <Box sx={{ px: 3, py: 3, background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)', color: 'white', boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, background: 'rgba(255,255,255,0.15)' }}><ReceivingIcon sx={{ fontSize: 30 }} /></Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>Receiving</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>Bring stock into the building and see what has arrived</Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setUploading(true)} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>Upload file</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setReceiving(true)} sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>Receive item</Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={load}>Try again</Button>}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}><Paper sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Received today</Typography><Typography variant="h4" fontWeight={700}>{today.length}</Typography></Paper></Grid>
          <Grid item xs={6} md={3}><Paper sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Weight today</Typography><Typography variant="h4" fontWeight={700}>{today.reduce((n, r) => n + (r.qty || 0), 0).toLocaleString()} lb</Typography></Paper></Grid>
          <Grid item xs={6} md={3}><Paper sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Received in the last 30 days</Typography><Typography variant="h4" fontWeight={700}>{rows.length}{rows.length === 200 ? '+' : ''}</Typography></Paper></Grid>
          <Grid item xs={6} md={3}><Paper sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Waiting for inspection</Typography><Typography variant="h4" fontWeight={700}>{rows.filter((r) => r.item?.qcStatus === 'PENDING').length}</Typography></Paper></Grid>
        </Grid>
        <Alert severity="info" sx={{ mb: 2 }}>
          Expected deliveries are not listed here yet. The system does not hold purchase orders, so it cannot know what is on its way. Receive each delivery when it arrives, and put the purchase order number in the reference box.
        </Alert>

        <Paper>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ flex: 1 }}>Received in the last 30 days</Typography>
            <TextField size="small" placeholder="Item, heat, grade or reference" value={search} onChange={(e) => setSearch(e.target.value)} inputProps={{ 'aria-label': 'Search receipts' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} sx={{ minWidth: 280 }} />
            <Button size="small" startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
          </Box>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table size="small" aria-label="Recent receipts">
              <TableHead>
                <TableRow>
                  <TableCell>Received</TableCell><TableCell>Item</TableCell><TableCell>Form</TableCell><TableCell>Heat</TableCell><TableCell>Grade</TableCell><TableCell>Size</TableCell>
                  <TableCell align="right">Weight</TableCell><TableCell>Location</TableCell><TableCell>Owner</TableCell><TableCell>Inspection</TableCell><TableCell>Received by</TableCell><TableCell>Reference and notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shown.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{when(r.receivedAt)}</TableCell>
                    <TableCell>{r.item ? <MuiLink component="button" underline="hover" onClick={() => navigate(`/units/${r.item.id}`)}>{r.item.coilNumber}</MuiLink> : ''}</TableCell>
                    <TableCell>{r.item?.form}</TableCell>
                    <TableCell>{r.item?.heatNumber}</TableCell>
                    <TableCell>{r.item?.grade}</TableCell>
                    <TableCell>{r.item ? unitSize(r.item) : ''}</TableCell>
                    <TableCell align="right">{Number(r.qty).toLocaleString()} {String(r.unit || 'LB').toLowerCase()}</TableCell>
                    <TableCell>{r.location?.code}</TableCell>
                    <TableCell>{r.item?.owner}</TableCell>
                    <TableCell>{r.item?.qcStatus ? <StatusChip status={r.item.qcStatus} /> : ''}</TableCell>
                    <TableCell>{r.receivedBy}{r.byUpload && <Chip label="Upload" size="small" variant="outlined" sx={{ ml: 1 }} />}</TableCell>
                    <TableCell>{r.notes}</TableCell>
                  </TableRow>
                ))}
                {!loading && !error && shown.length === 0 && (
                  <TableRow><TableCell colSpan={12} align="center" sx={{ py: 5 }}>{needle ? 'No receipts match your search.' : 'Nothing has been received in the last 30 days.'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      <ReceiveDialog open={receiving} onClose={() => setReceiving(false)}
        onReceived={(done) => { setReceiving(false); setSnack({ open: true, msg: done.warning ? `${done.item.coilNumber} received. ${done.warning}` : `${done.item.coilNumber} received`, severity: done.warning ? 'warning' : 'success' }); load() }} />
      <InventoryUpload open={uploading} onClose={() => setUploading(false)} onUpload={handleBulkUpload} />
      <Snackbar open={snack.open} autoHideDuration={snack.severity === 'warning' ? 9000 : 4000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
