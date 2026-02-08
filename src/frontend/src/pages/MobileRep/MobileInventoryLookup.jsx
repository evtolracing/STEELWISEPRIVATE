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

// ── Mock inventory data ────────────────────────────────────────────────────
const MOCK_INVENTORY = [
  { id: 'inv-1', materialCode: 'HR-A36-PLT-0.25', description: 'HR A36 Plate 1/4"', form: 'Plate', grade: 'A36', division: 'METALS', location: 'JACKSON', qtyOnHand: 4200, unit: 'LB', status: 'IN_STOCK', isRemnant: false, dims: '48" × 96"', heatNumber: 'H-2026-0142' },
  { id: 'inv-2', materialCode: 'HR-A36-PLT-0.50', description: 'HR A36 Plate 1/2"', form: 'Plate', grade: 'A36', division: 'METALS', location: 'JACKSON', qtyOnHand: 1800, unit: 'LB', status: 'IN_STOCK', isRemnant: false, dims: '48" × 120"', heatNumber: 'H-2026-0138' },
  { id: 'inv-3', materialCode: 'CR-1018-SHT-16GA', description: 'CR 1018 Sheet 16 Ga', form: 'Sheet', grade: '1018', division: 'METALS', location: 'DETROIT', qtyOnHand: 620, unit: 'LB', status: 'LOW', isRemnant: false, dims: '48" × 96"', heatNumber: 'H-2026-0155' },
  { id: 'inv-4', materialCode: 'SS-304-BAR-1.0', description: 'SS 304 Round Bar 1"', form: 'Bar', grade: '304', division: 'METALS', location: 'KALAMAZOO', qtyOnHand: 350, unit: 'LB', status: 'IN_STOCK', isRemnant: false, dims: '1" dia × 12\'', heatNumber: 'H-2026-0161' },
  { id: 'inv-5', materialCode: 'HR-A572-BM-W8X31', description: 'HR A572 W8×31 Beam', form: 'Beam', grade: 'A572-50', division: 'METALS', location: 'GRAND_RAPIDS', qtyOnHand: 2400, unit: 'LB', status: 'IN_STOCK', isRemnant: false, dims: 'W8×31 × 40\'', heatNumber: 'H-2026-0170' },
  { id: 'inv-6', materialCode: 'HR-A36-ANG-3X3', description: 'HR A36 Angle 3×3×1/4', form: 'Angle', grade: 'A36', division: 'METALS', location: 'JACKSON', qtyOnHand: 980, unit: 'LB', status: 'IN_STOCK', isRemnant: false, dims: '3" × 3" × 1/4"', heatNumber: 'H-2026-0175' },
  { id: 'inv-7', materialCode: 'AL-6061-PLT-0.50', description: 'Al 6061 Plate 1/2"', form: 'Plate', grade: '6061', division: 'METALS', location: 'DETROIT', qtyOnHand: 150, unit: 'LB', status: 'LOW', isRemnant: false, dims: '48" × 48"', heatNumber: 'H-2026-0180' },
  { id: 'inv-8', materialCode: 'HR-A500-TUBE-4X4', description: 'HR A500 Square Tube 4×4', form: 'Tube', grade: 'A500', division: 'METALS', location: 'JACKSON', qtyOnHand: 0, unit: 'FT', status: 'OUT', isRemnant: false, dims: '4" × 4" × 0.25" wall', heatNumber: null },
  { id: 'inv-9', materialCode: 'REM-A36-PLT-12X36', description: 'Remnant A36 Plate 12"×36"', form: 'Plate', grade: 'A36', division: 'METALS', location: 'JACKSON', qtyOnHand: 85, unit: 'LB', status: 'IN_STOCK', isRemnant: true, dims: '12" × 36" × 3/8"', heatNumber: 'H-2025-0988' },
  { id: 'inv-10', materialCode: 'REM-304-SHT-24X48', description: 'Remnant 304 Sheet 24"×48"', form: 'Sheet', grade: '304', division: 'METALS', location: 'KALAMAZOO', qtyOnHand: 42, unit: 'LB', status: 'IN_STOCK', isRemnant: true, dims: '24" × 48" × 16 Ga', heatNumber: 'H-2025-1012' },
]

const STATUS_CFG = {
  IN_STOCK: { label: 'In Stock', color: 'success', icon: InStockIcon },
  LOW:      { label: 'Low',      color: 'warning', icon: LowIcon },
  OUT:      { label: 'Out',      color: 'error',   icon: OutIcon },
}

const LOCATIONS = ['ALL', 'JACKSON', 'DETROIT', 'KALAMAZOO', 'GRAND_RAPIDS']
const FORMS    = ['ALL', 'Plate', 'Sheet', 'Bar', 'Beam', 'Angle', 'Tube', 'Flat Bar']

export default function MobileInventoryLookup() {
  const { isOnline } = useMobileMode()
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('ALL')
  const [formFilter, setFormFilter] = useState('ALL')
  const [remnantOnly, setRemnantOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  // ── Filter logic ─────────────────────────────────────────────────────
  const results = MOCK_INVENTORY.filter(item => {
    if (search && !item.description.toLowerCase().includes(search.toLowerCase()) && !item.materialCode.toLowerCase().includes(search.toLowerCase())) return false
    if (locationFilter !== 'ALL' && item.location !== locationFilter) return false
    if (formFilter !== 'ALL' && item.form !== formFilter) return false
    if (remnantOnly && !item.isRemnant) return false
    return true
  })

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 800)
  }

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
                  {LOCATIONS.map(l => <MenuItem key={l} value={l}>{l === 'ALL' ? 'All Locations' : l.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Form</InputLabel>
                <Select value={formFilter} onChange={e => setFormFilter(e.target.value)} label="Form" sx={{ minHeight: 44 }}>
                  {FORMS.map(f => <MenuItem key={f} value={f}>{f === 'ALL' ? 'All Forms' : f}</MenuItem>)}
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
                    label={item.location.replace(/_/g, ' ')}
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
                  <Chip label={sCfg.label} size="small" color={sCfg.color} sx={{ fontWeight: 600 }} />
                </Grid>
              </Grid>
            </Collapse>
          </Paper>
        )
      })}

      {results.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <StockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" color="text.secondary">No inventory matches your search.</Typography>
          <Typography variant="body2" color="text.secondary">Try adjusting filters or search terms.</Typography>
        </Box>
      )}
    </Box>
  )
}
