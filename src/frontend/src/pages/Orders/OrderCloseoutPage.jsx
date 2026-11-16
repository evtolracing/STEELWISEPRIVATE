/**
 * Orders that are not closed, oldest first, with what each is waiting for. Read from
 * /api/orders/closeout, which counts every figure from the order's own records and keeps
 * the list to the reader's branches.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, TablePagination, Chip, Stack, TextField, Alert, Link, LinearProgress } from '@mui/material'
import client from '../../api/client'

const usd = (v) => Number(v || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
const day = (v) => (v ? new Date(v).toLocaleDateString() : '')
const REASONS = [
  [null, 'Anything open'], ['TO_SHIP', 'Still to ship'], ['ON_DOCK', 'On the dock'], ['ON_ROAD', 'On the road'], ['SHIPMENT_PROBLEM', 'Shipment problem'],
  ['NOT_INVOICED', 'Shipped, not invoiced'], ['UNPAID', 'Unpaid'], ['CREDIT_OWED', 'Credit owed back'], ['RETURN_OPEN', 'Return open'], ['JOB_OPEN', 'Job open'], ['STOCK_RESERVED', 'Stock still reserved'], ['ON_HOLD', 'On hold'],
]
const waitingFor = (o) => [
  o.status === 'HOLD' && 'on hold', o.toShip > 0 && `${o.toShip} to ship`, o.onDock > 0 && `${o.onDock} on the dock`, o.onRoad > 0 && `${o.onRoad} on the road`,
  o.problems > 0 && `${o.problems} shipment problem${o.problems === 1 ? '' : 's'}`, o.notInvoiced > 0 && `${o.notInvoiced} shipped and not invoiced`, o.balance > 0.005 && `${usd(o.balance)} unpaid`,
  o.owedBack > 0.005 && `${usd(o.owedBack)} credit owed back`, o.returnsOpen > 0 && 'return open', o.jobsOpen > 0 && `${o.jobsOpen} job${o.jobsOpen === 1 ? '' : 's'} open`, o.reserved > 0 && `${o.reserved} reserved`,
].filter(Boolean)

export default function OrderCloseoutPage() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [reason, setReason] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const size = 50
  const load = useCallback(() => {
    setLoading(true)
    client.get('/orders/closeout', { params: { limit: size, offset: page * size, reason: reason || undefined, search: search.trim() || undefined } })
      .then((r) => { setRows(r.data?.data || []); setTotal(r.data?.meta?.total || 0); setError('') })
      .catch((e) => setError(e.response?.data?.error || 'The list could not be loaded.'))
      .finally(() => setLoading(false))
  }, [page, reason, search])
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t) }, [load])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700}>Orders not closed</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        An order is closed when everything on it has shipped, been delivered, invoiced and paid, with no return, credit, job or reserved stock left open. Oldest first.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }} alignItems="center">
        {REASONS.map(([value, label]) => <Chip key={label} label={label} color={reason === value ? 'primary' : 'default'} onClick={() => { setReason(value); setPage(0) }} />)}
        <TextField size="small" label="Order number" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} sx={{ minWidth: 200 }} />
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table size="small" aria-label="Orders not closed">
            <TableHead><TableRow><TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Branch</TableCell><TableCell>Entered</TableCell><TableCell align="right">Order total</TableCell><TableCell>Waiting for</TableCell></TableRow></TableHead>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell><Link component={RouterLink} to={`/orders/${o.id}`}>{o.orderNumber}</Link></TableCell>
                  <TableCell>{o.customerName || ''}</TableCell>
                  <TableCell>{o.branchCode || ''}</TableCell>
                  <TableCell>{day(o.createdAt)}</TableCell>
                  <TableCell align="right">{usd(o.totalAmount)}</TableCell>
                  <TableCell>{waitingFor(o).join(', ')}</TableCell>
                </TableRow>
              ))}
              {!rows.length && !loading && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No open orders here.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={size} rowsPerPageOptions={[size]} onPageChange={(_, p) => setPage(p)} />
      </Paper>
    </Box>
  )
}
