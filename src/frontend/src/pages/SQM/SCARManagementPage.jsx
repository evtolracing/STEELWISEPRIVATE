import { useState } from 'react'
import { FileUploadZone } from '../../components/common'
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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CompleteIcon,
  RadioButtonUnchecked as PendingIcon,
  Warning as WarningIcon,
  Assignment as TaskIcon,
  AttachFile as AttachIcon,
  Comment as CommentIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material'

// Mock SCAR data
const mockSCARs = [
  {
    id: '1',
    scarNumber: 'SCAR-26-0015',
    supplier: 'ArcelorMittal',
    supplierId: 'SUP-002',
    title: 'Recurring Surface Defects on HR Coil',
    linkedSNC: 'SNC-26-0040',
    issueType: 'SURFACE_DEFECT',
    severity: 'MAJOR',
    status: 'CORRECTIVE_ACTION',
    issuedDate: '2026-01-30T14:00:00',
    dueDate: '2026-02-28T23:59:59',
    owner: 'Mike Johnson',
    phase: 4, // 8D phase
    progress: 50,
  },
  {
    id: '2',
    scarNumber: 'SCAR-26-0014',
    supplier: 'Steel Dynamics',
    supplierId: 'SUP-003',
    title: 'Thickness Variance Exceeds Tolerance',
    linkedSNC: 'SNC-26-0035',
    issueType: 'DIMENSION_OUT_OF_SPEC',
    severity: 'MAJOR',
    status: 'VERIFICATION',
    issuedDate: '2026-01-22T10:00:00',
    dueDate: '2026-02-22T23:59:59',
    owner: 'Sarah Chen',
    phase: 6,
    progress: 75,
  },
  {
    id: '3',
    scarNumber: 'SCAR-26-0013',
    supplier: 'Nucor Corporation',
    supplierId: 'SUP-001',
    title: 'MTR Documentation Errors',
    linkedSNC: 'SNC-26-0032',
    issueType: 'DOCUMENTATION_ERROR',
    severity: 'MINOR',
    status: 'CLOSED',
    issuedDate: '2026-01-15T09:00:00',
    closedDate: '2026-02-01T16:00:00',
    owner: 'Mike Johnson',
    phase: 8,
    progress: 100,
  },
  {
    id: '4',
    scarNumber: 'SCAR-26-0012',
    supplier: 'SSAB',
    supplierId: 'SUP-005',
    title: 'Delayed Shipments Impact Production',
    linkedSNC: 'SNC-26-0028',
    issueType: 'LATE_DELIVERY',
    severity: 'MINOR',
    status: 'CONTAINMENT',
    issuedDate: '2026-02-01T11:00:00',
    dueDate: '2026-03-01T23:59:59',
    owner: 'Sarah Chen',
    phase: 3,
    progress: 35,
  },
]

const statusConfig = {
  ISSUED: { label: 'Issued', color: 'default' },
  TEAM_FORMATION: { label: 'Team Formation', color: 'info' },
  CONTAINMENT: { label: 'Containment', color: 'warning' },
  ROOT_CAUSE: { label: 'Root Cause Analysis', color: 'secondary' },
  CORRECTIVE_ACTION: { label: 'Corrective Action', color: 'primary' },
  VERIFICATION: { label: 'Verification', color: 'info' },
  PREVENTIVE: { label: 'Preventive Action', color: 'primary' },
  CLOSED: { label: 'Closed', color: 'success' },
}

const d8Steps = [
  { label: 'D1', name: 'Team Formation', description: 'Establish team with product/process knowledge' },
  { label: 'D2', name: 'Problem Description', description: 'Describe the problem in measurable terms' },
  { label: 'D3', name: 'Containment', description: 'Implement interim containment actions' },
  { label: 'D4', name: 'Root Cause', description: 'Identify and verify root cause(s)' },
  { label: 'D5', name: 'Corrective Actions', description: 'Define permanent corrective actions' },
  { label: 'D6', name: 'Implementation', description: 'Implement and validate corrective actions' },
  { label: 'D7', name: 'Prevention', description: 'Prevent recurrence of the problem' },
  { label: 'D8', name: 'Team Recognition', description: 'Recognize team efforts and close' },
]

export default function SCARManagementPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSCAR, setSelectedSCAR] = useState(null)

  const filteredSCARs = mockSCARs.filter((scar) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        scar.scarNumber.toLowerCase().includes(query) ||
        scar.supplier.toLowerCase().includes(query) ||
        scar.title.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return scar.status !== 'CLOSED'
    if (tabValue === 2) return scar.status === 'CLOSED'
    return true
  })

  const activeCount = mockSCARs.filter((s) => s.status !== 'CLOSED').length
  const overdueCount = mockSCARs.filter((s) => 
    s.status !== 'CLOSED' && s.dueDate && new Date(s.dueDate) < new Date()
  ).length
  const closedCount = mockSCARs.filter((s) => s.status === 'CLOSED').length

  if (selectedSCAR) {
    return <SCARDetailView scar={selectedSCAR} onBack={() => setSelectedSCAR(null)} />
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            SCAR Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supplier Corrective Action Requests (8D Format)
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          New SCAR
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Active SCARs
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {activeCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                In progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Overdue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {overdueCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Past due date
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Closed This Month
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {closedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Successfully resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Avg Resolution Time
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                18d
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockSCARs.length})`} />
            <Tab label={`Active (${activeCount})`} />
            <Tab label={`Closed (${closedCount})`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search SCARs..."
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
                <TableCell>SCAR #</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Phase</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSCARs.map((scar) => {
                const status = statusConfig[scar.status]
                const isOverdue = scar.dueDate && new Date(scar.dueDate) < new Date() && scar.status !== 'CLOSED'
                return (
                  <TableRow key={scar.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {scar.scarNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {scar.linkedSNC}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{scar.supplier}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                        {scar.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`D${scar.phase}`}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={scar.progress}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          color={scar.progress === 100 ? 'success' : 'primary'}
                        />
                        <Typography variant="caption">{scar.progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell>
                      {scar.status === 'CLOSED' ? (
                        <Typography variant="body2" color="success.main">
                          Closed
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color={isOverdue ? 'error.main' : 'text.primary'}
                          sx={{ fontWeight: isOverdue ? 600 : 400 }}
                        >
                          {new Date(scar.dueDate).toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{scar.owner}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedSCAR(scar)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

function SCARDetailView({ scar, onBack }) {
  const [expandedPhase, setExpandedPhase] = useState(`d${scar.phase}`)
  const status = statusConfig[scar.status]

  const phaseData = {
    d1: {
      complete: scar.phase > 1,
      teamMembers: ['Mike Johnson (Lead)', 'Sarah Chen', 'Quality Rep - ArcelorMittal'],
    },
    d2: {
      complete: scar.phase > 2,
      description: scar.title,
      frequency: '3 occurrences in last 90 days',
      impact: 'Production delays, rework costs ~$4,200',
    },
    d3: {
      complete: scar.phase > 3,
      actions: [
        { action: 'Quarantine affected inventory', status: 'complete' },
        { action: 'Increase inspection frequency on incoming shipments', status: 'complete' },
        { action: 'Notify production of material hold', status: 'complete' },
      ],
    },
    d4: {
      complete: scar.phase > 4,
      rootCause: 'Improper roll pressure settings during pickling process',
      method: '5-Why Analysis',
    },
    d5: {
      complete: scar.phase > 5,
      actions: [
        { action: 'Implement automated pressure monitoring', status: 'pending', dueDate: '2026-02-15' },
        { action: 'Update SOP for roll pressure verification', status: 'pending', dueDate: '2026-02-20' },
      ],
    },
    d6: {
      complete: scar.phase > 6,
      verification: 'Verify corrective actions are effective',
    },
    d7: {
      complete: scar.phase > 7,
      prevention: 'System-wide process improvement',
    },
    d8: {
      complete: scar.phase > 8,
      recognition: 'Team recognition and lessons learned',
    },
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button variant="text" onClick={onBack} sx={{ mb: 1 }}>
            ← Back to SCARs
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {scar.scarNumber}
            </Typography>
            <Chip label={`D${scar.phase}`} color="primary" />
            <Chip label={status.label} color={status.color} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {scar.supplier} | Linked: {scar.linkedSNC}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined">Request Update</Button>
          {scar.status !== 'CLOSED' && (
            <Button variant="contained" color="success">
              Close SCAR
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 8D Progress */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              8D Progress
            </Typography>
            <Stepper activeStep={scar.phase - 1} alternativeLabel sx={{ mb: 3 }}>
              {d8Steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>
                    <Typography variant="caption">{step.label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* 8D Accordion Sections */}
            {d8Steps.map((step, index) => (
              <Accordion
                key={step.label}
                expanded={expandedPhase === `d${index + 1}`}
                onChange={() => setExpandedPhase(expandedPhase === `d${index + 1}` ? null : `d${index + 1}`)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    {phaseData[`d${index + 1}`]?.complete ? (
                      <CompleteIcon color="success" />
                    ) : index + 1 === scar.phase ? (
                      <WarningIcon color="warning" />
                    ) : (
                      <PendingIcon color="disabled" />
                    )}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {step.label}: {step.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                    {phaseData[`d${index + 1}`]?.complete && (
                      <Chip label="Complete" color="success" size="small" />
                    )}
                    {index + 1 === scar.phase && (
                      <Chip label="In Progress" color="warning" size="small" />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {index === 0 && phaseData.d1.teamMembers && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Team Members
                      </Typography>
                      <List dense>
                        {phaseData.d1.teamMembers.map((member, i) => (
                          <ListItem key={i}>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32 }}>{member[0]}</Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={member} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {index === 1 && (
                    <Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2">Problem Statement</Typography>
                          <Typography variant="body2">{phaseData.d2.description}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Frequency</Typography>
                          <Typography variant="body2">{phaseData.d2.frequency}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Impact</Typography>
                          <Typography variant="body2">{phaseData.d2.impact}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  {index === 2 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Containment Actions
                      </Typography>
                      {phaseData.d3.actions.map((item, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CompleteIcon color="success" fontSize="small" />
                          <Typography variant="body2">{item.action}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {index === 3 && (
                    <Box>
                      <Typography variant="subtitle2">Root Cause Analysis Method</Typography>
                      <Chip label={phaseData.d4.method} size="small" sx={{ mb: 2 }} />
                      <Typography variant="subtitle2">Identified Root Cause</Typography>
                      <Typography variant="body2">{phaseData.d4.rootCause}</Typography>
                    </Box>
                  )}
                  {index === 4 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Corrective Actions
                      </Typography>
                      {phaseData.d5.actions.map((item, i) => (
                        <Box
                          key={i}
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PendingIcon color="warning" fontSize="small" />
                            <Typography variant="body2">{item.action}</Typography>
                          </Box>
                          <Chip label={`Due: ${item.dueDate}`} size="small" variant="outlined" />
                        </Box>
                      ))}
                    </Box>
                  )}
                  {index >= 5 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        This phase has not been started yet.
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Overall Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress
                variant="determinate"
                value={scar.progress}
                sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                color={scar.progress === 100 ? 'success' : 'primary'}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {scar.progress}%
              </Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Due Date
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {scar.dueDate ? new Date(scar.dueDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Supplier
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {scar.supplier}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {scar.supplierId}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Owner
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {scar.owner}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" size="small" fullWidth startIcon={<CommentIcon />}>
                Add Comment
              </Button>
              <FileUploadZone
                compact
                entityType="SCAR"
                accept="application/pdf,image/*"
                buttonLabel="Add Attachment"
                multiple
              />
              <Button variant="outlined" size="small" fullWidth startIcon={<ScheduleIcon />}>
                Set Reminder
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
