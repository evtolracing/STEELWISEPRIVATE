/**
 * AccountOrdersPage.jsx — All orders across branches for enterprise account.
 *
 * Advanced filters: branch, status, date range, search.
 * Line-level partial shipment visibility.
 * CSV export. Permission-gated.
 *
 * Route: /account/orders
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Container, Paper, Table, TableHead, TableBody, TableRow,
  TableCell, Chip, Button, TextField, MenuItem, Breadcrumbs, Link as MuiLink,
  CircularProgress, Alert, InputAdornment, IconButton, Grid, FormControl,
  InputLabel, Select, Tooltip, Collapse, Divider, LinearProgress, alpha,
} from '@mui/material'
import {
  Search, Refresh, FilterList, Download, ExpandMore, ExpandLess,
  LocalShipping, CheckCircle, Schedule, RateReview, Engineering,
  Business as BranchIcon, DateRange, Clear, OpenInNew,
} from '@mui/icons-material'
import { useNavigate, Link } from 'react-router-dom'
import { listAccountOrders, exportOrdersCSV } from '../../services/customerAccountApi'
import useEnterpriseAccount from '../../hooks/useEnterpriseAccount'

const STATUS_CFG = {
  NEEDS_REVIEW:  { color: 'warning',   icon: <RateReview fontSize="inherit" />,   label: 'Needs Review' },
  CONFIRMED:     { color: 'info',      icon: <CheckCircle fontSize="inherit" />,   label: 'Confirmed' },
  SCHEDULED:     { color: 'secondary', icon: <Schedule fontSize="inherit" />,      label: 'Scheduled' },
  IN_PROCESS:    { color: 'info',      icon: <Engineering fontSize="inherit" />,   label: 'In Process' },
  SHIPPED:       { color: 'success',   icon: <LocalShipping fontSize="inherit" />, label: 'Shipped' },
  COMPLETED:     { color: 'success',   icon: <CheckCircle fontSize="inherit" />,   label: 'Completed' },
}

const LINE_STATUS_COLOR = {
  DELIVERED: 'success', PARTIAL: 'warning', IN_PROCESS: 'info',
  SCHEDULED: 'secondary', CONFIRMED: 'default', PENDING: 'default', REVIEW: 'warning',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0)
}

export default function AccountOrdersPage() {
  const navigate = useNavigate()
  const {
    branches, selectedBranch, setSelectedBranch, canExport, branchFilter,
  } = useEnterpriseAccount()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [meta, setMeta] = useState({})

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listAccountOrders({
        ...branchFilter,
        status: statusFilter || undefined,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: 'date',
      })
      setOrders(res.data || [])
      setMeta(res.meta || {})
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [branchFilter, statusFilter, search, dateFrom, dateTo])

  useEffect(() => { loadOrders() }, [loadOrders])

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await exportOrdersCSV({ ...branchFilter, status: statusFilter, search })
      // Trigger download
      const blob = new Blob([result.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setSelectedBranch('')
  }

  const hasActiveFilters = search || statusFilter || dateFrom || dateTo || selectedBranch

  return (
    <Container maxWidth="lg">
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/account/dashboard" underline="hover" color="inherit">Account</MuiLink>
        <Typography color="text.primary">All Orders</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={700}>Orders</Typography>
        <Chip label={`${orders.length} total`} size="small" color="primary" />
        {meta.openCount > 0 && <Chip label={`${meta.openCount} open`} size="small" color="warning" variant="outlined" />}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search orders, PO…" value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ width: 200 }}
          />
          <Tooltip title="Advanced filters">
            <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
              <FilterList />
            </IconButton>
          </Tooltip>
          <IconButton onClick={loadOrders} size="small"><Refresh /></IconButton>
          {canExport && (
            <Button variant="outlined" size="small" startIcon={exporting ? <CircularProgress size={16} /> : <Download />}
              onClick={handleExport} disabled={exporting}>
              CSV
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters panel */}
      <Collapse in={showFilters}>
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} label="Branch">
                  <MenuItem value="">All Branches</MenuItem>
                  {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label="Status">
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.entries(STATUS_CFG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" type="date" label="From" value={dateFrom}
                onChange={e => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" type="date" label="To" value={dateTo}
                onChange={e => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={2}>
              {hasActiveFilters && (
                <Button size="small" startIcon={<Clear />} onClick={clearFilters}>Clear All</Button>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : orders.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>No orders match your filters</Typography>
          {hasActiveFilters && <Button onClick={clearFilters} startIcon={<Clear />}>Clear Filters</Button>}
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Order #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ETA</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Placed By</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tracking</TableCell>
                <TableCell width={40} />
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map(order => {
                const cfg = STATUS_CFG[order.status] || { color: 'default', icon: null, label: order.status }
                const expanded = expandedRow === order.id
                const hasPartial = order.lines?.some(l => l.status === 'PARTIAL')

                return (
                  <React.Fragment key={order.id}>
                    <TableRow hover sx={{ cursor: 'pointer', '& > td': { borderBottom: expanded ? 0 : undefined } }}
                      onClick={() => setExpandedRow(expanded ? null : order.id)}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="primary">{order.orderNumber}</Typography>
                        {order.poNumber && <Typography variant="caption" color="text.secondary" display="block">PO: {order.poNumber}</Typography>}
                        <Typography variant="caption" color="text.secondary">{fmtDate(order.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip icon={<BranchIcon sx={{ fontSize: 14 }} />} label={order.branchName?.split('—')[0]?.trim() || '—'} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Chip icon={cfg.icon} label={cfg.label} size="small" color={cfg.color} />
                        {hasPartial && <Chip label="Partial" size="small" color="warning" variant="outlined" sx={{ ml: 0.5, fontSize: 10 }} />}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{fmtDate(order.estimatedDelivery)}</Typography>
                        {order.actualShipDate && <Typography variant="caption" color="success.main">Shipped {fmtDate(order.actualShipDate)}</Typography>}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>{fmtCurrency(order.total)}</Typography>
                        <Typography variant="caption" color="text.secondary">{order.lineCount} items</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{order.placedBy || '—'}</Typography>
                        <Chip label={order.source} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                      </TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          <Tooltip title={order.trackingNumber}>
                            <Chip label="Track" size="small" color="info" variant="outlined" icon={<LocalShipping sx={{ fontSize: 14 }} />} />
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">{expanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
                      </TableCell>
                    </TableRow>

                    {/* Expanded line detail */}
                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 0 }}>
                          <Collapse in={expanded}>
                            <Box sx={{ py: 2, px: 1 }}>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Line Items</Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Ordered</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Shipped</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {order.lines?.map(line => (
                                    <TableRow key={line.lineNumber}>
                                      <TableCell>{line.lineNumber}</TableCell>
                                      <TableCell>{line.description}</TableCell>
                                      <TableCell align="right">{line.qty}</TableCell>
                                      <TableCell align="right">
                                        <Typography fontWeight={line.shipped < line.qty ? 600 : 400} color={line.shipped < line.qty ? 'warning.main' : 'text.primary'}>
                                          {line.shipped}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip label={line.status} size="small" color={LINE_STATUS_COLOR[line.status] || 'default'} variant="outlined" sx={{ fontSize: 10 }} />
                                        {line.status === 'PARTIAL' && (
                                          <LinearProgress variant="determinate" value={(line.shipped / line.qty) * 100}
                                            sx={{ mt: 0.5, height: 4, borderRadius: 2, width: 60 }} color="warning" />
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  )
}
