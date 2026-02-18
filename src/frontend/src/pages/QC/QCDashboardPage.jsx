import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material'
import {
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Visibility as ViewIcon,
  Assignment as InspectIcon,
  PendingActions as PendingIcon,
  FactCheck as QCIcon,
  TrendingUp as TrendIcon,
  Build as ReworkIcon,
} from '@mui/icons-material'
import { getQCQueue, getQCStats, getInspections, createInspection, getInspectors } from '../../api/qc'

const statusColors = {
  PENDING: 'default',
  IN_PROGRESS: 'info',
  PASSED: 'success',
  FAILED: 'error',
  CONDITIONAL: 'warning',
}

const resultIcons = {
  PASS: <PassIcon fontSize="small" color="success" />,
  FAIL: <FailIcon fontSize="small" color="error" />,
  CONDITIONAL: <WarningIcon fontSize="small" color="warning" />,
}

export default function QCDashboardPage() {
  const [tab, setTab] = useState(0)
  const [queue, setQueue] = useState([])
  const [stats, setStats] = useState(null)
  const [inspections, setInspections] = useState([])
  const [inspectors, setInspectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Start inspection dialog
  const [startDialog, setStartDialog] = useState({ open: false, job: null })
  const [selectedInspector, setSelectedInspector] = useState('')
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [queueRes, statsRes, inspectionsRes, inspectorsRes] = await Promise.all([
        getQCQueue(),
        getQCStats(),
        getInspections({ limit: 50 }),
        getInspectors(),
      ])
      setQueue(queueRes.data || [])
      setStats(statsRes.data || null)
      setInspections(inspectionsRes.data || [])
      setInspectors(inspectorsRes.data || [])
    } catch (err) {
      console.error('QC Dashboard load error:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleStartInspection = async () => {
    if (!startDialog.job) return
    try {
      setSubmitting(true)
      await createInspection({
        jobId: startDialog.job.id,
        inspectorId: selectedInspector || undefined,
        notes: inspectionNotes || undefined,
      })
      setStartDialog({ open: false, job: null })
      setSelectedInspector('')
      setInspectionNotes('')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create inspection')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            <QCIcon sx={{ mr: 1, verticalAlign: 'bottom', fontSize: 36 }} />
            QC Inspection Station
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quality control gateway — inspect jobs before packaging & shipping
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <PendingIcon sx={{ fontSize: 32, color: 'warning.main', mb: 0.5 }} />
                <Typography variant="h3" fontWeight={700} color="warning.main">
                  {stats.queueCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Awaiting QC
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <InspectIcon sx={{ fontSize: 32, color: 'info.main', mb: 0.5 }} />
                <Typography variant="h3" fontWeight={700} color="info.main">
                  {stats.inProgressCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <PassIcon sx={{ fontSize: 32, color: 'success.main', mb: 0.5 }} />
                <Typography variant="h3" fontWeight={700} color="success.main">
                  {stats.passedToday}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Passed Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <TrendIcon sx={{ fontSize: 32, color: stats.passRate >= 90 ? 'success.main' : 'warning.main', mb: 0.5 }} />
                <Typography variant="h3" fontWeight={700} color={stats.passRate >= 90 ? 'success.main' : 'warning.main'}>
                  {stats.passRate}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pass Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary">
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>QC Queue</span>
                {queue.length > 0 && (
                  <Chip size="small" label={queue.length} color="warning" />
                )}
              </Stack>
            }
          />
          <Tab label="In Progress" />
          <Tab label="Completed" />
          <Tab label="All Inspections" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tab === 0 && <QueueTab queue={queue} onStart={(job) => setStartDialog({ open: true, job })} />}
      {tab === 1 && <InspectionListTab inspections={inspections.filter(i => i.status === 'IN_PROGRESS')} title="In Progress Inspections" />}
      {tab === 2 && <InspectionListTab inspections={inspections.filter(i => ['PASSED', 'FAILED'].includes(i.status))} title="Completed Inspections" />}
      {tab === 3 && <InspectionListTab inspections={inspections} title="All Inspections" />}

      {/* Start Inspection Dialog */}
      <Dialog open={startDialog.open} onClose={() => setStartDialog({ open: false, job: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Start QC Inspection</DialogTitle>
        <DialogContent>
          {startDialog.job && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Job: {startDialog.job.jobNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {startDialog.job.operationType} • Priority: {startDialog.job.priority}
              </Typography>
              {startDialog.job.order && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Order: {startDialog.job.order.orderNumber}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />

              <TextField
                select
                fullWidth
                label="Assign Inspector"
                value={selectedInspector}
                onChange={(e) => setSelectedInspector(e.target.value)}
                sx={{ mb: 2 }}
                helperText="Leave blank to create as unassigned"
              >
                <MenuItem value="">— Unassigned —</MenuItem>
                {inspectors.map((op) => (
                  <MenuItem key={op.id} value={op.id}>
                    {op.firstName} {op.lastName} ({op.employeeCode})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Inspection Notes (optional)"
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialog({ open: false, job: null })}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<StartIcon />}
            onClick={handleStartInspection}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Start Inspection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ── QC Queue Tab ────────────────────────────────────────────────────────────
function QueueTab({ queue, onStart }) {
  if (queue.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <PassIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
        <Typography variant="h6" color="text.secondary">
          No jobs waiting for QC
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All caught up! Jobs will appear here when production operations are complete.
        </Typography>
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'warning.50' }}>
            <TableCell sx={{ fontWeight: 700 }}>Job #</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Operation</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Work Center</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Completed Ops</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Waiting Since</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {queue.map((job) => {
            const ops = job.dispatchJob?.operations || []
            const completedOps = ops.filter(o => o.status === 'COMPLETE').length
            const hasActiveInspection = (job.inspections || []).some(i => ['PENDING', 'IN_PROGRESS'].includes(i.status))
            return (
              <TableRow key={job.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{job.jobNumber}</Typography>
                </TableCell>
                <TableCell>{job.operationType || '—'}</TableCell>
                <TableCell>{job.order?.orderNumber || '—'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={`P${job.priority}`}
                    color={job.priority <= 2 ? 'error' : job.priority <= 3 ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>{job.workCenter?.name || '—'}</TableCell>
                <TableCell>{completedOps}/{ops.length} ops</TableCell>
                <TableCell>
                  {new Date(job.updatedAt).toLocaleString()}
                </TableCell>
                <TableCell align="center">
                  {hasActiveInspection ? (
                    <Chip size="small" label="Inspection Active" color="info" />
                  ) : (
                    <Tooltip title="Start QC Inspection">
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<InspectIcon />}
                        onClick={() => onStart(job)}
                      >
                        Inspect
                      </Button>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ── Inspection List Tab ─────────────────────────────────────────────────────
function InspectionListTab({ inspections, title }) {
  if (inspections.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No inspections found
        </Typography>
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Inspection #</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Job #</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Result</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Inspector</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Disposition</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {inspections.map((insp) => (
            <TableRow key={insp.id} hover>
              <TableCell>
                <Typography fontWeight={600} fontSize={13}>{insp.inspectionNumber}</Typography>
              </TableCell>
              <TableCell>{insp.job?.jobNumber || '—'}</TableCell>
              <TableCell>
                <Chip size="small" label={insp.inspectionType} variant="outlined" />
              </TableCell>
              <TableCell>
                <Chip size="small" label={insp.status} color={statusColors[insp.status] || 'default'} />
              </TableCell>
              <TableCell>
                {insp.overallResult ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {resultIcons[insp.overallResult]}
                    <Typography variant="body2">{insp.overallResult}</Typography>
                  </Box>
                ) : '—'}
              </TableCell>
              <TableCell>
                {insp.inspector ? `${insp.inspector.firstName} ${insp.inspector.lastName}` : '—'}
              </TableCell>
              <TableCell>
                {insp.disposition ? (
                  <Chip
                    size="small"
                    label={insp.disposition.replace(/_/g, ' ')}
                    color={insp.disposition === 'REWORK' ? 'warning' : insp.disposition === 'SCRAP' ? 'error' : 'default'}
                    variant="outlined"
                  />
                ) : '—'}
              </TableCell>
              <TableCell>
                {new Date(insp.completedAt || insp.createdAt).toLocaleString()}
              </TableCell>
              <TableCell align="center">
                {insp.status === 'IN_PROGRESS' && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<InspectIcon />}
                    href={`/qc/inspect/${insp.id}`}
                  >
                    Continue
                  </Button>
                )}
                {['PASSED', 'FAILED'].includes(insp.status) && (
                  <Tooltip title="View Details">
                    <IconButton size="small" href={`/qc/inspect/${insp.id}`}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
