/**
 * Heats: every mill heat on record, read from /api/heats. A heat is the mill's
 * batch number; it ties stock to its mill test certificate. Search and filters
 * run on the server, so they cover every heat, not only the page on screen.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Paper, Stack, TextField, MenuItem, InputAdornment, Avatar, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
} from '@mui/material'
import { Search as SearchIcon, Whatshot as HeatIcon, Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { StatusChip } from '../../components/common'

const PAGE = 25
export const HEAT_STATUSES = [['ACTIVE', 'Active'], ['CONSUMED', 'Consumed'], ['ARCHIVED', 'Archived']]
export const MELT_TYPES = [['BOF', 'Basic oxygen (BOF)'], ['EAF', 'Electric arc (EAF)'], ['AOD', 'AOD']]
export const CAST_TYPES = [['CONTINUOUS', 'Continuous cast'], ['INGOT', 'Ingot']]
export const day = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '')
export const pounds = (v) => (v === null || v === undefined || v === '' ? '' : `${Number(v).toLocaleString()} lb`)
/** "C 0.2 · Mn 0.85" from whatever elements the heat has on file. */
export const chemistryLine = (chemistry, max = 4) => Object.entries(chemistry || {}).filter(([, v]) => v !== null && v !== '').slice(0, max).map(([k, v]) => `${k} ${v}`).join(' · ')

async function getJson(url) {
  const res = await fetch(url)
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error || 'The request failed')
  return { body, total: Number(res.headers.get('X-Total-Count')) || 0 }
}

/** Add a heat. The mill and grade come from the lists on file. */
function AddHeatDialog({ open, onClose, onAdded }) {
  const blank = { heatNumber: '', millId: '', gradeId: '', castDate: '', meltType: '', castType: '', totalWeightLb: '' }
  const [form, setForm] = useState(blank)
  const [mills, setMills] = useState([])
  const [grades, setGrades] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!open) return
    setForm(blank); setError('')
    Promise.all([getJson('/api/heats/mills'), getJson('/api/grades?isActive=true')])
      .then(([m, g]) => { setMills(m.body || []); setGrades(g.body || []) })
      .catch(() => setError('The mills and grades could not be loaded. Close this box and try again.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const ready = form.heatNumber.trim() && form.millId && form.gradeId && form.castDate
  const save = async () => {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/heats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'The heat could not be saved')
      onAdded(body)
    } catch (e) { setError(e.message) }
    setBusy(false)
  }
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add a heat</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={6}><TextField label="Heat number" value={form.heatNumber} onChange={set('heatNumber')} fullWidth required autoFocus helperText="As printed on the mill certificate" inputProps={{ maxLength: 60 }} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Cast date" type="date" value={form.castDate} onChange={set('castDate')} fullWidth required InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Mill" value={form.millId} onChange={set('millId')} fullWidth required helperText={mills.length ? '' : 'No mills are on file yet'}>
              {mills.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Grade" value={form.gradeId} onChange={set('gradeId')} fullWidth required>
              {grades.map((g) => <MenuItem key={g.id} value={g.id}>{g.code}: {g.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Melt type" value={form.meltType} onChange={set('meltType')} fullWidth>
              <MenuItem value="">Not recorded</MenuItem>
              {MELT_TYPES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Cast type" value={form.castType} onChange={set('castType')} fullWidth>
              <MenuItem value="">Not recorded</MenuItem>
              {CAST_TYPES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}><TextField label="Total weight (lb)" type="number" value={form.totalWeightLb} onChange={set('totalWeightLb')} fullWidth inputProps={{ min: 0 }} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || !ready}>{busy ? 'Saving…' : 'Add heat'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function HeatListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE) })
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const { body, total: count } = await getJson(`/api/heats?${params}`)
      setRows(Array.isArray(body) ? body : [])
      setTotal(count || (Array.isArray(body) ? body.length : 0))
      setError('')
    } catch (e) {
      setError(e.message === 'The request failed' ? 'The heats could not be loaded' : e.message)
    }
    setLoading(false)
  }, [filters, page])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const change = (k) => (e) => { setPage(0); setFilters((f) => ({ ...f, [k]: e.target.value })) }
  const filtered = Boolean(filters.search || filters.status)

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)' }}>
      <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)', color: 'white', boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, background: 'rgba(255,255,255,0.15)' }}><HeatIcon sx={{ fontSize: 30 }} /></Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>Heats</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>Mill heats and the stock that came from each one</Typography>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)} sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>Add Heat</Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={load}>Try again</Button>}>{error}</Alert>}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField placeholder="Heat number, grade or mill" size="small" value={filters.search} onChange={change('search')} sx={{ minWidth: 280 }}
              inputProps={{ 'aria-label': 'Search heats' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} />
            <TextField select label="Status" size="small" value={filters.status} onChange={change('status')} sx={{ minWidth: 160 }}>
              <MenuItem value="">All statuses</MenuItem>
              {HEAT_STATUSES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
            <Box sx={{ flex: 1 }} />
            <Button size="small" startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
          </Stack>
        </Paper>

        <Paper>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table size="small" aria-label="Heats">
              <TableHead>
                <TableRow>
                  <TableCell>Heat number</TableCell><TableCell>Mill</TableCell><TableCell>Grade</TableCell><TableCell>Cast date</TableCell>
                  <TableCell>Chemistry</TableCell><TableCell align="right">Stock items</TableCell><TableCell align="right">Heat weight</TableCell>
                  <TableCell>Mill cert</TableCell><TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((h) => (
                  <TableRow key={h.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/heats/${h.id}`)}>
                    <TableCell><Typography variant="body2" fontWeight={600} color="primary">{h.heatNumber}</Typography></TableCell>
                    <TableCell>{h.mill?.name}</TableCell>
                    <TableCell>{h.grade?.code}</TableCell>
                    <TableCell>{day(h.castDate)}</TableCell>
                    <TableCell>{chemistryLine(h.chemistry) || <Typography variant="caption" color="text.secondary">Not recorded</Typography>}</TableCell>
                    <TableCell align="right">{h.unitCount}</TableCell>
                    <TableCell align="right">{pounds(h.totalWeightLb)}</TableCell>
                    <TableCell>{h.hasMtr ? <Chip label="On file" size="small" color="success" variant="outlined" /> : <Typography variant="caption" color="text.secondary">None</Typography>}</TableCell>
                    <TableCell><StatusChip status={h.status} /></TableCell>
                  </TableRow>
                ))}
                {!loading && !error && rows.length === 0 && (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    {filtered ? 'No heats match these filters.' : 'No heats are on record yet. Use Add Heat to record the first one.'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={total} page={page} onPageChange={(_e, p) => setPage(p)} rowsPerPage={PAGE} rowsPerPageOptions={[PAGE]} />
        </Paper>
      </Box>
      <AddHeatDialog open={adding} onClose={() => setAdding(false)} onAdded={(h) => { setAdding(false); navigate(`/heats/${h.id}`) }} />
    </Box>
  )
}
