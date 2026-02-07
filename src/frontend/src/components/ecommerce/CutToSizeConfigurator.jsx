/**
 * CutToSizeConfigurator — dimensions + quantity entry for cut-to-size products.
 */
import React from 'react'
import { Box, Paper, Typography, TextField, Grid, MenuItem, FormControl, InputLabel, Select, Alert } from '@mui/material'
import { ContentCut as CutIcon } from '@mui/icons-material'

const UNITS = ['in', 'ft', 'mm']

export default function CutToSizeConfigurator({ config, onChange, product, disabled = false }) {
  const dims = config.dimensions || {}
  const setDim = (key, val) => onChange({ ...config, dimensions: { ...dims, [key]: val } })
  const setField = (key, val) => onChange({ ...config, [key]: val })

  const isBar = product?.form === 'BAR' || product?.form === 'ROD'
  const isSheet = product?.form === 'SHEET' || product?.form === 'PLATE'

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CutIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={600}>Cut-to-Size Configuration</Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Thickness / Diameter */}
        <Grid item xs={6} sm={3}>
          {product?.thicknessOptions?.length > 0 ? (
            <FormControl fullWidth size="small" disabled={disabled}>
              <InputLabel>{isBar ? 'Diameter' : 'Thickness'}</InputLabel>
              <Select value={dims.thickness || ''} label={isBar ? 'Diameter' : 'Thickness'} onChange={e => setDim('thickness', e.target.value)}>
                {product.thicknessOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </FormControl>
          ) : (
            <TextField size="small" fullWidth label={isBar ? 'Diameter' : 'Thickness'} value={dims.thickness || ''} onChange={e => setDim('thickness', e.target.value)} disabled={disabled} />
          )}
        </Grid>

        {/* Width (not for bar/rod) */}
        {!isBar && (
          <Grid item xs={6} sm={3}>
            {product?.widthOptions?.length > 0 ? (
              <FormControl fullWidth size="small" disabled={disabled}>
                <InputLabel>Width</InputLabel>
                <Select value={dims.width || ''} label="Width" onChange={e => setDim('width', e.target.value)}>
                  {product.widthOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </Select>
              </FormControl>
            ) : (
              <TextField size="small" fullWidth label="Width" value={dims.width || ''} onChange={e => setDim('width', e.target.value)} disabled={disabled} />
            )}
          </Grid>
        )}

        {/* Length */}
        <Grid item xs={6} sm={3}>
          {product?.lengthOptions?.length > 0 ? (
            <FormControl fullWidth size="small" disabled={disabled}>
              <InputLabel>Length</InputLabel>
              <Select value={dims.length || ''} label="Length" onChange={e => setDim('length', e.target.value)}>
                {product.lengthOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </FormControl>
          ) : (
            <TextField size="small" fullWidth label="Length" value={dims.length || ''} onChange={e => setDim('length', e.target.value)} disabled={disabled} />
          )}
        </Grid>

        {/* Unit */}
        <Grid item xs={6} sm={3}>
          <FormControl fullWidth size="small" disabled={disabled}>
            <InputLabel>Unit</InputLabel>
            <Select value={dims.unit || 'in'} label="Unit" onChange={e => setDim('unit', e.target.value)}>
              {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        {/* Quantity */}
        <Grid item xs={6} sm={3}>
          <TextField size="small" fullWidth label="Quantity" type="number" inputProps={{ min: 1 }} value={config.qty || 1} onChange={e => setField('qty', Math.max(1, parseInt(e.target.value) || 1))} disabled={disabled} />
        </Grid>

        {/* Tolerance */}
        <Grid item xs={6} sm={3}>
          <FormControl fullWidth size="small" disabled={disabled}>
            <InputLabel>Tolerance</InputLabel>
            <Select value={config.tolerance || 'STANDARD'} label="Tolerance" onChange={e => setField('tolerance', e.target.value)}>
              <MenuItem value="STANDARD">Standard (±1/16")</MenuItem>
              <MenuItem value="CLOSE">Close (±1/32")</MenuItem>
              <MenuItem value="PRECISION">Precision (±0.005")</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Finish */}
        {isSheet && (
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small" disabled={disabled}>
              <InputLabel>Edge Quality</InputLabel>
              <Select value={config.finish || 'MILL'} label="Edge Quality" onChange={e => setField('finish', e.target.value)}>
                <MenuItem value="MILL">Mill Edge</MenuItem>
                <MenuItem value="DEBURRED">Deburred</MenuItem>
                <MenuItem value="GROUND">Ground</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

      {product?.isRemnant && (
        <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
          Remnant items are sold as-is. Cut-to-size is not available for remnants.
        </Alert>
      )}
    </Paper>
  )
}
