import React, { useState, useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  ButtonGroup,
  Button,
  Badge,
  Avatar,
  Stack,
  LinearProgress,
} from '@mui/material'
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarIcon,
  ViewList as ListIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Build as MaintenanceIcon,
} from '@mui/icons-material'
import { WORK_CENTER_STATUS } from '../../constants/processingTypes'
import { JOB_STATUS_CONFIG } from '../../constants/jobStatuses'

const WorkCenterRow = ({ workCenter, jobs, date, onJobClick }) => {
  // Group jobs by hour slots
  const hours = Array.from({ length: 10 }, (_, i) => i + 6) // 6 AM to 3 PM

  const getJobsForHour = (hour) => {
    return jobs.filter((job) => {
      if (!job.scheduledStart) return false
      const startHour = new Date(job.scheduledStart).getHours()
      const endHour = job.scheduledEnd
        ? new Date(job.scheduledEnd).getHours()
        : startHour + 2
      return hour >= startHour && hour < endHour
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success.main'
      case 'RUNNING': return 'success.light'
      case 'MAINTENANCE': return 'warning.main'
      case 'DOWN': return 'error.main'
      default: return 'grey.400'
    }
  }

  return (
    <TableRow hover>
      {/* Work Center Info */}
      <TableCell
        sx={{
          position: 'sticky',
          left: 0,
          backgroundColor: 'background.paper',
          zIndex: 1,
          minWidth: 180,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: getStatusColor(workCenter.status),
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                fontSize: '0.75rem',
              }}
            >
              {workCenter.code || workCenter.name?.substring(0, 2)}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {workCenter.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {workCenter.type}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      {/* Utilization */}
      <TableCell sx={{ minWidth: 80, borderRight: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={workCenter.utilization || 0}
            sx={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
            }}
          />
          <Typography variant="caption" fontWeight={500}>
            {workCenter.utilization || 0}%
          </Typography>
        </Box>
      </TableCell>

      {/* Time Slots */}
      {hours.map((hour) => {
        const slotJobs = getJobsForHour(hour)
        return (
          <TableCell
            key={hour}
            sx={{
              p: 0.5,
              minWidth: 100,
              backgroundColor: slotJobs.length > 0 ? 'action.hover' : 'transparent',
              borderLeft: hour === 6 ? '2px solid' : '1px solid',
              borderColor: 'divider',
            }}
          >
            {slotJobs.map((job) => (
              <Chip
                key={job.id}
                label={job.jobNumber || job.id}
                size="small"
                onClick={() => onJobClick?.(job)}
                sx={{
                  m: 0.25,
                  backgroundColor: JOB_STATUS_CONFIG[job.status]?.bgColor || 'grey.200',
                  borderLeft: '3px solid',
                  borderColor: JOB_STATUS_CONFIG[job.status]?.color || 'grey.500',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                }}
              />
            ))}
          </TableCell>
        )
      })}
    </TableRow>
  )
}

const WorkCenterSchedule = ({
  workCenters = [],
  jobs = [],
  date = new Date(),
  onDateChange,
  onJobClick,
  onRefresh,
  loading = false,
}) => {
  const [viewMode, setViewMode] = useState('gantt') // 'gantt' | 'list'

  const hours = useMemo(
    () => Array.from({ length: 10 }, (_, i) => i + 6), // 6 AM to 3 PM
    []
  )

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour
    return `${displayHour}${period}`
  }

  const handlePrevDay = () => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange?.(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange?.(newDate)
  }

  const handleToday = () => {
    onDateChange?.(new Date())
  }

  const formatDate = (d) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        {/* Date Navigation */}
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Previous Day">
            <Button onClick={handlePrevDay}>
              <PrevIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Button onClick={handleToday}>Today</Button>
          <Tooltip title="Next Day">
            <Button onClick={handleNextDay}>
              <NextIcon fontSize="small" />
            </Button>
          </Tooltip>
        </ButtonGroup>

        <Typography variant="h6" sx={{ minWidth: 150 }}>
          {formatDate(date)}
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* View Toggle */}
        <ButtonGroup size="small">
          <Tooltip title="Gantt View">
            <Button
              variant={viewMode === 'gantt' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('gantt')}
            >
              <CalendarIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="List View">
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('list')}
            >
              <ListIcon fontSize="small" />
            </Button>
          </Tooltip>
        </ButtonGroup>

        {/* Stats */}
        <Stack direction="row" spacing={1}>
          <Chip
            label={`${workCenters.filter((wc) => wc.status === 'ACTIVE').length} Active`}
            size="small"
            color="success"
            variant="outlined"
          />
          <Chip
            label={`${jobs.length} Jobs`}
            size="small"
            variant="outlined"
          />
        </Stack>

        {onRefresh && (
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Schedule Grid */}
      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  backgroundColor: 'background.paper',
                  minWidth: 180,
                  fontWeight: 600,
                }}
              >
                Work Center
              </TableCell>
              <TableCell sx={{ minWidth: 80, fontWeight: 600 }}>Util %</TableCell>
              {hours.map((hour) => (
                <TableCell
                  key={hour}
                  align="center"
                  sx={{
                    minWidth: 100,
                    fontWeight: 600,
                    backgroundColor: hour === new Date().getHours() ? 'primary.light' : undefined,
                    color: hour === new Date().getHours() ? 'primary.contrastText' : undefined,
                  }}
                >
                  {formatHour(hour)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {workCenters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hours.length + 2} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No work centers configured</Typography>
                </TableCell>
              </TableRow>
            ) : (
              workCenters.map((workCenter) => (
                <WorkCenterRow
                  key={workCenter.id}
                  workCenter={workCenter}
                  jobs={jobs.filter((j) => j.workCenterId === workCenter.id)}
                  date={date}
                  onJobClick={onJobClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
          Active
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
          Maintenance
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
          Down
        </Typography>
      </Box>
    </Box>
  )
}

export default WorkCenterSchedule
