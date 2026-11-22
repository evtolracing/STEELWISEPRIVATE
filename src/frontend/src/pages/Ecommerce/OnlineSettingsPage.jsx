/**
 * OnlineSettingsPage — Admin: checkout rules, cutoff times, allowed processes.
 *
 * Route: /admin/online-settings
 */
import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Container, Paper, Grid, TextField, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, Switch, Divider,
  Snackbar, Alert, Breadcrumbs, Link as MuiLink, CircularProgress,
  FormControlLabel, Checkbox, InputAdornment, MenuItem, IconButton,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material'
import {
  Save, Settings, Build, Refresh, ExpandMore, Delete, Add,
  LocalShipping,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'

import {
  getCheckoutRules, getAllowedProcesses,
  updateCheckoutRules,
} from '../../services/onlineEventsApi'
import {
  getAllLocationCutoffRules, updateLocationCutoffRules,
} from '../../services/cutoffRulesApi'

export default function OnlineSettingsPage() {
  const [rules, setRules] = useState(null)
  const [processes, setProcesses] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  // Per-location cutoff rules (new)
  const [cutoffRules, setCutoffRules] = useState([])
  const [selectedLocId, setSelectedLocId] = useState('')

  const loadAll = async () => {
    setLoading(true)
    try {
      const [rRes, pMetals, pPlastics, crRes] = await Promise.all([
        getCheckoutRules(),
        getAllowedProcesses('METALS'),
        getAllowedProcesses('PLASTICS'),
        getAllLocationCutoffRules(),
      ])
      setRules(rRes.data || {})
      setProcesses({ METALS: pMetals.data || [], PLASTICS: pPlastics.data || [] })
      const allRules = crRes.data || []
      setCutoffRules(allRules)
      if (allRules.length > 0 && !selectedLocId) setSelectedLocId(allRules[0].locationId)
      setLoadError(null)
    } catch (e) {
      // Said out loud: with nothing loaded the page would otherwise read as "no branch sells online".
      setLoadError(e?.message || 'The online settings could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const handleSaveRules = async () => {
    setSaving(true)
    try {
      await updateCheckoutRules(rules)
      setSnack({ open: true, msg: 'Checkout rules saved', severity: 'success' })
    } catch {
      setSnack({ open: true, msg: 'Failed to save rules', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const updateRule = (key, val) => setRules(r => ({ ...r, [key]: val }))

  // --- Cutoff Rules helpers ---
  const selectedRules = cutoffRules.find(r => r.locationId === selectedLocId)

  const updateDivisionRule = (div, key, val) => {
    setCutoffRules(prev => prev.map(r => r.locationId === selectedLocId ? {
      ...r,
      divisionRules: { ...r.divisionRules, [div]: { ...r.divisionRules[div], [key]: val } },
    } : r))
  }

  const toggleShipDay = (div, day) => {
    const current = selectedRules?.divisionRules[div]?.shipDays || []
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort()
    updateDivisionRule(div, 'shipDays', updated)
  }

  const addBlackout = () => {
    setCutoffRules(prev => prev.map(r => r.locationId === selectedLocId ? {
      ...r,
      blackoutWindows: [...(r.blackoutWindows || []), { start: '', end: '', reason: '' }],
    } : r))
  }

  const updateBlackout = (idx, key, val) => {
    setCutoffRules(prev => prev.map(r => r.locationId === selectedLocId ? {
      ...r,
      blackoutWindows: r.blackoutWindows.map((b, i) => i === idx ? { ...b, [key]: val } : b),
    } : r))
  }

  const removeBlackout = (idx) => {
    setCutoffRules(prev => prev.map(r => r.locationId === selectedLocId ? {
      ...r,
      blackoutWindows: r.blackoutWindows.filter((_, i) => i !== idx),
    } : r))
  }

  const handleSaveCutoffRules = async () => {
    if (!selectedRules) return
    setSaving(true)
    try {
      const saved = await updateLocationCutoffRules(selectedLocId, selectedRules)
      setCutoffRules(prev => prev.map(r => r.locationId === selectedLocId ? saved.data : r))
      setSnack({ open: true, msg: `Cutoff rules saved for ${selectedRules.locationName}`, severity: 'success' })
    } catch (e) {
      setSnack({ open: true, msg: e.message || 'Failed to save cutoff rules', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      {loadError && <Alert severity="error" sx={{ mb: 2 }} data-testid="online-settings-error" action={<Button color="inherit" size="small" onClick={loadAll}>Try again</Button>}>{loadError} Nothing shown below is from the server.</Alert>}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <Typography color="text.primary">Online Settings</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Settings color="primary" />
        <Typography component="h1" variant="h5" fontWeight={700}>Online Store Settings</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Checkout Rules */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings fontSize="small" /> Checkout Rules
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Auto-Approve Threshold"
                  type="number" value={rules?.autoApproveThreshold || 0}
                  onChange={e => updateRule('autoApproveThreshold', parseFloat(e.target.value))}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  helperText="Orders below this amount are auto-approved" size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Require Quote Above"
                  type="number" value={rules?.requireQuoteAbove || 0}
                  onChange={e => updateRule('requireQuoteAbove', parseFloat(e.target.value))}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  helperText="Orders above this amount require manual quote review" size="small" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Max Line Items" type="number" size="small"
                  value={rules?.maxLines || 50}
                  onChange={e => updateRule('maxLines', parseInt(e.target.value))} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Max Qty per Line" type="number" size="small"
                  value={rules?.maxQtyPerLine || 999}
                  onChange={e => updateRule('maxQtyPerLine', parseInt(e.target.value))} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={rules?.allowGuestCheckout ?? false}
                    onChange={e => updateRule('allowGuestCheckout', e.target.checked)} />}
                  label="Allow Guest Checkout (no account required)"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={rules?.requirePONumber ?? false}
                    onChange={e => updateRule('requirePONumber', e.target.checked)} />}
                  label="Require PO Number for Account customers"
                />
              </Grid>
            </Grid>

            <Button variant="contained" startIcon={<Save />} onClick={handleSaveRules}
              disabled={saving} sx={{ mt: 2 }} fullWidth>
              Save Checkout Rules
            </Button>
          </Paper>
        </Grid>

        {/* ─── Per-Location / Per-Division Cutoff Rules Editor ─── */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalShipping fontSize="small" /> Cutoff Rules (Per-Location / Per-Division)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Configure next-day shipping cutoff times, ship days, and blackout windows for each branch and division.
            </Typography>

            {/* Location picker */}
            <TextField
              select size="small" label="Select Location" value={selectedLocId}
              onChange={e => setSelectedLocId(e.target.value)}
              sx={{ minWidth: 250, mb: 2 }}
            >
              {cutoffRules.map(r => (
                <MenuItem key={r.locationId} value={r.locationId}>{r.locationName} ({r.timezone}){r.isSet ? '' : ', not set yet'}</MenuItem>
              ))}
            </TextField>

            {!loadError && cutoffRules.length === 0 && (
              <Alert severity="info" data-testid="cutoff-no-branches">No branch is set up to sell from yet. Add one under Admin, Locations.</Alert>
            )}
            {selectedRules && (
              <>
                {!selectedRules.isSet && (
                  <Alert severity="warning" sx={{ mb: 2 }} data-testid="cutoff-not-set">
                    Cut-off times are not set for {selectedRules.locationName} yet. Until they are saved, no next-day date is promised from this branch.
                  </Alert>
                )}
                {/* Per-division rules */}
                {Object.entries(selectedRules.divisionRules || {}).map(([div, dr]) => (
                  <Accordion key={div} defaultExpanded variant="outlined" sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Chip label={div} size="small" color={div === 'METALS' ? 'primary' : div === 'PLASTICS' ? 'success' : 'default'} sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" fontWeight={600}>
                        Cutoff {dr.cutoffLocal} • {dr.nextDayEnabled ? 'Next-Day ON' : 'Next-Day OFF'}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6} sm={3}>
                          <TextField size="small" type="time" fullWidth label="Cutoff Time"
                            value={dr.cutoffLocal || '15:00'}
                            onChange={e => updateDivisionRule(div, 'cutoffLocal', e.target.value)} />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <FormControlLabel
                            control={<Switch size="small" checked={dr.nextDayEnabled !== false}
                              onChange={e => updateDivisionRule(div, 'nextDayEnabled', e.target.checked)} />}
                            label="Next-Day Enabled"
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <FormControlLabel
                            control={<Switch size="small" checked={dr.pickupSameDayEnabled === true}
                              onChange={e => updateDivisionRule(div, 'pickupSameDayEnabled', e.target.checked)} />}
                            label="Same-Day Pickup"
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>Ship Days</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {DAY_LABELS.map((label, dayNum) => (
                              <Chip
                                key={dayNum} label={label} size="small"
                                color={(dr.shipDays || []).includes(dayNum) ? 'primary' : 'default'}
                                variant={(dr.shipDays || []).includes(dayNum) ? 'filled' : 'outlined'}
                                onClick={() => toggleShipDay(div, dayNum)}
                                sx={{ cursor: 'pointer', minWidth: 40 }}
                              />
                            ))}
                          </Box>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}

                {/* Blackout Windows */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    Blackout Windows
                  </Typography>
                  {(selectedRules.blackoutWindows || []).map((bw, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <TextField size="small" type="date" label="Start" value={bw.start}
                        onChange={e => updateBlackout(idx, 'start', e.target.value)}
                        InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                      <TextField size="small" type="date" label="End" value={bw.end}
                        onChange={e => updateBlackout(idx, 'end', e.target.value)}
                        InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                      <TextField size="small" label="Reason" value={bw.reason}
                        onChange={e => updateBlackout(idx, 'reason', e.target.value)}
                        sx={{ flex: 1 }} />
                      <IconButton aria-label="Delete" size="small" color="error" onClick={() => removeBlackout(idx)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button size="small" startIcon={<Add />} onClick={addBlackout}>Add Blackout</Button>
                </Box>

                <Button variant="contained" startIcon={<Save />} onClick={handleSaveCutoffRules}
                  disabled={saving} sx={{ mt: 2 }} fullWidth>
                  Save Cutoff Rules for {selectedRules.locationName}
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* Allowed Processes */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Build fontSize="small" /> Allowed Online Processes
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              These are the processing operations available to customers when ordering online. Manage the full process library in Operations settings.
            </Typography>

            <Grid container spacing={3}>
              {Object.entries(processes).map(([div, procs]) => (
                <Grid item xs={12} sm={6} key={div}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    <Chip label={div} size="small" color={div === 'METALS' ? 'primary' : 'success'} sx={{ mr: 0.5 }} />
                    {procs.length} process(es)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {procs.map(p => (
                      <Chip key={p.code || p.id} label={`${p.name} ($${p.pricePerOp})`}
                        size="small" variant="outlined" />
                    ))}
                    {procs.length === 0 && (
                      <Typography variant="caption" color="text.secondary">No processes configured</Typography>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Container>
  )
}
