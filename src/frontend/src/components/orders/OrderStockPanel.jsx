/**
 * Stock for this order: what is reserved for each line, and the way to reserve more.
 * A shipment can only be dispatched for stock that is reserved on the order, so the item and its
 * heat are on record. The server checks every reservation (unit, grade, size, owner, availability).
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Paper, Typography, Box, Button, Alert, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, CircularProgress, Radio,
} from '@mui/material'
import { getOrder, allocateOrder } from '../../api'
import { getUnits } from '../../api/units'
import { activateOnKey } from '../../utils/activateOnKey'
import { reservedOn, openToReserve, mayReserve, stockChoices, suggestedQty, stockSummary } from '../../pages/Orders/reserveRules'

const amount = (v, unit) => `${Number(v || 0).toLocaleString()} ${unit || ''}`.trim()
const sizeOf = (c) => [c.thicknessIn, c.widthIn, c.lengthIn].filter((v) => Number(v) > 0).map((v) => `${Number(v)}"`).join(' × ')
const errorText = (e, fallback) => e?.response?.data?.error || e?.message || fallback

export default function OrderStockPanel({ orderId, refreshKey, onChanged }) {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [line, setLine] = useState(null)
  const [items, setItems] = useState(null)
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState(null)
  const [qty, setQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState('')

  const load = useCallback(() => {
    getOrder(orderId).then((o) => { setOrder(o); setError('') }).catch((e) => setError(errorText(e, 'The reserved stock could not be read')))
  }, [orderId])
  useEffect(() => { load() }, [load, refreshKey])

  const branchId = order?.locationId || ''
  const findStock = useCallback((text) => {
    setItems(null)
    // The order's own branch is asked for first, so its stock is never crowded out of the list by newer stock elsewhere.
    const ask = (extra) => getUnits({ limit: 200, ...(text ? { search: text } : {}), ...extra }).then((list) => (Array.isArray(list) ? list : list?.data || []))
    Promise.all([branchId ? ask({ locationId: branchId }) : [], ask({})])
      .then(([here, all]) => setItems([...here, ...all.filter((c) => !here.some((h) => h.id === c.id))]))
      .catch((e) => { setItems([]); setProblem(errorText(e, 'The stock list could not be read')) })
  }, [branchId])

  const open = (l) => { setLine(l); setPicked(null); setQty(''); setProblem(''); setSearch(''); findStock('') }
  const close = () => { if (!saving) setLine(null) }
  const pick = (c) => { setPicked(c); setQty(String(suggestedQty(line, c))); setProblem('') }

  const reserve = async () => {
    const amountToReserve = Number(qty)
    if (!picked) return setProblem('Choose the stock item to reserve.')
    if (!(amountToReserve > 0)) return setProblem('Enter how much to reserve.')
    setSaving(true)
    try {
      await allocateOrder(orderId, { lineId: line.id, coilId: picked.id, qty: amountToReserve })
      setLine(null)
      load()
      onChanged?.(`${amount(amountToReserve, line.unit)} of ${picked.coilNumber} reserved for line ${line.lineNumber}.`)
    } catch (e) {
      setProblem(errorText(e, 'The stock could not be reserved'))
    } finally {
      setSaving(false)
    }
  }

  if (error) return <Alert severity="warning" sx={{ mt: 3 }}>{error}</Alert>
  if (!order || !mayReserve(order)) return null
  const summary = stockSummary(order)
  const choices = line && items ? stockChoices(line, items, order.locationId) : []

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2 }} data-testid="order-stock">
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Stock for this order</Typography>
      <Alert severity={summary.ready ? 'success' : 'info'} sx={{ py: 0, mb: 1 }} data-testid="order-stock-summary">{summary.text}</Alert>
      {(order.lines || []).map((l) => {
        const left = openToReserve(l)
        return (
          <Box key={l.id} sx={{ py: 1, borderTop: 1, borderColor: 'divider' }} data-testid={`stock-line-${l.lineNumber}`}>
            <Typography variant="body2" fontWeight={600}>Line {l.lineNumber}: {l.description || 'No description'}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Ordered {amount(l.qtyOrdered, l.unit)} · reserved {amount(reservedOn(l), l.unit)}{Number(l.qtyShipped) > 0 ? ` · shipped ${amount(l.qtyShipped, l.unit)}` : ''}
            </Typography>
            {(l.allocations || []).map((a) => (
              <Chip key={a.id} size="small" variant="outlined" sx={{ mr: 0.5, mt: 0.5 }} label={`${a.coil?.coilNumber || 'Stock item'} · ${amount(a.qtyAllocated, l.unit)}`} />
            ))}
            {left > 0 && (
              <Button size="small" variant="contained" sx={{ mt: 1, display: 'flex' }} onClick={() => open(l)} data-testid={`reserve-line-${l.lineNumber}`}>
                Reserve Stock ({amount(left, l.unit)} to go)
              </Button>
            )}
          </Box>
        )
      })}

      <Dialog open={Boolean(line)} onClose={close} maxWidth="md" fullWidth>
        <DialogTitle>Reserve stock for line {line?.lineNumber}</DialogTitle>
        <DialogContent>
          {line && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {line.description}. {amount(openToReserve(line), line.unit)} still to reserve. Stock at this order's branch is listed first.
              </Typography>
              <Box component="form" onSubmit={(e) => { e.preventDefault(); findStock(search.trim()) }} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField size="small" fullWidth label="Search by tag, heat or grade" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Button type="submit" variant="outlined">Search</Button>
              </Box>
              {problem && <Alert severity="error" sx={{ mb: 2 }} data-testid="reserve-problem">{problem}</Alert>}
              {!items && <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={28} /></Box>}
              {items && !choices.length && (
                <Alert severity="info" data-testid="no-stock-choices">
                  No available stock counted in {line.unit}{line.grade?.code ? ` of grade ${line.grade.code}` : ''} was found. Try a search, or receive the stock first.
                </Alert>
              )}
              {choices.length > 0 && (
                <TableContainer sx={{ maxHeight: 320 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" />
                        <TableCell>Tag</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Heat</TableCell>
                        <TableCell>Branch</TableCell>
                        <TableCell align="right">Available</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {choices.map((c) => (
                        <TableRow tabIndex={0} onKeyDown={activateOnKey} key={c.id} hover selected={picked?.id === c.id} onClick={() => pick(c)} sx={{ cursor: 'pointer' }} data-testid="stock-choice">
                          <TableCell padding="checkbox"><Radio size="small" checked={picked?.id === c.id} inputProps={{ 'aria-label': `Choose ${c.coilNumber}` }} /></TableCell>
                          <TableCell>{c.coilNumber}</TableCell>
                          <TableCell>{c.grade?.code || '—'}</TableCell>
                          <TableCell>{sizeOf(c) || '—'}</TableCell>
                          <TableCell>{c.heat?.heatNumber || '—'}</TableCell>
                          <TableCell>{c.location?.code || c.location?.name || '—'}</TableCell>
                          <TableCell align="right">{amount(c.inventory.qtyAvailable, c.inventory.unit)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {picked && (
                <TextField sx={{ mt: 2 }} size="small" type="number" label={`Quantity to reserve (${line.unit})`} value={qty}
                  onChange={(e) => setQty(e.target.value)} inputProps={{ min: 0, step: 'any', 'data-testid': 'reserve-qty' }} />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={reserve} disabled={saving || !picked} data-testid="reserve-confirm">{saving ? 'Reserving...' : 'Reserve'}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
