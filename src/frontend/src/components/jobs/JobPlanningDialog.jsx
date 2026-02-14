import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Box,
  Typography,
  IconButton,
  Chip,
  Paper,
  Divider,
  Alert,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  PlaylistAdd as RoutingIcon,
  Assignment as JobIcon,
  Schedule as ScheduleIcon,
  PrecisionManufacturing as MachineIcon,
} from '@mui/icons-material'
import { getWorkCenterTypes, getLocations, getDivisions } from '../../services/dispatchApi'

const SKILL_LEVELS = [
  { value: 'NOVICE', label: 'Novice' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'EXPERT', label: 'Expert' },
]

const JobPlanningDialog = ({ open, job, onClose, onSave }) => {
  // Available data from dispatch engine
  const [workCenterTypes, setWorkCenterTypes] = useState([])
  const [locations, setLocations] = useState([])
  const [divisions, setDivisions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Planning form state
  const [operations, setOperations] = useState([])
  const [division, setDivision] = useState('METALS')
  const [locationId, setLocationId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [materialCode, setMaterialCode] = useState('')
  const [commodity, setCommodity] = useState('METALS')
  const [thickness, setThickness] = useState('')
  const [form, setForm] = useState('PLATE')
  const [grade, setGrade] = useState('')

  // Load available work center types, locations, divisions
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  // Pre-fill from job data when dialog opens
  useEffect(() => {
    if (job && open) {
      setMaterialCode(job.material || job.instructions || '')
      // Set due date to 7 days from now if not set
      const defaultDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      setDueDate(job.dueDate ? job.dueDate.split('T')[0] : defaultDue.toISOString().split('T')[0])
      // Reset operations when opening a new job
      setOperations([])
      setError(null)
    }
  }, [job, open])

  const loadData = async () => {
    try {
      const [types, locs, divs] = await Promise.all([
        getWorkCenterTypes(true),
        getLocations(),
        getDivisions(),
      ])
      setWorkCenterTypes(types || [])
      setLocations(locs || [])
      setDivisions(divs || [])
      // Default to first available location
      if (locs && locs.length > 0 && !locationId) {
        setLocationId(locs[0].id)
      }
    } catch (err) {
      console.error('Failed to load planning data:', err)
      setError('Failed to load work center types. Make sure the server is running.')
    }
  }

  const addOperation = () => {
    setOperations((prev) => [
      ...prev,
      {
        id: Date.now(),
        workCenterType: '',
        name: '',
        skillLevel: 'STANDARD',
      },
    ])
  }

  const removeOperation = (id) => {
    setOperations((prev) => prev.filter((op) => op.id !== id))
  }

  const updateOperation = (id, field, value) => {
    setOperations((prev) =>
      prev.map((op) => {
        if (op.id !== id) return op
        const updated = { ...op, [field]: value }
        // Auto-generate name when work center type changes
        if (field === 'workCenterType' && value) {
          const type = workCenterTypes.find((t) => t.id === value)
          if (type && !op.name) {
            updated.name = type.label
          }
        }
        return updated
      })
    )
  }

  const moveOperation = (idx, direction) => {
    if (
      (direction === -1 && idx === 0) ||
      (direction === 1 && idx === operations.length - 1)
    ) {
      return
    }
    const newOps = [...operations]
    const temp = newOps[idx]
    newOps[idx] = newOps[idx + direction]
    newOps[idx + direction] = temp
    setOperations(newOps)
  }

  const handleSave = async () => {
    // Validate
    if (operations.length === 0) {
      setError('Add at least one routing operation')
      return
    }
    const invalidOps = operations.filter((op) => !op.workCenterType)
    if (invalidOps.length > 0) {
      setError('All operations must have a work center type selected')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const planData = {
        operations: operations.map((op) => ({
          workCenterType: op.workCenterType,
          name: op.name || `${op.workCenterType} Operation`,
          skillLevel: op.skillLevel || 'STANDARD',
        })),
        division,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        materialCode: materialCode || undefined,
        commodity,
        thickness: thickness ? parseFloat(thickness) : 0.5,
        form,
        grade: grade || undefined,
        locationId,
      }

      await onSave(job.id, planData)
    } catch (err) {
      setError(err.message || 'Failed to plan job')
    } finally {
      setLoading(false)
    }
  }

  // Quick-add common routing templates
  const addTemplate = (templateOps) => {
    const newOps = templateOps.map((op, i) => ({
      id: Date.now() + i,
      workCenterType: op.type,
      name: op.name,
      skillLevel: op.skill || 'STANDARD',
    }))
    setOperations(newOps)
  }

  const ROUTING_TEMPLATES = [
    {
      label: 'Saw → Deburr → Pack',
      ops: [
        { type: 'SAW', name: 'Cut to Size' },
        { type: 'DEBURR', name: 'Deburr Edges' },
        { type: 'PACKOUT', name: 'Pack & Ship' },
      ],
    },
    {
      label: 'Shear → Pack',
      ops: [
        { type: 'SHEAR', name: 'Shear to Size' },
        { type: 'PACKOUT', name: 'Pack & Ship' },
      ],
    },
    {
      label: 'Waterjet → Deburr → Pack',
      ops: [
        { type: 'WATERJET', name: 'Waterjet Cut', skill: 'EXPERT' },
        { type: 'DEBURR', name: 'Deburr & Finish' },
        { type: 'PACKOUT', name: 'Pack & Label' },
      ],
    },
    {
      label: 'Slitter → Pack',
      ops: [
        { type: 'SLITTER', name: 'Slit Coil' },
        { type: 'PACKOUT', name: 'Pack & Ship' },
      ],
    },
    {
      label: 'CTL → Leveler → Pack',
      ops: [
        { type: 'CTL_LINE', name: 'Cut to Length' },
        { type: 'LEVELER', name: 'Level Sheets' },
        { type: 'PACKOUT', name: 'Pack & Ship' },
      ],
    },
    {
      label: 'Plasma → Deburr → Pack',
      ops: [
        { type: 'PLASMA', name: 'Plasma Cut', skill: 'EXPERT' },
        { type: 'DEBURR', name: 'Deburr Edges' },
        { type: 'PACKOUT', name: 'Pack & Ship' },
      ],
    },
    {
      label: 'Laser → Bend → Pack',
      ops: [
        { type: 'LASER', name: 'Laser Cut', skill: 'EXPERT' },
        { type: 'BEND', name: 'Press Brake Bend' },
        { type: 'PACKOUT', name: 'Pack & Ship' },
      ],
    },
  ]

  if (!job) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <JobIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="span">
            Plan Job: {job.jobNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            {job.customerName} — {job.material || job.processingType || 'No material specified'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Job Details Section */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
          Material & Location
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Material Code"
            value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            size="small"
            fullWidth
            placeholder="e.g., A36-PL-0.5x48x96"
          />
          <TextField
            label="Thickness (in)"
            type="number"
            value={thickness}
            onChange={(e) => setThickness(e.target.value)}
            size="small"
            sx={{ width: 140 }}
            inputProps={{ step: 0.001, min: 0 }}
          />
          <TextField
            label="Grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            size="small"
            sx={{ width: 140 }}
            placeholder="e.g., A36"
          />
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <TextField
            select
            label="Division"
            value={division}
            onChange={(e) => {
              setDivision(e.target.value)
              setCommodity(e.target.value)
            }}
            size="small"
            sx={{ minWidth: 140 }}
          >
            {divisions.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.label}
              </MenuItem>
            ))}
            {divisions.length === 0 && (
              <MenuItem value="METALS">Metals</MenuItem>
            )}
          </TextField>
          <TextField
            select
            label="Form"
            value={form}
            onChange={(e) => setForm(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          >
            {['PLATE', 'SHEET', 'BAR', 'COIL', 'TUBE', 'ANGLE', 'BEAM'].map((f) => (
              <MenuItem key={f} value={f}>{f}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          >
            {locations.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>
                {loc.name} ({loc.id})
              </MenuItem>
            ))}
            {locations.length === 0 && (
              <MenuItem value="" disabled>No locations available</MenuItem>
            )}
          </TextField>
          <TextField
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Routing Operations Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RoutingIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              Routing Operations
            </Typography>
            <Chip label={`${operations.length} steps`} size="small" color="primary" variant="outlined" />
          </Box>
          <Button
            startIcon={<AddIcon />}
            onClick={addOperation}
            size="small"
            variant="outlined"
          >
            Add Step
          </Button>
        </Box>

        {/* Quick Templates */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
            Templates:
          </Typography>
          {ROUTING_TEMPLATES.map((tpl) => (
            <Chip
              key={tpl.label}
              label={tpl.label}
              size="small"
              variant="outlined"
              onClick={() => addTemplate(tpl.ops)}
              sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
            />
          ))}
        </Box>

        {/* Operations List */}
        {operations.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: 'center',
              color: 'text.disabled',
              borderStyle: 'dashed',
            }}
          >
            <MachineIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">
              No routing operations yet. Click "Add Step" or select a template above.
            </Typography>
          </Paper>
        ) : (
          <List dense disablePadding>
            {operations.map((op, idx) => (
              <ListItem
                key={op.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: 'background.paper',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Chip
                    label={idx + 1}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700, width: 28, height: 28 }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        select
                        label="Work Center Type"
                        value={op.workCenterType}
                        onChange={(e) => updateOperation(op.id, 'workCenterType', e.target.value)}
                        size="small"
                        sx={{ minWidth: 180 }}
                        required
                      >
                        {workCenterTypes.map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: type.color,
                                }}
                              />
                              {type.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="Operation Name"
                        value={op.name}
                        onChange={(e) => updateOperation(op.id, 'name', e.target.value)}
                        size="small"
                        sx={{ minWidth: 180, flex: 1 }}
                        placeholder="e.g., Cut to Size"
                      />
                      <TextField
                        select
                        label="Skill Level"
                        value={op.skillLevel}
                        onChange={(e) => updateOperation(op.id, 'skillLevel', e.target.value)}
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        {SKILL_LEVELS.map((sl) => (
                          <MenuItem key={sl.value} value={sl.value}>
                            {sl.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Move up">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => moveOperation(idx, -1)}
                        disabled={idx === 0}
                      >
                        <UpIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move down">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => moveOperation(idx, 1)}
                        disabled={idx === operations.length - 1}
                      >
                        <DownIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Remove">
                    <IconButton
                      size="small"
                      onClick={() => removeOperation(op.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Planning will move this job to "Planned Jobs" and populate the Shop Floor queue.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || operations.length === 0}
            startIcon={<ScheduleIcon />}
          >
            {loading ? 'Planning...' : 'Plan Job'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default JobPlanningDialog
