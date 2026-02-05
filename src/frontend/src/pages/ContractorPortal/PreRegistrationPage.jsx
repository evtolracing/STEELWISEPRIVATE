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
  Tabs,
  Tab,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as ExpiredIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'

// Mock Invitations Data
const mockInvitations = [
  {
    id: '1',
    inviteCode: 'INV-2026-0847',
    visitorName: 'Tom Anderson',
    visitorEmail: 'tanderson@deltawelding.com',
    visitorCompany: 'Delta Welding Co.',
    visitorType: 'HOT_WORK_CONTRACTOR',
    purpose: 'Structural welding repairs - Beam support',
    sponsor: 'Mike Johnson',
    sponsorEmail: 'mjohnson@company.com',
    scheduledDate: '2026-02-05',
    scheduledTime: '08:00 - 16:00',
    areas: ['Fabrication Bay', 'Welding Area'],
    status: 'PENDING_REQUIREMENTS',
    requirements: {
      orientation: true,
      insurance: true,
      safetyRules: true,
      jha: false,
      permit: false,
    },
    createdAt: '2026-02-03T10:00:00',
    expiresAt: '2026-02-05T18:00:00',
  },
  {
    id: '2',
    inviteCode: 'INV-2026-0848',
    visitorName: 'Sarah Miller',
    visitorEmail: 'smiller@qualityaudit.com',
    visitorCompany: 'Quality Auditing Services',
    visitorType: 'INSPECTOR_AUDITOR',
    purpose: 'Customer quality audit',
    sponsor: 'Sarah Williams',
    sponsorEmail: 'swilliams@company.com',
    scheduledDate: '2026-02-06',
    scheduledTime: '09:00 - 17:00',
    areas: ['Quality Lab', 'Production Floor', 'Document Control'],
    status: 'APPROVED',
    requirements: {
      orientation: true,
      insurance: true,
      safetyRules: true,
      jha: false,
      permit: false,
    },
    createdAt: '2026-02-02T14:00:00',
    expiresAt: '2026-02-06T18:00:00',
  },
  {
    id: '3',
    inviteCode: 'INV-2026-0849',
    visitorName: 'James Wilson',
    visitorEmail: 'jwilson@abcelectric.com',
    visitorCompany: 'ABC Electric',
    visitorType: 'ELECTRICAL_CONTRACTOR',
    purpose: 'Panel upgrade - Saw Line',
    sponsor: 'Facilities',
    sponsorEmail: 'facilities@company.com',
    scheduledDate: '2026-02-07',
    scheduledTime: '07:00 - 15:00',
    areas: ['Electrical Room B', 'Saw Line Panel'],
    status: 'APPROVED',
    requirements: {
      orientation: true,
      insurance: true,
      safetyRules: true,
      jha: true,
      permit: true,
    },
    createdAt: '2026-02-01T09:00:00',
    expiresAt: '2026-02-07T16:00:00',
  },
  {
    id: '4',
    inviteCode: 'INV-2026-0850',
    visitorName: 'Lisa Chen',
    visitorEmail: 'lchen@customerxyz.com',
    visitorCompany: 'XYZ Manufacturing',
    visitorType: 'VISITOR_NONWORKING',
    purpose: 'Facility tour - potential partnership',
    sponsor: 'Sales Manager',
    sponsorEmail: 'sales@company.com',
    scheduledDate: '2026-02-08',
    scheduledTime: '10:00 - 12:00',
    areas: ['Conference Room', 'Tour Path'],
    status: 'INVITED',
    requirements: {
      orientation: false,
      insurance: false,
      safetyRules: false,
      jha: false,
      permit: false,
    },
    createdAt: '2026-02-04T08:00:00',
    expiresAt: '2026-02-08T13:00:00',
  },
  {
    id: '5',
    inviteCode: 'INV-2026-0845',
    visitorName: 'Robert Davis',
    visitorEmail: 'rdavis@hvacpro.com',
    visitorCompany: 'HVAC Pro Services',
    visitorType: 'MAINTENANCE_CONTRACTOR',
    purpose: 'AC unit repair',
    sponsor: 'Facilities',
    sponsorEmail: 'facilities@company.com',
    scheduledDate: '2026-01-30',
    scheduledTime: '08:00 - 12:00',
    areas: ['Roof', 'Mechanical Room'],
    status: 'EXPIRED',
    requirements: {
      orientation: true,
      insurance: true,
      safetyRules: true,
      jha: false,
      permit: false,
    },
    createdAt: '2026-01-28T10:00:00',
    expiresAt: '2026-01-30T13:00:00',
  },
]

const typeConfig = {
  MAINTENANCE_CONTRACTOR: { label: 'Maintenance', color: 'warning' },
  ELECTRICAL_CONTRACTOR: { label: 'Electrical', color: 'error' },
  RIGGING_CRANE_CONTRACTOR: { label: 'Rigging/Crane', color: 'error' },
  HOT_WORK_CONTRACTOR: { label: 'Hot Work', color: 'error' },
  IT_VENDOR: { label: 'IT Vendor', color: 'info' },
  CARRIER_DRIVER: { label: 'Driver', color: 'info' },
  INSPECTOR_AUDITOR: { label: 'Inspector', color: 'secondary' },
  VISITOR_NONWORKING: { label: 'Visitor', color: 'default' },
}

const statusConfig = {
  INVITED: { label: 'Invited', color: 'info', icon: EmailIcon },
  PENDING_REQUIREMENTS: { label: 'Pending Requirements', color: 'warning', icon: PendingIcon },
  APPROVED: { label: 'Approved', color: 'success', icon: ApprovedIcon },
  CHECKED_IN: { label: 'Checked In', color: 'success', icon: ApprovedIcon },
  EXPIRED: { label: 'Expired', color: 'default', icon: ExpiredIcon },
  CANCELLED: { label: 'Cancelled', color: 'error', icon: ExpiredIcon },
}

export default function PreRegistrationPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvitation, setSelectedInvitation] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const filteredInvitations = mockInvitations.filter((invitation) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        invitation.visitorName.toLowerCase().includes(query) ||
        invitation.visitorCompany.toLowerCase().includes(query) ||
        invitation.inviteCode.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return ['INVITED', 'PENDING_REQUIREMENTS'].includes(invitation.status)
    if (tabValue === 2) return invitation.status === 'APPROVED'
    if (tabValue === 3) return invitation.status === 'EXPIRED'
    return true
  })

  const pendingCount = mockInvitations.filter((i) =>
    ['INVITED', 'PENDING_REQUIREMENTS'].includes(i.status)
  ).length
  const approvedCount = mockInvitations.filter((i) => i.status === 'APPROVED').length
  const upcomingToday = mockInvitations.filter(
    (i) =>
      i.status === 'APPROVED' &&
      new Date(i.scheduledDate).toDateString() === new Date().toDateString()
  ).length

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Pre-Registration & Invitations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage contractor and visitor invitations before arrival
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Invitation
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Pending
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {pendingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Awaiting completion
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Ready
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {approvedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Approved for check-in
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: upcomingToday > 0 ? 'primary.lighter' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Today
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {upcomingToday}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Expected arrivals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                This Week
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {mockInvitations.filter((i) => i.status === 'APPROVED').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Scheduled visits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockInvitations.length})`} />
            <Tab label={`Pending (${pendingCount})`} />
            <Tab label={`Approved (${approvedCount})`} />
            <Tab label={`Expired`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search invitations..."
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
                <TableCell>Invite Code</TableCell>
                <TableCell>Visitor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Scheduled</TableCell>
                <TableCell>Sponsor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requirements</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvitations.map((invitation) => {
                const type = typeConfig[invitation.visitorType]
                const status = statusConfig[invitation.status]
                const completedReqs = Object.values(invitation.requirements).filter(Boolean).length
                const totalReqs = Object.values(invitation.requirements).length

                return (
                  <TableRow key={invitation.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontFamily: 'monospace' }}
                      >
                        {invitation.inviteCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.400' }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {invitation.visitorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {invitation.visitorCompany}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={type.label} color={type.color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(invitation.scheduledDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invitation.scheduledTime}
                      </Typography>
                    </TableCell>
                    <TableCell>{invitation.sponsor}</TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {completedReqs}/{totalReqs} complete
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedInvitation(invitation)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Copy invite link">
                        <CopyIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Resend email">
                        <EmailIcon fontSize="small" />
                      </IconButton>
                      {invitation.status !== 'EXPIRED' && (
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
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

      {/* Invitation Detail Dialog */}
      <Dialog
        open={!!selectedInvitation}
        onClose={() => setSelectedInvitation(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedInvitation && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Invitation Details</Typography>
                <Chip
                  label={statusConfig[selectedInvitation.status].label}
                  color={statusConfig[selectedInvitation.status].color}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Invite Code: <strong>{selectedInvitation.inviteCode}</strong>
                  </Alert>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Visitor
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedInvitation.visitorName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedInvitation.visitorEmail}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Company
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedInvitation.visitorCompany}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Scheduled Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {new Date(selectedInvitation.scheduledDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedInvitation.scheduledTime}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Sponsor
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedInvitation.sponsor}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Purpose
                  </Typography>
                  <Typography variant="body1">{selectedInvitation.purpose}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Authorized Areas
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {selectedInvitation.areas.map((area, idx) => (
                      <Chip key={idx} label={area} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Requirements Checklist
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(selectedInvitation.requirements).map(([key, completed]) => (
                      <Grid item xs={6} sm={4} key={key}>
                        <Chip
                          icon={completed ? <ApprovedIcon /> : <PendingIcon />}
                          label={key.replace(/([A-Z])/g, ' $1').trim()}
                          color={completed ? 'success' : 'default'}
                          variant={completed ? 'filled' : 'outlined'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedInvitation(null)}>Close</Button>
              <Button startIcon={<EmailIcon />} variant="outlined">
                Resend Invitation
              </Button>
              {selectedInvitation.status === 'APPROVED' && (
                <Button variant="contained" color="success">
                  Manual Check-In
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Invitation Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Invitation</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Visitor Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Visitor Name" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email Address" type="email" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Company" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Visitor Type</InputLabel>
                <Select label="Visitor Type">
                  <MenuItem value="MAINTENANCE_CONTRACTOR">Maintenance Contractor</MenuItem>
                  <MenuItem value="ELECTRICAL_CONTRACTOR">Electrical Contractor</MenuItem>
                  <MenuItem value="HOT_WORK_CONTRACTOR">Hot Work Contractor</MenuItem>
                  <MenuItem value="IT_VENDOR">IT Vendor</MenuItem>
                  <MenuItem value="INSPECTOR_AUDITOR">Inspector / Auditor</MenuItem>
                  <MenuItem value="VISITOR_NONWORKING">Visitor (Non-Working)</MenuItem>
                  <MenuItem value="CARRIER_DRIVER">Carrier / Driver</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Visit Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Start Time" type="time" InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="End Time" type="time" InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Purpose of Visit" multiline rows={2} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Areas to Access" placeholder="e.g., Production Floor, Quality Lab" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setCreateDialogOpen(false)}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
