/**
 * Manage Work Center Types Dialog
 * Allows adding/editing/deactivating work center types with icon, color, and division config
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
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Divider,
  Collapse,
  CircularProgress,
  alpha,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Category as CategoryIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { ICON_MAP, AVAILABLE_ICONS } from './iconMap'

// Curated color palette for work center types
const COLOR_PALETTE = [
  '#1976d2', '#0288d1', '#7b1fa2', '#00838f', '#558b2f', '#e65100',
  '#E91E63', '#9C27B0', '#3F51B5', '#00BCD4', '#FF5722', '#d32f2f',
  '#c62828', '#795548', '#607D8B', '#455A64', '#2E7D32', '#F57F17',
  '#1565c0', '#AD1457', '#4A148C', '#006064', '#33691E', '#BF360C',
]

function TypeForm({ initialData, divisions, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    id: '',
    label: '',
    icon: 'Settings',
    color: '#1976d2',
    description: '',
    divisions: [],
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        id: initialData.id || '',
        label: initialData.label || '',
        icon: initialData.icon || 'Settings',
        color: initialData.color || '#1976d2',
        description: initialData.description || '',
        divisions: initialData.divisions || [],
      })
    }
  }, [initialData])

  const isEdit = Boolean(initialData?.id && initialData?._isEdit)

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleDivisionToggle = (divId) => {
    setForm((prev) => ({
      ...prev,
      divisions: prev.divisions.includes(divId)
        ? prev.divisions.filter((d) => d !== divId)
        : [...prev.divisions, divId],
    }))
  }

  const handleSubmit = () => {
    if (!form.label.trim()) return
    if (!isEdit && !form.id.trim()) {
      // Auto-generate ID from label
      form.id = form.label.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    }
    onSave(form, isEdit)
  }

  const SelectedIcon = ICON_MAP[form.icon] || ICON_MAP.Settings

  return (
    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom fontWeight={700}>
        {isEdit ? 'Edit Type' : 'New Work Center Type'}
      </Typography>
      <Grid container spacing={2}>
        {!isEdit && (
          <Grid item xs={12} sm={4}>
            <TextField
              label="Type ID"
              value={form.id}
              onChange={handleChange('id')}
              fullWidth
              size="small"
              placeholder="e.g. LASER"
              helperText="Auto-generated if blank"
            />
          </Grid>
        )}
        <Grid item xs={12} sm={isEdit ? 6 : 4}>
          <TextField
            label="Display Label"
            value={form.label}
            onChange={handleChange('label')}
            fullWidth
            size="small"
            required
            placeholder="e.g. Laser Cutter"
          />
        </Grid>
        <Grid item xs={12} sm={isEdit ? 6 : 4}>
          <TextField
            label="Description"
            value={form.description}
            onChange={handleChange('description')}
            fullWidth
            size="small"
            placeholder="Brief description"
          />
        </Grid>

        {/* Icon Selector */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Icon</InputLabel>
            <Select
              value={form.icon}
              label="Icon"
              onChange={handleChange('icon')}
              renderValue={(value) => {
                const Icon = ICON_MAP[value] || ICON_MAP.Settings
                return (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Icon sx={{ fontSize: 20, color: form.color }} />
                    <span>{value}</span>
                  </Stack>
                )
              }}
            >
              {AVAILABLE_ICONS.map((iconName) => {
                const Icon = ICON_MAP[iconName]
                return (
                  <MenuItem key={iconName} value={iconName}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Icon sx={{ fontSize: 20, color: form.color }} />
                      <span>{iconName}</span>
                    </Stack>
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Color Picker */}
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Color
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {COLOR_PALETTE.map((c) => (
              <Box
                key={c}
                onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: c,
                  cursor: 'pointer',
                  border: form.color === c ? '3px solid' : '2px solid transparent',
                  borderColor: form.color === c ? 'text.primary' : 'transparent',
                  transition: 'all 0.15s',
                  '&:hover': { transform: 'scale(1.3)' },
                }}
              />
            ))}
          </Stack>
        </Grid>

        {/* Divisions */}
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary">
            Applicable Divisions
          </Typography>
          <FormGroup row>
            {divisions.map((d) => (
              <FormControlLabel
                key={d.id}
                control={
                  <Checkbox
                    checked={form.divisions.includes(d.id)}
                    onChange={() => handleDivisionToggle(d.id)}
                    size="small"
                  />
                }
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: d.color,
                      }}
                    />
                    <span>{d.label}</span>
                  </Stack>
                }
              />
            ))}
          </FormGroup>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button size="small" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={!form.label.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        >
          {isEdit ? 'Update' : 'Add Type'}
        </Button>
      </Stack>

      {/* Preview */}
      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">Preview</Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
          <Avatar sx={{ bgcolor: alpha(form.color, 0.15), color: form.color, width: 36, height: 36 }}>
            <SelectedIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{form.label || 'Type Name'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {form.id || 'TYPE_ID'} • {form.divisions.join(', ') || 'No divisions'}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}

export default function ManageWorkCenterTypesDialog({
  open,
  onClose,
  workCenterTypes = [],
  divisions = [],
  onCreateType,
  onUpdateType,
  onDeleteType,
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async (formData, isEdit) => {
    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        await onUpdateType(formData.id, {
          label: formData.label,
          icon: formData.icon,
          color: formData.color,
          description: formData.description,
          divisions: formData.divisions,
        })
      } else {
        await onCreateType(formData)
      }
      setShowForm(false)
      setEditingType(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (typeId) => {
    if (!window.confirm(`Deactivate work center type "${typeId}"?`)) return
    setSaving(true)
    setError(null)
    try {
      await onDeleteType(typeId)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (type) => {
    setEditingType({ ...type, _isEdit: true })
    setShowForm(true)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <CategoryIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              Manage Work Center Types
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {workCenterTypes.length} types defined • Add custom types for your operations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            onClick={() => {
              setEditingType(null)
              setShowForm(true)
            }}
            disabled={showForm}
          >
            New Type
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Inline Create/Edit Form */}
        {showForm && (
          <TypeForm
            initialData={editingType}
            divisions={divisions}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditingType(null)
            }}
            saving={saving}
          />
        )}

        {/* Types List */}
        <List disablePadding>
          {workCenterTypes.map((type, idx) => {
            const Icon = ICON_MAP[type.icon] || ICON_MAP.Settings
            return (
              <React.Fragment key={type.id}>
                {idx > 0 && <Divider />}
                <ListItem
                  sx={{
                    opacity: type.isActive ? 1 : 0.5,
                    py: 1.5,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: alpha(type.color, 0.15),
                        color: type.color,
                      }}
                    >
                      <Icon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={600}>{type.label}</Typography>
                        <Chip
                          label={type.id}
                          size="small"
                          sx={{
                            bgcolor: alpha(type.color, 0.1),
                            color: type.color,
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                        {!type.isActive && (
                          <Chip label="INACTIVE" size="small" color="default" />
                        )}
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {type.description || 'No description'}
                        </Typography>
                        {type.divisions.length > 0 && (
                          <>
                            <Typography variant="caption" color="text.secondary">•</Typography>
                            {type.divisions.map((d) => (
                              <Chip key={d} label={d} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                            ))}
                          </>
                        )}
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(type)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {type.isActive && (
                      <Tooltip title="Deactivate">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(type.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            )
          })}
        </List>

        {workCenterTypes.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No work center types defined yet. Click "New Type" to add one.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
