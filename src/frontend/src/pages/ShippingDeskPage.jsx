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
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  Divider,
  Tabs,
  Tab,
  Badge,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  LinearProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  LocalShipping as TruckIcon,
  Print as PrintIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Assignment as BOLIcon,
  QrCodeScanner as ScanIcon,
  Close as CloseIcon,
  Send as ShipIcon,
  Inventory as PackageIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Map as MapIcon,
  Route as RouteIcon,
  Speed as SpeedIcon,
  AttachMoney,
  LocalGasStation,
} from '@mui/icons-material'
import { JOB_STATUSES, JOB_STATUS_CONFIG } from '../constants/jobStatuses'
import { PRIORITY_LEVELS_CONFIG } from '../constants/materials'
import DeliveryMapDialog from '../components/logistics/DeliveryMapDialog'
import { 
  geocodeAddress, 
  getTrafficRoute, 
  calculateFuelCost, 
  calculateDeliveryCost,
  estimateDeliveryTime,
} from '../services/mapService'

// Mock shipments ready to ship
const generateMockShipments = () => [
  {
    id: 'SHIP-001',
    orderNumber: 'SO-2024-0156',
    customerName: 'ABC Steel Corporation',
    customerContact: 'John Smith',
    customerPhone: '(555) 123-4567',
    status: 'READY',
    priority: 'HOT',
    jobs: [
      { jobNumber: 'JOB-1005', material: 'HR Slit Coil', packages: 3, weight: 28500 },
    ],
    totalPackages: 3,
    totalWeight: 28500,
    carrier: null,
    bolNumber: null,
    pickupTime: null,
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    deliveryAddress: '123 Industrial Blvd, Steel City, PA 15001',
    specialInstructions: 'Dock door #3. Call 30 min before arrival.',
  },
  {
    id: 'SHIP-002',
    orderNumber: 'SO-2024-0157',
    customerName: 'Metro Manufacturing',
    customerContact: 'Sarah Johnson',
    customerPhone: '(555) 234-5678',
    status: 'READY',
    priority: 'NORMAL',
    jobs: [
      { jobNumber: 'JOB-1006', material: 'CR CTL Sheets', packages: 4, weight: 18000 },
      { jobNumber: 'JOB-1008', material: 'Galv Slit Coil', packages: 2, weight: 12000 },
    ],
    totalPackages: 6,
    totalWeight: 30000,
    carrier: null,
    bolNumber: null,
    pickupTime: null,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    deliveryAddress: '456 Factory Lane, Pittsburgh, PA 15222',
    specialInstructions: null,
  },
  {
    id: 'SHIP-003',
    orderNumber: 'SO-2024-0155',
    customerName: 'Industrial Corp',
    customerContact: 'Mike Davis',
    customerPhone: '(555) 345-6789',
    status: 'SCHEDULED',
    priority: 'NORMAL',
    jobs: [
      { jobNumber: 'JOB-1004', material: 'SS 304 CTL', packages: 2, weight: 8500 },
    ],
    totalPackages: 2,
    totalWeight: 8500,
    carrier: 'ABC Trucking',
    bolNumber: 'BOL-2024-5678',
    pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    deliveryAddress: '789 Commerce Dr, Youngstown, OH 44501',
    specialInstructions: null,
  },
]

// Mock shipped today
const generateRecentShipped = () => [
  {
    id: 'SHIP-099',
    orderNumber: 'SO-2024-0154',
    customerName: 'Steel Solutions',
    packages: 4,
    weight: 22000,
    carrier: 'Fast Freight',
    bolNumber: 'BOL-2024-5670',
    shippedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'SHIP-098',
    orderNumber: 'SO-2024-0153',
    customerName: 'Precision Parts',
    packages: 1,
    weight: 5500,
    carrier: 'Local Delivery',
    bolNumber: 'BOL-2024-5669',
    shippedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
]

const ShippingDeskPage = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [shipments, setShipments] = useState([])
  const [recentShipped, setRecentShipped] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [shipDialogOpen, setShipDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  
  // Map dialog state
  const [mapDialogOpen, setMapDialogOpen] = useState(false)
  const [routeInfo, setRouteInfo] = useState(null)
  const [calculatingRoute, setCalculatingRoute] = useState(false)

  // Ship form state
  const [shipForm, setShipForm] = useState({
    carrier: '',
    bolNumber: '',
    driverName: '',
    truckNumber: '',
    sealNumber: '',
    printBOL: true,
    printLabels: true,
    sendNotification: true,
  })

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    carrier: '',
    pickupDate: '',
    pickupTime: '',
    notes: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 400))
      setShipments(generateMockShipments())
      setRecentShipped(generateRecentShipped())
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenScheduleDialog = (shipment) => {
    setSelectedShipment(shipment)
    setScheduleForm({
      carrier: '',
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTime: '',
      notes: '',
    })
    setScheduleDialogOpen(true)
  }

  const handleOpenShipDialog = (shipment) => {
    setSelectedShipment(shipment)
    setShipForm({
      carrier: shipment.carrier || '',
      bolNumber: shipment.bolNumber || `BOL-${Date.now().toString().slice(-6)}`,
      driverName: '',
      truckNumber: '',
      sealNumber: '',
      printBOL: true,
      printLabels: true,
      sendNotification: true,
    })
    setShipDialogOpen(true)
  }

  const handleSchedulePickup = () => {
    setShipments((prev) =>
      prev.map((s) =>
        s.id === selectedShipment.id
          ? {
              ...s,
              status: 'SCHEDULED',
              carrier: scheduleForm.carrier,
              pickupTime: new Date(`${scheduleForm.pickupDate}T${scheduleForm.pickupTime}`).toISOString(),
            }
          : s
      )
    )
    setScheduleDialogOpen(false)
    setSnackbar({
      open: true,
      message: `Pickup scheduled for ${selectedShipment.orderNumber}`,
      severity: 'success',
    })
  }

  const handleShip = () => {
    // Move to shipped
    const shipped = {
      ...selectedShipment,
      carrier: shipForm.carrier,
      bolNumber: shipForm.bolNumber,
      shippedAt: new Date().toISOString(),
      routeInfo: routeInfo, // Store route info with shipment
    }
    setRecentShipped((prev) => [shipped, ...prev])

    // Remove from pending
    setShipments((prev) => prev.filter((s) => s.id !== selectedShipment.id))

    setShipDialogOpen(false)
    setRouteInfo(null)
    setSnackbar({
      open: true,
      message: `Shipped ${selectedShipment.orderNumber} - BOL: ${shipForm.bolNumber}`,
      severity: 'success',
    })
  }

  // Open map dialog for route preview
  const handleViewRoute = (shipment) => {
    setSelectedShipment(shipment)
    setMapDialogOpen(true)
  }

  // Handle route confirmation from map dialog
  const handleRouteConfirmed = (routeData) => {
    setRouteInfo(routeData)
    setSnackbar({
      open: true,
      message: `Route validated: ${routeData.distance?.toFixed(1)} mi, ETA ${routeData.timeEstimate?.duration} min`,
      severity: 'success',
    })
  }

  // Calculate quick route estimate
  const calculateQuickRoute = async (shipment) => {
    setCalculatingRoute(true)
    try {
      const destCoords = await geocodeAddress(shipment.deliveryAddress)
      const route = await getTrafficRoute([
        [-87.6298, 41.8781], // Warehouse (Chicago)
        destCoords.coordinates,
      ])
      const fuelCost = calculateFuelCost(route.distance)
      const deliveryCost = calculateDeliveryCost(route.distance, shipment.totalWeight)
      
      return {
        distance: route.distance,
        duration: route.duration,
        fuelCost,
        deliveryCost,
      }
    } catch (err) {
      console.error('Route calculation error:', err)
      return null
    } finally {
      setCalculatingRoute(false)
    }
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

  const getStatusChip = (status) => {
    const configs = {
      READY: { color: 'warning', label: 'Ready to Ship' },
      SCHEDULED: { color: 'info', label: 'Pickup Scheduled' },
      LOADING: { color: 'primary', label: 'Loading' },
      SHIPPED: { color: 'success', label: 'Shipped' },
    }
    const config = configs[status] || configs.READY
    return <Chip label={config.label} size="small" color={config.color} />
  }

  // Stats
  const stats = {
    readyToShip: shipments.filter((s) => s.status === 'READY').length,
    scheduled: shipments.filter((s) => s.status === 'SCHEDULED').length,
    hotOrders: shipments.filter((s) => s.priority === 'HOT').length,
    shippedToday: recentShipped.length,
    totalWeight: shipments.reduce((acc, s) => acc + (s.totalWeight || 0), 0),
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }} elevation={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Shipping Desk
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage outbound shipments and BOLs
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ScanIcon />}>
              Scan
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              Print BOLs
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Stats Bar */}
      <Paper sx={{ mx: 3, mt: 2, p: 2 }} variant="outlined">
        <Stack direction="row" spacing={4} divider={<Box sx={{ borderRight: 1, borderColor: 'divider' }} />}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Ready to Ship
            </Typography>
            <Typography variant="h6" fontWeight={600} color="warning.main">
              {stats.readyToShip}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Scheduled
            </Typography>
            <Typography variant="h6" fontWeight={600} color="info.main">
              {stats.scheduled}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Hot Orders
            </Typography>
            <Typography variant="h6" fontWeight={600} color="error.main">
              {stats.hotOrders}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Shipped Today
            </Typography>
            <Typography variant="h6" fontWeight={600} color="success.main">
              {stats.shippedToday}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Pending Weight
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
              <Badge badgeContent={stats.readyToShip + stats.scheduled} color="primary">
                <Box sx={{ pr: 2 }}>Pending Shipments</Box>
              </Badge>
            }
          />
          <Tab label="Shipped Today" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search by order, customer, or BOL..."
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
            {shipments
              .filter((s) =>
                s.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.customerName.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((shipment) => {
                const priorityConfig = PRIORITY_LEVELS_CONFIG?.[shipment.priority] || {}
                const isHot = shipment.priority === 'HOT'

                return (
                  <Grid item xs={12} lg={6} key={shipment.id}>
                    <Card
                      sx={{
                        border: '2px solid',
                        borderColor: isHot ? 'error.main' : 'divider',
                        animation: isHot ? 'pulse 2s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%, 100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.3)' },
                          '50%': { boxShadow: '0 0 0 8px rgba(211, 47, 47, 0)' },
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {shipment.orderNumber}
                          </Typography>
                          <Stack direction="row" spacing={0.5}>
                            <Chip
                              label={shipment.priority}
                              size="small"
                              sx={{
                                backgroundColor: priorityConfig.bgColor,
                                color: priorityConfig.color,
                                fontWeight: 600,
                              }}
                            />
                            {getStatusChip(shipment.status)}
                          </Stack>
                        </Box>

                        <Typography variant="subtitle1" fontWeight={500}>
                          {shipment.customerName}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <PhoneIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {shipment.customerPhone}
                          </Typography>
                        </Stack>

                        <Divider sx={{ my: 1 }} />

                        {/* Jobs */}
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Items:
                        </Typography>
                        {shipment.jobs.map((job, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              py: 0.5,
                              borderBottom: idx < shipment.jobs.length - 1 ? '1px solid' : 'none',
                              borderColor: 'divider',
                            }}
                          >
                            <Typography variant="body2">
                              {job.jobNumber} - {job.material}
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {job.packages} pkg / {formatWeight(job.weight)}
                            </Typography>
                          </Box>
                        ))}

                        {/* Totals */}
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Stack direction="row" spacing={3}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Packages
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {shipment.totalPackages}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Weight
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {formatWeight(shipment.totalWeight)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Due
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {formatDate(shipment.dueDate)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>

                        {/* Carrier Info */}
                        {shipment.status === 'SCHEDULED' && (
                          <Alert severity="info" sx={{ mt: 2 }} icon={<TruckIcon />}>
                            <Typography variant="body2">
                              <strong>{shipment.carrier}</strong> - Pickup: {formatDate(shipment.pickupTime)}
                            </Typography>
                          </Alert>
                        )}

                        {/* Special Instructions */}
                        {shipment.specialInstructions && (
                          <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                            <Typography variant="caption">{shipment.specialInstructions}</Typography>
                          </Alert>
                        )}
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0, flexWrap: 'wrap', gap: 1 }}>
                        {shipment.status === 'READY' && (
                          <>
                            <Tooltip title="Preview route and calculate ETA">
                              <Button
                                variant="outlined"
                                startIcon={<MapIcon />}
                                onClick={() => handleViewRoute(shipment)}
                                size="small"
                              >
                                Route
                              </Button>
                            </Tooltip>
                            <Button
                              variant="outlined"
                              startIcon={<TruckIcon />}
                              onClick={() => handleOpenScheduleDialog(shipment)}
                            >
                              Schedule
                            </Button>
                            <Button
                              variant="contained"
                              startIcon={<ShipIcon />}
                              onClick={() => handleOpenShipDialog(shipment)}
                            >
                              Ship Now
                            </Button>
                          </>
                        )}
                        {shipment.status === 'SCHEDULED' && (
                          <>
                            <Button
                              variant="outlined"
                              startIcon={<MapIcon />}
                              onClick={() => handleViewRoute(shipment)}
                              size="small"
                            >
                              Track
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<ShipIcon />}
                              onClick={() => handleOpenShipDialog(shipment)}
                            >
                              Confirm Shipment
                            </Button>
                          </>
                        )}
                        <Button variant="outlined" startIcon={<PrintIcon />} size="small">
                          Print BOL
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                )
              })}
          </Grid>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Shipment ID</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Carrier</TableCell>
                  <TableCell>BOL</TableCell>
                  <TableCell>Packages</TableCell>
                  <TableCell>Weight</TableCell>
                  <TableCell>Shipped</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentShipped.map((shipment) => (
                  <TableRow key={shipment.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{shipment.id}</Typography>
                    </TableCell>
                    <TableCell>{shipment.orderNumber}</TableCell>
                    <TableCell>{shipment.customerName}</TableCell>
                    <TableCell>{shipment.carrier}</TableCell>
                    <TableCell>
                      <Chip label={shipment.bolNumber} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{shipment.packages}</TableCell>
                    <TableCell>{formatWeight(shipment.weight)}</TableCell>
                    <TableCell>{formatDate(shipment.shippedAt)}</TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Schedule Pickup
          <IconButton onClick={() => setScheduleDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedShipment && (
              <Alert severity="info">
                Order: {selectedShipment.orderNumber} | {selectedShipment.customerName}
              </Alert>
            )}
            <TextField
              select
              label="Carrier"
              value={scheduleForm.carrier}
              onChange={(e) => setScheduleForm({ ...scheduleForm, carrier: e.target.value })}
              fullWidth
            >
              {['ABC Trucking', 'Fast Freight', 'Local Delivery', 'Customer Pickup', 'LTL Carrier'].map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Pickup Date"
                  type="date"
                  value={scheduleForm.pickupDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, pickupDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Pickup Time"
                  type="time"
                  value={scheduleForm.pickupTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, pickupTime: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Notes"
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSchedulePickup}
            disabled={!scheduleForm.carrier || !scheduleForm.pickupDate || !scheduleForm.pickupTime}
          >
            Schedule Pickup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onClose={() => setShipDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirm Shipment
          <IconButton onClick={() => setShipDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedShipment && (
              <Alert severity="info">
                {selectedShipment.orderNumber} | {selectedShipment.totalPackages} packages | {formatWeight(selectedShipment.totalWeight)}
              </Alert>
            )}
            <TextField
              select
              label="Carrier"
              value={shipForm.carrier}
              onChange={(e) => setShipForm({ ...shipForm, carrier: e.target.value })}
              fullWidth
            >
              {['ABC Trucking', 'Fast Freight', 'Local Delivery', 'Customer Pickup', 'LTL Carrier'].map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="BOL Number"
              value={shipForm.bolNumber}
              onChange={(e) => setShipForm({ ...shipForm, bolNumber: e.target.value })}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Driver Name"
                  value={shipForm.driverName}
                  onChange={(e) => setShipForm({ ...shipForm, driverName: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Truck/Trailer #"
                  value={shipForm.truckNumber}
                  onChange={(e) => setShipForm({ ...shipForm, truckNumber: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Seal Number"
              value={shipForm.sealNumber}
              onChange={(e) => setShipForm({ ...shipForm, sealNumber: e.target.value })}
              fullWidth
            />
            <Divider />
            <FormControlLabel
              control={
                <Checkbox
                  checked={shipForm.printBOL}
                  onChange={(e) => setShipForm({ ...shipForm, printBOL: e.target.checked })}
                />
              }
              label="Print Bill of Lading"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={shipForm.printLabels}
                  onChange={(e) => setShipForm({ ...shipForm, printLabels: e.target.checked })}
                />
              }
              label="Print Shipping Labels"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={shipForm.sendNotification}
                  onChange={(e) => setShipForm({ ...shipForm, sendNotification: e.target.checked })}
                />
              }
              label="Send customer notification"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShipDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleShip}
            disabled={!shipForm.carrier || !shipForm.bolNumber}
            startIcon={<ShipIcon />}
          >
            Confirm & Ship
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

      {/* Delivery Map Dialog */}
      <DeliveryMapDialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        onConfirm={handleRouteConfirmed}
        destinationAddress={selectedShipment?.deliveryAddress}
        weight={selectedShipment?.totalWeight}
        title={`Delivery Route - ${selectedShipment?.orderNumber}`}
        showCostEstimate={true}
        showTimeEstimate={true}
        editable={true}
      />
    </Box>
  )
}

export default ShippingDeskPage
