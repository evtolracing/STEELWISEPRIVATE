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
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  LinearProgress,
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
} from '@mui/icons-material'

// Mock CAR Data (Customer Corrective Action Reports)
const mockCARs = [
  {
    id: '1',
    carNumber: 'CAR-26-0012',
    claimNumber: 'CLM-26-0041',
    customer: 'XYZ Industries',
    title: 'Surface Scratches on Galvanized Material',
    category: 'PROCESS',
    severity: 'MAJOR',
    status: 'ROOT_CAUSE',
    isSystemic: true,
    phase: 4,
    progress: 45,
    createdAt: '2026-02-03T15:00:00',
    dueDate: '2026-02-17T23:59:59',
    owner: 'Mike Johnson',
  },
  {
    id: '2',
    carNumber: 'CAR-26-0011',
    claimNumber: 'CLM-26-0035',
    customer: 'Premier Fabrication',
    title: 'Repeated Dimension Variance Issues',
    category: 'EQUIPMENT',
    severity: 'MAJOR',
    status: 'CORRECTIVE_ACTION',
    isSystemic: false,
    phase: 5,
    progress: 60,
    createdAt: '2026-01-28T10:00:00',
    dueDate: '2026-02-11T23:59:59',
    owner: 'Sarah Chen',
  },
  {
    id: '3',
    carNumber: 'CAR-26-0010',
    claimNumber: 'CLM-26-0030',
    customer: 'ABC Manufacturing',
    title: 'Incorrect MTR Documentation',
    category: 'PROCEDURE',
    severity: 'MINOR',
    status: 'VERIFICATION',
    isSystemic: false,
    phase: 6,
    progress: 80,
    createdAt: '2026-01-20T14:00:00',
    dueDate: '2026-02-05T23:59:59',
    owner: 'Mike Johnson',
  },
  {
    id: '4',
    carNumber: 'CAR-26-0009',
    claimNumber: 'CLM-26-0025',
    customer: 'Delta Steel Works',
    title: 'Shipping Damage Prevention',
    category: 'PROCESS',
    severity: 'MINOR',
    status: 'CLOSED',
    isSystemic: false,
    phase: 8,
    progress: 100,
    createdAt: '2026-01-15T09:00:00',
    closedAt: '2026-01-28T16:00:00',
    owner: 'Sarah Chen',
  },
]

const statusConfig = {
  OPEN: { label: 'Open', color: 'default' },
  CONTAINMENT: { label: 'Containment', color: 'warning' },
  ROOT_CAUSE: { label: 'Root Cause Analysis', color: 'info' },
  CORRECTIVE_ACTION: { label: 'Corrective Action', color: 'primary' },
  VERIFICATION: { label: 'Verification', color: 'secondary' },
  EFFECTIVENESS: { label: 'Effectiveness Review', color: 'info' },
  CLOSED: { label: 'Closed', color: 'success' },
}

const categoryLabels = {
  PROCESS: 'Process',
  EQUIPMENT: 'Equipment',
  MATERIAL: 'Material',
  TRAINING: 'Training',
  PROCEDURE: 'Procedure',
  ENVIRONMENT: 'Environment',
  MEASUREMENT: 'Measurement',
  SUPPLIER: 'Supplier',
  DESIGN: 'Design',
}

const severityConfig = {
  CRITICAL: { label: 'Critical', color: 'error' },
  MAJOR: { label: 'Major', color: 'warning' },
  MINOR: { label: 'Minor', color: 'info' },
}

const carSteps = [
  { label: 'D1', name: 'Team Formation', description: 'Establish cross-functional team' },
  { label: 'D2', name: 'Problem Description', description: 'Define the problem clearly' },
  { label: 'D3', name: 'Containment', description: 'Implement containment actions' },
  { label: 'D4', name: 'Root Cause', description: 'Identify root cause(s)' },
  { label: 'D5', name: 'Corrective Actions', description: 'Define permanent solutions' },
  { label: 'D6', name: 'Implementation', description: 'Implement and verify' },
  { label: 'D7', name: 'Prevention', description: 'Prevent recurrence' },
  { label: 'D8', name: 'Closure', description: 'Close and recognize team' },
]

export default function CARManagementPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCAR, setSelectedCAR] = useState(null)

  const filteredCARs = mockCARs.filter((car) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        car.carNumber.toLowerCase().includes(query) ||
        car.customer.toLowerCase().includes(query) ||
        car.title.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return car.status !== 'CLOSED'
    if (tabValue === 2) return car.status === 'CLOSED'
    return true
  })

  const activeCount = mockCARs.filter((c) => c.status !== 'CLOSED').length
  const overdueCount = mockCARs.filter((c) =>
    c.status !== 'CLOSED' && c.dueDate && new Date(c.dueDate) < new Date()
  ).length
  const systemicCount = mockCARs.filter((c) => c.isSystemic).length

  if (selectedCAR) {
    return <CARDetailView car={selectedCAR} onBack={() => setSelectedCAR(null)} />
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Corrective Action Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer quality corrective actions (8D format)
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          New CAR
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Active CARs
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {activeCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Overdue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {overdueCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Systemic Issues
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {systemicCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Avg Resolution
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                12d
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockCARs.length})`} />
            <Tab label={`Active (${activeCount})`} />
            <Tab label={`Closed (${mockCARs.length - activeCount})`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search CARs..."
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
                <TableCell>CAR #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Phase</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCARs.map((car) => {
                const status = statusConfig[car.status]
                const severity = severityConfig[car.severity]
                const isOverdue = car.dueDate && new Date(car.dueDate) < new Date() && car.status !== 'CLOSED'
                return (
                  <TableRow key={car.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {car.carNumber}
                        </Typography>
                        {car.isSystemic && (
                          <Chip label="Systemic" size="small" color="error" variant="outlined" />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {car.claimNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{car.customer}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                        {car.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={categoryLabels[car.category]} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={`D${car.phase}`} color="primary" size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={car.progress}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          color={car.progress === 100 ? 'success' : 'primary'}
                        />
                        <Typography variant="caption">{car.progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell>
                      {car.status === 'CLOSED' ? (
                        <Typography variant="body2" color="success.main">Closed</Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ color: isOverdue ? 'error.main' : 'text.primary', fontWeight: isOverdue ? 600 : 400 }}
                        >
                          {new Date(car.dueDate).toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{car.owner}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" onClick={() => setSelectedCAR(car)}>
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

function CARDetailView({ car, onBack }) {
  const [expandedPhase, setExpandedPhase] = useState(`d${car.phase}`)
  const status = statusConfig[car.status]
  const severity = severityConfig[car.severity]

  const phaseData = {
    d1: {
      complete: car.phase > 1,
      teamMembers: ['Mike Johnson (Lead)', 'Sarah Chen (Quality)', 'Tom Wilson (Production)'],
    },
    d2: {
      complete: car.phase > 2,
      description: car.title,
      occurrence: '3 instances in last 60 days',
      impact: `Customer: ${car.customer} - Production delay, cost impact ~$4,500`,
    },
    d3: {
      complete: car.phase > 3,
      actions: [
        { action: 'Quarantine similar inventory', status: 'complete' },
        { action: 'Increase inspection frequency', status: 'complete' },
        { action: 'Notify affected customers', status: 'complete' },
      ],
    },
    d4: {
      complete: car.phase > 4,
      rootCause: 'Improper handling during coil transfer causing surface contact',
      method: '5-Why Analysis',
    },
    d5: {
      complete: car.phase > 5,
      actions: [
        { action: 'Install protective sleeves on transfer equipment', status: 'pending', dueDate: '2026-02-10' },
        { action: 'Update handling procedure', status: 'pending', dueDate: '2026-02-12' },
        { action: 'Train operators on new procedure', status: 'pending', dueDate: '2026-02-15' },
      ],
    },
    d6: { complete: car.phase > 6, verification: 'Verify effectiveness of corrective actions' },
    d7: { complete: car.phase > 7, prevention: 'Apply learnings to other product lines' },
    d8: { complete: car.phase > 8, recognition: 'Close and recognize team' },
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button variant="text" onClick={onBack} sx={{ mb: 1 }}>
            ← Back to CARs
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {car.carNumber}
            </Typography>
            <Chip label={`D${car.phase}`} color="primary" />
            <Chip label={status.label} color={status.color} />
            {car.isSystemic && <Chip label="Systemic" color="error" />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {car.customer} | Claim: {car.claimNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined">Request Update</Button>
          {car.status !== 'CLOSED' && (
            <Button variant="contained" color="success">Close CAR</Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 8D Progress */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>8D Progress</Typography>
            <Stepper activeStep={car.phase - 1} alternativeLabel sx={{ mb: 3 }}>
              {carSteps.map((step) => (
                <Step key={step.label}>
                  <StepLabel>
                    <Typography variant="caption">{step.label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {carSteps.map((step, index) => (
              <Accordion
                key={step.label}
                expanded={expandedPhase === `d${index + 1}`}
                onChange={() => setExpandedPhase(expandedPhase === `d${index + 1}` ? null : `d${index + 1}`)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    {phaseData[`d${index + 1}`]?.complete ? (
                      <CompleteIcon color="success" />
                    ) : index + 1 === car.phase ? (
                      <WarningIcon color="warning" />
                    ) : (
                      <PendingIcon color="disabled" />
                    )}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{step.label}: {step.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{step.description}</Typography>
                    </Box>
                    {phaseData[`d${index + 1}`]?.complete && <Chip label="Complete" color="success" size="small" />}
                    {index + 1 === car.phase && <Chip label="In Progress" color="warning" size="small" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {index === 0 && phaseData.d1.teamMembers && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Team Members</Typography>
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
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">Problem Statement</Typography>
                        <Typography variant="body2">{phaseData.d2.description}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Occurrence</Typography>
                        <Typography variant="body2">{phaseData.d2.occurrence}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Impact</Typography>
                        <Typography variant="body2">{phaseData.d2.impact}</Typography>
                      </Grid>
                    </Grid>
                  )}
                  {index === 2 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Containment Actions</Typography>
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
                      <Typography variant="subtitle2" gutterBottom>Corrective Actions</Typography>
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
                    <Typography variant="body2" color="text.secondary">
                      This phase has not been started yet.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Overall Progress</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress
                variant="determinate"
                value={car.progress}
                sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                color={car.progress === 100 ? 'success' : 'primary'}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{car.progress}%</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Due Date</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {car.dueDate ? new Date(car.dueDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Customer</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{car.customer}</Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Category</Typography>
            <Chip label={categoryLabels[car.category]} />
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Owner</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{car.owner}</Typography>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" size="small" fullWidth startIcon={<CommentIcon />}>Add Comment</Button>
              <FileUploadZone
                compact
                entityType="CAR"
                accept="application/pdf,image/*"
                buttonLabel="Add Attachment"
                multiple
              />
              <Button variant="outlined" size="small" fullWidth startIcon={<TaskIcon />}>Add Action Item</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
