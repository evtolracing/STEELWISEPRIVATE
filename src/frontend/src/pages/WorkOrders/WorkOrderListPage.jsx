/**
 * Coil work orders, read from /api/work-orders. Search and the filters are
 * applied by the server, and the count shown is the server's count.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Paper, Button, TextField, MenuItem, Alert, LinearProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material'
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import client from '../../api/client'
import { WO_TYPE_LABELS, WO_STATUS_LABELS, WO_PRIORITY_LABELS, WorkOrderStatusChip } from './WorkOrderDetailPage'

const LIMIT = 100

export default function WorkOrderListPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typed, setTyped] = useState('')
  const [status, setStatus] = useState('')
  const [woType, setWoType] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearch(typed.trim()), 300)
    return () => clearTimeout(t)
  }, [typed])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await client.get('/work-orders', { params: { limit: LIMIT, ...(search && { search }), ...(status && { status }), ...(woType && { woType }) } })
      setRows(Array.isArray(res.data) ? res.data : [])
      setTotal(Number(res.headers?.['x-total-count']) || (Array.isArray(res.data) ? res.data.length : 0))
    } catch (e) {
      setRows([]); setTotal(0)
      setError(e.response?.data?.error || 'Work orders could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [search, status, woType])
  useEffect(() => { load() }, [load])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700}>Work Orders</Typography>
          <Typography variant="body2" color="text.secondary">Slitting, cut-to-length and other processing planned against a stock item</Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/work-orders/new')}>New work order</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField size="small" label="Search" placeholder="Work order or item number" value={typed} onChange={(e) => setTyped(e.target.value)} sx={{ minWidth: 260 }} />
        <TextField size="small" select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          {Object.entries(WO_STATUS_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        <TextField size="small" select label="Type" value={woType} onChange={(e) => setWoType(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          {Object.entries(WO_TYPE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table size="small" aria-label="Work orders">
            <TableHead>
              <TableRow>
                <TableCell>Work order</TableCell><TableCell>Type</TableCell><TableCell>Source item</TableCell><TableCell>Grade</TableCell>
                <TableCell align="right">Weight in</TableCell><TableCell>Scheduled</TableCell><TableCell>Priority</TableCell><TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((wo) => (
                <TableRow key={wo.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/work-orders/${wo.id}`)}>
                  <TableCell><Typography variant="body2" fontWeight={600} color="primary">{wo.woNumber}</Typography></TableCell>
                  <TableCell>{WO_TYPE_LABELS[wo.woType] || wo.woType}</TableCell>
                  <TableCell>{wo.sourceCoil?.coilNumber || ''}</TableCell>
                  <TableCell>{wo.sourceCoil?.grade?.code || ''}</TableCell>
                  <TableCell align="right">{wo.inputWeightLb == null ? '' : `${Number(wo.inputWeightLb).toLocaleString()} lb`}</TableCell>
                  <TableCell>{wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString() : ''}</TableCell>
                  <TableCell>{WO_PRIORITY_LABELS[wo.priority] || 'Normal'}</TableCell>
                  <TableCell><WorkOrderStatusChip status={wo.status} /></TableCell>
                </TableRow>
              ))}
              {!loading && !rows.length && !error && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  {search || status || woType ? 'No work orders match.' : 'No work orders yet.'}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            {total > rows.length ? `Showing the newest ${rows.length} of ${total.toLocaleString()}. Search or filter to narrow the list.` : `${total.toLocaleString()} work order${total === 1 ? '' : 's'}`}
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
