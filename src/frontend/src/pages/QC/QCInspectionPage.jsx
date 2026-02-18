import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import {
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  Warning as WarningIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon,
  ExpandMore as ExpandIcon,
  Build as ReworkIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  FactCheck as QCIcon,
  Info as InfoIcon,
  Straighten as DimensionIcon,
  Visibility as VisualIcon,
  BugReport as DefectIcon,
  Print as PrintIcon,
} from '@mui/icons-material'
import {
  getInspection,
  updateInspection,
  passInspection,
  failInspection,
  reworkInspection,
  conditionalPassInspection,
  getInspectors,
} from '../../api/qc'

const resultColor = { PASS: 'success', FAIL: 'error', CONDITIONAL: 'warning' }

export default function QCInspectionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState(null)
  const [inspectors, setInspectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Editable state
  const [checklist, setChecklist] = useState([])
  const [dimensionalChecks, setDimensionalChecks] = useState([])
  const [visualNotes, setVisualNotes] = useState('')
  const [defects, setDefects] = useState([])
  const [notes, setNotes] = useState('')

  // Disposition dialog
  const [dispositionDialog, setDispositionDialog] = useState({ open: false, action: null })
  const [dispositionNotes, setDispositionNotes] = useState('')
  const [reworkInstructions, setReworkInstructions] = useState('')
  const [conditions, setConditions] = useState('')
  const [commitDisposition, setCommitDisposition] = useState('PENDING')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [inspRes, inspectorsRes] = await Promise.all([
        getInspection(id),
        getInspectors(),
      ])
      const data = inspRes.data
      setInspection(data)
      setChecklist(data.checklist || [])
      setDimensionalChecks(data.dimensionalChecks || [])
      setVisualNotes(data.visualNotes || '')
      setDefects(data.defects || [])
      setNotes(data.notes || '')
      setInspectors(inspectorsRes.data || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load inspection')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      await updateInspection(id, {
        checklist,
        dimensionalChecks: dimensionalChecks.length > 0 ? dimensionalChecks : undefined,
        visualNotes: visualNotes || undefined,
        defects: defects.length > 0 ? defects : undefined,
        notes: notes || undefined,
        status: 'IN_PROGRESS',
      })
      setSuccessMsg('Inspection saved')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleChecklistChange = (index, field, value) => {
    setChecklist(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleDispositionSubmit = async () => {
    const { action } = dispositionDialog
    try {
      setSaving(true)
      setError(null)

      // Save current state first
      await updateInspection(id, { checklist, dimensionalChecks, visualNotes, defects, notes })

      if (action === 'pass') {
        await passInspection(id, { notes: dispositionNotes, checklist, dimensionalChecks })
      } else if (action === 'fail') {
        await failInspection(id, {
          notes: dispositionNotes,
          defects,
          disposition: commitDisposition,
          reworkInstructions,
        })
      } else if (action === 'rework') {
        await reworkInspection(id, {
          reworkInstructions,
          notes: dispositionNotes,
        })
      } else if (action === 'conditional') {
        await conditionalPassInspection(id, {
          notes: dispositionNotes,
          conditions,
        })
      }

      setDispositionDialog({ open: false, action: null })
      setSuccessMsg(`Inspection ${action === 'pass' ? 'PASSED' : action === 'fail' ? 'FAILED' : action === 'rework' ? 'sent for REWORK' : 'CONDITIONAL PASS'}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action}`)
    } finally {
      setSaving(false)
    }
  }

  const addDimensionalCheck = () => {
    setDimensionalChecks(prev => [
      ...prev,
      { dimension: '', nominal: '', tolerance: '', actual: '', pass: null },
    ])
  }

  const handleDimChange = (index, field, value) => {
    setDimensionalChecks(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      // Auto-calc pass/fail
      if (field === 'actual' || field === 'nominal' || field === 'tolerance') {
        const nom = parseFloat(updated[index].nominal)
        const tol = parseFloat(updated[index].tolerance)
        const act = parseFloat(updated[index].actual)
        if (!isNaN(nom) && !isNaN(tol) && !isNaN(act)) {
          updated[index].pass = Math.abs(act - nom) <= tol
        }
      }
      return updated
    })
  }

  const addDefect = () => {
    setDefects(prev => [...prev, { type: '', severity: 'MINOR', description: '', location: '' }])
  }

  const handleDefectChange = (index, field, value) => {
    setDefects(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeDefect = (index) => {
    setDefects(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!inspection) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Inspection not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/qc')} sx={{ mt: 2 }}>
          Back to QC Dashboard
        </Button>
      </Box>
    )
  }

  const isReadOnly = ['PASSED', 'FAILED'].includes(inspection.status)
  const job = inspection.job
  const allChecksDone = checklist.every(c => c.result !== null)
  const allChecksPassed = checklist.filter(c => c.required).every(c => c.result === 'PASS')
  const hasFailedChecks = checklist.some(c => c.required && c.result === 'FAIL')
  const checklistProgress = checklist.length > 0
    ? Math.round((checklist.filter(c => c.result !== null).length / checklist.length) * 100)
    : 0

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/qc')} sx={{ mb: 1 }}>
            Back to QC Dashboard
          </Button>
          <Typography variant="h4" fontWeight={700}>
            <QCIcon sx={{ mr: 1, verticalAlign: 'bottom', fontSize: 36 }} />
            {inspection.inspectionNumber}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Chip label={inspection.status} color={resultColor[inspection.overallResult] || 'default'} />
            <Chip label={inspection.inspectionType} variant="outlined" />
            {inspection.overallResult && (
              <Chip label={inspection.overallResult} color={resultColor[inspection.overallResult]} />
            )}
          </Stack>
        </Box>
        {!isReadOnly && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              Save Progress
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </Stack>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>}

      <Grid container spacing={3}>
        {/* Left Column — Job Info */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              <InfoIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
              Job Information
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <InfoRow label="Job Number" value={job?.jobNumber} />
            <InfoRow label="Operation" value={job?.operationType} />
            <InfoRow label="Order" value={job?.order?.orderNumber} />
            <InfoRow label="Work Center" value={job?.workCenter?.name} />
            <InfoRow label="Priority" value={`P${job?.priority}`} />
            <InfoRow label="Status" value={job?.status} />
            {job?.instructions && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">Instructions:</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                  {job.instructions}
                </Typography>
              </>
            )}
            {job?.notes && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">Job Notes:</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                  {job.notes}
                </Typography>
              </>
            )}
          </Paper>

          {/* Operations Summary */}
          {job?.dispatchJob?.operations?.length > 0 && (
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Production Operations
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {job.dispatchJob.operations.map((op, i) => (
                <Box key={op.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                  <Typography variant="body2" fontSize={13}>
                    {i + 1}. {op.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={op.status}
                    color={op.status === 'COMPLETE' ? 'success' : 'default'}
                  />
                </Box>
              ))}
            </Paper>
          )}

          {/* Inspector */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Inspector
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            {inspection.inspector ? (
              <Typography variant="body2">
                {inspection.inspector.firstName} {inspection.inspector.lastName}
                {inspection.inspector.employeeCode && ` (${inspection.inspector.employeeCode})`}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">Unassigned</Typography>
            )}
            {inspection.startedAt && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Started: {new Date(inspection.startedAt).toLocaleString()}
              </Typography>
            )}
            {inspection.completedAt && (
              <Typography variant="caption" color="text.secondary" display="block">
                Completed: {new Date(inspection.completedAt).toLocaleString()}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Column — Inspection Form */}
        <Grid item xs={12} md={8}>
          {/* Checklist Progress */}
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Inspection Checklist
              </Typography>
              <Chip
                label={`${checklistProgress}% complete`}
                color={checklistProgress === 100 ? (hasFailedChecks ? 'error' : 'success') : 'default'}
                size="small"
              />
            </Box>
            <Divider sx={{ mb: 1.5 }} />

            {checklist.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1,
                  px: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: item.result === 'PASS' ? 'success.50' : item.result === 'FAIL' ? 'error.50' : 'transparent',
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={item.required ? 600 : 400}>
                    {item.required && <span style={{ color: 'red' }}>* </span>}
                    {item.item}
                  </Typography>
                </Box>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={item.result}
                  onChange={(_, val) => !isReadOnly && val !== null && handleChecklistChange(index, 'result', val)}
                  disabled={isReadOnly}
                >
                  <ToggleButton value="PASS" color="success" sx={{ px: 1.5 }}>
                    <PassIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="FAIL" color="error" sx={{ px: 1.5 }}>
                    <FailIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="N/A" sx={{ px: 1.5, fontSize: 11 }}>
                    N/A
                  </ToggleButton>
                </ToggleButtonGroup>
                <TextField
                  size="small"
                  placeholder="Notes"
                  value={item.notes || ''}
                  onChange={(e) => handleChecklistChange(index, 'notes', e.target.value)}
                  disabled={isReadOnly}
                  sx={{ width: 150 }}
                />
              </Box>
            ))}
          </Paper>

          {/* Dimensional Checks */}
          <Accordion defaultExpanded={dimensionalChecks.length > 0}>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <DimensionIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography fontWeight={600}>Dimensional Checks ({dimensionalChecks.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {dimensionalChecks.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Dimension</TableCell>
                        <TableCell>Nominal</TableCell>
                        <TableCell>Tolerance (±)</TableCell>
                        <TableCell>Actual</TableCell>
                        <TableCell align="center">Pass?</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dimensionalChecks.map((dim, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <TextField
                              size="small"
                              value={dim.dimension}
                              onChange={(e) => handleDimChange(i, 'dimension', e.target.value)}
                              placeholder="e.g. Width"
                              disabled={isReadOnly}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={dim.nominal}
                              onChange={(e) => handleDimChange(i, 'nominal', e.target.value)}
                              disabled={isReadOnly}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={dim.tolerance}
                              onChange={(e) => handleDimChange(i, 'tolerance', e.target.value)}
                              disabled={isReadOnly}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={dim.actual}
                              onChange={(e) => handleDimChange(i, 'actual', e.target.value)}
                              disabled={isReadOnly}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {dim.pass === true && <PassIcon color="success" />}
                            {dim.pass === false && <FailIcon color="error" />}
                            {dim.pass === null && '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {!isReadOnly && (
                <Button size="small" onClick={addDimensionalCheck} sx={{ mt: 1 }}>
                  + Add Dimensional Check
                </Button>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Visual Inspection */}
          <Accordion defaultExpanded={!!visualNotes}>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <VisualIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography fontWeight={600}>Visual Inspection Notes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={visualNotes}
                onChange={(e) => setVisualNotes(e.target.value)}
                placeholder="Describe visual inspection findings: surface condition, markings, coatings, etc."
                disabled={isReadOnly}
              />
            </AccordionDetails>
          </Accordion>

          {/* Defects */}
          <Accordion defaultExpanded={defects.length > 0}>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <DefectIcon sx={{ mr: 1, color: 'error.main' }} />
              <Typography fontWeight={600}>Defects ({defects.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {defects.map((defect, i) => (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{ p: 1.5, mb: 1, borderColor: defect.severity === 'CRITICAL' ? 'error.main' : 'divider' }}
                >
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Defect Type"
                        value={defect.type}
                        onChange={(e) => handleDefectChange(i, 'type', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        label="Severity"
                        value={defect.severity}
                        onChange={(e) => handleDefectChange(i, 'severity', e.target.value)}
                        disabled={isReadOnly}
                      >
                        <MenuItem value="MINOR">Minor</MenuItem>
                        <MenuItem value="MAJOR">Major</MenuItem>
                        <MenuItem value="CRITICAL">Critical</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Location"
                        value={defect.location}
                        onChange={(e) => handleDefectChange(i, 'location', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={11}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Description"
                        value={defect.description}
                        onChange={(e) => handleDefectChange(i, 'description', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!isReadOnly && (
                        <IconButton size="small" color="error" onClick={() => removeDefect(i)}>
                          <FailIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              {!isReadOnly && (
                <Button size="small" color="error" onClick={addDefect} sx={{ mt: 1 }}>
                  + Add Defect
                </Button>
              )}
            </AccordionDetails>
          </Accordion>

          {/* General Notes */}
          <Accordion defaultExpanded={!!notes}>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography fontWeight={600}>Additional Notes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional comments, observations, or instructions..."
                disabled={isReadOnly}
              />
            </AccordionDetails>
          </Accordion>

          {/* Disposition Actions */}
          {!isReadOnly && (
            <Paper elevation={2} sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Inspection Decision
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Complete the checklist above, then choose a disposition for this job.
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<ApproveIcon />}
                  onClick={() => setDispositionDialog({ open: true, action: 'pass' })}
                  disabled={!allChecksDone}
                >
                  Pass QC
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  startIcon={<WarningIcon />}
                  onClick={() => setDispositionDialog({ open: true, action: 'conditional' })}
                >
                  Conditional Pass
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={<RejectIcon />}
                  onClick={() => setDispositionDialog({ open: true, action: 'fail' })}
                >
                  Fail QC
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  size="large"
                  startIcon={<ReworkIcon />}
                  onClick={() => setDispositionDialog({ open: true, action: 'rework' })}
                >
                  Send to Rework
                </Button>
              </Stack>
            </Paper>
          )}

          {/* Read-only disposition result */}
          {isReadOnly && inspection.disposition && (
            <Paper
              elevation={2}
              sx={{
                p: 2,
                mt: 3,
                bgcolor: inspection.overallResult === 'PASS' ? 'success.50' :
                  inspection.overallResult === 'FAIL' ? 'error.50' : 'warning.50',
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Disposition: {inspection.disposition.replace(/_/g, ' ')}
              </Typography>
              <Typography variant="body2">
                Result: {inspection.overallResult} • Completed: {new Date(inspection.completedAt).toLocaleString()}
              </Typography>
              {inspection.reworkInstructions && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Rework Instructions:</Typography>
                  <Typography variant="body2">{inspection.reworkInstructions}</Typography>
                </Alert>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Disposition Confirmation Dialog */}
      <Dialog
        open={dispositionDialog.open}
        onClose={() => setDispositionDialog({ open: false, action: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dispositionDialog.action === 'pass' && '✅ Confirm QC Pass'}
          {dispositionDialog.action === 'fail' && '❌ Confirm QC Failure'}
          {dispositionDialog.action === 'rework' && '🔧 Send to Rework'}
          {dispositionDialog.action === 'conditional' && '⚠️ Conditional Pass'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {dispositionDialog.action === 'pass' && 'This will pass the inspection and move the job to PACKAGING.'}
            {dispositionDialog.action === 'fail' && 'This will fail the inspection and put the job ON HOLD.'}
            {dispositionDialog.action === 'rework' && 'This will send the job back to SCHEDULED for re-planning and rework.'}
            {dispositionDialog.action === 'conditional' && 'This will conditionally pass the inspection and move the job to PACKAGING with conditions noted.'}
          </Typography>

          {dispositionDialog.action === 'fail' && (
            <TextField
              select
              fullWidth
              label="Disposition"
              value={commitDisposition}
              onChange={(e) => setCommitDisposition(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="PENDING">Pending Further Review</MenuItem>
              <MenuItem value="SCRAP">Scrap</MenuItem>
              <MenuItem value="REWORK">Rework</MenuItem>
              <MenuItem value="RETURN">Return to Supplier</MenuItem>
              <MenuItem value="SELL_SECONDARY">Sell as Secondary</MenuItem>
              <MenuItem value="USE_AS_IS">Use As-Is (with waiver)</MenuItem>
            </TextField>
          )}

          {(dispositionDialog.action === 'rework' || dispositionDialog.action === 'fail') && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rework Instructions"
              value={reworkInstructions}
              onChange={(e) => setReworkInstructions(e.target.value)}
              placeholder="Describe what needs to be re-done..."
              sx={{ mb: 2 }}
            />
          )}

          {dispositionDialog.action === 'conditional' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Describe the conditions under which this pass is accepted..."
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes"
            value={dispositionNotes}
            onChange={(e) => setDispositionNotes(e.target.value)}
            placeholder="Additional notes for this decision..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDispositionDialog({ open: false, action: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={
              dispositionDialog.action === 'pass' ? 'success' :
              dispositionDialog.action === 'fail' ? 'error' :
              'warning'
            }
            onClick={handleDispositionSubmit}
            disabled={saving}
          >
            {saving ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ── Helper Components ───────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">{label}:</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
    </Box>
  )
}
