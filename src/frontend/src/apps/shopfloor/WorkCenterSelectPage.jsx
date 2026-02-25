/**
 * Work Center Select Page
 * Allows operator to select location and work center to view queue
 * Work center types, icons, and colors are loaded dynamically from the server
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  getDispatchStats,
} from '../../services/dispatchApi'
import { ICON_MAP, resolveIcon } from './iconMap'
import CreateWorkCenterDialog from './CreateWorkCenterDialog'
import ManageWorkCenterTypesDialog from './ManageWorkCenterTypesDialog'

function WorkCenterSelectPage() {
  const navigate = useNavigate()
  
  // Core data
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [workCenters, setWorkCentersState] = useState([])
  const [workCenterTypes, setWorkCenterTypesState] = useState([])
  const [divisionsData, setDivisionsData] = useState([])
  const [stats, setStats] = useState(null)
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
        if (locsData.length > 0) {
          setSelectedLocation(locsData[0].id)
        }
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
    if (!selectedLocation) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [wcData, statsData] = await Promise.all([
        getWorkCenters(selectedLocation),
        getDispatchStats(selectedLocation),
      ])
      setWorkCentersState(wcData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedLocation])

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
      setSnackbar({
        open: true,
        message: `Dispatch complete! Assigned ${result.assignedCount} operations.`,
        severity: 'success',
      })
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
    if (!window.confirm(`Take "${wc.name}" offline? Active operations must be completed first.`)) return
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

  const getQueueCount = (wcId) => {
    if (!stats?.byWorkCenter?.[wcId]) return 0
    const wc = stats.byWorkCenter[wcId]
    return (wc.scheduled || 0) + (wc.inProcess || 0)
  }

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
            <Typography variant="h4" fontWeight={700}>
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
            <InputLabel>Location</InputLabel>
            <Select
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
        {/* Stats Summary */}
        {stats && (
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)', color: 'white' }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={2}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Total Operations</Typography>
                  <Typography variant="h4" fontWeight={700}>{stats.summary?.total || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Pending</Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.light">{stats.summary?.pending || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Scheduled</Typography>
                  <Typography variant="h4" fontWeight={700} color="info.light">{stats.summary?.scheduled || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>In Process</Typography>
                  <Typography variant="h4" fontWeight={700} color="success.light">{stats.summary?.inProcess || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Complete</Typography>
                  <Typography variant="h4" fontWeight={700}>{stats.summary?.complete || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Unassigned</Typography>
                  <Typography variant="h4" fontWeight={700} color="error.light">{stats.summary?.unassigned || 0}</Typography>
                </Grid>
              </Grid>
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
        ) : workCenters.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FactoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No work centers at this location
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
            {workCenters.map((wc) => {
              const queueCount = getQueueCount(wc.id)
              const color = getWCColor(wc.workCenterType)
              const wcStats = stats?.byWorkCenter?.[wc.id]
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
                      <IconButton
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
                              {wc.id}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Type & Division */}
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                          <Chip
                            label={typeLabel}
                            size="small"
                            sx={{
                              bgcolor: alpha(color, 0.1),
                              color: color,
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
                                {wcStats?.scheduled || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Scheduled
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h5" fontWeight={700} color="success.main">
                                {wcStats?.inProcess || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Active
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h5" fontWeight={700} color="text.secondary">
                                {wcStats?.complete || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Done
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
                            <Typography variant="body2" fontWeight={600} color={color}>
                              {queueCount} job{queueCount !== 1 ? 's' : ''} in queue
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
                    color: type.color,
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
        autoHideDuration={4000}
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
