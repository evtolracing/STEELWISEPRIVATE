/**
 * OnlineInboxPage — Queue / triage view of incoming online orders.
 *
 * Route: /orders/online-inbox
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Typography, Button, Chip, IconButton, Tooltip, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, TextField, FormControl,
  InputLabel, Select, MenuItem, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, Badge, Breadcrumbs,
  Link as MuiLink, CircularProgress, Divider,
} from '@mui/material'
import {
  Inbox as InboxIcon, Search as SearchIcon, CheckCircle as AcceptIcon,
  Pause as HoldIcon, Cancel as RejectIcon, Refresh as RefreshIcon,
  Visibility as ViewIcon, OpenInNew as OpenIcon, FilterList as FilterIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

import OrderSourceChip from '../../components/orders/OrderSourceChip'
import {
  listOnlineOrders, acceptOnlineOrder, holdOnlineOrder, rejectOnlineOrder,
} from '../../services/intakeOnlineOrdersApi'

const STATUS_COLOR = {
  NEEDS_REVIEW: 'warning', HOLD: 'info', ACCEPTED: 'success', REJECTED: 'error',
}

const fmt = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function OnlineInboxPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  // ── Action dialog ──
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, order: null })
  const [actionReason, setActionReason] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  // ── Load ──
  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const filter = statusFilter === 'ALL' ? {} : { status: statusFilter }
      const res = await listOnlineOrders(filter)
      setOrders(res.data || [])
    } catch { setOrders([]) }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { loadOrders() }, [loadOrders])

  // ── Filtered list ──
  const filtered = orders.filter(o => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (o.orderNumber || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerEmail || '').toLowerCase().includes(q)
    )
  })

  // ── Actions ──
  const openAction = (type, order) => {
    setActionDialog({ open: true, type, order })
    setActionReason('')
  }
  const closeAction = () => setActionDialog({ open: false, type: null, order: null })

  const executeAction = async () => {
    const { type, order } = actionDialog
    setActionBusy(true)
    try {
      if (type === 'accept') await acceptOnlineOrder(order.id)
      else if (type === 'hold') await holdOnlineOrder(order.id, actionReason)
      else if (type === 'reject') await rejectOnlineOrder(order.id, actionReason)
      setSnack({ open: true, msg: `Order ${type}ed`, severity: 'success' })
      closeAction()
      loadOrders()
    } catch {
      setSnack({ open: true, msg: `Action failed`, severity: 'error' })
    }
    setActionBusy(false)
  }

  // ── Counts ──
  const needsReviewCount = orders.filter(o => o.status === 'NEEDS_REVIEW').length
  const holdCount = orders.filter(o => o.status === 'HOLD').length

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink underline="hover" color="inherit" href="/" onClick={e => { e.preventDefault(); navigate('/') }}>Home</MuiLink>
        <Typography color="text.primary">Online Order Inbox</Typography>
      </Breadcrumbs>

      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <InboxIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Online Order Inbox</Typography>
        <Badge badgeContent={needsReviewCount} color="warning"><Chip label="Needs Review" size="small" variant="outlined" /></Badge>
        <Badge badgeContent={holdCount} color="info"><Chip label="On Hold" size="small" variant="outlined" /></Badge>
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<RefreshIcon />} onClick={loadOrders}>Refresh</Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 2 }}>
        <TextField
          size="small" placeholder="Search by order #, customer…"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="NEEDS_REVIEW">Needs Review</MenuItem>
            <MenuItem value="HOLD">On Hold</MenuItem>
            <MenuItem value="ACCEPTED">Accepted</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <InboxIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No online orders found.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(order => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">{order.orderNumber}</Typography>
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell><Typography variant="caption">{order.customerEmail}</Typography></TableCell>
                    <TableCell><Chip label={order.lineCount ?? order.lines?.length ?? '—'} size="small" /></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={500}>{fmt(order.total)}</Typography></TableCell>
                    <TableCell>
                      <Chip label={order.status?.replace(/_/g, ' ')} size="small" color={STATUS_COLOR[order.status] || 'default'} />
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</Typography></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {order.status === 'NEEDS_REVIEW' && (
                          <>
                            <Tooltip title="Accept"><IconButton size="small" color="success" onClick={() => openAction('accept', order)}><AcceptIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Hold"><IconButton size="small" color="info" onClick={() => openAction('hold', order)}><HoldIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => openAction('reject', order)}><RejectIcon fontSize="small" /></IconButton></Tooltip>
                          </>
                        )}
                        {order.status === 'HOLD' && (
                          <>
                            <Tooltip title="Accept"><IconButton size="small" color="success" onClick={() => openAction('accept', order)}><AcceptIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => openAction('reject', order)}><RejectIcon fontSize="small" /></IconButton></Tooltip>
                          </>
                        )}
                        <Tooltip title="View Details"><IconButton size="small" onClick={() => navigate(`/orders/${order.id}`)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Action Dialog ── */}
      <Dialog open={actionDialog.open} onClose={closeAction} maxWidth="xs" fullWidth>
        <DialogTitle>
          {actionDialog.type === 'accept' && 'Accept Order'}
          {actionDialog.type === 'hold' && 'Hold Order'}
          {actionDialog.type === 'reject' && 'Reject Order'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.order && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2"><strong>Order:</strong> {actionDialog.order.orderNumber}</Typography>
              <Typography variant="body2"><strong>Customer:</strong> {actionDialog.order.customerName}</Typography>
            </Box>
          )}
          {actionDialog.type === 'accept' && (
            <Alert severity="success" variant="outlined">This will create an internal order and notify the customer.</Alert>
          )}
          {(actionDialog.type === 'hold' || actionDialog.type === 'reject') && (
            <TextField
              fullWidth multiline rows={3} label="Reason"
              value={actionReason} onChange={e => setActionReason(e.target.value)}
              placeholder={actionDialog.type === 'hold' ? 'Why is this on hold?' : 'Reason for rejection'}
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAction}>Cancel</Button>
          <Button
            variant="contained"
            color={actionDialog.type === 'accept' ? 'success' : actionDialog.type === 'hold' ? 'info' : 'error'}
            onClick={executeAction} disabled={actionBusy || ((actionDialog.type === 'hold' || actionDialog.type === 'reject') && !actionReason.trim())}
          >
            {actionBusy ? <CircularProgress size={20} /> : `Confirm ${actionDialog.type}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
