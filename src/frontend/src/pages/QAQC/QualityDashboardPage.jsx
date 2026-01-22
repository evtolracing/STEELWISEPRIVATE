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
  LinearProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  alpha,
} from '@mui/material'
import {
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  Warning as WarningIcon,
  Science as TestIcon,
  Refresh as RefreshIcon,
  Assignment as ReportIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { DataTable, StatusChip } from '../../components/common'

function QCMetricCard({ title, value, total, color = 'primary' }) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h4" fontWeight={600}>
            {value}
          </Typography>
          {total > 0 && (
            <Typography variant="body2" color="text.secondary">
              / {total}
            </Typography>
          )}
        </Box>
        {total > 0 && (
          <LinearProgress 
            variant="determinate" 
            value={percentage}
            color={color}
            sx={{ mt: 1, height: 6, borderRadius: 3 }}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default function QualityDashboardPage() {
  // Mock data
  const mockPendingTests = [
    { id: 1, unitNumber: 'U-2024-0010', heatNumber: 'HT-2024-005', testType: 'Tensile', priority: 'HIGH', dueDate: new Date() },
    { id: 2, unitNumber: 'U-2024-0011', heatNumber: 'HT-2024-005', testType: 'Chemistry', priority: 'NORMAL', dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { id: 3, unitNumber: 'U-2024-0012', heatNumber: 'HT-2024-006', testType: 'Dimensional', priority: 'NORMAL', dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  ]

  const mockRecentResults = [
    { id: 1, unitNumber: 'U-2024-0005', testType: 'Tensile', result: 'PASS', testedBy: 'Lab Tech 1', testedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: 2, unitNumber: 'U-2024-0006', testType: 'Chemistry', result: 'PASS', testedBy: 'Lab Tech 2', testedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    { id: 3, unitNumber: 'U-2024-0007', testType: 'Hardness', result: 'FAIL', testedBy: 'Lab Tech 1', testedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), notes: 'Below minimum threshold' },
    { id: 4, unitNumber: 'U-2024-0008', testType: 'Dimensional', result: 'PASS', testedBy: 'Inspector', testedAt: new Date(Date.now() - 8 * 60 * 60 * 1000) },
  ]

  const mockHolds = [
    { id: 1, unitNumber: 'U-2024-0007', reason: 'Failed hardness test', holdDate: new Date(Date.now() - 6 * 60 * 60 * 1000), status: 'PENDING_REVIEW' },
    { id: 2, unitNumber: 'U-2024-0003', reason: 'Customer complaint', holdDate: new Date(Date.now() - 48 * 60 * 60 * 1000), status: 'UNDER_INVESTIGATION' },
  ]

  const pendingColumns = [
    { id: 'unitNumber', label: 'Unit', minWidth: 120 },
    { id: 'heatNumber', label: 'Heat', minWidth: 120 },
    { id: 'testType', label: 'Test Type', minWidth: 100 },
    { id: 'priority', label: 'Priority', minWidth: 80, render: (row) => <StatusChip status={row.priority} /> },
    { id: 'dueDate', label: 'Due', minWidth: 100, render: (row) => new Date(row.dueDate).toLocaleDateString() },
    { id: 'actions', label: '', minWidth: 80, render: () => (
      <Button size="small" variant="outlined">Start Test</Button>
    )},
  ]

  const resultColumns = [
    { id: 'unitNumber', label: 'Unit', minWidth: 120 },
    { id: 'testType', label: 'Test', minWidth: 100 },
    { id: 'result', label: 'Result', minWidth: 80, render: (row) => (
      <Chip 
        icon={row.result === 'PASS' ? <PassIcon /> : <FailIcon />}
        label={row.result}
        color={row.result === 'PASS' ? 'success' : 'error'}
        size="small"
      />
    )},
    { id: 'testedBy', label: 'Tested By', minWidth: 100 },
    { id: 'testedAt', label: 'Time', minWidth: 100, render: (row) => new Date(row.testedAt).toLocaleTimeString() },
  ]

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              width: 56, 
              height: 56, 
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}>
              <TestIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                Quality Dashboard
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Monitor quality control and testing status
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<ReportIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              QC Reports
            </Button>
            <Button 
              variant="contained" 
              startIcon={<TestIcon />}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              New Test
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <QCMetricCard title="Tests Today" value={24} total={30} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QCMetricCard title="Pass Rate (7d)" value={96} total={100} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Units on Hold
              </Typography>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {mockHolds.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Pending Tests
              </Typography>
              <Typography variant="h4" fontWeight={600} color="info.main">
                {mockPendingTests.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending Tests */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Pending Tests</Typography>
              <IconButton size="small"><RefreshIcon /></IconButton>
            </Box>
            <DataTable
              columns={pendingColumns}
              data={mockPendingTests}
              pageSize={5}
              showSearch={false}
            />
          </Paper>
        </Grid>

        {/* Units on Hold */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Units on Hold</Typography>
              <Chip label={mockHolds.length} size="small" color="warning" />
            </Box>
            <Stack spacing={2}>
              {mockHolds.map((hold) => (
                <Card key={hold.id} variant="outlined" sx={{ bgcolor: 'warning.light' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle2">{hold.unitNumber}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {hold.reason}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          Held: {new Date(hold.holdDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <StatusChip status={hold.status} size="small" />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Recent Results */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Test Results</Typography>
              <Button size="small">View All</Button>
            </Box>
            <DataTable
              columns={resultColumns}
              data={mockRecentResults}
              pageSize={5}
              showSearch={false}
            />
          </Paper>
        </Grid>
      </Grid>
      </Box>
    </Box>
  )
}
