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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material'

// Mock RMA Data
const mockRMAs = [
  {
    id: '1',
    rmaNumber: 'RMA-26-0018',
    claimNumber: 'CLM-26-0042',
    customer: 'ABC Manufacturing',
    customerId: 'CUST-001',
    status: 'AUTHORIZED',
    returnMethod: 'PREPAID_LABEL',
    description: 'Return of wrong thickness material',
    expectedQty: 2500,
    uom: 'lbs',
    authorizedAt: '2026-02-03T10:00:00',
    expiresAt: '2026-02-17T23:59:59',
    createdAt: '2026-02-03T09:00:00',
    owner: 'Sarah Chen',
  },
  {
    id: '2',
    rmaNumber: 'RMA-26-0017',
    claimNumber: 'CLM-26-0039',
    customer: 'Delta Steel Works',
    customerId: 'CUST-004',
    status: 'IN_TRANSIT',
    returnMethod: 'CUSTOMER_SHIP',
    trackingNumber: '1Z999AA10123456784',
    carrierName: 'UPS',
    description: 'Damaged coil return',
    expectedQty: 8000,
    uom: 'lbs',
    authorizedAt: '2026-01-31T14:00:00',
    expectedArrival: '2026-02-05T00:00:00',
    createdAt: '2026-01-31T11:00:00',
    owner: 'Mike Johnson',
  },
  {
    id: '3',
    rmaNumber: 'RMA-26-0016',
    claimNumber: 'CLM-26-0035',
    customer: 'Premier Fabrication',
    customerId: 'CUST-003',
    status: 'RECEIVED',
    returnMethod: 'PICKUP',
    description: 'Off-spec material return',
    expectedQty: 5000,
    uom: 'lbs',
    receivedQty: 4950,
    authorizedAt: '2026-01-28T09:00:00',
    receivedAt: '2026-02-01T14:30:00',
    createdAt: '2026-01-28T08:00:00',
    owner: 'Sarah Chen',
  },
  {
    id: '4',
    rmaNumber: 'RMA-26-0015',
    claimNumber: 'CLM-26-0030',
    customer: 'XYZ Industries',
    customerId: 'CUST-002',
    status: 'INSPECTED',
    returnMethod: 'PREPAID_LABEL',
    description: 'Quality defect verification',
    expectedQty: 3200,
    uom: 'lbs',
    receivedQty: 3200,
    inspectionPassed: false,
    inspectionNotes: 'Confirmed surface defects as reported by customer',
    authorizedAt: '2026-01-25T10:00:00',
    receivedAt: '2026-01-29T11:00:00',
    inspectedAt: '2026-01-30T09:00:00',
    createdAt: '2026-01-25T09:00:00',
    owner: 'Mike Johnson',
  },
  {
    id: '5',
    rmaNumber: 'RMA-26-0014',
    claimNumber: 'CLM-26-0028',
    customer: 'Omega Parts Inc',
    customerId: 'CUST-005',
    status: 'CLOSED',
    returnMethod: 'NO_RETURN',
    disposition: 'CREDIT_ONLY',
    description: 'Credit issued without return',
    expectedQty: 0,
    uom: 'lbs',
    authorizedAt: '2026-01-20T08:00:00',
    closedAt: '2026-01-22T16:00:00',
    createdAt: '2026-01-20T07:30:00',
    owner: 'Sarah Chen',
  },
]

const statusConfig = {
  REQUESTED: { label: 'Requested', color: 'default' },
  AUTHORIZED: { label: 'Authorized', color: 'info' },
  LABEL_SENT: { label: 'Label Sent', color: 'info' },
  IN_TRANSIT: { label: 'In Transit', color: 'warning' },
  RECEIVED: { label: 'Received', color: 'secondary' },
  INSPECTED: { label: 'Inspected', color: 'primary' },
  DISPOSITIONED: { label: 'Dispositioned', color: 'success' },
  CLOSED: { label: 'Closed', color: 'success' },
  EXPIRED: { label: 'Expired', color: 'error' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
}

const returnMethodLabels = {
  CUSTOMER_SHIP: 'Customer Ships',
  PREPAID_LABEL: 'Prepaid Label',
  PICKUP: 'We Pickup',
  NO_RETURN: 'No Return Required',
}

const dispositionLabels = {
  RESTOCK: 'Return to Stock',
  REWORK: 'Rework & Return',
  REWORK_RESTOCK: 'Rework & Restock',
  SCRAP: 'Scrap',
  RETURN_TO_VENDOR: 'Return to Vendor',
  CREDIT_ONLY: 'Credit Only',
}

export default function RMAManagementPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRMA, setSelectedRMA] = useState(null)

  const filteredRMAs = mockRMAs.filter((rma) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        rma.rmaNumber.toLowerCase().includes(query) ||
        rma.customer.toLowerCase().includes(query) ||
        rma.claimNumber.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return ['AUTHORIZED', 'LABEL_SENT', 'IN_TRANSIT'].includes(rma.status)
    if (tabValue === 2) return ['RECEIVED', 'INSPECTED'].includes(rma.status)
    if (tabValue === 3) return ['CLOSED', 'DISPOSITIONED'].includes(rma.status)
    return true
  })

  const pendingCount = mockRMAs.filter((r) => ['AUTHORIZED', 'LABEL_SENT'].includes(r.status)).length
  const inTransitCount = mockRMAs.filter((r) => r.status === 'IN_TRANSIT').length
  const awaitingInspectionCount = mockRMAs.filter((r) => r.status === 'RECEIVED').length
  const closedCount = mockRMAs.filter((r) => ['CLOSED', 'DISPOSITIONED'].includes(r.status)).length

  if (selectedRMA) {
    return <RMADetailView rma={selectedRMA} onBack={() => setSelectedRMA(null)} />
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            RMA Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Return Material Authorizations
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          New RMA
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Pending Shipment
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {pendingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Awaiting customer return
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                In Transit
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {inTransitCount}
              </Typography>
              <ShippingIcon sx={{ color: 'warning.main', fontSize: 20 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Awaiting Inspection
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {awaitingInspectionCount}
              </Typography>
              <InventoryIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Closed This Month
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {closedCount}
              </Typography>
              <CompleteIcon sx={{ color: 'success.main', fontSize: 20 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockRMAs.length})`} />
            <Tab label={`Pending/In Transit (${pendingCount + inTransitCount})`} />
            <Tab label={`Awaiting Action (${awaitingInspectionCount})`} />
            <Tab label={`Closed (${closedCount})`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search RMAs..."
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
                <TableCell>RMA #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Claim #</TableCell>
                <TableCell>Return Method</TableCell>
                <TableCell>Expected Qty</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRMAs.map((rma) => {
                const status = statusConfig[rma.status]
                const isExpiringSoon = rma.expiresAt && new Date(rma.expiresAt) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                return (
                  <TableRow key={rma.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {rma.rmaNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{rma.customer}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {rma.claimNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={returnMethodLabels[rma.returnMethod]}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {rma.expectedQty > 0 ? `${rma.expectedQty.toLocaleString()} ${rma.uom}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                      {rma.trackingNumber && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {rma.trackingNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {rma.expiresAt && rma.status !== 'CLOSED' ? (
                        <Typography
                          variant="body2"
                          sx={{ color: isExpiringSoon ? 'warning.main' : 'text.primary' }}
                        >
                          {new Date(rma.expiresAt).toLocaleDateString()}
                          {isExpiringSoon && ' ⚠️'}
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{rma.owner}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedRMA(rma)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {rma.status === 'AUTHORIZED' && (
                        <IconButton size="small">
                          <PrintIcon fontSize="small" />
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
    </Box>
  )
}

function RMADetailView({ rma, onBack }) {
  const status = statusConfig[rma.status]

  const workflowSteps = ['Requested', 'Authorized', 'In Transit', 'Received', 'Inspected', 'Dispositioned', 'Closed']
  const statusToStep = {
    REQUESTED: 0,
    AUTHORIZED: 1,
    LABEL_SENT: 1,
    IN_TRANSIT: 2,
    RECEIVED: 3,
    INSPECTED: 4,
    DISPOSITIONED: 5,
    CLOSED: 6,
  }
  const currentStep = statusToStep[rma.status] || 0

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button variant="text" onClick={onBack} sx={{ mb: 1 }}>
            ← Back to RMAs
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {rma.rmaNumber}
            </Typography>
            <Chip label={status.label} color={status.color} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {rma.customer} | Claim: {rma.claimNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<PrintIcon />}>
            Print Label
          </Button>
          <Button variant="outlined" startIcon={<EmailIcon />}>
            Send to Customer
          </Button>
          {rma.status === 'RECEIVED' && (
            <Button variant="contained" color="primary">
              Start Inspection
            </Button>
          )}
          {rma.status === 'INSPECTED' && (
            <Button variant="contained" color="success">
              Set Disposition
            </Button>
          )}
        </Box>
      </Box>

      {/* Workflow Stepper */}
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
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              RMA Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Return Method</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {returnMethodLabels[rma.returnMethod]}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Expected Quantity</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {rma.expectedQty > 0 ? `${rma.expectedQty.toLocaleString()} ${rma.uom}` : 'N/A'}
                </Typography>
              </Grid>
              {rma.receivedQty && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Received Quantity</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {rma.receivedQty.toLocaleString()} {rma.uom}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body1">{rma.description}</Typography>
              </Grid>
              {rma.trackingNumber && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Tracking</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                    {rma.carrierName}: {rma.trackingNumber}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Inspection Results (if inspected) */}
          {rma.status === 'INSPECTED' && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Inspection Results
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {rma.inspectionPassed ? (
                  <Chip icon={<CompleteIcon />} label="Passed" color="success" />
                ) : (
                  <Chip icon={<WarningIcon />} label="Failed - Defects Confirmed" color="error" />
                )}
              </Box>
              <Typography variant="body2">{rma.inspectionNotes}</Typography>
            </Paper>
          )}

          {/* Timeline */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Timeline
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon><PendingIcon color="info" /></ListItemIcon>
                <ListItemText
                  primary="RMA Created"
                  secondary={new Date(rma.createdAt).toLocaleString()}
                />
              </ListItem>
              {rma.authorizedAt && (
                <ListItem>
                  <ListItemIcon><CompleteIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Authorized"
                    secondary={new Date(rma.authorizedAt).toLocaleString()}
                  />
                </ListItem>
              )}
              {rma.receivedAt && (
                <ListItem>
                  <ListItemIcon><InventoryIcon color="secondary" /></ListItemIcon>
                  <ListItemText
                    primary="Material Received"
                    secondary={new Date(rma.receivedAt).toLocaleString()}
                  />
                </ListItem>
              )}
              {rma.inspectedAt && (
                <ListItem>
                  <ListItemIcon><CompleteIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="Inspection Complete"
                    secondary={new Date(rma.inspectedAt).toLocaleString()}
                  />
                </ListItem>
              )}
              {rma.closedAt && (
                <ListItem>
                  <ListItemIcon><CompleteIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="RMA Closed"
                    secondary={new Date(rma.closedAt).toLocaleString()}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Customer</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{rma.customer}</Typography>
            <Typography variant="caption" color="text.secondary">{rma.customerId}</Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Linked Claim</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {rma.claimNumber}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Owner</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{rma.owner}</Typography>
          </Paper>

          {rma.expiresAt && rma.status !== 'CLOSED' && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.lighter' }}>
              <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                RMA Expires
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                {new Date(rma.expiresAt).toLocaleDateString()}
              </Typography>
            </Paper>
          )}

          {rma.disposition && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Disposition</Typography>
              <Chip label={dispositionLabels[rma.disposition]} color="success" />
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
