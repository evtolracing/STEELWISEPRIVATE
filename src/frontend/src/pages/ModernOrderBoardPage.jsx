import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Snackbar,
  IconButton,
  alpha,
  Avatar,
  Chip,
  Divider,
  InputAdornment,
  Fade,
  Zoom,
  Paper,
} from '@mui/material'
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  TipsAndUpdates as TipsIcon,
  Schedule as ScheduleIcon,
  LocalFireDepartment as FireIcon,
  Bolt as BoltIcon,
  Person as PersonIcon,
  ContentCut as ProcessIcon,
  Inventory as InventoryIcon,
  Numbers as NumbersIcon,
  Notes as NotesIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import ModernKanbanBoard from '../components/jobs/ModernKanbanBoard'
import { KANBAN_COLUMNS, JOB_STATUSES, canTransitionTo } from '../constants/jobStatuses'
import { PROCESSING_TYPES } from '../constants/processingTypes'
import { PRIORITY_LEVELS } from '../constants/materials'
import { getJobs, createJob, updateJobStatus, updateJob } from '../services/jobsApi'

const ModernOrderBoardPage = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // New job form state
  const [newJob, setNewJob] = useState({
    customerName: '',
    processingType: '',
    priority: 'NORMAL',
    material: '',
    targetPieces: '',
    notes: '',
  })

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getJobs()
      setJobs(data)
      console.log('Loaded jobs from database:', data.length)
    } catch (error) {
      console.error('Failed to load jobs:', error)
      setSnackbar({ open: true, message: `Failed to load jobs: ${error.message}`, severity: 'error' })
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const handleJobClick = (job) => {
    setSelectedJob(job)
    console.log('Selected job:', job)
  }

  const handleStatusChange = async (jobId, newStatus) => {
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return

    // Validate transition
    if (!canTransitionTo(job.status, newStatus)) {
      setSnackbar({
        open: true,
        message: `Cannot transition from ${job.status} to ${newStatus}`,
        severity: 'warning',
      })
      return
    }

    try {
      await updateJobStatus(jobId, { status: newStatus })
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: newStatus } : j
        )
      )
      setSnackbar({
        open: true,
        message: `Job ${job.jobNumber} moved to ${newStatus}`,
        severity: 'success',
      })
    } catch (error) {
      console.error('Failed to update status:', error)
      setSnackbar({ open: true, message: `Failed to update status: ${error.message}`, severity: 'error' })
    }
  }

  const handleStartJob = async (job) => {
    await handleStatusChange(job.id, JOB_STATUSES.IN_PROCESS)
  }

  const handlePauseJob = async (job) => {
    await handleStatusChange(job.id, JOB_STATUSES.SCHEDULED)
  }

  const handleCompleteJob = async (job) => {
    await handleStatusChange(job.id, JOB_STATUSES.WAITING_QC)
  }

  const handleUpdateJob = async (jobId, updates) => {
    try {
      await updateJob(jobId, updates)
      await loadJobs()
      setSnackbar({ open: true, message: 'Job updated successfully', severity: 'success' })
    } catch (error) {
      console.error('Failed to update job:', error)
      setSnackbar({ open: true, message: `Failed to update job: ${error.message}`, severity: 'error' })
    }
  }

  const handleCreateJob = async () => {
    try {
      const jobData = {
        operationType: newJob.processingType,
        priority: Object.keys(PRIORITY_LEVELS).indexOf(newJob.priority) + 1 || 3,
        instructions: `${newJob.customerName} - ${newJob.material || 'No material specified'}`,
        notes: newJob.notes,
        status: JOB_STATUSES.ORDERED,
      }
      
      const created = await createJob(jobData)
      
      setCreateDialogOpen(false)
      setNewJob({
        customerName: '',
        processingType: '',
        priority: 'NORMAL',
        material: '',
        targetPieces: '',
        notes: '',
      })
      setSnackbar({ open: true, message: `Job ${created.jobNumber} created successfully`, severity: 'success' })
      
      await loadJobs()
    } catch (error) {
      console.error('Failed to create job:', error)
      setSnackbar({ open: true, message: `Failed to create job: ${error.message}`, severity: 'error' })
    }
  }

  // Quick stats for header
  const stats = {
    total: jobs.length,
    hot: jobs.filter(j => j.priority === 'HOT').length,
    overdue: jobs.filter(j => j.dueDate && new Date(j.dueDate) < new Date()).length,
    inProgress: jobs.filter(j => j.status === 'IN_PROCESS').length,
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #f0f2f5 0%, #e8eaed 100%)',
    }}>
      {/* Modern Header */}
      <Box sx={{ 
        px: 3, 
        py: 2.5, 
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}>
              <AnalyticsIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                Order Board
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Real-time production scheduling • AI-powered insights
              </Typography>
            </Box>
          </Box>

          {/* Header Stats */}
          <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Paper sx={{ 
              px: 2, 
              py: 1, 
              bgcolor: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 2,
            }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Total Jobs</Typography>
              <Typography variant="h6" fontWeight={700}>{stats.total}</Typography>
            </Paper>
            {stats.hot > 0 && (
              <Paper sx={{ 
                px: 2, 
                py: 1, 
                bgcolor: alpha('#f44336', 0.2), 
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: alpha('#f44336', 0.4),
                borderRadius: 2,
              }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FireIcon sx={{ fontSize: 14 }} /> Hot Jobs
                </Typography>
                <Typography variant="h6" fontWeight={700}>{stats.hot}</Typography>
              </Paper>
            )}
            {stats.overdue > 0 && (
              <Paper sx={{ 
                px: 2, 
                py: 1, 
                bgcolor: alpha('#ff9800', 0.2), 
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: alpha('#ff9800', 0.4),
                borderRadius: 2,
              }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <WarningIcon sx={{ fontSize: 14 }} /> Overdue
                </Typography>
                <Typography variant="h6" fontWeight={700}>{stats.overdue}</Typography>
              </Paper>
            )}
            <Paper sx={{ 
              px: 2, 
              py: 1, 
              bgcolor: alpha('#4caf50', 0.2), 
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: alpha('#4caf50', 0.4),
              borderRadius: 2,
            }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SpeedIcon sx={{ fontSize: 14 }} /> In Progress
              </Typography>
              <Typography variant="h6" fontWeight={700}>{stats.inProgress}</Typography>
            </Paper>
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s',
              }}
            >
              New Job
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Modern Kanban Board */}
      <Box sx={{ flex: 1, p: 2.5, overflow: 'hidden' }}>
        <ModernKanbanBoard
          jobs={jobs}
          columns={KANBAN_COLUMNS}
          onJobClick={handleJobClick}
          onStartJob={handleStartJob}
          onPauseJob={handlePauseJob}
          onCompleteJob={handleCompleteJob}
          onStatusChange={handleStatusChange}
          onUpdateJob={handleUpdateJob}
          onRefresh={loadJobs}
          loading={loading}
        />
      </Box>

      {/* Modern Create Job Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
          color: 'white',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <AddIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>Create New Job</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>Add a new job to the order board</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setCreateDialogOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            {/* Customer Name */}
            <TextField
              label="Customer Name"
              value={newJob.customerName}
              onChange={(e) => setNewJob({ ...newJob, customerName: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Processing Type & Priority Row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Processing Type"
                value={newJob.processingType}
                onChange={(e) => setNewJob({ ...newJob, processingType: e.target.value })}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ProcessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {Object.entries(PROCESSING_TYPES).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Priority"
                value={newJob.priority}
                onChange={(e) => setNewJob({ ...newJob, priority: e.target.value })}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {Object.entries(PRIORITY_LEVELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {key === 'HOT' && <FireIcon sx={{ fontSize: 18, color: 'error.main' }} />}
                      {key === 'URGENT' && <BoltIcon sx={{ fontSize: 18, color: 'warning.main' }} />}
                      <span>{label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* Material Description */}
            <TextField
              label="Material Description"
              value={newJob.material}
              onChange={(e) => setNewJob({ ...newJob, material: e.target.value })}
              fullWidth
              placeholder='e.g., HR Coil 0.125" x 48"'
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <InventoryIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Target Pieces */}
            <TextField
              label="Target Pieces"
              type="number"
              value={newJob.targetPieces}
              onChange={(e) => setNewJob({ ...newJob, targetPieces: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NumbersIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Notes */}
            <TextField
              label="Notes"
              value={newJob.notes}
              onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Special instructions, requirements, etc."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                    <NotesIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* AI Suggestion */}
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: alpha('#9c27b0', 0.05),
              border: '1px solid',
              borderColor: alpha('#9c27b0', 0.2),
            }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <TipsIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="secondary.main" fontWeight={600}>
                    AI Tip
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Jobs created before 10 AM typically complete 15% faster due to optimal machine availability.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            sx={{ color: 'text.secondary', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateJob}
            disabled={!newJob.customerName || !newJob.processingType}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #152a45 0%, #1e3a5f 100%)',
              },
              '&.Mui-disabled': {
                background: 'grey.300',
              }
            }}
          >
            Create Job
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
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ModernOrderBoardPage
