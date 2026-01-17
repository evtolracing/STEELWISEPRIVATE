import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Button,
  Stack,
  Divider,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  QrCode2 as QrCodeIcon,
  Inventory as InventoryIcon,
  Description as DocIcon,
  Timeline as TimelineIcon,
  LocalShipping as ShipIcon,
} from '@mui/icons-material'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getUnit, getUnitTrace } from '../../api'
import { StatusChip, DataTable } from '../../components/common'
import { TraceTimeline } from '../../components/traceability'

function TabPanel({ children, value, index, ...props }) {
  return (
    <div hidden={value !== index} {...props}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <TableRow>
      <TableCell component="th" sx={{ fontWeight: 500, width: '40%', color: 'text.secondary' }}>
        {label}
      </TableCell>
      <TableCell>{value || '-'}</TableCell>
    </TableRow>
  )
}

export default function UnitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)

  const { data: unit, isLoading } = useApiQuery(
    ['unit', id],
    () => getUnit(id)
  )

  const { data: traceData } = useApiQuery(
    ['unitTrace', id],
    () => getUnitTrace(id),
    { enabled: tabValue === 2 }
  )

  // Mock data for demo
  const mockUnit = {
    id: 1,
    unitNumber: 'U-2024-0001',
    heatNumber: 'HT-2024-001',
    heatId: 1,
    grade: 'A36',
    specification: 'ASTM A36/A36M-19',
    status: 'AVAILABLE',
    weight: 12500,
    weightUnit: 'lbs',
    dimensions: {
      width: 48,
      gauge: 0.075,
      outerDiameter: 72,
      innerDiameter: 20,
    },
    location: {
      warehouse: 'Main Warehouse',
      bay: 'A',
      row: '01',
      position: '01',
    },
    allocations: [
      { orderId: 1, orderNumber: 'SO-2024-001', quantity: 12500, status: 'PENDING' },
    ],
    movements: [
      { id: 1, from: 'Receiving', to: 'Bay A-01', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), user: 'John Smith' },
    ],
    qualityStatus: 'PASS',
    certifications: ['MTC', 'ISO 9001'],
    receivedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  }

  const mockTraceEvents = [
    { id: 1, type: 'CREATED', title: 'Unit Created', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), actor: 'System', location: 'US Steel Gary Works', metadata: { heat: 'HT-2024-001' } },
    { id: 2, type: 'RECEIVED', title: 'Received at Warehouse', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), actor: 'John Smith', location: 'Main Warehouse' },
    { id: 3, type: 'TRANSFERRED', title: 'Moved to Bay A-01', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), actor: 'John Smith', location: 'Bay A-01' },
    { id: 4, type: 'TESTED', title: 'QC Inspection Complete', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), actor: 'QC Lab', description: 'Visual and dimensional inspection passed' },
    { id: 5, type: 'APPROVED', title: 'Released for Sale', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), actor: 'QC Manager' },
  ]

  const displayUnit = unit || mockUnit
  const displayTrace = traceData?.events || mockTraceEvents

  const movementColumns = [
    { id: 'from', label: 'From', minWidth: 120 },
    { id: 'to', label: 'To', minWidth: 120 },
    { id: 'date', label: 'Date', minWidth: 120, render: (row) => new Date(row.date).toLocaleString() },
    { id: 'user', label: 'User', minWidth: 120 },
  ]

  const allocationColumns = [
    { id: 'orderNumber', label: 'Order #', minWidth: 120 },
    { id: 'quantity', label: 'Quantity', minWidth: 100, render: (row) => `${row.quantity?.toLocaleString()} lbs` },
    { id: 'status', label: 'Status', minWidth: 100, render: (row) => <StatusChip status={row.status} /> },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/units')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" fontWeight={600}>
              {displayUnit.unitNumber}
            </Typography>
            <StatusChip status={displayUnit.status} />
            <StatusChip status={displayUnit.qualityStatus} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Heat: {displayUnit.heatNumber} | Grade: {displayUnit.grade}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<QrCodeIcon />} variant="outlined">
            QR Code
          </Button>
          <Button startIcon={<PrintIcon />} variant="outlined">
            Print Label
          </Button>
          <Button startIcon={<EditIcon />} variant="contained">
            Edit
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Weight</Typography>
              <Typography variant="h5">{displayUnit.weight?.toLocaleString()} {displayUnit.weightUnit}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Dimensions</Typography>
              <Typography variant="h5">
                {displayUnit.dimensions?.width}" × {displayUnit.dimensions?.gauge}"
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Location</Typography>
              <Typography variant="h5">
                {displayUnit.location?.warehouse || displayUnit.location}
              </Typography>
              {displayUnit.location?.bay && (
                <Typography variant="caption" color="text.secondary">
                  Bay {displayUnit.location.bay}-{displayUnit.location.row}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Received</Typography>
              <Typography variant="h5">
                {new Date(displayUnit.receivedDate).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<InventoryIcon />} iconPosition="start" label="Details" />
          <Tab icon={<ShipIcon />} iconPosition="start" label="Movements" />
          <Tab icon={<TimelineIcon />} iconPosition="start" label="Trace History" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Unit Information</Typography>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Unit Number" value={displayUnit.unitNumber} />
                  <InfoRow label="Heat Number" value={displayUnit.heatNumber} />
                  <InfoRow label="Grade" value={displayUnit.grade} />
                  <InfoRow label="Specification" value={displayUnit.specification} />
                  <InfoRow label="Weight" value={`${displayUnit.weight?.toLocaleString()} ${displayUnit.weightUnit}`} />
                  <InfoRow label="Status" value={<StatusChip status={displayUnit.status} />} />
                  <InfoRow label="Quality Status" value={<StatusChip status={displayUnit.qualityStatus} />} />
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Dimensions</Typography>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Width" value={`${displayUnit.dimensions?.width}"`} />
                  <InfoRow label="Gauge" value={`${displayUnit.dimensions?.gauge}"`} />
                  <InfoRow label="Outer Diameter" value={displayUnit.dimensions?.outerDiameter ? `${displayUnit.dimensions.outerDiameter}"` : '-'} />
                  <InfoRow label="Inner Diameter" value={displayUnit.dimensions?.innerDiameter ? `${displayUnit.dimensions.innerDiameter}"` : '-'} />
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Allocations</Typography>
              {displayUnit.allocations?.length > 0 ? (
                <DataTable
                  columns={allocationColumns}
                  data={displayUnit.allocations}
                  pageSize={5}
                  showSearch={false}
                />
              ) : (
                <Typography color="text.secondary">No allocations</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Movement History</Typography>
          <DataTable
            columns={movementColumns}
            data={displayUnit.movements || []}
            pageSize={10}
            showSearch={false}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Full Trace History</Typography>
          <TraceTimeline events={displayTrace} />
        </Paper>
      </TabPanel>
    </Box>
  )
}
