/**
 * RemnantFilterPanel.jsx — Filter sidebar for remnant browsing.
 *
 * Provides:
 *   - Grade filter (A36, 304, 6061-T6…)
 *   - Form filter (PLATE, SHEET, BAR…)
 *   - Aging bucket toggle (Fresh / 30+ / 60+ / 90+)
 *   - Condition grade (A / B / C)
 *   - Dimension range sliders
 *   - Location filter
 *   - Sort controls
 */
import React, { useState } from 'react'
import {
  Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem,
  Chip, ToggleButtonGroup, ToggleButton, TextField, Button, Divider,
  Accordion, AccordionSummary, AccordionDetails, Grid, Tooltip,
} from '@mui/material'
import {
  ExpandMore    as ExpandIcon,
  FilterList    as FilterIcon,
  Schedule      as ClockIcon,
  Star          as GradeIcon,
  Straighten    as DimIcon,
  Clear         as ClearIcon,
  Sort          as SortIcon,
} from '@mui/icons-material'
import {
  AGING_BUCKET, REMNANT_CONDITION, REMNANT_TYPE,
} from '../../services/remnantInventoryApi'

const SORT_OPTIONS = [
  { value: 'cutDate-desc', label: 'Newest First' },
  { value: 'cutDate-asc', label: 'Oldest First (push aged)' },
  { value: 'price-asc', label: 'Lowest Price' },
  { value: 'price-desc', label: 'Highest Price' },
  { value: 'weight-desc', label: 'Heaviest First' },
  { value: 'weight-asc', label: 'Lightest First' },
]

/**
 * @param {{ filters, facets, onChange, onClear }} props
 *   filters: { grade, form, family, location, condition, agingBucket, type, minThickness, maxThickness, minWidth, maxWidth, minLength, maxLength, sortBy, sortDir }
 *   facets: { grades[], forms[], families[], locations[], conditions[], types[], agingBuckets[] }
 */
export default function RemnantFilterPanel({ filters = {}, facets = {}, onChange, onClear }) {
  const update = (key, val) => onChange({ ...filters, [key]: val })

  const activeCount = Object.values(filters).filter(v => v != null && v !== '').length

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <FilterIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Filters</Typography>
        {activeCount > 0 && (
          <Chip label={`${activeCount} active`} size="small" color="primary" onDelete={onClear} deleteIcon={<ClearIcon />} />
        )}
      </Box>

      {/* Sort */}
      <Box sx={{ px: 1.5, py: 1 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Sort By</InputLabel>
          <Select
            value={`${filters.sortBy || 'cutDate'}-${filters.sortDir || 'desc'}`}
            label="Sort By"
            onChange={e => {
              const [sortBy, sortDir] = e.target.value.split('-')
              onChange({ ...filters, sortBy, sortDir })
            }}
          >
            {SORT_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider />

      {/* Aging Bucket */}
      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <ClockIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={600}>Age</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <ToggleButtonGroup
            value={filters.agingBucket || ''}
            exclusive
            size="small"
            onChange={(_, val) => update('agingBucket', val)}
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
          >
            {Object.entries(AGING_BUCKET).map(([key, bucket]) => (
              <ToggleButton key={key} value={key} sx={{ fontSize: '0.7rem', px: 1.5, borderColor: `${bucket.color}60` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: bucket.color }} />
                  {bucket.label}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </AccordionDetails>
      </Accordion>

      {/* Condition */}
      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <GradeIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={600}>Condition</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <ToggleButtonGroup
            value={filters.condition || ''}
            exclusive
            size="small"
            onChange={(_, val) => update('condition', val)}
          >
            {Object.entries(REMNANT_CONDITION).map(([key, def]) => (
              <Tooltip key={key} title={def.label}>
                <ToggleButton value={key} sx={{ px: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: def.color, mr: 0.5 }} />
                  Grade {key}
                </ToggleButton>
              </Tooltip>
            ))}
          </ToggleButtonGroup>
        </AccordionDetails>
      </Accordion>

      {/* Grade */}
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography variant="body2" fontWeight={600}>Material Grade</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <FormControl fullWidth size="small">
            <Select value={filters.grade || ''} displayEmpty onChange={e => update('grade', e.target.value)}>
              <MenuItem value="">All Grades</MenuItem>
              {(facets.grades || []).map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      {/* Form */}
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography variant="body2" fontWeight={600}>Form</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <FormControl fullWidth size="small">
            <Select value={filters.form || ''} displayEmpty onChange={e => update('form', e.target.value)}>
              <MenuItem value="">All Forms</MenuItem>
              {(facets.forms || []).map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      {/* Location */}
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography variant="body2" fontWeight={600}>Location</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <FormControl fullWidth size="small">
            <Select value={filters.location || ''} displayEmpty onChange={e => update('location', e.target.value)}>
              <MenuItem value="">All Locations</MenuItem>
              {(facets.locations || []).map(l => <MenuItem key={l} value={l}>{l.replace(/_/g, ' ')}</MenuItem>)}
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      {/* Dimensions */}
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <DimIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={600}>Dimensions</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <TextField size="small" fullWidth label='Min Thick"' type="number" inputProps={{ step: 0.125 }}
                value={filters.minThickness || ''} onChange={e => update('minThickness', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField size="small" fullWidth label='Max Thick"' type="number" inputProps={{ step: 0.125 }}
                value={filters.maxThickness || ''} onChange={e => update('maxThickness', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField size="small" fullWidth label='Min Width"' type="number" inputProps={{ step: 1 }}
                value={filters.minWidth || ''} onChange={e => update('minWidth', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField size="small" fullWidth label='Max Width"' type="number" inputProps={{ step: 1 }}
                value={filters.maxWidth || ''} onChange={e => update('maxWidth', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField size="small" fullWidth label='Min Length"' type="number" inputProps={{ step: 1 }}
                value={filters.minLength || ''} onChange={e => update('minLength', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField size="small" fullWidth label='Max Length"' type="number" inputProps={{ step: 1 }}
                value={filters.maxLength || ''} onChange={e => update('maxLength', e.target.value)} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Clear button */}
      {activeCount > 0 && (
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button fullWidth size="small" color="error" startIcon={<ClearIcon />} onClick={onClear}>
            Clear All Filters
          </Button>
        </Box>
      )}
    </Paper>
  )
}
