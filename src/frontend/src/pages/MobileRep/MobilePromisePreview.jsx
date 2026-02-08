/**
 * MobilePromisePreview.jsx — Mobile-friendly delivery promise evaluator.
 *
 * Pick a branch + division, see cutoff status, next ship dates,
 * capacity notes, and suggested alternatives — all in a card layout
 * with large tap targets.
 */
import { useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material'
import {
  LocalShipping as ShipIcon,
  AccessTime as CutoffIcon,
  CalendarMonth as DateIcon,
  CheckCircle as GreenIcon,
  Warning as YellowIcon,
  Cancel as RedIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  TipsAndUpdates as TipIcon,
} from '@mui/icons-material'
import { evaluatePromise } from '../../services/promiseApi'
import useMobileMode from '../../hooks/useMobileMode'

const LOCATIONS = [
  { id: 'loc-1', label: 'Jackson', key: 'JACKSON' },
  { id: 'loc-2', label: 'Detroit', key: 'DETROIT' },
  { id: 'loc-3', label: 'Kalamazoo', key: 'KALAMAZOO' },
  { id: 'loc-4', label: 'Grand Rapids', key: 'GRAND_RAPIDS' },
]
const DIVISIONS = ['METALS', 'PLASTICS', 'SUPPLIES']

const STATUS_MAP = {
  GREEN:  { label: 'On Track',   color: 'success', Icon: GreenIcon,  bgcolor: '#e8f5e9' },
  YELLOW: { label: 'At Risk',    color: 'warning', Icon: YellowIcon, bgcolor: '#fff8e1' },
  RED:    { label: 'Missed',     color: 'error',   Icon: RedIcon,    bgcolor: '#ffebee' },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function MobilePromisePreview() {
  const { isOnline } = useMobileMode()

  const [locationId, setLocationId] = useState('loc-1')
  const [division, setDivision] = useState('METALS')
  const [requestedDate, setRequestedDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleEvaluate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await evaluatePromise({
        locationId,
        division,
        requestedShipDate: requestedDate || undefined,
      })
      setResult(res.data)
    } catch (e) {
      setError(e.message || 'Evaluation failed')
    } finally {
      setLoading(false)
    }
  }, [locationId, division, requestedDate])

  const st = result ? (STATUS_MAP[result.status] || STATUS_MAP.YELLOW) : null

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        <ShipIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} /> Promise Preview
      </Typography>

      {/* ── Inputs ──────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select value={locationId} onChange={e => setLocationId(e.target.value)} label="Branch" sx={{ minHeight: 52 }}>
                {LOCATIONS.map(l => <MenuItem key={l.id} value={l.id}>{l.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Division</InputLabel>
              <Select value={division} onChange={e => setDivision(e.target.value)} label="Division" sx={{ minHeight: 52 }}>
                {DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="date"
              label="Requested Ship Date"
              value={requestedDate}
              onChange={e => setRequestedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { minHeight: 52 } }}
              helperText="Leave blank for earliest available"
            />
          </Grid>
        </Grid>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleEvaluate}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CutoffIcon />}
          sx={{ mt: 2, minHeight: 52, fontWeight: 700, borderRadius: 3 }}
        >
          {loading ? 'Checking...' : 'Check Promise'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
      )}

      {!isOnline && !result && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Offline — promise evaluation uses cached cutoff rules and may not reflect real-time capacity.
        </Alert>
      )}

      {/* ── Result card ─────────────────────────────────────── */}
      {result && st && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '2px solid',
            borderColor: `${st.color}.main`,
            bgcolor: st.bgcolor,
            mb: 2,
          }}
        >
          {/* Status header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <st.Icon sx={{ fontSize: 36 }} color={st.color} />
            <Box>
              <Typography variant="h6" fontWeight={700}>{st.label}</Typography>
              <Typography variant="body2" color="text.secondary">{result.message}</Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Key dates */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Cutoff Time</Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {result.cutoffLocal || '—'}
              </Typography>
              {result.cutoffMet !== null && (
                <Chip
                  label={result.cutoffMet ? 'Met' : 'Missed'}
                  size="small"
                  color={result.cutoffMet ? 'success' : 'error'}
                  sx={{ mt: 0.5, fontWeight: 600 }}
                />
              )}
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Earliest Ship Date</Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {formatDate(result.earliestShipDate)}
              </Typography>
            </Grid>
          </Grid>

          {/* Suggested dates */}
          {result.suggestedDates?.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                <DateIcon sx={{ fontSize: 18, verticalAlign: 'bottom', mr: 0.5 }} />
                Available Ship Dates
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {result.suggestedDates.map((d, i) => (
                  <Chip
                    key={d}
                    label={formatDate(d)}
                    color={i === 0 ? 'primary' : 'default'}
                    variant={i === 0 ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 600, py: 2.5, fontSize: 13, borderRadius: 2 }}
                  />
                ))}
              </Box>
            </>
          )}

          {/* Reasons */}
          {result.reasons?.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                <InfoIcon sx={{ fontSize: 18, verticalAlign: 'bottom', mr: 0.5 }} />
                Details
              </Typography>
              <List dense disablePadding>
                {result.reasons.map((r, i) => (
                  <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <TipIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={r.replace(/_/g, ' ')}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {/* Capacity notes */}
          {result.capacityNote && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              {result.capacityNote}
            </Alert>
          )}
        </Paper>
      )}

      {/* ── Tips ────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          <TipIcon sx={{ fontSize: 18, verticalAlign: 'bottom', mr: 0.5, color: 'warning.main' }} />
          Quick Tips
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          • Orders placed before cutoff ship next business day
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          • Rush / Hot priority may have tighter cutoff windows
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          • Kalamazoo typically has the earliest cutoff (1:00 PM ET)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Check branch load in Demand Shaping for best availability
        </Typography>
      </Paper>
    </Box>
  )
}
