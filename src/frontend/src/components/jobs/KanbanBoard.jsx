import React, { useState } from 'react'
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
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  ViewColumn as ColumnIcon,
} from '@mui/icons-material'
import { KANBAN_COLUMNS, JOB_STATUS_CONFIG } from '../../constants/jobStatuses'
import JobCard from './JobCard'

const KanbanColumn = ({
  column,
  jobs,
  onJobClick,
  onStartJob,
  onPauseJob,
  onCompleteJob,
  onDrop,
}) => {
  const config = JOB_STATUS_CONFIG[column.status] || {}
  const columnJobs = jobs.filter(job => job.status === column.status)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.style.backgroundColor = 'rgba(30, 58, 95, 0.05)'
  }

  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.style.backgroundColor = 'transparent'
    const jobId = e.dataTransfer.getData('jobId')
    if (jobId && onDrop) {
      onDrop(jobId, column.status)
    }
  }

  return (
    <Paper
      elevation={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        minWidth: 280,
        maxWidth: 320,
        flex: '1 1 280px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'grey.50',
        borderRadius: 2,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          p: 1.5,
          backgroundColor: config.bgColor || 'grey.200',
          borderBottom: '3px solid',
          borderColor: config.color || 'grey.400',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {config.icon && (
              <Box component="span" sx={{ color: config.color, display: 'flex' }}>
                {React.createElement(config.icon, { fontSize: 'small' })}
              </Box>
            )}
            <Typography variant="subtitle2" fontWeight={600}>
              {column.title}
            </Typography>
          </Box>
          <Badge badgeContent={columnJobs.length} color="primary" max={99}>
            <Box sx={{ width: 8 }} />
          </Badge>
        </Box>
      </Box>

      {/* Column Body - Scrollable */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {columnJobs.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 100,
              border: '2px dashed',
              borderColor: 'grey.300',
              borderRadius: 1,
              color: 'text.disabled',
            }}
          >
            <Typography variant="body2">No jobs</Typography>
          </Box>
        ) : (
          columnJobs.map((job) => (
            <Box
              key={job.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('jobId', job.id)
              }}
            >
              <JobCard
                job={job}
                onClick={() => onJobClick?.(job)}
                onStart={onStartJob}
                onPause={onPauseJob}
                onComplete={onCompleteJob}
                draggable
              />
            </Box>
          ))
        )}
      </Box>
    </Paper>
  )
}

const KanbanBoard = ({
  jobs = [],
  columns = KANBAN_COLUMNS,
  onJobClick,
  onStartJob,
  onPauseJob,
  onCompleteJob,
  onStatusChange,
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
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />

        {/* Filters */}
        <Tooltip title="Filters">
          <IconButton onClick={(e) => setFilterAnchor(e.currentTarget)}>
            <Badge badgeContent={activeFilterCount} color="primary">
              <FilterIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          <MenuItem disabled>
            <Typography variant="caption" fontWeight={600}>
              Priority
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
              {priority}
            </MenuItem>
          ))}
          <Divider />
          <MenuItem
            onClick={() => setActiveFilters({ priority: [], processingType: [], customer: [] })}
          >
            Clear Filters
          </MenuItem>
        </Menu>

        <Box sx={{ flex: 1 }} />

        {/* Job Count */}
        <Chip label={`${filteredJobs.length} jobs`} size="small" variant="outlined" />

        {/* Refresh */}
        {onRefresh && (
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={onRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Kanban Columns */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: 0,
        }}
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            column={column}
            jobs={filteredJobs}
            onJobClick={onJobClick}
            onStartJob={onStartJob}
            onPauseJob={onPauseJob}
            onCompleteJob={onCompleteJob}
            onDrop={handleDrop}
          />
        ))}
      </Box>
    </Box>
  )
}

export default KanbanBoard
