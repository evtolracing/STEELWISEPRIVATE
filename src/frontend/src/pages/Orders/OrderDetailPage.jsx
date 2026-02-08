/**
 * OrderDetailPage — View / edit a single order, allocate inventory, create work orders.
 *
 * Route: /orders/:id
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Typography, Button, Grid, Divider, Chip, IconButton, Tooltip,
  CircularProgress, Alert, Snackbar, Breadcrumbs, Link as MuiLink,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab,
  Stepper, Step, StepLabel, Stack,
} from '@mui/material'
import {
  ArrowBack as BackIcon, Edit as EditIcon, Save as SaveIcon,
  Send as SubmitIcon, Print as PrintIcon, ContentCopy as DuplicateIcon,
  Build as WOIcon, Inventory as AllocIcon, Receipt as InvoiceIcon,
  LocalShipping as ShipIcon, History as HistoryIcon, Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'

import OrderSourceChip from '../../components/orders/OrderSourceChip'
import PricingSummaryPanel from '../../components/orders/PricingSummaryPanel'
import LineItemsEditor from '../../components/orders/LineItemsEditor'
import MaterialPicker from '../../components/orders/MaterialPicker'
import ProcessingMenuBuilder from '../../components/orders/ProcessingMenuBuilder'

import {
  getIntakeOrder, updateIntakeOrder, submitOrder, createWorkOrdersFromOrder,
} from '../../services/intakeOrdersApi'
import {
  getOrderFulfillmentDetail,
  createSplitShipment,
  ORDER_FULFILLMENT_STATUS,
  orderShippedPct,
  calcRemaining,
} from '../../services/splitShipmentApi'
import PartialFulfillmentBanner from '../../components/shipping/PartialFulfillmentBanner'
import OrderStatusTimeline from '../../components/shipping/OrderStatusTimeline'
import ShipmentTracker from '../../components/shipping/ShipmentTracker'
import SplitShipmentDialog from '../../components/shipping/SplitShipmentDialog'
import { CallSplit as SplitIcon } from '@mui/icons-material'

import { getOverridesForOrder } from '../../services/overrideApi'
import OverrideIndicator from '../../components/orders/OverrideIndicator'
import AuditLogViewer from '../../components/orders/AuditLogViewer'

const STATUS_COLOR = {
  DRAFT: 'default', SUBMITTED: 'primary', CONFIRMED: 'info', IN_PRODUCTION: 'warning',
  READY: 'success', SHIPPED: 'secondary', INVOICED: 'default', CANCELLED: 'error',
}

const STATUS_STEPS = ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED']

const fmt = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [lines, setLines] = useState([])
  const [notes, setNotes] = useState('')
  const [tab, setTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  // ── Fulfillment state ──
  const [fulfillment, setFulfillment] = useState(null)
  const [splitDialogOpen, setSplitDialogOpen] = useState(false)
  const [creatingSplit, setCreatingSplit] = useState(false)

  // ── Dialogs ──
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false)
  const [materialPickerIdx, setMaterialPickerIdx] = useState(null)
  const [processingOpen, setProcessingOpen] = useState(false)
  const [processingIdx, setProcessingIdx] = useState(null)
  const [woDialogOpen, setWoDialogOpen] = useState(false)
  const [woResult, setWoResult] = useState(null)

  // ── Override state ──
  const [overrides, setOverrides] = useState([])

  // ── Load order ──
  const loadOrder = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getIntakeOrder(id)
      const data = res.data
      setOrder(data)
      setLines(data.lines || [])
      setNotes(data.notes || '')
    } catch {
      setSnack({ open: true, msg: 'Failed to load order', severity: 'error' })
    }
    setLoading(false)
  }, [id])

  useEffect(() => { loadOrder() }, [loadOrder])

  // Load fulfillment data
  useEffect(() => {
    if (!id) return
    getOrderFulfillmentDetail(`ORD-2026-0200`) // demo: load first mock order
      .then(({ data }) => setFulfillment(data))
      .catch(() => {}) // non-critical
  }, [id])

  // Load overrides for this order
  useEffect(() => {
    if (!id) return
    getOverridesForOrder(id)
      .then(({ data }) => setOverrides(data || []))
      .catch(() => {}) // non-critical
  }, [id])

  // ── Save ──
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await updateIntakeOrder(id, { lines, notes })
      setEditing(false)
      setSnack({ open: true, msg: 'Order updated', severity: 'success' })
      loadOrder()
    } catch {
      setSnack({ open: true, msg: 'Update failed', severity: 'error' })
    }
    setSaving(false)
  }, [id, lines, notes, loadOrder])

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    setSaving(true)
    try {
      await submitOrder(id)
      setSnack({ open: true, msg: 'Order submitted', severity: 'success' })
      loadOrder()
    } catch {
      setSnack({ open: true, msg: 'Submit failed', severity: 'error' })
    }
    setSaving(false)
  }, [id, loadOrder])

  // ── Create Work Orders ──
  const handleCreateWOs = useCallback(async () => {
    setSaving(true)
    try {
      const res = await createWorkOrdersFromOrder(id)
      setWoResult(res.data)
      setWoDialogOpen(true)
      setSnack({ open: true, msg: 'Work orders created!', severity: 'success' })
    } catch {
      setSnack({ open: true, msg: 'Failed to create work orders', severity: 'error' })
    }
    setSaving(false)
  }, [id])

  // ── Material / Processing dialogs ──
  const handleOpenMaterialPicker = (idx) => { setMaterialPickerIdx(idx); setMaterialPickerOpen(true) }
  const handleMaterialSelected = (product) => {
    setLines(prev => {
      const next = [...prev]
      if (materialPickerIdx !== null && next[materialPickerIdx]) {
        next[materialPickerIdx] = {
          ...next[materialPickerIdx],
          productId: product.id, description: product.name || product.description,
          unitPrice: product.basePrice || product.price || 0, uom: product.uom || 'EA',
          extPrice: +((next[materialPickerIdx].qty || 1) * (product.basePrice || product.price || 0)).toFixed(2),
        }
      }
      return next
    })
    setMaterialPickerOpen(false)
  }
  const handleOpenProcessing = (idx) => { setProcessingIdx(idx); setProcessingOpen(true) }
  const handleSaveProcessing = (steps) => {
    if (processingIdx === null) return
    setLines(prev => prev.map((l, i) => i === processingIdx ? { ...l, processes: steps } : l))
  }

  // ── Status stepper index ──
  const stepIdx = STATUS_STEPS.indexOf(order?.status) >= 0 ? STATUS_STEPS.indexOf(order?.status) : 0

  // ──────────────── RENDER ────────────────
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}><CircularProgress /></Box>
  }

  if (!order) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">Order not found</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(-1)} startIcon={<BackIcon />}>Go Back</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink underline="hover" color="inherit" href="/" onClick={e => { e.preventDefault(); navigate('/') }}>Home</MuiLink>
        <MuiLink underline="hover" color="inherit" href="/orders/online-inbox" onClick={e => { e.preventDefault(); navigate('/orders/online-inbox') }}>Orders</MuiLink>
        <Typography color="text.primary">{order.orderNumber}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate(-1)}><BackIcon /></IconButton>
        <Typography variant="h5" fontWeight={700}>{order.orderNumber}</Typography>
        <OrderSourceChip source={order.source} />
        <Chip label={order.status?.replace(/_/g, ' ')} color={STATUS_COLOR[order.status] || 'default'} />
        {order.priority && order.priority !== 'STANDARD' && (
          <Chip label={order.priority} size="small" color={order.priority === 'EMERGENCY' ? 'error' : order.priority === 'HOT' ? 'warning' : 'info'} />
        )}
        {overrides.length > 0 && <OverrideIndicator overrides={overrides} />}
        <Box sx={{ flex: 1 }} />
        {order.status === 'DRAFT' && (
          <>
            <Button size="small" startIcon={<EditIcon />} onClick={() => setEditing(!editing)} variant={editing ? 'contained' : 'outlined'}>
              {editing ? 'Cancel Edit' : 'Edit'}
            </Button>
            <Button size="small" startIcon={<SubmitIcon />} variant="contained" onClick={handleSubmit} disabled={saving}>Submit</Button>
          </>
        )}
        {(order.status === 'SUBMITTED' || order.status === 'CONFIRMED') && (
          <Button size="small" startIcon={<WOIcon />} variant="contained" color="secondary" onClick={handleCreateWOs} disabled={saving}>
            Create Work Orders
          </Button>
        )}
      </Box>

      {/* Status stepper */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stepper activeStep={stepIdx} alternativeLabel>
          {STATUS_STEPS.map(label => <Step key={label}><StepLabel>{label.replace(/_/g, ' ')}</StepLabel></Step>)}
        </Stepper>
      </Paper>

      <Grid container spacing={3}>
        {/* Left */}
        <Grid item xs={12} md={8}>
          {/* Tabs */}
          <Paper sx={{ borderRadius: 2, mb: 3 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Line Items" />
              <Tab label="Details" />
              <Tab label="History" />
            </Tabs>

            {/* Tab: Lines */}
            {tab === 0 && (
              <Box sx={{ p: 2 }}>
                <LineItemsEditor
                  lines={lines}
                  onChange={setLines}
                  readOnly={!editing}
                  onOpenMaterialPicker={editing ? handleOpenMaterialPicker : undefined}
                  onOpenProcessingMenu={editing ? handleOpenProcessing : undefined}
                />
                {editing && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                    <Button onClick={() => { setEditing(false); setLines(order.lines || []) }}>Cancel</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>Save Changes</Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Tab: Details */}
            {tab === 1 && (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Division</Typography><Typography variant="body2" fontWeight={500}>{order.division || '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body2" fontWeight={500}>{order.location?.replace(/_/g, ' ') || '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Priority</Typography><Typography variant="body2" fontWeight={500}>{order.priority || '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Ownership</Typography><Typography variant="body2" fontWeight={500}>{order.ownership?.replace(/_/g, ' ') || '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">PO Number</Typography><Typography variant="body2" fontWeight={500}>{order.poNumber || '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Customer</Typography><Typography variant="body2" fontWeight={500}>{order.customerName || '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Requested Date</Typography><Typography variant="body2" fontWeight={500}>{order.requestedDate || '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body2" fontWeight={500}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</Typography></Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    {editing ? (
                      <TextField fullWidth multiline rows={3} value={notes} onChange={e => setNotes(e.target.value)} sx={{ mt: 0.5 }} />
                    ) : (
                      <Typography variant="body2">{order.notes || '—'}</Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab: History / Fulfillment Timeline */}
            {tab === 2 && (
              <Box sx={{ p: 2 }}>
                {fulfillment ? (
                  <Stack spacing={3}>
                    <OrderStatusTimeline
                      events={fulfillment.events || []}
                      shippedPct={fulfillment.lines ? orderShippedPct(fulfillment.lines) : 0}
                      fulfillmentStatus={fulfillment.fulfillmentStatus}
                    />
                    <ShipmentTracker
                      splits={fulfillment.splitShipments || []}
                      title="Split Shipments"
                    />
                  </Stack>
                ) : (
                  <Alert severity="info" variant="outlined">No fulfillment data available yet.</Alert>
                )}

                {/* CSR Override Audit Trail */}
                {overrides.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      ⚠️ CSR Overrides ({overrides.length})
                    </Typography>
                    <AuditLogViewer orderId={id} maxHeight={320} />
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right */}
        <Grid item xs={12} md={4}>
          <PricingSummaryPanel
            lines={lines}
            taxRate={6}
            priceSource={order.priceSource}
            contractName={order.contractName}
          />

          {/* Fulfillment Status */}
          {fulfillment && (
            <Box sx={{ mt: 3 }}>
              <PartialFulfillmentBanner
                order={fulfillment}
                shippedPct={fulfillment.lines ? orderShippedPct(fulfillment.lines) : 0}
                remaining={fulfillment.lines ? calcRemaining(fulfillment.lines) : {}}
                splitCount={fulfillment.splitShipments?.length || 0}
                showLines
              />
            </Box>
          )}

          <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {order.status === 'DRAFT' && (
                <Button fullWidth size="small" variant="contained" startIcon={<SubmitIcon />} onClick={handleSubmit} disabled={saving}>Submit Order</Button>
              )}
              {(order.status === 'SUBMITTED' || order.status === 'CONFIRMED') && (
                <Button fullWidth size="small" variant="contained" color="secondary" startIcon={<WOIcon />} onClick={handleCreateWOs} disabled={saving}>Create Work Orders</Button>
              )}
              {fulfillment && fulfillment.fulfillmentStatus !== ORDER_FULFILLMENT_STATUS.FULFILLED && (
                <Button fullWidth size="small" variant="contained" color="secondary" startIcon={<SplitIcon />} onClick={() => setSplitDialogOpen(true)}>
                  Split for Shipment
                </Button>
              )}
              <Button fullWidth size="small" variant="outlined" startIcon={<PrintIcon />} disabled>Print</Button>
              <Button fullWidth size="small" variant="outlined" startIcon={<DuplicateIcon />} disabled>Duplicate</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Dialogs ── */}
      <SplitShipmentDialog
        open={splitDialogOpen}
        onClose={() => setSplitDialogOpen(false)}
        order={fulfillment}
        onConfirm={async (splitLines, meta) => {
          setCreatingSplit(true)
          try {
            await createSplitShipment(fulfillment.id, splitLines, meta)
            setSplitDialogOpen(false)
            setSnack({ open: true, msg: 'Split shipment created!', severity: 'success' })
            // Refresh fulfillment
            const { data } = await getOrderFulfillmentDetail(fulfillment.id)
            setFulfillment(data)
          } catch (err) {
            setSnack({ open: true, msg: err.message, severity: 'error' })
          } finally {
            setCreatingSplit(false)
          }
        }}
        creating={creatingSplit}
      />
      <MaterialPicker open={materialPickerOpen} onClose={() => setMaterialPickerOpen(false)} onSelect={handleMaterialSelected} division={order.division} />
      <ProcessingMenuBuilder open={processingOpen} onClose={() => setProcessingOpen(false)} onSave={handleSaveProcessing} division={order.division} existingProcesses={processingIdx !== null ? (lines[processingIdx]?.processes || []) : []} />

      {/* Work Order result dialog */}
      <Dialog open={woDialogOpen} onClose={() => setWoDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Work Orders Created</DialogTitle>
        <DialogContent>
          {woResult && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>Created {woResult.workOrders?.length || 0} work order(s)</Alert>
              {woResult.workOrders?.map((wo, i) => (
                <Chip key={i} label={wo.woNumber || `WO-${i + 1}`} sx={{ mr: 1, mb: 1 }} color="primary" variant="outlined" />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => { setWoDialogOpen(false); loadOrder() }}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
