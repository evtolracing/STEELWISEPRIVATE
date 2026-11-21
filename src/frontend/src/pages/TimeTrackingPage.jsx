/**
 * Time Tracking Report Page
 * Shows all logged work times across operations, operators, and work centers
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  LinearProgress,
  alpha,
  Tab,
  Tabs,
  Avatar,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  Factory as WorkCenterIcon,
  Download as DownloadIcon,
  PauseCircle as PauseIcon,
  PlayCircle as RunningIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  AccessTime as ClockIcon,
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { getTimeEntries, getLongRunningEntries } from '../services/operationsApi'
import { formatDuration, entrySeconds, dayRange, localDay, filterEntries, summarize, choices, csvText } from './timeTrackingRules'

const clockTime = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')

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
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
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
  const [entries, setEntries] = useState([])
  const [limited, setLimited] = useState(null)
  // Clocks left running a long time, for the supervisor to check. A list only: nothing is stopped.
  const [longRunning, setLongRunning] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  // Filters
  const [locationFilter, setLocationFilter] = useState('')
  const [workCenterFilter, setWorkCenterFilter] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState(() => localDay(7)) // Last 7 days
  const [dateTo, setDateTo] = useState(() => localDay(0))

  const [tabValue, setTabValue] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    getLongRunningEntries().then(setLongRunning).catch(() => setLongRunning(null))
    try {
      const range = dayRange(dateFrom, dateTo)
      if (!range.from || !range.to) throw new Error('Pick a From and a To date.')
      if (range.from > range.to) throw new Error('The From date is after the To date.')
      const result = await getTimeEntries(range)
      setEntries(result.data || [])
      setLimited(result.limited ? { shown: (result.data || []).length, total: result.total } : null)
      setNow(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to load time tracking data:', err)
      setError(err.message)
      // Show nothing rather than made-up hours: these figures feed payroll and job costing.
      setEntries([])
      setLimited(null)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    loadData()
  }, [loadData])

  // While a clock is running its time counts up on screen.
  const anyRunning = entries.some((e) => e.running)
  useEffect(() => {
    if (!anyRunning) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [anyRunning])

  const locations = useMemo(() => choices(entries, 'locationId', 'locationName'), [entries])
  const workCenters = useMemo(() => choices(locationFilter ? entries.filter((e) => e.locationId === locationFilter) : entries, 'workCenterId', 'workCenterName'), [entries, locationFilter])
  const operators = useMemo(() => choices(entries, 'operatorId', 'operatorName'), [entries])

  const filteredLogs = useMemo(
    () => filterEntries(entries, { locationId: locationFilter, workCenterId: workCenterFilter, operatorId: operatorFilter, status: statusFilter }),
    [entries, locationFilter, workCenterFilter, operatorFilter, statusFilter],
  )
  const summaries = useMemo(() => summarize(filteredLogs, now), [filteredLogs, now])

  // Export to CSV
  const exportToCSV = () => {
    const blob = new Blob([csvText(filteredLogs, Date.now())], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-tracking-${dateFrom}-to-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const summaryTable = (rows, label, Icon, color) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{label}</TableCell>
            <TableCell align="right">Steps</TableCell>
            <TableCell align="right">Entries</TableCell>
            <TableCell align="right">Total Time</TableCell>
            <TableCell align="right">Avg per Step</TableCell>
            <TableCell>Share of Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                <Typography color="text.secondary">No time logs found</Typography>
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.id || 'none'} hover>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Icon fontSize="small" color="action" />
                  <Typography fontWeight={600}>{row.name}</Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">{row.steps}</TableCell>
              <TableCell align="right">{row.entries}</TableCell>
              <TableCell align="right">{formatDuration(row.seconds)}</TableCell>
              <TableCell align="right">{formatDuration(row.steps > 0 ? Math.round(row.seconds / row.steps) : 0)}</TableCell>
              <TableCell sx={{ width: 200 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress variant="determinate" value={row.share} color={color} sx={{ flex: 1, height: 8, borderRadius: 1 }} aria-label={`${row.name}: ${row.share}% of the time shown`} />
                  <Typography variant="caption">{row.share}%</Typography>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )

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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
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
                <Typography component="h1" variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                  Time Tracking Report
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Time clocked on the shop floor, by job, operator and work center
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
                disabled={filteredLogs.length === 0}
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

        {loading && <LinearProgress sx={{ mb: 2 }} aria-label="Loading time records" />}
        
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Time records could not be loaded, so nothing is shown. {error}
          </Alert>
        )}
        {limited && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing the newest {limited.shown.toLocaleString()} of {limited.total.toLocaleString()} entries in these dates. Pick a shorter range to see them all.
          </Alert>
        )}
        {longRunning && longRunning.data.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {longRunning.data.length === 1 ? '1 clock has' : `${longRunning.data.length} clocks have`} been running for more than {longRunning.hours} hours. Check that the work is still going on:{' '}
            {longRunning.data.slice(0, 5).map((e) => `${e.operator?.name || 'no operator'} on ${e.step?.name || 'a step'} of job ${e.job?.jobNumber || ''} (${e.hoursRunning} h)`).join('; ')}
            {longRunning.data.length > 5 ? `; and ${longRunning.data.length - 5} more` : ''}.
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
                  <InputLabel id="tt-location">Location</InputLabel>
                  <Select
                    labelId="tt-location"
                    value={locationFilter}
                    label="Location"
                    onChange={(e) => { setLocationFilter(e.target.value); setWorkCenterFilter('') }}
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
                  <InputLabel id="tt-work-center">Work Center</InputLabel>
                  <Select
                    labelId="tt-work-center"
                    value={workCenterFilter}
                    label="Work Center"
                    onChange={(e) => setWorkCenterFilter(e.target.value)}
                  >
                    <MenuItem value="">All Work Centers</MenuItem>
                    {workCenters.map(wc => (
                      <MenuItem key={wc.id} value={wc.id}>{wc.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="tt-operator">Operator</InputLabel>
                  <Select
                    labelId="tt-operator"
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
                  <InputLabel id="tt-status">Status</InputLabel>
                  <Select
                    labelId="tt-status"
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
        <Grid container spacing={2} sx={{ mb: 3 }} data-testid="time-summary">
          <Grid item xs={6} sm={4} lg={2}>
            <SummaryCard
              title="Total Time"
              value={formatDuration(summaries.totalSeconds)}
              subtitle={`${summaries.entryCount} ${summaries.entryCount === 1 ? 'entry' : 'entries'}`}
              icon={ClockIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={4} lg={2}>
            <SummaryCard
              title="Steps Finished"
              value={summaries.finishedSteps}
              subtitle={summaries.finishedSteps > 0 ? `Avg: ${formatDuration(summaries.averageFinishedSeconds)}` : `${summaries.stepCount} worked on`}
              icon={CompleteIcon}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={4} lg={2}>
            <SummaryCard
              title="Running Now"
              value={summaries.runningCount}
              subtitle="Clocks running"
              icon={RunningIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={4} lg={2}>
            <SummaryCard
              title="On Hold"
              value={summaries.onHoldCount}
              subtitle="Paused, not finished"
              icon={PauseIcon}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={4} lg={2}>
            <SummaryCard
              title="Stops"
              value={summaries.stopCount}
              subtitle="Pauses with a reason"
              icon={WarningIcon}
              color="error"
            />
          </Grid>
          <Grid item xs={6} sm={4} lg={2}>
            <SummaryCard
              title="Operators"
              value={summaries.operatorCount}
              subtitle="Clocked time here"
              icon={PersonIcon}
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
              <Table size="small" stickyHeader data-testid="time-entries">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Step</TableCell>
                    <TableCell>Work Center</TableCell>
                    <TableCell>Operator</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Stop Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary">
                          {loading ? 'Loading time records' : entries.length > 0 ? 'No time logs match these filters' : 'No time logs found in these dates'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredLogs.map((log) => {
                    const statusConfig = STATUS_CONFIG[log.running ? 'RUNNING' : log.status] || STATUS_CONFIG.COMPLETE
                    const StatusIcon = statusConfig.icon
                    return (
                      <TableRow key={log.id} hover data-testid="time-entry">
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(log.startAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {clockTime(log.startAt)}{log.endAt ? ` to ${clockTime(log.endAt)}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.jobId ? (
                            <Typography component={RouterLink} to={`/jobs/${log.jobId}`} variant="body2" fontWeight={600} sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                              {log.jobNumber || 'Job'}
                            </Typography>
                          ) : (
                            <Typography variant="body2" fontWeight={600}>{log.jobNumber || 'No job'}</Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            {[log.orderNumber, log.customerName].filter(Boolean).join(' · ')}
                          </Typography>
                        </TableCell>
                        <TableCell>{log.operationName || ''}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.workCenterName || 'Not recorded'}</Typography>
                          <Typography variant="caption" color="text.secondary">{log.locationName || ''}</Typography>
                        </TableCell>
                        <TableCell>{log.operatorName || 'Not recorded'}</TableCell>
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
                          <Typography fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                            {formatDuration(entrySeconds(log, now))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.stopReason && (
                            <Chip
                              size="small"
                              variant="outlined"
                              color="warning"
                              label={log.stopReason}
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

          {tabValue === 1 && summaryTable(summaries.byOperator, 'Operator', PersonIcon, 'primary')}
          {tabValue === 2 && summaryTable(summaries.byWorkCenter, 'Work Center', WorkCenterIcon, 'secondary')}
        </Card>
      </Container>
    </Box>
  )
}

export default TimeTrackingPage
