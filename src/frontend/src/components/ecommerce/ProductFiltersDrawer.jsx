/**
 * ProductFiltersDrawer — sidebar filters for search results.
 */
import React from 'react'
import {
  Drawer, Box, Typography, FormControl, FormGroup, FormControlLabel,
  Checkbox, Divider, RadioGroup, Radio, Button, IconButton, Chip,
} from '@mui/material'
import { Close as CloseIcon, FilterList as FilterIcon } from '@mui/icons-material'

const FORMS = ['PLATE', 'SHEET', 'BAR', 'ROD', 'TUBE', 'ANGLE', 'SUPPLY']

export default function ProductFiltersDrawer({
  open, onClose, filters, onFilterChange,
  families = [], divisions = [],
}) {
  const set = (key, val) => onFilterChange({ ...filters, [key]: val })
  const toggle = (key, val) => {
    const arr = filters[key] || []
    set(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const activeCount = Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length

  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: 300, p: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>Filters</Typography>
          {activeCount > 0 && <Chip label={activeCount} size="small" color="primary" />}
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      {/* Division */}
      <Typography variant="overline" color="text.secondary">Division</Typography>
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <RadioGroup value={filters.division || ''} onChange={e => set('division', e.target.value || null)}>
          <FormControlLabel value="" control={<Radio size="small" />} label="All Divisions" />
          {divisions.map(d => (
            <FormControlLabel key={d.id || d} value={d.id || d} control={<Radio size="small" />} label={d.name || d} />
          ))}
        </RadioGroup>
      </FormControl>
      <Divider sx={{ mb: 2 }} />

      {/* Form/Shape */}
      <Typography variant="overline" color="text.secondary">Form / Shape</Typography>
      <FormGroup sx={{ mb: 2 }}>
        {FORMS.map(f => (
          <FormControlLabel key={f} control={<Checkbox size="small" checked={(filters.forms || []).includes(f)} onChange={() => toggle('forms', f)} />} label={f} />
        ))}
      </FormGroup>
      <Divider sx={{ mb: 2 }} />

      {/* Family */}
      {families.length > 0 && (
        <>
          <Typography variant="overline" color="text.secondary">Material Family</Typography>
          <FormGroup sx={{ mb: 2 }}>
            {families.map(f => (
              <FormControlLabel key={f} control={<Checkbox size="small" checked={(filters.families || []).includes(f)} onChange={() => toggle('families', f)} />} label={f} />
            ))}
          </FormGroup>
          <Divider sx={{ mb: 2 }} />
        </>
      )}

      {/* In Stock */}
      <FormControlLabel
        control={<Checkbox checked={!!filters.inStockOnly} onChange={e => set('inStockOnly', e.target.checked)} />}
        label="In Stock Only"
        sx={{ mb: 2 }}
      />

      <Button fullWidth variant="outlined" color="secondary" onClick={() => onFilterChange({})}>Clear All Filters</Button>
    </Drawer>
  )
}
