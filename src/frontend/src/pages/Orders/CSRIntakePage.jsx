/**
 * CSRIntakePage — Full order-entry workspace for phone / email / sales-rep intake.
 *
 * Route: /orders/intake
 */
import React, { useState, useCallback } from 'react'
import {
  Box, Paper, Typography, Button, Grid, Divider, TextField, Alert, Snackbar,
  FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton,
  Chip, IconButton, Tooltip, Stepper, Step, StepLabel, CircularProgress,
  Breadcrumbs, Link as MuiLink, Switch, FormControlLabel,
} from '@mui/material'
import {
  Phone as PhoneIcon, Email as EmailIcon, Person as RepIcon,
  Save as SaveIcon, Send as SendIcon, ContentCopy as DuplicateIcon,
  Print as PrintIcon, ArrowBack as BackIcon, Refresh as RefreshIcon,
  ExpandMore as ExpandIcon, Speed as FastIcon,
  Warehouse as HouseIcon, PersonPin as CustMatIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

import OrderSourceChip from '../../components/orders/OrderSourceChip'
import CustomerLookupDialog from '../../components/orders/CustomerLookupDialog'
import MaterialPicker from '../../components/orders/MaterialPicker'
import ProcessingMenuBuilder from '../../components/orders/ProcessingMenuBuilder'
import PricingSummaryPanel from '../../components/orders/PricingSummaryPanel'
import LineItemsEditor from '../../components/orders/LineItemsEditor'
import OwnershipToggle from '../../components/orders/OwnershipToggle'

import { createIntakeOrder, updateIntakeOrder, submitOrder } from '../../services/intakeOrdersApi'
import { estimateTax, getContractPricing } from '../../services/intakePricingApi'
import { compareBranches, csrKeyToLocationId, locationIdToCsrKey } from '../../services/branchComparisonApi'
import FulfillmentSuggestionPanel from '../../components/orders/FulfillmentSuggestionPanel'
import useFulfillmentOverride from '../../hooks/useFulfillmentOverride'
import OverrideDialog from '../../components/orders/OverrideDialog'
import OverrideIndicator from '../../components/orders/OverrideIndicator'
import { OVERRIDE_TYPE, getOverridesForOrder } from '../../services/overrideApi'
import RemnantSuggestionPanel from '../../components/orders/RemnantSuggestionPanel'

const DIVISIONS = ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET']
const PRIORITIES = ['STANDARD', 'RUSH', 'HOT', 'EMERGENCY']
const PRIORITY_COLOR = { STANDARD: 'default', RUSH: 'info', HOT: 'warning', EMERGENCY: 'error' }
const LOCATIONS = ['JACKSON', 'KALAMAZOO', 'GRAND_RAPIDS', 'DETROIT']
const SOURCES = ['PHONE', 'EMAIL', 'REP']

const STEPS = ['Header', 'Customer', 'Lines', 'Review']

export default function CSRIntakePage() {
  const navigate = useNavigate()

  // ── header state ──
  const [source, setSource] = useState('PHONE')
  const [division, setDivision] = useState('METALS')
  const [location, setLocation] = useState('JACKSON')
  const [priority, setPriority] = useState('STANDARD')
  const [ownership, setOwnership] = useState('HOUSE')
  const [poNumber, setPoNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [requestedDate, setRequestedDate] = useState('')
  const [fastMode, setFastMode] = useState(false)

  // ── customer state ──
  const [customer, setCustomer] = useState(null)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)

  // ── lines state ──
  const [lines, setLines] = useState([])
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false)
  const [materialPickerIdx, setMaterialPickerIdx] = useState(null)
  const [processingOpen, setProcessingOpen] = useState(false)
  const [processingIdx, setProcessingIdx] = useState(null)

  // ── pricing ──
  const [taxRate, setTaxRate] = useState(6)
  const [priceSource, setPriceSource] = useState('RETAIL')
  const [contractName, setContractName] = useState(null)

  // ── workflow ──
  const [activeStep, setActiveStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  // ── fulfillment suggestions ──
  const [fulfillmentSuggestions, setFulfillmentSuggestions] = useState([])
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false)
  const { logOverride } = useFulfillmentOverride('CSR_INTAKE')

  // ── CSR override state ──
  const [overrides, setOverrides] = useState([])
  const [overrideDialog, setOverrideDialog] = useState({ open: false, type: null, warning: '', originalValue: '', overrideValue: '' })
  const [pendingSubmit, setPendingSubmit] = useState(false)

  React.useEffect(() => {
    setFulfillmentLoading(true)
    const requiredOps = [...new Set(lines.flatMap(l => (l.processes || []).map(p => p.code || p.name)).filter(Boolean))]
    compareBranches({
      division: division || 'METALS',
      requiredProcessing: requiredOps.length > 0 ? requiredOps : undefined,
    })
      .then(res => setFulfillmentSuggestions(res.suggestions || []))
      .catch(() => setFulfillmentSuggestions([]))
      .finally(() => setFulfillmentLoading(false))
  }, [division, location, lines])

  const handleFulfillmentBranchSelect = React.useCallback((locId, locName) => {
    const best = fulfillmentSuggestions.find(s => s.recommended)
    logOverride({
      recommendedLocationId: best?.locationId,
      recommendedLocationName: best?.locationName,
      selectedLocationId: locId,
      selectedLocationName: locName,
      recommendedScore: best?.score,
      selectedScore: fulfillmentSuggestions.find(s => s.locationId === locId)?.score,
      meta: { division, orderId },
    })
    const csrKey = locationIdToCsrKey(locId)
    if (csrKey) setLocation(csrKey)
  }, [fulfillmentSuggestions, logOverride, division, orderId])

  // ── handlers ──
  const handleCustomerSelect = useCallback(async (cust) => {
    setCustomer(cust)
    setCustomerDialogOpen(false)
    // auto-detect contract pricing
    try {
      const res = await getContractPricing(cust.id)
      if (res.data?.contracts?.length) {
        const c = res.data.contracts[0]
        setPriceSource('CONTRACT')
        setContractName(c.name)
      }
    } catch { /* ignore */ }
  }, [])

  const handleOpenMaterialPicker = useCallback((idx) => {
    setMaterialPickerIdx(idx)
    setMaterialPickerOpen(true)
  }, [])

  const handleMaterialSelected = useCallback((product) => {
    setLines(prev => {
      const next = [...prev]
      if (materialPickerIdx !== null && next[materialPickerIdx]) {
        next[materialPickerIdx] = {
          ...next[materialPickerIdx],
          productId: product.id,
          description: product.name || product.description,
          unitPrice: product.basePrice || product.price || 0,
          uom: product.uom || 'EA',
          weight: product.weight || 0,
          isRemnant: !!product.isRemnant,
          remnantDiscount: product.remnantDiscount || 0,
          extPrice: +((next[materialPickerIdx].qty || 1) * (product.basePrice || product.price || 0)).toFixed(2),
        }
      }
      return next
    })
    setMaterialPickerOpen(false)
  }, [materialPickerIdx])

  const handleOpenProcessing = useCallback((idx) => {
    setProcessingIdx(idx)
    setProcessingOpen(true)
  }, [])

  const handleSaveProcessing = useCallback((steps) => {
    if (processingIdx === null) return
    setLines(prev => {
      const next = [...prev]
      if (next[processingIdx]) next[processingIdx] = { ...next[processingIdx], processes: steps }
      return next
    })
  }, [processingIdx])

  const handleSaveDraft = useCallback(async () => {
    setSaving(true)
    try {
      const payload = {
        source, division, location, priority, ownership, poNumber, notes, requestedDate,
        customerId: customer?.id, customerName: customer?.name, lines, status: 'DRAFT',
      }
      if (orderId) {
        await updateIntakeOrder(orderId, payload)
        setSnack({ open: true, msg: 'Draft updated', severity: 'success' })
      } else {
        const res = await createIntakeOrder(payload)
        setOrderId(res.data?.id)
        setSnack({ open: true, msg: `Draft saved — ${res.data?.orderNumber}`, severity: 'success' })
      }
    } catch (err) {
      setSnack({ open: true, msg: 'Save failed', severity: 'error' })
    }
    setSaving(false)
  }, [source, division, location, priority, ownership, poNumber, notes, requestedDate, customer, lines, orderId])

  // ── Override triggers: detect cutoff, capacity, pricing issues ──
  const checkForWarnings = useCallback(() => {
    const now = new Date()
    const hour = now.getHours()
    // Cutoff check: after 3:30 PM local
    if (hour >= 15 && now.getMinutes() > 30 || hour >= 16) {
      const cutoffTime = '3:30 PM'
      const currentTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      setOverrideDialog({
        open: true,
        type: OVERRIDE_TYPE.CUTOFF_VIOLATION,
        warning: `This order is being placed after the ${cutoffTime} cutoff for ${location.replace(/_/g, ' ')}. Standard next-day shipping is no longer guaranteed.`,
        originalValue: `Cutoff ${cutoffTime} — current time ${currentTime}`,
        overrideValue: 'Force next-day processing despite late submission',
      })
      setPendingSubmit(true)
      return true
    }
    // Capacity check: EMERGENCY + RUSH get a simulated capacity warning
    if (priority === 'EMERGENCY' || priority === 'HOT') {
      const hasProcessing = lines.some(l => l.processes?.length > 0)
      if (hasProcessing) {
        setOverrideDialog({
          open: true,
          type: OVERRIDE_TYPE.CAPACITY_WARNING,
          warning: `${priority} priority with processing steps — ${location.replace(/_/g, ' ')} production queue is nearing capacity for today.`,
          originalValue: `Current queue: ~85% capacity at ${location.replace(/_/g, ' ')}`,
          overrideValue: `Accept ${priority} job despite capacity risk`,
        })
        setPendingSubmit(true)
        return true
      }
    }
    return false
  }, [location, priority, lines])

  /** Trigger a pricing override dialog (called from pricing panel or manual) */
  const triggerPricingOverride = useCallback((originalPrice, newPrice) => {
    const pctDiff = originalPrice > 0 ? (((newPrice - originalPrice) / originalPrice) * 100).toFixed(1) : 0
    setOverrideDialog({
      open: true,
      type: OVERRIDE_TYPE.PRICING_OVERRIDE,
      warning: `Pricing has been changed from the contract/list price. This requires an override with justification.`,
      originalValue: `List / contract price: $${originalPrice.toFixed(2)}`,
      overrideValue: `Adjusted price: $${newPrice.toFixed(2)} (${pctDiff}%)`,
    })
  }, [])

  const handleOverrideConfirm = useCallback((newOverride) => {
    setOverrides(prev => [newOverride, ...prev])
    setOverrideDialog({ open: false, type: null, warning: '', originalValue: '', overrideValue: '' })
    setSnack({ open: true, msg: `Override recorded — ${newOverride.reasonLabel}`, severity: 'info' })
    // If this was blocking a submit, continue the submit
    if (pendingSubmit) {
      setPendingSubmit(false)
      doSubmit()
    }
  }, [pendingSubmit])

  const handleOverrideClose = useCallback(() => {
    setOverrideDialog({ open: false, type: null, warning: '', originalValue: '', overrideValue: '' })
    if (pendingSubmit) {
      setPendingSubmit(false)
      setSnack({ open: true, msg: 'Submit cancelled — override required', severity: 'warning' })
    }
  }, [pendingSubmit])

  const doSubmit = useCallback(async () => {
    setSaving(true)
    try {
      let id = orderId
      if (!id) {
        const payload = {
          source, division, location, priority, ownership, poNumber, notes, requestedDate,
          customerId: customer?.id, customerName: customer?.name, lines, status: 'DRAFT',
        }
        const res = await createIntakeOrder(payload)
        id = res.data?.id
      }
      await submitOrder(id)
      setSnack({ open: true, msg: 'Order submitted!', severity: 'success' })
      setTimeout(() => navigate('/orders/online-inbox'), 1200)
    } catch {
      setSnack({ open: true, msg: 'Submit failed', severity: 'error' })
    }
    setSaving(false)
  }, [source, division, location, priority, ownership, poNumber, notes, requestedDate, customer, lines, orderId, navigate])

  const handleSubmit = useCallback(async () => {
    // Check for warnings that need overrides before submitting
    const hasWarning = checkForWarnings()
    if (hasWarning) return // override dialog will call doSubmit on confirm
    doSubmit()
  }, [checkForWarnings, doSubmit])

  // ──────────────────── RENDER ──────────────────
  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink underline="hover" color="inherit" href="/" onClick={e => { e.preventDefault(); navigate('/') }}>Home</MuiLink>
        <Typography color="text.primary">Order Intake</Typography>
      </Breadcrumbs>

      {/* Title bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={700}>CSR Order Intake</Typography>
        <OrderSourceChip source={source} />
        {orderId && <Chip label={`Draft #${orderId}`} size="small" variant="outlined" />}
        {overrides.length > 0 && <OverrideIndicator overrides={overrides} compact />}
        <Box sx={{ flex: 1 }} />
        <FormControlLabel
          control={<Switch checked={fastMode} onChange={e => setFastMode(e.target.checked)} size="small" />}
          label={<Typography variant="caption" fontWeight={500}>Fast Mode</Typography>}
        />
        <Button size="small" startIcon={<SaveIcon />} onClick={handleSaveDraft} disabled={saving}>Save Draft</Button>
        <Button size="small" variant="contained" startIcon={<SendIcon />} onClick={handleSubmit} disabled={saving || !customer || lines.length === 0}>
          Submit Order
        </Button>
      </Box>

      {/* Stepper (non-fast mode) */}
      {!fastMode && (
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
      )}

      <Grid container spacing={3}>
        {/* ─── LEFT COLUMN ─── */}
        <Grid item xs={12} md={8}>
          {/* Header panel */}
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Order Header</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Source</InputLabel>
                  <Select value={source} label="Source" onChange={e => setSource(e.target.value)}>
                    {SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Division</InputLabel>
                  <Select value={division} label="Division" onChange={e => setDivision(e.target.value)}>
                    {DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Location</InputLabel>
                  <Select value={location} label="Location" onChange={e => setLocation(e.target.value)}>
                    {LOCATIONS.map(l => <MenuItem key={l} value={l}>{l.replace(/_/g, ' ')}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select value={priority} label="Priority" onChange={e => setPriority(e.target.value)}>
                    {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4}>
                <OwnershipToggle value={ownership} onChange={setOwnership} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField size="small" fullWidth label="PO Number" value={poNumber} onChange={e => setPoNumber(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Requested Date" type="date" InputLabelProps={{ shrink: true }} value={requestedDate} onChange={e => setRequestedDate(e.target.value)} />
              </Grid>
            </Grid>
          </Paper>

          {/* Customer panel */}
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>Customer</Typography>
              <Button size="small" variant="outlined" onClick={() => setCustomerDialogOpen(true)}>
                {customer ? 'Change' : 'Look Up'}
              </Button>
            </Box>
            {customer ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body1" fontWeight={600}>{customer.name}</Typography>
                <Chip label={customer.accountType || 'ACCOUNT'} size="small" variant="outlined" />
                {customer.phone && <Chip icon={<PhoneIcon />} label={customer.phone} size="small" variant="outlined" />}
                {customer.email && <Chip icon={<EmailIcon />} label={customer.email} size="small" variant="outlined" />}
                {priceSource === 'CONTRACT' && <Chip label={contractName} size="small" color="primary" />}
              </Box>
            ) : (
              <Alert severity="info" variant="outlined">No customer selected — click Look Up to search or create walk-in.</Alert>
            )}
          </Paper>

          {/* Line items */}
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Line Items</Typography>
            <LineItemsEditor
              lines={lines}
              onChange={setLines}
              onOpenMaterialPicker={handleOpenMaterialPicker}
              onOpenProcessingMenu={handleOpenProcessing}
            />
          </Paper>

          {/* Notes */}
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Internal Notes</Typography>
            <TextField multiline rows={3} fullWidth placeholder="Add notes for production, shipping, etc." value={notes} onChange={e => setNotes(e.target.value)} />
          </Paper>
        </Grid>

        {/* ─── RIGHT COLUMN ─── */}
        <Grid item xs={12} md={4}>
          <PricingSummaryPanel lines={lines} taxRate={taxRate} priceSource={priceSource} contractName={contractName} />

          {/* Branch fulfillment suggestions */}
          <Box sx={{ mt: 3 }}>
            <FulfillmentSuggestionPanel
              suggestions={fulfillmentSuggestions}
              loading={fulfillmentLoading}
              currentLocationId={csrKeyToLocationId(location)}
              onSelectBranch={handleFulfillmentBranchSelect}
            />
          </Box>

          {/* Remnant suggestions — push remnants first */}
          <Box sx={{ mt: 3 }}>
            <RemnantSuggestionPanel
              lines={lines}
              location={location}
              onSelectRemnant={(remnant, lineIdx) => {
                setLines(prev => {
                  const next = [...prev]
                  if (next[lineIdx]) {
                    next[lineIdx] = {
                      ...next[lineIdx],
                      productId: remnant.id,
                      description: remnant.name,
                      unitPrice: remnant.pricePerLb,
                      weight: remnant.estimatedWeight,
                      isRemnant: true,
                      remnantDiscount: 25,
                      extPrice: +(remnant.estimatedWeight * remnant.pricePerLb).toFixed(2),
                    }
                  }
                  return next
                })
                setSnack({ open: true, msg: `Remnant ${remnant.sku} applied to line`, severity: 'success' })
              }}
            />
          </Box>

          <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button size="small" startIcon={<SaveIcon />} onClick={handleSaveDraft} disabled={saving} fullWidth variant="outlined">Save Draft</Button>
              <Button size="small" startIcon={<SendIcon />} onClick={handleSubmit} disabled={saving || !customer || lines.length === 0} fullWidth variant="contained">Submit</Button>
              <Button size="small" startIcon={<DuplicateIcon />} fullWidth variant="outlined" color="secondary" disabled>Duplicate Order</Button>
              <Button size="small" startIcon={<PrintIcon />} fullWidth variant="outlined" color="secondary" disabled>Print</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Dialogs ── */}
      <OverrideDialog
        open={overrideDialog.open}
        onClose={handleOverrideClose}
        overrideType={overrideDialog.type}
        orderId={orderId || 'NEW-ORDER'}
        orderNumber={orderId ? `SO-${orderId}` : 'New Order'}
        warningMessage={overrideDialog.warning}
        originalValue={overrideDialog.originalValue}
        overrideValue={overrideDialog.overrideValue}
        location={location}
        division={division}
        customerName={customer?.name}
        onConfirm={handleOverrideConfirm}
      />
      <CustomerLookupDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onSelect={handleCustomerSelect}
      />
      <MaterialPicker
        open={materialPickerOpen}
        onClose={() => setMaterialPickerOpen(false)}
        onSelect={handleMaterialSelected}
        division={division}
      />
      <ProcessingMenuBuilder
        open={processingOpen}
        onClose={() => setProcessingOpen(false)}
        onSave={handleSaveProcessing}
        division={division}
        existingProcesses={processingIdx !== null ? (lines[processingIdx]?.processes || []) : []}
      />

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
