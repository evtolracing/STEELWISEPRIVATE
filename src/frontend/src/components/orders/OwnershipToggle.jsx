/**
 * OwnershipToggle — HOUSE (sell from inventory) vs CUSTOMER_MATERIAL (toll processing)
 */
import React from 'react'
import { ToggleButtonGroup, ToggleButton, Typography, Box } from '@mui/material'
import { Warehouse as HouseIcon, PersonPin as CustIcon } from '@mui/icons-material'

export default function OwnershipToggle({ value = 'HOUSE', onChange, size = 'small' }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        Material Ownership
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, v) => v && onChange(v)}
        size={size}
        color="primary"
      >
        <ToggleButton value="HOUSE" sx={{ textTransform: 'none', gap: 0.5 }}>
          <HouseIcon fontSize="small" /> House Stock
        </ToggleButton>
        <ToggleButton value="CUSTOMER_MATERIAL" sx={{ textTransform: 'none', gap: 0.5 }}>
          <CustIcon fontSize="small" /> Customer Material
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
