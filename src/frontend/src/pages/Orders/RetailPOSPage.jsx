/**
 * RetailPOSPage — Walk-in retail counter optimized for speed.
 *
 * Route: /pos/retail  (standalone, no AppLayout wrapper)
 */
import React, { useState, useCallback, useMemo } from 'react'
import {
  Box, Paper, Typography, Button, Grid, Divider, TextField, Alert, Snackbar,
  FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Tooltip,
  AppBar, Toolbar, Badge, Avatar, CircularProgress, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItemButton,
  ListItemText, ListItemIcon, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer,
} from '@mui/material'
import {
  ShoppingCart as CartIcon, Person as PersonIcon, Add as AddIcon,
  Remove as RemoveIcon, Delete as DeleteIcon, CreditCard as PayIcon,
  Receipt as ReceiptIcon, Search as SearchIcon, ArrowBack as BackIcon,
  LocalOffer as RemnantIcon, Inventory as InvIcon, ShoppingBag as BagIcon,
  Print as PrintIcon, Refresh as RefreshIcon, Home as HomeIcon,
  Percent as PctIcon, AddShoppingCart as AddToCartIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

import { searchProducts } from '../../services/intakeProductsApi'
import { searchInventory } from '../../services/intakeInventoryApi'
import { createIntakeOrder, submitOrder } from '../../services/intakeOrdersApi'
import { calculateLinePrice, estimateTax } from '../../services/intakePricingApi'
import RemnantQuickAdd from '../../components/pos/RemnantQuickAdd'

const fmt = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function RetailPOSPage() {
  const navigate = useNavigate()

  // ── customer ──
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custCompany, setCustCompany] = useState('')

  // ── cart ──
  const [cart, setCart] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchMode, setSearchMode] = useState('catalog') // catalog | inventory

  // ── workflow ──
  const [saving, setSaving] = useState(false)
  const [receiptDialog, setReceiptDialog] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState(null)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  // ── Derived totals ──
  const subtotal = useMemo(() => cart.reduce((s, c) => s + (c.extPrice || 0), 0), [cart])
  const taxRate = 6
  const tax = +(subtotal * taxRate / 100).toFixed(2)
  const total = subtotal + tax

  // ── search products ──
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const fn = searchMode === 'catalog' ? searchProducts : searchInventory
      const res = await fn(searchQuery, { division: 'OUTLET', limit: 20 })
      setSearchResults(res.data || [])
    } catch { setSearchResults([]) }
    setSearching(false)
  }, [searchQuery, searchMode])

  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') handleSearch() }

  // ── add to cart ──
  const addToCart = useCallback((item) => {
    const existing = cart.findIndex(c => c.productId === (item.id || item.productId))
    if (existing >= 0) {
      setCart(prev => prev.map((c, i) => {
        if (i !== existing) return c
        const qty = c.qty + 1
        return { ...c, qty, extPrice: +(qty * c.unitPrice).toFixed(2) }
      }))
    } else {
      const price = item.basePrice || item.price || item.unitCost || 0
      const discount = item.isRemnant ? (item.remnantDiscount || 15) : 0
      const effectivePrice = discount ? +(price * (1 - discount / 100)).toFixed(2) : price
      setCart(prev => [...prev, {
        productId: item.id || item.productId,
        description: item.name || item.description || item.productName || '',
        qty: 1,
        uom: item.uom || 'EA',
        unitPrice: effectivePrice,
        extPrice: effectivePrice,
        isRemnant: !!item.isRemnant,
        remnantDiscount: discount,
        lineType: 'MATERIAL',
        ownership: 'HOUSE',
      }])
    }
    setSnack({ open: true, msg: 'Added to cart', severity: 'success' })
  }, [cart])

  const updateQty = (idx, delta) => {
    setCart(prev => prev.map((c, i) => {
      if (i !== idx) return c
      const qty = Math.max(1, c.qty + delta)
      return { ...c, qty, extPrice: +(qty * c.unitPrice).toFixed(2) }
    }))
  }

  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx))

  const clearCart = () => { setCart([]); setCustName(''); setCustPhone(''); setCustCompany('') }

  // ── checkout ──
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return
    setSaving(true)
    try {
      const payload = {
        source: 'RETAIL',
        division: 'OUTLET',
        location: 'JACKSON',
        priority: 'STANDARD',
        ownership: 'HOUSE',
        customerName: custName || 'Walk-In',
        lines: cart,
        status: 'DRAFT',
      }
      const res = await createIntakeOrder(payload)
      const id = res.data?.id
      if (id) await submitOrder(id)
      setSubmittedOrder(res.data)
      setReceiptDialog(true)
      setSnack({ open: true, msg: 'Order submitted!', severity: 'success' })
    } catch {
      setSnack({ open: true, msg: 'Checkout failed', severity: 'error' })
    }
    setSaving(false)
  }, [cart, custName, custPhone, custCompany])

  const handleNewSale = () => {
    setReceiptDialog(false)
    setSubmittedOrder(null)
    clearCart()
    setSearchQuery('')
    setSearchResults([])
  }

  // ──────────────── RENDER ────────────────
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Top bar */}
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 2 }}>
          <IconButton color="inherit" onClick={() => navigate('/')}><HomeIcon /></IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ mr: 2 }}>Retail POS</Typography>
          <Chip label="OUTLET" size="small" sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 600 }} />
          <Box sx={{ flex: 1 }} />
          <Badge badgeContent={cart.length} color="error">
            <CartIcon />
          </Badge>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', ml: 1 }}>JD</Avatar>
        </Toolbar>
      </AppBar>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── LEFT: Product search ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
          {/* Search bar */}
          <Paper sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1, alignItems: 'center', borderRadius: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select value={searchMode} onChange={e => setSearchMode(e.target.value)}>
                <MenuItem value="catalog">Catalog</MenuItem>
                <MenuItem value="inventory">Inventory</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small" fullWidth placeholder="Search products, SKU, barcode…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
            <Button variant="contained" onClick={handleSearch} disabled={searching}>
              {searching ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          </Paper>

          {/* Results */}
          <Paper sx={{ flex: 1, overflow: 'auto', borderRadius: 2 }}>
            {searchResults.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">Search for products to add to the cart</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell width={50}>Stock</TableCell>
                      <TableCell width={60} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((item, i) => (
                      <TableRow key={item.id || i} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{item.name || item.productName || item.description}</Typography>
                          {item.isRemnant && <Chip icon={<RemnantIcon />} label={`Remnant -${item.remnantDiscount || 15}%`} size="small" color="warning" sx={{ ml: 0.5 }} />}
                        </TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{item.sku || item.code || '—'}</Typography></TableCell>
                        <TableCell align="right">{fmt(item.basePrice || item.price || item.unitCost)}</TableCell>
                        <TableCell>
                          <Chip label={item.qtyOnHand ?? item.stock ?? '—'} size="small" variant="outlined" color={(item.qtyOnHand ?? item.stock ?? 0) > 0 ? 'success' : 'error'} />
                        </TableCell>
                        <TableCell>
                          <IconButton color="primary" size="small" onClick={() => addToCart(item)}>
                            <AddToCartIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>

        {/* ── RIGHT: Cart + Customer + Totals ── */}
        <Box sx={{ width: 380, display: 'flex', flexDirection: 'column', borderLeft: 1, borderColor: 'divider', bgcolor: '#fff' }}>
          {/* Quick Remnants */}
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <RemnantQuickAdd onAddToCart={addToCart} location="JACKSON" />
          </Box>

          {/* Customer */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="overline" color="text.secondary">Customer</Typography>
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              <Grid item xs={12}><TextField size="small" fullWidth label="Name" value={custName} onChange={e => setCustName(e.target.value)} /></Grid>
              <Grid item xs={6}><TextField size="small" fullWidth label="Phone" value={custPhone} onChange={e => setCustPhone(e.target.value)} /></Grid>
              <Grid item xs={6}><TextField size="small" fullWidth label="Company" value={custCompany} onChange={e => setCustCompany(e.target.value)} /></Grid>
            </Grid>
          </Box>

          {/* Cart items */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            <Typography variant="overline" color="text.secondary" sx={{ px: 1 }}>Cart ({cart.length})</Typography>
            {cart.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%' }}>
                <Typography variant="body2" color="text.secondary">Cart is empty</Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {cart.map((item, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ mb: 1, p: 1, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>{item.description}</Typography>
                      <Typography variant="body2" fontWeight={600}>{fmt(item.extPrice)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => updateQty(idx, -1)}><RemoveIcon fontSize="small" /></IconButton>
                      <Chip label={item.qty} size="small" />
                      <IconButton size="small" onClick={() => updateQty(idx, 1)}><AddIcon fontSize="small" /></IconButton>
                      <Typography variant="caption" color="text.secondary">× {fmt(item.unitPrice)}</Typography>
                      {item.isRemnant && <Chip label="REM" size="small" color="warning" sx={{ ml: 'auto' }} />}
                      <IconButton size="small" color="error" onClick={() => removeFromCart(idx)} sx={{ ml: 'auto' }}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Paper>
                ))}
              </List>
            )}
          </Box>

          {/* Totals + Checkout */}
          <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2, bgcolor: '#fafafa' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">{fmt(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Tax ({taxRate}%)</Typography>
              <Typography variant="body2">{fmt(tax)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Total</Typography>
              <Typography variant="h6" fontWeight={700} color="primary">{fmt(total)}</Typography>
            </Box>
            <Button fullWidth variant="contained" size="large" startIcon={<PayIcon />} onClick={handleCheckout} disabled={saving || cart.length === 0}
              sx={{ py: 1.5, fontWeight: 700, fontSize: '1rem' }}>
              {saving ? <CircularProgress size={24} /> : 'Checkout'}
            </Button>
            <Button fullWidth size="small" color="error" onClick={clearCart} sx={{ mt: 1 }} disabled={cart.length === 0}>
              Clear Cart
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Receipt Dialog ── */}
      <Dialog open={receiptDialog} onClose={() => setReceiptDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="success" />
            <Typography variant="h6" fontWeight={600}>Order Complete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {submittedOrder && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>{submittedOrder.orderNumber}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>Customer: {custName || 'Walk-In'}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h5" fontWeight={700}>{fmt(total)}</Typography>
              <Typography variant="caption" color="text.secondary">incl. tax</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<PrintIcon />} disabled>Print Receipt</Button>
          <Button variant="contained" onClick={handleNewSale}>New Sale</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={2000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
