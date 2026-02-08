/**
 * RemnantCategoryPage.jsx — E-Commerce remnant-only category/browse page.
 *
 * Route: /shop/remnants
 *
 * Features:
 *   - Dedicated remnant search with dimension filters
 *   - Aging indicators on every card
 *   - Limited quantity warnings
 *   - Quick add-to-cart
 *   - Stats banner (total pieces, total weight, avg discount)
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Container, Paper, Button, Grid, Chip, Alert,
  Breadcrumbs, Link as MuiLink, CircularProgress, Card, CardContent,
  CardActions, Tooltip, Divider, TextField, InputAdornment, IconButton,
} from '@mui/material'
import {
  Recycling     as RemnantIcon,
  LocalOffer    as TagIcon,
  Scale         as WeightIcon,
  Inventory     as StockIcon,
  Search        as SearchIcon,
  AddShoppingCart as AddCartIcon,
  Straighten    as DimIcon,
  Schedule      as ClockIcon,
  ArrowForward  as ArrowIcon,
  TrendingDown  as DiscountIcon,
} from '@mui/icons-material'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { searchRemnants, getRemnantStats, getAgeDays } from '../../services/remnantInventoryApi'
import { calculateRemnantPrice } from '../../services/remnantPricingApi'
import RemnantBadge, { AgingBadge, ConditionBadge, LimitedQtyBadge, DiscountBadge } from '../../components/inventory/RemnantBadge'
import RemnantFilterPanel from '../../components/inventory/RemnantFilterPanel'

const fmt = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function RemnantCategoryPage() {
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [remnants, setRemnants] = useState([])
  const [stats, setStats] = useState(null)
  const [facets, setFacets] = useState({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [pricing, setPricing] = useState({}) // remnantId → pricing data

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [searchRes, statsRes] = await Promise.all([
        searchRemnants({ ...filters, query }),
        getRemnantStats(),
      ])
      setRemnants(searchRes.data || [])
      setFacets(searchRes.facets || {})
      setStats(statsRes.data)

      // Calculate pricing for each remnant
      const priceMap = {}
      for (const r of (searchRes.data || [])) {
        try {
          const p = await calculateRemnantPrice({
            grade: r.grade,
            condition: r.condition,
            ageDays: getAgeDays(r.cutDate),
            weight: r.estimatedWeight,
            family: r.family,
            qty: 1,
          })
          priceMap[r.id] = p
        } catch { /* ignore */ }
      }
      setPricing(priceMap)
    } catch { /* swallow */ }
    setLoading(false)
  }, [filters, query])

  useEffect(() => { loadData() }, [loadData])

  const handleAddToCart = (remnant, price) => {
    addItem({
      productId: remnant.id,
      name: remnant.name,
      division: 'OUTLET',
      form: remnant.form,
      grade: remnant.grade,
      unitPrice: price?.remnantPricePerLb || remnant.pricePerLb,
      priceSource: 'REMNANT',
      quantity: 1,
      unit: 'EA',
      isRemnant: true,
      remnantDiscount: price?.totalDiscountPct || 25,
      weight: remnant.estimatedWeight,
    })
  }

  const handleClearFilters = () => {
    setFilters({})
    setQuery('')
  }

  return (
    <Box>
      {/* Hero Banner */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#2e7d32', color: '#fff', py: 5, px: 3, mb: 3,
          borderRadius: 2, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 60%, #004d00 100%)',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <RemnantIcon fontSize="large" />
            <Typography variant="h4" fontWeight={700}>Remnant Outlet</Typography>
            <Chip label="SAVE UP TO 65%" size="small" sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700 }} />
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.85, mb: 2.5, maxWidth: 600 }}>
            High-quality drops, offcuts, and overruns at clearance prices. Every piece includes full MTR traceability.
            Limited quantities — once they're gone, they're gone.
          </Typography>

          {/* Search */}
          <Box sx={{ display: 'flex', gap: 1, maxWidth: 500 }}>
            <TextField
              fullWidth size="small" placeholder="Search remnants — grade, dimensions, heat#…"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadData()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(0,0,0,.4)' }} /></InputAdornment>,
                sx: { bgcolor: '#fff', borderRadius: 1 },
              }}
            />
            <Button variant="contained" sx={{ bgcolor: '#fff', color: '#2e7d32', '&:hover': { bgcolor: '#e8f5e9' } }} onClick={loadData}>
              Search
            </Button>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
          <MuiLink component={Link} to="/shop" underline="hover" color="inherit">Shop</MuiLink>
          <Typography color="text.primary" fontWeight={600}>Remnant Outlet</Typography>
        </Breadcrumbs>

        {/* Stats Banner */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { icon: <StockIcon />, value: stats.totalPieces, label: 'Pieces Available', color: '#2e7d32' },
              { icon: <WeightIcon />, value: `${(stats.totalWeight / 1000).toFixed(1)}k lbs`, label: 'Total Weight', color: '#1565c0' },
              { icon: <TagIcon />, value: fmt(stats.totalValue), label: 'Total Value', color: '#e65100' },
              { icon: <DiscountIcon />, value: 'Up to 65%', label: 'Savings vs. List', color: '#b71c1c' },
            ].map((card, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: `4px solid ${card.color}` }}>
                  <Box sx={{ color: card.color, display: 'flex' }}>{card.icon}</Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} lineHeight={1}>{card.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Aging Distribution */}
        {stats && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Aging Distribution</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {[
                { label: 'Fresh (< 30d)', count: stats.byAging.FRESH, color: '#2e7d32' },
                { label: '30–60 days', count: stats.byAging.MID, color: '#f9a825' },
                { label: '60–90 days', count: stats.byAging.OLD, color: '#e65100' },
                { label: '90+ days', count: stats.byAging.STALE, color: '#b71c1c' },
              ].map(b => (
                <Chip
                  key={b.label}
                  icon={<ClockIcon />}
                  label={`${b.label}: ${b.count} pc`}
                  sx={{ bgcolor: `${b.color}18`, color: b.color, fontWeight: 600, border: `1px solid ${b.color}40`, cursor: 'pointer' }}
                  onClick={() => {
                    const bucketKey = b.label.includes('Fresh') ? 'FRESH' : b.label.includes('30') ? 'MID' : b.label.includes('60') ? 'OLD' : 'STALE'
                    setFilters(prev => ({ ...prev, agingBucket: prev.agingBucket === bucketKey ? '' : bucketKey }))
                  }}
                />
              ))}
            </Box>
          </Paper>
        )}

        {/* Main content: filters + results */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Left: Filters */}
          <Grid item xs={12} md={3}>
            <RemnantFilterPanel
              filters={filters}
              facets={facets}
              onChange={setFilters}
              onClear={handleClearFilters}
            />
          </Grid>

          {/* Right: Results */}
          <Grid item xs={12} md={9}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : remnants.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No remnants match your filters. Try broadening your search.
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Showing {remnants.length} remnant{remnants.length !== 1 ? 's' : ''}
                </Typography>
                <Grid container spacing={2}>
                  {remnants.map(r => {
                    const price = pricing[r.id]
                    return (
                      <Grid item xs={12} sm={6} lg={4} key={r.id}>
                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, position: 'relative', '&:hover': { borderColor: 'primary.main', boxShadow: 2 } }}>
                          {/* Discount ribbon */}
                          {price?.totalDiscountPct > 0 && (
                            <Box sx={{
                              position: 'absolute', top: 10, right: -5,
                              bgcolor: '#b71c1c', color: '#fff', px: 1.5, py: 0.3,
                              fontSize: '0.75rem', fontWeight: 700, borderRadius: '4px 0 0 4px',
                              boxShadow: 1,
                            }}>
                              −{Math.round(price.totalDiscountPct)}% OFF
                            </Box>
                          )}

                          <CardContent sx={{ flex: 1, pb: 1 }}>
                            {/* Badges row */}
                            <Box sx={{ mb: 1.5 }}>
                              <RemnantBadge cutDate={r.cutDate} condition={r.condition} type={r.type} discountPct={price?.totalDiscountPct} qty={r.qtyAvailable} compact />
                            </Box>

                            {/* Title */}
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ lineHeight: 1.3 }}>
                              {r.name}
                            </Typography>

                            {/* Specs */}
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                              <Chip label={r.grade} size="small" variant="outlined" />
                              <Chip label={r.form} size="small" variant="outlined" />
                              <Chip label={r.locationName} size="small" variant="outlined" />
                            </Box>

                            {/* Dimensions */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <DimIcon fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {r.thickness}" × {r.width}" × {r.length}" · {r.estimatedWeight} lbs
                              </Typography>
                            </Box>

                            {/* Heat / Traceability */}
                            {r.heatNumber && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                Heat: {r.heatNumber}
                              </Typography>
                            )}

                            {/* Pricing */}
                            <Box sx={{ mt: 1 }}>
                              {price ? (
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                  <Typography variant="h6" fontWeight={700} color="error.main">
                                    {fmt(price.lineTotal)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                    {fmt(price.listTotal)}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="h6" fontWeight={700} color="primary">
                                  {fmt(r.estimatedWeight * r.pricePerLb)}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {price ? `$${price.remnantPricePerLb}/lb · ${price.pricingTier}` : `$${r.pricePerLb}/lb`}
                              </Typography>
                              {price?.savingsVsList > 0 && (
                                <Typography variant="caption" color="success.main" display="block" fontWeight={600}>
                                  Save {fmt(price.savingsVsList)} vs. list price
                                </Typography>
                              )}
                            </Box>
                          </CardContent>

                          <CardActions sx={{ px: 2, pb: 2 }}>
                            <Button
                              fullWidth variant="contained" size="small"
                              startIcon={<AddCartIcon />}
                              onClick={() => handleAddToCart(r, price)}
                              color="success"
                            >
                              Add to Cart
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    )
                  })}
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
