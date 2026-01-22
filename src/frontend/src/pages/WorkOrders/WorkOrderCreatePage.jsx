import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Grid,
  Avatar,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Assignment as WorkOrderIcon,
  Inventory as CoilIcon,
  ContentCut as SlitIcon,
  Straighten as CTLIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { createWorkOrder, getUnits } from '../../api'

const WO_TYPES = [
  { value: 'SLIT', label: 'Slitting', icon: SlitIcon },
  { value: 'CTL', label: 'Cut-to-Length', icon: CTLIcon },
  { value: 'BLANK', label: 'Blanking', icon: CTLIcon },
  { value: 'LEVELCUT', label: 'Level Cut', icon: CTLIcon },
  { value: 'MULTIBLANKING', label: 'Multi-Blanking', icon: CTLIcon },
  { value: 'SHEAR', label: 'Shearing', icon: CTLIcon },
]

const PRIORITIES = [
  { value: 1, label: 'Critical', color: 'error' },
  { value: 2, label: 'High', color: 'warning' },
  { value: 3, label: 'Normal', color: 'primary' },
  { value: 4, label: 'Low', color: 'default' },
]

export default function WorkOrderCreatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    woType: 'SLIT',
    sourceCoilId: '',
    priority: 3,
    scheduledDate: '',
    notes: '',
    slitPattern: [],
  })
  
  // Coils for selection
  const [coils, setCoils] = useState([])
  const [coilsLoading, setCoilsLoading] = useState(true)
  const [selectedCoil, setSelectedCoil] = useState(null)

  // Load available coils
  useEffect(() => {
    async function loadCoils() {
      try {
        setCoilsLoading(true)
        const data = await getUnits({ status: 'AVAILABLE' })
        // Handle both array response and object with data property
        const coilList = Array.isArray(data) ? data : (data.coils || data.data || [])
        setCoils(coilList)
      } catch (err) {
        console.error('Failed to load coils:', err)
        setError('Failed to load available coils')
      } finally {
        setCoilsLoading(false)
      }
    }
    loadCoils()
  }, [])

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value })
  }

  const handleCoilSelect = (event, coil) => {
    setSelectedCoil(coil)
    if (coil) {
      setFormData({ ...formData, sourceCoilId: coil.id })
    } else {
      setFormData({ ...formData, sourceCoilId: '' })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!formData.sourceCoilId) {
      setError('Please select a source coil')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const payload = {
        woType: formData.woType,
        sourceCoilId: formData.sourceCoilId,
        priority: formData.priority,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : null,
        notes: formData.notes || null,
        slitPattern: formData.slitPattern.length > 0 ? formData.slitPattern : null,
      }
      
      const created = await createWorkOrder(payload)
      setSuccess(true)
      
      // Navigate to the new work order after a brief delay
      setTimeout(() => {
        navigate(`/work-orders/${created.id}`)
      }, 1500)
    } catch (err) {
      console.error('Failed to create work order:', err)
      setError(err.response?.data?.error || err.message || 'Failed to create work order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/work-orders')}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
            <WorkOrderIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Create Work Order
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new production work order
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Work order created successfully! Redirecting...
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Left Column - Work Order Details */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Work Order Details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                {/* Work Order Type */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Work Order Type"
                    value={formData.woType}
                    onChange={handleChange('woType')}
                    required
                  >
                    {WO_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <type.icon fontSize="small" />
                          <span>{type.label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Priority */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Priority"
                    value={formData.priority}
                    onChange={handleChange('priority')}
                  >
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={p.label} size="small" color={p.color} sx={{ minWidth: 70 }} />
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Source Coil */}
                <Grid item xs={12}>
                  <Autocomplete
                    options={coils}
                    value={selectedCoil}
                    onChange={handleCoilSelect}
                    loading={coilsLoading}
                    getOptionLabel={(coil) => 
                      `${coil.coilNumber || coil.unitNumber || coil.id} - ${coil.grade?.name || 'Unknown'} (${coil.widthIn || '?'}" x ${coil.gaugeIn || '?'}")`
                    }
                    renderOption={(props, coil) => (
                      <li {...props} key={coil.id}>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {coil.coilNumber || coil.unitNumber || coil.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {coil.grade?.name || 'Unknown Grade'} • {coil.widthIn || '?'}" x {coil.gaugeIn || '?'}" • {coil.weightLb?.toLocaleString() || '?'} lbs
                          </Typography>
                        </Stack>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Source Coil"
                        required
                        placeholder="Search for a coil..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <CoilIcon color="action" sx={{ ml: 1, mr: 0.5 }} />
                              {params.InputProps.startAdornment}
                            </>
                          ),
                          endAdornment: (
                            <>
                              {coilsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Scheduled Date */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Scheduled Date"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={handleChange('scheduledDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Notes */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange('notes')}
                    placeholder="Add any special instructions or notes..."
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right Column - Selected Coil Info & Actions */}
          <Grid item xs={12} md={4}>
            {/* Selected Coil Card */}
            {selectedCoil && (
              <Card sx={{ mb: 3, borderRadius: 2, border: '2px solid', borderColor: 'primary.main' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <CoilIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Selected Coil
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Coil Number</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedCoil.coilNumber || selectedCoil.unitNumber || selectedCoil.id}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Grade</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedCoil.grade?.name || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Dimensions</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedCoil.widthIn || '?'}" x {selectedCoil.gaugeIn || '?'}"
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Weight</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedCoil.weightLb?.toLocaleString() || '?'} lbs
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedCoil.location?.name || selectedCoil.locationId || 'Unknown'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* AI Suggestion */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'secondary.50', border: '1px solid', borderColor: 'secondary.200' }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <AIIcon color="secondary" />
                <Typography variant="subtitle2" color="secondary.main">
                  AI Tip
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Based on current production capacity, scheduling this work order for tomorrow morning would optimize machine utilization.
              </Typography>
            </Paper>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={loading || !formData.sourceCoilId}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Creating...' : 'Create Work Order'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  )
}
