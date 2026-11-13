/**
 * MobileRepIntakePage.jsx — Mobile-optimized order intake for sales reps.
 *
 * Single-column, step-by-step flow with large inputs.
 * Steps: Customer → Items → Review.
 * Designed for one-handed phone use.
 */
import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  MobileStepper,
  Divider,
  Alert,
  Fab,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  alpha,
} from '@mui/material'
import {
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  RateReview as ReviewIcon,
  Search as SearchIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { createIntakeOrder, submitOrder } from '../../services/intakeOrdersApi'
import { searchCustomers } from '../../services/intakeCustomersApi'
import { searchProducts } from '../../services/intakeProductsApi'
import { getContractPricing } from '../../services/intakePricingApi'
import useMobileMode from '../../hooks/useMobileMode'

const DIVISIONS = ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET']
const PRIORITIES = ['STANDARD', 'RUSH', 'HOT']
const LOCATIONS = ['JACKSON', 'KALAMAZOO', 'GRAND_RAPIDS', 'DETROIT']

const STEP_LABELS = ['Customer', 'Line Items', 'Review']

// Customers and products come from the live system. A product's price is its
// list price at the customer's price level.
const toCustomer = (c) => ({ id: c.id, name: c.name, account: c.code || '', priceLevel: 'RETAIL', multiplier: 1 })
const UNIT = { LB: 'LB', EA: 'EA', LF: 'FT' }

export default function MobileRepIntakePage() {
  const { isOnline } = useMobileMode()

  // ── Step state ───────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(0)

  // ── Header fields ────────────────────────────────────────────────────
  const [division, setDivision] = useState('METALS')
  const [location, setLocation] = useState('JACKSON')
  const [priority, setPriority] = useState('STANDARD')
  const [poNumber, setPoNumber] = useState('')
  const [notes, setNotes] = useState('')

  // ── Customer ─────────────────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [customer, setCustomer] = useState(null)

  // ── Line items ───────────────────────────────────────────────────────
  const [lines, setLines] = useState([])
  const [productSearch, setProductSearch] = useState('')

  // ── Submission ───────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  // ── Customer search handler ──────────────────────────────────────────
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])

  const handleCustomerSearch = async (val) => {
    setCustomerSearch(val)
    if (!val || val.length < 2) { setCustomerResults([]); return }
    try {
      const res = await searchCustomers(val, { limit: 10 })
      setCustomerResults((res.data || []).filter(c => c.isActive !== false).map(toCustomer))
    } catch {
      setCustomerResults([])
      setError('Customer search failed. Check your connection and try again.')
    }
  }

  const selectCustomer = async (c) => {
    setCustomer(c)
    setCustomerSearch(c.name)
    setCustomerResults([])
    setLines([]) // prices depend on the customer
    try {
      const res = await getContractPricing(c.id)
      setCustomer({ ...c, priceLevel: res.priceLevel || 'RETAIL', multiplier: Number(res.multiplier) > 0 ? Number(res.multiplier) : 1 })
    } catch { /* stays at list price */ }
  }

  // Products for the chosen division, searched on the server.
  useEffect(() => {
    let live = true
    const timer = setTimeout(async () => {
      try {
        const res = await searchProducts(productSearch, { division, limit: 20 })
        if (!live) return
        const multiplier = customer?.multiplier || 1
        setProducts((res.data || []).filter(p => p.basePrice > 0).map(p => ({
          id: p.id, name: p.name, form: p.form, grade: p.grade,
          unit: UNIT[p.priceUnit] || 'LB',
          unitPrice: +(p.basePrice * (p.isRemnant ? 1 : multiplier)).toFixed(4),
        })))
      } catch {
        if (live) { setProducts([]); setError('Product search failed. Check your connection and try again.') }
      }
    }, 250)
    return () => { live = false; clearTimeout(timer) }
  }, [productSearch, division, customer?.multiplier])

  // ── Line item management ─────────────────────────────────────────────
  const addProduct = (p) => {
    const existing = lines.find(l => l.productId === p.id)
    if (existing) {
      setLines(lines.map(l => l.productId === p.id ? { ...l, qty: l.qty + (p.unit === 'LB' ? 100 : 1) } : l))
    } else {
      setLines([...lines, {
        id: `line-${Date.now()}`,
        productId: p.id,
        name: p.name,
        form: p.form,
        grade: p.grade,
        unit: p.unit,
        unitPrice: p.unitPrice,
        qty: p.unit === 'LB' ? 100 : 1,
      }])
    }
    setProductSearch('')
  }

  const updateLineQty = (lineId, qty) => {
    setLines(lines.map(l => l.id === lineId ? { ...l, qty: Math.max(1, Number(qty) || 0) } : l))
  }

  const removeLine = (lineId) => {
    setLines(lines.filter(l => l.id !== lineId))
  }

  const subtotal = lines.reduce((s, l) => s + (l.qty * l.unitPrice), 0)

  // ── Submission ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        source: 'REP',
        division,
        location,
        priority,
        poNumber,
        notes,
        customerId: customer?.id,
        customerName: customer?.name,
        lines: lines.map(l => ({
          productId: l.productId,
          description: l.name,
          lineType: 'MATERIAL',
          qty: l.qty,
          uom: l.unit,
          unitPrice: l.unitPrice,
          extPrice: +(l.qty * l.unitPrice).toFixed(2),
        })),
        status: 'DRAFT',
      }
      const res = await createIntakeOrder(payload)
      const order = res.data
      if (!order?.id) throw new Error('The order was not saved')
      await submitOrder(order.id)
      setOrderNumber(order.orderNumber)
      setSubmitted(true)
    } catch (e) {
      setError(e?.message || 'The order could not be submitted. Nothing was placed.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setActiveStep(0)
    setCustomer(null)
    setCustomerSearch('')
    setLines([])
    setPoNumber('')
    setNotes('')
    setPriority('STANDARD')
    setSubmitted(false)
    setOrderNumber('')
  }

  // ── Filtered products ────────────────────────────────────────────────
  const filteredProducts = products

  // ── Can proceed? ─────────────────────────────────────────────────────
  const canNext = activeStep === 0 ? !!customer : activeStep === 1 ? lines.length > 0 : true

  if (submitted) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CheckIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>Order Submitted!</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Order <strong>{orderNumber}</strong> has been placed.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Customer: {customer?.name}
        </Typography>
        <Button variant="contained" size="large" onClick={resetForm} sx={{ minHeight: 48, px: 4, borderRadius: 3 }}>
          New Order
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {/* ── Header chips ──────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label={division} size="small" color="primary" variant="outlined" />
        <Chip label={location.replace(/_/g, ' ')} size="small" variant="outlined" />
        <Chip label={priority} size="small" color={priority === 'RUSH' ? 'warning' : priority === 'HOT' ? 'error' : 'default'} variant="outlined" />
        {customer && <Chip label={customer.name} size="small" color="success" icon={<PersonIcon />} />}
      </Box>

      {/* ── Step content ──────────────────────────────────── */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            <PersonIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} /> Customer & Header
          </Typography>

          {/* Customer search */}
          <TextField
            fullWidth
            label="Search Customer"
            placeholder="Name or account #"
            value={customerSearch}
            onChange={e => handleCustomerSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              sx: { fontSize: 16, minHeight: 52 },
            }}
            sx={{ mb: 1 }}
          />
          {customerResults.length > 0 && (
            <Paper elevation={3} sx={{ mb: 2, maxHeight: 200, overflow: 'auto', borderRadius: 2 }}>
              <List dense disablePadding>
                {customerResults.map(c => (
                  <ListItem
                    key={c.id}
                    button
                    onClick={() => selectCustomer(c)}
                    sx={{ py: 1.5, '&:active': { bgcolor: 'action.selected' } }}
                  >
                    <ListItemText
                      primary={c.name}
                      secondary={`${c.account} · ${c.priceLevel}`}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
          {customer && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2, '& .MuiAlert-icon': { fontSize: 28 } }}>
              <strong>{customer.name}</strong> — {customer.account} ({customer.priceLevel})
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Division / Location / Priority */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Division</InputLabel>
                <Select value={division} onChange={e => setDivision(e.target.value)} label="Division" sx={{ minHeight: 52 }}>
                  {DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select value={location} onChange={e => setLocation(e.target.value)} label="Location" sx={{ minHeight: 52 }}>
                  {LOCATIONS.map(l => <MenuItem key={l} value={l}>{l.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value={priority} onChange={e => setPriority(e.target.value)} label="Priority" sx={{ minHeight: 52 }}>
                  {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="PO Number (optional)"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                InputProps={{ sx: { minHeight: 52 } }}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            <CartIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} /> Line Items ({lines.length})
          </Typography>

          {/* Quick product search */}
          <TextField
            fullWidth
            label="Search Products"
            placeholder="Type to filter..."
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              sx: { fontSize: 16, minHeight: 52 },
            }}
            sx={{ mb: 2 }}
          />

          {/* Product chips (tap to add) */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {filteredProducts.map(p => (
              <Chip
                key={p.id}
                label={`${p.name} · $${p.unitPrice}/${p.unit}`}
                onClick={() => addProduct(p)}
                icon={<AddIcon />}
                variant="outlined"
                sx={{
                  py: 2.5,
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 2,
                  '&:active': { bgcolor: 'action.selected' },
                }}
              />
            ))}
            {filteredProducts.length === 0 && (
              <Typography variant="body2" color="text.secondary">No priced products match in {division}.</Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Current lines */}
          {lines.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Tap a product above to add it to the order.
            </Typography>
          ) : (
            <List disablePadding>
              {lines.map(l => (
                <Paper key={l.id} elevation={0} sx={{ mb: 1.5, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>{l.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {l.form} · {l.grade} · ${l.unitPrice}/{l.unit}
                      </Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => removeLine(l.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      type="number"
                      size="small"
                      value={l.qty}
                      onChange={e => updateLineQty(l.id, e.target.value)}
                      InputProps={{ sx: { minHeight: 44, fontWeight: 600 } }}
                      sx={{ width: 100 }}
                    />
                    <Typography variant="body2" color="text.secondary">{l.unit}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                      ${(l.qty * l.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </List>
          )}

          {lines.length > 0 && (
            <Paper elevation={0} sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.06) }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={600}>Subtotal</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            <ReviewIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} /> Review & Submit
          </Typography>

          {/* Order summary */}
          <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Customer</Typography>
            <Typography variant="body1">{customer?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{customer?.account} · {customer?.priceLevel}</Typography>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Order Details</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={division} size="small" />
              <Chip label={location.replace(/_/g, ' ')} size="small" />
              <Chip label={priority} size="small" color={priority === 'RUSH' ? 'warning' : priority === 'HOT' ? 'error' : 'default'} />
            </Box>
            {poNumber && <Typography variant="body2" sx={{ mt: 1 }}>PO: {poNumber}</Typography>}

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Items ({lines.length})
            </Typography>
            {lines.map(l => (
              <Box key={l.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2">
                  {l.name} × {l.qty} {l.unit}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  ${(l.qty * l.unitPrice).toFixed(2)}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Paper>

          {/* Notes */}
          <TextField
            fullWidth
            label="Order Notes (optional)"
            multiline
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            InputProps={{ sx: { fontSize: 16 } }}
            sx={{ mb: 2 }}
          />

          {!isOnline && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Offline — order will queue and submit when connection is restored.
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={<CheckIcon />}
            sx={{ minHeight: 56, fontWeight: 700, fontSize: 16, borderRadius: 3 }}
          >
            {submitting ? 'Submitting...' : 'Submit Order'}
          </Button>
        </Box>
      )}

      {/* ── Mobile stepper (back / next) ──────────────────── */}
      <MobileStepper
        variant="dots"
        steps={3}
        position="static"
        activeStep={activeStep}
        sx={{
          mt: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          '& .MuiMobileStepper-dot': { width: 10, height: 10 },
        }}
        nextButton={
          activeStep < 2 ? (
            <Button
              size="large"
              onClick={() => setActiveStep(s => s + 1)}
              disabled={!canNext}
              endIcon={<NextIcon />}
              sx={{ minHeight: 48, fontWeight: 600 }}
            >
              {STEP_LABELS[activeStep + 1]}
            </Button>
          ) : <Box />
        }
        backButton={
          activeStep > 0 ? (
            <Button
              size="large"
              onClick={() => setActiveStep(s => s - 1)}
              startIcon={<BackIcon />}
              sx={{ minHeight: 48, fontWeight: 600 }}
            >
              {STEP_LABELS[activeStep - 1]}
            </Button>
          ) : <Box />
        }
      />
    </Box>
  )
}
