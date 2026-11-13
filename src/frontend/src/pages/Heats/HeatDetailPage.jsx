/**
 * One heat: what the mill certified, the stock items cut from it, its test
 * results and its documents. Everything is read from /api/heats/:id.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Paper, Grid, Button, Tabs, Tab, Divider, IconButton, List, ListItem, ListItemText, ListItemIcon,
  ListItemSecondaryAction, Snackbar, Alert, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip,
} from '@mui/material'
import {
  ArrowBack as BackIcon, Edit as EditIcon, Download as DownloadIcon, Delete as DeleteIcon,
  PictureAsPdf as PdfIcon, InsertDriveFile as FileIcon,
} from '@mui/icons-material'
import { getEntityDocuments, deleteDocument, getDocumentDownloadUrl } from '../../api/documents'
import { StatusChip, FileUploadZone } from '../../components/common'
import { HEAT_STATUSES, MELT_TYPES, CAST_TYPES, day, pounds } from './HeatListPage'
import { unitSize } from '../Units/UnitListPage'

const label = (pairs, value) => (pairs.find(([v]) => v === value) || [])[1] || ''
const Fact = ({ name, children }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" display="block">{name}</Typography>
    <Typography variant="body1">{children || <Typography component="span" variant="body2" color="text.secondary">Not recorded</Typography>}</Typography>
  </Box>
)

/** A set of named values (chemistry, mechanical properties) as a two-column table. */
function Values({ values, empty }) {
  const rows = Object.entries(values || {}).filter(([, v]) => v !== null && v !== '')
  if (!rows.length) return <Typography variant="body2" color="text.secondary">{empty}</Typography>
  return (
    <Grid container spacing={1}>
      {rows.map(([k, v]) => (
        <Grid item xs={6} sm={4} md={3} key={k}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">{k}</Typography>
            <Typography variant="h6" fontWeight={600}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  )
}

function EditHeatDialog({ heat, open, onClose, onSaved }) {
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (open && heat) {
      setError('')
      setForm({ status: heat.status, castDate: String(heat.castDate || '').slice(0, 10), meltType: heat.meltType || '', castType: heat.castType || '', totalWeightLb: heat.totalWeightLb ?? '' })
    }
  }, [open, heat])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const save = async () => {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/heats/${heat.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'The heat could not be saved')
      onSaved()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit heat {heat?.heatNumber}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField select label="Status" value={form.status || ''} onChange={set('status')} fullWidth sx={{ mt: 1, mb: 2 }}>
          {HEAT_STATUSES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        <TextField label="Cast date" type="date" value={form.castDate || ''} onChange={set('castDate')} fullWidth required InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
        <TextField select label="Melt type" value={form.meltType || ''} onChange={set('meltType')} fullWidth sx={{ mb: 2 }}>
          <MenuItem value="">Not recorded</MenuItem>
          {MELT_TYPES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        <TextField select label="Cast type" value={form.castType || ''} onChange={set('castType')} fullWidth sx={{ mb: 2 }}>
          <MenuItem value="">Not recorded</MenuItem>
          {CAST_TYPES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        <TextField label="Total weight (lb)" type="number" value={form.totalWeightLb ?? ''} onChange={set('totalWeightLb')} fullWidth inputProps={{ min: 0 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || !form.castDate}>{busy ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function HeatDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [heat, setHeat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState(0)
  const [documents, setDocuments] = useState([])
  const [docError, setDocError] = useState('')
  const [editing, setEditing] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/heats/${id}`)
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(res.status === 404 ? 'This heat does not exist.' : body?.error || 'The heat could not be loaded')
      setHeat(body); setError('')
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [id])
  useEffect(() => { load() }, [load])

  const loadDocuments = useCallback(async () => {
    try {
      const res = await getEntityDocuments('HEAT', id)
      setDocuments(res.data || []); setDocError('')
    } catch {
      setDocError('The documents could not be loaded.')
    }
  }, [id])
  useEffect(() => { if (tab === 3) loadDocuments() }, [tab, loadDocuments])

  const removeDocument = async (docId) => {
    try {
      await deleteDocument(docId)
      setDocuments((list) => list.filter((d) => d.id !== docId))
      setSnack({ open: true, msg: 'Document deleted', severity: 'success' })
    } catch {
      setSnack({ open: true, msg: 'The document could not be deleted', severity: 'error' })
    }
  }

  if (loading && !heat) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>
  if (error || !heat) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => navigate('/heats')}>Back to heats</Button>}>{error || 'This heat does not exist.'}</Alert>
      </Box>
    )
  }

  const units = heat.coils || []
  const tests = heat.testResults || []
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/heats')} aria-label="Back to heats"><BackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" fontWeight={600}>Heat {heat.heatNumber}</Typography>
            <StatusChip status={heat.status} />
          </Box>
          <Typography variant="body2" color="text.secondary">{[heat.mill?.name, heat.grade?.code, heat.grade?.specStandard].filter(Boolean).join(' · ')}</Typography>
        </Box>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditing(true)}>Edit</Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label={`Stock items (${units.length})`} />
          <Tab label={`Tests (${tests.length})`} />
          <Tab label="Documents" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}><Fact name="Mill">{heat.mill?.name}</Fact></Grid>
            <Grid item xs={6} md={3}><Fact name="Grade">{heat.grade ? `${heat.grade.code}: ${heat.grade.name}` : ''}</Fact></Grid>
            <Grid item xs={6} md={3}><Fact name="Cast date">{day(heat.castDate)}</Fact></Grid>
            <Grid item xs={6} md={3}><Fact name="Heat weight">{pounds(heat.totalWeightLb)}</Fact></Grid>
            <Grid item xs={6} md={3}><Fact name="Melt type">{label(MELT_TYPES, heat.meltType)}</Fact></Grid>
            <Grid item xs={6} md={3}><Fact name="Cast type">{label(CAST_TYPES, heat.castType)}</Fact></Grid>
            <Grid item xs={6} md={3}><Fact name="Mill certificate">{heat.mtrDocumentId ? 'On file (see Documents)' : ''}</Fact></Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Chemistry</Typography>
          <Values values={heat.chemistry} empty="No chemistry is recorded for this heat." />
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Mechanical properties</Typography>
          <Values values={heat.mechanicalProps} empty="No mechanical properties are recorded for this heat." />
        </Paper>
      )}

      {tab === 1 && (
        <TableContainer component={Paper}>
          <Table size="small" aria-label="Stock items from this heat">
            <TableHead><TableRow><TableCell>Item</TableCell><TableCell>Form</TableCell><TableCell>Size</TableCell><TableCell align="right">Weight</TableCell><TableCell>Location</TableCell><TableCell>Quality</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
            <TableBody>
              {units.map((u) => (
                <TableRow key={u.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/units/${u.id}`)}>
                  <TableCell><Typography variant="body2" fontWeight={600} color="primary">{u.coilNumber}</Typography></TableCell>
                  <TableCell>{u.form}</TableCell>
                  <TableCell>{unitSize(u)}</TableCell>
                  <TableCell align="right">{pounds(u.netWeightLb)}</TableCell>
                  <TableCell>{u.location?.name || u.location?.code}</TableCell>
                  <TableCell><StatusChip status={u.qcStatus} /></TableCell>
                  <TableCell><StatusChip status={u.status} /></TableCell>
                </TableRow>
              ))}
              {units.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No stock has been received against this heat.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 2 && (
        <TableContainer component={Paper}>
          <Table size="small" aria-label="Test results for this heat">
            <TableHead><TableRow><TableCell>Test</TableCell><TableCell>Date</TableCell><TableCell>Result</TableCell><TableCell>Certificate</TableCell><TableCell>Notes</TableCell></TableRow></TableHead>
            <TableBody>
              {tests.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{String(t.testType || '').replace(/_/g, ' ')}</TableCell>
                  <TableCell>{day(t.testDate)}</TableCell>
                  <TableCell><Chip size="small" label={t.passFail} color={t.passFail === 'PASS' ? 'success' : t.passFail === 'FAIL' ? 'error' : 'default'} /></TableCell>
                  <TableCell>{t.certNumber}</TableCell>
                  <TableCell>{t.notes}</TableCell>
                </TableRow>
              ))}
              {tests.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No test results are recorded for this heat.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Documents</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Attach the mill test certificate, chemical analysis or other paperwork for this heat.</Typography>
          <FileUploadZone entityType="HEAT" entityId={id} docType="MTC" accept="application/pdf,image/*" multiple
            onUploaded={(doc) => { setDocuments((list) => [doc, ...list]); setSnack({ open: true, msg: `"${doc.fileName}" uploaded`, severity: 'success' }) }}
            onError={(err) => setSnack({ open: true, msg: err, severity: 'error' })} />
          {docError && <Alert severity="error" sx={{ mt: 2 }} action={<Button color="inherit" size="small" onClick={loadDocuments}>Try again</Button>}>{docError}</Alert>}
          {documents.length > 0 && (
            <List dense sx={{ mt: 2 }}>
              {documents.map((doc) => (
                <ListItem key={doc.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{doc.mimeType === 'application/pdf' ? <PdfIcon color="error" /> : <FileIcon color="action" />}</ListItemIcon>
                  <ListItemText primary={doc.fileName} secondary={[doc.type || 'Document', doc.sizeBytes ? `${(doc.sizeBytes / 1024).toFixed(1)} KB` : '', day(doc.createdAt)].filter(Boolean).join(' · ')} />
                  <ListItemSecondaryAction>
                    <IconButton size="small" href={getDocumentDownloadUrl(doc.id)} target="_blank" aria-label={`Download ${doc.fileName}`}><DownloadIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => removeDocument(doc.id)} aria-label={`Delete ${doc.fileName}`}><DeleteIcon fontSize="small" /></IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
          {!docError && documents.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>No documents are attached yet.</Typography>}
        </Paper>
      )}

      <EditHeatDialog heat={heat} open={editing} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setSnack({ open: true, msg: 'Heat saved', severity: 'success' }); load() }} />
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
