/**
 * RFQs and quotes: log what a customer asked for, price it, mark it sent,
 * and turn an accepted quote into a sales order.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem,
  Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import client from '../../api/client'

const usd = (n) => `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const day = (d) => (d ? new Date(d).toLocaleDateString() : '')
const errorText = (e, fallback) => e?.response?.data?.error || fallback
const RFQ_STATUS = {
  SUBMITTED: ['Needs a quote', 'warning'], DRAFT: ['Draft', 'default'], IN_REVIEW: ['Being quoted', 'info'], QUOTED: ['Quote sent', 'primary'],
  ACCEPTED: ['Won', 'success'], REJECTED: ['Lost', 'default'], WITHDRAWN: ['Withdrawn', 'default'], EXPIRED: ['Expired', 'default'],
}
const QUOTE_STATUS = { DRAFT: ['Draft', 'default'], SENT: ['Sent', 'primary'], ACCEPTED: ['Accepted', 'success'], REJECTED: ['Rejected', 'default'], EXPIRED: ['Expired', 'warning'], COUNTERED: ['Countered', 'info'], PENDING_APPROVAL: ['Needs approval', 'warning'] }
const UNITS = ['LB', 'EA', 'FT']
const PRICE_UNITS = [['CWT', 'per 100 lb'], ['LB', 'per lb'], ['TON', 'per ton'], ['EACH', 'each'], ['LF', 'per foot']]
const DIVISOR = { CWT: 100, TON: 2000, LB: 1, EACH: 1, LF: 1 }
const chip = (map, status) => <Chip size="small" label={(map[status] || [status])[0]} color={(map[status] || [])[1] || 'default'} />

function NewRfqDialog({ onClose, onSaved }) {
  const [customers, setCustomers] = useState([])
  const [customer, setCustomer] = useState(null)
  const [contactName, setContactName] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([{ description: '', requestedQty: '', unit: 'LB' }])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const searchCustomers = useCallback((search) => {
    client.get('/customers', { params: { search: search || undefined, limit: 25 } })
      .then((r) => setCustomers(r.data?.data || r.data?.customers || (Array.isArray(r.data) ? r.data : [])))
      .catch(() => setCustomers([]))
  }, [])
  useEffect(() => searchCustomers(''), [searchCustomers])

  const setLine = (i, patch) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)))
  const good = lines.filter((l) => l.description.trim() && Number(l.requestedQty) > 0)
  const save = async () => {
    setBusy(true); setError(null)
    try {
      await client.post('/rfqs', { customerId: customer.id, contactName: contactName || undefined, notes: notes || undefined, lines: good.map((l) => ({ ...l, requestedQty: Number(l.requestedQty) })) })
      onSaved()
    } catch (e) { setError(errorText(e, 'The RFQ did not save')) } finally { setBusy(false) }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>New request for quote</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <Autocomplete
            sx={{ flex: 2 }} options={customers} value={customer} onChange={(e, v) => setCustomer(v)} onInputChange={(e, v, reason) => reason === 'input' && searchCustomers(v)}
            getOptionLabel={(o) => (o ? `${o.name}${o.code ? ` (${o.code})` : ''}` : '')} isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => <TextField {...params} size="small" label="Customer" autoFocus />}
          />
          <TextField sx={{ flex: 1 }} size="small" label="Who asked (optional)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Stack>
        {lines.map((l, i) => (
          <Stack key={i} direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField size="small" fullWidth label={`Line ${i + 1}: what they need`} placeholder='A36 plate 1/2" x 48 x 96' value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
            <TextField size="small" sx={{ width: 130 }} label="Quantity" type="number" value={l.requestedQty} onChange={(e) => setLine(i, { requestedQty: e.target.value })} />
            <TextField size="small" select sx={{ width: 90 }} label="Unit" value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })}>
              {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
            <IconButton disabled={lines.length === 1} onClick={() => setLines(lines.filter((x, k) => k !== i))} aria-label="Remove line"><DeleteIcon /></IconButton>
          </Stack>
        ))}
        <Button size="small" startIcon={<AddIcon />} onClick={() => setLines([...lines, { description: '', requestedQty: '', unit: 'LB' }])}>Add line</Button>
        <TextField fullWidth size="small" multiline minRows={2} sx={{ mt: 2 }} label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" disabled={busy || !customer || !good.length} onClick={save}>Save RFQ</Button>
      </DialogActions>
    </Dialog>
  )
}

function RfqDialog({ id, onClose, onChanged }) {
  const navigate = useNavigate()
  const [rfq, setRfq] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [pricing, setPricing] = useState(null) // [{ rfqLineId, unitPrice, priceUnit }]
  const [validDays, setValidDays] = useState(30)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    client.get(`/rfqs/${id}`).then((r) => setRfq(r.data)).catch((e) => setError(errorText(e, 'Could not load the RFQ')))
  }, [id])
  useEffect(load, [load])

  const run = async (fn, okText) => {
    setBusy(true); setError(null); setNotice(null)
    try { const r = await fn(); if (okText) setNotice(typeof okText === 'function' ? okText(r) : okText); load(); onChanged(); return r } catch (e) { setError(errorText(e, 'That did not save')); return null } finally { setBusy(false) }
  }
  const startPricing = () => setPricing(rfq.lines.map((l) => ({ rfqLineId: l.id, unitPrice: '', priceUnit: l.unit === 'LB' ? 'CWT' : 'EACH' })))
  const lineTotal = (l, p) => (Number(p.unitPrice) >= 0 && p.unitPrice !== '' ? (Number(l.requestedQty) * Number(p.unitPrice)) / DIVISOR[p.priceUnit] : null)
  const saveQuote = async () => {
    const validUntil = new Date(Date.now() + (Number(validDays) || 30) * 864e5).toISOString()
    const r = await run(() => client.post(`/rfqs/${id}/quotes`, { validUntil, lines: pricing.map((p) => ({ ...p, unitPrice: Number(p.unitPrice) })) }), 'Quote saved as a draft.')
    if (r) setPricing(null)
  }

  const open = rfq && ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'QUOTED'].includes(rfq.status)
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{rfq ? `${rfq.rfqNumber} · ${rfq.customer?.name || ''}` : 'RFQ'} {rfq && <Box component="span" sx={{ ml: 1 }}>{chip(RFQ_STATUS, rfq.status)}</Box>}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}
        {rfq && (
          <>
            {(rfq.contactName || rfq.notes) && <Typography variant="body2" color="text.secondary" gutterBottom>{[rfq.contactName && `Asked by ${rfq.contactName}`, rfq.notes].filter(Boolean).join(' · ')}</Typography>}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>What they need</TableCell><TableCell align="right">Quantity</TableCell>
                  {pricing && <><TableCell>Price</TableCell><TableCell>Per</TableCell><TableCell align="right">Line total</TableCell></>}
                </TableRow>
              </TableHead>
              <TableBody>
                {rfq.lines.map((l, i) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.lineNumber}. {l.description}</TableCell>
                    <TableCell align="right">{Number(l.requestedQty)} {l.unit}</TableCell>
                    {pricing && (
                      <>
                        <TableCell><TextField size="small" type="number" sx={{ width: 110 }} value={pricing[i].unitPrice} inputProps={{ min: 0, step: '0.01' }} onChange={(e) => setPricing(pricing.map((p, k) => (k === i ? { ...p, unitPrice: e.target.value } : p)))} /></TableCell>
                        <TableCell>
                          <TextField size="small" select sx={{ width: 130 }} value={pricing[i].priceUnit} onChange={(e) => setPricing(pricing.map((p, k) => (k === i ? { ...p, priceUnit: e.target.value } : p)))}>
                            {PRICE_UNITS.map(([v, label]) => <MenuItem key={v} value={v}>{label}</MenuItem>)}
                          </TextField>
                        </TableCell>
                        <TableCell align="right">{lineTotal(l, pricing[i]) == null ? '' : usd(lineTotal(l, pricing[i]))}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pricing && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <TextField size="small" type="number" label="Valid for (days)" sx={{ width: 150 }} value={validDays} onChange={(e) => setValidDays(e.target.value)} />
                <Typography sx={{ flexGrow: 1 }} align="right" fontWeight={700}>
                  Total {usd(rfq.lines.reduce((s, l, i) => s + (lineTotal(l, pricing[i]) || 0), 0))}
                </Typography>
                <Button variant="contained" disabled={busy || pricing.some((p) => p.unitPrice === '' || Number(p.unitPrice) < 0)} onClick={saveQuote}>Save quote</Button>
                <Button onClick={() => setPricing(null)}>Back</Button>
              </Stack>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Quotes</Typography>
            {!rfq.quotes.length && <Typography variant="body2" color="text.secondary">No quote yet.</Typography>}
            {rfq.quotes.map((q) => {
              const expired = q.validUntil && new Date(q.validUntil) < new Date() && ['DRAFT', 'SENT'].includes(q.status)
              return (
                <Paper key={q.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography fontWeight={600}>{q.quoteNumber}</Typography>
                    {chip(QUOTE_STATUS, expired ? 'EXPIRED' : q.status)}
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>{usd(q.totalAmount)} · valid until {day(q.validUntil)}</Typography>
                    {q.status === 'DRAFT' && !expired && <Button size="small" disabled={busy} onClick={() => run(() => client.post(`/quotes/${q.id}/send`, {}), 'Marked as sent. Nothing is emailed from here: send the customer the quote yourself.')}>Mark as sent</Button>}
                    {['DRAFT', 'SENT'].includes(q.status) && !expired && (
                      <Button size="small" variant="contained" disabled={busy} onClick={() => run(() => client.post(`/quotes/${q.id}/accept`, {}), (r) => `Order ${r.data?.order?.orderNumber} created from this quote.`)}>Customer accepted: create order</Button>
                    )}
                    {['DRAFT', 'SENT'].includes(q.status) && <Button size="small" color="inherit" disabled={busy} onClick={() => run(() => client.post(`/quotes/${q.id}/reject`, {}))}>Lost</Button>}
                    {q.convertedOrderId && <Button size="small" onClick={() => navigate('/orders')}>See orders</Button>}
                  </Stack>
                  {(q.lines || []).map((ql) => (
                    <Typography key={ql.id} variant="body2" color="text.secondary">
                      {ql.lineNumber}. {ql.description} · {Number(ql.quantity)} {ql.unit} at {usd(ql.unitPrice)} {(PRICE_UNITS.find(([v]) => v === ql.priceUnit) || [])[1] || ql.priceUnit} = {usd(ql.extendedPrice)}
                    </Typography>
                  ))}
                </Paper>
              )
            })}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {open && !pricing && <Button variant="contained" onClick={startPricing}>{rfq.quotes.length ? 'New quote version' : 'Price this RFQ'}</Button>}
        {open && !pricing && <Button color="inherit" disabled={busy} onClick={() => run(() => client.patch(`/rfqs/${id}`, { status: 'WITHDRAWN' }))}>Customer withdrew</Button>}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function QuotesPage() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('OPEN')
  const [error, setError] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => {
    client.get('/rfqs', { params: { status: status || undefined, limit: 100 } })
      .then((r) => { setRows(r.data?.data || []); setError(null) })
      .catch((e) => setError(errorText(e, 'Could not load RFQs')))
  }, [status])
  useEffect(load, [load])

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>RFQs and quotes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>New RFQ</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Log what the customer asked for, price it, and when they say yes the quote becomes a confirmed sales order.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {[['OPEN', 'Open'], ['ACCEPTED', 'Won'], ['REJECTED', 'Lost'], ['', 'All']].map(([value, label]) => (
          <Chip key={label} label={label} color={status === value ? 'primary' : 'default'} onClick={() => setStatus(value)} />
        ))}
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>RFQ</TableCell><TableCell>Customer</TableCell><TableCell>Received</TableCell><TableCell>Lines</TableCell><TableCell>Latest quote</TableCell><TableCell>Status</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => setOpenId(r.id)}>
                <TableCell>{r.rfqNumber}</TableCell>
                <TableCell>{r.customer?.name || ''}</TableCell>
                <TableCell>{day(r.createdAt)}</TableCell>
                <TableCell>{r.lines.map((l) => l.description).filter(Boolean).slice(0, 2).join('; ')}{r.lines.length > 2 ? ` and ${r.lines.length - 2} more` : ''}</TableCell>
                <TableCell>{r.quotes[0] ? `${r.quotes[0].quoteNumber} · ${usd(r.quotes[0].totalAmount)}` : ''}</TableCell>
                <TableCell>{chip(RFQ_STATUS, r.status)}</TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={6}><Typography align="center" color="text.secondary" sx={{ py: 3 }}>Nothing here.</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
      {creating && <NewRfqDialog onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load() }} />}
      {openId && <RfqDialog id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </Box>
  )
}
