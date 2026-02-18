/**
 * SpecOverridePanel — Reusable tolerance & spec override editor.
 *
 * Used in:
 * - RfqDetailPage (per quote line)
 * - OrderDetailPage (per order line)
 * - JobPlanningDialog (per job)
 *
 * Shows inherited specs from the parent level and allows overrides.
 *
 * Props:
 *   specs          — { tolerancePreset, thkTolerancePlus, thkToleranceMinus, ... }
 *   onChange       — (updatedSpecs) => void
 *   inheritedFrom  — 'customer' | 'quote' | 'order' | null  (label for the "inherited" chip)
 *   compact        — if true, shows a collapsed view with expand toggle
 *   readOnly       — if true, disables editing
 */
import React, { useState } from 'react'
import {
  Box, Typography, Grid, TextField, FormControl, InputLabel, Select, MenuItem,
  InputAdornment, Chip, Checkbox, FormControlLabel, FormGroup, Divider,
  Collapse, IconButton, Paper, Tooltip, Stack,
} from '@mui/material'
import {
  ExpandMore, ExpandLess, Straighten, VerifiedUser, Info,
} from '@mui/icons-material'

import {
  TOLERANCE_PRESETS, CERT_OPTIONS, SURFACE_FINISHES, STEEL_GRADES,
} from '../../services/customerPreferencesApi'

export default function SpecOverridePanel({
  specs = {},
  onChange,
  inheritedFrom = null,
  compact = true,
  readOnly = false,
}) {
  const [expanded, setExpanded] = useState(!compact)

  const update = (field, value) => {
    if (readOnly) return
    onChange({ ...specs, [field]: value })
  }

  const handlePresetChange = (preset) => {
    const tp = TOLERANCE_PRESETS.find(t => t.value === preset)
    const next = { ...specs, tolerancePreset: preset }
    if (tp && tp.thkPlus != null) {
      next.thkTolerancePlus = tp.thkPlus
      next.thkToleranceMinus = tp.thkMinus
      next.lenTolerancePlus = tp.lenPlus
      next.lenToleranceMinus = tp.lenMinus
      next.widTolerancePlus = tp.widPlus
      next.widToleranceMinus = tp.widMinus
    }
    onChange(next)
  }

  const toggleCert = (certVal) => {
    const certs = specs.certRequirements || []
    const next = certs.includes(certVal)
      ? certs.filter(c => c !== certVal)
      : [...certs, certVal]
    update('certRequirements', next)
  }

  // Count how many spec fields have values
  const specCount = [
    specs.tolerancePreset,
    specs.surfaceFinish,
    (specs.certRequirements || []).length > 0 ? 'certs' : null,
    specs.specNotes,
    specs.gradeOverride,
  ].filter(Boolean).length

  const inheritLabel = inheritedFrom
    ? `Inheriting from ${inheritedFrom === 'customer' ? 'Customer Prefs' : inheritedFrom === 'quote' ? 'Quote' : 'Order'}`
    : null

  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
      {/* Header — always visible */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Straighten fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={700}>
            Specs & Tolerances
          </Typography>
          {specCount > 0 && (
            <Chip label={`${specCount} set`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
          )}
          {inheritLabel && (
            <Tooltip title={inheritLabel}>
              <Chip icon={<Info sx={{ fontSize: 14 }} />} label={inheritLabel} size="small"
                color="info" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            </Tooltip>
          )}
        </Box>
        {compact && (
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 1.5 }}>
          {/* Tolerance Preset + Dimension Tolerances */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Preset</InputLabel>
                <Select value={specs.tolerancePreset || ''} label="Preset"
                  onChange={e => handlePresetChange(e.target.value)}>
                  <MenuItem value="">Inherit</MenuItem>
                  {TOLERANCE_PRESETS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Per-dimension table */}
          <Box sx={{ border: 1, borderColor: 'grey.200', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
            <Grid container sx={{ bgcolor: 'grey.100', px: 1.5, py: 0.5 }}>
              <Grid item xs={3}><Typography variant="caption" fontWeight={700} color="text.secondary">DIM</Typography></Grid>
              <Grid item xs={4.5}><Typography variant="caption" fontWeight={700} color="text.secondary">PLUS (+) in</Typography></Grid>
              <Grid item xs={4.5}><Typography variant="caption" fontWeight={700} color="text.secondary">MINUS (−) in</Typography></Grid>
            </Grid>
            <Divider />
            {/* Thickness */}
            <Grid container alignItems="center" sx={{ px: 1.5, py: 1 }}>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600} fontSize="0.8rem">Thickness</Typography></Grid>
              <Grid item xs={4.5} sx={{ pr: 0.5 }}>
                <TextField size="small" type="number" fullWidth disabled={readOnly}
                  value={specs.thkTolerancePlus ?? ''} placeholder="Inherit"
                  onChange={e => { update('thkTolerancePlus', parseFloat(e.target.value) || 0); update('tolerancePreset', 'CUSTOM') }}
                  InputProps={{ startAdornment: <InputAdornment position="start">+</InputAdornment> }}
                  inputProps={{ step: 0.001, min: 0, style: { fontSize: '0.8rem' } }} />
              </Grid>
              <Grid item xs={4.5}>
                <TextField size="small" type="number" fullWidth disabled={readOnly}
                  value={specs.thkToleranceMinus ?? ''} placeholder="Inherit"
                  onChange={e => { update('thkToleranceMinus', parseFloat(e.target.value) || 0); update('tolerancePreset', 'CUSTOM') }}
                  InputProps={{ startAdornment: <InputAdornment position="start">−</InputAdornment> }}
                  inputProps={{ step: 0.001, min: 0, style: { fontSize: '0.8rem' } }} />
              </Grid>
            </Grid>
            <Divider />
            {/* Length */}
            <Grid container alignItems="center" sx={{ px: 1.5, py: 1 }}>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600} fontSize="0.8rem">Length</Typography></Grid>
              <Grid item xs={4.5} sx={{ pr: 0.5 }}>
                <TextField size="small" type="number" fullWidth disabled={readOnly}
                  value={specs.lenTolerancePlus ?? ''} placeholder="Inherit"
                  onChange={e => { update('lenTolerancePlus', parseFloat(e.target.value) || 0); update('tolerancePreset', 'CUSTOM') }}
                  InputProps={{ startAdornment: <InputAdornment position="start">+</InputAdornment> }}
                  inputProps={{ step: 0.001, min: 0, style: { fontSize: '0.8rem' } }} />
              </Grid>
              <Grid item xs={4.5}>
                <TextField size="small" type="number" fullWidth disabled={readOnly}
                  value={specs.lenToleranceMinus ?? ''} placeholder="Inherit"
                  onChange={e => { update('lenToleranceMinus', parseFloat(e.target.value) || 0); update('tolerancePreset', 'CUSTOM') }}
                  InputProps={{ startAdornment: <InputAdornment position="start">−</InputAdornment> }}
                  inputProps={{ step: 0.001, min: 0, style: { fontSize: '0.8rem' } }} />
              </Grid>
            </Grid>
            <Divider />
            {/* Width */}
            <Grid container alignItems="center" sx={{ px: 1.5, py: 1 }}>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600} fontSize="0.8rem">Width</Typography></Grid>
              <Grid item xs={4.5} sx={{ pr: 0.5 }}>
                <TextField size="small" type="number" fullWidth disabled={readOnly}
                  value={specs.widTolerancePlus ?? ''} placeholder="Inherit"
                  onChange={e => { update('widTolerancePlus', parseFloat(e.target.value) || 0); update('tolerancePreset', 'CUSTOM') }}
                  InputProps={{ startAdornment: <InputAdornment position="start">+</InputAdornment> }}
                  inputProps={{ step: 0.001, min: 0, style: { fontSize: '0.8rem' } }} />
              </Grid>
              <Grid item xs={4.5}>
                <TextField size="small" type="number" fullWidth disabled={readOnly}
                  value={specs.widToleranceMinus ?? ''} placeholder="Inherit"
                  onChange={e => { update('widToleranceMinus', parseFloat(e.target.value) || 0); update('tolerancePreset', 'CUSTOM') }}
                  InputProps={{ startAdornment: <InputAdornment position="start">−</InputAdornment> }}
                  inputProps={{ step: 0.001, min: 0, style: { fontSize: '0.8rem' } }} />
              </Grid>
            </Grid>
          </Box>

          {/* Surface Finish + Grade */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Surface Finish</InputLabel>
                <Select value={specs.surfaceFinish || ''} label="Surface Finish"
                  onChange={e => update('surfaceFinish', e.target.value)}>
                  <MenuItem value="">Inherit</MenuItem>
                  {SURFACE_FINISHES.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Grade Override" disabled={readOnly}
                value={specs.gradeOverride || ''} placeholder="Inherit from item"
                onChange={e => update('gradeOverride', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Spec Notes" disabled={readOnly}
                value={specs.specNotes || ''} placeholder="e.g. NACE MR0175"
                onChange={e => update('specNotes', e.target.value)} />
            </Grid>
          </Grid>

          {/* Cert Requirements */}
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <VerifiedUser sx={{ fontSize: 14 }} /> Cert Requirements
          </Typography>
          <FormGroup row sx={{ gap: 0.5 }}>
            {CERT_OPTIONS.map(cert => (
              <FormControlLabel key={cert.value}
                control={<Checkbox size="small" disabled={readOnly}
                  checked={(specs.certRequirements || []).includes(cert.value)}
                  onChange={() => toggleCert(cert.value)} />}
                label={<Typography variant="caption">{cert.label}</Typography>}
                sx={{
                  border: 1,
                  borderColor: (specs.certRequirements || []).includes(cert.value) ? 'primary.main' : 'grey.200',
                  borderRadius: 1, px: 0.5, mr: 0,
                  bgcolor: (specs.certRequirements || []).includes(cert.value) ? 'primary.50' : 'transparent',
                }}
              />
            ))}
          </FormGroup>
        </Box>
      </Collapse>
    </Paper>
  )
}
