/**
 * MaterialPicker — Browse real inventory (coils/sheets/plates/bars/tubes/beams)
 * from the database to select material for order line items.
 *
 * Tab 0: Live Inventory — queries /api/coils with filters (grade, form, status)
 * Tab 1: Catalog — mock product catalog search (legacy)
 * Tab 2: Stock Search — mock inventory search (legacy)
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog, DialogTitle, DialogContent, TextField, Button, Box, Typography,
  InputAdornment, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, Paper, Tooltip, Alert, Stack,
} from '@mui/material'
import {
  Search as SearchIcon, Close as CloseIcon, Inventory as StockIcon,
  CheckCircle as AvailIcon, Warning as LowIcon, Block as OutIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'
import { searchProducts } from '../../services/intakeProductsApi'
import { searchInventory } from '../../services/intakeInventoryApi'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const FORM_OPTIONS = [
  { value: '', label: 'All Forms' },
  { value: 'COIL', label: 'Coil' },
  { value: 'SHEET', label: 'Sheet' },
  { value: 'PLATE', label: 'Plate' },
  { value: 'BAR', label: 'Bar' },
  { value: 'TUBE', label: 'Tube' },
  { value: 'BEAM', label: 'Beam' },
  { value: 'REBAR', label: 'Rebar' },
  { value: 'WIRE', label: 'Wire' },
]

const STATUS_COLOR = {
  AVAILABLE: 'success',
  ALLOCATED: 'warning',
  IN_PROCESS: 'info',
  HOLD: 'error',
  SHIPPED: 'default',
  CONSUMED: 'default',
}

function formatDimensions(item) {
  const t = item.thicknessIn ? Number(item.thicknessIn) : null
  const w = item.widthIn ? Number(item.widthIn) : null
  const l = item.lengthIn ? Number(item.lengthIn) : null
  const od = item.odIn ? Number(item.odIn) : null

  if (item.form === 'BAR') {
    return `${t}" dia × ${l}" L`
  }
  if (item.form === 'TUBE') {
    return `${w}" OD × ${t}" wall × ${l}" L`
  }
  if (item.form === 'BEAM') {
    return `W${w} × ${l}" L`
  }
  if (item.form === 'COIL') {
    return `${t}" × ${w}" W${od ? ` × ${od}" OD` : ''}`
  }
  // SHEET, PLATE
  return `${t}" × ${w}" × ${l}"`
}

export default function MaterialPicker({ open, onClose, onSelect, division: initialDivision }) {
  const [tab, setTab] = useState(0) // 0=live inventory, 1=catalog, 2=stock search
  const [query, setQuery] = useState('')
  const [division, setDivision] = useState(initialDivision || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  // Live inventory filters
  const [formFilter, setFormFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('AVAILABLE')
  const [liveResults, setLiveResults] = useState([])
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState(null)
  const [grades, setGrades] = useState([])
  const [gradeFilter, setGradeFilter] = useState('')

  // ─── Load grades for filter dropdown ───
  useEffect(() => {
    if (!open) return
    fetch(`${API_BASE}/grades`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setGrades(Array.isArray(data) ? data : []))
      .catch(() => setGrades([]))
  }, [open])

  // ─── Live inventory search ───
  const loadLiveInventory = useCallback(async () => {
    setLiveLoading(true)
    setLiveError(null)
    try {
      const params = new URLSearchParams()
      if (formFilter) params.set('form', formFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (gradeFilter) params.set('gradeId', gradeFilter)
      const url = `${API_BASE}/coils?${params.toString()}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load inventory')
      let data = await res.json()

      // Client-side text search
      if (query && query.length >= 2) {
        const q = query.toLowerCase()
        data = data.filter(c =>
          c.coilNumber?.toLowerCase().includes(q) ||
          c.grade?.name?.toLowerCase().includes(q) ||
          c.grade?.code?.toLowerCase().includes(q) ||
          c.heat?.heatNumber?.toLowerCase().includes(q) ||
          c.finish?.toLowerCase().includes(q) ||
          c.form?.toLowerCase().includes(q) ||
          c.location?.name?.toLowerCase().includes(q) ||
          c.location?.code?.toLowerCase().includes(q) ||
          c.binLocation?.toLowerCase().includes(q)
        )
      }

      setLiveResults(data)
    } catch (err) {
      setLiveError(err.message)
      setLiveResults([])
    } finally {
      setLiveLoading(false)
    }
  }, [formFilter, statusFilter, gradeFilter, query])

  // Trigger live search on filter changes
  useEffect(() => {
    if (tab !== 0 || !open) return
    const t = setTimeout(loadLiveInventory, 200)
    return () => clearTimeout(t)
  }, [loadLiveInventory, tab, open])

  // ─── Catalog / stock search (legacy mock) ───
  const doSearch = useCallback(async () => {
    if (!query || query.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      if (tab === 1) {
        const { data } = await searchProducts(query, { division: division || undefined })
        setResults(data || [])
      } else if (tab === 2) {
        const { data } = await searchInventory(query, { division: division || undefined })
        setResults(data || [])
      }
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [query, division, tab])

  useEffect(() => {
    if (tab === 0) return // live inventory handles its own loading
    const t = setTimeout(doSearch, 300)
    return () => clearTimeout(t)
  }, [doSearch, tab])

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setLiveResults([])
      setDivision(initialDivision || '')
      setFormFilter('')
      setStatusFilter('AVAILABLE')
      setGradeFilter('')
      setTab(0)
    }
  }, [open, initialDivision])

  // ─── Select a live inventory item ───
  const handleSelectCoil = (coil) => {
    onSelect({
      type: 'coil',
      id: coil.id,
      coilNumber: coil.coilNumber,
      description: `${coil.grade?.code || ''} ${coil.form} ${formatDimensions(coil)} — ${coil.finish || 'N/A'}`,
      form: coil.form,
      grade: coil.grade?.code || '',
      gradeName: coil.grade?.name || '',
      gradeId: coil.gradeId,
      heatNumber: coil.heat?.heatNumber || '',
      dimensions: formatDimensions(coil),
      weight: Number(coil.netWeightLb || coil.grossWeightLb),
      unitPrice: Number(coil.landedCost || coil.unitCost || 0),
      uom: 'LB',
      location: coil.location?.code || '',
      locationName: coil.location?.name || '',
      binLocation: coil.binLocation || '',
      status: coil.status,
      qcStatus: coil.qcStatus,
      finish: coil.finish,
      thicknessIn: Number(coil.thicknessIn || 0),
      widthIn: Number(coil.widthIn || 0),
      lengthIn: Number(coil.lengthIn || 0),
    })
    onClose()
  }

  const stockBadge = (inStock) => inStock
    ? <Chip icon={<AvailIcon />} label="In Stock" size="small" color="success" variant="outlined" />
    : <Chip icon={<OutIcon />} label="Out" size="small" color="error" variant="outlined" />

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
        <Box>
          <Typography variant="h6" component="span">Select Material</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }} component="span">
            Browse live inventory to add to order
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pt: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab icon={<StockIcon />} iconPosition="start" label="Live Inventory" sx={{ textTransform: 'none', minWidth: 140 }} />
          <Tab label="Catalog" sx={{ textTransform: 'none', minWidth: 80 }} />
          <Tab label="Stock Search" sx={{ textTransform: 'none', minWidth: 100 }} />
        </Tabs>
      </Box>

      {/* ─── LIVE INVENTORY TAB ─── */}
      {tab === 0 && (
        <Box sx={{ px: 3, pt: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              size="small" placeholder="Search by unit #, grade, heat, finish…"
              value={query} onChange={e => setQuery(e.target.value)} sx={{ flex: 1, minWidth: 200 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>, endAdornment: liveLoading ? <CircularProgress size={18} /> : null }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Form</InputLabel>
              <Select value={formFilter} label="Form" onChange={e => setFormFilter(e.target.value)}>
                {FORM_OPTIONS.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Grade</InputLabel>
              <Select value={gradeFilter} label="Grade" onChange={e => setGradeFilter(e.target.value)}>
                <MenuItem value="">All Grades</MenuItem>
                {grades.map(g => <MenuItem key={g.id} value={g.id}>{g.code} — {g.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="AVAILABLE">Available</MenuItem>
                <MenuItem value="ALLOCATED">Allocated</MenuItem>
                <MenuItem value="HOLD">On Hold</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      )}

      {/* ─── CATALOG / STOCK SEARCH TABS ─── */}
      {tab > 0 && (
        <Box sx={{ px: 3, pt: 1.5, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            autoFocus size="small" placeholder={tab === 1 ? 'Product name, SKU, grade…' : 'Lot #, description, SKU…'}
            value={query} onChange={e => setQuery(e.target.value)} sx={{ flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>, endAdornment: loading ? <CircularProgress size={18} /> : null }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Division</InputLabel>
            <Select value={division} label="Division" onChange={e => setDivision(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="METALS">Metals</MenuItem>
              <MenuItem value="PLASTICS">Plastics</MenuItem>
              <MenuItem value="SUPPLIES">Supplies</MenuItem>
              <MenuItem value="OUTLET">Outlet</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      <DialogContent sx={{ minHeight: 350, pt: 1 }}>

        {/* ─── LIVE INVENTORY RESULTS ─── */}
        {tab === 0 && liveError && (
          <Alert severity="error" sx={{ mt: 1 }}>{liveError}</Alert>
        )}

        {tab === 0 && !liveLoading && liveResults.length === 0 && !liveError && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <StockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">No inventory matches your filters.</Typography>
            <Typography variant="body2" color="text.secondary">Try adjusting the form, grade, or status filters above.</Typography>
          </Box>
        )}

        {tab === 0 && liveResults.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Unit #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Form</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Dimensions</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Finish</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Weight (lb)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">$/lb</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Heat #</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {liveResults.map(coil => (
                  <TableRow
                    key={coil.id} hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => handleSelectCoil(coil)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{coil.coilNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={coil.form} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={coil.grade?.name || ''}>
                        <Typography variant="body2" fontWeight={500}>{coil.grade?.code || '—'}</Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                        {formatDimensions(coil)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>{coil.finish || '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>
                        {Number(coil.netWeightLb || coil.grossWeightLb).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        ${Number(coil.landedCost || coil.unitCost || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {coil.location?.code || '—'}
                        {coil.binLocation ? ` / ${coil.binLocation}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coil.status}
                        size="small"
                        color={STATUS_COLOR[coil.status] || 'default'}
                        variant={coil.status === 'AVAILABLE' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                        {coil.heat?.heatNumber || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="contained" color="primary" onClick={(e) => { e.stopPropagation(); handleSelectCoil(coil) }}>
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 0 && liveResults.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Showing {liveResults.length} item{liveResults.length !== 1 ? 's' : ''} from database
          </Typography>
        )}

        {/* ─── CATALOG TAB (legacy mock) ─── */}
        {tab === 1 && results.length === 0 && query.length >= 2 && !loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>No results found.</Typography>
        )}

        {tab === 1 && results.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>SKU</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Form</TableCell>
                  <TableCell align="right">Base $/unit</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map(p => (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => { onSelect({ type: 'product', ...p }); onClose() }}>
                    <TableCell><Typography variant="body2" fontFamily="monospace">{p.sku}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={500}>{p.name}</Typography></TableCell>
                    <TableCell>{p.grade}</TableCell>
                    <TableCell><Chip label={p.form} size="small" variant="outlined" /></TableCell>
                    <TableCell align="right">${p.basePrice?.toFixed(2)} / {p.priceUnit}</TableCell>
                    <TableCell align="center">{stockBadge(p.inStock)}</TableCell>
                    <TableCell><Button size="small" variant="outlined">Select</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* ─── STOCK SEARCH TAB (legacy mock) ─── */}
        {tab === 2 && results.length === 0 && query.length >= 2 && !loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>No results found.</Typography>
        )}

        {tab === 2 && results.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Lot #</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Weight</TableCell>
                  <TableCell>Remnant</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map(inv => (
                  <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => { onSelect({ type: 'inventory', ...inv }); onClose() }}>
                    <TableCell><Typography variant="body2" fontFamily="monospace">{inv.lotNumber}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{inv.description}</Typography></TableCell>
                    <TableCell>{inv.locationName}</TableCell>
                    <TableCell align="right">{inv.qty}</TableCell>
                    <TableCell align="right">{inv.weight?.toLocaleString()} lb</TableCell>
                    <TableCell>{inv.isRemnant ? <Chip label="Remnant" size="small" color="warning" /> : '—'}</TableCell>
                    <TableCell><Button size="small" variant="outlined">Select</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  )
}
