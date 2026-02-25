/**
 * CustomerPreferencesPage — Full customer preference editor.
 *
 * Route: /customers/preferences
 *
 * Left panel: customer list with preference badges.
 * Right panel: tabbed preference form — Shipping, Pricing, Specs, Packaging, Order Rules, Certs & Notifications.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Grid, Chip, Button, Divider, Avatar, TextField,
  Alert, Snackbar, Stack, FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, IconButton, Tooltip, CircularProgress, List, ListItem,
  ListItemAvatar, ListItemText, InputAdornment, Checkbox, FormGroup, Tabs, Tab,
} from '@mui/material'
import {
  Tune, Save, Search, Person, LocationOn, LocalShipping, Speed,
  VerifiedUser, DeleteOutline, CheckCircle, Warning, Business, Notes,
  Straighten, AttachMoney, Inventory, Email, Label,
} from '@mui/icons-material'

import {
  getCustomerPreferences, saveCustomerPreferences, listCustomersWithPreferences,
  resetCustomerPreferences, DEFAULT_PREFS, SHIP_METHODS, CERT_OPTIONS,
  TOLERANCE_PRESETS, PRIORITIES, DIVISIONS, FREIGHT_TERMS, PAYMENT_TERMS,
  PRICING_TIERS, PACKAGING_TYPES, SURFACE_FINISHES, STEEL_GRADES,
  summarizePreferences,
} from '../../services/customerPreferencesApi'

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

  // Tab
  const [tab, setTab] = useState(0)

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  const loadCustomers = useCallback(async () => {
    setListLoading(true)
    try {
      const { data } = await listCustomersWithPreferences()
      setCustomers(data || [])
    } catch (err) {
      console.error('Failed to load customers', err)
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  const loadPrefs = useCallback(async (custId) => {
    setPrefsLoading(true)
    try {
      const res = await getCustomerPreferences(custId)
      const data = res.data || {}
      setPrefs({
        ...DEFAULT_PREFS,
        ...data,
        certRequirements: Array.isArray(data.certRequirements) ? data.certRequirements : [],
        approvedGrades: Array.isArray(data.approvedGrades) ? data.approvedGrades : [],
        thkTolerancePlus:  data.thkTolerancePlus  != null ? Number(data.thkTolerancePlus)  : 0.010,
        thkToleranceMinus: data.thkToleranceMinus != null ? Number(data.thkToleranceMinus) : 0.010,
        lenTolerancePlus:  data.lenTolerancePlus  != null ? Number(data.lenTolerancePlus)  : 0.125,
        lenToleranceMinus: data.lenToleranceMinus != null ? Number(data.lenToleranceMinus) : 0.000,
        widTolerancePlus:  data.widTolerancePlus  != null ? Number(data.widTolerancePlus)  : 0.063,
        widToleranceMinus: data.widToleranceMinus != null ? Number(data.widToleranceMinus) : 0.031,
      })
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
    setTab(0)
    loadPrefs(custId)
  }, [loadPrefs])

  const updateField = useCallback((field, value) => {
    setPrefs(prev => ({ ...prev, [field]: value }))
    setDirty(true)
  }, [])

  const handleTolerancePreset = useCallback((preset) => {
    const tp = TOLERANCE_PRESETS.find(t => t.value === preset)
    setPrefs(prev => ({
      ...prev,
      tolerancePreset: preset,
      ...(tp && tp.thkPlus  != null ? { thkTolerancePlus:  tp.thkPlus,  thkToleranceMinus:  tp.thkMinus  } : {}),
      ...(tp && tp.lenPlus  != null ? { lenTolerancePlus:  tp.lenPlus,  lenToleranceMinus:  tp.lenMinus  } : {}),
      ...(tp && tp.widPlus  != null ? { widTolerancePlus:  tp.widPlus,  widToleranceMinus:  tp.widMinus  } : {}),
    }))
    setDirty(true)
  }, [])

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

  const handleGradeToggle = useCallback((grade) => {
    setPrefs(prev => {
      const grades = prev.approvedGrades || []
      const next = grades.includes(grade)
        ? grades.filter(g => g !== grade)
        : [...grades, grade]
      return { ...prev, approvedGrades: next }
    })
    setDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await saveCustomerPreferences(selectedId, prefs)
      setSnack({ open: true, msg: 'Preferences saved successfully', severity: 'success' })
      setDirty(false)
      setHasPreferences(true)
      loadCustomers()
    } catch {
      setSnack({ open: true, msg: 'Failed to save preferences', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }, [selectedId, prefs, loadCustomers])

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

  const filtered = customers.filter(c =>
    !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCustomer = customers.find(c => c.id === selectedId)

  // ── Tab panels ──────────────────────────────────────────

  const renderShipping = () => (
    <>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocationOn fontSize="small" color="primary" /> Location & Shipping
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Preferred Branch"
            value={prefs.preferredBranch} onChange={e => updateField('preferredBranch', e.target.value)}
            placeholder="e.g. JACKSON" />
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

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Preferred Carrier"
            value={prefs.preferredCarrier} onChange={e => updateField('preferredCarrier', e.target.value)}
            placeholder="e.g. XPO Logistics" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Freight Terms</InputLabel>
            <Select value={prefs.freightTerms} label="Freight Terms"
              onChange={e => updateField('freightTerms', e.target.value)}>
              <MenuItem value="">No preference</MenuItem>
              {FREIGHT_TERMS.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Delivery Window"
            value={prefs.deliveryWindow} onChange={e => updateField('deliveryWindow', e.target.value)}
            placeholder="e.g. Tue/Thu 7am-2pm" />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
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
    </>
  )

  const renderPricing = () => (
    <>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AttachMoney fontSize="small" color="primary" /> Pricing & Payment
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Pricing Tier</InputLabel>
            <Select value={prefs.pricingTier || ''} label="Pricing Tier"
              onChange={e => updateField('pricingTier', e.target.value)}>
              <MenuItem value="">No tier</MenuItem>
              {PRICING_TIERS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Default Discount %"
            type="number" value={prefs.discountPct} onChange={e => updateField('discountPct', e.target.value)}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            inputProps={{ step: 0.5, min: 0, max: 100 }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={<Switch checked={prefs.fuelSurchargeExempt} onChange={e => updateField('fuelSurchargeExempt', e.target.checked)} />}
            label="Fuel Surcharge Exempt"
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Payment Terms</InputLabel>
            <Select value={prefs.paymentTerms || ''} label="Payment Terms"
              onChange={e => updateField('paymentTerms', e.target.value)}>
              <MenuItem value="">Not set</MenuItem>
              {PAYMENT_TERMS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Credit Limit"
            type="number" value={prefs.creditLimit} onChange={e => updateField('creditLimit', e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            inputProps={{ step: 1000, min: 0 }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={<Switch checked={prefs.autoApplyContract} onChange={e => updateField('autoApplyContract', e.target.checked)} />}
            label="Auto-apply Contract Pricing"
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth size="small" label="Contract / Pricing Notes" multiline rows={2}
            value={prefs.contractNotes} onChange={e => updateField('contractNotes', e.target.value)}
            placeholder="e.g. Annual blanket PO, locked CWT pricing through Q4 2026" />
        </Grid>
      </Grid>
    </>
  )

  const renderSpecs = () => (
    <>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Straighten fontSize="small" color="primary" /> Tolerances
      </Typography>

      {/* Preset quick-fill */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Tolerance Preset</InputLabel>
            <Select value={prefs.tolerancePreset} label="Tolerance Preset"
              onChange={e => handleTolerancePreset(e.target.value)}>
              {TOLERANCE_PRESETS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Per-dimension tolerance table */}
      <Box sx={{ border: 1, borderColor: 'grey.200', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
        {/* Header */}
        <Grid container sx={{ bgcolor: 'grey.50', px: 2, py: 1 }}>
          <Grid item xs={3}><Typography variant="caption" fontWeight={700} color="text.secondary">DIMENSION</Typography></Grid>
          <Grid item xs={4.5}><Typography variant="caption" fontWeight={700} color="text.secondary">PLUS (+) in</Typography></Grid>
          <Grid item xs={4.5}><Typography variant="caption" fontWeight={700} color="text.secondary">MINUS (−) in</Typography></Grid>
        </Grid>
        <Divider />
        {/* Thickness */}
        <Grid container alignItems="center" sx={{ px: 2, py: 1.5 }}>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight={600}>Thickness</Typography>
          </Grid>
          <Grid item xs={4.5} sx={{ pr: 1 }}>
            <TextField size="small" type="number" fullWidth
              value={prefs.thkTolerancePlus}
              onChange={e => { updateField('thkTolerancePlus', parseFloat(e.target.value) || 0); updateField('tolerancePreset', 'CUSTOM') }}
              InputProps={{ startAdornment: <InputAdornment position="start">+</InputAdornment> }}
              inputProps={{ step: 0.001, min: 0 }} />
          </Grid>
          <Grid item xs={4.5}>
            <TextField size="small" type="number" fullWidth
              value={prefs.thkToleranceMinus}
              onChange={e => { updateField('thkToleranceMinus', parseFloat(e.target.value) || 0); updateField('tolerancePreset', 'CUSTOM') }}
              InputProps={{ startAdornment: <InputAdornment position="start">−</InputAdornment> }}
              inputProps={{ step: 0.001, min: 0 }} />
          </Grid>
        </Grid>
        <Divider />
        {/* Length */}
        <Grid container alignItems="center" sx={{ px: 2, py: 1.5 }}>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight={600}>Length</Typography>
          </Grid>
          <Grid item xs={4.5} sx={{ pr: 1 }}>
            <TextField size="small" type="number" fullWidth
              value={prefs.lenTolerancePlus}
              onChange={e => { updateField('lenTolerancePlus', parseFloat(e.target.value) || 0); updateField('tolerancePreset', 'CUSTOM') }}
              InputProps={{ startAdornment: <InputAdornment position="start">+</InputAdornment> }}
              inputProps={{ step: 0.001, min: 0 }} />
          </Grid>
          <Grid item xs={4.5}>
            <TextField size="small" type="number" fullWidth
              value={prefs.lenToleranceMinus}
              onChange={e => { updateField('lenToleranceMinus', parseFloat(e.target.value) || 0); updateField('tolerancePreset', 'CUSTOM') }}
              InputProps={{ startAdornment: <InputAdornment position="start">−</InputAdornment> }}
              inputProps={{ step: 0.001, min: 0 }} />
          </Grid>
        </Grid>
        <Divider />
        {/* Width */}
        <Grid container alignItems="center" sx={{ px: 2, py: 1.5 }}>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight={600}>Width</Typography>
          </Grid>
          <Grid item xs={4.5} sx={{ pr: 1 }}>
            <TextField size="small" type="number" fullWidth
              value={prefs.widTolerancePlus}
              onChange={e => { updateField('widTolerancePlus', parseFloat(e.target.value) || 0); updateField('tolerancePreset', 'CUSTOM') }}
              InputProps={{ startAdornment: <InputAdornment position="start">+</InputAdornment> }}
              inputProps={{ step: 0.001, min: 0 }} />
          </Grid>
          <Grid item xs={4.5}>
            <TextField size="small" type="number" fullWidth
              value={prefs.widToleranceMinus}
              onChange={e => { updateField('widToleranceMinus', parseFloat(e.target.value) || 0); updateField('tolerancePreset', 'CUSTOM') }}
              InputProps={{ startAdornment: <InputAdornment position="start">−</InputAdornment> }}
              inputProps={{ step: 0.001, min: 0 }} />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        Surface Finish
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Surface Finish</InputLabel>
            <Select value={prefs.surfaceFinish || ''} label="Surface Finish"
              onChange={e => updateField('surfaceFinish', e.target.value)}>
              <MenuItem value="">No preference</MenuItem>
              {SURFACE_FINISHES.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField fullWidth size="small" label="Special Spec Notes" multiline rows={2}
            value={prefs.specialSpecs} onChange={e => updateField('specialSpecs', e.target.value)}
            placeholder="e.g. Must meet NACE MR0175 / ISO 15156" />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        Approved Grades {prefs.approvedGrades?.length > 0 && <Chip size="small" label={`${prefs.approvedGrades.length} selected`} sx={{ ml: 1 }} />}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Select which grades this customer is approved to purchase. Leave empty for no restriction.
      </Typography>
      <FormGroup row sx={{ mb: 2, gap: 0.5 }}>
        {STEEL_GRADES.map(grade => (
          <FormControlLabel key={grade}
            control={<Checkbox size="small" checked={(prefs.approvedGrades || []).includes(grade)}
              onChange={() => handleGradeToggle(grade)} />}
            label={<Typography variant="body2">{grade}</Typography>}
            sx={{
              border: 1,
              borderColor: (prefs.approvedGrades || []).includes(grade) ? 'primary.main' : 'grey.200',
              borderRadius: 1, px: 1, mr: 0,
              bgcolor: (prefs.approvedGrades || []).includes(grade) ? 'primary.50' : 'transparent',
            }}
          />
        ))}
      </FormGroup>
    </>
  )

  const renderPackaging = () => (
    <>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Label fontSize="small" color="primary" /> Packaging & Labeling
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Packaging Type</InputLabel>
            <Select value={prefs.packagingType || ''} label="Packaging Type"
              onChange={e => updateField('packagingType', e.target.value)}>
              <MenuItem value="">No preference</MenuItem>
              {PACKAGING_TYPES.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Max Bundle Weight"
            type="number" value={prefs.bundleMaxWeight} onChange={e => updateField('bundleMaxWeight', e.target.value)}
            InputProps={{ endAdornment: <InputAdornment position="end">lbs</InputAdornment> }}
            inputProps={{ step: 500, min: 0 }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Max Pieces per Bundle"
            type="number" value={prefs.bundleMaxPieces} onChange={e => updateField('bundleMaxPieces', e.target.value)}
            inputProps={{ step: 1, min: 0 }} />
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Label Template Code"
            value={prefs.labelTemplate} onChange={e => updateField('labelTemplate', e.target.value)}
            placeholder="e.g. CUST-TAG-001" />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField fullWidth size="small" label="Packaging Notes" multiline rows={2}
            value={prefs.packagingNotes} onChange={e => updateField('packagingNotes', e.target.value)}
            placeholder='e.g. Bundle max 5,000 lbs per lift. Strap on 4" dunnage.' />
        </Grid>
      </Grid>
    </>
  )

  const renderOrderRules = () => (
    <>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Inventory fontSize="small" color="primary" /> Order Rules
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={<Switch checked={prefs.requirePONumber} onChange={e => updateField('requirePONumber', e.target.checked)} />}
            label="Require PO Number"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={<Switch checked={prefs.autoApproveOrders} onChange={e => updateField('autoApproveOrders', e.target.checked)} />}
            label="Auto-Approve Orders"
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Minimum Order Quantity"
            type="number" value={prefs.minOrderQty} onChange={e => updateField('minOrderQty', e.target.value)}
            inputProps={{ step: 1, min: 0 }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Minimum Order Value"
            type="number" value={prefs.minOrderValue} onChange={e => updateField('minOrderValue', e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            inputProps={{ step: 100, min: 0 }} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Notes fontSize="small" color="primary" /> Notes & Instructions
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth size="small" label="Special Instructions (auto-fill on orders)" multiline rows={3}
            value={prefs.specialInstructions} onChange={e => updateField('specialInstructions', e.target.value)}
            placeholder='e.g. Strap bundles on 4" dunnage. Deliver to Dock B. Call 30 min before.' />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth size="small" label="Internal Notes (not shown to customer)" multiline rows={2}
            value={prefs.internalNotes} onChange={e => updateField('internalNotes', e.target.value)}
            placeholder="e.g. Slow payer. Always verify credit before releasing." />
        </Grid>
      </Grid>
    </>
  )

  const renderCertsNotifications = () => (
    <>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <VerifiedUser fontSize="small" color="primary" /> Certification Requirements
      </Typography>
      <FormGroup row sx={{ mb: 3, gap: 1 }}>
        {CERT_OPTIONS.map(cert => (
          <FormControlLabel key={cert.value}
            control={<Checkbox size="small" checked={(prefs.certRequirements || []).includes(cert.value)}
              onChange={() => handleCertToggle(cert.value)} />}
            label={<Typography variant="body2">{cert.label}</Typography>}
            sx={{
              border: 1,
              borderColor: (prefs.certRequirements || []).includes(cert.value) ? 'primary.main' : 'grey.200',
              borderRadius: 1, px: 1, mr: 0,
              bgcolor: (prefs.certRequirements || []).includes(cert.value) ? 'primary.50' : 'transparent',
            }}
          />
        ))}
      </FormGroup>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Email fontSize="small" color="primary" /> Automatic Notifications
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={<Switch checked={prefs.autoSendMTR} onChange={e => updateField('autoSendMTR', e.target.checked)} />}
            label="Auto-send MTR on shipment"
          />
          {prefs.autoSendMTR && (
            <TextField fullWidth size="small" label="MTR Recipient Email" sx={{ mt: 1 }}
              value={prefs.mtrEmail} onChange={e => updateField('mtrEmail', e.target.value)}
              placeholder="quality@customer.com" />
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={<Switch checked={prefs.autoSendInvoice} onChange={e => updateField('autoSendInvoice', e.target.checked)} />}
            label="Auto-send Invoice"
          />
          {prefs.autoSendInvoice && (
            <TextField fullWidth size="small" label="Invoice Recipient Email" sx={{ mt: 1 }}
              value={prefs.invoiceEmail} onChange={e => updateField('invoiceEmail', e.target.value)}
              placeholder="ap@customer.com" />
          )}
        </Grid>
      </Grid>
    </>
  )

  const tabPanels = [renderShipping, renderPricing, renderSpecs, renderPackaging, renderOrderRules, renderCertsNotifications]
  const tabLabels = ['Shipping & Priority', 'Pricing & Payment', 'Material Specs', 'Packaging & Labels', 'Order Rules & Notes', 'Certs & Notifications']

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><Tune /></Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>Customer Preferences</Typography>
            <Typography variant="body2" color="text.secondary">
              Set customer-specific pricing, specs, shipping, packaging, order rules & notification preferences
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        {/* LEFT: Customer List */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
            <TextField placeholder="Search customers\u2026" size="small" fullWidth
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ mb: 2 }} />

            {listLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : filtered.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No customers found
              </Typography>
            ) : (
              <List sx={{ overflow: 'auto', flex: 1 }}>
                {filtered.map(cust => {
                  const badges = cust.hasPreferences ? summarizePreferences({
                    preferredBranch: cust.preferredBranch,
                    defaultPriority: cust.defaultPriority,
                    rushDefault: cust.rushDefault,
                    certRequirements: cust.certCount ? Array(cust.certCount).fill('') : [],
                    preferredShipMethod: cust.preferredShipMethod,
                    pricingTier: cust.pricingTier,
                  }) : []

                  return (
                    <ListItem key={cust.id} button selected={selectedId === cust.id}
                      onClick={() => handleSelectCustomer(cust.id)}
                      sx={{ borderRadius: 1, mb: 0.5, border: selectedId === cust.id ? 2 : 1,
                        borderColor: selectedId === cust.id ? 'primary.main' : 'grey.200' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: cust.hasPreferences ? 'primary.light' : 'grey.200', width: 36, height: 36 }}>
                          {cust.hasPreferences ? <CheckCircle fontSize="small" color="primary" /> : <Person fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600}>{cust.name}</Typography>}
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {cust.code} {cust.city && `\u2022 ${cust.city}, ${cust.state}`}
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

        {/* RIGHT: Preference Form */}
        <Grid item xs={12} md={9}>
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
            <Paper sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Paper>
          ) : (
            <Paper sx={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
              {/* Customer header */}
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><Business /></Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{selectedCustomer?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCustomer?.code} \u2022 {selectedCustomer?.type}
                      {hasPreferences && prefs.updatedAt && (
                        <> \u2022 Last updated {new Date(prefs.updatedAt).toLocaleDateString()}
                          {prefs.updatedBy && ` by ${prefs.updatedBy}`}</>
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
                  <Button variant="contained"
                    startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                    onClick={handleSave} disabled={saving || !dirty} size="small">
                    Save Preferences
                  </Button>
                </Box>
              </Box>

              {!hasPreferences && (
                <Alert severity="info" sx={{ mx: 2, mb: 1 }}>
                  No preferences saved yet for this customer. Set defaults below and save.
                </Alert>
              )}
              {dirty && (
                <Alert severity="warning" sx={{ mx: 2, mb: 1 }} icon={<Warning />}>
                  You have unsaved changes.
                </Alert>
              )}

              {/* Tabs */}
              <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
                sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
                {tabLabels.map((label, i) => <Tab key={i} label={label} />)}
              </Tabs>

              {/* Tab content */}
              <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
                {tabPanels[tab]()}

                {/* Summary badges at bottom of every tab */}
                {hasPreferences && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Active Preference Summary</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                      {summarizePreferences(prefs).map(b => (
                        <Chip key={b.key} label={b.label} color={b.color} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </>
                )}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Snackbar open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
