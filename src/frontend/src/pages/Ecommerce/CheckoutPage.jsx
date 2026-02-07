/**
 * CheckoutPage — Final checkout with form, summary, submit/quote.
 *
 * Route: /shop/checkout
 */
import React, { useState, useEffect, useMemo } from 'react'
import {
  Box, Typography, Container, Paper, Grid, Button, Alert, Breadcrumbs,
  Link as MuiLink, Divider, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress,
} from '@mui/material'
import {
  ArrowBack, CheckCircle, ShoppingCart, Receipt,
} from '@mui/icons-material'
import { useNavigate, Link } from 'react-router-dom'

import CheckoutForm from '../../components/ecommerce/CheckoutForm'
import PromiseSummaryPanel from '../../components/ecommerce/PromiseSummaryPanel'
import FulfillmentSuggestionPanel from '../../components/orders/FulfillmentSuggestionPanel'
import { useCart } from '../../contexts/CartContext'
import { useCustomerSession } from '../../contexts/CustomerSessionContext'
import { submitOrder, requestQuote } from '../../services/checkoutApi'
import { estimateTax } from '../../services/ecomPricingApi'
import { buildPromiseSnapshot } from '../../services/promiseApi'
import { compareBranches } from '../../services/branchComparisonApi'
import useFulfillmentOverride from '../../hooks/useFulfillmentOverride'

const SOURCE_COLOR = { CONTRACT: 'success', RETAIL: 'primary', REMNANT: 'warning', REVIEW_REQUIRED: 'error' }

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, itemCount, hasReviewRequired, clearCart } = useCart()
  const { session } = useCustomerSession()

  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [promiseEval, setPromiseEval] = useState(null)

  // Branch fulfillment suggestions
  const [fulfillmentSuggestions, setFulfillmentSuggestions] = useState([])
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false)
  const { logOverride } = useFulfillmentOverride('ECOMMERCE_CHECKOUT')

  useEffect(() => {
    if (items.length === 0) return
    setFulfillmentLoading(true)
    const requiredProcessing = [...new Set(items.flatMap(i => (i.processing || []).map(p => p.code || p.name)).filter(Boolean))]
    compareBranches({
      division: session.division || 'METALS',
      requiredProcessing,
      shipTo: session.shipTo ? { lat: session.shipTo.lat, lng: session.shipTo.lng } : undefined,
    })
      .then(res => setFulfillmentSuggestions(res.suggestions || []))
      .catch(() => setFulfillmentSuggestions([]))
      .finally(() => setFulfillmentLoading(false))
  }, [items, session.division, session.locationId, session.shipTo])

  const handleBranchSwitch = (locId, locName) => {
    const best = fulfillmentSuggestions.find(s => s.recommended)
    logOverride({
      recommendedLocationId: best?.locationId,
      recommendedLocationName: best?.locationName,
      selectedLocationId: locId,
      selectedLocationName: locName,
      recommendedScore: best?.score,
      selectedScore: fulfillmentSuggestions.find(s => s.locationId === locId)?.score,
      meta: { division: session.division, itemCount },
    })
    // Note: in a full integration this would call session.setLocation(locId)
    // For now just log it — the session context controls the actual location
  }

  // Tax estimate
  const [tax, setTax] = useState(0)
  React.useEffect(() => {
    estimateTax({ subtotal, shipToState: session.shipTo?.state || 'MI' })
      .then(r => setTax(r.data?.taxAmount || 0))
      .catch(() => {})
  }, [subtotal, session.shipTo?.state])

  const total = subtotal + tax

  const handleFormSubmit = async (formData) => {
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        customerId: session.customerId,
        customerName: session.customerName,
        accountType: session.accountType,
        locationId: session.locationId,
        division: session.division,
        priceLevel: session.priceLevel,
        ...formData,
        promiseSnapshot: promiseEval ? buildPromiseSnapshot(promiseEval) : null,
        promiseStatus: promiseEval?.status || null,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          division: item.division,
          form: item.form,
          grade: item.grade,
          spec: item.spec,
          dimensions: item.dimensions,
          processing: item.processing,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          extended: item.extended || (item.unitPrice * item.quantity),
          priceSource: item.priceSource,
          estimatedWeight: item.estimatedWeight,
        })),
        subtotal,
        taxAmount: tax,
        total,
      }

      const res = hasReviewRequired
        ? await requestQuote(payload)
        : await submitOrder(payload)

      setResult(res.data)
      setConfirmOpen(true)
      clearCart()
    } catch (err) {
      setError(err.message || 'Failed to submit order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Redirect if cart is empty (and not showing confirmation)
  if (items.length === 0 && !confirmOpen) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 2 }}>Your cart is empty.</Alert>
        <Button variant="contained" onClick={() => navigate('/shop')}>Back to Shop</Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/shop" underline="hover" color="inherit">Shop</MuiLink>
        <MuiLink component={Link} to="/shop/cart" underline="hover" color="inherit">Cart</MuiLink>
        <Typography color="text.primary">Checkout</Typography>
      </Breadcrumbs>

      <Button startIcon={<ArrowBack />} size="small" onClick={() => navigate('/shop/cart')} sx={{ mb: 2 }}>
        Back to Cart
      </Button>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        <ShoppingCart sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
        {hasReviewRequired ? 'Request Quote' : 'Checkout'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Left — Form */}
        <Grid item xs={12} md={7}>
          <CheckoutForm
            onSubmit={handleFormSubmit}
            submitting={submitting}
            hasReviewRequired={hasReviewRequired}
            onPromiseChange={setPromiseEval}
            cartItems={items}
          />
        </Grid>

        {/* Right — Summary */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, position: 'sticky', top: 80 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              <Receipt sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} /> Order Summary
            </Typography>

            {items.map(item => (
              <Box key={item._cartId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={500} noWrap>{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Qty: {item.quantity} × ${item.unitPrice?.toFixed(2)}
                  </Typography>
                  <Chip label={item.priceSource} size="small" color={SOURCE_COLOR[item.priceSource] || 'default'}
                    sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }} />
                </Box>
                <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
                  ${(item.extended || (item.unitPrice * item.quantity)).toFixed(2)}
                </Typography>
              </Box>
            ))}

            <Box sx={{ mt: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">${subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <Typography variant="body2" color="text.secondary">Est. Tax</Typography>
                <Typography variant="body2">${tax.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">${total.toFixed(2)}</Typography>
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {session.customerName} • {session.locationName || session.locationId}
            </Typography>

            {/* Shipping promise panel */}
            {promiseEval && (
              <Box sx={{ mt: 2 }}>
                <PromiseSummaryPanel
                  evaluation={promiseEval}
                  locationName={session.locationName}
                  compact={false}
                />
                {promiseEval.status === 'RED' && (
                  <Alert severity="warning" variant="outlined" sx={{ mt: 1, py: 0, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                    The requested ship date cannot be met. Your order will be submitted for <b>review</b> — our team will confirm the actual ship date.
                  </Alert>
                )}
              </Box>
            )}

            {/* Branch fulfillment suggestions */}
            <Box sx={{ mt: 2 }}>
              <FulfillmentSuggestionPanel
                suggestions={fulfillmentSuggestions}
                loading={fulfillmentLoading}
                currentLocationId={session.locationId}
                onSelectBranch={handleBranchSwitch}
                compact
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" /> {hasReviewRequired ? 'Quote Request Submitted' : 'Order Submitted'}
        </DialogTitle>
        <DialogContent>
          {result && (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                {hasReviewRequired
                  ? 'Your quote request has been received. Our team will review and confirm pricing.'
                  : 'Your order has been successfully submitted!'}
              </Alert>
              <Typography variant="body2"><b>Order #:</b> {result.orderNumber}</Typography>
              <Typography variant="body2"><b>Status:</b> {result.status}</Typography>
              <Typography variant="body2"><b>Total:</b> ${result.total?.toFixed(2)}</Typography>
              {result.lines && <Typography variant="body2"><b>Items:</b> {result.lines.length}</Typography>}
              {result.promiseStatus && (
                <Typography variant="body2"><b>Ship Promise:</b> {result.promiseStatus}</Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/shop/orders')}>View My Orders</Button>
          <Button variant="contained" onClick={() => navigate('/shop')}>Continue Shopping</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
