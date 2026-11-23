/**
 * Invoices: what has been billed, what is owed, payments and credits.
 * Invoices are raised automatically when a shipment leaves the dock.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import client from '../../api/client'
import { activateOnKey } from '../../utils/activateOnKey'
import { readableNotes } from '../../utils/readableNotes.js'

const usd = (n) => `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const day = (d) => (d ? new Date(d).toLocaleDateString() : '')
const errorText = (e, fallback) => e?.response?.data?.error || fallback
const STATUS_COLOR = { PAID: 'success', PARTIAL: 'warning', OVERDUE: 'error', SENT: 'info', CANCELLED: 'default', DRAFT: 'default' }
const STATUS_LABEL = { SENT: 'Open', PARTIAL: 'Part paid', PAID: 'Paid', OVERDUE: 'Overdue', CANCELLED: 'Cancelled', DRAFT: 'Draft' }
const FILTERS = [['', 'All'], ['OPEN', 'Open'], ['OVERDUE', 'Overdue'], ['PAID', 'Paid']]
const METHODS = ['CHECK', 'ACH', 'WIRE', 'CARD', 'CASH']

function StatusChip({ invoice }) {
  const label = invoice.kind === 'CREDIT' ? (invoice.status === 'PAID' ? 'Credit settled' : 'Credit owed') : STATUS_LABEL[invoice.displayStatus] || invoice.displayStatus
  return <Chip size="small" label={label} color={invoice.kind === 'CREDIT' ? 'secondary' : STATUS_COLOR[invoice.displayStatus] || 'default'} />
}

const HISTORY_LABELS = {
  INVOICE_ISSUED: 'Invoice issued', PAYMENT_RECORDED: 'Payment recorded', CREDIT_ISSUED: 'Credit issued',
  REFUND_RECORDED: 'Refund recorded', INVOICE_CANCELLED: 'Invoice cancelled',
}

function InvoiceDialog({ id, onClose, onChanged }) {
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState(null) // 'pay' | 'credit' | 'refund'
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CHECK')
  const [reference, setReference] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    client.get(`/invoices/${id}`).then((r) => setInvoice(r.data)).catch((e) => setError(errorText(e, 'Could not load the invoice')))
  }, [id])
  useEffect(load, [load])

  const start = (m) => {
    setMode(m); setError(null); setReference(''); setReason('')
    setAmount(m === 'credit' ? '' : String(Math.abs(invoice.balance).toFixed(2)))
  }
  const submit = async () => {
    setBusy(true); setError(null)
    try {
      if (mode === 'pay') await client.post(`/invoices/${id}/payments`, { amount: Number(amount), paymentMethod: method, referenceNumber: reference || undefined })
      if (mode === 'refund') await client.post(`/invoices/${id}/refund`, { amount: Number(amount), paymentMethod: method, referenceNumber: reference || undefined })
      if (mode === 'credit') await client.post(`/invoices/${id}/credit`, { amount: Number(amount), reason })
      setMode(null); load(); onChanged()
    } catch (e) {
      setError(errorText(e, 'That did not save'))
    } finally { setBusy(false) }
  }
  const cancel = async () => {
    setBusy(true); setError(null)
    try { await client.post(`/invoices/${id}/cancel`, {}); load(); onChanged() } catch (e) { setError(errorText(e, 'Could not cancel the invoice')) } finally { setBusy(false) }
  }

  const isCredit = invoice?.kind === 'CREDIT'
  const open = invoice && ['SENT', 'PARTIAL'].includes(invoice.status)
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {invoice ? `${isCredit ? 'Credit memo' : 'Invoice'} ${invoice.invoiceNumber}` : 'Invoice'}
        {invoice && <Box component="span" sx={{ ml: 1 }}><StatusChip invoice={invoice} /></Box>}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {invoice && (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {invoice.order?.buyer?.name || 'No customer'} · Order {invoice.order?.orderNumber}
              {invoice.order?.poReference ? ` · PO ${invoice.order.poReference}` : ''} · Dated {day(invoice.invoiceDate)}
              {invoice.dueDate && !isCredit ? ` · Due ${day(invoice.dueDate)}` : ''}
            </Typography>
            {readableNotes(invoice.notes) && <Typography variant="body2" gutterBottom sx={{ whiteSpace: 'pre-wrap' }}>{readableNotes(invoice.notes)}</Typography>}
            <Table size="small">
              <TableHead><TableRow><TableCell>Item</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
              <TableBody>
                {invoice.lines.map((l) => (
                  <TableRow key={l.id}><TableCell>{l.description || 'Line'}</TableCell><TableCell align="right">{l.quantity} {l.unit}</TableCell><TableCell align="right">{usd(l.extendedPrice)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ ml: 'auto', maxWidth: 300, mt: 2 }}>
              {[['Subtotal', invoice.subtotal], ['Tax', invoice.taxAmount], ['Freight', invoice.freightAmount], ['Total', invoice.totalAmount], [isCredit ? 'Applied or refunded' : 'Paid', invoice.paidAmount]].map(([k, v]) => (
                <Stack key={k} direction="row" justifyContent="space-between"><Typography variant="body2">{k}</Typography><Typography variant="body2">{usd(v)}</Typography></Stack>
              ))}
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>{isCredit ? 'Owed to customer' : 'Balance due'}</Typography><Typography fontWeight={700}>{usd(Math.abs(invoice.balance))}</Typography></Stack>
            </Box>
            {invoice.payments.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Payments and credits</Typography>
                {invoice.payments.map((p) => (
                  <Typography key={p.id} variant="body2">{day(p.paymentDate)} · {p.paymentMethod} {p.referenceNumber ? `(${p.referenceNumber})` : ''} · {usd(p.amount)}</Typography>
                ))}
              </>
            )}
            {invoice.history?.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>History</Typography>
                {invoice.history.map((h, i) => (
                  <Typography key={i} variant="body2" data-testid="invoice-history-row">
                    {day(h.timestamp)} · {HISTORY_LABELS[h.event] || h.event}{h.amount != null ? ` ${usd(h.amount)}` : ''} · {h.by || 'Not recorded'}{h.note ? ` · ${h.note}` : ''}
                  </Typography>
                ))}
              </>
            )}
            {mode && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>{mode === 'pay' ? 'Record a payment' : mode === 'refund' ? 'Record a refund to the customer' : 'Issue a credit'}</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField size="small" label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} inputProps={{ min: 0, step: '0.01' }} />
                  {mode === 'credit' ? (
                    <TextField size="small" fullWidth label="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
                  ) : (
                    <>
                      <TextField size="small" select label="Method" value={method} onChange={(e) => setMethod(e.target.value)} sx={{ minWidth: 120 }}>
                        {METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                      </TextField>
                      <TextField size="small" label="Check or reference number" value={reference} onChange={(e) => setReference(e.target.value)} />
                    </>
                  )}
                  <Button variant="contained" disabled={busy || !(Number(amount) > 0) || (mode === 'credit' && !reason.trim())} onClick={submit}>Save</Button>
                  <Button onClick={() => setMode(null)}>Back</Button>
                </Stack>
                {mode === 'credit' && <Typography variant="caption" color="text.secondary">For returned material, use Returns instead: it puts the stock back and credits the right amount with tax.</Typography>}
              </Paper>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {invoice && !mode && !isCredit && open && <Button variant="contained" onClick={() => start('pay')}>Record payment</Button>}
        {invoice && !mode && !isCredit && invoice.status !== 'CANCELLED' && <Button onClick={() => start('credit')}>Issue credit</Button>}
        {invoice && !mode && isCredit && open && <Button variant="contained" onClick={() => start('refund')}>Record refund</Button>}
        {invoice && !mode && !isCredit && open && invoice.payments.length === 0 && <Button color="error" disabled={busy} onClick={cancel}>Cancel invoice</Button>}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

const AGING = [['notDue', 'Not yet due'], ['days1to30', '1 to 30 days'], ['days31to60', '31 to 60'], ['days61to90', '61 to 90'], ['over90', 'Over 90']]

/** What each customer owes by how long it has been due, read from /api/invoices/aging. */
function AgingTable() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    client.get('/invoices/aging').then((r) => setReport(r.data)).catch((e) => setError(errorText(e, 'Could not load what is owed by age')))
  }, [])
  if (error) return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
  if (!report) return null
  return (
    <Paper sx={{ mb: 2 }} data-testid="aging">
      <Table size="small" aria-label="Owed by age">
        <TableHead>
          <TableRow>
            <TableCell>Customer</TableCell><TableCell align="right">Invoices</TableCell>
            {AGING.map(([k, label]) => <TableCell key={k} align="right">{label}</TableCell>)}
            <TableCell align="right">Owed</TableCell><TableCell align="right">Credit owed back</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {report.customers.map((c) => (
            <TableRow key={c.customerId}>
              <TableCell>{c.customerName}</TableCell><TableCell align="right">{c.invoices}</TableCell>
              {AGING.map(([k]) => <TableCell key={k} align="right" sx={k !== 'notDue' && c[k] > 0 ? { color: 'error.main' } : undefined}>{c[k] ? usd(c[k]) : ''}</TableCell>)}
              <TableCell align="right">{usd(c.total)}</TableCell><TableCell align="right">{c.creditOwedBack ? usd(c.creditOwedBack) : ''}</TableCell>
            </TableRow>
          ))}
          {!report.customers.length && <TableRow><TableCell colSpan={9}><Typography align="center" color="text.secondary" sx={{ py: 3 }}>Nothing is owed.</Typography></TableCell></TableRow>}
          {report.customers.length > 0 && (
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>All customers{report.meta.shown < report.meta.customers ? ` (${report.meta.customers}, first ${report.meta.shown} shown)` : ''}</TableCell><TableCell />
              {AGING.map(([k]) => <TableCell key={k} align="right" sx={{ fontWeight: 700 }}>{usd(report.totals[k])}</TableCell>)}
              <TableCell align="right" sx={{ fontWeight: 700 }}>{usd(report.totals.total)}</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{usd(report.totals.creditOwedBack)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Typography variant="caption" color="text.secondary" sx={{ p: 1.5, display: 'block' }}>{report.note}</Typography>
    </Paper>
  )
}

export default function InvoicesPage() {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [status, setStatus] = useState('OPEN')
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [aging, setAging] = useState(false)

  const load = useCallback(() => {
    client.get('/invoices', { params: { status: status || undefined, search: search || undefined, limit: 100 } })
      .then((r) => { setRows(r.data?.data || []); setSummary(r.data?.summary || null); setError(null) })
      .catch((e) => setError(errorText(e, 'Could not load invoices')))
  }, [status, search])
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t) }, [load])

  return (
    <Box sx={{ p: 3 }}>
      <Typography component="h1" variant="h5" fontWeight={700}>Invoices</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        An invoice is raised automatically when a shipment leaves the dock. Record payments and credits here.
      </Typography>
      {summary && (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
          <Paper sx={{ p: 2, minWidth: 180 }}><Typography variant="caption" color="text.secondary">Owed to us (this list)</Typography><Typography variant="h6">{usd(summary.openBalance)}</Typography></Paper>
          <Paper sx={{ p: 2, minWidth: 180 }}><Typography variant="caption" color="text.secondary">Of that, overdue</Typography><Typography variant="h6" color={summary.overdueBalance > 0 ? 'error.main' : 'text.primary'}>{usd(summary.overdueBalance)}</Typography></Paper>
          <Paper sx={{ p: 2, minWidth: 180 }}><Typography variant="caption" color="text.secondary">Credits owed to customers</Typography><Typography variant="h6">{usd(summary.creditsOwed)}</Typography></Paper>
        </Stack>
      )}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
        {FILTERS.map(([value, label]) => (
          <Chip key={label} label={label} color={status === value ? 'primary' : 'default'} onClick={() => setStatus(value)} />
        ))}
        <TextField size="small" label="Invoice or order number" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ ml: 2, minWidth: 240 }} />
        <Chip label="Owed by age" variant={aging ? 'filled' : 'outlined'} color={aging ? 'secondary' : 'default'} onClick={() => setAging((v) => !v)} />
      </Stack>
      {aging && <AgingTable />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Number</TableCell><TableCell>Customer</TableCell><TableCell>Order</TableCell><TableCell>Date</TableCell><TableCell>Due</TableCell>
              <TableCell align="right">Total</TableCell><TableCell align="right">Balance</TableCell><TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((inv) => (
              <TableRow tabIndex={0} onKeyDown={activateOnKey} key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => setOpenId(inv.id)}>
                <TableCell>{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.order?.buyer?.name || ''}</TableCell>
                <TableCell>{inv.order?.orderNumber}</TableCell>
                <TableCell>{day(inv.invoiceDate)}</TableCell>
                <TableCell>{inv.kind === 'CREDIT' ? '' : day(inv.dueDate)}</TableCell>
                <TableCell align="right">{usd(inv.totalAmount)}</TableCell>
                <TableCell align="right">{usd(inv.balance)}</TableCell>
                <TableCell><StatusChip invoice={inv} /></TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={8}><Typography align="center" color="text.secondary" sx={{ py: 3 }}>No invoices here.</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
      {openId && <InvoiceDialog id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </Box>
  )
}
