/**
 * Work Center Queue Page
 * Shows job operations queue for a specific work center with Start/Pause/Complete controls
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  AppBar,
  Toolbar,
  Avatar,
  Chip,
  Stack,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tooltip,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  LocalFireDepartment as HotIcon,
  Speed as RushIcon,
  Star as VipIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Inventory as MaterialIcon,
  Factory as FactoryIcon,
  Timer as TimerIcon,
} from '@mui/icons-material'
import { getQueue, getOperators } from '../../services/dispatchApi'
import { startOperation, pauseOperation, completeOperation } from '../../services/operationsApi'

// Priority config
const PRIORITY_CONFIG = {
  VIP: { color: '#9c27b0', icon: VipIcon, label: 'VIP' },
  RUSH: { color: '#d32f2f', icon: RushIcon, label: 'RUSH' },
  HOT: { color: '#f57c00', icon: HotIcon, label: 'HOT' },
  NORMAL: { color: '#666', icon: null, label: 'NORMAL' },
}

// Format time for display
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// Format due date
function formatDueDate(isoDate) {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = date - now
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  
  if (diffHours < 0) {
    return `${Math.abs(diffHours)}h overdue`
  }
  if (diffHours < 24) {
    return `${diffHours}h`
  }
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d`
}

// Running timer component
function RunningTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)
  
  useEffect(() => {
    if (!startTime) return
    
    const start = new Date(startTime).getTime()
    const interval = setInterval(() => {
      const now = Date.now()
      setElapsed(Math.floor((now - start) / 1000))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [startTime])
  
  return (
    <Typography variant="h4" fontWeight={700} color="success.main" sx={{ fontFamily: 'monospace' }}>
      {formatTime(elapsed)}
    </Typography>
  )
}

function WorkCenterQueuePage() {
  const { workCenterId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const locationId = searchParams.get('locationId') || 'FWA'
  
  const [queueData, setQueueData] = useState(null)
  const [operators, setOperatorsState] = useState([])
  const [selectedOperator, setSelectedOperator] = useState('')
  const [selectedOperation, setSelectedOperation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  
  const pollInterval = useRef(null)

  // Load queue data
  const loadQueue = useCallback(async () => {
    try {
      const data = await getQueue(locationId, workCenterId)
      setQueueData(data)
      
      // Auto-select first operation if none selected
      if (!selectedOperation && data.operations?.length > 0) {
        setSelectedOperation(data.operations[0])
      } else if (selectedOperation) {
        // Update selected operation with fresh data
        const updated = data.operations?.find(op => op.id === selectedOperation.id)
        if (updated) {
          setSelectedOperation(updated)
        } else {
          setSelectedOperation(data.operations?.[0] || null)
        }
      }
      
      setError(null)
    } catch (err) {
      console.error('Failed to load queue:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [locationId, workCenterId, selectedOperation])

  // Load operators
  useEffect(() => {
    async function loadOperators() {
      try {
        const data = await getOperators(workCenterId)
        setOperatorsState(data)
        if (data.length > 0 && !selectedOperator) {
          setSelectedOperator(data[0].id)
        }
      } catch (err) {
        console.error('Failed to load operators:', err)
        // Fallback to all operators
        try {
          const allOps = await getOperators()
          setOperatorsState(allOps)
          if (allOps.length > 0 && !selectedOperator) {
            setSelectedOperator(allOps[0].id)
          }
        } catch {
          // Use placeholder
          setOperatorsState([{ id: 'OP-001', name: 'Default Operator' }])
          setSelectedOperator('OP-001')
        }
      }
    }
    loadOperators()
  }, [workCenterId])

  // Initial load and polling
  useEffect(() => {
    loadQueue()
    
    // Poll every 10 seconds
    pollInterval.current = setInterval(loadQueue, 10000)
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current)
      }
    }
  }, [loadQueue])

  // Handle start
  const handleStart = async (operation) => {
    if (!selectedOperator) {
      alert('Please select an operator')
      return
    }
    
    setActionLoading(true)
    try {
      await startOperation(operation.id, {
        operatorId: selectedOperator,
        workCenterId: workCenterId,
      })
      await loadQueue()
    } catch (err) {
      console.error('Failed to start operation:', err)
      alert(`Failed to start: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle pause
  const handlePause = async (operation) => {
    setActionLoading(true)
    try {
      await pauseOperation(operation.id, {
        operatorId: selectedOperator,
        workCenterId: workCenterId,
        downtimeReason: pauseReason || undefined,
      })
      setPauseDialogOpen(false)
      setPauseReason('')
      await loadQueue()
    } catch (err) {
      console.error('Failed to pause operation:', err)
      alert(`Failed to pause: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle complete
  const handleComplete = async (operation) => {
    if (!confirm('Mark this operation as complete?')) return
    
    setActionLoading(true)
    try {
      await completeOperation(operation.id, {
        operatorId: selectedOperator,
        workCenterId: workCenterId,
      })
      await loadQueue()
    } catch (err) {
      console.error('Failed to complete operation:', err)
      alert(`Failed to complete: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const getPriorityConfig = (priority) => {
    return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.NORMAL
  }

  const isOperationActive = (op) => op.status === 'IN_PROCESS'

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/shopfloor')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <FactoryIcon sx={{ mr: 1 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              {queueData?.workCenterName || workCenterId}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {locationId} • {queueData?.operationCount || 0} operations
            </Typography>
          </Box>
          
          {/* Operator Select */}
          <FormControl size="small" sx={{ minWidth: 180, mr: 2 }}>
            <InputLabel sx={{ color: 'white' }}>Operator</InputLabel>
            <Select
              value={selectedOperator}
              label="Operator"
              onChange={(e) => setSelectedOperator(e.target.value)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                '& .MuiSelect-icon': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              }}
            >
              {operators.map((op) => (
                <MenuItem key={op.id} value={op.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon fontSize="small" />
                    <span>{op.name}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadQueue}
            disabled={loading}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
          >
            Refresh
          </Button>
        </Toolbar>
      </AppBar>

      {/* Loading bar */}
      {(loading || actionLoading) && <LinearProgress />}

      <Container maxWidth="xl" sx={{ py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Queue List - Left Side */}
          <Grid item xs={12} md={6} lg={5}>
            <Paper sx={{ height: 'calc(100vh - 180px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={700}>
                  Job Queue
                </Typography>
              </Box>
              
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Job / Operation</TableCell>
                      <TableCell>Material</TableCell>
                      <TableCell>Due</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queueData?.operations?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                          <Typography color="text.secondary">No jobs in queue</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {queueData?.operations?.map((op, idx) => {
                      const priority = getPriorityConfig(op.job?.priority)
                      const isSelected = selectedOperation?.id === op.id
                      const isActive = isOperationActive(op)
                      
                      return (
                        <TableRow
                          key={op.id}
                          hover
                          selected={isSelected}
                          onClick={() => setSelectedOperation(op)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: isActive ? alpha('#4caf50', 0.1) : 'inherit',
                            '&.Mui-selected': {
                              bgcolor: alpha('#1976d2', 0.15),
                              '&:hover': { bgcolor: alpha('#1976d2', 0.2) },
                            },
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight={600}>{idx + 1}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography fontWeight={600} variant="body2">
                                  {op.job?.id || op.jobId}
                                </Typography>
                                {priority.icon && (
                                  <priority.icon sx={{ fontSize: 14, color: priority.color }} />
                                )}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {op.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                              {op.materialCode}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {op.thickness}" thick
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={
                                formatDueDate(op.job?.dueDate).includes('overdue')
                                  ? 'error.main'
                                  : 'text.primary'
                              }
                            >
                              {formatDueDate(op.job?.dueDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={op.status}
                              size="small"
                              color={isActive ? 'success' : 'default'}
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Active Job Detail - Right Side */}
          <Grid item xs={12} md={6} lg={7}>
            {selectedOperation ? (
              <Card sx={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
                {/* Job Header */}
                <Box
                  sx={{
                    p: 3,
                    background: isOperationActive(selectedOperation)
                      ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
                      : 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
                    color: 'white',
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h4" fontWeight={700}>
                          {selectedOperation.job?.id || selectedOperation.jobId}
                        </Typography>
                        {selectedOperation.job?.priority && selectedOperation.job.priority !== 'NORMAL' && (
                          <Chip
                            label={selectedOperation.job.priority}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </Stack>
                      <Typography variant="h6" sx={{ opacity: 0.9, mt: 0.5 }}>
                        {selectedOperation.name}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                        Sequence: {selectedOperation.sequence} • {selectedOperation.requiredWorkCenterType}
                      </Typography>
                    </Grid>
                    <Grid item>
                      {isOperationActive(selectedOperation) ? (
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            RUNNING
                          </Typography>
                          <RunningTimer startTime={selectedOperation.timeSpent?.lastStartAt || new Date().toISOString()} />
                        </Box>
                      ) : (
                        <Chip
                          label={selectedOperation.status}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1rem',
                            py: 2,
                          }}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Box>

                {/* Job Details */}
                <CardContent sx={{ flex: 1, overflow: 'auto' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <MaterialIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Material
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {selectedOperation.materialCode}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedOperation.job?.commodity} • {selectedOperation.job?.form} • {selectedOperation.job?.grade}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Thickness
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {selectedOperation.thickness}"
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Due
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color={
                          formatDueDate(selectedOperation.job?.dueDate).includes('overdue')
                            ? 'error.main'
                            : 'text.primary'
                        }
                      >
                        {formatDueDate(selectedOperation.job?.dueDate)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedOperation.job?.dueDate
                          ? new Date(selectedOperation.job.dueDate).toLocaleDateString()
                          : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Order
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedOperation.job?.orderId || '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Skill Required
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedOperation.requiredSkillLevel}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Division
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedOperation.requiredDivision}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Assigned Operator
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {operators.find(op => op.id === selectedOperation.assignedOperatorId)?.name || '—'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>

                {/* Action Buttons */}
                <Box
                  sx={{
                    p: 3,
                    borderTop: 1,
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                  }}
                >
                  <Grid container spacing={2}>
                    {!isOperationActive(selectedOperation) && (
                      <Grid item xs={12} md={4}>
                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          color="success"
                          startIcon={<StartIcon sx={{ fontSize: 32 }} />}
                          onClick={() => handleStart(selectedOperation)}
                          disabled={actionLoading}
                          sx={{
                            py: 3,
                            fontSize: '1.25rem',
                            fontWeight: 700,
                          }}
                        >
                          START
                        </Button>
                      </Grid>
                    )}
                    {isOperationActive(selectedOperation) && (
                      <>
                        <Grid item xs={6} md={4}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            color="warning"
                            startIcon={<PauseIcon sx={{ fontSize: 32 }} />}
                            onClick={() => setPauseDialogOpen(true)}
                            disabled={actionLoading}
                            sx={{
                              py: 3,
                              fontSize: '1.25rem',
                              fontWeight: 700,
                            }}
                          >
                            PAUSE
                          </Button>
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            color="primary"
                            startIcon={<CompleteIcon sx={{ fontSize: 32 }} />}
                            onClick={() => handleComplete(selectedOperation)}
                            disabled={actionLoading}
                            sx={{
                              py: 3,
                              fontSize: '1.25rem',
                              fontWeight: 700,
                            }}
                          >
                            COMPLETE
                          </Button>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
              </Card>
            ) : (
              <Card sx={{ height: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <FactoryIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6">Select a job from the queue</Typography>
                  <Typography variant="body2">Click on a job to see details and controls</Typography>
                </Box>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Pause Reason Dialog */}
      <Dialog open={pauseDialogOpen} onClose={() => setPauseDialogOpen(false)}>
        <DialogTitle>Pause Operation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for pause (optional)"
            fullWidth
            variant="outlined"
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            placeholder="e.g., Material issue, Machine maintenance, Break"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPauseDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => handlePause(selectedOperation)}
            disabled={actionLoading}
          >
            Pause
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default WorkCenterQueuePage
