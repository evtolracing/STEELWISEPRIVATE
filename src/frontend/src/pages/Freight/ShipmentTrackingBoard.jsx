/**
 * Tracking Board: every open shipment under its status, and the last week's deliveries, from the shipments on
 * file. A card opens the shipment on the Shipping screen, where it is dispatched and delivered.
 * (Before 2026-11-22 this screen showed made-up shipments.)
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Grid, Paper, Stack, TextField, Typography } from '@mui/material'
import { Refresh as RefreshIcon, WarningAmber as LateIcon } from '@mui/icons-material'
import client from '../../api/client'
import { BOARD_COLUMNS, boardColumns, exceptionRows, isLate, routeLine } from './freightView'

const COLUMN_PAGE = 50
const day = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null)

export function useShipments() {
  const [state, setState] = useState({ shipments: [], total: 0, loading: true, error: null })
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await client.get('/shipments', { params: { scope: 'board' } })
      setState({ shipments: Array.isArray(res.data) ? res.data : [], total: Number(res.headers?.['x-total-count']) || 0, loading: false, error: null })
    } catch (e) {
      // A failed load shows no shipments and says so; nothing is invented.
      setState({ shipments: [], total: 0, loading: false, error: e.response?.data?.error || 'The shipments could not be loaded.' })
    }
  }, [])
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

export default function ShipmentTrackingBoard() {
  const navigate = useNavigate()
  const { shipments, total, loading, error, reload } = useShipments()
  const [search, setSearch] = useState('')
  // One reading of the clock per drawing, so a card and its Late mark agree.
  const now = new Date()
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return shipments
    return shipments.filter((s) => [s.shipmentNumber, s.order?.orderNumber, s.order?.buyer?.name, s.carrierName, s.bolNumber].some((v) => String(v || '').toLowerCase().includes(q)))
  }, [shipments, search])
  const columns = boardColumns(shown, now)
  // A column draws its first 50 cards, late ones first, and more on request: a long column stays quick to open,
  // and the count at the top is always the whole column.
  const [pages, setPages] = useState({})
  const attention = exceptionRows(shipments, now).length

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography component="h1" variant="h5" fontWeight={700}>Tracking Board</Typography>
          <Typography variant="body2" color="text.secondary">Open shipments by status, and deliveries of the last seven days.</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Shipment, order, customer, carrier" sx={{ minWidth: 260 }} />
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={reload} disabled={loading}>Refresh</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} data-testid="freight-board-error">{error}</Alert>}
      {!error && total > shipments.length && (
        <Alert severity="info" sx={{ mb: 2 }}>Showing the newest {shipments.length} of {total} shipments. Use the Shipping screen to search older ones.</Alert>
      )}
      {!error && attention > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => navigate('/freight/exceptions')}>Open the inbox</Button>} data-testid="freight-board-attention">
          {attention} {attention === 1 ? 'shipment needs' : 'shipments need'} attention.
        </Alert>
      )}

      {loading && shipments.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading shipments" /></Box>
      ) : (
        <Grid container spacing={2}>
          {BOARD_COLUMNS.map((col) => (
            <Grid item xs={12} sm={6} md={3} key={col.key}>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50', minHeight: 240 }} data-testid={`freight-column-${col.key}`}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{col.label}</Typography>
                  <Chip size="small" label={columns[col.key].length} data-testid={`freight-count-${col.key}`} />
                </Stack>
                {columns[col.key].length === 0 && <Typography variant="body2" color="text.secondary">None.</Typography>}
                {[...columns[col.key]].sort((a, b) => Number(isLate(b, now)) - Number(isLate(a, now))).slice(0, COLUMN_PAGE * (pages[col.key] || 1)).map((s) => (
                  <Card key={s.id} variant="outlined" sx={{ mb: 1 }} data-testid="freight-card">
                    <CardActionArea onClick={() => navigate(`/shipping/${s.id}`)} aria-label={`Open shipment ${s.shipmentNumber}`}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={700} color="primary.main">{s.shipmentNumber}</Typography>
                          {isLate(s, now) && <Chip size="small" color="warning" icon={<LateIcon />} label="Late" />}
                        </Stack>
                        <Typography variant="body2">{s.order?.buyer?.name || 'No customer on file'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{s.order?.orderNumber} · {routeLine(s)}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {s.carrierName || 'No carrier yet'}
                          {s.status === 'DELIVERED' ? ` · delivered ${day(s.deliveredAt)}` : s.shippedAt ? ` · left ${day(s.shippedAt)}` : s.scheduledDate ? ` · scheduled ${day(s.scheduledDate)}` : ''}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
                {columns[col.key].length > COLUMN_PAGE * (pages[col.key] || 1) && (
                  <Button fullWidth size="small" onClick={() => setPages((p) => ({ ...p, [col.key]: (p[col.key] || 1) + 1 }))} data-testid={`freight-more-${col.key}`}>
                    Show {Math.min(COLUMN_PAGE, columns[col.key].length - COLUMN_PAGE * (pages[col.key] || 1))} more ({columns[col.key].length - COLUMN_PAGE * (pages[col.key] || 1)} not shown)
                  </Button>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
