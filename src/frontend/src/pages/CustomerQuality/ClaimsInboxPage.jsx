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
  Avatar,
  Tooltip,
  Badge,
  LinearProgress,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  CheckCircle as ResolvedIcon,
  Schedule as ScheduleIcon,
  AttachFile as AttachIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
} from '@mui/icons-material'

// Mock Claims Data
const mockClaims = [
  {
    id: '1',
    claimNumber: 'CLM-26-0042',
    customer: 'ABC Manufacturing',
    customerId: 'CUST-001',
    orderNumber: 'SO-26-1234',
    claimType: 'WRONG_MATERIAL',
    severity: 'MAJOR',
    status: 'NEW',
    priority: 1,
    description: 'Received 0.125" material instead of ordered 0.100"',
    claimedAmount: 3500,
    createdAt: '2026-02-04T08:30:00',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    slaAtRisk: false,
    hasAttachments: true,
    hasUnreadMessages: true,
    unreadCount: 2,
  },
  {
    id: '2',
    claimNumber: 'CLM-26-0041',
    customer: 'XYZ Industries',
    customerId: 'CUST-002',
    orderNumber: 'SO-26-1228',
    claimType: 'QUALITY_DEFECT',
    severity: 'CRITICAL',
    status: 'UNDER_REVIEW',
    priority: 1,
    description: 'Surface scratches on galvanized material. Not acceptable for exposed use.',
    claimedAmount: 8200,
    createdAt: '2026-02-03T14:15:00',
    owner: 'Mike Johnson',
    ownerInitials: 'MJ',
    slaAtRisk: true,
    hasAttachments: true,
    hasUnreadMessages: false,
    unreadCount: 0,
  },
  {
    id: '3',
    claimNumber: 'CLM-26-0040',
    customer: 'Premier Fabrication',
    customerId: 'CUST-003',
    orderNumber: 'SO-26-1220',
    claimType: 'WRONG_QUANTITY',
    severity: 'STANDARD',
    status: 'ACKNOWLEDGED',
    priority: 3,
    description: 'Short shipped by 500 lbs on order',
    claimedAmount: 450,
    createdAt: '2026-02-02T11:00:00',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    slaAtRisk: false,
    hasAttachments: false,
    hasUnreadMessages: true,
    unreadCount: 1,
  },
  {
    id: '4',
    claimNumber: 'CLM-26-0039',
    customer: 'Delta Steel Works',
    customerId: 'CUST-004',
    orderNumber: 'SO-26-1215',
    claimType: 'DAMAGE_TRANSIT',
    severity: 'MAJOR',
    status: 'DISPOSITION_SET',
    priority: 2,
    description: 'Coil damaged during shipping - edge bent',
    claimedAmount: 2100,
    createdAt: '2026-01-30T09:45:00',
    owner: 'Mike Johnson',
    ownerInitials: 'MJ',
    slaAtRisk: false,
    hasAttachments: true,
    hasUnreadMessages: false,
    unreadCount: 0,
  },
  {
    id: '5',
    claimNumber: 'CLM-26-0038',
    customer: 'ABC Manufacturing',
    customerId: 'CUST-001',
    orderNumber: 'SO-26-1210',
    claimType: 'PAPERWORK_ERROR',
    severity: 'MINOR',
    status: 'RESOLVED',
    priority: 4,
    description: 'MTR shows incorrect heat number',
    claimedAmount: 0,
    createdAt: '2026-01-28T16:30:00',
    resolvedAt: '2026-01-29T10:00:00',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    slaAtRisk: false,
    hasAttachments: false,
    hasUnreadMessages: false,
    unreadCount: 0,
  },
  {
    id: '6',
    claimNumber: 'CLM-26-0037',
    customer: 'Omega Parts Inc',
    customerId: 'CUST-005',
    orderNumber: 'SO-26-1205',
    claimType: 'LATE_DELIVERY',
    severity: 'STANDARD',
    status: 'CLOSED',
    priority: 3,
    description: 'Delivery 2 days late, missed production window',
    claimedAmount: 500,
    createdAt: '2026-01-25T08:00:00',
    resolvedAt: '2026-01-27T14:00:00',
    closedAt: '2026-01-28T09:00:00',
    owner: 'Mike Johnson',
    ownerInitials: 'MJ',
    slaAtRisk: false,
    hasAttachments: false,
    hasUnreadMessages: false,
    unreadCount: 0,
  },
]

const claimTypeLabels = {
  WRONG_MATERIAL: 'Wrong Material',
  WRONG_QUANTITY: 'Wrong Quantity',
  DAMAGE_TRANSIT: 'Damage (Transit)',
  DAMAGE_PROCESSING: 'Damage (Processing)',
  QUALITY_DEFECT: 'Quality Defect',
  LATE_DELIVERY: 'Late Delivery',
  PAPERWORK_ERROR: 'Paperwork Error',
  PRICING_DISPUTE: 'Pricing Dispute',
  OTHER: 'Other',
}

const statusConfig = {
  NEW: { label: 'New', color: 'default' },
  ACKNOWLEDGED: { label: 'Acknowledged', color: 'info' },
  UNDER_REVIEW: { label: 'Under Review', color: 'warning' },
  PENDING_CUSTOMER: { label: 'Pending Customer', color: 'secondary' },
  DISPOSITION_SET: { label: 'Disposition Set', color: 'primary' },
  IN_PROGRESS: { label: 'In Progress', color: 'info' },
  RESOLVED: { label: 'Resolved', color: 'success' },
  CLOSED: { label: 'Closed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
}

const severityConfig = {
  CRITICAL: { label: 'Critical', color: 'error' },
  MAJOR: { label: 'Major', color: 'warning' },
  STANDARD: { label: 'Standard', color: 'info' },
  MINOR: { label: 'Minor', color: 'default' },
}

function formatAge(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  return 'Just now'
}

export default function ClaimsInboxPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const filteredClaims = mockClaims.filter((claim) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !claim.claimNumber.toLowerCase().includes(query) &&
        !claim.customer.toLowerCase().includes(query) &&
        !claim.description.toLowerCase().includes(query)
      ) {
        return false
      }
    }
    if (statusFilter !== 'all' && claim.status !== statusFilter) return false
    if (typeFilter !== 'all' && claim.claimType !== typeFilter) return false
    
    // Tab filtering
    if (tabValue === 1) return ['NEW', 'ACKNOWLEDGED', 'UNDER_REVIEW'].includes(claim.status)
    if (tabValue === 2) return claim.slaAtRisk
    if (tabValue === 3) return ['RESOLVED', 'CLOSED'].includes(claim.status)
    return true
  })

  const openCount = mockClaims.filter((c) => ['NEW', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'PENDING_CUSTOMER', 'DISPOSITION_SET', 'IN_PROGRESS'].includes(c.status)).length
  const awaitingCount = mockClaims.filter((c) => c.status === 'PENDING_CUSTOMER').length
  const slaAtRiskCount = mockClaims.filter((c) => c.slaAtRisk).length
  const resolvedWeekCount = mockClaims.filter((c) => 
    ['RESOLVED', 'CLOSED'].includes(c.status) && 
    new Date(c.resolvedAt || c.closedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length
  const totalClaimed = mockClaims.reduce((sum, c) => sum + (c.claimedAmount || 0), 0)

  if (selectedClaim) {
    return <ClaimDetailView claim={selectedClaim} onBack={() => setSelectedClaim(null)} />
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Claims Inbox
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer quality claims and returns
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Claim
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Open Claims
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {openCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                +3 today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Awaiting Response
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {awaitingCount}
              </Typography>
              <ScheduleIcon sx={{ color: 'info.main', fontSize: 20 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                SLA At Risk
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {slaAtRiskCount}
              </Typography>
              <WarningIcon sx={{ color: 'error.main', fontSize: 20 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Resolved This Week
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {resolvedWeekCount}
              </Typography>
              <ResolvedIcon sx={{ color: 'success.main', fontSize: 20 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Total Claimed
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ${totalClaimed.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                MTD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockClaims.length})`} />
            <Tab label={`Open (${openCount})`} />
            <Tab label={`SLA At Risk (${slaAtRiskCount})`} />
            <Tab label={`Resolved`} />
          </Tabs>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search claims..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">All Statuses</MenuItem>
              {Object.entries(statusConfig).map(([key, val]) => (
                <MenuItem key={key} value={key}>{val.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="all">All Types</MenuItem>
              {Object.entries(claimTypeLabels).map(([key, val]) => (
                <MenuItem key={key} value={key}>{val}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Claim #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClaims.map((claim) => {
                const status = statusConfig[claim.status]
                const severity = severityConfig[claim.severity]
                return (
                  <TableRow
                    key={claim.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      bgcolor: claim.slaAtRisk ? 'error.50' : 'inherit',
                    }}
                    onClick={() => setSelectedClaim(claim)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {claim.claimNumber}
                        </Typography>
                        {claim.hasAttachments && <AttachIcon fontSize="small" color="action" />}
                        {claim.hasUnreadMessages && (
                          <Badge badgeContent={claim.unreadCount} color="primary" sx={{ ml: 1 }}>
                            <MessageIcon fontSize="small" />
                          </Badge>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{claim.customer}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {claim.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={claimTypeLabels[claim.claimType]} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={severity.label} color={severity.color} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      {claim.claimedAmount > 0 ? `$${claim.claimedAmount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatAge(claim.createdAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={claim.owner}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                          {claim.ownerInitials}
                        </Avatar>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); setSelectedClaim(claim); }}>
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

      {/* Create Claim Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Customer Claim</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Customer *</InputLabel>
                <Select label="Customer *" defaultValue="">
                  <MenuItem value="CUST-001">ABC Manufacturing</MenuItem>
                  <MenuItem value="CUST-002">XYZ Industries</MenuItem>
                  <MenuItem value="CUST-003">Premier Fabrication</MenuItem>
                  <MenuItem value="CUST-004">Delta Steel Works</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Customer PO / Order Reference" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Claim Type *</InputLabel>
                <Select label="Claim Type *" defaultValue="">
                  {Object.entries(claimTypeLabels).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severity *</InputLabel>
                <Select label="Severity *" defaultValue="STANDARD">
                  <MenuItem value="CRITICAL">Critical (Production Stopped)</MenuItem>
                  <MenuItem value="MAJOR">Major (Significant Impact)</MenuItem>
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="MINOR">Minor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                multiline
                rows={4}
                placeholder="Describe the customer's complaint in detail..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Claimed Amount ($)" type="number" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Claimed Quantity" type="number" />
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
          <Button variant="contained" onClick={() => setCreateDialogOpen(false)}>
            Create Claim
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function ClaimDetailView({ claim, onBack }) {
  const status = statusConfig[claim.status]
  const severity = severityConfig[claim.severity]

  const workflowSteps = ['New', 'Acknowledged', 'Under Review', 'Disposition', 'Resolved', 'Closed']
  const statusToStep = {
    NEW: 0,
    ACKNOWLEDGED: 1,
    UNDER_REVIEW: 2,
    PENDING_CUSTOMER: 2,
    DISPOSITION_SET: 3,
    IN_PROGRESS: 3,
    RESOLVED: 4,
    CLOSED: 5,
  }
  const currentStep = statusToStep[claim.status] || 0

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button variant="text" onClick={onBack} sx={{ mb: 1 }}>
            ← Back to Claims
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {claim.claimNumber}
            </Typography>
            <Chip label={status.label} color={status.color} />
            <Chip label={severity.label} color={severity.color} variant="outlined" />
            {claim.slaAtRisk && <Chip label="SLA At Risk" color="error" icon={<WarningIcon />} />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {claim.customer} | {claim.orderNumber} | Created {new Date(claim.createdAt).toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined">Acknowledge</Button>
          <Button variant="outlined" color="warning">Set Disposition</Button>
          <Button variant="contained" color="success">Resolve</Button>
        </Box>
      </Box>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {workflowSteps.map((step, index) => (
            <Box key={step} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: index <= currentStep ? 'primary.main' : 'grey.300',
                  color: index <= currentStep ? 'white' : 'text.secondary',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {index < currentStep ? '✓' : index + 1}
              </Box>
              <Typography variant="caption" sx={{ ml: 1, color: index <= currentStep ? 'primary.main' : 'text.secondary' }}>
                {step}
              </Typography>
              {index < workflowSteps.length - 1 && (
                <Box sx={{ flex: 1, height: 2, bgcolor: index < currentStep ? 'primary.main' : 'grey.300', mx: 2 }} />
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Claim Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Claim Type</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{claimTypeLabels[claim.claimType]}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Claimed Amount</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'error.main' }}>
                  ${claim.claimedAmount?.toLocaleString() || '0'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body1">{claim.description}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Activity / Communications */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Communications
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                Claim created by {claim.owner} on {new Date(claim.createdAt).toLocaleString()}
              </Typography>
            </Box>
            <TextField
              fullWidth
              placeholder="Add a note or message..."
              multiline
              rows={2}
            />
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small">Send to Customer</Button>
              <Button variant="outlined" size="small">Internal Note</Button>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Customer</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{claim.customer}</Typography>
            <Typography variant="caption" color="text.secondary">{claim.customerId}</Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Order Reference</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{claim.orderNumber}</Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Owner</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32 }}>{claim.ownerInitials}</Avatar>
              <Typography variant="body1">{claim.owner}</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" size="small" fullWidth>Create RMA</Button>
              <Button variant="outlined" size="small" fullWidth>Issue Credit</Button>
              <Button variant="outlined" size="small" fullWidth>Create CAR</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
