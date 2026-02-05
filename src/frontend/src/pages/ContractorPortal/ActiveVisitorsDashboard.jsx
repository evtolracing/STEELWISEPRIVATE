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
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
} from '@mui/material'
import {
  Search as SearchIcon,
  PersonAdd as AddIcon,
  Visibility as ViewIcon,
  Badge as BadgeIcon,
  Timer as TimerIcon,
  Warning as WarningIcon,
  CheckCircle as CheckedInIcon,
  Logout as CheckoutIcon,
  Engineering as ContractorIcon,
  LocalShipping as DriverIcon,
  Person as VisitorIcon,
  Security as InspectorIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
} from '@mui/icons-material'

// Mock Active Visitors Data
const mockActiveVisitors = [
  {
    id: '1',
    name: 'John Smith',
    company: 'ABC Electric',
    type: 'ELECTRICAL_CONTRACTOR',
    purpose: 'Panel maintenance - Saw Line',
    sponsor: 'Mike Johnson',
    badgeNumber: 'C-2026-0847',
    checkedInAt: '2026-02-04T08:30:00',
    validUntil: '2026-02-04T17:00:00',
    areas: ['Electrical Room A', 'Panel 7B'],
    escortRequired: false,
    activePermits: ['LOTO-26-0089'],
    status: 'ACTIVE_ONSITE',
    photo: null,
    ppeVerified: true,
  },
  {
    id: '2',
    name: 'Maria Garcia',
    company: 'FastFreight Logistics',
    type: 'CARRIER_DRIVER',
    purpose: 'Pickup - Order #5847',
    sponsor: 'Shipping Desk',
    badgeNumber: 'D-2026-0412',
    checkedInAt: '2026-02-04T10:15:00',
    validUntil: '2026-02-04T14:15:00',
    areas: ['Shipping Dock B'],
    escortRequired: false,
    activePermits: [],
    status: 'ACTIVE_ONSITE',
    photo: null,
    ppeVerified: true,
  },
  {
    id: '3',
    name: 'David Chen',
    company: 'Quality Auditing Services',
    type: 'INSPECTOR_AUDITOR',
    purpose: 'Annual ISO audit',
    sponsor: 'Sarah Williams',
    badgeNumber: 'V-2026-0155',
    checkedInAt: '2026-02-04T09:00:00',
    validUntil: '2026-02-04T16:00:00',
    areas: ['Production Floor', 'Quality Lab'],
    escortRequired: true,
    escort: 'Sarah Williams',
    activePermits: [],
    status: 'ACTIVE_ONSITE',
    photo: null,
    ppeVerified: true,
  },
  {
    id: '4',
    name: 'Robert Williams',
    company: 'Industrial HVAC Inc.',
    type: 'MAINTENANCE_CONTRACTOR',
    purpose: 'AC unit inspection',
    sponsor: 'Facilities',
    badgeNumber: 'C-2026-0848',
    checkedInAt: '2026-02-04T07:00:00',
    validUntil: '2026-02-04T15:00:00',
    areas: ['Roof', 'Mechanical Room'],
    escortRequired: false,
    activePermits: [],
    status: 'ACTIVE_ONSITE',
    photo: null,
    ppeVerified: true,
  },
  {
    id: '5',
    name: 'Jennifer Lee',
    company: 'XYZ Manufacturing',
    type: 'VISITOR_NONWORKING',
    purpose: 'Customer tour',
    sponsor: 'Sales Manager',
    badgeNumber: 'V-2026-0156',
    checkedInAt: '2026-02-04T11:00:00',
    validUntil: '2026-02-04T13:00:00',
    areas: ['Conference Room', 'Tour Path'],
    escortRequired: true,
    escort: 'Sales Manager',
    activePermits: [],
    status: 'ACTIVE_ONSITE',
    photo: null,
    ppeVerified: false,
  },
]

const typeConfig = {
  MAINTENANCE_CONTRACTOR: { label: 'Maintenance', color: 'warning', icon: ContractorIcon },
  ELECTRICAL_CONTRACTOR: { label: 'Electrical', color: 'error', icon: ContractorIcon },
  RIGGING_CRANE_CONTRACTOR: { label: 'Rigging/Crane', color: 'error', icon: ContractorIcon },
  HOT_WORK_CONTRACTOR: { label: 'Hot Work', color: 'error', icon: ContractorIcon },
  IT_VENDOR: { label: 'IT Vendor', color: 'info', icon: ContractorIcon },
  CARRIER_DRIVER: { label: 'Driver', color: 'info', icon: DriverIcon },
  INSPECTOR_AUDITOR: { label: 'Inspector', color: 'secondary', icon: InspectorIcon },
  VISITOR_NONWORKING: { label: 'Visitor', color: 'default', icon: VisitorIcon },
}

function getTimeRemaining(validUntil) {
  const now = new Date()
  const end = new Date(validUntil)
  const diffMs = end - now
  if (diffMs <= 0) return { text: 'Expired', warning: true, expired: true }
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (hours < 1) return { text: `${minutes}m remaining`, warning: true, expired: false }
  return { text: `${hours}h ${minutes}m remaining`, warning: false, expired: false }
}

export default function ActiveVisitorsDashboard() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVisitor, setSelectedVisitor] = useState(null)
  const [checkoutDialog, setCheckoutDialog] = useState(null)

  const filteredVisitors = mockActiveVisitors.filter((visitor) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        visitor.name.toLowerCase().includes(query) ||
        visitor.company.toLowerCase().includes(query) ||
        visitor.badgeNumber.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return visitor.type.includes('CONTRACTOR')
    if (tabValue === 2) return visitor.type === 'CARRIER_DRIVER'
    if (tabValue === 3) return ['INSPECTOR_AUDITOR', 'VISITOR_NONWORKING'].includes(visitor.type)
    return true
  })

  const contractorCount = mockActiveVisitors.filter((v) => v.type.includes('CONTRACTOR')).length
  const driverCount = mockActiveVisitors.filter((v) => v.type === 'CARRIER_DRIVER').length
  const visitorCount = mockActiveVisitors.filter((v) =>
    ['INSPECTOR_AUDITOR', 'VISITOR_NONWORKING'].includes(v.type)
  ).length
  const expiringCount = mockActiveVisitors.filter((v) => {
    const timeLeft = getTimeRemaining(v.validUntil)
    return timeLeft.warning && !timeLeft.expired
  }).length

  const handleCheckout = (visitor) => {
    setCheckoutDialog(null)
    // Would trigger API call
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Active Visitors Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time view of all contractors, drivers, and visitors currently on-site
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Quick Check-In
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Total On-Site
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {mockActiveVisitors.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active right now
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Contractors
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {contractorCount}
              </Typography>
              <ContractorIcon sx={{ color: 'warning.main' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Drivers
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                {driverCount}
              </Typography>
              <DriverIcon sx={{ color: 'info.main' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: expiringCount > 0 ? 'warning.lighter' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Expiring Soon
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: expiringCount > 0 ? 'warning.main' : 'success.main' }}
              >
                {expiringCount}
              </Typography>
              <TimerIcon sx={{ color: expiringCount > 0 ? 'warning.main' : 'success.main' }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockActiveVisitors.length})`} />
            <Tab label={`Contractors (${contractorCount})`} />
            <Tab label={`Drivers (${driverCount})`} />
            <Tab label={`Visitors (${visitorCount})`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search by name, company, badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Visitor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Badge #</TableCell>
                <TableCell>Areas</TableCell>
                <TableCell>Time Remaining</TableCell>
                <TableCell>Escort</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVisitors.map((visitor) => {
                const type = typeConfig[visitor.type]
                const TypeIcon = type.icon
                const timeRemaining = getTimeRemaining(visitor.validUntil)

                return (
                  <TableRow key={visitor.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            visitor.ppeVerified ? (
                              <CheckedInIcon sx={{ fontSize: 14, color: 'success.main' }} />
                            ) : (
                              <WarningIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                            )
                          }
                        >
                          <Avatar sx={{ bgcolor: `${type.color}.main` }}>
                            <TypeIcon fontSize="small" />
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {visitor.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {visitor.company}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={type.label} color={type.color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                        {visitor.purpose}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontFamily: 'monospace' }}
                      >
                        {visitor.badgeNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {visitor.areas.slice(0, 2).map((area, idx) => (
                          <Chip key={idx} label={area} size="small" variant="outlined" />
                        ))}
                        {visitor.areas.length > 2 && (
                          <Chip label={`+${visitor.areas.length - 2}`} size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {timeRemaining.warning && !timeRemaining.expired && (
                          <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                        )}
                        {timeRemaining.expired && (
                          <WarningIcon sx={{ fontSize: 16, color: 'error.main' }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: timeRemaining.expired
                              ? 'error.main'
                              : timeRemaining.warning
                              ? 'warning.main'
                              : 'text.primary',
                            fontWeight: timeRemaining.warning ? 600 : 400,
                          }}
                        >
                          {timeRemaining.text}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {visitor.escortRequired ? (
                        <Typography variant="body2" color="primary">
                          {visitor.escort}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Not required
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedVisitor(visitor)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <PrintIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setCheckoutDialog(visitor)}
                      >
                        <CheckoutIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Visitor Detail Dialog */}
      <Dialog
        open={!!selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedVisitor && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${typeConfig[selectedVisitor.type].color}.main`, width: 56, height: 56 }}>
                  {(() => {
                    const TypeIcon = typeConfig[selectedVisitor.type].icon
                    return <TypeIcon />
                  })()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedVisitor.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedVisitor.company}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Badge Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {selectedVisitor.badgeNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Box>
                    <Chip
                      label={typeConfig[selectedVisitor.type].label}
                      color={typeConfig[selectedVisitor.type].color}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Purpose</Typography>
                  <Typography variant="body1">{selectedVisitor.purpose}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Checked In</Typography>
                  <Typography variant="body1">
                    {new Date(selectedVisitor.checkedInAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Valid Until</Typography>
                  <Typography variant="body1">
                    {new Date(selectedVisitor.validUntil).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Authorized Areas</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {selectedVisitor.areas.map((area, idx) => (
                      <Chip key={idx} label={area} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
                {selectedVisitor.activePermits.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Active Permits</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      {selectedVisitor.activePermits.map((permit, idx) => (
                        <Chip key={idx} label={permit} size="small" color="warning" />
                      ))}
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Sponsor</Typography>
                  <Typography variant="body1">{selectedVisitor.sponsor}</Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedVisitor(null)}>Close</Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<CheckoutIcon />}
                onClick={() => {
                  setCheckoutDialog(selectedVisitor)
                  setSelectedVisitor(null)
                }}
              >
                Check Out
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={!!checkoutDialog} onClose={() => setCheckoutDialog(null)}>
        <DialogTitle>Confirm Check-Out</DialogTitle>
        <DialogContent>
          {checkoutDialog && (
            <Typography>
              Are you sure you want to check out <strong>{checkoutDialog.name}</strong> from{' '}
              <strong>{checkoutDialog.company}</strong>?
            </Typography>
          )}
          {checkoutDialog?.activePermits?.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This visitor has active permits that will be closed: {checkoutDialog.activePermits.join(', ')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleCheckout(checkoutDialog)}
          >
            Confirm Check-Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
