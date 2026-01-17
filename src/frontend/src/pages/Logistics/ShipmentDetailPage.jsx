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
  IconButton,
  Card,
  CardContent,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  LocalShipping as TruckIcon,
  Inventory as InventoryIcon,
  Description as DocIcon,
  Map as MapIcon,
} from '@mui/icons-material'
import { useApiQuery } from '../../hooks/useApiQuery'
import { StatusChip, DataTable } from '../../components/common'
import { LoadDiagram, RouteMap } from '../../components/logistics'

function TabPanel({ children, value, index, ...props }) {
  return (
    <div hidden={value !== index} {...props}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ShipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)

  // Mock data for demo
  const mockShipment = {
    id: 1,
    shipmentNumber: 'SHP-2024-001',
    status: 'IN_TRANSIT',
    carrier: 'XPO Logistics',
    driverName: 'John Driver',
    driverPhone: '555-123-4567',
    vehicleId: 'TRK-4521',
    licensePlate: 'ABC-1234',
    origin: {
      name: 'Main Warehouse',
      address: '123 Industrial Blvd, Pittsburgh PA 15201',
    },
    destination: {
      name: 'Acme Steel Co',
      address: '456 Manufacturing Ave, Chicago IL 60601',
    },
    scheduledDate: new Date().toISOString(),
    departedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    distance: 468,
    units: [
      { id: 1, unitNumber: 'U-2024-0001', grade: 'A36', weight: 12500, status: 'LOADED' },
      { id: 2, unitNumber: 'U-2024-0002', grade: 'A36', weight: 11800, status: 'LOADED' },
      { id: 3, unitNumber: 'U-2024-0003', grade: 'A36', weight: 12200, status: 'LOADED' },
      { id: 4, unitNumber: 'U-2024-0004', grade: 'A36', weight: 11500, status: 'LOADED' },
    ],
    totalWeight: 48000,
    documents: [
      { id: 1, name: 'Bill of Lading', type: 'BOL', status: 'Signed' },
      { id: 2, name: 'Packing List', type: 'PKL', status: 'Complete' },
      { id: 3, name: 'Weight Tickets', type: 'WT', status: 'Complete' },
    ],
    route: {
      origin: { name: 'Pittsburgh, PA' },
      destination: { name: 'Chicago, IL' },
      distance: '468 miles',
      estimatedDuration: '8 hours',
      carrier: 'XPO Logistics',
    },
    stops: [
      { id: 1, name: 'Toledo, OH', type: 'waypoint', eta: new Date(Date.now() + 2 * 60 * 60 * 1000) },
    ],
  }

  const displayShipment = mockShipment

  const unitColumns = [
    { id: 'unitNumber', label: 'Unit Number', minWidth: 120 },
    { id: 'grade', label: 'Grade', minWidth: 100 },
    { id: 'weight', label: 'Weight', minWidth: 100, render: (row) => `${row.weight?.toLocaleString()} lbs` },
    { id: 'status', label: 'Status', minWidth: 100, render: (row) => <StatusChip status={row.status} /> },
  ]

  const docColumns = [
    { id: 'name', label: 'Document', minWidth: 200 },
    { id: 'type', label: 'Type', minWidth: 100 },
    { id: 'status', label: 'Status', minWidth: 100 },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/logistics/shipments')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" fontWeight={600}>
              {displayShipment.shipmentNumber}
            </Typography>
            <StatusChip status={displayShipment.status} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {displayShipment.carrier} | {displayShipment.vehicleId}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<PrintIcon />} variant="outlined">
            Print BOL
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
              <Typography variant="body2" color="text.secondary">Origin</Typography>
              <Typography variant="subtitle1" fontWeight={600}>{displayShipment.origin.name}</Typography>
              <Typography variant="caption" color="text.secondary">{displayShipment.origin.address}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Destination</Typography>
              <Typography variant="subtitle1" fontWeight={600}>{displayShipment.destination.name}</Typography>
              <Typography variant="caption" color="text.secondary">{displayShipment.destination.address}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Weight</Typography>
              <Typography variant="h5">{displayShipment.totalWeight?.toLocaleString()} lbs</Typography>
              <Typography variant="caption" color="text.secondary">{displayShipment.units?.length} units</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">ETA</Typography>
              <Typography variant="h5">
                {new Date(displayShipment.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(displayShipment.estimatedArrival).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<MapIcon />} iconPosition="start" label="Route" />
          <Tab icon={<TruckIcon />} iconPosition="start" label="Load" />
          <Tab icon={<InventoryIcon />} iconPosition="start" label="Units" />
          <Tab icon={<DocIcon />} iconPosition="start" label="Documents" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <RouteMap
          route={displayShipment.route}
          stops={displayShipment.stops}
          currentStopIndex={1}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <LoadDiagram
          vehicle={{
            name: displayShipment.vehicleId,
            licensePlate: displayShipment.licensePlate,
            type: 'flatbed',
          }}
          units={displayShipment.units}
          maxWeight={48000}
          maxCapacity={12}
          onUnitClick={(unit) => navigate(`/units/${unit.id}`)}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper>
          <DataTable
            columns={unitColumns}
            data={displayShipment.units || []}
            onRowClick={(row) => navigate(`/units/${row.id}`)}
            pageSize={10}
            showSearch={false}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper>
          <DataTable
            columns={docColumns}
            data={displayShipment.documents || []}
            pageSize={10}
            showSearch={false}
          />
        </Paper>
      </TabPanel>
    </Box>
  )
}
