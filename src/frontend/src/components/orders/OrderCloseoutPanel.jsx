/**
 * What still stands between an order and closed, and (for the roles that manage cost) what it cost.
 * Both are read from the server, which works them out from the order's own records. Nothing is entered here.
 */
import { useEffect, useState } from 'react'
import { Paper, Typography, Box, Alert, Chip, Table, TableBody, TableRow, TableCell, Divider } from '@mui/material'
import client from '../../api/client'

const usd = (v) => (v == null ? 'Not known' : Number(v).toLocaleString(undefined, { style: 'currency', currency: 'USD' }))

export default function OrderCloseoutPanel({ orderId, refreshKey }) {
  const [position, setPosition] = useState(null)
  const [cost, setCost] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!orderId) return undefined
    let live = true
    setError('')
    client.get(`/orders/${orderId}/closeout`).then((r) => { if (live) setPosition(r.data) }).catch((e) => { if (live) { setPosition(null); setError(e.response?.data?.error || 'The closeout position could not be read.') } })
    // Cost is for managers, the inventory manager and buyers. Anyone else is refused and sees no cost section.
    client.get(`/orders/${orderId}/cost`).then((r) => { if (live) setCost(r.data) }).catch(() => { if (live) setCost(null) })
    return () => { live = false }
  }, [orderId, refreshKey])

  if (error) return <Alert severity="warning" sx={{ mt: 3 }}>{error}</Alert>
  if (!position) return null
  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2 }} data-testid="order-closeout">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>Closeout</Typography>
        <Chip size="small" color={position.closed ? 'success' : 'warning'} label={position.closed ? 'Closed' : `${position.open.length} thing${position.open.length === 1 ? '' : 's'} open`} />
      </Box>
      {position.closed
        ? <Typography variant="body2" color="text.secondary">Everything ordered has shipped, been delivered, invoiced and paid, and nothing is waiting on a return or a credit.</Typography>
        : (
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {position.open.map((o) => <Typography component="li" variant="body2" key={o.code}>{o.what}</Typography>)}
          </Box>
        )}
      {(position.notes || []).map((n) => <Typography key={n} variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>{n}</Typography>)}
      {cost && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>Cost and margin</Typography>
          <Table size="small" aria-label="Cost and margin">
            <TableBody>
              <TableRow><TableCell>Goods invoiced, less credits</TableCell><TableCell align="right">{usd(cost.revenue?.net)}</TableCell></TableRow>
              <TableRow><TableCell>Material shipped, less returned to stock</TableCell><TableCell align="right">{usd(cost.material?.cost)}</TableCell></TableRow>
              <TableRow><TableCell>Labor on its jobs</TableCell><TableCell align="right">{usd(cost.jobs?.laborCost)}</TableCell></TableRow>
              <TableRow><TableCell>Scrap on its jobs</TableCell><TableCell align="right">{usd(cost.jobs?.scrapCost)}</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Margin</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{cost.complete ? `${usd(cost.margin)}${cost.marginPct != null ? ` (${cost.marginPct}%)` : ''}` : 'Not known'}</TableCell></TableRow>
            </TableBody>
          </Table>
          {!cost.complete && (
            <Alert severity="info" sx={{ mt: 1 }}>
              The margin is not shown because some cost is not on file:
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>{(cost.missing || []).map((m) => <li key={m}>{m}</li>)}</Box>
            </Alert>
          )}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>{cost.basis}</Typography>
        </>
      )}
    </Paper>
  )
}
