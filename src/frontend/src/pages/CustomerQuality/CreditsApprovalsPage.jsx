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
  Divider,
  Avatar,
  LinearProgress,
} from '@mui/material'
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'

// Mock Credit Requests Data
const mockCredits = [
  {
    id: '1',
    creditNumber: 'CRD-26-0025',
    claimNumber: 'CLM-26-0042',
    customer: 'ABC Manufacturing',
    customerId: 'CUST-001',
    amount: 3500,
    reason: 'CREDIT_FULL',
    description: 'Full credit for wrong material shipped',
    status: 'PENDING_L1',
    requestedBy: 'Sarah Chen',
    requestedAt: '2026-02-04T09:00:00',
  },
  {
    id: '2',
    creditNumber: 'CRD-26-0024',
    claimNumber: 'CLM-26-0041',
    customer: 'XYZ Industries',
    customerId: 'CUST-002',
    amount: 4100,
    reason: 'CREDIT_PARTIAL',
    description: 'Partial credit for surface defects - 50% of material affected',
    status: 'PENDING_L2',
    requestedBy: 'Mike Johnson',
    requestedAt: '2026-02-03T14:00:00',
    l1ApprovedBy: 'Sales Manager',
    l1ApprovedAt: '2026-02-03T16:00:00',
  },
  {
    id: '3',
    creditNumber: 'CRD-26-0023',
    claimNumber: 'CLM-26-0039',
    customer: 'Delta Steel Works',
    customerId: 'CUST-004',
    amount: 2100,
    reason: 'CREDIT_FULL',
    description: 'Credit for transit damage',
    status: 'APPROVED',
    requestedBy: 'Mike Johnson',
    requestedAt: '2026-01-31T10:00:00',
    approvedAt: '2026-02-01T09:00:00',
    finalApprover: 'Operations Manager',
  },
  {
    id: '4',
    creditNumber: 'CRD-26-0022',
    claimNumber: 'CLM-26-0035',
    customer: 'Premier Fabrication',
    customerId: 'CUST-003',
    amount: 450,
    reason: 'GOODWILL',
    description: 'Goodwill credit for short shipment inconvenience',
    status: 'ISSUED',
    requestedBy: 'Sarah Chen',
    requestedAt: '2026-01-28T11:00:00',
    approvedAt: '2026-01-28T15:00:00',
    issuedAt: '2026-01-29T10:00:00',
    invoiceNumber: 'CM-26-0015',
  },
  {
    id: '5',
    creditNumber: 'CRD-26-0021',
    claimNumber: 'CLM-26-0030',
    customer: 'Omega Parts Inc',
    customerId: 'CUST-005',
    amount: 1200,
    reason: 'CREDIT_PARTIAL',
    description: 'Partial credit for late delivery impact',
    status: 'REJECTED',
    requestedBy: 'Mike Johnson',
    requestedAt: '2026-01-25T09:00:00',
    rejectedAt: '2026-01-26T14:00:00',
    rejectedBy: 'Finance Manager',
    rejectionReason: 'Delivery was within contractual tolerance. Suggest goodwill gesture instead.',
  },
]

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'default' },
  PENDING_L1: { label: 'Pending L1', color: 'warning' },
  PENDING_L2: { label: 'Pending L2', color: 'warning' },
  PENDING_L3: { label: 'Pending L3', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
  ISSUED: { label: 'Issued', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
}

const reasonLabels = {
  CREDIT_FULL: 'Full Credit',
  CREDIT_PARTIAL: 'Partial Credit',
  GOODWILL: 'Goodwill',
  RETURN_CREDIT: 'Return Credit',
  PRICE_ADJUSTMENT: 'Price Adjustment',
}

export default function CreditsApprovalsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCredit, setSelectedCredit] = useState(null)

  const filteredCredits = mockCredits.filter((credit) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        credit.creditNumber.toLowerCase().includes(query) ||
        credit.customer.toLowerCase().includes(query) ||
        credit.claimNumber.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return ['PENDING_L1', 'PENDING_L2', 'PENDING_L3'].includes(credit.status)
    if (tabValue === 2) return credit.status === 'APPROVED'
    if (tabValue === 3) return credit.status === 'ISSUED'
    return true
  })

  const pendingCount = mockCredits.filter((c) => ['PENDING_L1', 'PENDING_L2', 'PENDING_L3'].includes(c.status)).length
  const pendingAmount = mockCredits
    .filter((c) => ['PENDING_L1', 'PENDING_L2', 'PENDING_L3'].includes(c.status))
    .reduce((sum, c) => sum + c.amount, 0)
  const approvedCount = mockCredits.filter((c) => c.status === 'APPROVED').length
  const issuedAmount = mockCredits
    .filter((c) => c.status === 'ISSUED')
    .reduce((sum, c) => sum + c.amount, 0)

  if (selectedCredit) {
    return <CreditDetailView credit={selectedCredit} onBack={() => setSelectedCredit(null)} />
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Credits & Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Credit request workflow and approval tracking
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Pending Approval
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {pendingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ${pendingAmount.toLocaleString()} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Awaiting Issue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {approvedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Approved, not issued
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Issued MTD
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ${(issuedAmount / 1000).toFixed(1)}K
              </Typography>
              <MoneyIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Avg Approval Time
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                1.5d
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
            <Tab label={`All (${mockCredits.length})`} />
            <Tab label={`Pending (${pendingCount})`} />
            <Tab label={`Approved (${approvedCount})`} />
            <Tab label={`Issued`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search credits..."
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
                <TableCell>Credit #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Claim #</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCredits.map((credit) => {
                const status = statusConfig[credit.status]
                return (
                  <TableRow key={credit.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {credit.creditNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{credit.customer}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {credit.claimNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={reasonLabels[credit.reason]} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${credit.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell>{credit.requestedBy}</TableCell>
                    <TableCell>
                      {new Date(credit.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedCredit(credit)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {['PENDING_L1', 'PENDING_L2', 'PENDING_L3'].includes(credit.status) && (
                        <>
                          <IconButton size="small" color="success">
                            <ApprovedIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <RejectedIcon fontSize="small" />
                          </IconButton>
                        </>
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

function CreditDetailView({ credit, onBack }) {
  const status = statusConfig[credit.status]

  const approvalLevels = [
    { level: 'L1', label: 'Manager', threshold: '$500', approver: credit.l1ApprovedBy || null },
    { level: 'L2', label: 'Director', threshold: '$2,500', approver: credit.amount > 500 ? (credit.status !== 'PENDING_L1' ? 'Pending...' : null) : 'N/A' },
    { level: 'L3', label: 'Executive', threshold: '>$2,500', approver: credit.amount > 2500 ? 'N/A' : 'N/A' },
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button variant="text" onClick={onBack} sx={{ mb: 1 }}>
            ← Back to Credits
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {credit.creditNumber}
            </Typography>
            <Chip label={status.label} color={status.color} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {credit.customer} | Claim: {credit.claimNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['PENDING_L1', 'PENDING_L2', 'PENDING_L3'].includes(credit.status) && (
            <>
              <Button variant="contained" color="success" startIcon={<ApprovedIcon />}>
                Approve
              </Button>
              <Button variant="outlined" color="error" startIcon={<RejectedIcon />}>
                Reject
              </Button>
            </>
          )}
          {credit.status === 'APPROVED' && (
            <Button variant="contained" color="primary">
              Issue Credit
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Credit Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Amount</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ${credit.amount.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Reason</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {reasonLabels[credit.reason]}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body1">{credit.description}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Approval Flow */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Approval Flow
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {approvalLevels.map((level, index) => (
                <Box key={level.level} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: level.approver && level.approver !== 'N/A' && level.approver !== 'Pending...'
                          ? 'success.main'
                          : level.approver === 'Pending...'
                          ? 'warning.main'
                          : 'grey.300',
                        mx: 'auto',
                        mb: 1,
                      }}
                    >
                      {level.approver && level.approver !== 'N/A' && level.approver !== 'Pending...' ? (
                        <ApprovedIcon />
                      ) : (
                        <PendingIcon />
                      )}
                    </Avatar>
                    <Typography variant="subtitle2">{level.level}: {level.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {level.threshold}
                    </Typography>
                    {level.approver && level.approver !== 'N/A' && (
                      <Typography variant="caption" display="block" color="success.main">
                        {level.approver}
                      </Typography>
                    )}
                  </Box>
                  {index < approvalLevels.length - 1 && (
                    <Box sx={{ flex: 1, height: 2, bgcolor: 'grey.300', mx: 2 }} />
                  )}
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Rejection Info */}
          {credit.status === 'REJECTED' && (
            <Paper sx={{ p: 3, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.main' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'error.main' }}>
                Credit Rejected
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>By:</strong> {credit.rejectedBy}
              </Typography>
              <Typography variant="body2">
                <strong>Reason:</strong> {credit.rejectionReason}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Customer</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{credit.customer}</Typography>
            <Typography variant="caption" color="text.secondary">{credit.customerId}</Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Linked Claim</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {credit.claimNumber}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Requested By</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{credit.requestedBy}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(credit.requestedAt).toLocaleString()}
            </Typography>
          </Paper>

          {credit.invoiceNumber && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.lighter' }}>
              <Typography variant="subtitle2" color="success.dark" gutterBottom>
                Credit Memo Issued
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.dark' }}>
                {credit.invoiceNumber}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
