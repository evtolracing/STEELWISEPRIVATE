/**
 * Work Center Select Page
 * Allows operator to select location and work center to view queue
 * Work center types, icons, and colors are loaded dynamically from the server
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  Stack,
  Button,
  CircularProgress,
  Alert,
  alpha,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  Snackbar,
} from '@mui/material'
import {
  LocationOn as LocationIcon,
  PlayArrow as StartIcon,
  Refresh as RefreshIcon,
  Factory as FactoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon,
  PowerSettingsNew as PowerIcon,
} from '@mui/icons-material'
import {
  getLocations,
  getWorkCenters,
  getWorkCenterTypes,
  getDivisions,
  createWorkCenter,
  updateWorkCenter,
  deleteWorkCenter,
  createWorkCenterType,
  updateWorkCenterType,
  deleteWorkCenterType,
  runDispatch,
} from '../../services/dispatchApi'
import { getProductionOverview } from '../../services/productionApi'
import { startingBranch } from '../../components/production/productionView'
import { ICON_MAP, resolveIcon } from './iconMap'
import { useAuth } from '../../hooks/useAuth'
import CreateWorkCenterDialog from './CreateWorkCenterDialog'
import ManageWorkCenterTypesDialog from './ManageWorkCenterTypesDialog'
import { ask } from '../../utils/ask'
import { dispatchMessage } from './dispatchMessage'

function WorkCenterSelectPage() {
  const { user } = useAuth()
  // The branch picked in the top bar comes first, then the person's own (read once, when the screen opens).
  const homeRef = useRef({ topBarBranchId: user?.branchId || '', homeLocationId: user?.homeLocationId || null })
  const navigate = useNavigate()
  
  // Core data
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [workCenters, setWorkCentersState] = useState([])
  const [workCenterTypes, setWorkCenterTypesState] = useState([])
  const [divisionsData, setDivisionsData] = useState([])
  const [stats, setStats] = useState(null)
  const [divisionFilter, setDivisionFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [dispatching, setDispatching] = useState(false)
  const [error, setError] = useState(null)

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingWorkCenter, setEditingWorkCenter] = useState(null)
  const [typesDialogOpen, setTypesDialogOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Work center context menu
  const [contextMenu, setContextMenu] = useState({ anchorEl: null, workCenter: null })

  // Build lookup maps from dynamic type data
  const typeMap = useMemo(() => {
    const map = {}
    workCenterTypes.forEach((t) => {
      map[t.id] = t
    })
    return map
  }, [workCenterTypes])

  // Load initial data (locations + types + divisions)
  useEffect(() => {
    async function loadInitial() {
      try {
        const [locsData, typesData, divsData] = await Promise.all([
          getLocations(),
          getWorkCenterTypes(false), // load all, including inactive, for management UI
          getDivisions(),
        ])
        setLocations(locsData)
        setWorkCenterTypesState(typesData)
        setDivisionsData(divsData)
        // Start at the branch picked in the top bar, else the person's own. With no branch at all there is nothing to load.
        const start = startingBranch(locsData, homeRef.current)
        if (start) setSelectedLocation(start)
        else setLoading(false)
      } catch (err) {
        console.error('Failed to load initial data:', err)
        setError(err.message)
        // No fallback — locations come from Supabase
        setLocations([])
      }
    }
    loadInitial()
  }, [])

  // Load work centers and stats when location changes
  const loadData = useCallback(async () => {
    // Still waiting for the list of branches: keep showing the spinner, not "No work centers".
    if (!selectedLocation) return
    setLoading(true)
    setError(null)
    try {
      const [wcData, statsData] = await Promise.all([
        getWorkCenters(selectedLocation),
        getProductionOverview({ locationId: selectedLocation, division: divisionFilter }),
      ])
      setWorkCentersState(wcData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedLocation, divisionFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reload types from server
  const reloadTypes = async () => {
    try {
      const typesData = await getWorkCenterTypes(false)
      setWorkCenterTypesState(typesData)
    } catch (err) {
      console.error('Failed to reload types:', err)
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRunDispatch = async () => {
    setDispatching(true)
    try {
      const result = await runDispatch(selectedLocation)
      // Says what was placed, what could not be and why, and which new jobs still need a route.
      setSnackbar({ open: true, ...dispatchMessage(result) })
      loadData()
    } catch (err) {
      setSnackbar({ open: true, message: `Dispatch failed: ${err.message}`, severity: 'error' })
    } finally {
      setDispatching(false)
    }
  }

  const handleSelectWorkCenter = (wcId) => {
    navigate(`/shopfloor/${wcId}?locationId=${selectedLocation}`)
  }

  // Create/Edit work center
  const handleWorkCenterSubmit = async (payload, editId) => {
    if (editId) {
      await updateWorkCenter(editId, payload)
      setSnackbar({ open: true, message: `Work center "${payload.name}" updated`, severity: 'success' })
    } else {
      await createWorkCenter(payload)
      setSnackbar({ open: true, message: `Work center "${payload.name}" created`, severity: 'success' })
    }
    loadData()
  }

  // Delete (take offline) a work center
  const handleDeleteWorkCenter = async (wc) => {
    if (!(await ask(`Take "${wc.name}" offline? Active operations must be completed first.`, { title: 'Take work center offline', confirmText: 'Take offline', danger: true }))) return
    try {
      await deleteWorkCenter(wc.id)
      setSnackbar({ open: true, message: `"${wc.name}" taken offline`, severity: 'info' })
      loadData()
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' })
    }
  }

  // Toggle online/offline
  const handleToggleOnline = async (wc) => {
    try {
      await updateWorkCenter(wc.id, { isOnline: !wc.isOnline })
      setSnackbar({ open: true, message: `"${wc.name}" is now ${wc.isOnline ? 'OFFLINE' : 'ONLINE'}`, severity: 'info' })
      loadData()
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' })
    }
  }

  // Work Center Type management
  const handleCreateType = async (data) => {
    await createWorkCenterType(data)
    setSnackbar({ open: true, message: `Type "${data.label}" created`, severity: 'success' })
    await reloadTypes()
  }

  const handleUpdateType = async (id, data) => {
    await updateWorkCenterType(id, data)
    setSnackbar({ open: true, message: `Type "${data.label}" updated`, severity: 'success' })
    await reloadTypes()
  }

  const handleDeleteType = async (id) => {
    await deleteWorkCenterType(id)
    setSnackbar({ open: true, message: `Type "${id}" deactivated`, severity: 'info' })
    await reloadTypes()
  }

  // ── Render Helpers ─────────────────────────────────────────────────────────

  const getWCIcon = (type) => {
    const Icon = resolveIcon(typeMap[type]?.icon)
    return <Icon />
  }

  const getWCColor = (type) => {
    return typeMap[type]?.color || '#666'
  }

  // Per machine, from the production overview: steps queued and running now, steps finished today.
  const machineStats = useMemo(() => Object.fromEntries((stats?.workCenters || []).map((m) => [m.id, m])), [stats])
  const getQueueCount = (wcId) => {
    const m = machineStats[wcId]
    return m ? (m.queued || 0) + (m.running || 0) : 0
  }
  // The division picked narrows the machines too.
  const shownWorkCenters = useMemo(
    () => (divisionFilter ? workCenters.filter((wc) => wc.division === divisionFilter) : workCenters),
    [workCenters, divisionFilter],
  )

  // Active types only for the legend
  const activeTypes = useMemo(
    () => workCenterTypes.filter((t) => t.isActive),
    [workCenterTypes]
  )

  // Group work centers by type for better overview
  const workCentersByType = useMemo(() => {
    const groups = {}
    workCenters.forEach((wc) => {
      if (!groups[wc.workCenterType]) groups[wc.workCenterType] = []
      groups[wc.workCenterType].push(wc)
    })
    return groups
  }, [workCenters])

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            width: 48, 
            height: 48, 
            bgcolor: 'primary.main',
          }}>
            <FactoryIcon />
          </Avatar>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={700}>
              Shop Floor Control
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select work center to view queue • {activeTypes.length} work center types available
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Manage Work Center Types">
            <Button
              variant="outlined"
              startIcon={<CategoryIcon />}
              onClick={() => setTypesDialogOpen(true)}
              size="small"
            >
              Types
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingWorkCenter(null)
              setCreateDialogOpen(true)
            }}
            size="small"
          >
            New Work Center
          </Button>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="shopfloor-location-label">Location</InputLabel>
            <Select
              labelId="shopfloor-location-label"
              value={selectedLocation}
              label="Location"
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationIcon fontSize="small" />
                    <span>{loc.name}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="shopfloor-division-label">Division</InputLabel>
            <Select
              labelId="shopfloor-division-label"
              value={divisionFilter}
              label="Division"
              onChange={(e) => setDivisionFilter(e.target.value)}
              data-testid="shopfloor-division"
            >
              <MenuItem value="">All divisions</MenuItem>
              {divisionsData.filter((d) => d.isActive !== false).map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.label || d.id}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={dispatching ? <CircularProgress size={20} color="inherit" /> : <StartIcon />}
            onClick={handleRunDispatch}
            disabled={dispatching}
          >
            Run Dispatch
          </Button>
        </Stack>
      </Box>

      <Box>
        {/* Jobs at this branch, by how far they have got. Counted on the server the same way as the
            Planning page and the workflow board (GET /api/jobs/overview). */}
        {stats && (
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)', color: 'white' }} data-testid="shopfloor-summary">
            <CardContent>
              <Grid container spacing={3}>
                {[
                  ['In production', stats.counts?.inProduction, 'inherit', 'Jobs at this branch not yet through their steps'],
                  ['Not planned', stats.counts?.NOT_PLANNED, 'warning.light', 'No route yet: plan them on the Order Board'],
                  ['Waiting for a machine', stats.counts?.NO_MACHINE, 'error.light', 'Planned, next step on no machine: Run Dispatch'],
                  ['Queued', stats.counts?.QUEUED, 'info.light', 'Next step waiting at a machine'],
                  ['Running', stats.counts?.RUNNING, 'success.light', 'A step is being worked now'],
                  ['Steps done today', stats.stepsDoneToday, 'inherit', 'Steps finished on these machines since midnight'],
                ].map(([label, value, color, hint]) => (
                  <Grid item xs={6} sm={4} md={2} key={label}>
                    <Tooltip title={hint}>
                      <Box>
                        <Typography variant="caption" sx={{ opacity: 0.85 }}>{label}</Typography>
                        <Typography variant="h4" fontWeight={700} color={color}>{value ?? 0}</Typography>
                      </Box>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
              {stats.counts && (stats.counts.WAITING_QC + stats.counts.PACKAGING + stats.counts.READY_TO_SHIP + stats.counts.ON_HOLD) > 0 && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.85 }}>
                  Past the floor: {stats.counts.WAITING_QC} waiting QC, {stats.counts.PACKAGING} in packaging, {stats.counts.READY_TO_SHIP} ready to ship{stats.counts.ON_HOLD ? `, ${stats.counts.ON_HOLD} on hold` : ''}.
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* Page Title */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            Work Centers at {locations.find((l) => l.id === selectedLocation)?.name || selectedLocation}
          </Typography>
          <Button startIcon={<RefreshIcon />} onClick={loadData} disabled={loading}>
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} />
          </Box>
        ) : shownWorkCenters.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FactoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {divisionFilter ? 'No work centers of this division here' : 'No work centers at this location'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first work center to start managing production
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingWorkCenter(null)
                setCreateDialogOpen(true)
              }}
            >
              Create Work Center
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {shownWorkCenters.map((wc) => {
              const queueCount = getQueueCount(wc.id)
              const color = getWCColor(wc.workCenterType)
              const wcStats = machineStats[wc.id]
              const typeLabel = typeMap[wc.workCenterType]?.label || wc.workCenterType
              
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={wc.id}>
                  <Card
                    sx={{
                      height: '100%',
                      border: '2px solid',
                      borderColor: wc.isOnline ? 'transparent' : 'error.main',
                      opacity: wc.isOnline ? 1 : 0.6,
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                      position: 'relative',
                    }}
                  >
                    {/* Edit/Menu button */}
                    <Box sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}>
                      <IconButton aria-label="More actions"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          setContextMenu({ anchorEl: e.currentTarget, workCenter: wc })
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <CardActionArea
                      onClick={() => handleSelectWorkCenter(wc.id)}
                      disabled={!wc.isOnline}
                      sx={{ height: '100%', p: 0 }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, pr: 3 }}>
                          <Avatar
                            sx={{
                              width: 56,
                              height: 56,
                              bgcolor: alpha(color, 0.15),
                              color: color,
                            }}
                          >
                            {getWCIcon(wc.workCenterType)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" fontWeight={700} noWrap>
                              {wc.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {wc.code || ""}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Type & Division */}
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                          <Chip
                            label={typeLabel}
                            size="small"
                            sx={{
                              // The type's colour marks the chip; its words are in the text colour, which
                              // can be read on any tint (a type's own colour on its tint often cannot).
                              bgcolor: alpha(color, 0.1),
                              color: 'text.primary',
                              borderLeft: `3px solid ${color}`,
                              fontWeight: 600,
                            }}
                          />
                          <Chip
                            label={wc.division}
                            size="small"
                            variant="outlined"
                          />
                          {!wc.isOnline && (
                            <Chip label="OFFLINE" size="small" color="error" />
                          )}
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />

                        {/* Queue Stats */}
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h5" fontWeight={700} color="warning.main">
                                {wcStats?.queued || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Queued
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h5" fontWeight={700} color="success.main">
                                {wcStats?.running || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Running
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h5" fontWeight={700} color="text.secondary">
                                {wcStats?.doneToday || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Done today
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Queue indicator */}
                        {queueCount > 0 && (
                          <Box
                            sx={{
                              mt: 2,
                              p: 1,
                              borderRadius: 1,
                              bgcolor: alpha(color, 0.1),
                              textAlign: 'center',
                            }}
                          >
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                              {queueCount} step{queueCount !== 1 ? 's' : ''} in queue
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              )
            })}

            {/* Add Work Center Card */}
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{
                  height: '100%',
                  minHeight: 200,
                  border: '2px dashed',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => {
                    setEditingWorkCenter(null)
                    setCreateDialogOpen(true)
                  }}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                  }}
                >
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'action.hover', mb: 2 }}>
                    <AddIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                  </Avatar>
                  <Typography variant="body1" fontWeight={600} color="text.secondary">
                    Add Work Center
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click to create a new work center
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Dynamic Work Center Types Legend */}
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Work Center Types ({activeTypes.length} active)
            </Typography>
            <Button
              size="small"
              startIcon={<SettingsIcon />}
              onClick={() => setTypesDialogOpen(true)}
            >
              Manage Types
            </Button>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {activeTypes.map((type) => {
              const Icon = resolveIcon(type.icon)
              return (
                <Chip
                  key={type.id}
                  icon={<Icon sx={{ fontSize: '18px !important' }} />}
                  label={type.label}
                  size="small"
                  sx={{
                    bgcolor: alpha(type.color, 0.1),
                    color: 'text.primary',
                    '& .MuiChip-icon': { color: type.color },
                  }}
                />
              )
            })}
          </Stack>
        </Box>
      </Box>

      {/* Context Menu for Work Center Cards */}
      <Menu
        anchorEl={contextMenu.anchorEl}
        open={Boolean(contextMenu.anchorEl)}
        onClose={() => setContextMenu({ anchorEl: null, workCenter: null })}
      >
        <MenuItem
          onClick={() => {
            setEditingWorkCenter(contextMenu.workCenter)
            setCreateDialogOpen(true)
            setContextMenu({ anchorEl: null, workCenter: null })
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Work Center
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleToggleOnline(contextMenu.workCenter)
            setContextMenu({ anchorEl: null, workCenter: null })
          }}
        >
          <PowerIcon fontSize="small" sx={{ mr: 1 }} />
          {contextMenu.workCenter?.isOnline ? 'Take Offline' : 'Bring Online'}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleDeleteWorkCenter(contextMenu.workCenter)
            setContextMenu({ anchorEl: null, workCenter: null })
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Work Center
        </MenuItem>
      </Menu>

      {/* Create / Edit Work Center Dialog */}
      <CreateWorkCenterDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false)
          setEditingWorkCenter(null)
        }}
        onSubmit={handleWorkCenterSubmit}
        workCenterTypes={workCenterTypes}
        locations={locations}
        divisions={divisionsData}
        editData={editingWorkCenter}
      />

      {/* Manage Work Center Types Dialog */}
      <ManageWorkCenterTypesDialog
        open={typesDialogOpen}
        onClose={() => setTypesDialogOpen(false)}
        workCenterTypes={workCenterTypes}
        divisions={divisionsData}
        onCreateType={handleCreateType}
        onUpdateType={handleUpdateType}
        onDeleteType={handleDeleteType}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.message?.length > 60 ? 15000 : 4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default WorkCenterSelectPage
