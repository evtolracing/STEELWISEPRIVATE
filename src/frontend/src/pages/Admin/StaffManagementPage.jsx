import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip, IconButton,
  Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, Alert,
  Tabs, Tab, Grid, Tooltip, Avatar, Divider, Autocomplete, Switch,
  FormControlLabel, InputAdornment, CircularProgress, Card, CardContent,
  Stack,
} from '@mui/material'
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Search as SearchIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Engineering as EngineeringIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  School as CertIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  VerifiedUser as VerifiedIcon,
  EventNote as ShiftIcon,
} from '@mui/icons-material'
import {
  getOperators, createOperator, updateOperator, deleteOperator,
  addOperatorSkill, removeOperatorSkill, updateOperatorSkill,
  getShifts, createShift, updateShift, cancelShift,
  getStaffStats,
} from '../../api/staff'
import { getWorkCenters } from '../../api/workCenters'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function fetchWorkCenterTypes() {
  const res = await fetch(`${API_BASE}/v1/dispatch/work-center-types?activeOnly=true`)
  const json = await res.json()
  return json.data || []
}

async function fetchLocations() {
  const res = await fetch(`${API_BASE}/work-centers`)
  const json = await res.json()
  // Extract unique locations from work centers
  const locs = new Map()
  if (json.data) {
    json.data.forEach((wc) => {
      if (wc.location) {
        locs.set(wc.location.id, wc.location)
      }
    })
  }
  return Array.from(locs.values())
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SKILL_LEVELS = ['NOVICE', 'STANDARD', 'ADVANCED', 'EXPERT']
const OPERATOR_STATUSES = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'TRAINING']
const SHIFT_TYPES = ['DAY', 'NIGHT', 'SWING', 'SPLIT', 'OVERTIME']

const STATUS_COLORS = {
  ACTIVE: 'success',
  ON_LEAVE: 'warning',
  SUSPENDED: 'error',
  TERMINATED: 'default',
  TRAINING: 'info',
}

const SKILL_COLORS = {
  NOVICE: '#9e9e9e',
  STANDARD: '#2196f3',
  ADVANCED: '#ff9800',
  EXPERT: '#4caf50',
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function StaffManagementPage() {
  const [tab, setTab] = useState(0)
  const [operators, setOperators] = useState([])
  const [shifts, setShifts] = useState([])
  const [stats, setStats] = useState(null)
  const [wcTypes, setWcTypes] = useState([])
  const [locations, setLocations] = useState([])
  const [workCenters, setWorkCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [locationFilter, setLocationFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // Dialogs
  const [operatorDialog, setOperatorDialog] = useState(false)
  const [editingOperator, setEditingOperator] = useState(null)
  const [skillDialog, setSkillDialog] = useState(false)
  const [skillOperator, setSkillOperator] = useState(null)
  const [shiftDialog, setShiftDialog] = useState(false)
  const [editingShift, setEditingShift] = useState(null)
  const [detailDialog, setDetailDialog] = useState(false)
  const [detailOperator, setDetailOperator] = useState(null)

  // Context menu
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuOperator, setMenuOperator] = useState(null)

  // Load reference data
  const loadRefData = useCallback(async () => {
    try {
      const [types, locs, wcs] = await Promise.all([
        fetchWorkCenterTypes(),
        fetchLocations(),
        getWorkCenters().then((r) => r.data || r).catch(() => []),
      ])
      setWcTypes(types)
      setLocations(locs)
      setWorkCenters(Array.isArray(wcs) ? wcs : [])
    } catch (err) {
      console.error('Failed to load ref data:', err)
    }
  }, [])

  // Load operators
  const loadOperators = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter
      if (locationFilter) params.locationId = locationFilter
      params.includeInactive = statusFilter === 'TERMINATED' || statusFilter === 'ALL' ? 'true' : 'false'

      const result = await getOperators(params)
      setOperators(result.data || [])
    } catch (err) {
      console.error('Failed to load operators:', err)
      setError('Failed to load operators')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, locationFilter])

  // Load shifts
  const loadShifts = useCallback(async () => {
    try {
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const weekAhead = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
      const result = await getShifts({
        dateFrom: weekAgo.toISOString(),
        dateTo: weekAhead.toISOString(),
      })
      setShifts(result.data || [])
    } catch (err) {
      console.error('Failed to load shifts:', err)
    }
  }, [])

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const result = await getStaffStats()
      setStats(result.data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }, [])

  useEffect(() => {
    loadRefData()
  }, [loadRefData])

  useEffect(() => {
    loadOperators()
    loadStats()
  }, [loadOperators, loadStats])

  useEffect(() => {
    if (tab === 1) loadShifts()
  }, [tab, loadShifts])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOpenCreate = () => {
    setEditingOperator(null)
    setOperatorDialog(true)
  }

  const handleOpenEdit = (op) => {
    setEditingOperator(op)
    setOperatorDialog(true)
    setMenuAnchor(null)
  }

  const handleOpenDetail = (op) => {
    setDetailOperator(op)
    setDetailDialog(true)
  }

  const handleOpenSkills = (op) => {
    setSkillOperator(op)
    setSkillDialog(true)
    setMenuAnchor(null)
  }

  const handleDelete = async (op) => {
    setMenuAnchor(null)
    if (!window.confirm(`Deactivate operator ${op.firstName} ${op.lastName}?`)) return
    try {
      await deleteOperator(op.id)
      loadOperators()
      loadStats()
    } catch (err) {
      setError('Failed to deactivate operator')
    }
  }

  const handleSaveOperator = async (data) => {
    try {
      if (editingOperator) {
        await updateOperator(editingOperator.id, data)
      } else {
        await createOperator(data)
      }
      setOperatorDialog(false)
      loadOperators()
      loadStats()
    } catch (err) {
      throw err // Let dialog handle it
    }
  }

  const handleSaveSkill = async (operatorId, skillData) => {
    try {
      await addOperatorSkill(operatorId, skillData)
      loadOperators()
    } catch (err) {
      throw err
    }
  }

  const handleRemoveSkill = async (operatorId, skillId) => {
    try {
      await removeOperatorSkill(operatorId, skillId)
      loadOperators()
    } catch (err) {
      setError('Failed to remove skill')
    }
  }

  const handleSaveShift = async (data) => {
    try {
      if (editingShift) {
        await updateShift(editingShift.id, data)
      } else {
        await createShift(data)
      }
      setShiftDialog(false)
      loadShifts()
      loadStats()
    } catch (err) {
      throw err
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Staff & Operators
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage operators, certifications, skills & shift schedules
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { loadOperators(); loadStats(); loadShifts() }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Add Operator
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Operators', value: stats.totalOperators, icon: <PeopleIcon />, color: '#1976d2' },
            { label: 'Active', value: stats.activeOperators, icon: <ActiveIcon />, color: '#4caf50' },
            { label: 'On Leave', value: stats.onLeave, icon: <ScheduleIcon />, color: '#ff9800' },
            { label: 'Active Certifications', value: stats.totalSkills, icon: <VerifiedIcon />, color: '#9c27b0' },
            { label: 'Today\'s Shifts', value: stats.todayShifts, icon: <ShiftIcon />, color: '#00bcd4' },
          ].map((stat) => (
            <Grid item xs={12} sm={6} md key={stat.label}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Avatar sx={{ bgcolor: stat.color + '18', color: stat.color, width: 44, height: 44 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab icon={<EngineeringIcon />} iconPosition="start" label="Operators" />
          <Tab icon={<ShiftIcon />} iconPosition="start" label="Shifts" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tab === 0 && (
        <OperatorsTab
          operators={operators}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          locationFilter={locationFilter}
          onLocationFilterChange={setLocationFilter}
          locations={locations}
          wcTypes={wcTypes}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
          onEdit={handleOpenEdit}
          onDetail={handleOpenDetail}
          onSkills={handleOpenSkills}
          onDelete={handleDelete}
          menuAnchor={menuAnchor}
          menuOperator={menuOperator}
          setMenuAnchor={setMenuAnchor}
          setMenuOperator={setMenuOperator}
        />
      )}

      {tab === 1 && (
        <ShiftsTab
          shifts={shifts}
          operators={operators}
          onAddShift={() => { setEditingShift(null); setShiftDialog(true) }}
          onEditShift={(s) => { setEditingShift(s); setShiftDialog(true) }}
          onCancelShift={async (s) => {
            if (!window.confirm('Cancel this shift?')) return
            await cancelShift(s.id)
            loadShifts()
          }}
        />
      )}

      {/* Dialogs */}
      <OperatorDialog
        open={operatorDialog}
        onClose={() => setOperatorDialog(false)}
        onSave={handleSaveOperator}
        operator={editingOperator}
        locations={locations}
        workCenters={workCenters}
        wcTypes={wcTypes}
      />

      <SkillDialog
        open={skillDialog}
        onClose={() => { setSkillDialog(false); setSkillOperator(null) }}
        operator={skillOperator}
        wcTypes={wcTypes}
        onSave={handleSaveSkill}
        onRemove={handleRemoveSkill}
      />

      <ShiftDialog
        open={shiftDialog}
        onClose={() => setShiftDialog(false)}
        onSave={handleSaveShift}
        shift={editingShift}
        operators={operators}
        locations={locations}
        workCenters={workCenters}
      />

      <OperatorDetailDialog
        open={detailDialog}
        onClose={() => { setDetailDialog(false); setDetailOperator(null) }}
        operator={detailOperator}
        wcTypes={wcTypes}
      />
    </Box>
  )
}

// ============================================================================
// OPERATORS TAB
// ============================================================================

function OperatorsTab({
  operators, loading, searchTerm, onSearchChange,
  statusFilter, onStatusFilterChange, locationFilter, onLocationFilterChange,
  locations, wcTypes, page, rowsPerPage, onPageChange, onRowsPerPageChange,
  onEdit, onDetail, onSkills, onDelete,
  menuAnchor, menuOperator, setMenuAnchor, setMenuOperator,
}) {
  const paginated = operators.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search operators..."
          value={searchTerm} onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} label="Status">
            <MenuItem value="ALL">All</MenuItem>
            {OPERATOR_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Location</InputLabel>
          <Select value={locationFilter} onChange={(e) => onLocationFilterChange(e.target.value)} label="Location">
            <MenuItem value="">All Locations</MenuItem>
            {locations.map((loc) => <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {operators.length} operator{operators.length !== 1 ? 's' : ''}
        </Typography>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Home Work Center</TableCell>
                  <TableCell>Certifications</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No operators found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((op) => (
                    <TableRow
                      key={op.id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => onDetail(op)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                            {op.firstName?.[0]}{op.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {op.firstName} {op.lastName}
                            </Typography>
                            {op.email && (
                              <Typography variant="caption" color="text.secondary">{op.email}</Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={op.employeeCode} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={op.status}
                          size="small"
                          color={STATUS_COLORS[op.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {op.homeLocation?.name || '—'}
                      </TableCell>
                      <TableCell>
                        {op.homeWorkCenter?.name || '—'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(op.skills || []).slice(0, 4).map((s) => {
                            const typeLabel = wcTypes.find((t) => t.id === s.workCenterTypeId)?.label || s.workCenterTypeId
                            return (
                              <Tooltip key={s.id} title={`${typeLabel} — ${s.skillLevel}`}>
                                <Chip
                                  size="small"
                                  label={s.workCenterTypeId}
                                  sx={{
                                    bgcolor: SKILL_COLORS[s.skillLevel] + '20',
                                    color: SKILL_COLORS[s.skillLevel],
                                    fontWeight: 600,
                                    fontSize: 11,
                                  }}
                                />
                              </Tooltip>
                            )
                          })}
                          {(op.skills || []).length > 4 && (
                            <Chip size="small" label={`+${op.skills.length - 4}`} variant="outlined" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{op.phone || '—'}</Typography>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuOperator(op) }}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={operators.length}
              page={page}
              onPageChange={onPageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={onRowsPerPageChange}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </TableContainer>

      {/* Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => menuOperator && onEdit(menuOperator)}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Operator</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuOperator && onSkills(menuOperator)}>
          <ListItemIcon><CertIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Manage Skills</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => menuOperator && onDelete(menuOperator)} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Deactivate</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

// ============================================================================
// SHIFTS TAB
// ============================================================================

function ShiftsTab({ shifts, operators, onAddShift, onEditShift, onCancelShift }) {
  const SHIFT_STATUS_COLORS = {
    SCHEDULED: 'info',
    ACTIVE: 'success',
    COMPLETED: 'default',
    CANCELLED: 'error',
    NO_SHOW: 'warning',
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddShift}>
          Schedule Shift
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Date</TableCell>
              <TableCell>Operator</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Break</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No shifts found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              shifts.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{new Date(s.shiftDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {s.operator ? `${s.operator.firstName} ${s.operator.lastName}` : s.operatorId}
                  </TableCell>
                  <TableCell><Chip label={s.shiftType} size="small" variant="outlined" /></TableCell>
                  <TableCell>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell>{new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell>{s.breakMinutes}m</TableCell>
                  <TableCell>
                    <Chip label={s.status} size="small" color={SHIFT_STATUS_COLORS[s.status] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{s.notes || '—'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    {s.status !== 'CANCELLED' && s.status !== 'COMPLETED' && (
                      <>
                        <IconButton size="small" onClick={() => onEditShift(s)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => onCancelShift(s)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

// ============================================================================
// OPERATOR DIALOG (Create / Edit)
// ============================================================================

function OperatorDialog({ open, onClose, onSave, operator, locations, workCenters, wcTypes }) {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [skillsToCreate, setSkillsToCreate] = useState([])

  useEffect(() => {
    if (open) {
      if (operator) {
        setForm({
          firstName: operator.firstName || '',
          lastName: operator.lastName || '',
          email: operator.email || '',
          phone: operator.phone || '',
          homeLocationId: operator.homeLocationId || '',
          homeWorkCenterId: operator.homeWorkCenterId || '',
          hireDate: operator.hireDate ? operator.hireDate.split('T')[0] : '',
          status: operator.status || 'ACTIVE',
          maxThicknessInches: operator.maxThicknessInches || '',
          hourlyRate: operator.hourlyRate || '',
          notes: operator.notes || '',
          emergencyContactName: operator.emergencyContactName || '',
          emergencyContactPhone: operator.emergencyContactPhone || '',
        })
        setSkillsToCreate([])
      } else {
        setForm({
          firstName: '', lastName: '', email: '', phone: '',
          homeLocationId: '', homeWorkCenterId: '', hireDate: '',
          status: 'ACTIVE', maxThicknessInches: '', hourlyRate: '',
          notes: '', emergencyContactName: '', emergencyContactPhone: '',
        })
        setSkillsToCreate([])
      }
      setError(null)
    }
  }, [open, operator])

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const addSkillRow = () => {
    setSkillsToCreate((prev) => [...prev, { workCenterTypeId: '', skillLevel: 'STANDARD' }])
  }

  const updateSkillRow = (idx, field, value) => {
    setSkillsToCreate((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const removeSkillRow = (idx) => {
    setSkillsToCreate((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName) {
      setError('First name and last name are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const data = { ...form }
      if (!operator && skillsToCreate.length > 0) {
        data.skills = skillsToCreate.filter((s) => s.workCenterTypeId)
      }
      // Convert empty strings to null for optional fields
      if (!data.homeLocationId) data.homeLocationId = null
      if (!data.homeWorkCenterId) data.homeWorkCenterId = null
      if (!data.maxThicknessInches) data.maxThicknessInches = null
      else data.maxThicknessInches = parseFloat(data.maxThicknessInches)
      if (!data.hourlyRate) data.hourlyRate = null
      else data.hourlyRate = parseFloat(data.hourlyRate)

      await onSave(data)
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const filteredWC = workCenters.filter((wc) =>
    !form.homeLocationId || wc.locationId === form.homeLocationId
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {operator ? `Edit Operator — ${operator.employeeCode}` : 'Add New Operator'}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Personal Info</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="First Name" size="small"
              value={form.firstName || ''} onChange={handleChange('firstName')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Last Name" size="small"
              value={form.lastName || ''} onChange={handleChange('lastName')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email" size="small" type="email"
              value={form.email || ''} onChange={handleChange('email')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Phone" size="small"
              value={form.phone || ''} onChange={handleChange('phone')} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Assignment</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Home Location</InputLabel>
              <Select value={form.homeLocationId || ''} onChange={handleChange('homeLocationId')} label="Home Location">
                <MenuItem value="">— None —</MenuItem>
                {locations.map((loc) => <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Home Work Center</InputLabel>
              <Select value={form.homeWorkCenterId || ''} onChange={handleChange('homeWorkCenterId')} label="Home Work Center">
                <MenuItem value="">— None —</MenuItem>
                {filteredWC.map((wc) => <MenuItem key={wc.id} value={wc.id}>{wc.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={form.status || 'ACTIVE'} onChange={handleChange('status')} label="Status">
                {OPERATOR_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Hire Date" size="small" type="date"
              value={form.hireDate || ''} onChange={handleChange('hireDate')}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Max Thickness (in)" size="small" type="number"
              value={form.maxThicknessInches || ''} onChange={handleChange('maxThicknessInches')} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Pay & Emergency</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Hourly Rate ($)" size="small" type="number"
              value={form.hourlyRate || ''} onChange={handleChange('hourlyRate')}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Emergency Contact" size="small"
              value={form.emergencyContactName || ''} onChange={handleChange('emergencyContactName')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Emergency Phone" size="small"
              value={form.emergencyContactPhone || ''} onChange={handleChange('emergencyContactPhone')} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Notes" size="small" multiline rows={2}
              value={form.notes || ''} onChange={handleChange('notes')} />
          </Grid>
        </Grid>

        {/* Inline skills (create only) */}
        {!operator && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Certifications / Skills (optional)
              </Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addSkillRow}>Add Skill</Button>
            </Box>
            {skillsToCreate.map((skill, idx) => (
              <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Work Center Type</InputLabel>
                    <Select
                      value={skill.workCenterTypeId}
                      onChange={(e) => updateSkillRow(idx, 'workCenterTypeId', e.target.value)}
                      label="Work Center Type"
                    >
                      {wcTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Skill Level</InputLabel>
                    <Select
                      value={skill.skillLevel}
                      onChange={(e) => updateSkillRow(idx, 'skillLevel', e.target.value)}
                      label="Skill Level"
                    >
                      {SKILL_LEVELS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={2}>
                  <IconButton color="error" onClick={() => removeSkillRow(idx)} sx={{ mt: 0.5 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : operator ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ============================================================================
// SKILL MANAGEMENT DIALOG
// ============================================================================

function SkillDialog({ open, onClose, operator, wcTypes, onSave, onRemove }) {
  const [adding, setAdding] = useState(false)
  const [newSkill, setNewSkill] = useState({ workCenterTypeId: '', skillLevel: 'STANDARD' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setAdding(false)
      setNewSkill({ workCenterTypeId: '', skillLevel: 'STANDARD' })
      setError(null)
    }
  }, [open])

  if (!operator) return null

  const skills = operator.skills || []
  const existingTypeIds = new Set(skills.filter((s) => s.isActive).map((s) => s.workCenterTypeId))
  const availableTypes = wcTypes.filter((t) => !existingTypeIds.has(t.id))

  const handleAdd = async () => {
    if (!newSkill.workCenterTypeId) return
    setSaving(true)
    setError(null)
    try {
      await onSave(operator.id, newSkill)
      setAdding(false)
      setNewSkill({ workCenterTypeId: '', skillLevel: 'STANDARD' })
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add skill')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (skillId) => {
    if (!window.confirm('Remove this certification?')) return
    await onRemove(operator.id, skillId)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Certifications — {operator.firstName} {operator.lastName} ({operator.employeeCode})
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {skills.filter((s) => s.isActive).length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No certifications yet
          </Typography>
        ) : (
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Work Center Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Skill Level</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Certified</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {skills.filter((s) => s.isActive).map((s) => {
                const typeLabel = wcTypes.find((t) => t.id === s.workCenterTypeId)?.label || s.workCenterTypeId
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Chip label={typeLabel} size="small"
                        icon={<BuildIcon sx={{ fontSize: 14 }} />} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={s.skillLevel} size="small"
                        sx={{ bgcolor: SKILL_COLORS[s.skillLevel] + '20', color: SKILL_COLORS[s.skillLevel], fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(s.certifiedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleRemove(s.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {adding ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Work Center Type</InputLabel>
                  <Select
                    value={newSkill.workCenterTypeId}
                    onChange={(e) => setNewSkill((prev) => ({ ...prev, workCenterTypeId: e.target.value }))}
                    label="Work Center Type"
                  >
                    {availableTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Skill Level</InputLabel>
                  <Select
                    value={newSkill.skillLevel}
                    onChange={(e) => setNewSkill((prev) => ({ ...prev, skillLevel: e.target.value }))}
                    label="Skill Level"
                  >
                    {SKILL_LEVELS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <Button variant="contained" fullWidth size="small" onClick={handleAdd} disabled={saving}>
                  {saving ? <CircularProgress size={16} /> : 'Add'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        ) : (
          <Button startIcon={<AddIcon />} onClick={() => setAdding(true)} disabled={availableTypes.length === 0}>
            {availableTypes.length === 0 ? 'All types certified' : 'Add Certification'}
          </Button>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

// ============================================================================
// SHIFT DIALOG (Create / Edit)
// ============================================================================

function ShiftDialog({ open, onClose, onSave, shift, operators, locations, workCenters }) {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      if (shift) {
        setForm({
          operatorId: shift.operatorId || '',
          locationId: shift.locationId || '',
          workCenterId: shift.workCenterId || '',
          shiftDate: shift.shiftDate ? shift.shiftDate.split('T')[0] : '',
          startTime: shift.startTime ? new Date(shift.startTime).toTimeString().slice(0, 5) : '06:00',
          endTime: shift.endTime ? new Date(shift.endTime).toTimeString().slice(0, 5) : '14:30',
          shiftType: shift.shiftType || 'DAY',
          breakMinutes: shift.breakMinutes ?? 30,
          notes: shift.notes || '',
        })
      } else {
        const today = new Date().toISOString().split('T')[0]
        setForm({
          operatorId: '', locationId: '', workCenterId: '',
          shiftDate: today, startTime: '06:00', endTime: '14:30',
          shiftType: 'DAY', breakMinutes: 30, notes: '',
        })
      }
      setError(null)
    }
  }, [open, shift])

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.operatorId || !form.shiftDate || !form.startTime || !form.endTime) {
      setError('Operator, date, start time, and end time are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const data = {
        operatorId: form.operatorId,
        locationId: form.locationId || null,
        workCenterId: form.workCenterId || null,
        shiftDate: form.shiftDate,
        startTime: new Date(`${form.shiftDate}T${form.startTime}:00`).toISOString(),
        endTime: new Date(`${form.shiftDate}T${form.endTime}:00`).toISOString(),
        shiftType: form.shiftType,
        breakMinutes: parseInt(form.breakMinutes, 10) || 30,
        notes: form.notes || null,
      }
      await onSave(data)
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to save shift')
    } finally {
      setSaving(false)
    }
  }

  // Auto-set shift times based on type
  const handleShiftTypeChange = (e) => {
    const type = e.target.value
    const times = {
      DAY: { startTime: '06:00', endTime: '14:30' },
      NIGHT: { startTime: '22:00', endTime: '06:30' },
      SWING: { startTime: '14:00', endTime: '22:30' },
      SPLIT: { startTime: '06:00', endTime: '18:00' },
      OVERTIME: { startTime: form.startTime, endTime: form.endTime },
    }
    setForm((prev) => ({ ...prev, shiftType: type, ...(times[type] || {}) }))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{shift ? 'Edit Shift' : 'Schedule Shift'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Operator</InputLabel>
              <Select value={form.operatorId || ''} onChange={handleChange('operatorId')} label="Operator">
                {operators.filter((o) => o.isActive).map((op) => (
                  <MenuItem key={op.id} value={op.id}>
                    {op.employeeCode} — {op.firstName} {op.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth required label="Date" size="small" type="date"
              value={form.shiftDate || ''} onChange={handleChange('shiftDate')}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Shift Type</InputLabel>
              <Select value={form.shiftType || 'DAY'} onChange={handleShiftTypeChange} label="Shift Type">
                {SHIFT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth required label="Start" size="small" type="time"
              value={form.startTime || '06:00'} onChange={handleChange('startTime')}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth required label="End" size="small" type="time"
              value={form.endTime || '14:30'} onChange={handleChange('endTime')}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="Break (min)" size="small" type="number"
              value={form.breakMinutes ?? 30} onChange={handleChange('breakMinutes')} />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select value={form.locationId || ''} onChange={handleChange('locationId')} label="Location">
                <MenuItem value="">— None —</MenuItem>
                {locations.map((loc) => <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Work Center</InputLabel>
              <Select value={form.workCenterId || ''} onChange={handleChange('workCenterId')} label="Work Center">
                <MenuItem value="">— None —</MenuItem>
                {workCenters.filter((wc) => !form.locationId || wc.locationId === form.locationId).map((wc) => (
                  <MenuItem key={wc.id} value={wc.id}>{wc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Notes" size="small" multiline rows={2}
              value={form.notes || ''} onChange={handleChange('notes')} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : shift ? 'Update' : 'Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ============================================================================
// OPERATOR DETAIL DIALOG
// ============================================================================

function OperatorDetailDialog({ open, onClose, operator, wcTypes }) {
  if (!operator) return null

  const skills = (operator.skills || []).filter((s) => s.isActive)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
            {operator.firstName?.[0]}{operator.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6">{operator.firstName} {operator.lastName}</Typography>
            <Typography variant="body2" color="text.secondary">{operator.employeeCode}</Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <Box><Chip label={operator.status} size="small" color={STATUS_COLORS[operator.status] || 'default'} /></Box>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Location</Typography>
            <Typography variant="body2">{operator.homeLocation?.name || '—'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Home Work Center</Typography>
            <Typography variant="body2">{operator.homeWorkCenter?.name || '—'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Max Thickness</Typography>
            <Typography variant="body2">{operator.maxThicknessInches ? `${operator.maxThicknessInches}"` : '—'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Email</Typography>
            <Typography variant="body2">{operator.email || '—'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Phone</Typography>
            <Typography variant="body2">{operator.phone || '—'}</Typography>
          </Grid>
          {operator.hireDate && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Hire Date</Typography>
              <Typography variant="body2">{new Date(operator.hireDate).toLocaleDateString()}</Typography>
            </Grid>
          )}
          {operator.notes && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Notes</Typography>
              <Typography variant="body2">{operator.notes}</Typography>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Certifications ({skills.length})
        </Typography>
        {skills.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No certifications</Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {skills.map((s) => {
              const typeLabel = wcTypes.find((t) => t.id === s.workCenterTypeId)?.label || s.workCenterTypeId
              return (
                <Chip
                  key={s.id}
                  label={`${typeLabel} — ${s.skillLevel}`}
                  icon={<StarIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: SKILL_COLORS[s.skillLevel] + '15',
                    borderColor: SKILL_COLORS[s.skillLevel],
                    color: SKILL_COLORS[s.skillLevel],
                    fontWeight: 600,
                  }}
                  variant="outlined"
                />
              )
            })}
          </Box>
        )}

        {operator.emergencyContactName && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Emergency Contact</Typography>
            <Typography variant="body2">
              {operator.emergencyContactName} — {operator.emergencyContactPhone || 'No phone'}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
