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
  LinearProgress,
  Checkbox,
  FormControlLabel,
  Avatar,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  QrCodeScanner as ScanIcon,
  Inventory as PackageIcon,
  LocalShipping as ShipIcon,
  Print as PrintIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Scale as WeightIcon,
  Close as CloseIcon,
  ViewInAr as BundleIcon,
  AutoAwesome as AIIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material'
import { JOB_STATUSES, JOB_STATUS_CONFIG } from '../constants/jobStatuses'
import { PRIORITY_LEVELS_CONFIG } from '../constants/materials'
import {
  getOrdersWithFulfillment,
  ORDER_FULFILLMENT_STATUS,
  lineShippedPct,
  orderShippedPct,
  calcRemaining,
} from '../services/splitShipmentApi'
import PartialFulfillmentBanner from '../components/shipping/PartialFulfillmentBanner'
import SplitShipmentDialog from '../components/shipping/SplitShipmentDialog'
import { CallSplit as SplitIcon } from '@mui/icons-material'
import { getJobs, updateJobStatus } from '../api/jobs'

const PackagingPage = () => {
  const [packagingQueue, setPackagingQueue] = useState([])
  const [recentPackaged, setRecentPackaged] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [packageDialogOpen, setPackageDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Split shipment state
  const [splitDialogOpen, setSplitDialogOpen] = useState(false)
  const [splitDialogOrder, setSplitDialogOrder] = useState(null)
  const [creatingSplit, setCreatingSplit] = useState(false)
  const [fulfillmentOrders, setFulfillmentOrders] = useState([])

  // Package form state
  const [packageForm, setPackageForm] = useState({
    pieces: '',
    weight: '',
    skidNumber: '',
    bundleType: 'SKID',
    wrapType: 'PLASTIC',
    printLabel: true,
    notes: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch real jobs with packaging-related statuses
      const jobs = await getJobs({ status: 'PACKAGING,WAITING_QC,READY_TO_SHIP' })
      // Normalize job shape for the cards
      const normalized = (jobs || []).map(job => ({
        ...job,
        packages: job.packages || [],
        packaged: 0,
        pieces: Number(job.inputWeightLb) || 0,
        totalWeight: Number(job.inputWeightLb) || 0,
        packagingSpec: job.instructions || job.notes || '',
      }))
      setPackagingQueue(normalized)
      setRecentPackaged([])
      // Load fulfillment data for partial-shipment awareness
      try {
        const { data: orders } = await getOrdersWithFulfillment()
        setFulfillmentOrders(orders)
      } catch { /* non-critical */ }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Split shipment helpers ──
  const getFulfillmentForJob = (jobNumber) =>
    fulfillmentOrders.find((o) => o.lines?.some((l) => l.jobNumber === jobNumber))

  const handleOpenSplitDialog = (job) => {
    const order = getFulfillmentForJob(job.jobNumber)
    if (order) {
      setSplitDialogOrder(order)
      setSplitDialogOpen(true)
    } else {
      setSnackbar({ open: true, message: 'No order fulfillment data found for this job', severity: 'warning' })
    }
  }

  const handleConfirmSplit = async (splitLines, meta) => {
    if (!splitDialogOrder) return
    setCreatingSplit(true)
    try {
      const { createSplitShipment } = await import('../services/splitShipmentApi')
      await createSplitShipment(splitDialogOrder.id, splitLines, meta)
      setSplitDialogOpen(false)
      setSnackbar({ open: true, message: 'Split shipment created! Packages & drop tags generated.', severity: 'success' })
      loadData() // refresh
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to create split', severity: 'error' })
    } finally {
      setCreatingSplit(false)
    }
  }

  const handleOpenPackageDialog = (job) => {
    setSelectedJob(job)
    setPackageForm({
      pieces: '',
      weight: '',
      skidNumber: `SKD-${Date.now().toString().slice(-3)}`,
      bundleType: 'SKID',
      wrapType: 'PLASTIC',
      printLabel: true,
      notes: '',
    })
    setPackageDialogOpen(true)
  }

  const handleCreatePackage = () => {
    if (!selectedJob) return

    const newPackage = {
      id: `PKG-${Date.now()}`,
      jobNumber: selectedJob.jobNumber,
      skidNumber: packageForm.skidNumber,
      pieces: parseInt(packageForm.pieces) || 0,
      weight: parseInt(packageForm.weight) || 0,
      packagedAt: new Date().toISOString(),
      status: 'READY',
    }

    // Update job
    setPackagingQueue((prev) =>
      prev.map((job) =>
        job.id === selectedJob.id
          ? {
              ...job,
              packaged: job.packaged + newPackage.pieces,
              packages: [...job.packages, newPackage],
            }
          : job
      )
    )

    // Add to recent
    setRecentPackaged((prev) => [newPackage, ...prev])

    setPackageDialogOpen(false)
    setSnackbar({
      open: true,
      message: `Package ${packageForm.skidNumber} created - ${newPackage.pieces} pieces`,
      severity: 'success',
    })
  }

  const handleMarkReady = async (job) => {
    try {
      await updateJobStatus(job.id, 'READY_TO_SHIP')
      setPackagingQueue((prev) =>
        prev.map((j) =>
          j.id === job.id ? { ...j, status: JOB_STATUSES.READY_TO_SHIP } : j
        )
      )
      setSnackbar({
        open: true,
        message: `${job.jobNumber} marked ready to ship`,
        severity: 'success',
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to update status: ${err.message}`,
        severity: 'error',
      })
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

  const getProgress = (job) => {
    if (!job.pieces) return 0
    return Math.min((job.packaged / job.pieces) * 100, 100)
  }

  // Stats
  const stats = {
    inQueue: packagingQueue.filter((j) => j.status === JOB_STATUSES.PACKAGING).length,
    waitingQC: packagingQueue.filter((j) => j.status === JOB_STATUSES.WAITING_QC).length,
    ready: packagingQueue.filter((j) => j.status === JOB_STATUSES.READY_TO_SHIP).length,
    hotJobs: packagingQueue.filter((j) => j.priority === 'HOT').length,
    packagesToday: recentPackaged.length,
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)',
      mx: -3,
      mt: -3,
    }}>
      {/* Modern Header */}
      <Box sx={{ 
        px: 3, 
        py: 3, 
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              width: 56, 
              height: 56, 
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}>
              <BundleIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                Packaging
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Bundle and prepare orders for shipping
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<ScanIcon />}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Scan
            </Button>
            <Button 
              variant="contained" 
              startIcon={<PrintIcon />}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
            >
              Print Labels
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Stats Bar */}
      <Box sx={{ mx: 3, mt: 3 }}>
        <Paper sx={{ 
          p: 2.5,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
          border: '1px solid',
          borderColor: 'divider',
        }}>
          <Stack direction="row" spacing={4} divider={<Box sx={{ borderRight: 1, borderColor: 'divider' }} />} flexWrap="wrap">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#1976d2', 0.1) }}>
                <PackageIcon sx={{ color: 'primary.main' }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">In Packaging</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.inQueue}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#0288d1', 0.1) }}>
                <PendingIcon sx={{ color: 'info.main' }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">Waiting QC</Typography>
                <Typography variant="h5" fontWeight={700} color="info.main">{stats.waitingQC}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#2e7d32', 0.1) }}>
                <CompleteIcon sx={{ color: 'success.main' }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">Ready to Ship</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">{stats.ready}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#d32f2f', 0.1) }}>
                <FireIcon sx={{ color: 'error.main' }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">Hot Jobs</Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">{stats.hotJobs}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#7b1fa2', 0.1) }}>
                <BundleIcon sx={{ color: '#7b1fa2' }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">Packages Today</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#7b1fa2' }}>{stats.packagesToday}</Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search jobs..."
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

        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Packaging Queue
        </Typography>

        <Grid container spacing={2}>
          {packagingQueue
            .filter((job) =>
              job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
              job.customerName.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((job) => {
              const priorityConfig = PRIORITY_LEVELS_CONFIG?.[job.priority] || {}
              const progress = getProgress(job)
              const isHot = job.priority === 'HOT'

              return (
                <Grid item xs={12} md={6} lg={4} key={job.id}>
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
                          {job.jobNumber}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Chip
                            label={job.priority}
                            size="small"
                            sx={{
                              backgroundColor: priorityConfig.bgColor,
                              color: priorityConfig.color,
                              fontWeight: 600,
                            }}
                          />
                          <Chip
                            label={JOB_STATUS_CONFIG[job.status]?.label || job.status}
                            size="small"
                            sx={{
                              backgroundColor: JOB_STATUS_CONFIG[job.status]?.bgColor,
                              color: JOB_STATUS_CONFIG[job.status]?.color,
                            }}
                          />
                        </Stack>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {job.customerName}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {job.material}
                      </Typography>

                      {/* Progress */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Packaged
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {job.packaged}/{job.pieces} pcs ({progress.toFixed(0)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      {/* Weight & Due */}
                      <Stack direction="row" spacing={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Weight
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatWeight(job.totalWeight)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Due
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatDate(job.dueDate)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Packages
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {job.packages.length}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Spec */}
                      <Alert severity="info" sx={{ mt: 2, py: 0.5 }} icon={<PackageIcon fontSize="small" />}>
                        <Typography variant="caption">{job.packagingSpec}</Typography>
                      </Alert>

                      {/* Partial Fulfillment Indicator */}
                      {(() => {
                        const fo = getFulfillmentForJob(job.jobNumber)
                        if (fo && fo.fulfillmentStatus === ORDER_FULFILLMENT_STATUS.PARTIAL) {
                          const pct = orderShippedPct(fo.lines)
                          const rem = calcRemaining(fo.lines)
                          return (
                            <Box sx={{ mt: 1.5 }}>
                              <PartialFulfillmentBanner
                                order={fo}
                                shippedPct={pct}
                                remaining={rem}
                                splitCount={fo.shipments?.length || 0}
                                compact
                              />
                            </Box>
                          )
                        }
                        return null
                      })()}
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        startIcon={<BundleIcon />}
                        onClick={() => handleOpenPackageDialog(job)}
                        disabled={job.status === JOB_STATUSES.WAITING_QC}
                      >
                        Create Package
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<SplitIcon />}
                        onClick={() => handleOpenSplitDialog(job)}
                        size="small"
                      >
                        Split for Shipment
                      </Button>
                      {progress >= 100 && (
                        <Button
                          variant="outlined"
                          color="success"
                          startIcon={<ShipIcon />}
                          onClick={() => handleMarkReady(job)}
                        >
                          Ready to Ship
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              )
            })}
        </Grid>

        {/* Recent Packages */}
        <Typography variant="h6" fontWeight={600} sx={{ mt: 4, mb: 2 }}>
          Recent Packages
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Package ID</TableCell>
                <TableCell>Job</TableCell>
                <TableCell>Skid #</TableCell>
                <TableCell>Pieces</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Packaged</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentPackaged.map((pkg) => (
                <TableRow key={pkg.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{pkg.id}</Typography>
                  </TableCell>
                  <TableCell>{pkg.jobNumber}</TableCell>
                  <TableCell>{pkg.skidNumber}</TableCell>
                  <TableCell>{pkg.pieces}</TableCell>
                  <TableCell>{formatWeight(pkg.weight)}</TableCell>
                  <TableCell>{formatDate(pkg.packagedAt)}</TableCell>
                  <TableCell>
                    <Chip label={pkg.status} size="small" color="success" variant="outlined" />
                  </TableCell>
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
      </Box>

      {/* Package Dialog */}
      <Dialog open={packageDialogOpen} onClose={() => setPackageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create Package
          <IconButton onClick={() => setPackageDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedJob && (
              <Alert severity="info">
                Job: {selectedJob.jobNumber} | Remaining: {selectedJob.pieces - selectedJob.packaged} pcs
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Pieces"
                  type="number"
                  value={packageForm.pieces}
                  onChange={(e) => setPackageForm({ ...packageForm, pieces: e.target.value })}
                  fullWidth
                  inputProps={{ max: selectedJob?.pieces - selectedJob?.packaged }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Weight (lbs)"
                  type="number"
                  value={packageForm.weight}
                  onChange={(e) => setPackageForm({ ...packageForm, weight: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Skid/Bundle Number"
              value={packageForm.skidNumber}
              onChange={(e) => setPackageForm({ ...packageForm, skidNumber: e.target.value })}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Bundle Type"
                  value={packageForm.bundleType}
                  onChange={(e) => setPackageForm({ ...packageForm, bundleType: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="SKID">Skid</MenuItem>
                  <MenuItem value="BUNDLE">Bundle (strapped)</MenuItem>
                  <MenuItem value="CRATE">Crate</MenuItem>
                  <MenuItem value="COIL">Single Coil</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Wrapping"
                  value={packageForm.wrapType}
                  onChange={(e) => setPackageForm({ ...packageForm, wrapType: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="NONE">None</MenuItem>
                  <MenuItem value="PLASTIC">Plastic Wrap</MenuItem>
                  <MenuItem value="PAPER">Paper</MenuItem>
                  <MenuItem value="VCI">VCI Paper</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Checkbox
                  checked={packageForm.printLabel}
                  onChange={(e) => setPackageForm({ ...packageForm, printLabel: e.target.checked })}
                />
              }
              label="Print label after creation"
            />
            <TextField
              label="Notes"
              value={packageForm.notes}
              onChange={(e) => setPackageForm({ ...packageForm, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPackageDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreatePackage}
            disabled={!packageForm.pieces || !packageForm.weight}
          >
            Create Package
          </Button>
        </DialogActions>
      </Dialog>

      {/* Split Shipment Dialog */}
      <SplitShipmentDialog
        open={splitDialogOpen}
        onClose={() => setSplitDialogOpen(false)}
        order={splitDialogOrder}
        onConfirm={handleConfirmSplit}
        creating={creatingSplit}
      />

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

export default PackagingPage
