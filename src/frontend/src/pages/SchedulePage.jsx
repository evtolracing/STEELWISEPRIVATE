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
import { useNavigate } from 'react-router-dom'
import { WorkCenterSchedule } from '../components/jobs'
import { getWorkCenters } from '../api/workCenters'
import { getJobs } from '../api/jobs'
import { WORK_CENTER_STATUS } from '../constants/processingTypes'
import { JOB_STATUSES } from '../constants/jobStatuses'
import { PRIORITY_LEVELS } from '../constants/materials'

const DAY_START_HOUR = 6
const DAY_HOURS = 10 // the grid shows 6 AM to 4 PM

/** Hours of the shown day a work center is booked for, as a share of the day. */
function bookedShare(jobs) {
  const minutes = jobs.reduce((sum, j) => {
    if (!j.scheduledStart) return sum
    const start = new Date(j.scheduledStart)
    const end = j.scheduledEnd ? new Date(j.scheduledEnd) : new Date(start.getTime() + 2 * 3600000)
    return sum + Math.max(0, (end - start) / 60000)
  }, 0)
  return Math.min(100, Math.round((minutes / (DAY_HOURS * 60)) * 100))
}

const SchedulePage = () => {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date())
  const [workCenters, setWorkCenters] = useState([])
  const [scheduledJobs, setScheduledJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const loadScheduleData = useCallback(async () => {
    setLoading(true)
    try {
      const from = new Date(date)
      from.setHours(0, 0, 0, 0)
      const to = new Date(from)
      to.setDate(to.getDate() + 1)
      const [wcs, jobs] = await Promise.all([
        getWorkCenters({ isActive: true }),
        getJobs({ scheduledFrom: from.toISOString(), scheduledTo: to.toISOString(), limit: 2000 }),
      ])
      const dayJobs = (Array.isArray(jobs) ? jobs : []).filter((j) => j.status !== 'CANCELLED')
      setScheduledJobs(dayJobs)
      // "Booked" is the share of the shown day with a job scheduled on the work center.
      setWorkCenters((Array.isArray(wcs) ? wcs : []).map((wc) => ({
        ...wc,
        status: wc.isActive ? 'ACTIVE' : 'DOWN',
        utilization: bookedShare(dayJobs.filter((j) => j.workCenterId === wc.id)),
      })))
    } catch (error) {
      console.error('Failed to load schedule:', error)
      setWorkCenters([])
      setScheduledJobs([])
      setSnackbar({ open: true, message: error.response?.data?.error || 'The schedule could not be loaded', severity: 'error' })
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
    navigate(`/jobs/${job.id}`)
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
              onClick={() => navigate('/order-board')}
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

      {!loading && scheduledJobs.some((j) => !j.workCenterId) && (
        <Alert severity="warning" sx={{ mx: 3, mt: 2 }}>
          {scheduledJobs.filter((j) => !j.workCenterId).length} job(s) scheduled for this day have no work center, so they are not on the grid. Plan them on the Order Board.
        </Alert>
      )}
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
                <Typography variant="caption" color="text.secondary">Average booked</Typography>
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
                    Status: {wc.status} | Booked: {wc.utilization}%
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
