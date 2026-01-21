import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Container,
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
  Fab,
} from '@mui/material'
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { KanbanBoard } from '../components/jobs'
import { KANBAN_COLUMNS, JOB_STATUSES, canTransitionTo } from '../constants/jobStatuses'
import { PROCESSING_TYPES } from '../constants/processingTypes'
import { PRIORITY_LEVELS } from '../constants/materials'
import { getJobs, createJob, updateJobStatus, updateJob } from '../services/jobsApi'

// Mock data for demo mode
const generateMockJobs = () => {
  const statuses = Object.values(JOB_STATUSES)
  const processingTypes = Object.values(PROCESSING_TYPES)
  const priorities = Object.values(PRIORITY_LEVELS)
  const customers = ['ABC Steel', 'Metro Manufacturing', 'Industrial Corp', 'Steel Solutions', 'Precision Parts']
  const materials = [
    'HR Coil 0.125" x 48"',
    'CR Sheet 16ga x 60"',
    'Galv Coil 0.060" x 36"',
    'Stainless 304 0.048" x 48"',
    'HR P&O 0.250" x 72"',
  ]

  return Array.from({ length: 25 }, (_, i) => ({
    id: `JOB-${String(1000 + i).padStart(4, '0')}`,
    jobNumber: `JOB-${String(1000 + i).padStart(4, '0')}`,
    customerName: customers[i % customers.length],
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    processingType: Object.keys(PROCESSING_TYPES)[i % Object.keys(PROCESSING_TYPES).length],
    material: materials[i % materials.length],
    materialDescription: materials[i % materials.length],
    dimensions: `${(Math.random() * 0.5 + 0.05).toFixed(3)}" x ${[36, 48, 60, 72][i % 4]}" x Coil`,
    weight: Math.floor(Math.random() * 40000 + 5000),
    targetPieces: Math.floor(Math.random() * 500 + 50),
    completedPieces: Math.floor(Math.random() * 200),
    dueDate: new Date(Date.now() + (i - 10) * 24 * 60 * 60 * 1000).toISOString(),
    workCenterId: `WC-${(i % 5) + 1}`,
    workCenterName: ['Slitter #1', 'CTL Line', 'Shear', 'Press Brake', 'Leveler'][i % 5],
    operators: i % 3 === 0 ? [{ name: 'John D.', initials: 'JD' }] : [],
  }))
}

const OrderBoardPage = () => {
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
      console.log('Loaded jobs from database:', data.length, 'Jobs:', data)
    } catch (error) {
      console.error('Failed to load jobs:', error)
      setSnackbar({ open: true, message: `Failed to load jobs: ${error.message}`, severity: 'error' })
      // Set empty array on error instead of mock data
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
    // Navigate to job detail or show modal
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
      // Map frontend fields to backend Job schema
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
      
      // Reload jobs from database to ensure fresh data
      await loadJobs()
    } catch (error) {
      console.error('Failed to create job:', error)
      setSnackbar({ open: true, message: `Failed to create job: ${error.message}`, severity: 'error' })
    }
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Order Board
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drag jobs between columns to update status
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              New Job
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Kanban Board */}
      <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}>
        <KanbanBoard
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

      {/* Create Job Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Create New Job
          <IconButton
            onClick={() => setCreateDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Customer Name"
              value={newJob.customerName}
              onChange={(e) => setNewJob({ ...newJob, customerName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              select
              label="Processing Type"
              value={newJob.processingType}
              onChange={(e) => setNewJob({ ...newJob, processingType: e.target.value })}
              fullWidth
              required
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
            >
              {Object.entries(PRIORITY_LEVELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Material Description"
              value={newJob.material}
              onChange={(e) => setNewJob({ ...newJob, material: e.target.value })}
              fullWidth
              placeholder="e.g., HR Coil 0.125&quot; x 48&quot;"
            />
            <TextField
              label="Target Pieces"
              type="number"
              value={newJob.targetPieces}
              onChange={(e) => setNewJob({ ...newJob, targetPieces: e.target.value })}
              fullWidth
            />
            <TextField
              label="Notes"
              value={newJob.notes}
              onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateJob}
            disabled={!newJob.customerName || !newJob.processingType}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default OrderBoardPage
