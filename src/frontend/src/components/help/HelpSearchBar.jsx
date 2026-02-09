import React from 'react'
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

/**
 * Quick-filter chips — one per module so the user can jump straight to it.
 */
const DEFAULT_FILTERS = [
  { label: 'Order Intake', moduleId: 'order-intake' },
  { label: 'POS', moduleId: 'pos-retail' },
  { label: 'E-Commerce', moduleId: 'ecommerce-shop' },
  { label: 'Online Inbox', moduleId: 'online-inbox' },
  { label: 'Scheduling', moduleId: 'scheduling-capacity' },
  { label: 'Shop Floor', moduleId: 'shop-floor' },
  { label: 'Packaging', moduleId: 'packaging-drop-tags' },
  { label: 'Shipping', moduleId: 'shipping' },
  { label: 'Inventory', moduleId: 'inventory' },
  { label: 'Pricing', moduleId: 'pricing' },
  { label: 'Overrides', moduleId: 'overrides' },
  { label: 'Admin', moduleId: 'admin-settings' },
]

/**
 * HelpSearchBar — search input + quick-filter chips.
 *
 * Props:
 *   query              — current search text
 *   onQueryChange      — (newQuery) => void
 *   activeFilter       — currently selected moduleId (or null)
 *   onFilterChange     — (moduleId | null) => void
 *   resultCount        — number of matching modules (shown as hint)
 */
export default function HelpSearchBar({
  query = '',
  onQueryChange,
  activeFilter = null,
  onFilterChange,
  resultCount,
}) {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Search input */}
      <TextField
        fullWidth
        placeholder="Search the manual… (e.g., "how to create a shipment")"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 1.5,
          '& .MuiOutlinedInput-root': { borderRadius: 2 },
        }}
      />

      {/* Result hint */}
      {query.length >= 2 && resultCount !== undefined && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, mb: 1, display: 'block' }}>
          {resultCount === 0
            ? 'No results found. Try a different search term.'
            : `Found matches in ${resultCount} module${resultCount > 1 ? 's' : ''}`}
        </Typography>
      )}

      {/* Quick-filter chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {DEFAULT_FILTERS.map((f) => (
          <Chip
            key={f.moduleId}
            label={f.label}
            size="small"
            variant={activeFilter === f.moduleId ? 'filled' : 'outlined'}
            color={activeFilter === f.moduleId ? 'primary' : 'default'}
            onClick={() =>
              onFilterChange(activeFilter === f.moduleId ? null : f.moduleId)
            }
            sx={{ cursor: 'pointer', fontSize: 12 }}
          />
        ))}
      </Box>
    </Box>
  )
}
