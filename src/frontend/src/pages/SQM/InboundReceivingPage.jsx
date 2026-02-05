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
  LinearProgress,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  PlayArrow as InspectIcon,
  CheckCircle as AcceptedIcon,
  Error as RejectedIcon,
  Schedule as PendingIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  LocalShipping as TruckIcon,
} from '@mui/icons-material'

// Mock data
const mockReceipts = [
  {
    id: '1',
    receiptNumber: 'RCV-26-0142',
    supplier: 'Steel Dynamics',
    supplierCode: 'SUP-003',
    poNumber: 'PO-5523',
    receivedAt: '2026-02-04T08:15:00',
    status: 'IN_INSPECTION',
    itemCount: 3,
    totalWeight: 125000,
    riskLevel: 'MEDIUM',
  },
  {
    id: '2',
    receiptNumber: 'RCV-26-0141',
    supplier: 'Nucor Corporation',
    supplierCode: 'SUP-001',
    poNumber: 'PO-5519',
    receivedAt: '2026-02-04T07:30:00',
    status: 'PENDING_INSPECTION',
    itemCount: 2,
    totalWeight: 83000,
    riskLevel: 'MEDIUM',
  },
  {
    id: '3',
    receiptNumber: 'RCV-26-0140',
    supplier: 'ArcelorMittal',
    supplierCode: 'SUP-002',
    poNumber: 'PO-5518',
    receivedAt: '2026-02-03T14:45:00',
    status: 'ACCEPTED',
    itemCount: 4,
    totalWeight: 210000,
    riskLevel: 'LOW',
  },
  {
    id: '4',
    receiptNumber: 'RCV-26-0139',
    supplier: 'Steel Dynamics',
    supplierCode: 'SUP-003',
    poNumber: 'PO-5517',
    receivedAt: '2026-02-03T10:20:00',
    status: 'REJECTED',
    itemCount: 1,
    totalWeight: 45000,
    riskLevel: 'HIGH',
  },
  {
    id: '5',
    receiptNumber: 'RCV-26-0138',
    supplier: 'SSAB',
    supplierCode: 'SUP-005',
    poNumber: 'PO-5515',
    receivedAt: '2026-02-02T16:00:00',
    status: 'ACCEPTED',
    itemCount: 2,
    totalWeight: 92000,
    riskLevel: 'LOW',
  },
]

const statusConfig = {
  PENDING_INSPECTION: { label: 'Pending Inspection', color: 'warning', icon: PendingIcon },
  IN_INSPECTION: { label: 'Inspecting', color: 'info', icon: InspectIcon },
  ACCEPTED: { label: 'Accepted', color: 'success', icon: AcceptedIcon },
  REJECTED: { label: 'Rejected', color: 'error', icon: RejectedIcon },
  CONDITIONAL_RELEASE: { label: 'Conditional', color: 'secondary', icon: WarningIcon },
  PARTIAL_ACCEPT: { label: 'Partial Accept', color: 'warning', icon: WarningIcon },
}

const riskConfig = {
  LOW: { label: 'Low', color: 'success' },
  MEDIUM: { label: 'Medium', color: 'warning' },
  HIGH: { label: 'High', color: 'error' },
  CRITICAL: { label: 'Critical', color: 'error' },
}

function StatCard({ title, value, subValue, icon: Icon, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
              {value}
            </Typography>
            {subValue && (
              <Typography variant="caption" color="text.secondary">
                {subValue}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${color}.lighter`,
              color: `${color}.main`,
            }}
          >
            <Icon fontSize="large" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function InboundReceivingPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  const filteredReceipts = mockReceipts.filter((receipt) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        receipt.receiptNumber.toLowerCase().includes(query) ||
        receipt.supplier.toLowerCase().includes(query) ||
        receipt.poNumber.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return receipt.status === 'PENDING_INSPECTION'
    if (tabValue === 2) return receipt.status === 'IN_INSPECTION'
    if (tabValue === 3) return receipt.status === 'ACCEPTED'
    if (tabValue === 4) return receipt.status === 'REJECTED'
    return true
  })

  const pendingCount = mockReceipts.filter((r) => r.status === 'PENDING_INSPECTION').length
  const inspectingCount = mockReceipts.filter((r) => r.status === 'IN_INSPECTION').length
  const acceptedCount = mockReceipts.filter((r) => r.status === 'ACCEPTED').length
  const rejectedCount = mockReceipts.filter((r) => r.status === 'REJECTED').length

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Inbound Receiving
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage incoming material receipts and trigger inspections
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Receipt
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Receipts"
            value="8"
            subValue="5 received, 3 scheduled"
            icon={TruckIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Inspection"
            value={pendingCount}
            subValue="2 overdue"
            icon={PendingIcon}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Accepted Today"
            value={acceptedCount}
            subValue="92% acceptance rate"
            icon={AcceptedIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Issues Found"
            value={rejectedCount}
            subValue="1 SNC created"
            icon={RejectedIcon}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Overdue Alert */}
      {pendingCount > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <strong>2 items overdue for inspection</strong> — Oldest pending item is 3 days old.
          Complete inspections to release material to inventory.
        </Alert>
      )}

      {/* Tabs & Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockReceipts.length})`} />
            <Tab label={`Pending (${pendingCount})`} />
            <Tab label={`Inspecting (${inspectingCount})`} />
            <Tab label={`Accepted (${acceptedCount})`} />
            <Tab label={`Rejected (${rejectedCount})`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search receipts..."
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
                <TableCell>Receipt #</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>PO #</TableCell>
                <TableCell>Received</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Weight (lbs)</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReceipts.map((receipt) => {
                const status = statusConfig[receipt.status]
                const StatusIcon = status.icon
                const risk = riskConfig[receipt.riskLevel]
                return (
                  <TableRow key={receipt.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {receipt.receiptNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{receipt.supplier}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {receipt.supplierCode}
                      </Typography>
                    </TableCell>
                    <TableCell>{receipt.poNumber}</TableCell>
                    <TableCell>
                      {new Date(receipt.receivedAt).toLocaleDateString()}{' '}
                      {new Date(receipt.receivedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>{receipt.itemCount}</TableCell>
                    <TableCell align="right">
                      {receipt.totalWeight.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={risk.label}
                        color={risk.color}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<StatusIcon fontSize="small" />}
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedReceipt(receipt)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {receipt.status === 'PENDING_INSPECTION' && (
                        <IconButton size="small" color="success">
                          <InspectIcon fontSize="small" />
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

      {/* Create Receipt Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Receipt</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select label="Supplier" defaultValue="">
                  <MenuItem value="SUP-001">Nucor Corporation</MenuItem>
                  <MenuItem value="SUP-002">ArcelorMittal</MenuItem>
                  <MenuItem value="SUP-003">Steel Dynamics</MenuItem>
                  <MenuItem value="SUP-005">SSAB</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Purchase Order #" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Supplier Packing Slip" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="BOL #" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Carrier Name" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Trailer Number" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Seal Number" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Seal Condition</InputLabel>
                <Select label="Seal Condition" defaultValue="">
                  <MenuItem value="intact">Intact</MenuItem>
                  <MenuItem value="broken">Broken</MenuItem>
                  <MenuItem value="missing">Missing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Arrival Notes" multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCreateDialogOpen(false)}>
            Create Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
