/**
 * Exception Inbox: the shipments that need someone, each with the reason, from the shipments on file:
 * recorded lost, marked as an exception, still on the dock after its scheduled day, or delivered with no proof
 * of delivery and no reason. (Before 2026-11-22 this screen showed made-up exceptions.)
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { exceptionRows, routeLine } from './freightView'
import { useShipments } from './ShipmentTrackingBoard'

const day = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')

export default function ExceptionInbox() {
  const navigate = useNavigate()
  const { shipments, total, loading, error, reload } = useShipments()
  const rows = useMemo(() => exceptionRows(shipments, new Date()), [shipments])

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography component="h1" variant="h5" fontWeight={700}>Exception Inbox</Typography>
          <Typography variant="body2" color="text.secondary">Shipments that are lost, marked as an exception, late leaving, or delivered with no proof of delivery.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={reload} disabled={loading}>Refresh</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} data-testid="freight-exceptions-error">{error}</Alert>}
      {!error && total > shipments.length && <Alert severity="info" sx={{ mb: 2 }}>Checked the newest {shipments.length} of {total} shipments.</Alert>}

      {loading && shipments.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading shipments" /></Box>
      ) : !error && rows.length === 0 ? (
        <Alert severity="success" data-testid="freight-exceptions-none">No shipment needs attention.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" data-testid="freight-exceptions-table">
            <TableHead>
              <TableRow>
                <TableCell>Shipment</TableCell><TableCell>Reason</TableCell><TableCell>Customer</TableCell><TableCell>Route</TableCell>
                <TableCell>Carrier</TableCell><TableCell>Scheduled</TableCell><TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ shipment: s, kind, label, severity }) => (
                <TableRow key={s.id} hover data-testid="freight-exception-row" data-kind={kind}>
                  <TableCell><Typography variant="body2" fontWeight={700}>{s.shipmentNumber}</Typography><Typography variant="caption" color="text.secondary">{s.order?.orderNumber}</Typography></TableCell>
                  <TableCell><Chip size="small" color={severity} label={label} /></TableCell>
                  <TableCell>{s.order?.buyer?.name || 'No customer on file'}</TableCell>
                  <TableCell>{routeLine(s)}</TableCell>
                  <TableCell>{s.carrierName || 'None yet'}</TableCell>
                  <TableCell>{day(s.scheduledDate) || 'Not set'}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => navigate(`/shipping/${s.id}`)}>Open</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
