/**
 * ShopHomePage — E-Commerce landing page with division tiles, search, and featured products.
 *
 * Route: /shop
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Container, Paper, Button, Chip, Grid, Skeleton,
  Alert, Breadcrumbs, Link as MuiLink,
} from '@mui/material'
import {
  Storefront, TrendingUp, LocalOffer, ArrowForward,
} from '@mui/icons-material'
import { useNavigate, Link } from 'react-router-dom'

import DivisionSelector from '../../components/ecommerce/DivisionSelector'
import CatalogSearchBar from '../../components/ecommerce/CatalogSearchBar'
import ProductCardGrid from '../../components/ecommerce/ProductCardGrid'
import { searchProducts, getDivisions } from '../../services/ecomCatalogApi'
import { useCustomerSession } from '../../contexts/CustomerSessionContext'
import { useCart } from '../../contexts/CartContext'

export default function ShopHomePage() {
  const navigate = useNavigate()
  const { session } = useCustomerSession()
  const { addItem, itemCount } = useCart()

  const [featured, setFeatured] = useState([])
  const [divisions, setDivisions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadFeatured = useCallback(async () => {
    setLoading(true)
    try {
      const [prodRes, divRes] = await Promise.all([
        searchProducts({ limit: 8, locationId: session.locationId }),
        getDivisions(),
      ])
      setFeatured(prodRes.data || [])
      setDivisions(divRes.data || [])
    } catch {
      // swallow
    } finally {
      setLoading(false)
    }
  }, [session.locationId])

  useEffect(() => { loadFeatured() }, [loadFeatured])

  const handleSearch = (query) => {
    navigate(`/shop/search?q=${encodeURIComponent(query)}`)
  }

  const handleDivisionClick = (div) => {
    navigate(`/shop/search?division=${div}`)
  }

  const handleAddToCart = (product) => {
    addItem({
      productId: product.id,
      name: product.name,
      division: product.division,
      form: product.form,
      grade: product.grade,
      unitPrice: product.basePrice,
      priceSource: session.priceLevel?.startsWith('CONTRACT') ? 'CONTRACT' : 'RETAIL',
      quantity: 1,
      unit: product.unit || 'ea',
    })
  }

  return (
    <Box>
      {/* Hero Banner */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'primary.main', color: '#fff', py: 6, px: 3, mb: 3,
          borderRadius: 2, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 60%, #002171 100%)',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Storefront fontSize="large" />
            <Typography variant="h4" fontWeight={700}>SteelWise Online Store</Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.85, mb: 3 }}>
            Browse our full catalog of metals, plastics, and industrial supplies.
            Configure cut-to-size, add processing, and order online.
          </Typography>
          <CatalogSearchBar
            onSearch={handleSearch}
            placeholder="Search products — e.g. 'A36 plate', '304 stainless bar'…"
            autoFocus
          />
          {session.accountType === 'ACCOUNT' && (
            <Chip
              label={`${session.customerName} • ${session.priceLevel} pricing`}
              size="small" sx={{ mt: 1.5, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }}
              icon={<LocalOffer sx={{ color: '#fff !important' }} />}
            />
          )}
        </Container>
      </Paper>

      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
          <Typography color="text.primary">Shop</Typography>
        </Breadcrumbs>

        {/* Division tiles */}
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
          Shop by Division
        </Typography>
        <DivisionSelector
          divisions={divisions.length > 0 ? divisions : undefined}
          selected={null}
          onSelect={handleDivisionClick}
        />

        {/* Featured / Popular */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4, mb: 1.5 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6" fontWeight={600}>Featured Products</Typography>
          <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/shop/search')}
            sx={{ ml: 'auto' }}>
            View All
          </Button>
        </Box>
        <ProductCardGrid
          products={featured}
          loading={loading}
          onAddToCart={handleAddToCart}
        />

        {/* Quick links */}
        <Grid container spacing={2} sx={{ mt: 3, mb: 4 }}>
          {[
            { label: 'My Orders', desc: 'Track orders & download docs', path: '/shop/orders', icon: '📦' },
            { label: 'My Cart', desc: `${itemCount} item(s) in cart`, path: '/shop/cart', icon: '🛒' },
            { label: 'Remnant / Clearance', desc: 'Discounted in-stock items', path: '/shop/search?division=OUTLET', icon: '🏷️' },
          ].map(lnk => (
            <Grid item xs={12} sm={4} key={lnk.path}>
              <Paper variant="outlined" sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: 'primary.main' }, borderRadius: 2 }}
                onClick={() => navigate(lnk.path)}>
                <Typography variant="h5" sx={{ mb: 0.5 }}>{lnk.icon}</Typography>
                <Typography variant="subtitle2" fontWeight={600}>{lnk.label}</Typography>
                <Typography variant="caption" color="text.secondary">{lnk.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
