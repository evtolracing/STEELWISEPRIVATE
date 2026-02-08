/**
 * AccountShipmentsPage.jsx — Shipment tracking across all branches.
 *
 * Shows carrier, tracking, ETA, delivery, weight/pieces.
 * Filters: branch, status, search.
 *
 * Route: /account/shipments
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Container, Paper, Breadcrumbs, Link as MuiLink,
  CircularProgress, Grid, Card, CardContent, Chip, TextField,
  MenuItem, FormControl, InputLabel, Select, InputAdornment,
  IconButton, Tooltip, Divider, Stepper, Step, StepLabel, StepConnector, alpha,
} from '@mui/material'
import {
  Search, Refresh, LocalShipping, CheckCircle, Schedule, Inventory,
  Business as BranchIcon, Scale, ContentCopy,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { listAccountShipments } from '../../services/customerAccountApi'
import useEnterpriseAccount from '../../hooks/useEnterpriseAccount'

const STATUS_CFG = {
  DELIVERED:  { color: 'success', icon: <CheckCircle />,    label: 'Delivered' },
  IN_TRANSIT: { color: 'info',    icon: <LocalShipping />,  label: 'In Transit' },
  PENDING:    { color: 'warning', icon: <Schedule />,       label: 'Pending Pickup' },
}

const STEP_LABELS = ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered']

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function stepIndex(status) {
  if (status === 'DELIVERED') return 4
  if (status === 'IN_TRANSIT') return 2
  return 0
}

function copyTracking(trackNum) {
  navigator.clipboard.writeText(trackNum).catch(() => {})
}

export default function AccountShipmentsPage() {
  const { branches, selectedBranch, setSelectedBranch, branchFilter } = useEnterpriseAccount()

  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listAccountShipments({ ...branchFilter, status: statusFilter || undefined, search: search || undefined })
      setShipments(res.data || [])
    } catch { setShipments([]) }
    finally { setLoading(false) }
  }, [branchFilter, statusFilter, search])

  useEffect(() => { load() }, [load])

  const summary = {
    total: shipments.length,
    delivered: shipments.filter(s => s.status === 'DELIVERED').length,
    inTransit: shipments.filter(s => s.status === 'IN_TRANSIT').length,
    pending: shipments.filter(s => s.status === 'PENDING').length,
  }

  return (
    <Container maxWidth="lg">
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/account/dashboard" underline="hover" color="inherit">Account</MuiLink>
        <Typography color="text.primary">Shipments</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={700}>Shipment Tracking</Typography>
        <Chip label={`${summary.total} shipments`} size="small" color="primary" />
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search tracking #, order…" value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ width: 200 }} />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="">All</MenuItem>
              {Object.entries(STATUS_CFG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Branch</InputLabel>
            <Select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} label="Branch">
              <MenuItem value="">All Branches</MenuItem>
              {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton onClick={load} size="small"><Refresh /></IconButton>
        </Box>
      </Box>

      {/* Summary row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'In Transit', value: summary.inTransit, color: 'info' },
          { label: 'Pending',    value: summary.pending,   color: 'warning' },
          { label: 'Delivered',  value: summary.delivered,  color: 'success' },
        ].map(s => (
          <Grid item xs={4} key={s.label}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700} color={`${s.color}.main`}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : shipments.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">No shipments found</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {shipments.map(s => {
            const cfg = STATUS_CFG[s.status] || STATUS_CFG.PENDING
            return (
              <Grid item xs={12} key={s.id}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    {/* Top row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                      <Chip icon={cfg.icon} label={cfg.label} color={cfg.color} size="small" />
                      <Typography variant="subtitle1" fontWeight={700} color="primary">{s.shipmentNumber}</Typography>
                      <Typography variant="body2" color="text.secondary">• Order {s.orderNumber}</Typography>
                      <Chip icon={<BranchIcon sx={{ fontSize: 14 }} />} label={s.branchName} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                      <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={600}>{s.carrier}</Typography>
                        <Chip label={s.trackingNumber} size="small" variant="outlined"
                          onClick={() => copyTracking(s.trackingNumber)}
                          onDelete={() => copyTracking(s.trackingNumber)}
                          deleteIcon={<ContentCopy sx={{ fontSize: 14 }} />}
                          sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                      </Box>
                    </Box>

                    {/* Progress stepper */}
                    <Stepper activeStep={stepIndex(s.status)} alternativeLabel sx={{ my: 2 }}
                      connector={<StepConnector sx={{ '& .MuiStepConnector-line': { borderColor: s.status === 'DELIVERED' ? 'success.main' : 'divider' } }} />}>
                      {STEP_LABELS.map(label => (
                        <Step key={label}><StepLabel>{label}</StepLabel></Step>
                      ))}
                    </Stepper>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Detail row */}
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Shipped</Typography>
                        <Typography variant="body2" fontWeight={600}>{fmtDate(s.shipDate)}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">ETA</Typography>
                        <Typography variant="body2" fontWeight={600}>{fmtDate(s.estimatedDelivery)}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Delivered</Typography>
                        <Typography variant="body2" fontWeight={600}>{fmtDate(s.actualDelivery)}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Weight</Typography>
                            <Typography variant="body2" fontWeight={600}>{(s.totalWeight || 0).toLocaleString()} lbs</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Pieces</Typography>
                            <Typography variant="body2" fontWeight={600}>{s.totalPieces}</Typography>
                          </Box>
                          {s.pallets > 0 && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">Pallets</Typography>
                              <Typography variant="body2" fontWeight={600}>{s.pallets}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Items */}
                    {s.items?.length > 0 && (
                      <Box sx={{ mt: 1.5, p: 1, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.06), borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom>Items in shipment:</Typography>
                        {s.items.map((item, i) => (
                          <Typography key={i} variant="body2" sx={{ ml: 1 }}>
                            {item.description} — {item.qty} pcs ({(item.weight || 0).toLocaleString()} lbs)
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Container>
  )
}
