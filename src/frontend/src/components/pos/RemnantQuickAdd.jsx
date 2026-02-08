/**
 * RemnantQuickAdd.jsx — POS one-click remnant add panel.
 *
 * Sits inside RetailPOSPage as a quick-access panel showing
 * available remnants at the current location with aging badges
 * and instant add-to-cart action.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Typography, Button, Chip, Grid, IconButton, Tooltip,
  CircularProgress, Alert, Divider, Badge,
} from '@mui/material'
import {
  Recycling        as RemnantIcon,
  AddShoppingCart   as AddCartIcon,
  Schedule         as ClockIcon,
  Star             as GradeIcon,
  Refresh          as RefreshIcon,
  Straighten       as DimIcon,
  LocalOffer       as TagIcon,
  ExpandMore       as ExpandIcon,
  ExpandLess       as CollapseIcon,
} from '@mui/icons-material'
import { searchRemnants, getAgeDays, getAgingBucket, REMNANT_CONDITION } from '../../services/remnantInventoryApi'
import { calculateRemnantPrice } from '../../services/remnantPricingApi'

const fmt = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/**
 * @param {{ onAddToCart: (item) => void, location?: string }} props
 */
export default function RemnantQuickAdd({ onAddToCart, location = 'JACKSON' }) {
  const [remnants, setRemnants] = useState([])
  const [pricing, setPricing] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  const loadRemnants = useCallback(async () => {
    setLoading(true)
    try {
      const res = await searchRemnants({
        location,
        sortBy: 'cutDate',
        sortDir: 'asc', // oldest first — push aged stock
        limit: 8,
      })
      const items = res.data || []
      setRemnants(items)

      // Calculate pricing
      const priceMap = {}
      for (const r of items) {
        try {
          const p = await calculateRemnantPrice({
            grade: r.grade,
            condition: r.condition,
            ageDays: getAgeDays(r.cutDate),
            weight: r.estimatedWeight,
            family: r.family,
          })
          priceMap[r.id] = p
        } catch { /* ignore */ }
      }
      setPricing(priceMap)
    } catch { /* swallow */ }
    setLoading(false)
  }, [location])

  useEffect(() => { loadRemnants() }, [loadRemnants])

  const handleAdd = (remnant) => {
    const price = pricing[remnant.id]
    onAddToCart({
      id: remnant.id,
      productId: remnant.id,
      name: remnant.name,
      description: remnant.name,
      basePrice: price?.remnantPricePerLb || remnant.pricePerLb,
      price: price?.lineTotal || remnant.estimatedWeight * remnant.pricePerLb,
      unitCost: price?.remnantPricePerLb || remnant.pricePerLb,
      isRemnant: true,
      remnantDiscount: price?.totalDiscountPct || 25,
      sku: remnant.sku,
      uom: 'EA',
      weight: remnant.estimatedWeight,
      qtyOnHand: remnant.qtyAvailable,
    })
  }

  const totalPieces = remnants.reduce((s, r) => s + r.qtyAvailable, 0)

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        border: '2px solid',
        borderColor: '#2e7d32',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: '#e8f5e9',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Badge badgeContent={totalPieces} color="success">
          <RemnantIcon sx={{ color: '#2e7d32' }} />
        </Badge>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1b5e20' }}>
            Quick Remnants
          </Typography>
          <Typography variant="caption" color="text.secondary">
            One-click add · Oldest first · {location.replace(/_/g, ' ')}
          </Typography>
        </Box>
        <IconButton size="small" onClick={e => { e.stopPropagation(); loadRemnants() }}>
          <RefreshIcon fontSize="small" />
        </IconButton>
        {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
      </Box>

      {/* Content */}
      {expanded && (
        <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : remnants.length === 0 ? (
            <Alert severity="info" sx={{ m: 1 }}>No remnants at this location</Alert>
          ) : (
            remnants.map((r, idx) => {
              const price = pricing[r.id]
              const bucket = getAgingBucket(r.cutDate)
              const condDef = REMNANT_CONDITION[r.condition]

              return (
                <Box key={r.id}>
                  <Box sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'flex-start', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    {/* Age indicator bar */}
                    <Box sx={{ width: 4, minHeight: 60, borderRadius: 1, bgcolor: bucket.color, flexShrink: 0 }} />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Title + badges */}
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
                        {r.grade} {r.form} — {r.thickness}" × {r.width}" × {r.length}"
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                        <Chip
                          icon={<ClockIcon />}
                          label={`${getAgeDays(r.cutDate)}d`}
                          size="small"
                          sx={{ bgcolor: `${bucket.color}18`, color: bucket.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                        />
                        <Chip
                          label={`Gr ${r.condition}`}
                          size="small"
                          sx={{ bgcolor: `${condDef?.color || '#666'}18`, color: condDef?.color || '#666', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                        />
                        {r.qtyAvailable <= 1 && (
                          <Chip label="Last One!" size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                        )}
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        {r.estimatedWeight} lbs · {r.locationName}
                      </Typography>
                    </Box>

                    {/* Price + add button */}
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography variant="body2" fontWeight={700} color="error.main">
                        {price ? fmt(price.lineTotal) : fmt(r.estimatedWeight * r.pricePerLb)}
                      </Typography>
                      {price?.totalDiscountPct > 0 && (
                        <Typography variant="caption" color="success.main" fontWeight={600}>
                          −{Math.round(price.totalDiscountPct)}%
                        </Typography>
                      )}
                      <Box sx={{ mt: 0.5 }}>
                        <Tooltip title="Add to cart">
                          <IconButton size="small" color="success" onClick={() => handleAdd(r)} sx={{ bgcolor: '#e8f5e9' }}>
                            <AddCartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                  {idx < remnants.length - 1 && <Divider />}
                </Box>
              )
            })
          )}
        </Box>
      )}
    </Paper>
  )
}
