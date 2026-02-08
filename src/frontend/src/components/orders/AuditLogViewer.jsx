/**
 * AuditLogViewer.jsx — Read-only audit trail of CSR overrides.
 *
 * Used inside AuditLogPage (full view for managers) and optionally
 * embedded in OrderDetailPage (filtered to one order).
 */
import React, { useState, useEffect, useMemo } from 'react'
import {
  Box, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, TableSortLabel, Paper, Typography, Chip,
  TextField, MenuItem, Select, FormControl, InputLabel,
  IconButton, Tooltip, Collapse, Alert, CircularProgress,
  Button, InputAdornment, Grid,
} from '@mui/material'
import {
  Schedule       as ScheduleIcon,
  Memory         as CapacityIcon,
  TrendingDown   as PricingIcon,
  CheckCircle    as ActiveIcon,
  Cancel         as RevokedIcon,
  Warning        as ExpiredIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp   as CollapseIcon,
  Search         as SearchIcon,
  FilterList     as FilterIcon,
  Undo           as RevokeIcon,
} from '@mui/icons-material'
import {
  OVERRIDE_TYPE, OVERRIDE_STATUS, OVERRIDE_TYPE_LABELS,
  getOverrideAuditLog, revokeOverride,
} from '../../services/overrideApi'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_ICONS = {
  [OVERRIDE_TYPE.CUTOFF_VIOLATION]: <ScheduleIcon fontSize="small" sx={{ color: '#e65100' }} />,
  [OVERRIDE_TYPE.CAPACITY_WARNING]: <CapacityIcon fontSize="small" sx={{ color: '#f57f17' }} />,
  [OVERRIDE_TYPE.PRICING_OVERRIDE]: <PricingIcon fontSize="small" sx={{ color: '#1565c0' }} />,
}

const STATUS_CHIPS = {
  [OVERRIDE_STATUS.ACTIVE]:  { color: 'success', icon: <ActiveIcon fontSize="inherit" />, label: 'Active' },
  [OVERRIDE_STATUS.REVOKED]: { color: 'error',   icon: <RevokedIcon fontSize="inherit" />, label: 'Revoked' },
  [OVERRIDE_STATUS.EXPIRED]: { color: 'default',  icon: <ExpiredIcon fontSize="inherit" />, label: 'Expired' },
}

const TYPE_CHIP_COLORS = {
  [OVERRIDE_TYPE.CUTOFF_VIOLATION]: { bgcolor: '#fff3e0', color: '#e65100' },
  [OVERRIDE_TYPE.CAPACITY_WARNING]: { bgcolor: '#fffde7', color: '#f57f17' },
  [OVERRIDE_TYPE.PRICING_OVERRIDE]: { bgcolor: '#e3f2fd', color: '#1565c0' },
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * @param {{
 *   orderId?: string,          // filter to single order
 *   canRevoke?: boolean,       // show revoke button (manager only)
 *   maxHeight?: number|string, // scrollable container height
 * }} props
 */
export default function AuditLogViewer({ orderId, canRevoke = false, maxHeight = 520 }) {
  const [entries, setEntries] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Expanded row
  const [expandedId, setExpandedId] = useState(null)

  // Revoke
  const [revoking, setRevoking] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const filters = {}
      if (orderId) filters.orderId = orderId
      if (typeFilter) filters.type = typeFilter
      if (statusFilter) filters.status = statusFilter
      const { data, meta: m } = await getOverrideAuditLog(filters)
      setEntries(data)
      setMeta(m)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [orderId, typeFilter, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side search on loaded entries
  const filtered = useMemo(() => {
    if (!searchTerm) return entries
    const q = searchTerm.toLowerCase()
    return entries.filter(o =>
      (o.userName || '').toLowerCase().includes(q) ||
      (o.reasonLabel || '').toLowerCase().includes(q) ||
      (o.notes || '').toLowerCase().includes(q) ||
      (o.orderNumber || o.orderId || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q)
    )
  }, [entries, searchTerm])

  const handleRevoke = async (id) => {
    const reason = prompt('Revoke reason:')
    if (!reason) return
    setRevoking(id)
    try {
      await revokeOverride(id, reason)
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setRevoking(null)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Filters bar */}
      <Grid container spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search user, reason, notes, order…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <FormControl size="small" fullWidth>
            <InputLabel>Override Type</InputLabel>
            <Select value={typeFilter} label="Override Type" onChange={e => setTypeFilter(e.target.value)}>
              <MenuItem value="">All Types</MenuItem>
              {Object.entries(OVERRIDE_TYPE_LABELS).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={3}>
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
              <MenuItem value="">All Statuses</MenuItem>
              {Object.values(OVERRIDE_STATUS).map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
          {meta && (
            <Typography variant="caption" color="text.secondary">
              {meta.total} record{meta.total !== 1 ? 's' : ''}
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Loading */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>No override records found.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }} />
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                {canRevoke && <TableCell sx={{ fontWeight: 700, width: 80 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(row => (
                <React.Fragment key={row.id}>
                  {/* Main row */}
                  <TableRow
                    hover
                    sx={{ cursor: 'pointer', '& > *': { borderBottom: expandedId === row.id ? 'none' : undefined } }}
                    onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {expandedId === row.id ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={TYPE_ICONS[row.type]}
                        label={OVERRIDE_TYPE_LABELS[row.type]?.split(' ')[0]}
                        size="small"
                        sx={{ ...TYPE_CHIP_COLORS[row.type], fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const sc = STATUS_CHIPS[row.status] || STATUS_CHIPS[OVERRIDE_STATUS.ACTIVE]
                        return <Chip icon={sc.icon} label={sc.label} size="small" color={sc.color} variant="outlined" />
                      })()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{row.orderNumber || row.orderId}</Typography>
                      {row.customerName && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {row.customerName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.userName}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.userRole}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {row.reasonLabel}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(row.timestamp).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {new Date(row.timestamp).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    {canRevoke && (
                      <TableCell onClick={e => e.stopPropagation()}>
                        {row.status === OVERRIDE_STATUS.ACTIVE && (
                          <Tooltip title="Revoke this override">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRevoke(row.id)}
                              disabled={revoking === row.id}
                            >
                              {revoking === row.id ? <CircularProgress size={16} /> : <RevokeIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Expandable detail row */}
                  <TableRow>
                    <TableCell colSpan={canRevoke ? 8 : 7} sx={{ py: 0, px: 0 }}>
                      <Collapse in={expandedId === row.id} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Notes
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.3, whiteSpace: 'pre-wrap' }}>
                                {row.notes || '—'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Original Value
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.3 }}>
                                {row.originalValue || '—'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Override Value
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.3 }}>
                                {row.overrideValue || '—'}
                              </Typography>
                            </Grid>
                            {row.location && (
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  Location
                                </Typography>
                                <Typography variant="body2">{row.location}</Typography>
                              </Grid>
                            )}
                            {row.division && (
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  Division
                                </Typography>
                                <Typography variant="body2">{row.division}</Typography>
                              </Grid>
                            )}
                            {row.status === OVERRIDE_STATUS.REVOKED && (
                              <Grid item xs={12}>
                                <Alert severity="error" variant="outlined" sx={{ mt: 1 }}>
                                  <Typography variant="body2">
                                    <strong>Revoked by:</strong> {row.revokedBy} at {new Date(row.revokedAt).toLocaleString()}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Reason:</strong> {row.revokeReason}
                                  </Typography>
                                </Alert>
                              </Grid>
                            )}
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">
                                Override ID: {row.id} · User: {row.user} · Created: {new Date(row.timestamp).toLocaleString()}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
