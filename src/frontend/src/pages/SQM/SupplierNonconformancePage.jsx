import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Error as CriticalIcon,
  Info as MinorIcon,
  Send as SendIcon,
  AttachFile as AttachIcon,
  Comment as CommentIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  Email as EmailIcon,
  Gavel as SCARIcon,
} from '@mui/icons-material'

// Mock SNC data
const mockSNCs = [
  {
    id: '1',
    sncNumber: 'SNC-26-0042',
    supplier: 'Steel Dynamics',
    supplierId: 'SUP-003',
    issueType: 'DIMENSION_OUT_OF_SPEC',
    severity: 'MAJOR',
    status: 'AWAITING_RESPONSE',
    description: 'Coil thickness exceeded maximum tolerance. Measured 0.268" in multiple locations vs. nominal 0.250" +0.010.',
    heatNumber: 'H-2026-5523',
    quantityAffected: 45000,
    uom: 'lbs',
    createdAt: '2026-02-03T11:30:00',
    responseDueDate: '2026-02-08T11:30:00',
    owner: 'Mike Johnson',
    estimatedCost: 2500,
  },
  {
    id: '2',
    sncNumber: 'SNC-26-0041',
    supplier: 'Nucor Corporation',
    supplierId: 'SUP-001',
    issueType: 'MTR_INCORRECT',
    severity: 'MINOR',
    status: 'RESPONSE_RECEIVED',
    description: 'MTR shows incorrect heat number. Document correction needed.',
    heatNumber: 'H-2026-5501',
    quantityAffected: 38000,
    uom: 'lbs',
    createdAt: '2026-02-02T14:15:00',
    responseDueDate: '2026-02-12T14:15:00',
    owner: 'Sarah Chen',
    estimatedCost: 150,
  },
  {
    id: '3',
    sncNumber: 'SNC-26-0040',
    supplier: 'ArcelorMittal',
    supplierId: 'SUP-002',
    issueType: 'SURFACE_DEFECT',
    severity: 'MAJOR',
    status: 'SCAR_ISSUED',
    description: 'Excessive pitting on coil surface. Not suitable for exposed applications.',
    heatNumber: 'H-2026-5489',
    quantityAffected: 62000,
    uom: 'lbs',
    createdAt: '2026-01-28T09:45:00',
    owner: 'Mike Johnson',
    estimatedCost: 4200,
    scarNumber: 'SCAR-26-0015',
  },
  {
    id: '4',
    sncNumber: 'SNC-26-0039',
    supplier: 'SSAB',
    supplierId: 'SUP-005',
    issueType: 'LATE_DELIVERY',
    severity: 'MINOR',
    status: 'CLOSED',
    description: 'Delivery 3 days late, causing production delay.',
    heatNumber: null,
    quantityAffected: null,
    uom: null,
    createdAt: '2026-01-25T16:00:00',
    closedAt: '2026-01-30T10:00:00',
    owner: 'Sarah Chen',
    estimatedCost: 800,
  },
  {
    id: '5',
    sncNumber: 'SNC-26-0038',
    supplier: 'Steel Dynamics',
    supplierId: 'SUP-003',
    issueType: 'CHEMISTRY_OUT_OF_SPEC',
    severity: 'CRITICAL',
    status: 'OPEN',
    description: 'Carbon content 0.32% exceeds max spec of 0.26% per ASTM A36.',
    heatNumber: 'H-2026-5510',
    quantityAffected: 52000,
    uom: 'lbs',
    createdAt: '2026-02-04T08:00:00',
    responseDueDate: '2026-02-05T08:00:00',
    owner: 'Mike Johnson',
    estimatedCost: 8500,
  },
]

const issueTypeLabels = {
  DIMENSION_OUT_OF_SPEC: 'Dimension Out of Spec',
  SURFACE_DEFECT: 'Surface Defect',
  CHEMISTRY_OUT_OF_SPEC: 'Chemistry Out of Spec',
  MECHANICAL_OUT_OF_SPEC: 'Mechanical Out of Spec',
  WRONG_MATERIAL: 'Wrong Material',
  WRONG_QUANTITY: 'Wrong Quantity',
  SHIPPING_DAMAGE: 'Shipping Damage',
  PACKAGING_DAMAGE: 'Packaging Damage',
  DOCUMENTATION_ERROR: 'Documentation Error',
  MTR_MISSING: 'MTR Missing',
  MTR_INCORRECT: 'MTR Incorrect',
  CONTAMINATION: 'Contamination',
  MIXED_HEATS: 'Mixed Heats',
  LATE_DELIVERY: 'Late Delivery',
  OTHER: 'Other',
}

const severityConfig = {
  CRITICAL: { label: 'Critical', color: 'error', icon: CriticalIcon },
  MAJOR: { label: 'Major', color: 'warning', icon: WarningIcon },
  MINOR: { label: 'Minor', color: 'info', icon: MinorIcon },
}

const statusConfig = {
  OPEN: { label: 'Open', color: 'default' },
  SUPPLIER_NOTIFIED: { label: 'Supplier Notified', color: 'info' },
  AWAITING_RESPONSE: { label: 'Awaiting Response', color: 'warning' },
  RESPONSE_RECEIVED: { label: 'Response Received', color: 'secondary' },
  UNDER_REVIEW: { label: 'Under Review', color: 'info' },
  SCAR_ISSUED: { label: 'SCAR Issued', color: 'error' },
  RESOLVED: { label: 'Resolved', color: 'success' },
  CLOSED: { label: 'Closed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
}

export default function SupplierNonconformancePage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedSNC, setSelectedSNC] = useState(null)

  const filteredSNCs = mockSNCs.filter((snc) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        snc.sncNumber.toLowerCase().includes(query) ||
        snc.supplier.toLowerCase().includes(query) ||
        snc.description.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return ['OPEN', 'SUPPLIER_NOTIFIED', 'AWAITING_RESPONSE'].includes(snc.status)
    if (tabValue === 2) return ['RESPONSE_RECEIVED', 'UNDER_REVIEW'].includes(snc.status)
    if (tabValue === 3) return snc.status === 'SCAR_ISSUED'
    if (tabValue === 4) return ['RESOLVED', 'CLOSED'].includes(snc.status)
    return true
  })

  const openCount = mockSNCs.filter((s) => ['OPEN', 'SUPPLIER_NOTIFIED', 'AWAITING_RESPONSE'].includes(s.status)).length
  const pendingReviewCount = mockSNCs.filter((s) => ['RESPONSE_RECEIVED', 'UNDER_REVIEW'].includes(s.status)).length
  const scarCount = mockSNCs.filter((s) => s.status === 'SCAR_ISSUED').length
  const closedCount = mockSNCs.filter((s) => ['RESOLVED', 'CLOSED'].includes(s.status)).length

  const totalCost = mockSNCs.reduce((sum, s) => sum + (s.estimatedCost || 0), 0)

  if (selectedSNC) {
    return <SNCDetailView snc={selectedSNC} onBack={() => setSelectedSNC(null)} />
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Supplier Nonconformances
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage supplier quality issues
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New SNC
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Open Issues
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {openCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {mockSNCs.filter((s) => s.severity === 'CRITICAL' && s.status !== 'CLOSED').length} critical
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Pending Review
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {pendingReviewCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Response received
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                SCARs Issued
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {scarCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active corrective actions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Total Cost Impact
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ${totalCost.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Estimated MTD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Critical Alert */}
      {mockSNCs.some((s) => s.severity === 'CRITICAL' && s.status === 'OPEN') && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<CriticalIcon />}>
          <strong>Critical issue requires immediate attention!</strong> — SNC-26-0038: Chemistry out of spec on Heat H-2026-5510
        </Alert>
      )}

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockSNCs.length})`} />
            <Tab label={`Open (${openCount})`} />
            <Tab label={`Pending Review (${pendingReviewCount})`} />
            <Tab label={`SCAR Issued (${scarCount})`} />
            <Tab label={`Closed (${closedCount})`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search SNCs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SNC #</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Issue Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Heat/Lot</TableCell>
                <TableCell align="right">Cost Impact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSNCs.map((snc) => {
                const severity = severityConfig[snc.severity]
                const SeverityIcon = severity.icon
                const status = statusConfig[snc.status]
                return (
                  <TableRow key={snc.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {snc.sncNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(snc.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{snc.supplier}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {snc.supplierId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{issueTypeLabels[snc.issueType]}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<SeverityIcon fontSize="small" />}
                        label={severity.label}
                        color={severity.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {snc.heatNumber || '-'}
                      {snc.quantityAffected && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {snc.quantityAffected.toLocaleString()} {snc.uom}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      ${snc.estimatedCost?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                      {snc.scarNumber && (
                        <Typography variant="caption" display="block" color="error">
                          {snc.scarNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{snc.owner}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedSNC(snc)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {snc.status === 'OPEN' && (
                        <IconButton size="small" color="info">
                          <SendIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create SNC Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Supplier Nonconformance</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Supplier *</InputLabel>
                <Select label="Supplier *" defaultValue="">
                  <MenuItem value="SUP-001">Nucor Corporation</MenuItem>
                  <MenuItem value="SUP-002">ArcelorMittal</MenuItem>
                  <MenuItem value="SUP-003">Steel Dynamics</MenuItem>
                  <MenuItem value="SUP-005">SSAB</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Issue Type *</InputLabel>
                <Select label="Issue Type *" defaultValue="">
                  {Object.entries(issueTypeLabels).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severity *</InputLabel>
                <Select label="Severity *" defaultValue="">
                  <MenuItem value="CRITICAL">Critical (Safety/Major Impact)</MenuItem>
                  <MenuItem value="MAJOR">Major (Significant Impact)</MenuItem>
                  <MenuItem value="MINOR">Minor (Limited Impact)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Linked Receipt (Optional)</InputLabel>
                <Select label="Linked Receipt (Optional)" defaultValue="">
                  <MenuItem value="RCV-26-0142">RCV-26-0142</MenuItem>
                  <MenuItem value="RCV-26-0141">RCV-26-0141</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Heat/Lot Number" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="PO Reference" />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description of Issue *"
                multiline
                rows={4}
                placeholder="Describe the nonconformance in detail..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Quantity Affected" type="number" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Estimated Cost Impact ($)" type="number" />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" startIcon={<AttachIcon />}>
                Add Attachments
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="outlined" onClick={() => setCreateDialogOpen(false)}>
            Save Draft
          </Button>
          <Button variant="contained" onClick={() => setCreateDialogOpen(false)}>
            Create & Notify Supplier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function SNCDetailView({ snc, onBack }) {
  const severity = severityConfig[snc.severity]
  const status = statusConfig[snc.status]
  const SeverityIcon = severity.icon

  const workflowSteps = ['Open', 'Supplier Notified', 'Response Received', 'Under Review', 'Resolved']
  const currentStep = snc.status === 'CLOSED' ? 4 :
    snc.status === 'SCAR_ISSUED' ? 3 :
    ['RESPONSE_RECEIVED', 'UNDER_REVIEW'].includes(snc.status) ? 2 :
    ['SUPPLIER_NOTIFIED', 'AWAITING_RESPONSE'].includes(snc.status) ? 1 : 0

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button variant="text" onClick={onBack} sx={{ mb: 1 }}>
            ← Back to SNCs
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {snc.sncNumber}
            </Typography>
            <Chip
              icon={<SeverityIcon fontSize="small" />}
              label={severity.label}
              color={severity.color}
            />
            <Chip label={status.label} color={status.color} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {snc.supplier} | Created {new Date(snc.createdAt).toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<EmailIcon />}>
            Notify Supplier
          </Button>
          <Button variant="contained" color="error" startIcon={<SCARIcon />}>
            Issue SCAR
          </Button>
        </Box>
      </Box>

      {/* Workflow Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {workflowSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Issue Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Issue Type
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {issueTypeLabels[snc.issueType]}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Heat/Lot Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {snc.heatNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Quantity Affected
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {snc.quantityAffected?.toLocaleString() || 'N/A'} {snc.uom}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Estimated Cost Impact
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'error.main' }}>
                  ${snc.estimatedCost?.toLocaleString() || '0'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {snc.description}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Activity Timeline */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <WarningIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="SNC Created"
                  secondary={`${snc.owner} created this nonconformance - ${new Date(snc.createdAt).toLocaleString()}`}
                />
              </ListItem>
              {snc.status !== 'OPEN' && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <EmailIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Supplier Notified"
                    secondary="Email sent to quality@supplier.com - Feb 3, 2026 11:35 AM"
                  />
                </ListItem>
              )}
              {['RESPONSE_RECEIVED', 'UNDER_REVIEW', 'SCAR_ISSUED', 'CLOSED'].includes(snc.status) && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <CommentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Supplier Response Received"
                    secondary="Supplier acknowledged the issue and is investigating - Feb 4, 2026 9:00 AM"
                  />
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }} />
            <TextField
              fullWidth
              placeholder="Add a comment..."
              multiline
              rows={2}
            />
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small">
                Add Comment
              </Button>
              <Button variant="outlined" size="small" startIcon={<AttachIcon />}>
                Attach File
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Supplier
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {snc.supplier}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {snc.supplierId}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Owner
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {snc.owner}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Response Due
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
              {snc.responseDueDate
                ? new Date(snc.responseDueDate).toLocaleDateString()
                : 'Not set'}
            </Typography>
          </Paper>

          {snc.scarNumber && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.lighter' }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Linked SCAR
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                {snc.scarNumber}
              </Typography>
            </Paper>
          )}

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Attachments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No attachments yet
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AttachIcon />}
              sx={{ mt: 1 }}
            >
              Add Attachment
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
