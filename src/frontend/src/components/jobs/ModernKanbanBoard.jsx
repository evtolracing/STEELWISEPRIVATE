import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Badge,
  Chip,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  Divider,
  Stack,
  Fade,
  Zoom,
  alpha,
  Button,
  Drawer,
  Avatar,
  CircularProgress,
  Collapse,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  ViewColumn as ColumnIcon,
  Close as CloseIcon,
  Send as SendIcon,
  TipsAndUpdates as TipsIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Schedule as ScheduleIcon,
  LocalFireDepartment as FireIcon,
  Bolt as BoltIcon,
  Lightbulb as IdeaIcon,
  ArrowForward as ArrowIcon,
  Analytics as AnalyticsIcon,
  Psychology as ThinkIcon,
} from '@mui/icons-material'
import { KANBAN_COLUMNS, JOB_STATUS_CONFIG } from '../../constants/jobStatuses'
import ModernJobCard from './ModernJobCard'

// Modern Kanban Column
const ModernKanbanColumn = ({
  column,
  jobs,
  onJobClick,
  onStartJob,
  onPauseJob,
  onCompleteJob,
  onUpdateJob,
  onDrop,
  isDropTarget,
}) => {
  const config = JOB_STATUS_CONFIG[column.status] || JOB_STATUS_CONFIG[column.statuses?.[0]] || {}
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Filter jobs by column's statuses array
  const columnJobs = jobs.filter(job => 
    column.statuses ? column.statuses.includes(job.status) : job.status === column.status
  )

  // Sort jobs by priority and due date
  const sortedJobs = [...columnJobs].sort((a, b) => {
    const priorityOrder = { HOT: 0, URGENT: 1, NORMAL: 2, LOW: 3 }
    const pA = priorityOrder[a.priority] ?? 2
    const pB = priorityOrder[b.priority] ?? 2
    if (pA !== pB) return pA - pB
    return new Date(a.dueDate || 0) - new Date(b.dueDate || 0)
  })

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const jobId = e.dataTransfer.getData('jobId')
    if (jobId && onDrop) {
      const targetStatus = column.statuses ? column.statuses[0] : column.status
      onDrop(jobId, targetStatus)
    }
  }

  // Stats
  const hotJobs = columnJobs.filter(j => j.priority === 'HOT').length
  const overdueJobs = columnJobs.filter(j => j.dueDate && new Date(j.dueDate) < new Date()).length

  return (
    <Paper
      elevation={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        minWidth: 320,
        maxWidth: 360,
        flex: '1 1 320px',
        display: 'flex',
        flexDirection: 'column',
        background: isDragOver 
          ? `linear-gradient(180deg, ${alpha(config.color || '#1976d2', 0.08)}, ${alpha(config.color || '#1976d2', 0.02)})`
          : 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
        borderRadius: 3,
        height: '100%',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isDragOver ? config.color || 'primary.main' : alpha('#000', 0.08),
        transition: 'all 0.3s ease',
        transform: isDragOver ? 'scale(1.01)' : 'none',
        boxShadow: isDragOver 
          ? `0 8px 32px ${alpha(config.color || '#1976d2', 0.15)}`
          : '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${alpha(config.color || '#1976d2', 0.1)}, ${alpha(config.color || '#1976d2', 0.02)})`,
          borderBottom: '2px solid',
          borderColor: config.color || 'grey.300',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {config.icon && (
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: alpha(config.color || '#1976d2', 0.15),
                  color: config.color,
                }}
              >
                {React.createElement(config.icon, { sx: { fontSize: 18 } })}
              </Avatar>
            )}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {column.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {columnJobs.length} job{columnJobs.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={0.5}>
            {hotJobs > 0 && (
              <Tooltip title={`${hotJobs} hot job${hotJobs > 1 ? 's' : ''}`}>
                <Chip 
                  icon={<FireIcon sx={{ fontSize: '14px !important' }} />}
                  label={hotJobs} 
                  size="small" 
                  sx={{ 
                    height: 24,
                    bgcolor: alpha('#f44336', 0.1),
                    color: 'error.main',
                    fontWeight: 700,
                    '& .MuiChip-icon': { color: 'error.main' }
                  }} 
                />
              </Tooltip>
            )}
            {overdueJobs > 0 && (
              <Tooltip title={`${overdueJobs} overdue`}>
                <Chip 
                  icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
                  label={overdueJobs} 
                  size="small" 
                  sx={{ 
                    height: 24,
                    bgcolor: alpha('#ff9800', 0.1),
                    color: 'warning.dark',
                    fontWeight: 700,
                    '& .MuiChip-icon': { color: 'warning.dark' }
                  }} 
                />
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Column Body - Scrollable */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha('#000', 0.1),
            borderRadius: 3,
            '&:hover': {
              bgcolor: alpha('#000', 0.2),
            }
          },
        }}
      >
        {sortedJobs.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 120,
              border: '2px dashed',
              borderColor: isDragOver ? config.color || 'primary.main' : alpha('#000', 0.1),
              borderRadius: 2,
              color: 'text.disabled',
              transition: 'all 0.3s',
              bgcolor: isDragOver ? alpha(config.color || '#1976d2', 0.02) : 'transparent',
            }}
          >
            <Typography variant="body2" fontWeight={500}>
              {isDragOver ? 'Drop here' : 'No jobs'}
            </Typography>
            <Typography variant="caption">
              {isDragOver ? 'Release to move job' : 'Drag jobs to this column'}
            </Typography>
          </Box>
        ) : (
          sortedJobs.map((job) => (
            <ModernJobCard
              key={job.id}
              job={job}
              onClick={() => onJobClick?.(job)}
              onStart={onStartJob}
              onPause={onPauseJob}
              onComplete={onCompleteJob}
              onUpdate={onUpdateJob}
              draggable
              showAIHints
            />
          ))
        )}
      </Box>
    </Paper>
  )
}

// Main Modern Kanban Board Component
const ModernKanbanBoard = ({
  jobs = [],
  columns = KANBAN_COLUMNS,
  onJobClick,
  onStartJob,
  onPauseJob,
  onCompleteJob,
  onStatusChange,
  onUpdateJob,
  onRefresh,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAnchor, setFilterAnchor] = useState(null)
  const [activeFilters, setActiveFilters] = useState({
    priority: [],
    processingType: [],
    customer: [],
  })

  const handleDrop = (jobId, newStatus) => {
    if (onStatusChange) {
      onStatusChange(jobId, newStatus)
    }
  }

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter(job => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        job.jobNumber?.toLowerCase().includes(query) ||
        job.customerName?.toLowerCase().includes(query) ||
        job.material?.toLowerCase().includes(query) ||
        job.instructions?.toLowerCase().includes(query) ||
        job.id?.toString().includes(query)
      if (!matchesSearch) return false
    }

    // Priority filter
    if (activeFilters.priority.length > 0) {
      if (!activeFilters.priority.includes(job.priority)) return false
    }

    // Processing type filter
    if (activeFilters.processingType.length > 0) {
      if (!activeFilters.processingType.includes(job.processingType)) return false
    }

    return true
  })

  const activeFilterCount = Object.values(activeFilters).flat().length
  
  // Quick stats
  const totalJobs = filteredJobs.length
  const hotJobs = filteredJobs.filter(j => j.priority === 'HOT').length
  const overdueJobs = filteredJobs.filter(j => j.dueDate && new Date(j.dueDate) < new Date()).length
  const inProgressJobs = filteredJobs.filter(j => j.status === 'IN_PROCESS').length

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Modern Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          p: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid',
          borderColor: alpha('#000', 0.06),
        }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search jobs, customers, materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} fontSize="small" />
              </InputAdornment>
            ),
            sx: { 
              borderRadius: 2,
              bgcolor: 'grey.50',
              '&:hover': { bgcolor: 'grey.100' },
            }
          }}
          sx={{ minWidth: 280 }}
        />

        {/* Filters */}
        <Tooltip title="Filters">
          <IconButton 
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{ 
              bgcolor: activeFilterCount > 0 ? alpha('#1976d2', 0.1) : 'transparent',
              '&:hover': { bgcolor: alpha('#1976d2', 0.15) }
            }}
          >
            <Badge badgeContent={activeFilterCount} color="primary">
              <FilterIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 180 } }}
        >
          <MenuItem disabled>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              PRIORITY
            </Typography>
          </MenuItem>
          {['HOT', 'URGENT', 'NORMAL', 'LOW'].map((priority) => (
            <MenuItem
              key={priority}
              selected={activeFilters.priority.includes(priority)}
              onClick={() => {
                setActiveFilters((prev) => ({
                  ...prev,
                  priority: prev.priority.includes(priority)
                    ? prev.priority.filter((p) => p !== priority)
                    : [...prev.priority, priority],
                }))
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {priority === 'HOT' && <FireIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                {priority === 'URGENT' && <BoltIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                <span>{priority}</span>
              </Stack>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem
            onClick={() => setActiveFilters({ priority: [], processingType: [], customer: [] })}
          >
            <Typography color="error">Clear Filters</Typography>
          </MenuItem>
        </Menu>

        <Box sx={{ flex: 1 }} />

        {/* Quick Stats */}
        <Stack direction="row" spacing={1}>
          <Chip 
            label={`${totalJobs} total`} 
            size="small" 
            sx={{ fontWeight: 600, bgcolor: alpha('#1976d2', 0.1), color: 'primary.main' }}
          />
          {hotJobs > 0 && (
            <Chip 
              icon={<FireIcon sx={{ fontSize: '14px !important' }} />}
              label={`${hotJobs} hot`} 
              size="small" 
              sx={{ fontWeight: 600, bgcolor: alpha('#f44336', 0.1), color: 'error.main' }}
            />
          )}
          {overdueJobs > 0 && (
            <Chip 
              icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
              label={`${overdueJobs} overdue`} 
              size="small" 
              sx={{ fontWeight: 600, bgcolor: alpha('#ff9800', 0.1), color: 'warning.dark' }}
            />
          )}
          <Chip 
            icon={<SpeedIcon sx={{ fontSize: '14px !important' }} />}
            label={`${inProgressJobs} in progress`} 
            size="small" 
            sx={{ fontWeight: 600, bgcolor: alpha('#4caf50', 0.1), color: 'success.main' }}
          />
        </Stack>

        {/* Refresh */}
        {onRefresh && (
          <Tooltip title="Refresh jobs">
            <span>
              <IconButton 
                onClick={onRefresh} 
                disabled={loading}
                sx={{
                  bgcolor: alpha('#1976d2', 0.1),
                  '&:hover': { bgcolor: alpha('#1976d2', 0.15) }
                }}
              >
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Loading Bar */}
      <Collapse in={loading}>
        <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />
      </Collapse>

      {/* Kanban Columns */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: 0,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: alpha('#000', 0.05),
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha('#000', 0.15),
            borderRadius: 4,
            '&:hover': {
              bgcolor: alpha('#000', 0.25),
            }
          },
        }}
      >
        {columns.map((column) => (
          <ModernKanbanColumn
            key={column.id || column.status}
            column={column}
            jobs={filteredJobs}
            onJobClick={onJobClick}
            onStartJob={onStartJob}
            onPauseJob={onPauseJob}
            onCompleteJob={onCompleteJob}
            onUpdateJob={onUpdateJob}
            onDrop={handleDrop}
          />
        ))}
      </Box>

    </Box>
  )
}

export default ModernKanbanBoard
