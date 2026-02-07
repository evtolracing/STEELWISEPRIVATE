/**
 * ProductCardGrid — responsive grid of product cards for search results.
 */
import React from 'react'
import {
  Grid, Card, CardContent, CardActions, Typography, Chip, Button, Box,
  Skeleton, Tooltip, Avatar,
} from '@mui/material'
import {
  Straighten as MetalsIcon, Science as PlasticsIcon,
  Build as SuppliesIcon, LocalOffer as OutletIcon,
  Inventory as StockIcon, ShoppingCart as CartIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const DIV_ICON = { METALS: MetalsIcon, PLASTICS: PlasticsIcon, SUPPLIES: SuppliesIcon, OUTLET: OutletIcon }
const DIV_COLOR = { METALS: '#1565c0', PLASTICS: '#2e7d32', SUPPLIES: '#e65100', OUTLET: '#c62828' }

const fmt = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate()
  const Icon = DIV_ICON[product.division] || MetalsIcon
  const divColor = DIV_COLOR[product.division] || '#333'

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, transition: 'all .2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' } }}>
      {/* Color band */}
      <Box sx={{ height: 6, bgcolor: divColor }} />
      <CardContent sx={{ flex: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar sx={{ bgcolor: divColor, width: 28, height: 28 }}><Icon sx={{ fontSize: 16 }} /></Avatar>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>{product.division}</Typography>
          {product.isRemnant && <Chip label="Remnant" size="small" color="warning" sx={{ ml: 'auto' }} />}
        </Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ lineHeight: 1.3 }}>{product.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          <Chip label={product.form} size="small" variant="outlined" />
          {product.grade !== 'N/A' && <Chip label={product.grade} size="small" variant="outlined" />}
          {product.spec !== 'N/A' && <Chip label={product.spec} size="small" variant="outlined" />}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="primary">{fmt(product.basePrice)}<Typography component="span" variant="caption" color="text.secondary">/{product.priceUnit}</Typography></Typography>
          <Chip icon={<StockIcon />} label={product.inStock ? 'In Stock' : 'Lead Time'} size="small" color={product.inStock ? 'success' : 'warning'} variant="outlined" />
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<ViewIcon />} onClick={() => navigate(`/shop/products/${product.id}`)} sx={{ flex: 1 }}>
          Details
        </Button>
        {product.division !== 'OUTLET' && (
          <Tooltip title="Quick add to cart">
            <Button size="small" variant="contained" startIcon={<CartIcon />} onClick={() => onAddToCart?.(product)} sx={{ flex: 1 }}>
              Add
            </Button>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <Skeleton variant="rectangular" height={6} />
      <CardContent>
        <Skeleton width="40%" height={20} />
        <Skeleton width="80%" height={28} sx={{ mt: 1 }} />
        <Skeleton width="100%" height={18} />
        <Skeleton width="60%" height={18} />
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
          <Skeleton width={60} height={24} />
          <Skeleton width={50} height={24} />
        </Box>
        <Skeleton width="40%" height={32} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  )
}

export default function ProductCardGrid({ products = [], loading = false, onAddToCart }) {
  if (loading) {
    return (
      <Grid container spacing={2}>
        {[...Array(8)].map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}><ProductCardSkeleton /></Grid>
        ))}
      </Grid>
    )
  }

  if (products.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>No products found</Typography>
        <Typography variant="body2" color="text.secondary">Try adjusting your search or filters.</Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      {products.map(p => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
          <ProductCard product={p} onAddToCart={onAddToCart} />
        </Grid>
      ))}
    </Grid>
  )
}
