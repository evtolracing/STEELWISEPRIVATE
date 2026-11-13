/**
 * Units: every tracked stock item (coil, sheet, plate, bar) in the system,
 * read from /api/coils. Search and filters run on the server, so they cover
 * all items, not only the page on screen.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Paper, Stack, TextField, MenuItem, InputAdornment, Avatar, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, LinearProgress, Snackbar,
} from '@mui/material'
import { Search as SearchIcon, Inventory as UnitIcon, Upload as UploadIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { StatusChip } from '../../components/common'
import { InventoryUpload } from '../../components/inventory'
import { bulkUploadInventory } from '../../api/inventory'

const PAGE = 25
const STATUSES = [
  ['AVAILABLE', 'Available'], ['ALLOCATED', 'Reserved'], ['IN_PROCESS', 'In process'],
  ['HOLD', 'On hold'], ['SHIPPED', 'Shipped'], ['CONSUMED', 'Consumed'],
]
const num = (v) => (v == null ? null : Number(v))
export const unitSize = (u) => {
  const parts = [num(u.thicknessIn) && `${num(u.thicknessIn)}"`, num(u.widthIn) && `${num(u.widthIn)}" W`, num(u.lengthIn) && `${num(u.lengthIn)}" L`].filter(Boolean)
  return parts.length ? parts.join(' x ') : ''
}
const qty = (v, unit) => (v == null ? '' : `${Number(v).toLocaleString()} ${String(unit || 'LB').toLowerCase()}`)

export default function UnitListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ search: '', status: '', gradeId: '' })
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE) })
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await fetch(`/api/coils?${params}`)
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || 'The stock items could not be loaded')
      setRows(Array.isArray(body) ? body : [])
      setTotal(Number(res.headers.get('X-Total-Count')) || (Array.isArray(body) ? body.length : 0))
      setError('')
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [filters, page])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])
  useEffect(() => {
    fetch('/api/grades').then((r) => (r.ok ? r.json() : [])).then((g) => setGrades(Array.isArray(g) ? g : [])).catch(() => setGrades([]))
  }, [])

  const setFilter = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(0) }

  const handleBulkUpload = async (data) => {
    // The upload box shows what was received and why any row was not; this screen only refreshes.
    const result = await bulkUploadInventory(data)
    if (result?.imported) { setNotice(result.message || `${result.imported} items were received.`); load() }
    return result
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)' }}>
      <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)', color: 'white', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, background: 'rgba(255,255,255,0.15)' }}><UnitIcon sx={{ fontSize: 30 }} /></Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Units</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>Every tracked stock item, with its heat, size, location and status</Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>Refresh</Button>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)} sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>Upload</Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              placeholder="Search by item number, heat or grade" size="small" value={filters.search} onChange={setFilter('search')}
              inputProps={{ 'aria-label': 'Search stock items' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
              sx={{ minWidth: 300 }}
            />
            <TextField select label="Status" size="small" value={filters.status} onChange={setFilter('status')} sx={{ minWidth: 160 }}>
              <MenuItem value="">All statuses</MenuItem>
              {STATUSES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
            <TextField select label="Grade" size="small" value={filters.gradeId} onChange={setFilter('gradeId')} sx={{ minWidth: 160 }}>
              <MenuItem value="">All grades</MenuItem>
              {grades.map((g) => <MenuItem key={g.id} value={g.id}>{g.code}</MenuItem>)}
            </TextField>
            <Box sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.secondary">{total.toLocaleString()} item{total === 1 ? '' : 's'}</Typography>
          </Stack>
        </Paper>

        <Paper>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table size="small" aria-label="Stock items">
              <TableHead>
                <TableRow>
                  <TableCell>Item number</TableCell>
                  <TableCell>Heat</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Form</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">On hand</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/units/${u.id}`)}>
                    <TableCell><Typography variant="body2" fontWeight={600} color="primary">{u.coilNumber}</Typography></TableCell>
                    <TableCell>{u.heat?.heatNumber || ''}</TableCell>
                    <TableCell>{u.grade?.code || ''}</TableCell>
                    <TableCell>{String(u.form || '').toLowerCase()}</TableCell>
                    <TableCell>{unitSize(u)}</TableCell>
                    <TableCell align="right">{u.inventory ? qty(u.inventory.qtyOnHand, u.inventory.unit) : 'Not received'}</TableCell>
                    <TableCell align="right">{u.inventory ? qty(u.inventory.qtyAvailable, u.inventory.unit) : ''}</TableCell>
                    <TableCell>{[u.location?.name || u.location?.code, u.binLocation].filter(Boolean).join(', ')}</TableCell>
                    <TableCell><StatusChip status={u.status} /></TableCell>
                  </TableRow>
                ))}
                {!loading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={9}>{error ? 'Nothing to show.' : 'No stock items match.'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={total} page={page} rowsPerPage={PAGE} rowsPerPageOptions={[PAGE]} onPageChange={(e, p) => setPage(p)} />
        </Paper>
      </Box>

      <InventoryUpload open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleBulkUpload} defaultTemplate="coils" />
      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} message={notice} />
    </Box>
  )
}
