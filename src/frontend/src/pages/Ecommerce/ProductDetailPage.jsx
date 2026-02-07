/**
 * ProductDetailPage — Full product detail with cut-to-size config, processing, pricing.
 *
 * Route: /shop/products/:id
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Container, Paper, Grid, Chip, Button, Alert, Snackbar,
  Breadcrumbs, Link as MuiLink, Divider, Skeleton, Table, TableBody,
  TableRow, TableCell, CircularProgress, Tab, Tabs,
} from '@mui/material'
import {
  ShoppingCart, ArrowBack, Inventory, LocalShipping, CheckCircle,
  Warning, LocationOn,
} from '@mui/icons-material'
import { useParams, useNavigate, Link } from 'react-router-dom'

import CutToSizeConfigurator from '../../components/ecommerce/CutToSizeConfigurator'
import ProcessingConfigurator from '../../components/ecommerce/ProcessingConfigurator'
import PriceBreakdownPanel from '../../components/ecommerce/PriceBreakdownPanel'
import CutoffCallout from '../../components/ecommerce/CutoffCallout'
import PromiseBadge from '../../components/ecommerce/PromiseBadge'
import { getProduct, getAvailability } from '../../services/ecomCatalogApi'
import { priceConfig } from '../../services/ecomPricingApi'
import { evaluatePromise } from '../../services/promiseApi'
import { useCustomerSession } from '../../contexts/CustomerSessionContext'
import { useCart } from '../../contexts/CartContext'

const DIV_COLOR = { METALS: '#1565c0', PLASTICS: '#2e7d32', SUPPLIES: '#e65100', OUTLET: '#c62828' }

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useCustomerSession()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)

  // Configuration state
  const [dimensions, setDimensions] = useState({
    thickness: '', width: '', length: '', unit: 'in', quantity: 1,
    tolerance: 'STANDARD', edgeQuality: '',
  })
  const [processingSteps, setProcessingSteps] = useState([])
  const [pricing, setPricing] = useState(null)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  // Shipping promise evaluation
  const [promiseEval, setPromiseEval] = useState(null)

  // Load product
  useEffect(() => {
    setLoading(true)
    Promise.all([
      getProduct(id),
      getAvailability(id, session.locationId),
    ]).then(([pRes, aRes]) => {
      setProduct(pRes.data || null)
      setAvailability(aRes.data || null)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id, session.locationId])

  // Re-price when config changes
  useEffect(() => {
    if (!product) return
    const timer = setTimeout(async () => {
      setPricingLoading(true)
      try {
        const res = await priceConfig({
          productId: product.id,
          quantity: dimensions.quantity || 1,
          dimensions: {
            thickness: parseFloat(dimensions.thickness) || undefined,
            width: parseFloat(dimensions.width) || undefined,
            length: parseFloat(dimensions.length) || undefined,
            unit: dimensions.unit,
          },
          processing: processingSteps,
          priceLevel: session.priceLevel,
          customerId: session.customerId,
          locationId: session.locationId,
        })
        setPricing(res.data || null)
      } catch {
        setPricing(null)
      } finally {
        setPricingLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [product, dimensions, processingSteps, session])

  // Evaluate shipping promise when product/location/division changes
  useEffect(() => {
    if (!product) { setPromiseEval(null); return }
    const division = product.division || session.division || 'METALS'
    // Evaluate for "tomorrow" to show default next-day promise status
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    evaluatePromise({
      locationId: session.locationId,
      division,
      requestedShipDate: tomorrowStr,
      itemsSummary: {
        totalQty: dimensions.quantity || 1,
        processingSteps: processingSteps.length,
        estimatedWeight: pricing?.estimatedWeight || 0,
      },
    }).then(setPromiseEval).catch(() => setPromiseEval(null))
  }, [product, session.locationId, session.division, processingSteps.length, dimensions.quantity, pricing?.estimatedWeight])

  const handleAddToCart = () => {
    if (!product || !pricing) return
    addItem({
      productId: product.id,
      name: product.name,
      division: product.division,
      form: product.form,
      grade: product.grade,
      spec: product.spec,
      dimensions: { ...dimensions },
      processing: processingSteps.map(s => ({ processId: s.processId, code: s.code, name: s.name, params: s.params })),
      unitPrice: pricing.unitPrice,
      extended: pricing.extended,
      materialCost: pricing.materialCost,
      processingCost: pricing.processingCost,
      priceSource: pricing.priceSource,
      estimatedWeight: pricing.estimatedWeight,
      quantity: dimensions.quantity || 1,
      unit: product.unit || 'ea',
      warnings: pricing.warnings,
    })
    setSnack({ open: true, msg: `${product.name} added to cart`, severity: 'success' })
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton height={40} width={300} />
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={7}><Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} /></Grid>
          <Grid item xs={12} md={5}><Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} /></Grid>
        </Grid>
      </Container>
    )
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">Product not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/shop')} sx={{ mt: 2 }}>Back to Shop</Button>
      </Container>
    )
  }

  const inStock = availability?.quantityOnHand > 0

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/shop" underline="hover" color="inherit">Shop</MuiLink>
        <MuiLink component={Link} to={`/shop/search?division=${product.division}`} underline="hover" color="inherit">
          {product.division}
        </MuiLink>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Button startIcon={<ArrowBack />} size="small" onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>

      <Grid container spacing={3}>
        {/* Left — Product info */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {/* Color banner */}
            <Box sx={{ height: 6, bgcolor: DIV_COLOR[product.division] || '#666' }} />
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                <Typography variant="h5" fontWeight={700}>{product.name}</Typography>
                {product.isRemnant && <Chip label="REMNANT" size="small" color="warning" />}
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={product.division} size="small" color="primary" variant="outlined" />
                <Chip label={product.form} size="small" />
                {product.grade && <Chip label={product.grade} size="small" />}
                {product.spec && <Chip label={product.spec} size="small" variant="outlined" />}
                {product.tags?.map(t => <Chip key={t} label={t} size="small" variant="outlined" />)}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {product.description || `${product.form} — Grade ${product.grade || 'N/A'}${product.spec ? ` (${product.spec})` : ''}`}
              </Typography>

              {/* Availability */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="subtitle2" fontWeight={600}>Availability at {session.locationName || 'Selected Location'}</Typography>
                </Box>
                {inStock ? (
                  <Chip icon={<CheckCircle />} label={`In Stock — ${availability.quantityOnHand} ${product.unit || 'pcs'}`}
                    color="success" size="small" />
                ) : (
                  <Chip icon={<Warning />} label={`Out of Stock — Lead time: ${product.leadTimeDays || '?'} days`}
                    color="warning" size="small" />
                )}
              </Paper>

              {/* Specs table */}
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
                <Tab label="Specifications" />
                <Tab label="Details" />
              </Tabs>

              {tab === 0 && (
                <Table size="small">
                  <TableBody>
                    {product.form && <TableRow><TableCell sx={{ fontWeight: 600 }}>Form</TableCell><TableCell>{product.form}</TableCell></TableRow>}
                    {product.grade && <TableRow><TableCell sx={{ fontWeight: 600 }}>Grade</TableCell><TableCell>{product.grade}</TableCell></TableRow>}
                    {product.spec && <TableRow><TableCell sx={{ fontWeight: 600 }}>Spec</TableCell><TableCell>{product.spec}</TableCell></TableRow>}
                    {product.family && <TableRow><TableCell sx={{ fontWeight: 600 }}>Family</TableCell><TableCell>{product.family}</TableCell></TableRow>}
                    {product.thicknessOptions?.length > 0 && (
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Thickness Options</TableCell>
                        <TableCell>{product.thicknessOptions.map(t => `${t}"`).join(', ')}</TableCell></TableRow>
                    )}
                    {product.widthOptions?.length > 0 && (
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Width Options</TableCell>
                        <TableCell>{product.widthOptions.map(w => `${w}"`).join(', ')}</TableCell></TableRow>
                    )}
                    {product.lengthOptions?.length > 0 && (
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Length Options</TableCell>
                        <TableCell>{product.lengthOptions.map(l => `${l}'`).join(', ')}</TableCell></TableRow>
                    )}
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Unit</TableCell><TableCell>{product.unit || 'ea'}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Lead Time</TableCell><TableCell>{product.leadTimeDays || 'N/A'} days</TableCell></TableRow>
                  </TableBody>
                </Table>
              )}

              {tab === 1 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                  {product.description || 'No additional details available.'}
                  {product.allowCutToSize && <><br /><br />✂️ This product supports <b>cut-to-size</b> ordering.</>}
                  {product.allowProcessing && <><br />🔧 Processing options available (sawing, shearing, etc.).</>}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right — Configuration & pricing */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 80 }}>
            {/* Cut-to-size */}
            {product.allowCutToSize && (
              <CutToSizeConfigurator
                product={product}
                config={dimensions}
                onChange={setDimensions}
              />
            )}

            {/* Processing */}
            {product.allowProcessing && (
              <ProcessingConfigurator
                steps={processingSteps}
                onChange={setProcessingSteps}
                division={product.division}
              />
            )}

            {/* Price breakdown */}
            <PriceBreakdownPanel pricing={pricing} loading={pricingLoading} />

            {/* Shipping promise callout */}
            {promiseEval && (
              <CutoffCallout
                cutoffLocal={promiseEval.cutoffLocal}
                cutoffMet={promiseEval.cutoffMet}
                locationName={session.locationName}
                division={product.division}
              />
            )}

            {/* Add to cart */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained" size="large" fullWidth
                startIcon={<ShoppingCart />}
                onClick={handleAddToCart}
                disabled={!pricing || pricingLoading}
                sx={{ py: 1.5 }}
              >
                {pricing?.priceSource === 'REVIEW_REQUIRED' ? 'Add to Cart (Quote Required)' : 'Add to Cart'}
              </Button>
              {promiseEval && <PromiseBadge evaluation={promiseEval} size="small" />}
            </Box>

            {pricing?.priceSource === 'REVIEW_REQUIRED' && (
              <Alert severity="info" variant="outlined" sx={{ py: 0 }}>
                This configuration requires manual pricing review.
              </Alert>
            )}
          </Box>
        </Grid>
      </Grid>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        message={snack.msg} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} />
    </Container>
  )
}
