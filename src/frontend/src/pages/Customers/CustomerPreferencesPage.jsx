/**
 * CustomerPreferencesPage — Preference editor for CSR / Admin.
 *
 * Route: /customers/preferences
 *
 * Left panel: customer list with preference badges.
 * Right panel: full preference form with save / reset.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardActionArea,
  Chip, Button, Divider, Avatar, TextField, Alert, Snackbar, Stack,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  IconButton, Tooltip, CircularProgress, List, ListItem, ListItemAvatar,
  ListItemText, ListItemSecondaryAction, InputAdornment, Checkbox,
  FormGroup,
} from '@mui/material'
import {
  Tune, Save, Refresh, Search, Person, LocationOn, LocalShipping,
  Speed, VerifiedUser, DeleteOutline, CheckCircle, Warning, Info,
  Business, Notes, Straighten, Inventory,
} from '@mui/icons-material'

import {
  getCustomerPreferences,
  saveCustomerPreferences,
  listCustomersWithPreferences,
  resetCustomerPreferences,
  DEFAULT_PREFS,
  SHIP_METHODS,
  CERT_OPTIONS,
  TOLERANCE_PRESETS,
  BRANCHES,
  PRIORITIES,
  DIVISIONS,
  summarizePreferences,
} from '../../services/customerPreferencesApi'

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function CustomerPreferencesPage() {
  // Customer list
  const [customers, setCustomers] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selected customer + prefs
  const [selectedId, setSelectedId] = useState(null)
  const [prefs, setPrefs] = useState({ ...DEFAULT_PREFS })
  const [hasPreferences, setHasPreferences] = useState(false)
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  // ── Load customer list ──
  const loadCustomers = useCallback(async () => {
    setListLoading(true)
    try {
      const { data } = await listCustomersWithPreferences()
      setCustomers(data)
    } catch (err) {
      console.error('Failed to load customers', err)
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  // ── Load prefs for selected customer ──
  const loadPrefs = useCallback(async (custId) => {
    setPrefsLoading(true)
    try {
      const res = await getCustomerPreferences(custId)
      setPrefs({ ...DEFAULT_PREFS, ...res.data })
      setHasPreferences(res.hasPreferences)
      setDirty(false)
    } catch {
      setPrefs({ ...DEFAULT_PREFS })
      setHasPreferences(false)
    } finally {
      setPrefsLoading(false)
    }
  }, [])

  const handleSelectCustomer = useCallback((custId) => {
    setSelectedId(custId)
    loadPrefs(custId)
  }, [loadPrefs])

  // ── Update a preference field ──
  const updateField = useCallback((field, value) => {
    setPrefs(prev => ({ ...prev, [field]: value }))
    setDirty(true)
  }, [])

  // Tolerance preset handler
  const handleTolerancePreset = useCallback((preset) => {
    const tp = TOLERANCE_PRESETS.find(t => t.value === preset)
    setPrefs(prev => ({
      ...prev,
      tolerancePreset: preset,
      ...(tp && tp.plus != null ? { tolerancePlus: tp.plus, toleranceMinus: tp.minus } : {}),
    }))
    setDirty(true)
  }, [])

  // Cert toggle handler
  const handleCertToggle = useCallback((certValue) => {
    setPrefs(prev => {
      const certs = prev.certRequirements || []
      const next = certs.includes(certValue)
        ? certs.filter(c => c !== certValue)
        : [...certs, certValue]
      return { ...prev, certRequirements: next }
    })
    setDirty(true)
  }, [])

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await saveCustomerPreferences(selectedId, prefs)
      setSnack({ open: true, msg: 'Preferences saved successfully', severity: 'success' })
      setDirty(false)
      setHasPreferences(true)
      loadCustomers() // refresh badges
    } catch {
      setSnack({ open: true, msg: 'Failed to save preferences', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }, [selectedId, prefs, loadCustomers])

  // ── Reset ──
  const handleReset = useCallback(async () => {
    if (!selectedId) return
    try {
      await resetCustomerPreferences(selectedId)
      setPrefs({ ...DEFAULT_PREFS })
      setHasPreferences(false)
      setDirty(false)
      setSnack({ open: true, msg: 'Preferences reset to defaults', severity: 'info' })
      loadCustomers()
    } catch {
      setSnack({ open: true, msg: 'Failed to reset preferences', severity: 'error' })
    }
  }, [selectedId, loadCustomers])

  // ── Filtered customers ──
  const filtered = customers.filter(c =>
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCustomer = customers.find(c => c.id === selectedId)

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <Tune />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Customer Preference Memory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Remember every customer like your best CSR would — preferred branch, ship method, tolerances, certs & more
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        {/* ─── LEFT: CUSTOMER LIST ──────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
            <TextField
              placeholder="Search customers…"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />

            {listLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ overflow: 'auto', flex: 1 }}>
                {filtered.map(cust => {
                  const badges = cust.hasPreferences ? summarizePreferences({
                    preferredBranch: cust.preferredBranch,
                    defaultPriority: cust.defaultPriority,
                    rushDefault: cust.rushDefault,
                    certRequirements: cust.certCount ? Array(cust.certCount).fill('') : [],
                  }) : []

                  return (
                    <ListItem
                      key={cust.id}
                      button
                      selected={selectedId === cust.id}
                      onClick={() => handleSelectCustomer(cust.id)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        border: selectedId === cust.id ? 2 : 1,
                        borderColor: selectedId === cust.id ? 'primary.main' : 'grey.200',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: cust.hasPreferences ? 'primary.light' : 'grey.200', width: 36, height: 36 }}>
                          {cust.hasPreferences ? <CheckCircle fontSize="small" color="primary" /> : <Person fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>{cust.name}</Typography>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {cust.code} • {cust.city}, {cust.state}
                            </Typography>
                            {badges.length > 0 && (
                              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                {badges.slice(0, 3).map(b => (
                                  <Chip key={b.key} label={b.label} size="small" color={b.color}
                                    sx={{ height: 18, fontSize: '0.6rem' }} />
                                ))}
                                {badges.length > 3 && (
                                  <Chip label={`+${badges.length - 3}`} size="small"
                                    sx={{ height: 18, fontSize: '0.6rem' }} />
                                )}
                              </Stack>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  )
                })}
              </List>
            )}
          </Paper>
        </Grid>

        {/* ─── RIGHT: PREFERENCE FORM ───────────────────────────── */}
        <Grid item xs={12} md={8}>
          {!selectedId ? (
            <Paper sx={{ p: 6, textAlign: 'center', height: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box>
                <Tune sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a customer to view or edit preferences
                </Typography>
              </Box>
            </Paper>
          ) : prefsLoading ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress />
            </Paper>
          ) : (
            <Paper sx={{ p: 2, height: 'calc(100vh - 180px)', overflow: 'auto' }}>
              {/* Customer header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {selectedCustomer?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCustomer?.code} • {selectedCustomer?.type}
                      {hasPreferences && prefs.lastUpdated && (
                        <> • Last updated {new Date(prefs.lastUpdated).toLocaleDateString()} by {prefs.updatedBy}</>
                      )}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {hasPreferences && (
                    <Tooltip title="Reset to defaults">
                      <IconButton size="small" color="error" onClick={handleReset}>
                        <DeleteOutline />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                    onClick={handleSave}
                    disabled={saving || !dirty}
                    size="small"
                  >
                    Save Preferences
                  </Button>
                </Box>
              </Box>

              {!hasPreferences && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No preferences saved yet for this customer. Set defaults below and save.
                </Alert>
              )}

              {dirty && (
                <Alert severity="warning" sx={{ mb: 2 }} icon={<Warning />}>
                  You have unsaved changes.
                </Alert>
              )}

              <Divider sx={{ mb: 2 }} />

              {/* ── SECTION: Location & Shipping ── */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" color="primary" /> Location & Shipping
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Preferred Branch</InputLabel>
                    <Select value={prefs.preferredBranch} label="Preferred Branch"
                      onChange={e => updateField('preferredBranch', e.target.value)}>
                      <MenuItem value="">No preference</MenuItem>
                      {BRANCHES.map(b => <MenuItem key={b.id} value={b.id}>{b.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Ship Method</InputLabel>
                    <Select value={prefs.preferredShipMethod} label="Ship Method"
                      onChange={e => updateField('preferredShipMethod', e.target.value)}>
                      <MenuItem value="">No preference</MenuItem>
                      {SHIP_METHODS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Default Division</InputLabel>
                    <Select value={prefs.defaultDivision} label="Default Division"
                      onChange={e => updateField('defaultDivision', e.target.value)}>
                      <MenuItem value="">No preference</MenuItem>
                      {DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* ── SECTION: Priority & Ownership ── */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed fontSize="small" color="primary" /> Priority & Ownership
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Default Priority</InputLabel>
                    <Select value={prefs.defaultPriority} label="Default Priority"
                      onChange={e => updateField('defaultPriority', e.target.value)}>
                      {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Default Ownership</InputLabel>
                    <Select value={prefs.defaultOwnership} label="Default Ownership"
                      onChange={e => updateField('defaultOwnership', e.target.value)}>
                      <MenuItem value="HOUSE">House Material</MenuItem>
                      <MenuItem value="CUSTOMER_MATERIAL">Customer Material</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={<Switch checked={prefs.rushDefault} onChange={e => updateField('rushDefault', e.target.checked)} />}
                    label="Default to Rush"
                  />
                </Grid>
              </Grid>

              {/* ── SECTION: Tolerances ── */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Straighten fontSize="small" color="primary" /> Tolerances
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tolerance Preset</InputLabel>
                    <Select value={prefs.tolerancePreset} label="Tolerance Preset"
                      onChange={e => handleTolerancePreset(e.target.value)}>
                      {TOLERANCE_PRESETS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Plus (+)"
                    type="number"
                    size="small"
                    fullWidth
                    value={prefs.tolerancePlus}
                    onChange={e => { updateField('tolerancePlus', parseFloat(e.target.value) || 0); updateField('tolerancePreset', 'CUSTOM') }}
                    InputProps={{ startAdornment: <InputAdornment position="start">+</InputAdornment>, endAdornment: <InputAdornment position="end">in</InputAdornment> }}
                    inputProps={{ step: 0.001, min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Minus (−)"
                    type="number"
                    size="small"
                    fullWidth
                    value={prefs.toleranceMinus}
                    onChange={e => { updateField('toleranceMinus', parseFloat(e.target.value) || 0); updateField('tolerancePreset', 'CUSTOM') }}
                    InputProps={{ startAdornment: <InputAdornment position="start">−</InputAdornment>, endAdornment: <InputAdornment position="end">in</InputAdornment> }}
                    inputProps={{ step: 0.001, min: 0 }}
                  />
                </Grid>
              </Grid>

              {/* ── SECTION: Cert Requirements ── */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUser fontSize="small" color="primary" /> Certification Requirements
              </Typography>
              <FormGroup row sx={{ mb: 3, gap: 1 }}>
                {CERT_OPTIONS.map(cert => (
                  <FormControlLabel
                    key={cert.value}
                    control={
                      <Checkbox
                        size="small"
                        checked={(prefs.certRequirements || []).includes(cert.value)}
                        onChange={() => handleCertToggle(cert.value)}
                      />
                    }
                    label={<Typography variant="body2">{cert.label}</Typography>}
                    sx={{
                      border: 1,
                      borderColor: (prefs.certRequirements || []).includes(cert.value) ? 'primary.main' : 'grey.200',
                      borderRadius: 1,
                      px: 1,
                      mr: 0,
                      bgcolor: (prefs.certRequirements || []).includes(cert.value) ? 'primary.50' : 'transparent',
                    }}
                  />
                ))}
              </FormGroup>

              {/* ── SECTION: Notes & Options ── */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notes fontSize="small" color="primary" /> Notes & Options
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Special Instructions (auto-fill on orders)"
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                    value={prefs.specialInstructions}
                    onChange={e => updateField('specialInstructions', e.target.value)}
                    placeholder="e.g. Strap bundles on 4&quot; dunnage. Deliver to Dock B."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Packaging Notes"
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    value={prefs.packagingNotes}
                    onChange={e => updateField('packagingNotes', e.target.value)}
                    placeholder="e.g. Bundle max 5,000 lbs per lift"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControlLabel
                    control={<Switch checked={prefs.requirePONumber} onChange={e => updateField('requirePONumber', e.target.checked)} />}
                    label="Require PO #"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControlLabel
                    control={<Switch checked={prefs.autoApplyContract} onChange={e => updateField('autoApplyContract', e.target.checked)} />}
                    label="Auto-apply Contract"
                  />
                </Grid>
              </Grid>

              {/* ── Summary badges ── */}
              {hasPreferences && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Active Preference Summary
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                    {summarizePreferences(prefs).map(b => (
                      <Chip key={b.key} label={b.label} color={b.color} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
