/**
 * MyOrdersPage — List of customer's orders with status, search/filter.
 *
 * Route: /shop/orders
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Container, Paper, Table, TableHead, TableBody, TableRow,
  TableCell, Chip, Button, TextField, MenuItem, Breadcrumbs, Link as MuiLink,
  CircularProgress, Alert, InputAdornment, IconButton,
} from '@mui/material'
import {
  Search, ArrowBack, Visibility, Refresh, FilterList,
  LocalShipping, CheckCircle, Schedule, RateReview, Engineering,
} from '@mui/icons-material'
import { useNavigate, Link } from 'react-router-dom'

import { listMyOrders } from '../../services/customerOrdersApi'
import { useCustomerSession } from '../../contexts/CustomerSessionContext'

const STATUS_CFG = {
  DRAFT:         { color: 'default', icon: <Schedule fontSize="inherit" /> },
  NEEDS_REVIEW:  { color: 'warning', icon: <RateReview fontSize="inherit" /> },
  CONFIRMED:     { color: 'info',    icon: <CheckCircle fontSize="inherit" /> },
  SCHEDULED:     { color: 'secondary', icon: <Schedule fontSize="inherit" /> },
  IN_PROCESS:    { color: 'info',    icon: <Engineering fontSize="inherit" /> },
  READY_TO_SHIP: { color: 'warning', icon: <LocalShipping fontSize="inherit" /> },
  SHIPPED:       { color: 'success', icon: <LocalShipping fontSize="inherit" /> },
  COMPLETED:     { color: 'success', icon: <CheckCircle fontSize="inherit" /> },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MyOrdersPage() {
  const navigate = useNavigate()
  const { session } = useCustomerSession()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listMyOrders({
        customerId: session.customerId,
        status: statusFilter || undefined,
        search: search || undefined,
      })
      setOrders(res.data || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [session?.customerId, statusFilter, search])

  useEffect(() => { loadOrders() }, [loadOrders])

  return (
    <Container maxWidth="lg">
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/shop" underline="hover" color="inherit">Shop</MuiLink>
        <Typography color="text.primary">My Orders</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={700}>My Orders</Typography>
        <Chip label={`${orders.length} order(s)`} size="small" color="primary" />
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <TextField size="small" placeholder="Search orders…" value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
            sx={{ width: 220 }}
          />
          <TextField size="small" select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            sx={{ width: 160 }} displayEmpty>
            <MenuItem value="">All Statuses</MenuItem>
            {Object.keys(STATUS_CFG).map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
          </TextField>
          <IconButton onClick={loadOrders} size="small"><Refresh /></IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : orders.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>No orders found</Typography>
          <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate('/shop')}>
            Start Shopping
          </Button>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Order #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Items</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                <TableCell width={80} />
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map(order => {
                const cfg = STATUS_CFG[order.status] || STATUS_CFG.DRAFT
                return (
                  <TableRow key={order.id} hover sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/shop/orders/${order.id}`)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {order.orderNumber}
                      </Typography>
                      {order.poNumber && <Typography variant="caption" color="text.secondary">PO: {order.poNumber}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{fmtDate(order.createdAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip icon={cfg.icon} label={order.status.replace(/_/g, ' ')} size="small" color={cfg.color} />
                      {order.quoteRequested && <Chip label="Quote" size="small" variant="outlined" sx={{ ml: 0.5, height: 20, fontSize: '0.65rem' }} />}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{order.lines?.length || 0}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>${order.total?.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={order.source || 'ONLINE'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary"><Visibility fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Button startIcon={<ArrowBack />} onClick={() => navigate('/shop')} sx={{ mt: 2 }}>
        Back to Shop
      </Button>
    </Container>
  )
}
