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
  { label: 'Command Center', moduleId: 'command-center' },
  { label: 'Executive', moduleId: 'executive' },
  { label: 'Order Board', moduleId: 'order-board' },
  { label: 'Order Intake', moduleId: 'order-intake' },
  { label: 'POS', moduleId: 'pos-retail' },
  { label: 'E-Commerce', moduleId: 'ecommerce-shop' },
  { label: 'E-Com Admin', moduleId: 'ecommerce-admin' },
  { label: 'Online Inbox', moduleId: 'online-inbox' },
  { label: 'Mobile Rep', moduleId: 'mobile-rep' },
  { label: 'Customers', moduleId: 'customers' },
  { label: 'Sales & Quoting', moduleId: 'sales-quoting' },
  { label: 'Commercial', moduleId: 'commercial' },
  { label: 'Materials', moduleId: 'materials' },
  { label: 'Receiving', moduleId: 'receiving' },
  { label: 'Scheduling', moduleId: 'scheduling-capacity' },
  { label: 'Planning', moduleId: 'planning' },
  { label: 'Shop Floor', moduleId: 'shop-floor' },
  { label: 'Time Tracking', moduleId: 'time-tracking' },
  { label: 'Packaging', moduleId: 'packaging-drop-tags' },
  { label: 'Pkg & Custody', moduleId: 'packaging-custody' },
  { label: 'Drop Tags', moduleId: 'drop-tag-engine' },
  { label: 'Shipping', moduleId: 'shipping' },
  { label: 'Logistics', moduleId: 'logistics' },
  { label: 'Freight', moduleId: 'freight-delivery' },
  { label: 'Inventory', moduleId: 'inventory' },
  { label: 'Pricing', moduleId: 'pricing' },
  { label: 'Quality', moduleId: 'quality-compliance' },
  { label: 'Supplier Quality', moduleId: 'supplier-quality' },
  { label: 'Customer Quality', moduleId: 'customer-quality' },
  { label: 'Prod. Quality', moduleId: 'production-quality' },
  { label: 'Maintenance', moduleId: 'maintenance' },
  { label: 'Contractors', moduleId: 'contractor-portal' },
  { label: 'Training', moduleId: 'training-engine' },
  { label: 'Safety & EHS', moduleId: 'safety-ehs' },
  { label: 'Enterprise Acct', moduleId: 'enterprise-account' },
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
        placeholder="Search the manual… (e.g., 'how to create a shipment')"
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
