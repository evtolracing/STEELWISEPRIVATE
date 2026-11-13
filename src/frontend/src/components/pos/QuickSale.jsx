/**
 * Counter quick sale: ring up shelf items, take payment, print the receipt.
 * Prices, tax and the saved sale all come from the server (/api/pos/quick-sale).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert, Box, Button, Chip, Divider, IconButton, List, ListItemButton, ListItemText, MenuItem,
  Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material'
import {
  Add as AddIcon, ArrowBack as BackIcon, Delete as DeleteIcon, Print as PrintIcon, Remove as RemoveIcon,
} from '@mui/icons-material'
import client from '../../api/client'

const usd = (n) => `$${(Number(n) || 0).toFixed(2)}`
const newSaleId = () => `qs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const errorText = (e, fallback) => e?.response?.data?.error || fallback
const BRANCH_KEY = 'quickSaleBranchId'

function Receipt({ receipt, change, taxNote, stockNote, onNew }) {
  return (
    <Paper sx={{ p: 3, maxWidth: 480, mx: 'auto' }} id="quick-sale-receipt">
      <Typography variant="h6" fontWeight={700} align="center">Sale complete</Typography>
      <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
        {receipt.orderNumber} · {receipt.invoiceNumber} · {new Date(receipt.completedAt).toLocaleString()}
      </Typography>
      {receipt.customer && <Typography variant="body2" align="center">{receipt.customer}</Typography>}
      <Divider sx={{ my: 2 }} />
      {receipt.items.map((it, i) => (
        <Stack key={i} direction="row" justifyContent="space-between">
          <Typography variant="body2">{it.quantity} × {it.description}</Typography>
          <Typography variant="body2">{usd(it.extended)}</Typography>
        </Stack>
      ))}
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" justifyContent="space-between"><Typography>Subtotal</Typography><Typography>{usd(receipt.subtotal)}</Typography></Stack>
      <Stack direction="row" justifyContent="space-between"><Typography>Tax</Typography><Typography>{usd(receipt.tax)}</Typography></Stack>
      <Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>Total</Typography><Typography fontWeight={700}>{usd(receipt.total)}</Typography></Stack>
      {receipt.payment && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            Paid by {receipt.payment.method.toLowerCase()}{receipt.payment.reference ? ` (${receipt.payment.reference})` : ''}
            {receipt.payment.method === 'CASH' ? `: ${usd(receipt.payment.amountTendered)} tendered` : ''}
          </Typography>
          {change > 0 && <Typography variant="h6" color="success.main">Change due: {usd(change)}</Typography>}
        </Box>
      )}
      {taxNote && <Alert severity="warning" sx={{ mt: 2 }}>{taxNote}</Alert>}
      {stockNote && <Alert severity="info" sx={{ mt: 2 }}>{stockNote}</Alert>}
      <Stack direction="row" spacing={1} sx={{ mt: 3, '@media print': { display: 'none' } }}>
        <Button fullWidth variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print receipt</Button>
        <Button fullWidth variant="contained" onClick={onNew}>New sale</Button>
      </Stack>
    </Paper>
  )
}

export default function QuickSale({ onClose }) {
  const [saleId, setSaleId] = useState(newSaleId)
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState(() => { try { return localStorage.getItem(BRANCH_KEY) || '' } catch { return '' } })
  const [shelf, setShelf] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([]) // [{ productId, quantity }]
  const [priced, setPriced] = useState(null)
  const [method, setMethod] = useState('CASH')
  const [tendered, setTendered] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    client.get('/inventory/locations').then((r) => setBranches(Array.isArray(r.data) ? r.data : [])).catch(() => setBranches([]))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      client.get('/pos/quick-sale/items', { params: { search } }).then((r) => setShelf(r.data?.data || [])).catch(() => setShelf([]))
    }, 200)
    return () => clearTimeout(t)
  }, [search])

  // The server prices the cart every time it changes.
  useEffect(() => {
    if (!cart.length) { setPriced(null); return undefined }
    let live = true
    client.post('/pos/quick-sale/price', { items: cart, locationId: branchId || undefined })
      .then((r) => { if (live) { setPriced(r.data); setError(null) } })
      .catch((e) => { if (live) setError(errorText(e, 'Could not price the sale')) })
    return () => { live = false }
  }, [cart, branchId])

  const add = useCallback((productId, by = 1) => {
    setCart((prev) => {
      const found = prev.find((i) => i.productId === productId)
      if (!found) return by > 0 ? [...prev, { productId, quantity: by }] : prev
      return prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + by } : i)).filter((i) => i.quantity > 0)
    })
  }, [])

  const scan = async (e) => {
    e.preventDefault()
    const code = search.trim()
    if (!code) return
    try {
      const r = await client.get('/pos/quick-sale/lookup', { params: { barcode: code } })
      add(r.data.productId)
      setSearch('')
      setError(null)
    } catch (err) {
      setError(errorText(err, `No item found for "${code}"`))
    }
    searchRef.current?.focus()
  }

  const total = priced?.total || 0
  const change = method === 'CASH' ? Math.max((Number(tendered) || 0) - total, 0) : 0
  const canPay = useMemo(() => {
    if (!priced || busy) return false
    if (method === 'CASH') return (Number(tendered) || 0) + 0.005 >= total
    return reference.trim().length > 0
  }, [priced, busy, method, tendered, total, reference])

  const pay = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await client.post('/pos/quick-sale/process-payment', {
        sale: { id: saleId, items: cart, locationId: branchId || undefined },
        payment: { method, amountTendered: method === 'CASH' ? Number(tendered) : undefined, reference: reference.trim() || undefined },
      })
      setDone(r.data)
    } catch (e) {
      setError(errorText(e, 'The payment was not recorded. Nothing was saved; try again.'))
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setSaleId(newSaleId()); setCart([]); setPriced(null); setTendered(''); setReference(''); setMethod('CASH'); setDone(null); setError(null)
  }

  if (done) {
    return (
      <Box sx={{ p: 3 }}>
        <Receipt receipt={done.receipt} change={done.change || 0} taxNote={done.taxNote} stockNote={done.stockNote} onNew={reset} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={onClose} aria-label="Back to point of sale"><BackIcon /></IconButton>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>Quick sale</Typography>
        <TextField
          select size="small" label="Branch (sets the tax rate)" value={branches.some((b) => b.id === branchId) ? branchId : ''} sx={{ minWidth: 260 }}
          onChange={(e) => { setBranchId(e.target.value); try { localStorage.setItem(BRANCH_KEY, e.target.value) } catch { /* private mode */ } }}
        >
          <MenuItem value="">My home branch</MenuItem>
          {branches.map((b) => <MenuItem key={b.id} value={b.id}>{b.code} · {b.name}{b.state ? ` (${b.state})` : ''}</MenuItem>)}
        </TextField>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
        <Paper sx={{ p: 2, width: { xs: '100%', md: 340 }, flexShrink: 0 }}>
          <Box component="form" onSubmit={scan}>
            <TextField
              inputRef={searchRef} autoFocus fullWidth size="small" label="Scan or type a SKU, then Enter"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
          <List dense sx={{ maxHeight: 420, overflow: 'auto', mt: 1 }}>
            {shelf.map((p) => (
              <ListItemButton key={p.id} onClick={() => add(p.productId)}>
                <ListItemText primary={p.name} secondary={p.sku} />
                <Chip size="small" label={usd(p.unitPrice)} />
              </ListItemButton>
            ))}
            {!shelf.length && <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>No shelf items match. Only items priced each can be rung up here; cut-to-size material goes on a standard order.</Typography>}
          </List>
        </Paper>

        <Paper sx={{ p: 2, flexGrow: 1, width: '100%' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell><TableCell align="center">Qty</TableCell>
                <TableCell align="right">Each</TableCell><TableCell align="right">Total</TableCell><TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {(priced?.items || []).map((it) => (
                <TableRow key={it.productId}>
                  <TableCell>{it.description}<Typography variant="caption" display="block" color="text.secondary">{it.sku}</Typography></TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton size="small" onClick={() => add(it.productId, -1)} aria-label="One fewer"><RemoveIcon fontSize="small" /></IconButton>
                    {it.quantity}
                    <IconButton size="small" onClick={() => add(it.productId, 1)} aria-label="One more"><AddIcon fontSize="small" /></IconButton>
                  </TableCell>
                  <TableCell align="right">{usd(it.unitPrice)}</TableCell>
                  <TableCell align="right">{usd(it.extended)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => add(it.productId, -it.quantity)} aria-label="Remove item"><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!cart.length && <TableRow><TableCell colSpan={5}><Typography color="text.secondary" sx={{ py: 3 }} align="center">Scan or pick an item to start.</Typography></TableCell></TableRow>}
            </TableBody>
          </Table>

          {priced && (
            <Box sx={{ mt: 2, ml: 'auto', maxWidth: 360 }}>
              <Stack direction="row" justifyContent="space-between"><Typography>Subtotal</Typography><Typography>{usd(priced.subtotal)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Tax{priced.taxRate ? ` (${(priced.taxRate * 100).toFixed(2)}%)` : ''}</Typography><Typography>{usd(priced.tax)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="h6">Total</Typography><Typography variant="h6">{usd(priced.total)}</Typography></Stack>
              {priced.taxNote && <Alert severity="warning" sx={{ mt: 1 }}>{priced.taxNote}</Alert>}

              <ToggleButtonGroup exclusive fullWidth size="small" value={method} onChange={(e, v) => v && setMethod(v)} sx={{ mt: 2 }}>
                <ToggleButton value="CASH">Cash</ToggleButton>
                <ToggleButton value="CARD">Card</ToggleButton>
                <ToggleButton value="CHECK">Check</ToggleButton>
              </ToggleButtonGroup>
              {method === 'CASH' ? (
                <TextField fullWidth size="small" sx={{ mt: 1.5 }} label="Cash tendered" type="number" value={tendered} onChange={(e) => setTendered(e.target.value)} inputProps={{ min: 0, step: '0.01' }} helperText={change > 0 ? `Change due: ${usd(change)}` : ' '} />
              ) : (
                <TextField
                  fullWidth size="small" sx={{ mt: 1.5 }} value={reference} onChange={(e) => setReference(e.target.value)}
                  label={method === 'CARD' ? 'Approval code from the card terminal' : 'Check number'}
                  helperText={method === 'CARD' ? 'Run the card on the terminal first. This records the sale; it does not charge the card.' : ' '}
                />
              )}
              <Button fullWidth variant="contained" size="large" sx={{ mt: 1 }} disabled={!canPay} onClick={pay}>
                {busy ? 'Saving…' : `Take payment ${usd(priced.total)}`}
              </Button>
            </Box>
          )}
        </Paper>
      </Stack>
    </Box>
  )
}
