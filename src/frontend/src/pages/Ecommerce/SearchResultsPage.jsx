/**
 * SearchResultsPage — Full search with filters drawer, product grid, pagination.
 *
 * Route: /shop/search
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box, Typography, Container, Button, Chip, Breadcrumbs, Link as MuiLink,
  Pagination, FormControl, InputLabel, Select, MenuItem, Alert, IconButton, Badge,
} from '@mui/material'
import {
  FilterList, Sort as SortIcon, ViewModule, ViewList,
} from '@mui/icons-material'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

import CatalogSearchBar from '../../components/ecommerce/CatalogSearchBar'
import ProductFiltersDrawer from '../../components/ecommerce/ProductFiltersDrawer'
import ProductCardGrid from '../../components/ecommerce/ProductCardGrid'
import { searchProducts, getFamilies } from '../../services/ecomCatalogApi'
import { useCustomerSession } from '../../contexts/CustomerSessionContext'
import { useCart } from '../../contexts/CartContext'

const PAGE_SIZE = 12
const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A→Z' },
  { value: 'name_desc', label: 'Name Z→A' },
  { value: 'price_asc', label: 'Price Low→High' },
  { value: 'price_desc', label: 'Price High→Low' },
]

export default function SearchResultsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { session } = useCustomerSession()
  const { addItem } = useCart()

  // Parse URL params
  const query = searchParams.get('q') || ''
  const divParam = searchParams.get('division') || ''

  // State
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('name_asc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    division: divParam || '',
    forms: [],
    families: [],
    inStockOnly: false,
  })
  const [families, setFamilies] = useState([])

  // Load families when division changes
  useEffect(() => {
    if (filters.division) {
      getFamilies(filters.division).then(r => setFamilies(r.data || []))
    } else {
      setFamilies([])
    }
  }, [filters.division])

  // Search
  const doSearch = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        query,
        division: filters.division || undefined,
        form: filters.forms.length > 0 ? filters.forms[0] : undefined,
        family: filters.families.length > 0 ? filters.families[0] : undefined,
        inStockOnly: filters.inStockOnly || undefined,
        locationId: session?.locationId || 'loc-1',
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }
      const res = await searchProducts(params)
      let items = res.data || []

      // Client-side sort
      const [field, dir] = sortBy.split('_')
      items.sort((a, b) => {
        if (field === 'name') return dir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        if (field === 'price') return dir === 'asc' ? a.basePrice - b.basePrice : b.basePrice - a.basePrice
        return 0
      })

      setProducts(items)
      setTotal(res.total || items.length)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [query, filters, page, sortBy, session?.locationId])

  useEffect(() => { doSearch() }, [doSearch])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [query, filters, sortBy])

  const handleSearch = (q) => {
    setSearchParams({ q, ...(filters.division ? { division: filters.division } : {}) })
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    if (newFilters.division && newFilters.division !== searchParams.get('division')) {
      setSearchParams(prev => {
        const p = new URLSearchParams(prev)
        if (newFilters.division) p.set('division', newFilters.division)
        else p.delete('division')
        return p
      })
    }
  }

  const handleAddToCart = (product) => {
    addItem({
      productId: product.id,
      name: product.name,
      division: product.division,
      form: product.form,
      grade: product.grade,
      unitPrice: product.basePrice,
      priceSource: session?.priceLevel?.startsWith('CONTRACT') ? 'CONTRACT' : 'RETAIL',
      quantity: 1,
      unit: product.unit || 'ea',
    })
  }

  const activeFilterCount = [filters.division, ...filters.forms, ...filters.families, filters.inStockOnly].filter(Boolean).length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <Box>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
          <MuiLink component={Link} to="/shop" underline="hover" color="inherit">Shop</MuiLink>
          <Typography color="text.primary">Search</Typography>
        </Breadcrumbs>

        {/* Search bar */}
        <CatalogSearchBar onSearch={handleSearch} initialValue={query} />

        {/* Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1, flexWrap: 'wrap' }}>
          <Badge badgeContent={activeFilterCount} color="primary">
            <Button startIcon={<FilterList />} variant="outlined" size="small" onClick={() => setFiltersOpen(true)}>
              Filters
            </Button>
          </Badge>

          {query && <Chip label={`"${query}"`} onDelete={() => handleSearch('')} size="small" />}
          {filters.division && (
            <Chip label={filters.division} size="small" color="info"
              onDelete={() => handleFilterChange({ ...filters, division: '' })} />
          )}

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {total} result{total !== 1 ? 's' : ''}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={sortBy} onChange={e => setSortBy(e.target.value)} displayEmpty>
                {SORT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Product grid */}
        <ProductCardGrid
          products={products}
          loading={loading}
          onAddToCart={handleAddToCart}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 4 }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}

        {!loading && products.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No products found. Try adjusting your search or filters.
          </Alert>
        )}
      </Container>

      {/* Filters drawer */}
      <ProductFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        families={families}
      />
    </Box>
  )
}
