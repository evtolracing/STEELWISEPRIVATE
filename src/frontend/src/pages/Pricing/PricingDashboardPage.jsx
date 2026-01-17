import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'
import { DataTable, StatusChip } from '../../components/common'

export default function PricingDashboardPage() {
  const [gradeFilter, setGradeFilter] = useState('')
  
  // Mock data
  const mockPrices = [
    { id: 1, grade: 'A36', product: 'Hot Rolled Coil', basePrice: 0.42, effectiveDate: new Date(), status: 'ACTIVE' },
    { id: 2, grade: 'A572-50', product: 'Hot Rolled Coil', basePrice: 0.48, effectiveDate: new Date(), status: 'ACTIVE' },
    { id: 3, grade: '304 SS', product: 'Stainless Coil', basePrice: 2.15, effectiveDate: new Date(), status: 'ACTIVE' },
    { id: 4, grade: '316 SS', product: 'Stainless Coil', basePrice: 2.85, effectiveDate: new Date(), status: 'ACTIVE' },
  ]

  const mockSurcharges = [
    { id: 1, name: 'Fuel Surcharge', type: 'PERCENTAGE', value: 5, status: 'ACTIVE' },
    { id: 2, name: 'Small Order Fee', type: 'FLAT', value: 150, minQty: 0, maxQty: 5000, status: 'ACTIVE' },
    { id: 3, name: 'Cut-to-Length', type: 'PER_LB', value: 0.02, status: 'ACTIVE' },
  ]

  const mockQuotes = [
    { id: 1, quoteNumber: 'Q-2024-001', customer: 'Acme Steel Co', total: 45600, validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: 'PENDING' },
    { id: 2, quoteNumber: 'Q-2024-002', customer: 'BuildRight LLC', total: 23400, validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), status: 'APPROVED' },
    { id: 3, quoteNumber: 'Q-2024-003', customer: 'Metal Works Inc', total: 89000, validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: 'DRAFT' },
  ]

  const priceColumns = [
    { id: 'grade', label: 'Grade', minWidth: 100 },
    { id: 'product', label: 'Product', minWidth: 150 },
    { id: 'basePrice', label: 'Base Price ($/lb)', minWidth: 120, render: (row) => `$${row.basePrice.toFixed(2)}` },
    { id: 'effectiveDate', label: 'Effective', minWidth: 100, render: (row) => new Date(row.effectiveDate).toLocaleDateString() },
    { id: 'status', label: 'Status', minWidth: 100, render: (row) => <StatusChip status={row.status} /> },
    { id: 'actions', label: '', minWidth: 80, render: () => (
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
      </Stack>
    )},
  ]

  const quoteColumns = [
    { id: 'quoteNumber', label: 'Quote #', minWidth: 120, render: (row) => (
      <Typography variant="body2" fontWeight={600} color="primary">{row.quoteNumber}</Typography>
    )},
    { id: 'customer', label: 'Customer', minWidth: 150 },
    { id: 'total', label: 'Total', minWidth: 100, render: (row) => `$${row.total.toLocaleString()}` },
    { id: 'validUntil', label: 'Valid Until', minWidth: 100, render: (row) => new Date(row.validUntil).toLocaleDateString() },
    { id: 'status', label: 'Status', minWidth: 100, render: (row) => <StatusChip status={row.status} /> },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Pricing Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage base prices, surcharges, and quotes
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />}>
            New Quote
          </Button>
        </Stack>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Avg Carbon Price</Typography>
                  <Typography variant="h4" fontWeight={600}>$0.45/lb</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <TrendingUpIcon fontSize="small" color="success" />
                    <Typography variant="body2" color="success.main">+2.3%</Typography>
                  </Box>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, color: 'primary.light' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Avg Stainless Price</Typography>
                  <Typography variant="h4" fontWeight={600}>$2.50/lb</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <TrendingUpIcon fontSize="small" color="success" />
                    <Typography variant="body2" color="success.main">+5.1%</Typography>
                  </Box>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, color: 'info.light' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Open Quotes</Typography>
              <Typography variant="h4" fontWeight={600}>12</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>$458K total value</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Quote Win Rate</Typography>
              <Typography variant="h4" fontWeight={600}>68%</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Last 30 days</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Base Prices */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Base Prices</Typography>
              <Button startIcon={<AddIcon />} size="small">Add Price</Button>
            </Box>
            <DataTable
              columns={priceColumns}
              data={mockPrices}
              pageSize={5}
              showSearch={false}
            />
          </Paper>
        </Grid>

        {/* Surcharges */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Active Surcharges</Typography>
              <Button startIcon={<AddIcon />} size="small">Add</Button>
            </Box>
            <Stack spacing={2}>
              {mockSurcharges.map((surcharge) => (
                <Card key={surcharge.id} variant="outlined">
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2">{surcharge.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {surcharge.type === 'PERCENTAGE' && `${surcharge.value}%`}
                          {surcharge.type === 'FLAT' && `$${surcharge.value}`}
                          {surcharge.type === 'PER_LB' && `$${surcharge.value}/lb`}
                        </Typography>
                      </Box>
                      <Chip label={surcharge.status} size="small" color="success" variant="outlined" />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Recent Quotes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Quotes</Typography>
              <Button size="small">View All</Button>
            </Box>
            <DataTable
              columns={quoteColumns}
              data={mockQuotes}
              pageSize={5}
              showSearch={false}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
