/**
 * CartPage — Shopping cart with line items, qty edit, subtotal, checkout buttons.
 *
 * Route: /shop/cart
 */
import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Container, Paper, Grid, Button, IconButton, TextField,
  Chip, Divider, Alert, Breadcrumbs, Link as MuiLink, Table, TableBody,
  TableHead, TableRow, TableCell, Snackbar,
} from '@mui/material'
import {
  Delete, Add, Remove, ShoppingCart, ArrowBack, ArrowForward,
  Receipt, DeleteSweep, Warning,
} from '@mui/icons-material'
import { useNavigate, Link } from 'react-router-dom'

import { useCart } from '../../contexts/CartContext'
import { useCustomerSession } from '../../contexts/CustomerSessionContext'
import { validateCart } from '../../services/cartApi'
import { evaluatePromise } from '../../services/promiseApi'
import PromiseBadge from '../../components/ecommerce/PromiseBadge'
import PromiseSummaryPanel from '../../components/ecommerce/PromiseSummaryPanel'

const DIV_COLOR = { METALS: '#1565c0', PLASTICS: '#2e7d32', SUPPLIES: '#e65100', OUTLET: '#c62828' }
const SOURCE_COLOR = { CONTRACT: 'success', RETAIL: 'primary', REMNANT: 'warning', REVIEW_REQUIRED: 'error' }

export default function CartPage() {
  const navigate = useNavigate()
  const { items, removeItem, updateItemQty, clearCart, subtotal, itemCount, hasReviewRequired } = useCart()
  const { session } = useCustomerSession()
  const [validating, setValidating] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [snack, setSnack] = useState({ open: false, msg: '' })

  // Shipping promise evaluations
  const [lineEvals, setLineEvals] = useState([])
  const [overallEval, setOverallEval] = useState(null)

  // Evaluate promise for each unique division in cart
  useEffect(() => {
    if (items.length === 0) { setLineEvals([]); setOverallEval(null); return }
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Group items by division to evaluate per-division
    const divisions = [...new Set(items.map(i => i.division || 'METALS'))]
    Promise.all(
      divisions.map(div => {
        const divItems = items.filter(i => (i.division || 'METALS') === div)
        return evaluatePromise({
          locationId: session?.locationId || 'loc-1',
          division: div,
          requestedShipDate: tomorrowStr,
          itemsSummary: {
            totalQty: divItems.reduce((s, i) => s + (i.quantity || 1), 0),
            processingSteps: Math.max(...divItems.map(i => i.processing?.length || 0)),
            estimatedWeight: divItems.reduce((s, i) => s + (i.estimatedWeight || 0), 0),
          },
        }).then(ev => ({ ...ev, division: div }))
      })
    ).then(evals => {
      setLineEvals(evals)
      // Overall = worst status
      const rank = { RED: 3, YELLOW: 2, GREEN: 1 }
      const worst = evals.reduce((w, e) => (rank[e.status] || 0) > (rank[w.status] || 0) ? e : w, evals[0])
      setOverallEval(worst || null)
    }).catch(() => { setLineEvals([]); setOverallEval(null) })
  }, [items, session?.locationId])

  const handleQtyChange = (cartId, delta) => {
    const item = items.find(i => i._cartId === cartId)
    if (!item) return
    const newQty = Math.max(1, (item.quantity || 1) + delta)
    updateItemQty(cartId, newQty)
  }

  const handleProceedToCheckout = async () => {
    setValidating(true)
    setValidationErrors([])
    try {
      const res = await validateCart({
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          priceSource: i.priceSource,
          dimensions: i.dimensions,
        })),
        customerId: session?.customerId,
        locationId: session?.locationId,
      })
      if (res.data?.valid === false && res.data.errors?.length > 0) {
        setValidationErrors(res.data.errors)
        return
      }
      navigate('/shop/checkout')
    } catch {
      setSnack({ open: true, msg: 'Validation failed. Please try again.' })
    } finally {
      setValidating(false)
    }
  }

  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
          <MuiLink component={Link} to="/shop" underline="hover" color="inherit">Shop</MuiLink>
          <Typography color="text.primary">Cart</Typography>
        </Breadcrumbs>
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <ShoppingCart sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>Your cart is empty</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Browse our catalog and add items to get started.
          </Typography>
          <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/shop" underline="hover" color="inherit">Shop</MuiLink>
        <Typography color="text.primary">Cart ({itemCount})</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ShoppingCart color="primary" />
        <Typography variant="h5" fontWeight={700}>Shopping Cart</Typography>
        <Chip label={`${itemCount} item(s)`} size="small" color="primary" />
        <Button size="small" color="error" startIcon={<DeleteSweep />} onClick={clearCart} sx={{ ml: 'auto' }}>
          Clear All
        </Button>
      </Box>

      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>Cart Validation Errors:</Typography>
          {validationErrors.map((e, i) => <Typography key={i} variant="body2">• {e}</Typography>)}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Cart items */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Unit Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Line Total</TableCell>
                  <TableCell width={50} />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => {
                  const lineTotal = (item.extended || (item.unitPrice * (item.quantity || 1)))
                  return (
                    <TableRow key={item._cartId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ width: 4, height: 40, bgcolor: DIV_COLOR[item.division] || '#ccc', borderRadius: 1, flexShrink: 0, mt: 0.5 }} />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.3 }}>
                              <Chip label={item.form} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                              {item.grade && <Chip label={item.grade} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}
                              <Chip label={item.priceSource} size="small" color={SOURCE_COLOR[item.priceSource] || 'default'}
                                sx={{ height: 18, fontSize: '0.65rem' }} />
                            </Box>
                            {item.dimensions?.thickness && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.3 }}>
                                {item.dimensions.thickness}" × {item.dimensions.width || '—'}" × {item.dimensions.length || '—'}"
                              </Typography>
                            )}
                            {item.processing?.length > 0 && (
                              <Typography variant="caption" color="info.main" display="block">
                                +{item.processing.length} processing step(s)
                              </Typography>
                            )}
                            {item.warnings?.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.3 }}>
                                <Warning sx={{ fontSize: 12, color: 'warning.main' }} />
                                <Typography variant="caption" color="warning.main">{item.warnings[0]}</Typography>
                              </Box>
                            )}
                            {/* Per-item promise badge */}
                            {lineEvals.find(e => e.division === (item.division || 'METALS')) && (
                              <Box sx={{ mt: 0.3 }}>
                                <PromiseBadge evaluation={lineEvals.find(e => e.division === (item.division || 'METALS'))} size="small" />
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleQtyChange(item._cartId, -1)}><Remove fontSize="small" /></IconButton>
                          <Typography variant="body2" fontWeight={600} sx={{ minWidth: 24, textAlign: 'center' }}>{item.quantity || 1}</Typography>
                          <IconButton size="small" onClick={() => handleQtyChange(item._cartId, 1)}><Add fontSize="small" /></IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">${item.unitPrice?.toFixed(2)}</Typography>
                        <Typography variant="caption" color="text.secondary">/{item.unit || 'ea'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>${lineTotal.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => removeItem(item._cartId)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Paper>

          <Button startIcon={<ArrowBack />} onClick={() => navigate('/shop')} sx={{ mt: 2 }}>
            Continue Shopping
          </Button>
        </Grid>

        {/* Order summary */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, position: 'sticky', top: 80 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              <Receipt sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} /> Order Summary
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Items ({itemCount})</Typography>
              <Typography variant="body2">${subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Shipping</Typography>
              <Typography variant="body2" color="text.secondary">Calculated at checkout</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Tax</Typography>
              <Typography variant="body2" color="text.secondary">Calculated at checkout</Typography>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Subtotal</Typography>
              <Typography variant="subtitle1" fontWeight={700} color="primary.main">${subtotal.toFixed(2)}</Typography>
            </Box>

            {hasReviewRequired && (
              <Alert severity="warning" variant="outlined" sx={{ mb: 1.5, py: 0, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                Items needing pricing review will be submitted as a <b>Quote Request</b>.
              </Alert>
            )}

            {/* Shipping promise summary */}
            {overallEval && (
              <Box sx={{ mb: 1.5 }}>
                <PromiseSummaryPanel
                  evaluation={overallEval}
                  lineEvaluations={lineEvals}
                  locationName={session.locationName}
                  compact={false}
                />
              </Box>
            )}

            <Button
              variant="contained" size="large" fullWidth
              endIcon={<ArrowForward />}
              onClick={handleProceedToCheckout}
              disabled={validating}
              sx={{ py: 1.5, mb: 1 }}
            >
              {validating ? 'Validating…' : hasReviewRequired ? 'Request Quote' : 'Proceed to Checkout'}
            </Button>

            <Typography variant="caption" color="text.secondary" align="center" display="block">
              {session?.accountType === 'ACCOUNT'
                ? `Ordering as ${session?.customerName} • ${session?.priceLevel}`
                : 'Retail pricing applied'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        message={snack.msg} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} />
    </Container>
  )
}
