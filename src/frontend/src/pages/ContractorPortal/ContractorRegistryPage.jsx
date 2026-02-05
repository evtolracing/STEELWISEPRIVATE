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
  Alert,
  LinearProgress,
} from '@mui/material'
import {
  Search as SearchIcon,
  PersonAdd as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Warning as WarningIcon,
  Engineering as ContractorIcon,
  Business as CompanyIcon,
  Assignment as DocumentIcon,
  Verified as VerifiedIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'

// Mock Contractors Registry Data
const mockContractors = [
  {
    id: '1',
    companyName: 'ABC Electric',
    dbaName: null,
    type: 'ELECTRICAL_CONTRACTOR',
    contacts: [
      { name: 'John Smith', role: 'Lead Electrician', phone: '555-0101', email: 'jsmith@abcelectric.com' },
      { name: 'Mike Brown', role: 'Journeyman', phone: '555-0102', email: 'mbrown@abcelectric.com' },
    ],
    status: 'ACTIVE',
    insuranceStatus: 'VALID',
    insuranceExpiry: '2026-08-15',
    glCoverage: 2000000,
    wcCoverage: 'Statutory',
    orientationStatus: 'COMPLETE',
    lastVisit: '2026-02-04',
    visitCount: 24,
    registeredAt: '2024-03-15',
    rating: 4.8,
    violations: 0,
  },
  {
    id: '2',
    companyName: 'Industrial HVAC Inc.',
    dbaName: 'IHVAC',
    type: 'MAINTENANCE_CONTRACTOR',
    contacts: [
      { name: 'Robert Williams', role: 'Service Manager', phone: '555-0201', email: 'rwilliams@ihvac.com' },
    ],
    status: 'ACTIVE',
    insuranceStatus: 'VALID',
    insuranceExpiry: '2026-06-30',
    glCoverage: 1000000,
    wcCoverage: 'Statutory',
    orientationStatus: 'COMPLETE',
    lastVisit: '2026-02-04',
    visitCount: 18,
    registeredAt: '2024-05-20',
    rating: 4.5,
    violations: 1,
  },
  {
    id: '3',
    companyName: 'SafeWeld Contractors',
    dbaName: null,
    type: 'HOT_WORK_CONTRACTOR',
    contacts: [
      { name: 'James Wilson', role: 'Certified Welder', phone: '555-0301', email: 'jwilson@safeweld.com' },
    ],
    status: 'ACTIVE',
    insuranceStatus: 'EXPIRING_SOON',
    insuranceExpiry: '2026-02-28',
    glCoverage: 2000000,
    wcCoverage: 'Statutory',
    orientationStatus: 'COMPLETE',
    lastVisit: '2026-01-15',
    visitCount: 8,
    registeredAt: '2025-01-10',
    rating: 4.9,
    violations: 0,
  },
  {
    id: '4',
    companyName: 'TechSupport Pro',
    dbaName: null,
    type: 'IT_VENDOR',
    contacts: [
      { name: 'Lisa Chen', role: 'IT Specialist', phone: '555-0401', email: 'lchen@techsupport.com' },
    ],
    status: 'ACTIVE',
    insuranceStatus: 'VALID',
    insuranceExpiry: '2026-12-31',
    glCoverage: 1000000,
    wcCoverage: null,
    orientationStatus: 'COMPLETE',
    lastVisit: '2026-01-28',
    visitCount: 6,
    registeredAt: '2025-06-01',
    rating: 4.2,
    violations: 0,
  },
  {
    id: '5',
    companyName: 'Heavy Lift Solutions',
    dbaName: 'HLS Rigging',
    type: 'RIGGING_CRANE_CONTRACTOR',
    contacts: [
      { name: 'Tom Jackson', role: 'Crane Operator', phone: '555-0501', email: 'tjackson@hls.com' },
    ],
    status: 'INACTIVE',
    insuranceStatus: 'EXPIRED',
    insuranceExpiry: '2026-01-01',
    glCoverage: 5000000,
    wcCoverage: 'Statutory',
    orientationStatus: 'EXPIRED',
    lastVisit: '2025-12-15',
    visitCount: 3,
    registeredAt: '2025-09-01',
    rating: 4.0,
    violations: 0,
  },
]

const typeConfig = {
  MAINTENANCE_CONTRACTOR: { label: 'Maintenance', color: 'warning' },
  ELECTRICAL_CONTRACTOR: { label: 'Electrical', color: 'error' },
  RIGGING_CRANE_CONTRACTOR: { label: 'Rigging/Crane', color: 'error' },
  HOT_WORK_CONTRACTOR: { label: 'Hot Work', color: 'error' },
  IT_VENDOR: { label: 'IT Vendor', color: 'info' },
  CARRIER_DRIVER: { label: 'Driver', color: 'info' },
}

const insuranceStatusConfig = {
  VALID: { label: 'Valid', color: 'success' },
  EXPIRING_SOON: { label: 'Expiring Soon', color: 'warning' },
  EXPIRED: { label: 'Expired', color: 'error' },
}

export default function ContractorRegistryPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContractor, setSelectedContractor] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const filteredContractors = mockContractors.filter((contractor) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        contractor.companyName.toLowerCase().includes(query) ||
        contractor.contacts.some((c) => c.name.toLowerCase().includes(query))
      )
    }
    if (tabValue === 1) return contractor.status === 'ACTIVE'
    if (tabValue === 2) return contractor.insuranceStatus === 'EXPIRING_SOON'
    if (tabValue === 3) return contractor.status === 'INACTIVE' || contractor.insuranceStatus === 'EXPIRED'
    return true
  })

  const activeCount = mockContractors.filter((c) => c.status === 'ACTIVE').length
  const expiringCount = mockContractors.filter((c) => c.insuranceStatus === 'EXPIRING_SOON').length
  const issuesCount = mockContractors.filter(
    (c) => c.status === 'INACTIVE' || c.insuranceStatus === 'EXPIRED'
  ).length

  if (selectedContractor) {
    return (
      <ContractorDetailView
        contractor={selectedContractor}
        onBack={() => setSelectedContractor(null)}
      />
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Contractor Registry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage registered contractors, vendors, and service providers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Register New Contractor
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Total Registered
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {mockContractors.length}
              </Typography>
              <CompanyIcon sx={{ color: 'primary.main' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Active
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {activeCount}
              </Typography>
              <ActiveIcon sx={{ color: 'success.main' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: expiringCount > 0 ? 'warning.lighter' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Insurance Expiring
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: expiringCount > 0 ? 'warning.main' : 'text.secondary' }}
              >
                {expiringCount}
              </Typography>
              <ScheduleIcon sx={{ color: expiringCount > 0 ? 'warning.main' : 'text.secondary' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: issuesCount > 0 ? 'error.lighter' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Issues
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: issuesCount > 0 ? 'error.main' : 'success.main' }}
              >
                {issuesCount}
              </Typography>
              {issuesCount > 0 ? (
                <WarningIcon sx={{ color: 'error.main' }} />
              ) : (
                <VerifiedIcon sx={{ color: 'success.main' }} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockContractors.length})`} />
            <Tab label={`Active (${activeCount})`} />
            <Tab label={`Expiring (${expiringCount})`} />
            <Tab label={`Issues (${issuesCount})`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search contractors..."
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
                <TableCell>Company</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Primary Contact</TableCell>
                <TableCell>Insurance</TableCell>
                <TableCell>Orientation</TableCell>
                <TableCell>Last Visit</TableCell>
                <TableCell>Visits</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContractors.map((contractor) => {
                const type = typeConfig[contractor.type]
                const insurance = insuranceStatusConfig[contractor.insuranceStatus]
                const primaryContact = contractor.contacts[0]

                return (
                  <TableRow key={contractor.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: contractor.status === 'ACTIVE' ? 'success.main' : 'grey.400' }}>
                          <ContractorIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {contractor.companyName}
                          </Typography>
                          {contractor.dbaName && (
                            <Typography variant="caption" color="text.secondary">
                              DBA: {contractor.dbaName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={type.label} color={type.color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{primaryContact.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {primaryContact.role}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={insurance.label} color={insurance.color} size="small" />
                      <Typography variant="caption" display="block" color="text.secondary">
                        Exp: {new Date(contractor.insuranceExpiry).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contractor.orientationStatus}
                        color={contractor.orientationStatus === 'COMPLETE' ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {contractor.lastVisit
                        ? new Date(contractor.lastVisit).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {contractor.visitCount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {contractor.rating.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          / 5
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedContractor(contractor)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Register New Contractor</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Company Legal Name" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="DBA Name (optional)" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Contractor Type</InputLabel>
                <Select label="Contractor Type">
                  <MenuItem value="MAINTENANCE_CONTRACTOR">Maintenance Contractor</MenuItem>
                  <MenuItem value="ELECTRICAL_CONTRACTOR">Electrical Contractor</MenuItem>
                  <MenuItem value="HOT_WORK_CONTRACTOR">Hot Work Contractor</MenuItem>
                  <MenuItem value="RIGGING_CRANE_CONTRACTOR">Rigging/Crane Contractor</MenuItem>
                  <MenuItem value="IT_VENDOR">IT Vendor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Primary Contact
                </Typography>
              </Divider>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Contact Name" required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Contact Email" type="email" required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Contact Phone" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCreateDialogOpen(false)}>
            Register Contractor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function ContractorDetailView({ contractor, onBack }) {
  const type = typeConfig[contractor.type]
  const insurance = insuranceStatusConfig[contractor.insuranceStatus]

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button variant="text" onClick={onBack} sx={{ mb: 1 }}>
            ← Back to Registry
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: contractor.status === 'ACTIVE' ? 'success.main' : 'grey.400',
              }}
            >
              <ContractorIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {contractor.companyName}
              </Typography>
              {contractor.dbaName && (
                <Typography variant="body2" color="text.secondary">
                  DBA: {contractor.dbaName}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label={type.label} color={type.color} size="small" />
                <Chip
                  label={contractor.status}
                  color={contractor.status === 'ACTIVE' ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<EditIcon />}>
            Edit
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Create Invitation
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Insurance Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Insurance & Compliance
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {contractor.insuranceStatus === 'EXPIRING_SOON' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Insurance certificate expires on {new Date(contractor.insuranceExpiry).toLocaleDateString()}.
                Request updated certificate.
              </Alert>
            )}
            {contractor.insuranceStatus === 'EXPIRED' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Insurance has expired. Contractor cannot be checked in until certificate is renewed.
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box>
                  <Chip label={insurance.label} color={insurance.color} size="small" />
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Expiry Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {new Date(contractor.insuranceExpiry).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  GL Coverage
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  ${(contractor.glCoverage / 1000000).toFixed(1)}M
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  WC Coverage
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {contractor.wcCoverage || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Contacts Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contacts
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contractor.contacts.map((contact, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{contact.name}</TableCell>
                      <TableCell>{contact.role}</TableCell>
                      <TableCell>{contact.phone}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Visit History */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Visit History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {contractor.visitCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total visits since registration
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last visit: {new Date(contractor.lastVisit).toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Rating
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {contractor.rating.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                / 5.0
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(contractor.rating / 5) * 100}
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
            />
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Violations
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: contractor.violations > 0 ? 'error.main' : 'success.main' }}
            >
              {contractor.violations}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Orientation Status
            </Typography>
            <Chip
              label={contractor.orientationStatus}
              color={contractor.orientationStatus === 'COMPLETE' ? 'success' : 'error'}
            />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Registered Since
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {new Date(contractor.registeredAt).toLocaleDateString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
