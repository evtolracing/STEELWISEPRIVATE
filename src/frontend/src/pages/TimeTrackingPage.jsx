/**
 * Time Tracking Report Page
 * Shows all logged work times across operations, operators, and work centers
 */

import React, { useState, useEffect, useMemo } from 'react'
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
  Chip,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  LinearProgress,
  alpha,
  Divider,
  Tab,
  Tabs,
  Avatar,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  Factory as WorkCenterIcon,
  Assignment as JobIcon,
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
  PauseCircle as PauseIcon,
  PlayCircle as RunningIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  AccessTime as ClockIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { getOperations, getOperationTimeLogs } from '../services/operationsApi'
import { getWorkCenters, getOperators, getLocations } from '../services/dispatchApi'

// Format seconds to display
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// Format date for display
function formatDate(isoDate) {
  if (!isoDate) return '—'
  return new Date(isoDate).toLocaleString()
}

// Format date for input
function formatDateForInput(date) {
  return date.toISOString().split('T')[0]
}

// Status colors
const STATUS_CONFIG = {
  RUNNING: { color: 'success', icon: RunningIcon, label: 'Running' },
  PAUSED: { color: 'warning', icon: PauseIcon, label: 'Paused' },
  COMPLETE: { color: 'info', icon: CompleteIcon, label: 'Complete' },
}

// Summary card component
function SummaryCard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: '#1976d2',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
  }
  const bgColor = colorMap[color] || colorMap.primary
  
  return (
    <Card sx={{ 
      height: '100%',
      borderRadius: 3,
      background: `linear-gradient(135deg, ${alpha(bgColor, 0.05)} 0%, ${alpha(bgColor, 0.02)} 100%)`,
      border: `1px solid ${alpha(bgColor, 0.15)}`,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 25px ${alpha(bgColor, 0.2)}`,
        borderColor: alpha(bgColor, 0.3),
      }
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: `linear-gradient(135deg, ${bgColor} 0%, ${alpha(bgColor, 0.7)} 100%)`,
              boxShadow: `0 4px 14px ${alpha(bgColor, 0.4)}`,
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

function TimeTrackingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeLogs, setTimeLogs] = useState([])
  const [operations, setOperations] = useState([])
  const [workCenters, setWorkCentersState] = useState([])
  const [operators, setOperatorsState] = useState([])
  const [locations, setLocationsState] = useState([])
  
  // Filters
  const [locationFilter, setLocationFilter] = useState('')
  const [workCenterFilter, setWorkCenterFilter] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7) // Last 7 days
    return formatDateForInput(d)
  })
  const [dateTo, setDateTo] = useState(() => formatDateForInput(new Date()))
  
  const [tabValue, setTabValue] = useState(0)

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const [locsData, wcsData, opsData, operationsData] = await Promise.all([
        getLocations(),
        getWorkCenters(),
        getOperators(),
        getOperations(),
      ])
      
      setLocationsState(locsData || [])
      setWorkCentersState(wcsData || [])
      setOperatorsState(opsData || [])
      setOperations(operationsData || [])
      
      // Extract time logs from operations
      const allLogs = []
      for (const op of (operationsData || [])) {
        if (op.timeLogs && Array.isArray(op.timeLogs)) {
          op.timeLogs.forEach(log => {
            allLogs.push({
              ...log,
              operationName: op.name,
              jobId: op.jobId,
              materialCode: op.materialCode,
            })
          })
        }
      }
      setTimeLogs(allLogs)
      setError(null)
    } catch (err) {
      console.error('Failed to load time tracking data:', err)
      setError(err.message)
      
      // Generate mock data for demo
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  // Generate mock data for demo/development
  const generateMockData = () => {
    const mockWorkCenters = [
      { id: 'SAW-01', name: 'Saw Station 1', locationId: 'FWA' },
      { id: 'SAW-02', name: 'Saw Station 2', locationId: 'FWA' },
      { id: 'SHEAR-01', name: 'Shear Station 1', locationId: 'FWA' },
      { id: 'WATERJET-01', name: 'Waterjet 1', locationId: 'FWA' },
    ]
    const mockOperators = [
      { id: 'OP-001', name: 'Mike Chen' },
      { id: 'OP-002', name: 'Sarah Johnson' },
      { id: 'OP-003', name: 'Carlos Rodriguez' },
    ]
    const mockLocations = [
      { id: 'FWA', name: 'Fort Wayne' },
      { id: 'CHI', name: 'Chicago' },
    ]
    
    const statuses = ['RUNNING', 'PAUSED', 'COMPLETE']
    const jobs = ['JOB-2024-0142', 'JOB-2024-0143', 'JOB-2024-0144', 'JOB-2024-0145']
    const operations = ['Cut to Length', 'Deburr', 'Pack Out', 'Shear']
    const materials = ['AL-6061-T6', 'SS-304', 'CS-A36', 'AL-7075']
    
    const mockLogs = []
    for (let i = 0; i < 25; i++) {
      const startAt = new Date()
      startAt.setHours(startAt.getHours() - Math.random() * 168) // Random within last week
      const durationSec = Math.floor(Math.random() * 7200) + 300 // 5 min to 2 hours
      const endAt = new Date(startAt.getTime() + durationSec * 1000)
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      mockLogs.push({
        id: `TL-${1000 + i}`,
        jobOperationId: `OP-${100 + i}`,
        jobId: jobs[Math.floor(Math.random() * jobs.length)],
        operatorId: mockOperators[Math.floor(Math.random() * mockOperators.length)].id,
        workCenterId: mockWorkCenters[Math.floor(Math.random() * mockWorkCenters.length)].id,
        status: status,
        startAt: startAt.toISOString(),
        endAt: status === 'RUNNING' ? null : endAt.toISOString(),
        durationSeconds: status === 'RUNNING' ? null : durationSec,
        downtimeReason: status === 'PAUSED' ? ['Machine maintenance', 'Material shortage', 'Break'][Math.floor(Math.random() * 3)] : null,
        operationName: operations[Math.floor(Math.random() * operations.length)],
        materialCode: materials[Math.floor(Math.random() * materials.length)],
      })
    }
    
    setLocationsState(mockLocations)
    setWorkCentersState(mockWorkCenters)
    setOperatorsState(mockOperators)
    setTimeLogs(mockLogs.sort((a, b) => new Date(b.startAt) - new Date(a.startAt)))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter logs
  const filteredLogs = useMemo(() => {
    return timeLogs.filter(log => {
      if (locationFilter) {
        const wc = workCenters.find(w => w.id === log.workCenterId)
        if (!wc || wc.locationId !== locationFilter) return false
      }
      if (workCenterFilter && log.workCenterId !== workCenterFilter) return false
      if (operatorFilter && log.operatorId !== operatorFilter) return false
      if (statusFilter && log.status !== statusFilter) return false
      if (dateFrom) {
        const logDate = new Date(log.startAt)
        const fromDate = new Date(dateFrom)
        if (logDate < fromDate) return false
      }
      if (dateTo) {
        const logDate = new Date(log.startAt)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (logDate > toDate) return false
      }
      return true
    })
  }, [timeLogs, locationFilter, workCenterFilter, operatorFilter, statusFilter, dateFrom, dateTo, workCenters])

  // Calculate summaries
  const summaries = useMemo(() => {
    const totalTime = filteredLogs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0)
    const completedOps = filteredLogs.filter(l => l.status === 'COMPLETE').length
    const runningOps = filteredLogs.filter(l => l.status === 'RUNNING').length
    const pausedOps = filteredLogs.filter(l => l.status === 'PAUSED').length
    const downtimeLogs = filteredLogs.filter(l => l.downtimeReason)
    const downtimeTime = downtimeLogs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0)
    
    // Group by operator
    const byOperator = {}
    filteredLogs.forEach(log => {
      if (!byOperator[log.operatorId]) {
        byOperator[log.operatorId] = { time: 0, count: 0 }
      }
      byOperator[log.operatorId].time += log.durationSeconds || 0
      byOperator[log.operatorId].count++
    })
    
    // Group by work center
    const byWorkCenter = {}
    filteredLogs.forEach(log => {
      if (!byWorkCenter[log.workCenterId]) {
        byWorkCenter[log.workCenterId] = { time: 0, count: 0 }
      }
      byWorkCenter[log.workCenterId].time += log.durationSeconds || 0
      byWorkCenter[log.workCenterId].count++
    })
    
    return {
      totalTime,
      completedOps,
      runningOps,
      pausedOps,
      downtimeTime,
      downtimeCount: downtimeLogs.length,
      byOperator,
      byWorkCenter,
      avgOpTime: completedOps > 0 ? Math.round(totalTime / completedOps) : 0,
    }
  }, [filteredLogs])

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Job', 'Operation', 'Work Center', 'Operator', 'Status', 'Start', 'End', 'Duration', 'Downtime Reason']
    const rows = filteredLogs.map(log => [
      new Date(log.startAt).toLocaleDateString(),
      log.jobId,
      log.operationName,
      log.workCenterId,
      operators.find(o => o.id === log.operatorId)?.name || log.operatorId,
      log.status,
      formatDate(log.startAt),
      formatDate(log.endAt),
      formatDuration(log.durationSeconds),
      log.downtimeReason || '',
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-tracking-${dateFrom}-to-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getOperatorName = (id) => operators.find(o => o.id === id)?.name || id
  const getWorkCenterName = (id) => workCenters.find(w => w.id === id)?.name || id

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)',
      mx: -3,
      mt: -3,
      pb: 3,
    }}>
      {/* Modern Header */}
      <Box sx={{ 
        px: 3, 
        py: 3, 
        mb: 3,
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
      }}>
        <Container maxWidth="xl" disableGutters>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                width: 56, 
                height: 56, 
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
              }}>
                <TimerIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                  Time Tracking Report
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>
                    Track operator time, work center utilization, and job durations
                  </Typography>
                </Stack>
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl">

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Using demo data. Backend: {error}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ 
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
          border: '1px solid',
          borderColor: 'divider',
        }}>
          <CardContent sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={locationFilter}
                    label="Location"
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    <MenuItem value="">All Locations</MenuItem>
                    {locations.map(loc => (
                      <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Work Center</InputLabel>
                  <Select
                    value={workCenterFilter}
                    label="Work Center"
                    onChange={(e) => setWorkCenterFilter(e.target.value)}
                  >
                    <MenuItem value="">All Work Centers</MenuItem>
                    {workCenters.map(wc => (
                      <MenuItem key={wc.id} value={wc.id}>{wc.name || wc.id}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={operatorFilter}
                    label="Operator"
                    onChange={(e) => setOperatorFilter(e.target.value)}
                  >
                    <MenuItem value="">All Operators</MenuItem>
                    {operators.map(op => (
                      <MenuItem key={op.id} value={op.id}>{op.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="RUNNING">Running</MenuItem>
                    <MenuItem value="PAUSED">Paused</MenuItem>
                    <MenuItem value="COMPLETE">Complete</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="From"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="To"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              title="Total Time"
              value={formatDuration(summaries.totalTime)}
              subtitle={`${filteredLogs.length} entries`}
              icon={ClockIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              title="Completed"
              value={summaries.completedOps}
              subtitle={`Avg: ${formatDuration(summaries.avgOpTime)}`}
              icon={CompleteIcon}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              title="In Progress"
              value={summaries.runningOps}
              subtitle="Currently running"
              icon={RunningIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              title="Paused"
              value={summaries.pausedOps}
              subtitle="On hold"
              icon={PauseIcon}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              title="Downtime"
              value={formatDuration(summaries.downtimeTime)}
              subtitle={`${summaries.downtimeCount} incidents`}
              icon={WarningIcon}
              color="error"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              title="Utilization"
              value={summaries.totalTime > 0 
                ? `${Math.round((summaries.totalTime - summaries.downtimeTime) / summaries.totalTime * 100)}%`
                : '—'
              }
              subtitle="Active time"
              icon={TrendingIcon}
              color="success"
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Time Log Details" />
            <Tab label="By Operator" />
            <Tab label="By Work Center" />
          </Tabs>

          {/* Time Log Details Tab */}
          {tabValue === 0 && (
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Operation</TableCell>
                    <TableCell>Work Center</TableCell>
                    <TableCell>Operator</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary">No time logs found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredLogs.map((log) => {
                    const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.COMPLETE
                    const StatusIcon = statusConfig.icon
                    return (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(log.startAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(log.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {log.jobId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.materialCode}
                          </Typography>
                        </TableCell>
                        <TableCell>{log.operationName}</TableCell>
                        <TableCell>{getWorkCenterName(log.workCenterId)}</TableCell>
                        <TableCell>{getOperatorName(log.operatorId)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={<StatusIcon sx={{ fontSize: 14 }} />}
                            label={statusConfig.label}
                            color={statusConfig.color}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {log.status === 'RUNNING' ? 'Active' : formatDuration(log.durationSeconds)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.downtimeReason && (
                            <Chip
                              size="small"
                              variant="outlined"
                              color="warning"
                              label={log.downtimeReason}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* By Operator Tab */}
          {tabValue === 1 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Operator</TableCell>
                    <TableCell align="right">Operations</TableCell>
                    <TableCell align="right">Total Time</TableCell>
                    <TableCell align="right">Avg per Operation</TableCell>
                    <TableCell>Utilization</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(summaries.byOperator).map(([opId, data]) => (
                    <TableRow key={opId} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PersonIcon fontSize="small" color="action" />
                          <Typography fontWeight={600}>{getOperatorName(opId)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{data.count}</TableCell>
                      <TableCell align="right">{formatDuration(data.time)}</TableCell>
                      <TableCell align="right">{formatDuration(Math.round(data.time / data.count))}</TableCell>
                      <TableCell sx={{ width: 200 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((data.time / summaries.totalTime) * 100, 100)}
                            sx={{ flex: 1, height: 8, borderRadius: 1 }}
                          />
                          <Typography variant="caption">
                            {Math.round((data.time / summaries.totalTime) * 100)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* By Work Center Tab */}
          {tabValue === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Work Center</TableCell>
                    <TableCell align="right">Operations</TableCell>
                    <TableCell align="right">Total Time</TableCell>
                    <TableCell align="right">Avg per Operation</TableCell>
                    <TableCell>Utilization</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(summaries.byWorkCenter).map(([wcId, data]) => (
                    <TableRow key={wcId} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <WorkCenterIcon fontSize="small" color="action" />
                          <Typography fontWeight={600}>{getWorkCenterName(wcId)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{data.count}</TableCell>
                      <TableCell align="right">{formatDuration(data.time)}</TableCell>
                      <TableCell align="right">{formatDuration(Math.round(data.time / data.count))}</TableCell>
                      <TableCell sx={{ width: 200 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((data.time / summaries.totalTime) * 100, 100)}
                            sx={{ flex: 1, height: 8, borderRadius: 1 }}
                            color="secondary"
                          />
                          <Typography variant="caption">
                            {Math.round((data.time / summaries.totalTime) * 100)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Container>
    </Box>
  )
}

export default TimeTrackingPage
