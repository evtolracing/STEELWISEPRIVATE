import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Avatar,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Assignment as WorkOrderIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getWorkOrders } from '../../api'
import { DataTable, StatusChip } from '../../components/common'

export default function WorkOrderListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
  })
  const [anchorEl, setAnchorEl] = useState(null)

  const { data, isLoading, refetch } = useApiQuery(
    ['workOrders', filters],
    () => getWorkOrders(filters)
  )

  const columns = [
    { 
      id: 'workOrderNumber', 
      label: 'WO Number', 
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          {row.workOrderNumber}
        </Typography>
      ),
    },
    { id: 'type', label: 'Type', minWidth: 100 },
    { id: 'product', label: 'Product', minWidth: 150 },
    { 
      id: 'quantity', 
      label: 'Quantity', 
      minWidth: 100,
      render: (row) => `${row.quantity?.toLocaleString() || 0} ${row.unit || 'pcs'}`,
    },
    { 
      id: 'scheduledDate', 
      label: 'Scheduled', 
      minWidth: 100,
      render: (row) => row.scheduledDate 
        ? new Date(row.scheduledDate).toLocaleDateString() 
        : '-',
    },
    { 
      id: 'progress', 
      label: 'Progress', 
      minWidth: 100,
      render: (row) => (
        <Chip 
          label={`${row.progress || 0}%`} 
          size="small" 
          color={row.progress >= 100 ? 'success' : row.progress > 0 ? 'primary' : 'default'}
          variant="outlined"
        />
      ),
    },
    { 
      id: 'status', 
      label: 'Status', 
      minWidth: 100,
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      id: 'actions',
      label: '',
      minWidth: 80,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          {row.status === 'SCHEDULED' && (
            <IconButton size="small" color="success" title="Start">
              <StartIcon fontSize="small" />
            </IconButton>
          )}
          {row.status === 'RUNNING' && (
            <IconButton size="small" color="warning" title="Pause">
              <PauseIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)}>
            <MoreIcon />
          </IconButton>
        </Stack>
      ),
    },
  ]

  const handleMenuOpen = (event, row) => {
    event.stopPropagation()
    setAnchorEl({ element: event.currentTarget, row })
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleRowClick = (row) => {
    navigate(`/work-orders/${row.id}`)
  }

  // Mock data for demo
  const mockWorkOrders = [
    { id: 1, workOrderNumber: 'WO-2024-001', type: 'Slitting', product: '48" x 0.075" A36', quantity: 25000, unit: 'lbs', scheduledDate: new Date(), progress: 45, status: 'RUNNING' },
    { id: 2, workOrderNumber: 'WO-2024-002', type: 'Cut-to-Length', product: '60" x 0.105" A572', quantity: 15000, unit: 'lbs', scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), progress: 0, status: 'SCHEDULED' },
    { id: 3, workOrderNumber: 'WO-2024-003', type: 'Blanking', product: '36" x 0.048" 304SS', quantity: 500, unit: 'pcs', scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), progress: 100, status: 'COMPLETED' },
    { id: 4, workOrderNumber: 'WO-2024-004', type: 'Slitting', product: '72" x 0.135" HR', quantity: 40000, unit: 'lbs', scheduledDate: new Date(), progress: 0, status: 'PAUSED' },
  ]

  const displayData = data?.workOrders || mockWorkOrders

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
              <WorkOrderIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                Work Orders
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Manage production and processing work orders
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/work-orders/new')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              New Work Order
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search work orders..."
            size="small"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          
          <TextField
            select
            label="Status"
            size="small"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="SCHEDULED">Scheduled</MenuItem>
            <MenuItem value="RUNNING">Running</MenuItem>
            <MenuItem value="PAUSED">Paused</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>

          <TextField
            select
            label="Type"
            size="small"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="Slitting">Slitting</MenuItem>
            <MenuItem value="Cut-to-Length">Cut-to-Length</MenuItem>
            <MenuItem value="Blanking">Blanking</MenuItem>
            <MenuItem value="Leveling">Leveling</MenuItem>
          </TextField>

          <Box sx={{ flex: 1 }} />
          
          <Button startIcon={<FilterIcon />} size="small">
            More Filters
          </Button>
        </Stack>
      </Paper>

      {/* Data Table */}
      <Paper>
        <DataTable
          columns={columns}
          data={displayData}
          loading={isLoading}
          onRowClick={handleRowClick}
          pageSize={10}
          showSearch={false}
        />
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl?.element}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/work-orders/${anchorEl?.row?.id}`); handleMenuClose(); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/work-orders/${anchorEl?.row?.id}/edit`); handleMenuClose(); }}>
          Edit Work Order
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>Start Production</MenuItem>
        <MenuItem onClick={handleMenuClose}>Pause Production</MenuItem>
        <MenuItem onClick={handleMenuClose}>Complete Work Order</MenuItem>
        <MenuItem onClick={handleMenuClose}>View BOM</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          Cancel Work Order
        </MenuItem>
      </Menu>
      </Box>
    </Box>
  )
}
