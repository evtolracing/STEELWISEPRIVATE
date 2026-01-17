import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  Snackbar,
  Grid,
  Paper,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Divider,
} from '@mui/material'
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Warning as IssueIcon,
  Person as PersonIcon,
  QrCodeScanner as ScanIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material'
import { ShopFloorTaskCard } from '../components/jobs'
import { JOB_STATUSES } from '../constants/jobStatuses'
import { DEFAULT_WORK_CENTERS, WORK_CENTER_STATUS } from '../constants/processingTypes'
import { PRIORITY_LEVELS } from '../constants/materials'

// Generate mock jobs for shop floor
const generateShopFloorJobs = (workCenterId) => {
  const customers = ['ABC Steel', 'Metro Mfg', 'Industrial Corp', 'Steel Solutions']
  const materials = [
    { desc: 'HR Coil 0.125" x 48"', dim: '0.125" x 48" x Coil' },
    { desc: 'CR Sheet 16ga x 60"', dim: '0.060" x 60" x 120"' },
    { desc: 'Galv Coil 0.060" x 36"', dim: '0.060" x 36" x Coil' },
    { desc: 'SS 304 0.048" x 48"', dim: '0.048" x 48" x 96"' },
  ]

  return Array.from({ length: 4 }, (_, i) => ({
    id: `JOB-${1000 + i}`,
    jobNumber: `JOB-${1000 + i}`,
    customerName: customers[i],
    status: i === 0 ? JOB_STATUSES.IN_PROCESS : JOB_STATUSES.SCHEDULED,
    priority: Object.values(PRIORITY_LEVELS)[i],
    processingType: 'SLITTING',
    materialDescription: materials[i].desc,
    dimensions: materials[i].dim,
    weight: Math.floor(Math.random() * 30000 + 10000),
    targetPieces: Math.floor(Math.random() * 300 + 100),
    completedPieces: i === 0 ? Math.floor(Math.random() * 100 + 50) : 0,
    startedAt: i === 0 ? new Date(Date.now() - 45 * 60 * 1000).toISOString() : null,
    workCenterId,
    operatorName: i === 0 ? 'John D.' : null,
  }))
}

const ShopFloorPage = () => {
  const [selectedWorkCenter, setSelectedWorkCenter] = useState(null)
  const [currentOperator, setCurrentOperator] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Dialogs
  const [loginDialogOpen, setLoginDialogOpen] = useState(true)
  const [outputDialogOpen, setOutputDialogOpen] = useState(false)
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)

  // Output recording
  const [outputCount, setOutputCount] = useState(0)
  const [scrapCount, setScrapCount] = useState(0)

  // Issue reporting
  const [issueType, setIssueType] = useState('')
  const [issueNotes, setIssueNotes] = useState('')

  const workCenters = DEFAULT_WORK_CENTERS.map((wc) => ({
    ...wc,
    status: WORK_CENTER_STATUS.ACTIVE,
  }))

  const loadJobs = useCallback(async () => {
    if (!selectedWorkCenter) return
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 300))
      setJobs(generateShopFloorJobs(selectedWorkCenter.id))
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedWorkCenter])

  useEffect(() => {
    if (selectedWorkCenter) {
      loadJobs()
    }
  }, [selectedWorkCenter, loadJobs])

  const handleLogin = (operator, workCenter) => {
    setCurrentOperator(operator)
    setSelectedWorkCenter(workCenter)
    setLoginDialogOpen(false)
    setSnackbar({
      open: true,
      message: `Logged in as ${operator.name} at ${workCenter.name}`,
      severity: 'success',
    })
  }

  const handleLogout = () => {
    setCurrentOperator(null)
    setSelectedWorkCenter(null)
    setJobs([])
    setLoginDialogOpen(true)
  }

  const handleStartJob = async (job) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id
          ? {
              ...j,
              status: JOB_STATUSES.IN_PROCESS,
              startedAt: new Date().toISOString(),
              operatorName: currentOperator?.name,
            }
          : j
      )
    )
    setSnackbar({ open: true, message: `Started ${job.jobNumber}`, severity: 'success' })
  }

  const handlePauseJob = async (job) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id
          ? { ...j, status: JOB_STATUSES.SCHEDULED, startedAt: null }
          : j
      )
    )
    setSnackbar({ open: true, message: `Paused ${job.jobNumber}`, severity: 'info' })
  }

  const handleCompleteJob = async (job) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id
          ? { ...j, status: JOB_STATUSES.WAITING_QC }
          : j
      )
    )
    setSnackbar({ open: true, message: `Completed ${job.jobNumber} - Awaiting QC`, severity: 'success' })
  }

  const handleRecordOutput = (job) => {
    setSelectedJob(job)
    setOutputCount(1)
    setScrapCount(0)
    setOutputDialogOpen(true)
  }

  const handleSubmitOutput = () => {
    if (!selectedJob) return
    setJobs((prev) =>
      prev.map((j) =>
        j.id === selectedJob.id
          ? { ...j, completedPieces: (j.completedPieces || 0) + outputCount }
          : j
      )
    )
    setOutputDialogOpen(false)
    setSnackbar({
      open: true,
      message: `Recorded ${outputCount} pieces for ${selectedJob.jobNumber}`,
      severity: 'success',
    })
  }

  const handleReportIssue = (job) => {
    setSelectedJob(job)
    setIssueType('')
    setIssueNotes('')
    setIssueDialogOpen(true)
  }

  const handleSubmitIssue = () => {
    if (!selectedJob) return
    setIssueDialogOpen(false)
    setSnackbar({
      open: true,
      message: `Issue reported for ${selectedJob.jobNumber}`,
      severity: 'warning',
    })
  }

  const activeJob = jobs.find((j) => j.status === JOB_STATUSES.IN_PROCESS)
  const queuedJobs = jobs.filter((j) => j.status === JOB_STATUSES.SCHEDULED)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'grey.100',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header - Large touch targets */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" fontWeight={700} color="primary">
            SHOP FLOOR
          </Typography>
          {selectedWorkCenter && (
            <Chip
              label={selectedWorkCenter.name}
              color="primary"
              variant="outlined"
              sx={{ fontSize: '1rem', height: 40 }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {currentOperator && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                {currentOperator.name.charAt(0)}
              </Avatar>
              <Typography variant="subtitle1" fontWeight={500}>
                {currentOperator.name}
              </Typography>
            </Box>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ minHeight: 48 }}
          >
            LOGOUT
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 2 }}>
        {activeJob && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
              ACTIVE JOB
            </Typography>
            <ShopFloorTaskCard
              job={activeJob}
              isActive
              onPause={handlePauseJob}
              onComplete={handleCompleteJob}
              onRecordOutput={handleRecordOutput}
              onReportIssue={handleReportIssue}
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
          QUEUE ({queuedJobs.length})
        </Typography>
        <Grid container spacing={2}>
          {queuedJobs.map((job) => (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <ShopFloorTaskCard
                job={job}
                onStart={handleStartJob}
                onReportIssue={handleReportIssue}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Login Dialog */}
      <Dialog
        open={loginDialogOpen}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <PersonIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight={600}>
            Operator Login
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight={500}>
              Select Work Center
            </Typography>
            <Grid container spacing={1}>
              {workCenters.map((wc) => (
                <Grid item xs={6} key={wc.id}>
                  <Button
                    fullWidth
                    variant={selectedWorkCenter?.id === wc.id ? 'contained' : 'outlined'}
                    onClick={() => setSelectedWorkCenter(wc)}
                    sx={{ py: 2, fontSize: '1rem' }}
                  >
                    {wc.name}
                  </Button>
                </Grid>
              ))}
            </Grid>

            <Typography variant="subtitle1" fontWeight={500} sx={{ mt: 2 }}>
              Enter Badge ID or Select
            </Typography>
            <Grid container spacing={1}>
              {[
                { id: 'OP001', name: 'John Doe' },
                { id: 'OP002', name: 'Jane Smith' },
                { id: 'OP003', name: 'Mike Johnson' },
                { id: 'OP004', name: 'Sarah Williams' },
              ].map((op) => (
                <Grid item xs={6} key={op.id}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleLogin(op, selectedWorkCenter)}
                    disabled={!selectedWorkCenter}
                    sx={{ py: 2, fontSize: '0.9rem' }}
                  >
                    {op.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Output Recording Dialog */}
      <Dialog
        open={outputDialogOpen}
        onClose={() => setOutputDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Record Output</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1, alignItems: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">
              {selectedJob?.jobNumber}
            </Typography>

            <Typography variant="subtitle1" fontWeight={500}>
              Good Pieces
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                size="large"
                onClick={() => setOutputCount((c) => Math.max(0, c - 1))}
                sx={{ bgcolor: 'grey.200', width: 64, height: 64 }}
              >
                <RemoveIcon fontSize="large" />
              </IconButton>
              <Typography variant="h3" fontWeight={700} sx={{ minWidth: 80, textAlign: 'center' }}>
                {outputCount}
              </Typography>
              <IconButton
                size="large"
                onClick={() => setOutputCount((c) => c + 1)}
                sx={{ bgcolor: 'primary.main', color: 'white', width: 64, height: 64 }}
              >
                <AddIcon fontSize="large" />
              </IconButton>
            </Box>

            <Typography variant="subtitle1" fontWeight={500}>
              Scrap
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                size="large"
                onClick={() => setScrapCount((c) => Math.max(0, c - 1))}
                sx={{ bgcolor: 'grey.200', width: 56, height: 56 }}
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="h4" fontWeight={600} sx={{ minWidth: 60, textAlign: 'center' }}>
                {scrapCount}
              </Typography>
              <IconButton
                size="large"
                onClick={() => setScrapCount((c) => c + 1)}
                sx={{ bgcolor: 'error.main', color: 'white', width: 56, height: 56 }}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOutputDialogOpen(false)} sx={{ minHeight: 48 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitOutput}
            sx={{ minHeight: 48, minWidth: 120 }}
          >
            RECORD
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue Reporting Dialog */}
      <Dialog
        open={issueDialogOpen}
        onClose={() => setIssueDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Issue</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {selectedJob?.jobNumber}
            </Typography>

            <ToggleButtonGroup
              value={issueType}
              exclusive
              onChange={(_, v) => v && setIssueType(v)}
              fullWidth
              sx={{ '& .MuiToggleButton-root': { py: 2 } }}
            >
              <ToggleButton value="quality">Quality</ToggleButton>
              <ToggleButton value="machine">Machine</ToggleButton>
              <ToggleButton value="material">Material</ToggleButton>
              <ToggleButton value="safety">Safety</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="Notes"
              value={issueNotes}
              onChange={(e) => setIssueNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIssueDialogOpen(false)} sx={{ minHeight: 48 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmitIssue}
            disabled={!issueType}
            sx={{ minHeight: 48 }}
          >
            REPORT ISSUE
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontSize: '1rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ShopFloorPage
