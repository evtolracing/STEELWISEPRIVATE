/**
 * MobileInventoryLookup.jsx — Mobile-optimized inventory search.
 *
 * Big search bar, filterable by location/division/form.
 * Tap-friendly result cards with stock levels & remnant badges.
 * Pull-to-refresh feel. Offline cache stub.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  Grid,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Alert,
  Badge,
  IconButton,
  Collapse,
  alpha,
} from '@mui/material'
import {
  Search as SearchIcon,
  Inventory2 as StockIcon,
  LocationOn as LocationIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  CheckCircle as InStockIcon,
  Warning as LowIcon,
  Cancel as OutIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  ContentCut as RemnantIcon,
} from '@mui/icons-material'
import useMobileMode from '../../hooks/useMobileMode'
import { searchInventory } from '../../services/intakeInventoryApi'

// Stock comes from the live inventory search (/api/inventory/search).
const num = (v) => (v == null ? null : Number(v))
const dimsOf = (r) => [num(r.thickness), num(r.width), num(r.length)].filter(v => v > 0).map(v => `${v}"`).join(' × ')
const toItem = (r) => ({
  id: r.id,
  materialCode: r.sku || r.lotNumber || '',
  description: r.description || r.name || '',
  form: r.form || '—',
  grade: r.grade || '—',
  division: r.division || '—',
  location: r.locationName || '—',
  qtyOnHand: Number(r.weight) || 0,
  unit: r.unit || 'LB',
  status: r.status === 'AVAILABLE' ? (Number(r.weight) > 0 ? 'IN_STOCK' : 'OUT') : 'LOW',
  statusLabel: r.status === 'AVAILABLE' ? null : String(r.status || '').replace(/_/g, ' '),
  isRemnant: Boolean(r.isRemnant),
  dims: dimsOf(r) || '—',
  heatNumber: r.heatNumber || null,
})

const STATUS_CFG = {
  IN_STOCK: { label: 'In Stock', color: 'success', icon: InStockIcon },
  LOW:      { label: 'Low',      color: 'warning', icon: LowIcon },
  OUT:      { label: 'Out',      color: 'error',   icon: OutIcon },
}

const FORMS    = ['ALL', 'PLATE', 'SHEET', 'BAR', 'BEAM', 'ANGLE', 'TUBE', 'COIL']

export default function MobileInventoryLookup() {
  const { isOnline } = useMobileMode()
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('ALL')
  const [formFilter, setFormFilter] = useState('ALL')
  const [remnantOnly, setRemnantOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/inventory/locations').then(r => (r.ok ? r.json() : [])).then(rows => setBranches(Array.isArray(rows) ? rows : [])).catch(() => setBranches([]))
  }, [])

  const runSearch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await searchInventory(search, {
        locationId: locationFilter === 'ALL' ? undefined : locationFilter,
        isRemnant: remnantOnly ? true : undefined,
        limit: 50,
      })
      setItems((res.data || []).map(toItem))
      setError('')
    } catch {
      setItems([])
      setError('Inventory could not be loaded. Check your connection and try again.')
    }
    setLoading(false)
  }, [search, locationFilter, remnantOnly])

  useEffect(() => {
    const timer = setTimeout(runSearch, 300)
    return () => clearTimeout(timer)
  }, [runSearch])

  const results = items.filter(item => formFilter === 'ALL' || String(item.form).toUpperCase() === formFilter)

  const handleRefresh = () => { runSearch() }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          <StockIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} /> Inventory Lookup
        </Typography>
        <IconButton onClick={handleRefresh} disabled={loading}>
          {loading ? <CircularProgress size={22} /> : <RefreshIcon />}
        </IconButton>
      </Box>

      {/* ── Search bar ──────────────────────────────────────── */}
      <TextField
        fullWidth
        placeholder="Search material, grade, code..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          sx: { fontSize: 16, minHeight: 52, borderRadius: 3 },
        }}
        sx={{ mb: 1 }}
      />

      {/* ── Filter toggle ───────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
        <Chip
          label="Filters"
          icon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? 'filled' : 'outlined'}
          color={showFilters ? 'primary' : 'default'}
          sx={{ fontWeight: 600 }}
        />
        <Chip
          label="Remnants"
          icon={<RemnantIcon />}
          onClick={() => setRemnantOnly(!remnantOnly)}
          variant={remnantOnly ? 'filled' : 'outlined'}
          color={remnantOnly ? 'secondary' : 'default'}
          sx={{ fontWeight: 600 }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Collapse in={showFilters}>
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} label="Location" sx={{ minHeight: 44 }}>
                  <MenuItem value="ALL">All Locations</MenuItem>
                  {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Form</InputLabel>
                <Select value={formFilter} onChange={e => setFormFilter(e.target.value)} label="Form" sx={{ minHeight: 44 }}>
                  {FORMS.map(f => <MenuItem key={f} value={f}>{f === 'ALL' ? 'All Forms' : f.charAt(0) + f.slice(1).toLowerCase()}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {!isOnline && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }} icon={false}>
          Showing cached inventory data. Refresh when online for latest stock levels.
        </Alert>
      )}

      {/* ── Results ─────────────────────────────────────────── */}
      {results.map(item => {
        const sCfg = STATUS_CFG[item.status] || STATUS_CFG.IN_STOCK
        const StatusIcon = sCfg.icon
        const expanded = expandedId === item.id

        return (
          <Paper
            key={item.id}
            elevation={0}
            onClick={() => setExpandedId(expanded ? null : item.id)}
            sx={{
              mb: 1.5,
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: expanded ? 'primary.main' : 'divider',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
              '&:active': { transform: 'scale(0.99)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>
                    {item.description}
                  </Typography>
                  {item.isRemnant && (
                    <Chip label="Remnant" size="small" color="secondary" variant="outlined" sx={{ fontWeight: 600, fontSize: 10 }} />
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  {item.materialCode}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    icon={<StatusIcon sx={{ fontSize: 16 }} />}
                    label={`${item.qtyOnHand.toLocaleString()} ${item.unit}`}
                    size="small"
                    color={sCfg.color}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip
                    icon={<LocationIcon sx={{ fontSize: 14 }} />}
                    label={item.location}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 11 }}
                  />
                </Box>
              </Box>

              <IconButton size="small" sx={{ mt: 0.5 }}>
                {expanded ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </Box>

            <Collapse in={expanded}>
              <Divider sx={{ my: 1.5 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Form</Typography>
                  <Typography variant="body2" fontWeight={600}>{item.form}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Grade</Typography>
                  <Typography variant="body2" fontWeight={600}>{item.grade}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Dimensions</Typography>
                  <Typography variant="body2" fontWeight={600}>{item.dims}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Heat #</Typography>
                  <Typography variant="body2" fontWeight={600}>{item.heatNumber || '—'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Division</Typography>
                  <Typography variant="body2" fontWeight={600}>{item.division}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip label={item.statusLabel || sCfg.label} size="small" color={sCfg.color} sx={{ fontWeight: 600 }} />
                </Grid>
              </Grid>
            </Collapse>
          </Paper>
        )
      })}

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {results.length === 0 && !error && !loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <StockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" color="text.secondary">No inventory matches your search.</Typography>
          <Typography variant="body2" color="text.secondary">Try adjusting filters or search terms.</Typography>
        </Box>
      )}
    </Box>
  )
}
