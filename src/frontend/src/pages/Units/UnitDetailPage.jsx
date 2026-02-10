import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Button,
  Stack,
  Divider,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Avatar,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  QrCode2 as QrCodeIcon,
  Inventory as InventoryIcon,
  Description as DocIcon,
  Timeline as TimelineIcon,
  LocalShipping as ShipIcon,
  AutoAwesome as AIIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useApiQuery, useApiMutation } from '../../hooks/useApiQuery'
import { getUnit, getUnitTrace, updateUnit } from '../../api'
import { StatusChip, DataTable } from '../../components/common'
import { TraceTimeline } from '../../components/traceability'

// ─── Status & QC options matching Prisma enums ───
const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ALLOCATED', label: 'Allocated' },
  { value: 'IN_PROCESS', label: 'In Process' },
  { value: 'HOLD', label: 'Hold' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'CONSUMED', label: 'Consumed' },
]

const QC_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'HOLD', label: 'Hold' },
]

const FORM_OPTIONS = [
  { value: 'COIL', label: 'Coil' },
  { value: 'SHEET', label: 'Sheet' },
  { value: 'PLATE', label: 'Plate' },
  { value: 'BAR', label: 'Bar' },
  { value: 'TUBE', label: 'Tube' },
  { value: 'BEAM', label: 'Beam' },
  { value: 'REBAR', label: 'Rebar' },
  { value: 'WIRE', label: 'Wire' },
]

const EDGE_OPTIONS = [
  { value: 'MILL', label: 'Mill Edge' },
  { value: 'SLIT', label: 'Slit Edge' },
  { value: 'TRIMMED', label: 'Trimmed' },
]

// ─── Edit Unit Dialog ───
function EditUnitDialog({ open, onClose, unit, onSave, saving, saveError }) {
  const [form, setForm] = useState({})

  useEffect(() => {
    if (unit && open) {
      setForm({
        coilNumber: unit.coilNumber || unit.unitNumber || '',
        form: unit.form || 'COIL',
        status: unit.status || 'AVAILABLE',
        qcStatus: unit.qcStatus || unit.qualityStatus || 'PENDING',
        grossWeightLb: unit.grossWeightLb ?? unit.weight ?? '',
        netWeightLb: unit.netWeightLb ?? unit.weight ?? '',
        thicknessIn: unit.thicknessIn ?? unit.dimensions?.gauge ?? '',
        widthIn: unit.widthIn ?? unit.dimensions?.width ?? '',
        lengthIn: unit.lengthIn ?? '',
        odIn: unit.odIn ?? unit.dimensions?.outerDiameter ?? '',
        idIn: unit.idIn ?? unit.dimensions?.innerDiameter ?? '',
        gauge: unit.gauge ?? '',
        temper: unit.temper ?? '',
        finish: unit.finish ?? '',
        coating: unit.coating ?? '',
        coatingWeight: unit.coatingWeight ?? '',
        edgeCondition: unit.edgeCondition ?? '',
        binLocation: unit.binLocation ?? '',
        holdCode: unit.holdCode ?? '',
        unitCost: unit.unitCost ?? '',
        landedCost: unit.landedCost ?? '',
      })
    }
  }, [unit, open])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = () => {
    // Build payload – only send changed & non-empty numeric values as numbers
    const payload = {}
    const numericFields = ['grossWeightLb', 'netWeightLb', 'thicknessIn', 'widthIn', 'lengthIn', 'odIn', 'idIn', 'gauge', 'unitCost', 'landedCost']

    Object.entries(form).forEach(([key, val]) => {
      if (val === '' || val === null || val === undefined) return
      if (numericFields.includes(key)) {
        const num = parseFloat(val)
        if (!isNaN(num)) payload[key] = num
      } else {
        payload[key] = val
      }
    })

    onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <EditIcon color="primary" />
          <Typography variant="h6">Edit Unit</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>
        )}

        {/* ─ Identity ─ */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Identity</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Unit / Coil Number" value={form.coilNumber ?? ''} onChange={handleChange('coilNumber')} disabled />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth select size="small" label="Form"
              value={form.form || ''}
              onChange={handleChange('form')}
            >
              {FORM_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>

        {/* ─ Status ─ */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Status</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth select size="small" label="Status"
              value={form.status || ''}
              onChange={handleChange('status')}
            >
              {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth select size="small" label="QC Status"
              value={form.qcStatus || ''}
              onChange={handleChange('qcStatus')}
            >
              {QC_STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Hold Code" value={form.holdCode ?? ''} onChange={handleChange('holdCode')} />
          </Grid>
        </Grid>

        {/* ─ Dimensions ─ */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Dimensions &amp; Weight</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Gross Weight (lbs)" type="number" value={form.grossWeightLb ?? ''} onChange={handleChange('grossWeightLb')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Net Weight (lbs)" type="number" value={form.netWeightLb ?? ''} onChange={handleChange('netWeightLb')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Thickness (in)" type="number" inputProps={{ step: 0.001 }} value={form.thicknessIn ?? ''} onChange={handleChange('thicknessIn')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Width (in)" type="number" inputProps={{ step: 0.01 }} value={form.widthIn ?? ''} onChange={handleChange('widthIn')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Length (in)" type="number" inputProps={{ step: 0.01 }} value={form.lengthIn ?? ''} onChange={handleChange('lengthIn')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="OD (in)" type="number" inputProps={{ step: 0.01 }} value={form.odIn ?? ''} onChange={handleChange('odIn')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="ID (in)" type="number" inputProps={{ step: 0.01 }} value={form.idIn ?? ''} onChange={handleChange('idIn')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Gauge" type="number" value={form.gauge ?? ''} onChange={handleChange('gauge')} />
          </Grid>
        </Grid>

        {/* ─ Surface / Coating ─ */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Surface &amp; Coating</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Temper" value={form.temper ?? ''} onChange={handleChange('temper')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Finish" value={form.finish ?? ''} onChange={handleChange('finish')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Coating" value={form.coating ?? ''} onChange={handleChange('coating')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Coating Weight" value={form.coatingWeight ?? ''} onChange={handleChange('coatingWeight')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth select size="small" label="Edge Condition"
              value={form.edgeCondition || ''}
              onChange={handleChange('edgeCondition')}
            >
              <MenuItem value="">None</MenuItem>
              {EDGE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>

        {/* ─ Location / Cost ─ */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Location &amp; Cost</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Bin Location" value={form.binLocation ?? ''} onChange={handleChange('binLocation')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Unit Cost ($)" type="number" inputProps={{ step: 0.01 }} value={form.unitCost ?? ''} onChange={handleChange('unitCost')} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Landed Cost ($)" type="number" inputProps={{ step: 0.01 }} value={form.landedCost ?? ''} onChange={handleChange('landedCost')} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function TabPanel({ children, value, index, ...props }) {
  return (
    <div hidden={value !== index} {...props}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <TableRow>
      <TableCell component="th" sx={{ fontWeight: 500, width: '40%', color: 'text.secondary' }}>
        {label}
      </TableCell>
      <TableCell>{value || '-'}</TableCell>
    </TableRow>
  )
}

export default function UnitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)

  // ─── Edit state ───
  const [editOpen, setEditOpen] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })

  const { data: unit, isLoading, refetch } = useApiQuery(
    ['unit', id],
    () => getUnit(id)
  )

  const { data: traceData } = useApiQuery(
    ['unitTrace', id],
    () => getUnitTrace(id),
    { enabled: tabValue === 2 }
  )

  // Mutation for saving edits
  const saveMutation = useApiMutation(
    (payload) => updateUnit(id, payload),
    {
      invalidateKeys: [['unit', id], 'units'],
      onSuccess: () => {
        setEditOpen(false)
        setSaveError(null)
        setSnack({ open: true, message: 'Unit updated successfully', severity: 'success' })
        refetch()
      },
      onError: (err) => {
        setSaveError(err?.response?.data?.error || err.message || 'Failed to save changes')
      },
    }
  )

  const handleEditSave = useCallback((payload) => {
    setSaveError(null)
    saveMutation.mutate(payload)
  }, [saveMutation])

  // Mock data for demo
  const mockUnit = {
    id: 1,
    unitNumber: 'U-2024-0001',
    heatNumber: 'HT-2024-001',
    heatId: 1,
    grade: 'A36',
    specification: 'ASTM A36/A36M-19',
    status: 'AVAILABLE',
    weight: 12500,
    weightUnit: 'lbs',
    dimensions: {
      width: 48,
      gauge: 0.075,
      outerDiameter: 72,
      innerDiameter: 20,
    },
    location: {
      warehouse: 'Main Warehouse',
      bay: 'A',
      row: '01',
      position: '01',
    },
    allocations: [
      { orderId: 1, orderNumber: 'SO-2024-001', quantity: 12500, status: 'PENDING' },
    ],
    movements: [
      { id: 1, from: 'Receiving', to: 'Bay A-01', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), user: 'John Smith' },
    ],
    qualityStatus: 'PASS',
    certifications: ['MTC', 'ISO 9001'],
    receivedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  }

  const mockTraceEvents = [
    { id: 1, type: 'CREATED', title: 'Unit Created', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), actor: 'System', location: 'US Steel Gary Works', metadata: { heat: 'HT-2024-001' } },
    { id: 2, type: 'RECEIVED', title: 'Received at Warehouse', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), actor: 'John Smith', location: 'Main Warehouse' },
    { id: 3, type: 'TRANSFERRED', title: 'Moved to Bay A-01', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), actor: 'John Smith', location: 'Bay A-01' },
    { id: 4, type: 'TESTED', title: 'QC Inspection Complete', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), actor: 'QC Lab', description: 'Visual and dimensional inspection passed' },
    { id: 5, type: 'APPROVED', title: 'Released for Sale', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), actor: 'QC Manager' },
  ]

  const displayUnit = unit || mockUnit
  const displayTrace = traceData?.events || mockTraceEvents

  const movementColumns = [
    { id: 'from', label: 'From', minWidth: 120 },
    { id: 'to', label: 'To', minWidth: 120 },
    { id: 'date', label: 'Date', minWidth: 120, render: (row) => new Date(row.date).toLocaleString() },
    { id: 'user', label: 'User', minWidth: 120 },
  ]

  const allocationColumns = [
    { id: 'orderNumber', label: 'Order #', minWidth: 120 },
    { id: 'quantity', label: 'Quantity', minWidth: 100, render: (row) => `${row.quantity?.toLocaleString()} lbs` },
    { id: 'status', label: 'Status', minWidth: 100, render: (row) => <StatusChip status={row.status} /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)' }}>
      {/* Modern Header */}
      <Box sx={{ 
        px: 3, 
        py: 2.5, 
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
        mb: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/units')} sx={{ color: 'white' }}>
            <BackIcon />
          </IconButton>
          <Avatar sx={{ 
            width: 56, 
            height: 56, 
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
          }}>
            <InventoryIcon sx={{ fontSize: 30 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                {displayUnit.unitNumber}
              </Typography>
              <StatusChip status={displayUnit.status} />
              <StatusChip status={displayUnit.qualityStatus} />
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Heat: {displayUnit.heatNumber} | Grade: {displayUnit.grade}
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button 
              startIcon={<QrCodeIcon />} 
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              QR Code
            </Button>
            <Button 
              startIcon={<PrintIcon />} 
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Print Label
            </Button>
            <Button 
              startIcon={<EditIcon />} 
              variant="contained"
              onClick={() => { setSaveError(null); setEditOpen(true) }}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              Edit
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Weight</Typography>
              <Typography variant="h5">{displayUnit.weight?.toLocaleString()} {displayUnit.weightUnit}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Dimensions</Typography>
              <Typography variant="h5">
                {displayUnit.dimensions?.width}" x {displayUnit.dimensions?.gauge}"
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Location</Typography>
              <Typography variant="h5">
                {displayUnit.location?.warehouse || displayUnit.location}
              </Typography>
              {displayUnit.location?.bay && (
                <Typography variant="caption" color="text.secondary">
                  Bay {displayUnit.location.bay}-{displayUnit.location.row}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Received</Typography>
              <Typography variant="h5">
                {new Date(displayUnit.receivedDate).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<InventoryIcon />} iconPosition="start" label="Details" />
          <Tab icon={<ShipIcon />} iconPosition="start" label="Movements" />
          <Tab icon={<TimelineIcon />} iconPosition="start" label="Trace History" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Unit Information</Typography>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Unit Number" value={displayUnit.unitNumber} />
                  <InfoRow label="Heat Number" value={displayUnit.heatNumber} />
                  <InfoRow label="Grade" value={displayUnit.grade} />
                  <InfoRow label="Specification" value={displayUnit.specification} />
                  <InfoRow label="Weight" value={`${displayUnit.weight?.toLocaleString()} ${displayUnit.weightUnit}`} />
                  <InfoRow label="Status" value={<StatusChip status={displayUnit.status} />} />
                  <InfoRow label="Quality Status" value={<StatusChip status={displayUnit.qualityStatus} />} />
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Dimensions</Typography>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Width" value={`${displayUnit.dimensions?.width}"`} />
                  <InfoRow label="Gauge" value={`${displayUnit.dimensions?.gauge}"`} />
                  <InfoRow label="Outer Diameter" value={displayUnit.dimensions?.outerDiameter ? `${displayUnit.dimensions.outerDiameter}"` : '-'} />
                  <InfoRow label="Inner Diameter" value={displayUnit.dimensions?.innerDiameter ? `${displayUnit.dimensions.innerDiameter}"` : '-'} />
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Allocations</Typography>
              {displayUnit.allocations?.length > 0 ? (
                <DataTable
                  columns={allocationColumns}
                  data={displayUnit.allocations}
                  pageSize={5}
                  showSearch={false}
                />
              ) : (
                <Typography color="text.secondary">No allocations</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Movement History</Typography>
          <DataTable
            columns={movementColumns}
            data={displayUnit.movements || []}
            pageSize={10}
            showSearch={false}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Full Trace History</Typography>
          <TraceTimeline events={displayTrace} />
        </Paper>
      </TabPanel>
      </Box>

      {/* ─── Edit Unit Dialog ─── */}
      <EditUnitDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        unit={displayUnit}
        onSave={handleEditSave}
        saving={saveMutation.isPending}
        saveError={saveError}
      />

      {/* ─── Success / Error Snackbar ─── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
