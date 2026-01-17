import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Stack,
  Grid,
  Paper,
  Chip,
  Divider,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  AvatarGroup,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  LinearProgress,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  Print as PrintIcon,
  MoreVert as MoreIcon,
  Person as PersonIcon,
  AttachFile as AttachIcon,
  Notes as NotesIcon,
  History as HistoryIcon,
  Assessment as MetricsIcon,
  ContentCut as ProcessIcon,
  Inventory as InventoryIcon,
  Scale as WeightIcon,
} from '@mui/icons-material'
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab'
import { JOB_STATUS_CONFIG, getNextStatuses } from '../constants/jobStatuses'
import { PROCESSING_TYPES } from '../constants/processingTypes'
import { PRIORITY_LEVELS_CONFIG } from '../constants/materials'
import { StatusChip } from '../components/jobs'

// Mock job data
const getMockJob = (id) => ({
  id,
  jobNumber: id,
  customerName: 'ABC Steel Corporation',
  customerId: 'CUST-001',
  status: 'IN_PROCESS',
  priority: 'URGENT',
  processingType: 'SLITTING',
  materialDescription: 'Hot Rolled Coil 0.125" x 48"',
  materialGrade: 'A36',
  dimensions: '0.125" x 48" x Coil',
  weight: 28500,
  targetPieces: 150,
  completedPieces: 87,
  scrapPieces: 3,
  workCenterId: 'WC-001',
  workCenterName: 'Slitter #1',
  operators: [
    { id: 'OP-001', name: 'John Doe', initials: 'JD' },
    { id: 'OP-002', name: 'Jane Smith', initials: 'JS' },
  ],
  orderNumber: 'SO-2024-0156',
  poNumber: 'PO-ABC-789',
  dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  scheduledStart: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  actualStart: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  estimatedEnd: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  notes: 'Customer requires tight tolerances. Check width specs carefully.',
  specifications: {
    targetWidth: '6.000"',
    tolerance: '+/- 0.005"',
    slitCount: 8,
    edgeTrim: 'Both sides',
  },
  timeline: [
    { timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), event: 'Job Created', user: 'System' },
    { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), event: 'Scheduled to Slitter #1', user: 'Mike J.' },
    { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), event: 'Material Staged', user: 'Receiving' },
    { timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), event: 'Processing Started', user: 'John D.' },
    { timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(), event: 'Progress: 87/150 pcs', user: 'John D.' },
  ],
  documents: [
    { id: 'DOC-1', name: 'Work Order.pdf', type: 'work-order', uploadedAt: new Date().toISOString() },
    { id: 'DOC-2', name: 'Customer Specs.pdf', type: 'specification', uploadedAt: new Date().toISOString() },
  ],
})

const JobDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    const loadJob = async () => {
      setLoading(true)
      try {
        await new Promise((r) => setTimeout(r, 300))
        setJob(getMockJob(id))
      } catch (error) {
        console.error('Failed to load job:', error)
      } finally {
        setLoading(false)
      }
    }
    loadJob()
  }, [id])

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    )
  }

  if (!job) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Job not found</Alert>
      </Box>
    )
  }

  const statusConfig = JOB_STATUS_CONFIG[job.status] || {}
  const priorityConfig = PRIORITY_LEVELS_CONFIG?.[job.priority] || {}
  const processingType = PROCESSING_TYPES[job.processingType] || job.processingType
  const nextStatuses = getNextStatuses(job.status)
  const progress = job.targetPieces ? ((job.completedPieces / job.targetPieces) * 100).toFixed(1) : 0

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

  const handleStatusChange = (status) => {
    setSelectedStatus(status)
    setStatusDialogOpen(true)
    setMenuAnchor(null)
  }

  const handleConfirmStatusChange = () => {
    setJob((prev) => ({ ...prev, status: selectedStatus }))
    setStatusDialogOpen(false)
    setSnackbar({
      open: true,
      message: `Status updated to ${JOB_STATUS_CONFIG[selectedStatus]?.label || selectedStatus}`,
      severity: 'success',
    })
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }} elevation={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <BackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" fontWeight={700}>
                {job.jobNumber}
              </Typography>
              <StatusChip status={job.status} />
              <Chip
                label={job.priority}
                size="small"
                sx={{
                  backgroundColor: priorityConfig.bgColor,
                  color: priorityConfig.color,
                  fontWeight: 600,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {job.customerName} | {processingType}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              Print
            </Button>
            <Button
              variant="contained"
              endIcon={<MoreIcon />}
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              Actions
            </Button>
          </Stack>
        </Box>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          {nextStatuses.map((status) => (
            <MenuItem key={status} onClick={() => handleStatusChange(status)}>
              Move to {JOB_STATUS_CONFIG[status]?.label || status}
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={() => setMenuAnchor(null)}>Edit Job</MenuItem>
          <MenuItem onClick={() => setMenuAnchor(null)}>Assign Operator</MenuItem>
          <MenuItem onClick={() => setMenuAnchor(null)}>Split Job</MenuItem>
        </Menu>
      </Paper>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Left Column - Details */}
          <Grid item xs={12} md={8}>
            {/* Progress Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Progress
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Target
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {job.targetPieces}
                    </Typography>
                    <Typography variant="caption">pieces</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Complete
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {job.completedPieces}
                    </Typography>
                    <Typography variant="caption">pieces</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Scrap
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {job.scrapPieces || 0}
                    </Typography>
                    <Typography variant="caption">pieces</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Completion</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(progress)}
                  sx={{ height: 12, borderRadius: 6 }}
                />
              </Box>
            </Paper>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab icon={<InventoryIcon />} label="Details" iconPosition="start" />
                <Tab icon={<HistoryIcon />} label="Timeline" iconPosition="start" />
                <Tab icon={<AttachIcon />} label="Documents" iconPosition="start" />
                <Tab icon={<NotesIcon />} label="Notes" iconPosition="start" />
              </Tabs>
              <Divider />

              <Box sx={{ p: 3 }}>
                {activeTab === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Material
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {job.materialDescription}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Grade
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {job.materialGrade}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Dimensions
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {job.dimensions}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Weight
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatWeight(job.weight)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    {job.specifications && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Target Width
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {job.specifications.targetWidth}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Tolerance
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {job.specifications.tolerance}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Slit Count
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {job.specifications.slitCount}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Edge Trim
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {job.specifications.edgeTrim}
                          </Typography>
                        </Grid>
                      </>
                    )}
                  </Grid>
                )}

                {activeTab === 1 && (
                  <Timeline position="right" sx={{ p: 0 }}>
                    {job.timeline.map((event, idx) => (
                      <TimelineItem key={idx}>
                        <TimelineSeparator>
                          <TimelineDot color={idx === 0 ? 'primary' : 'grey'} />
                          {idx < job.timeline.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="body2" fontWeight={500}>
                            {event.event}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(event.timestamp)} • {event.user}
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                )}

                {activeTab === 2 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Document</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Uploaded</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {job.documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>{doc.name}</TableCell>
                            <TableCell>
                              <Chip label={doc.type} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                            <TableCell>
                              <Button size="small">View</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {activeTab === 3 && (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {job.notes}
                    </Alert>
                    <TextField
                      label="Add Note"
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Enter note..."
                    />
                    <Button variant="contained" sx={{ mt: 1 }}>
                      Add Note
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Summary */}
          <Grid item xs={12} md={4}>
            {/* Schedule Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Schedule
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDate(job.dueDate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Scheduled Start
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(job.scheduledStart)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Actual Start
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(job.actualStart)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Est. Completion
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(job.estimatedEnd)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Work Center Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Work Center
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <ProcessIcon />
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {job.workCenterName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {processingType}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Operators Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Operators
              </Typography>
              <Stack spacing={1}>
                {job.operators.map((op) => (
                  <Box
                    key={op.id}
                    sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {op.initials}
                    </Avatar>
                    <Typography variant="body1">{op.name}</Typography>
                  </Box>
                ))}
                <Button startIcon={<PersonIcon />} variant="outlined" size="small" sx={{ mt: 1 }}>
                  Assign Operator
                </Button>
              </Stack>
            </Paper>

            {/* Order Reference */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                References
              </Typography>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Sales Order
                  </Typography>
                  <Typography variant="body1">{job.orderNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Customer PO
                  </Typography>
                  <Typography variant="body1">{job.poNumber}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Move job to <strong>{JOB_STATUS_CONFIG[selectedStatus]?.label}</strong>?
          </Typography>
          <TextField
            label="Note (optional)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmStatusChange}>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default JobDetailPage
