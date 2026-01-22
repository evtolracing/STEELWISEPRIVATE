import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
  Avatar,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  ViewList as ListIcon,
  Schedule as ScheduleIcon,
  AutoAwesome as AIIcon,
  LocalFireDepartment as FireIcon,
  CheckCircle as ActiveIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material'
import { WorkCenterSchedule } from '../components/jobs'
import { DEFAULT_WORK_CENTERS, WORK_CENTER_STATUS, PROCESSING_TYPES } from '../constants/processingTypes'
import { JOB_STATUSES } from '../constants/jobStatuses'
import { PRIORITY_LEVELS } from '../constants/materials'

// Mock data generator for work centers
const generateMockWorkCenters = () => {
  return DEFAULT_WORK_CENTERS.map((wc, idx) => ({
    ...wc,
    status: idx === 2 ? WORK_CENTER_STATUS.MAINTENANCE : WORK_CENTER_STATUS.ACTIVE,
    utilization: Math.floor(Math.random() * 40 + 50),
    currentOperator: idx % 2 === 0 ? 'John D.' : null,
    activeJob: idx % 3 === 0 ? `JOB-100${idx}` : null,
  }))
}

// Mock scheduled jobs
const generateMockScheduledJobs = (date) => {
  const baseHour = 6
  const jobs = []
  const customers = ['ABC Steel', 'Metro Mfg', 'Industrial Corp', 'Steel Solutions']
  const materials = ['HR Coil 0.125"', 'CR Sheet 16ga', 'Galv Coil 0.060"', 'SS 304 0.048"']

  for (let i = 0; i < 15; i++) {
    const startHour = baseHour + (i % 8)
    const duration = Math.floor(Math.random() * 3) + 1
    jobs.push({
      id: `JOB-${1000 + i}`,
      jobNumber: `JOB-${1000 + i}`,
      customerName: customers[i % customers.length],
      material: materials[i % materials.length],
      status: i < 3 ? JOB_STATUSES.IN_PROCESS : JOB_STATUSES.SCHEDULED,
      priority: Object.values(PRIORITY_LEVELS)[i % 4],
      processingType: Object.keys(PROCESSING_TYPES)[i % Object.keys(PROCESSING_TYPES).length],
      workCenterId: DEFAULT_WORK_CENTERS[i % DEFAULT_WORK_CENTERS.length].id,
      scheduledStart: new Date(date.setHours(startHour, 0, 0, 0)).toISOString(),
      scheduledEnd: new Date(date.setHours(startHour + duration, 0, 0, 0)).toISOString(),
      estimatedDuration: duration * 60, // minutes
      targetPieces: Math.floor(Math.random() * 200 + 50),
    })
  }

  return jobs
}

const SchedulePage = () => {
  const [date, setDate] = useState(new Date())
  const [workCenters, setWorkCenters] = useState([])
  const [scheduledJobs, setScheduledJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const loadScheduleData = useCallback(async () => {
    setLoading(true)
    try {
      // In production: const [wcs, jobs] = await Promise.all([getWorkCenters(), getAllSchedules(date)])
      await new Promise((r) => setTimeout(r, 400))
      setWorkCenters(generateMockWorkCenters())
      setScheduledJobs(generateMockScheduledJobs(new Date(date)))
    } catch (error) {
      console.error('Failed to load schedule:', error)
      setSnackbar({ open: true, message: 'Failed to load schedule', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    loadScheduleData()
  }, [loadScheduleData])

  const handleDateChange = (newDate) => {
    setDate(newDate)
  }

  const handleJobClick = (job) => {
    console.log('Selected job:', job)
    // Navigate to job detail or open modal
  }

  // Calculate summary stats
  const stats = {
    totalJobs: scheduledJobs.length,
    inProcess: scheduledJobs.filter((j) => j.status === JOB_STATUSES.IN_PROCESS).length,
    scheduled: scheduledJobs.filter((j) => j.status === JOB_STATUSES.SCHEDULED).length,
    hotJobs: scheduledJobs.filter((j) => j.priority === PRIORITY_LEVELS.HOT).length,
    activeWorkCenters: workCenters.filter((wc) => wc.status === WORK_CENTER_STATUS.ACTIVE).length,
    avgUtilization: workCenters.length
      ? Math.round(workCenters.reduce((acc, wc) => acc + (wc.utilization || 0), 0) / workCenters.length)
      : 0,
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', 
      display: 'flex', 
      flexDirection: 'column',
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
              <ScheduleIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                Work Center Schedule
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  View and manage machine schedules • AI-optimized
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Schedule Job
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
          <Stack 
            direction="row" 
            spacing={4} 
            divider={<Box sx={{ borderRight: 1, borderColor: 'divider' }} />}
            flexWrap="wrap"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#1976d2', 0.1) }}>
                <CalendarIcon sx={{ color: 'primary.main' }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Jobs</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.totalJobs}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#2e7d32', 0.1) }}>
                <ActiveIcon sx={{ color: 'success.main' }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">In Process</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">{stats.inProcess}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#0288d1', 0.1) }}>
                <ScheduleIcon sx={{ color: 'info.main' }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">Scheduled</Typography>
                <Typography variant="h5" fontWeight={700} color="info.main">{stats.scheduled}</Typography>
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
                <SpeedIcon sx={{ color: '#7b1fa2' }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">Avg Utilization</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#7b1fa2' }}>{stats.avgUtilization}%</Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 3, pt: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
            }
          }}
        >
          <Tab icon={<CalendarIcon />} label="Schedule View" iconPosition="start" />
          <Tab icon={<ListIcon />} label="Queue View" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'hidden' }}>
        {activeTab === 0 && (
          <WorkCenterSchedule
            workCenters={workCenters}
            jobs={scheduledJobs}
            date={date}
            onDateChange={handleDateChange}
            onJobClick={handleJobClick}
            onRefresh={loadScheduleData}
            loading={loading}
          />
        )}
        {activeTab === 1 && (
          <Box>
            {/* Queue view - simplified list */}
            <Stack spacing={2}>
              {workCenters.map((wc) => (
                <Paper 
                  key={wc.id} 
                  sx={{ 
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    {wc.name} - {wc.type}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Status: {wc.status} | Utilization: {wc.utilization}%
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    {scheduledJobs
                      .filter((j) => j.workCenterId === wc.id)
                      .slice(0, 5)
                      .map((job) => (
                        <Box
                          key={job.id}
                          sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.75,
                            mr: 1,
                            mb: 0.5,
                            borderRadius: 2,
                            bgcolor: job.status === JOB_STATUSES.IN_PROCESS ? alpha('#2e7d32', 0.15) : alpha('#666', 0.1),
                            border: '1px solid',
                            borderColor: job.status === JOB_STATUSES.IN_PROCESS ? alpha('#2e7d32', 0.3) : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }
                          }}
                          onClick={() => handleJobClick(job)}
                        >
                          <Typography variant="caption" fontWeight={600}>{job.jobNumber}</Typography>
                        </Box>
                      ))}
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

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

export default SchedulePage
