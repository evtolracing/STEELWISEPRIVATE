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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  alpha,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
  Assignment as BOMIcon,
  Timeline as TimelineIcon,
  Build as BuildIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getWorkOrder } from '../../api'
import { StatusChip, DataTable } from '../../components/common'
import { TraceTimeline } from '../../components/traceability'

function TabPanel({ children, value, index, ...props }) {
  return (
    <div hidden={value !== index} {...props}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function WorkOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)

  const { data: workOrder, isLoading } = useApiQuery(
    ['workOrder', id],
    () => getWorkOrder(id)
  )

  // Mock data for demo
  const mockWorkOrder = {
    id: 1,
    workOrderNumber: 'WO-2024-001',
    type: 'Slitting',
    product: '48" x 0.075" A36 Coils to 12" Slit Coils',
    status: 'RUNNING',
    priority: 'HIGH',
    scheduledDate: new Date().toISOString(),
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    progress: 45,
    quantity: {
      planned: 25000,
      completed: 11250,
      unit: 'lbs',
    },
    machine: 'Slitter Line #2',
    operator: 'Mike Johnson',
    salesOrder: 'SO-2024-001',
    customer: 'Acme Steel Co',
    inputMaterials: [
      { id: 1, unitNumber: 'U-2024-0001', grade: 'A36', weight: 12500, status: 'IN_USE' },
      { id: 2, unitNumber: 'U-2024-0002', grade: 'A36', weight: 12500, status: 'QUEUED' },
    ],
    outputProducts: [
      { id: 1, product: '12" x 0.075" A36', quantity: 4500, status: 'COMPLETED' },
      { id: 2, product: '12" x 0.075" A36', quantity: 3500, status: 'IN_PROGRESS' },
    ],
    scrap: {
      weight: 125,
      percentage: 0.5,
    },
    bom: [
      { id: 1, item: 'A36 Master Coil', specification: '48" x 0.075"', quantity: 25000, unit: 'lbs', source: 'Inventory' },
    ],
    events: [
      { id: 1, type: 'CREATED', title: 'Work Order Created', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), actor: 'Jane Doe' },
      { id: 2, type: 'SCHEDULED', title: 'Scheduled for Production', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), actor: 'Production Manager' },
      { id: 3, type: 'RUNNING', title: 'Production Started', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), actor: 'Mike Johnson', description: 'Started on Slitter Line #2' },
    ],
  }

  const displayWO = workOrder || mockWorkOrder

  const inputColumns = [
    { id: 'unitNumber', label: 'Unit Number', minWidth: 120 },
    { id: 'grade', label: 'Grade', minWidth: 100 },
    { id: 'weight', label: 'Weight', minWidth: 100, render: (row) => `${row.weight?.toLocaleString()} lbs` },
    { id: 'status', label: 'Status', minWidth: 100, render: (row) => <StatusChip status={row.status} /> },
  ]

  const outputColumns = [
    { id: 'product', label: 'Product', minWidth: 200 },
    { id: 'quantity', label: 'Quantity', minWidth: 100, render: (row) => `${row.quantity?.toLocaleString()} lbs` },
    { id: 'status', label: 'Status', minWidth: 100, render: (row) => <StatusChip status={row.status} /> },
  ]

  const getStatusActions = () => {
    switch (displayWO.status) {
      case 'SCHEDULED':
        return (
          <Button startIcon={<StartIcon />} variant="contained" color="success">
            Start Production
          </Button>
        )
      case 'RUNNING':
        return (
          <>
            <Button startIcon={<PauseIcon />} variant="outlined" color="warning">
              Pause
            </Button>
            <Button startIcon={<CompleteIcon />} variant="contained" color="success">
              Complete
            </Button>
          </>
        )
      case 'PAUSED':
        return (
          <Button startIcon={<StartIcon />} variant="contained" color="success">
            Resume
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)' }}>
      {/* Modern Header */}
      <Box sx={{ 
        px: 3, 
        py: 2.5, 
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
        mb: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/work-orders')} sx={{ color: 'white' }}>
            <BackIcon />
          </IconButton>
          <Avatar sx={{ 
            width: 56, 
            height: 56, 
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
          }}>
            <BuildIcon sx={{ fontSize: 30 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                {displayWO.workOrderNumber}
              </Typography>
              <StatusChip status={displayWO.status} />
              <StatusChip status={displayWO.priority} />
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {displayWO.type} | {displayWO.product}
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            {getStatusActions()}
            <Button 
              startIcon={<PrintIcon />} 
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Print
            </Button>
            <Button 
              startIcon={<EditIcon />} 
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Edit
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
      {/* Progress Bar */}
      {displayWO.status === 'RUNNING' && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={500}>
              Production Progress
            </Typography>
            <Typography variant="body2" fontWeight={600} color="primary">
              {displayWO.progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={displayWO.progress} 
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {displayWO.quantity?.completed?.toLocaleString()} / {displayWO.quantity?.planned?.toLocaleString()} {displayWO.quantity?.unit}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Est. completion: {new Date(displayWO.estimatedCompletion).toLocaleTimeString()}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Machine</Typography>
              <Typography variant="h6">{displayWO.machine}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Operator</Typography>
              <Typography variant="h6">{displayWO.operator || '-'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Sales Order</Typography>
              <Typography variant="h6">{displayWO.salesOrder}</Typography>
              <Typography variant="caption" color="text.secondary">{displayWO.customer}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Scrap</Typography>
              <Typography variant="h6">{displayWO.scrap?.weight?.toLocaleString()} lbs</Typography>
              <Typography variant="caption" color="text.secondary">{displayWO.scrap?.percentage}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<BuildIcon />} iconPosition="start" label="Production" />
          <Tab icon={<BOMIcon />} iconPosition="start" label="BOM" />
          <Tab icon={<TimelineIcon />} iconPosition="start" label="History" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Input Materials</Typography>
              <DataTable
                columns={inputColumns}
                data={displayWO.inputMaterials || []}
                pageSize={5}
                showSearch={false}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Output Products</Typography>
              <DataTable
                columns={outputColumns}
                data={displayWO.outputProducts || []}
                pageSize={5}
                showSearch={false}
              />
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Bill of Materials</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Specification</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Source</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayWO.bom?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.item}</TableCell>
                  <TableCell>{item.specification}</TableCell>
                  <TableCell>{item.quantity?.toLocaleString()} {item.unit}</TableCell>
                  <TableCell>{item.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Work Order History</Typography>
          <TraceTimeline events={displayWO.events || []} />
        </Paper>
      </TabPanel>
      </Box>
    </Box>
  )
}
