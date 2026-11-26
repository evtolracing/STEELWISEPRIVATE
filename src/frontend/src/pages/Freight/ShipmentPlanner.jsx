/**
 * Shipment Planner: confirmed orders with finished work and nothing on the dock yet, soonest promise first.
 * "Plan shipment" opens the Shipping screen with the order found. (Before 2026-11-22 this screen showed
 * made-up orders and a list of branches that did not exist.)
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Chip, CircularProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { Refresh as RefreshIcon, LocalShipping as ShipIcon } from '@mui/icons-material'
import client from '../../api/client'
import { daysToPromise } from './freightView'

const day = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set')

export default function ShipmentPlanner() {
  const navigate = useNavigate()
  const [state, setState] = useState({ orders: [], loading: true, error: null })
  const [branch, setBranch] = useState('ALL')
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await client.get('/shipments/ready-orders')
      setState({ orders: Array.isArray(res.data) ? res.data : [], loading: false, error: null })
    } catch (e) {
      setState({ orders: [], loading: false, error: e.response?.data?.error || 'The orders could not be loaded.' })
    }
  }, [])
  useEffect(() => { load() }, [load])

  const { orders, loading, error } = state
  // The branch filter offers the branches these orders were sold at, nothing else.
  const branches = useMemo(() => [...new Map(orders.filter((o) => o.location).map((o) => [o.location.id, o.location])).values()].sort((a, b) => a.name.localeCompare(b.name)), [orders])
  const shown = branch === 'ALL' ? orders : orders.filter((o) => (branch === 'NONE' ? !o.location : o.location?.id === branch))
  const now = new Date()

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
        <Box>
          <Typography component="h1" variant="h5" fontWeight={700}>Shipment Planner</Typography>
          <Typography variant="body2" color="text.secondary">Confirmed orders with work ready to ship and no shipment on the dock yet. A job is marked shipped when its shipment is dispatched on the Shipping screen.</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField select size="small" label="Selling branch" value={branch} onChange={(e) => setBranch(e.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="ALL">All branches</MenuItem>
            {branches.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            {orders.some((o) => !o.location) && <MenuItem value="NONE">No branch on file</MenuItem>}
          </TextField>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>Refresh</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} data-testid="freight-planner-error">{error}</Alert>}
      {loading && orders.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading orders" /></Box>
      ) : !error && shown.length === 0 ? (
        <Alert severity="info" data-testid="freight-planner-none">No order is waiting for a shipment.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" data-testid="freight-planner-table">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Deliver to</TableCell><TableCell>Selling branch</TableCell>
                <TableCell>Promised</TableCell><TableCell>Work</TableCell><TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((o) => {
                const days = daysToPromise(o, now)
                const to = [o.shipToCity || o.buyer?.city, o.shipToState || o.buyer?.state].filter(Boolean).join(', ')
                return (
                  <TableRow key={o.id} hover data-testid="freight-planner-row">
                    <TableCell><Typography variant="body2" fontWeight={700}>{o.orderNumber}</Typography></TableCell>
                    <TableCell>{o.buyer?.name || 'No customer on file'}</TableCell>
                    <TableCell>{to || 'Not on file'}</TableCell>
                    <TableCell>{o.location ? `${o.location.code} ${o.location.name}` : 'None on file'}</TableCell>
                    <TableCell>
                      {day(o.promisedDate)}{' '}
                      {days !== null && days < 0 && <Chip size="small" color="error" label={`${-days} ${days === -1 ? 'day' : 'days'} late`} />}
                      {days !== null && days >= 0 && days <= 1 && <Chip size="small" color="warning" label={days === 0 ? 'Today' : 'Tomorrow'} />}
                    </TableCell>
                    <TableCell>
                      {o.jobsReady} ready{o.jobsStillOpen > 0 ? `, ${o.jobsStillOpen} still in work` : ''}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="contained" startIcon={<ShipIcon />} onClick={() => navigate(`/shipping?order=${encodeURIComponent(o.orderNumber)}`)}>Plan shipment</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
