/**
 * Create / Edit Work Center Dialog
 * Production-ready form with dynamic work center types from the server
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Chip,
  Stack,
  Alert,
  Box,
  Avatar,
  Switch,
  FormControlLabel,
  InputAdornment,
  Autocomplete,
  alpha,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Factory as FactoryIcon,
} from '@mui/icons-material'
import { ICON_MAP } from './iconMap'

export default function CreateWorkCenterDialog({
  open,
  onClose,
  onSubmit,
  workCenterTypes = [],
  locations = [],
  divisions = [],
  editData = null, // if provided, we're editing
}) {
  const isEdit = Boolean(editData)

  const [form, setForm] = useState({
    id: '',
    name: '',
    locationId: '',
    division: '',
    workCenterType: '',
    capabilities: [],
    maxThicknessInches: 12,
    isOnline: true,
  })
  const [capInput, setCapInput] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setForm({
        id: editData.id || '',
        name: editData.name || '',
        locationId: editData.locationId || '',
        division: editData.division || '',
        workCenterType: editData.workCenterType || '',
        capabilities: editData.capabilities || [],
        maxThicknessInches: editData.maxThicknessInches ?? 12,
        isOnline: editData.isOnline ?? true,
      })
    } else {
      setForm({
        id: '',
        name: '',
        locationId: locations[0]?.id || '',
        division: '',
        workCenterType: '',
        capabilities: [],
        maxThicknessInches: 12,
        isOnline: true,
      })
    }
    setError(null)
  }, [editData, open, locations])

  // Auto-set division when type changes
  useEffect(() => {
    if (form.workCenterType && !isEdit) {
      const wct = workCenterTypes.find((t) => t.id === form.workCenterType)
      if (wct && wct.divisions.length > 0 && !form.division) {
        setForm((prev) => ({ ...prev, division: wct.divisions[0] }))
      }
    }
  }, [form.workCenterType, workCenterTypes, isEdit])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setError(null)
  }

  const handleAddCapability = () => {
    const cap = capInput.trim().toUpperCase()
    if (cap && !form.capabilities.includes(cap)) {
      setForm((prev) => ({ ...prev, capabilities: [...prev.capabilities, cap] }))
      setCapInput('')
    }
  }

  const handleRemoveCapability = (cap) => {
    setForm((prev) => ({
      ...prev,
      capabilities: prev.capabilities.filter((c) => c !== cap),
    }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    if (!form.workCenterType) {
      setError('Work center type is required')
      return
    }
    if (!form.locationId) {
      setError('Location is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        ...(form.id && !isEdit ? { id: form.id } : {}),
        name: form.name.trim(),
        locationId: form.locationId,
        division: form.division || undefined,
        workCenterType: form.workCenterType,
        capabilities: form.capabilities,
        maxThicknessInches: parseFloat(form.maxThicknessInches) || 12,
        isOnline: form.isOnline,
      }

      await onSubmit(payload, isEdit ? editData.id : null)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedType = workCenterTypes.find((t) => t.id === form.workCenterType)
  const TypeIcon = selectedType ? (ICON_MAP[selectedType.icon] || ICON_MAP.Settings) : ICON_MAP.Settings

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: selectedType
                ? alpha(selectedType.color, 0.15)
                : 'action.hover',
              color: selectedType?.color || 'text.secondary',
            }}
          >
            <TypeIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {isEdit ? 'Edit Work Center' : 'Create Work Center'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEdit
                ? `Editing ${editData?.name}`
                : 'Add a new work center to the shop floor'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Work Center Type */}
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Work Center Type</InputLabel>
              <Select
                value={form.workCenterType}
                label="Work Center Type"
                onChange={handleChange('workCenterType')}
                disabled={isEdit}
              >
                {workCenterTypes
                  .filter((t) => t.isActive)
                  .map((t) => {
                    const Icon = ICON_MAP[t.icon] || ICON_MAP.Settings
                    return (
                      <MenuItem key={t.id} value={t.id}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Icon sx={{ color: t.color, fontSize: 20 }} />
                          <span>{t.label}</span>
                          <Chip
                            label={t.id}
                            size="small"
                            sx={{
                              bgcolor: alpha(t.color, 0.1),
                              color: t.color,
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        </Stack>
                      </MenuItem>
                    )
                  })}
              </Select>
            </FormControl>
          </Grid>

          {/* Name */}
          <Grid item xs={12} sm={8}>
            <TextField
              label="Work Center Name"
              value={form.name}
              onChange={handleChange('name')}
              fullWidth
              required
              placeholder="e.g. Band Saw #3, CNC Router Plastics"
            />
          </Grid>

          {/* Custom ID (create only) */}
          {!isEdit && (
            <Grid item xs={12} sm={4}>
              <TextField
                label="Custom ID (optional)"
                value={form.id}
                onChange={handleChange('id')}
                fullWidth
                placeholder="Auto-generated"
                helperText="Leave blank for auto-ID"
              />
            </Grid>
          )}

          {/* Location */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Location</InputLabel>
              <Select
                value={form.locationId}
                label="Location"
                onChange={handleChange('locationId')}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name} ({loc.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Division */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Division</InputLabel>
              <Select
                value={form.division}
                label="Division"
                onChange={handleChange('division')}
              >
                {divisions.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: d.color,
                        }}
                      />
                      <span>{d.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Max Thickness */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Max Thickness"
              type="number"
              value={form.maxThicknessInches}
              onChange={handleChange('maxThicknessInches')}
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">in</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.25 }}
            />
          </Grid>

          {/* Online Toggle */}
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isOnline}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isOnline: e.target.checked }))
                  }
                  color="success"
                />
              }
              label={form.isOnline ? 'Online' : 'Offline'}
              sx={{ mt: 1 }}
            />
          </Grid>

          {/* Capabilities */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Capabilities
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                size="small"
                value={capInput}
                onChange={(e) => setCapInput(e.target.value)}
                placeholder="Add capability (e.g. THICK_PLATE)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCapability()
                  }
                }}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddCapability}
                disabled={!capInput.trim()}
              >
                Add
              </Button>
            </Stack>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {form.capabilities.map((cap) => (
                <Chip
                  key={cap}
                  label={cap}
                  size="small"
                  onDelete={() => handleRemoveCapability(cap)}
                  sx={{ mb: 0.5 }}
                />
              ))}
              {form.capabilities.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  No capabilities added yet
                </Typography>
              )}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} startIcon={<CloseIcon />} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : isEdit ? <SaveIcon /> : <AddIcon />}
          disabled={saving}
        >
          {isEdit ? 'Save Changes' : 'Create Work Center'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
