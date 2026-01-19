import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Stack,
  Grid,
  Paper,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  InputAdornment,
  Badge,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  QrCodeScanner as ScanIcon,
  LocalShipping as TruckIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Warning as IssueIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Map as MapIcon,
  ViewList,
  ViewModule,
} from '@mui/icons-material'
import { MATERIAL_OWNERSHIP, MATERIAL_FORMS, COMMON_GRADES } from '../constants/materials'
import InboundShipmentTracker from '../components/logistics/InboundShipmentTracker'

// Mock incoming shipments
const generateMockIncoming = () => [
  {
    id: 'RCV-001',
    carrier: 'ABC Trucking',
    bolNumber: 'BOL-2024-1234',
    expectedDate: new Date().toISOString(),
    status: 'ARRIVED',
    items: [
      { material: 'HR Coil 0.125" x 48"', grade: 'A36', weight: 45000, coils: 2, poNumber: 'PO-001' },
      { material: 'CR Sheet 16ga x 60"', grade: 'CQ', weight: 22000, coils: 1, poNumber: 'PO-002' },
    ],
    supplier: 'US Steel',
  },
  {
    id: 'RCV-002',
    carrier: 'Fast Freight',
    bolNumber: 'BOL-2024-1235',
    expectedDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'SCHEDULED',
    items: [
      { material: 'Galvanized Coil 0.060" x 36"', grade: 'G90', weight: 35000, coils: 3, poNumber: 'PO-003' },
    ],
    supplier: 'Nucor',
  },
  {
    id: 'RCV-003',
    carrier: 'Local Delivery',
    bolNumber: 'BOL-2024-1230',
    expectedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'RECEIVED',
    items: [
      { material: 'Stainless 304 0.048" x 48"', grade: '304-2B', weight: 18000, coils: 2, poNumber: 'PO-004' },
    ],
    supplier: 'Outokumpu',
  },
]

// Mock received inventory
const generateRecentReceived = () => [
  {
    id: 'INV-10001',
    tagNumber: 'TAG-10001',
    material: 'HR Coil 0.125" x 48"',
    grade: 'A36',
    weight: 22500,
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    location: 'Bay A-1',
    ownership: 'HOUSE_OWNED',
    status: 'AVAILABLE',
  },
  {
    id: 'INV-10002',
    tagNumber: 'TAG-10002',
    material: 'HR Coil 0.125" x 48"',
    grade: 'A36',
    weight: 22500,
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    location: 'Bay A-2',
    ownership: 'HOUSE_OWNED',
    status: 'AVAILABLE',
  },
  {
    id: 'INV-10003',
    tagNumber: 'TAG-10003',
    material: 'CR Sheet 16ga x 60"',
    grade: 'CQ',
    weight: 22000,
    receivedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    location: 'Bay B-1',
    ownership: 'CUSTOMER_OWNED',
    customerName: 'ABC Steel',
    status: 'AVAILABLE',
  },
]

const ReceivingPage = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [incomingShipments, setIncomingShipments] = useState([])
  const [recentReceived, setRecentReceived] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [viewMode, setViewMode] = useState('list') // 'list' or 'map'

  // Receive form state
  const [receiveForm, setReceiveForm] = useState({
    tagNumber: '',
    weight: '',
    location: '',
    ownership: 'HOUSE_OWNED',
    notes: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 400))
      setIncomingShipments(generateMockIncoming())
      setRecentReceived(generateRecentReceived())
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getStatusChip = (status) => {
    const configs = {
      SCHEDULED: { color: 'default', icon: <PendingIcon fontSize="small" /> },
      ARRIVED: { color: 'warning', icon: <TruckIcon fontSize="small" /> },
      RECEIVING: { color: 'info', icon: <InventoryIcon fontSize="small" /> },
      RECEIVED: { color: 'success', icon: <CheckIcon fontSize="small" /> },
      ISSUE: { color: 'error', icon: <IssueIcon fontSize="small" /> },
    }
    const config = configs[status] || configs.SCHEDULED
    return (
      <Chip
        icon={config.icon}
        label={status}
        size="small"
        color={config.color}
        variant="outlined"
      />
    )
  }

  const handleOpenReceiveDialog = (shipment) => {
    setSelectedShipment(shipment)
    setReceiveForm({
      tagNumber: `TAG-${Date.now().toString().slice(-5)}`,
      weight: shipment?.items?.[0]?.weight?.toString() || '',
      location: '',
      ownership: 'HOUSE_OWNED',
      notes: '',
    })
    setReceiveDialogOpen(true)
  }

  const handleReceive = () => {
    const newItem = {
      id: `INV-${Date.now()}`,
      tagNumber: receiveForm.tagNumber,
      material: selectedShipment?.items?.[0]?.material || 'Unknown',
      grade: selectedShipment?.items?.[0]?.grade || '',
      weight: parseInt(receiveForm.weight) || 0,
      receivedAt: new Date().toISOString(),
      location: receiveForm.location,
      ownership: receiveForm.ownership,
      status: 'AVAILABLE',
    }
    setRecentReceived((prev) => [newItem, ...prev])
    setReceiveDialogOpen(false)
    setSnackbar({
      open: true,
      message: `Received ${newItem.tagNumber} - ${newItem.material}`,
      severity: 'success',
    })
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatWeight = (lbs) => {
    if (!lbs) return '—'
    return lbs >= 1000 ? `${(lbs / 1000).toFixed(1)}k lbs` : `${lbs} lbs`
  }

  // Stats
  const stats = {
    scheduled: incomingShipments.filter((s) => s.status === 'SCHEDULED').length,
    arrived: incomingShipments.filter((s) => s.status === 'ARRIVED').length,
    todayReceived: recentReceived.length,
    totalWeight: recentReceived.reduce((acc, r) => acc + (r.weight || 0), 0),
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }} elevation={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Receiving
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage incoming shipments and inventory
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, v) => v && setViewMode(v)}
              size="small"
            >
              <ToggleButton value="list">
                <ViewList />
              </ToggleButton>
              <ToggleButton value="map">
                <MapIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            <Button variant="outlined" startIcon={<ScanIcon />}>
              Scan
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenReceiveDialog(null)}>
              Quick Receive
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Stats Bar */}
      <Paper sx={{ mx: 3, mt: 2, p: 2 }} variant="outlined">
        <Stack direction="row" spacing={4} divider={<Box sx={{ borderRight: 1, borderColor: 'divider' }} />}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Scheduled Today
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {stats.scheduled}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Arrived / Waiting
            </Typography>
            <Typography variant="h6" fontWeight={600} color="warning.main">
              {stats.arrived}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Received Today
            </Typography>
            <Typography variant="h6" fontWeight={600} color="success.main">
              {stats.todayReceived}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Weight
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatWeight(stats.totalWeight)}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Box sx={{ px: 3, pt: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab
            label={
              <Badge badgeContent={stats.arrived} color="warning">
                <Box sx={{ pr: 2 }}>Incoming</Box>
              </Badge>
            }
          />
          <Tab label="Recent Received" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {/* Map View */}
        {viewMode === 'map' && activeTab === 0 && (
          <Box sx={{ mb: 3 }}>
            <InboundShipmentTracker
              shipments={incomingShipments.map(s => ({
                ...s,
                currentLocation: s.status === 'ARRIVED' ? {
                  coordinates: [-87.6298, 41.8781],
                } : {
                  coordinates: [-85.5 + Math.random(), 41.5 + Math.random()],
                },
                origin: {
                  coordinates: [-84.5, 39.1],
                },
                eta: s.expectedDate,
                driverPhone: '(555) 123-4567',
              }))}
              warehouseLocation={[-87.6298, 41.8781]}
              warehouseName="Main Warehouse"
              height="450px"
            />
          </Box>
        )}

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search by BOL, tag, or material..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2, minWidth: 300 }}
        />

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {incomingShipments
              .filter((s) => s.status !== 'RECEIVED')
              .map((shipment) => (
                <Grid item xs={12} md={6} lg={4} key={shipment.id}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {shipment.bolNumber}
                      </Typography>
                      {getStatusChip(shipment.status)}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {shipment.carrier} • {shipment.supplier}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Expected: {formatDate(shipment.expectedDate)}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Stack spacing={0.5}>
                      {shipment.items.map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">{item.material}</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatWeight(item.weight)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      {shipment.status === 'ARRIVED' && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenReceiveDialog(shipment)}
                        >
                          Receive
                        </Button>
                      )}
                      <Button variant="outlined" size="small">
                        Details
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
          </Grid>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tag #</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Weight</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Ownership</TableCell>
                  <TableCell>Received</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentReceived.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{item.tagNumber}</Typography>
                    </TableCell>
                    <TableCell>{item.material}</TableCell>
                    <TableCell>{item.grade}</TableCell>
                    <TableCell>{formatWeight(item.weight)}</TableCell>
                    <TableCell>
                      <Chip label={item.location} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.ownership === 'CUSTOMER_OWNED' ? 'Customer' : 'House'}
                        size="small"
                        color={item.ownership === 'CUSTOMER_OWNED' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(item.receivedAt)}</TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <PrintIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Receive Dialog */}
      <Dialog open={receiveDialogOpen} onClose={() => setReceiveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Receive Material
          <IconButton onClick={() => setReceiveDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedShipment && (
              <Alert severity="info">
                Receiving from: {selectedShipment.bolNumber} - {selectedShipment.supplier}
              </Alert>
            )}
            <TextField
              label="Tag Number"
              value={receiveForm.tagNumber}
              onChange={(e) => setReceiveForm({ ...receiveForm, tagNumber: e.target.value })}
              fullWidth
            />
            <TextField
              label="Weight (lbs)"
              type="number"
              value={receiveForm.weight}
              onChange={(e) => setReceiveForm({ ...receiveForm, weight: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Storage Location"
              value={receiveForm.location}
              onChange={(e) => setReceiveForm({ ...receiveForm, location: e.target.value })}
              fullWidth
            >
              {['Bay A-1', 'Bay A-2', 'Bay B-1', 'Bay B-2', 'Bay C-1', 'Staging'].map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Ownership"
              value={receiveForm.ownership}
              onChange={(e) => setReceiveForm({ ...receiveForm, ownership: e.target.value })}
              fullWidth
            >
              <MenuItem value="HOUSE_OWNED">House Owned (Stock)</MenuItem>
              <MenuItem value="CUSTOMER_OWNED">Customer Owned (Toll)</MenuItem>
            </TextField>
            <TextField
              label="Notes"
              value={receiveForm.notes}
              onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReceiveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleReceive}
            disabled={!receiveForm.tagNumber || !receiveForm.weight || !receiveForm.location}
          >
            Receive & Print Tag
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ReceivingPage
