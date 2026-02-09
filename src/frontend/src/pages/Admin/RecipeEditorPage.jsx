/**
 * RecipeEditorPage.jsx — Admin page for managing Processing Recipes & Time Standards.
 *
 * Route: /admin/processing-recipes
 *
 * Features:
 *   - List all recipes with filters (division, operation type, status, search)
 *   - Create / edit / activate / deprecate recipes
 *   - Inline time preview with material & thickness modifiers
 *   - Routing template viewer
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box, Paper, Typography, Button, Grid, Chip, IconButton, Tooltip,
  CircularProgress, Alert, Snackbar, TextField, MenuItem, Select,
  FormControl, InputLabel, InputAdornment, Tabs, Tab, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Divider, Switch,
  FormControlLabel, Slider, Dialog, DialogTitle, DialogContent, DialogActions,
  Accordion, AccordionSummary, AccordionDetails, Stack, Breadcrumbs,
  Link as MuiLink, Avatar, Badge,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Schedule as DraftIcon,
  Block as DeprecatedIcon,
  ContentCut as CutIcon,
  Straighten as FormIcon,
  PrecisionManufacturing as MachineIcon,
  AutoFixHigh as FinishIcon,
  Thermostat as HeatIcon,
  VerifiedUser as InspectIcon,
  ExpandMore as ExpandIcon,
  PlayArrow as ActivateIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  ArrowBack as BackIcon,
  Close as CloseIcon,
  FileCopy as DuplicateIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

import {
  listRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe,
  activateRecipe, listRoutingTemplates,
  OPERATION_TYPE, OPERATION_TYPE_LABELS, RECIPE_STATUS,
  TOLERANCE_CLASS, MATERIAL_MODIFIERS, THICKNESS_BANDS,
  estimateRecipeTime, formatMinutes,
} from '../../services/processingRecipesApi'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const OP_TYPE_ICONS = {
  [OPERATION_TYPE.CUT]:        <CutIcon />,
  [OPERATION_TYPE.FORM]:       <FormIcon />,
  [OPERATION_TYPE.MACHINE]:    <MachineIcon />,
  [OPERATION_TYPE.FINISH]:     <FinishIcon />,
  [OPERATION_TYPE.HEAT_TREAT]: <HeatIcon />,
  [OPERATION_TYPE.INSPECT]:    <InspectIcon />,
}

const OP_TYPE_COLORS = {
  [OPERATION_TYPE.CUT]:        '#e65100',
  [OPERATION_TYPE.FORM]:       '#1565c0',
  [OPERATION_TYPE.MACHINE]:    '#6a1b9a',
  [OPERATION_TYPE.FINISH]:     '#2e7d32',
  [OPERATION_TYPE.HEAT_TREAT]: '#d84315',
  [OPERATION_TYPE.INSPECT]:    '#00695c',
}

const STATUS_CONFIG = {
  [RECIPE_STATUS.DRAFT]:      { label: 'Draft',      color: 'default', icon: <DraftIcon fontSize="inherit" /> },
  [RECIPE_STATUS.ACTIVE]:     { label: 'Active',     color: 'success', icon: <ActiveIcon fontSize="inherit" /> },
  [RECIPE_STATUS.DEPRECATED]: { label: 'Deprecated', color: 'error',   icon: <DeprecatedIcon fontSize="inherit" /> },
}

const DIVISIONS = ['METALS', 'PLASTICS']
const PRICE_UNITS = ['CUT', 'BEND', 'HOLE', 'EA', 'SQFT', 'IN', 'MIN', 'LB']
const FORMS = ['PLATE', 'SHEET', 'BAR', 'BEAM', 'TUBE', 'ANGLE', 'ROD', 'FABRICATION']
const WORK_CENTERS = ['SAW', 'SHEAR', 'PLASMA', 'BRAKE', 'ROLL', 'DRILL', 'GRINDER', 'DEBURR', 'CNC-ROUTER', 'PLAS-SAW', 'FURNACE', 'QA-BENCH', 'MILL', 'LASER']

const EMPTY_RECIPE = {
  code: '',
  name: '',
  description: '',
  operationType: OPERATION_TYPE.CUT,
  division: 'METALS',
  workCenter: 'SAW',
  setupMinutes: 10,
  runMinutesPerUnit: 5,
  minRunMinutes: 3,
  applicableMaterials: [],
  applicableForms: [],
  thicknessMin: 0,
  thicknessMax: 12,
  toleranceClass: TOLERANCE_CLASS.STANDARD,
  pricePerUnit: 0,
  priceUnit: 'EA',
  notes: '',
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function RecipeEditorPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0) // 0 = Recipes, 1 = Routing Templates
  const [recipes, setRecipes] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  // Filters
  const [divisionFilter, setDivisionFilter] = useState('')
  const [opTypeFilter, setOpTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [formData, setFormData] = useState({ ...EMPTY_RECIPE })
  const [saving, setSaving] = useState(false)

  // Time preview
  const [previewGrade, setPreviewGrade] = useState('A36')
  const [previewThickness, setPreviewThickness] = useState(0.5)
  const [previewUnits, setPreviewUnits] = useState(1)
  const [previewTolerance, setPreviewTolerance] = useState(TOLERANCE_CLASS.STANDARD)

  // ── Data loading ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [recipesRes, templatesRes] = await Promise.all([
        listRecipes({ division: divisionFilter || undefined, operationType: opTypeFilter || undefined, status: statusFilter || undefined, search: search || undefined }),
        listRoutingTemplates({ division: divisionFilter || undefined }),
      ])
      setRecipes(recipesRes.data)
      setTemplates(templatesRes.data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [divisionFilter, opTypeFilter, statusFilter, search])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Editor handlers ──
  const openNewRecipe = () => {
    setEditingRecipe(null)
    setFormData({ ...EMPTY_RECIPE })
    setEditorOpen(true)
  }

  const openEditRecipe = (recipe) => {
    setEditingRecipe(recipe)
    setFormData({ ...recipe })
    setEditorOpen(true)
  }

  const handleDuplicate = (recipe) => {
    setEditingRecipe(null)
    setFormData({ ...recipe, id: undefined, code: `${recipe.code}-COPY`, name: `${recipe.name} (Copy)`, status: RECIPE_STATUS.DRAFT })
    setEditorOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, formData)
        setSnack({ open: true, msg: 'Recipe updated', severity: 'success' })
      } else {
        await createRecipe(formData)
        setSnack({ open: true, msg: 'Recipe created', severity: 'success' })
      }
      setEditorOpen(false)
      fetchData()
    } catch (err) {
      setSnack({ open: true, msg: err.message, severity: 'error' })
    }
    setSaving(false)
  }

  const handleActivate = async (id) => {
    try {
      await activateRecipe(id)
      setSnack({ open: true, msg: 'Recipe activated', severity: 'success' })
      fetchData()
    } catch (err) {
      setSnack({ open: true, msg: err.message, severity: 'error' })
    }
  }

  const handleDeprecate = async (id) => {
    try {
      await deleteRecipe(id)
      setSnack({ open: true, msg: 'Recipe deprecated', severity: 'info' })
      fetchData()
    } catch (err) {
      setSnack({ open: true, msg: err.message, severity: 'error' })
    }
  }

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  // ── Time preview calculation ──
  const previewEstimate = useMemo(() => {
    if (!formData.setupMinutes && !formData.runMinutesPerUnit) return null
    return estimateRecipeTime({
      recipe: formData,
      unitCount: previewUnits,
      materialGrade: previewGrade,
      thickness: previewThickness,
      toleranceClass: previewTolerance,
    })
  }, [formData, previewGrade, previewThickness, previewUnits, previewTolerance])

  // ── Stats ──
  const stats = useMemo(() => {
    const active = recipes.filter(r => r.status === RECIPE_STATUS.ACTIVE).length
    const draft = recipes.filter(r => r.status === RECIPE_STATUS.DRAFT).length
    const deprecated = recipes.filter(r => r.status === RECIPE_STATUS.DEPRECATED).length
    return { total: recipes.length, active, draft, deprecated }
  }, [recipes])

  // ──────────────── RENDER ────────────────

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink underline="hover" color="inherit" href="/" onClick={e => { e.preventDefault(); navigate('/') }}>Home</MuiLink>
        <Typography color="text.primary">Processing Recipes</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TimerIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight={700}>Processing Recipes & Time Standards</Typography>
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<RefreshIcon />} onClick={fetchData} variant="outlined" size="small">Refresh</Button>
        <Button startIcon={<AddIcon />} onClick={openNewRecipe} variant="contained">New Recipe</Button>
      </Box>

      {/* Stats cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Recipes', value: stats.total, color: '#1976d2' },
          { label: 'Active', value: stats.active, color: '#2e7d32' },
          { label: 'Draft', value: stats.draft, color: '#ed6c02' },
          { label: 'Routing Templates', value: templates.length, color: '#6a1b9a' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${s.color}`, borderRadius: 2 }}>
              <Typography variant="h4" fontWeight={800} color={s.color}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Recipes (${recipes.length})`} icon={<TimerIcon />} iconPosition="start" />
        <Tab label={`Routing Templates (${templates.length})`} icon={<SpeedIcon />} iconPosition="start" />
      </Tabs>

      {/* Tab 0: Recipes list */}
      {tab === 0 && (
        <>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth size="small" placeholder="Search recipes…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Division</InputLabel>
                  <Select value={divisionFilter} label="Division" onChange={e => setDivisionFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Operation</InputLabel>
                  <Select value={opTypeFilter} label="Operation" onChange={e => setOpTypeFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {Object.entries(OPERATION_TYPE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Recipe table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell width={40} />
                    <TableCell><strong>Code</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Operation</strong></TableCell>
                    <TableCell><strong>Division</strong></TableCell>
                    <TableCell align="center"><strong>Setup</strong></TableCell>
                    <TableCell align="center"><strong>Run/Unit</strong></TableCell>
                    <TableCell align="center"><strong>Price</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recipes.map(recipe => {
                    const sConfig = STATUS_CONFIG[recipe.status] || STATUS_CONFIG.DRAFT
                    const opColor = OP_TYPE_COLORS[recipe.operationType] || '#666'
                    return (
                      <TableRow key={recipe.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: opColor, fontSize: 14 }}>
                            {OP_TYPE_ICONS[recipe.operationType]}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} fontFamily="monospace">{recipe.code}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{recipe.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{recipe.description}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={OPERATION_TYPE_LABELS[recipe.operationType] || recipe.operationType}
                            size="small"
                            sx={{ bgcolor: `${opColor}15`, color: opColor, fontWeight: 600, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={recipe.division} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>{recipe.setupMinutes}m</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>{recipe.runMinutesPerUnit}m</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            ${recipe.pricePerUnit?.toFixed(2)}/{recipe.priceUnit}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sConfig.label}
                            color={sConfig.color}
                            size="small"
                            icon={sConfig.icon}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditRecipe(recipe)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Duplicate"><IconButton size="small" onClick={() => handleDuplicate(recipe)}><DuplicateIcon fontSize="small" /></IconButton></Tooltip>
                          {recipe.status === RECIPE_STATUS.DRAFT && (
                            <Tooltip title="Activate"><IconButton size="small" color="success" onClick={() => handleActivate(recipe.id)}><ActivateIcon fontSize="small" /></IconButton></Tooltip>
                          )}
                          {recipe.status === RECIPE_STATUS.ACTIVE && (
                            <Tooltip title="Deprecate"><IconButton size="small" color="error" onClick={() => handleDeprecate(recipe.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {recipes.length === 0 && (
                    <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No recipes match your filters</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Tab 1: Routing Templates */}
      {tab === 1 && (
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : templates.length === 0 ? (
            <Alert severity="info">No routing templates found</Alert>
          ) : (
            templates.map(tpl => (
              <Accordion key={tpl.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography fontWeight={600}>{tpl.name}</Typography>
                    <Chip label={tpl.division} size="small" variant="outlined" />
                    <Chip label={`${tpl.steps.length} step${tpl.steps.length !== 1 ? 's' : ''}`} size="small" color="primary" variant="outlined" />
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Est. total: {formatMinutes(tpl.steps.reduce((sum, s) => sum + (s.recipe?.setupMinutes || 0) + (s.recipe?.runMinutesPerUnit || 0), 0))}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell width={40}>#</TableCell>
                        <TableCell>Operation</TableCell>
                        <TableCell>Work Center</TableCell>
                        <TableCell align="center">Setup</TableCell>
                        <TableCell align="center">Run/Unit</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tpl.steps.map(step => (
                        <TableRow key={step.seq}>
                          <TableCell>{step.seq}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {step.recipe && OP_TYPE_ICONS[step.recipe.operationType]}
                              <Box>
                                <Typography variant="body2" fontWeight={500}>{step.recipe?.name || '—'}</Typography>
                                <Typography variant="caption" color="text.secondary">{step.recipe?.code}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{step.recipe?.workCenter || '—'}</TableCell>
                          <TableCell align="center">{step.recipe?.setupMinutes || 0}m</TableCell>
                          <TableCell align="center">{step.recipe?.runMinutesPerUnit || 0}m</TableCell>
                          <TableCell>
                            {step.recipe && (
                              <Chip
                                label={STATUS_CONFIG[step.recipe.status]?.label || step.recipe.status}
                                color={STATUS_CONFIG[step.recipe.status]?.color || 'default'}
                                size="small"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>
      )}

      {/* ═══ RECIPE EDITOR DIALOG ═══ */}
      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {OP_TYPE_ICONS[formData.operationType]}
          <Typography variant="h6" fontWeight={700}>
            {editingRecipe ? `Edit Recipe: ${editingRecipe.code}` : 'New Processing Recipe'}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={() => setEditorOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Left: Form fields */}
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" fontWeight={700} color="primary">Basic Info</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField fullWidth size="small" label="Code" value={formData.code} onChange={e => updateField('code', e.target.value)} required />
                  </Grid>
                  <Grid item xs={8}>
                    <TextField fullWidth size="small" label="Name" value={formData.name} onChange={e => updateField('name', e.target.value)} required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Description" multiline rows={2} value={formData.description} onChange={e => updateField('description', e.target.value)} />
                  </Grid>
                </Grid>

                <Divider />

                <Typography variant="subtitle2" fontWeight={700} color="primary">Classification</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Operation Type</InputLabel>
                      <Select value={formData.operationType} label="Operation Type" onChange={e => updateField('operationType', e.target.value)}>
                        {Object.entries(OPERATION_TYPE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Division</InputLabel>
                      <Select value={formData.division} label="Division" onChange={e => updateField('division', e.target.value)}>
                        {DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Work Center</InputLabel>
                      <Select value={formData.workCenter} label="Work Center" onChange={e => updateField('workCenter', e.target.value)}>
                        {WORK_CENTERS.map(wc => <MenuItem key={wc} value={wc}>{wc}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Divider />

                <Typography variant="subtitle2" fontWeight={700} color="primary">Time Standards</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField fullWidth size="small" type="number" label="Setup (min)" value={formData.setupMinutes} onChange={e => updateField('setupMinutes', +e.target.value)} InputProps={{ inputProps: { min: 0 } }} />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField fullWidth size="small" type="number" label="Run/Unit (min)" value={formData.runMinutesPerUnit} onChange={e => updateField('runMinutesPerUnit', +e.target.value)} InputProps={{ inputProps: { min: 0, step: 0.5 } }} />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField fullWidth size="small" type="number" label="Min Run (min)" value={formData.minRunMinutes} onChange={e => updateField('minRunMinutes', +e.target.value)} InputProps={{ inputProps: { min: 0 } }} />
                  </Grid>
                </Grid>

                <Divider />

                <Typography variant="subtitle2" fontWeight={700} color="primary">Pricing</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField fullWidth size="small" type="number" label="Price Per Unit" value={formData.pricePerUnit} onChange={e => updateField('pricePerUnit', +e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { min: 0, step: 0.01 } }} />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Price Unit</InputLabel>
                      <Select value={formData.priceUnit} label="Price Unit" onChange={e => updateField('priceUnit', e.target.value)}>
                        {PRICE_UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Divider />

                <Typography variant="subtitle2" fontWeight={700} color="primary">Applicability</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Applicable Materials</InputLabel>
                      <Select
                        multiple value={formData.applicableMaterials || []} label="Applicable Materials"
                        onChange={e => updateField('applicableMaterials', e.target.value)}
                        renderValue={sel => sel.join(', ')}
                      >
                        {Object.keys(MATERIAL_MODIFIERS).filter(k => k !== 'DEFAULT').map(g => (
                          <MenuItem key={g} value={g}>{g} (×{MATERIAL_MODIFIERS[g]})</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Applicable Forms</InputLabel>
                      <Select
                        multiple value={formData.applicableForms || []} label="Applicable Forms"
                        onChange={e => updateField('applicableForms', e.target.value)}
                        renderValue={sel => sel.join(', ')}
                      >
                        {FORMS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField fullWidth size="small" type="number" label="Thickness Min (in)" value={formData.thicknessMin} onChange={e => updateField('thicknessMin', +e.target.value)} InputProps={{ inputProps: { min: 0, step: 0.0625 } }} />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField fullWidth size="small" type="number" label="Thickness Max (in)" value={formData.thicknessMax} onChange={e => updateField('thicknessMax', +e.target.value)} InputProps={{ inputProps: { min: 0, step: 0.0625 } }} />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tolerance Class</InputLabel>
                      <Select value={formData.toleranceClass} label="Tolerance Class" onChange={e => updateField('toleranceClass', e.target.value)}>
                        {Object.keys(TOLERANCE_CLASS).map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TextField fullWidth size="small" label="Notes" multiline rows={2} value={formData.notes} onChange={e => updateField('notes', e.target.value)} />
              </Stack>
            </Grid>

            {/* Right: Time preview */}
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', position: 'sticky', top: 16 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon fontSize="small" color="primary" /> Live Time Preview
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Material Grade</InputLabel>
                        <Select value={previewGrade} label="Material Grade" onChange={e => setPreviewGrade(e.target.value)}>
                          {Object.keys(MATERIAL_MODIFIERS).filter(k => k !== 'DEFAULT').map(g => (
                            <MenuItem key={g} value={g}>{g} (×{MATERIAL_MODIFIERS[g]})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tolerance</InputLabel>
                        <Select value={previewTolerance} label="Tolerance" onChange={e => setPreviewTolerance(e.target.value)}>
                          {Object.keys(TOLERANCE_CLASS).map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Thickness: {previewThickness}"</Typography>
                    <Slider
                      value={previewThickness} onChange={(_, v) => setPreviewThickness(v)}
                      min={0.0625} max={8} step={0.0625} valueLabelDisplay="auto"
                      marks={THICKNESS_BANDS.map(b => ({ value: b.min || 0.0625, label: b.label.split('(')[0].trim() }))}
                      sx={{ '& .MuiSlider-markLabel': { fontSize: '0.65rem', whiteSpace: 'nowrap' } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Units: {previewUnits}</Typography>
                    <Slider
                      value={previewUnits} onChange={(_, v) => setPreviewUnits(v)}
                      min={1} max={50} step={1} valueLabelDisplay="auto"
                    />
                  </Box>

                  {previewEstimate && (
                    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '2px solid', borderColor: 'primary.light' }}>
                      <Typography variant="h3" fontWeight={800} color="primary.main" textAlign="center">
                        {formatMinutes(previewEstimate.totalMinutes)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                        Estimated total time
                      </Typography>
                      <Divider sx={{ my: 1.5 }} />
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Setup</Typography>
                          <Typography variant="body2" fontWeight={600}>{previewEstimate.setupMinutes} min</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Run</Typography>
                          <Typography variant="body2" fontWeight={600}>{previewEstimate.runMinutes} min</Typography>
                        </Grid>
                      </Grid>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="caption" fontWeight={600} gutterBottom display="block">Modifier Factors</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip size="small" label={`Material ×${previewEstimate.factors.material}`}
                          color={previewEstimate.factors.material > 1.2 ? 'warning' : 'default'} variant="outlined" />
                        <Chip size="small" label={`Thickness ×${previewEstimate.factors.thickness}`}
                          color={previewEstimate.factors.thickness > 1.2 ? 'warning' : 'default'} variant="outlined" />
                        <Chip size="small" label={`Tolerance ×${previewEstimate.factors.tolerance}`}
                          color={previewEstimate.factors.tolerance > 1.2 ? 'warning' : 'default'} variant="outlined" />
                      </Box>
                    </Paper>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || !formData.code || !formData.name}>
            {saving ? 'Saving…' : editingRecipe ? 'Update Recipe' : 'Create Recipe'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
