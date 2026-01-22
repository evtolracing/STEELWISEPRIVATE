/**
 * Work Center Select Page
 * Allows operator to select location and work center to view queue
 */

import React, { useState, useEffect, useCallback } from 'react'
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
} from '@mui/material'
import {
  ContentCut as SawIcon,
  Settings as SettingsIcon,
  LocalShipping as PackIcon,
  Water as WaterjetIcon,
  BuildCircle as DeburIcon,
  Router as RouterIcon,
  LocationOn as LocationIcon,
  PlayArrow as StartIcon,
  Refresh as RefreshIcon,
  Factory as FactoryIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { getLocations, getWorkCenters, runDispatch, getDispatchStats } from '../../services/dispatchApi'

// Icon mapping for work center types
const WORK_CENTER_ICONS = {
  SAW: SawIcon,
  SHEAR: SawIcon,
  ROUTER: RouterIcon,
  WATERJET: WaterjetIcon,
  DEBURR: DeburIcon,
  PACKOUT: PackIcon,
  DEFAULT: SettingsIcon,
}

// Color mapping for work center types
const WORK_CENTER_COLORS = {
  SAW: '#1976d2',
  SHEAR: '#0288d1',
  ROUTER: '#7b1fa2',
  WATERJET: '#00838f',
  DEBURR: '#558b2f',
  PACKOUT: '#e65100',
  DEFAULT: '#666',
}

function WorkCenterSelectPage() {
  const navigate = useNavigate()
  
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [workCenters, setWorkCentersState] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dispatching, setDispatching] = useState(false)
  const [error, setError] = useState(null)

  // Load locations
  useEffect(() => {
    async function loadLocations() {
      try {
        const data = await getLocations()
        setLocations(data)
        // Set default location after loading
        if (data.length > 0) {
          setSelectedLocation(data[0].id)
        }
      } catch (err) {
        console.error('Failed to load locations:', err)
        // Fallback locations
        const fallbackLocations = [
          { id: 'FWA', name: 'Fort Wayne' },
          { id: 'IND', name: 'Indianapolis' },
          { id: 'CHI', name: 'Chicago' },
        ]
        setLocations(fallbackLocations)
        setSelectedLocation('FWA')
      }
    }
    loadLocations()
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

  // Handle dispatch run
  const handleRunDispatch = async () => {
    setDispatching(true)
    try {
      const result = await runDispatch(selectedLocation)
      alert(`Dispatch complete! Assigned ${result.assignedCount} operations.`)
      loadData()
    } catch (err) {
      console.error('Dispatch failed:', err)
      alert(`Dispatch failed: ${err.message}`)
    } finally {
      setDispatching(false)
    }
  }

  // Navigate to work center queue
  const handleSelectWorkCenter = (wcId) => {
    navigate(`/shopfloor/${wcId}?locationId=${selectedLocation}`)
  }

  const getWCIcon = (type) => {
    const Icon = WORK_CENTER_ICONS[type] || WORK_CENTER_ICONS.DEFAULT
    return <Icon />
  }

  const getWCColor = (type) => {
    return WORK_CENTER_COLORS[type] || WORK_CENTER_COLORS.DEFAULT
  }

  const getQueueCount = (wcId) => {
    if (!stats?.byWorkCenter?.[wcId]) return 0
    const wc = stats.byWorkCenter[wcId]
    return (wc.scheduled || 0) + (wc.inProcess || 0)
  }

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
              Select work center to view queue • AI-optimized dispatch
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
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
            Select Work Center
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
        ) : (
          <Grid container spacing={2}>
            {workCenters.map((wc) => {
              const queueCount = getQueueCount(wc.id)
              const color = getWCColor(wc.workCenterType)
              const wcStats = stats?.byWorkCenter?.[wc.id]
              
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
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleSelectWorkCenter(wc.id)}
                      disabled={!wc.isOnline}
                      sx={{ height: '100%', p: 0 }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={700} noWrap>
                              {wc.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {wc.id}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Type & Division */}
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Chip
                            label={wc.workCenterType}
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
          </Grid>
        )}

        {/* Capabilities Legend */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Work Center Types
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {Object.entries(WORK_CENTER_ICONS).filter(([k]) => k !== 'DEFAULT').map(([type, Icon]) => (
              <Chip
                key={type}
                icon={<Icon sx={{ fontSize: '18px !important' }} />}
                label={type}
                size="small"
                sx={{
                  bgcolor: alpha(getWCColor(type), 0.1),
                  color: getWCColor(type),
                }}
              />
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

export default WorkCenterSelectPage
