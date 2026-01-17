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
  Chip,
  Divider,
  IconButton,
  Card,
  CardContent,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  QrCode2 as QrCodeIcon,
  Science as ChemistryIcon,
  Inventory as InventoryIcon,
  Description as DocIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getHeat, getHeatTrace } from '../../api'
import { DataTable, StatusChip } from '../../components/common'
import { TraceTimeline, UnitCard } from '../../components/traceability'

function TabPanel({ children, value, index, ...props }) {
  return (
    <div hidden={value !== index} {...props}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function ChemistryTable({ chemistry = {} }) {
  const elements = [
    { symbol: 'C', name: 'Carbon', value: chemistry.carbon },
    { symbol: 'Mn', name: 'Manganese', value: chemistry.manganese },
    { symbol: 'P', name: 'Phosphorus', value: chemistry.phosphorus },
    { symbol: 'S', name: 'Sulfur', value: chemistry.sulfur },
    { symbol: 'Si', name: 'Silicon', value: chemistry.silicon },
    { symbol: 'Cu', name: 'Copper', value: chemistry.copper },
    { symbol: 'Ni', name: 'Nickel', value: chemistry.nickel },
    { symbol: 'Cr', name: 'Chromium', value: chemistry.chromium },
    { symbol: 'Mo', name: 'Molybdenum', value: chemistry.molybdenum },
    { symbol: 'V', name: 'Vanadium', value: chemistry.vanadium },
    { symbol: 'Cb', name: 'Columbium', value: chemistry.columbium },
    { symbol: 'Ti', name: 'Titanium', value: chemistry.titanium },
    { symbol: 'Al', name: 'Aluminum', value: chemistry.aluminum },
    { symbol: 'N', name: 'Nitrogen', value: chemistry.nitrogen },
  ].filter(e => e.value !== undefined && e.value !== null)

  return (
    <Grid container spacing={2}>
      {elements.map((element) => (
        <Grid item xs={6} sm={4} md={3} key={element.symbol}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h6" color="primary" fontWeight={600}>
                {element.symbol}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {element.name}
              </Typography>
              <Typography variant="h5" fontWeight={500}>
                {element.value}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default function HeatDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)

  const { data: heat, isLoading } = useApiQuery(
    ['heat', id],
    () => getHeat(id)
  )

  const { data: traceData } = useApiQuery(
    ['heatTrace', id],
    () => getHeatTrace(id),
    { enabled: tabValue === 3 }
  )

  // Mock data for demo
  const mockHeat = {
    id: 1,
    heatNumber: 'HT-2024-001',
    millName: 'US Steel Gary Works',
    millLocation: 'Gary, Indiana',
    grade: 'A36',
    specification: 'ASTM A36/A36M-19',
    status: 'AVAILABLE',
    receivedDate: new Date().toISOString(),
    poNumber: 'PO-2024-00123',
    chemistry: {
      carbon: 0.25,
      manganese: 0.85,
      phosphorus: 0.012,
      sulfur: 0.008,
      silicon: 0.22,
      copper: 0.20,
      nickel: 0.08,
      chromium: 0.10,
    },
    mechanicalProperties: {
      yieldStrength: 36000,
      tensileStrength: 58000,
      elongation: 23,
    },
    units: [
      { id: 1, unitNumber: 'U-001-01', weight: 12500, status: 'AVAILABLE', grade: 'A36', location: 'Bay A-01' },
      { id: 2, unitNumber: 'U-001-02', weight: 11800, status: 'ALLOCATED', grade: 'A36', location: 'Bay A-02' },
      { id: 3, unitNumber: 'U-001-03', weight: 13200, status: 'AVAILABLE', grade: 'A36', location: 'Bay A-03' },
    ],
    documents: [
      { id: 1, name: 'Mill Test Certificate', type: 'MTC', uploadedAt: new Date() },
      { id: 2, name: 'Chemical Analysis Report', type: 'CAR', uploadedAt: new Date() },
    ],
  }

  const mockTraceEvents = [
    { id: 1, type: 'CREATED', title: 'Heat Created', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), actor: 'System', location: 'US Steel Gary Works' },
    { id: 2, type: 'RECEIVED', title: 'Material Received', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), actor: 'John Smith', location: 'Main Warehouse' },
    { id: 3, type: 'TESTED', title: 'QC Testing Complete', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), actor: 'Lab Tech', description: 'All tests passed' },
    { id: 4, type: 'APPROVED', title: 'Released for Sale', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), actor: 'QC Manager' },
  ]

  const displayHeat = heat || mockHeat
  const displayTrace = traceData?.events || mockTraceEvents

  const unitColumns = [
    { id: 'unitNumber', label: 'Unit Number', minWidth: 120 },
    { id: 'weight', label: 'Weight (lbs)', minWidth: 100, render: (row) => row.weight?.toLocaleString() },
    { id: 'location', label: 'Location', minWidth: 120 },
    { id: 'status', label: 'Status', minWidth: 100, render: (row) => <StatusChip status={row.status} /> },
  ]

  const docColumns = [
    { id: 'name', label: 'Document Name', minWidth: 200 },
    { id: 'type', label: 'Type', minWidth: 100 },
    { id: 'uploadedAt', label: 'Uploaded', minWidth: 120, render: (row) => new Date(row.uploadedAt).toLocaleDateString() },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/heats')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" fontWeight={600}>
              {displayHeat.heatNumber}
            </Typography>
            <StatusChip status={displayHeat.status} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {displayHeat.millName} | {displayHeat.grade}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<QrCodeIcon />} variant="outlined">
            QR Code
          </Button>
          <Button startIcon={<PrintIcon />} variant="outlined">
            Print
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
              <Typography variant="body2" color="text.secondary">Grade</Typography>
              <Typography variant="h5">{displayHeat.grade}</Typography>
              <Typography variant="caption" color="text.secondary">{displayHeat.specification}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Units</Typography>
              <Typography variant="h5">{displayHeat.units?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Weight</Typography>
              <Typography variant="h5">
                {displayHeat.units?.reduce((sum, u) => sum + (u.weight || 0), 0).toLocaleString()} lbs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Received</Typography>
              <Typography variant="h5">
                {new Date(displayHeat.receivedDate).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<ChemistryIcon />} iconPosition="start" label="Chemistry" />
          <Tab icon={<InventoryIcon />} iconPosition="start" label="Units" />
          <Tab icon={<DocIcon />} iconPosition="start" label="Documents" />
          <Tab icon={<TimelineIcon />} iconPosition="start" label="Trace History" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Chemical Composition</Typography>
          <ChemistryTable chemistry={displayHeat.chemistry} />
          
          {displayHeat.mechanicalProperties && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>Mechanical Properties</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Yield Strength</Typography>
                      <Typography variant="h5">{displayHeat.mechanicalProperties.yieldStrength?.toLocaleString()} psi</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Tensile Strength</Typography>
                      <Typography variant="h5">{displayHeat.mechanicalProperties.tensileStrength?.toLocaleString()} psi</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Elongation</Typography>
                      <Typography variant="h5">{displayHeat.mechanicalProperties.elongation}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper>
          <DataTable
            columns={unitColumns}
            data={displayHeat.units || []}
            onRowClick={(row) => navigate(`/units/${row.id}`)}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper>
          <DataTable
            columns={docColumns}
            data={displayHeat.documents || []}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Trace History</Typography>
          <TraceTimeline events={displayTrace} />
        </Paper>
      </TabPanel>
    </Box>
  )
}
