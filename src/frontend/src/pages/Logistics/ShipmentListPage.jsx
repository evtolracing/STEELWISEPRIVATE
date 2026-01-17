import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useApiQuery } from '../../hooks/useApiQuery'
import { DataTable, StatusChip } from '../../components/common'

export default function ShipmentListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  })
  const [anchorEl, setAnchorEl] = useState(null)

  const columns = [
    { 
      id: 'shipmentNumber', 
      label: 'Shipment #', 
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          {row.shipmentNumber}
        </Typography>
      ),
    },
    { id: 'carrier', label: 'Carrier', minWidth: 150 },
    { id: 'origin', label: 'Origin', minWidth: 150 },
    { id: 'destination', label: 'Destination', minWidth: 150 },
    { 
      id: 'units', 
      label: 'Units', 
      minWidth: 80,
      render: (row) => row.unitCount || 0,
    },
    { 
      id: 'weight', 
      label: 'Weight', 
      minWidth: 100,
      render: (row) => `${row.totalWeight?.toLocaleString() || 0} lbs`,
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
      id: 'status', 
      label: 'Status', 
      minWidth: 100,
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      id: 'actions',
      label: '',
      minWidth: 50,
      render: (row) => (
        <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)}>
          <MoreIcon />
        </IconButton>
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
    navigate(`/logistics/shipments/${row.id}`)
  }

  // Mock data for demo
  const mockShipments = [
    { id: 1, shipmentNumber: 'SHP-2024-001', carrier: 'XPO Logistics', origin: 'Main Warehouse', destination: 'Acme Steel Co, Chicago IL', unitCount: 8, totalWeight: 95000, scheduledDate: new Date(), status: 'IN_TRANSIT' },
    { id: 2, shipmentNumber: 'SHP-2024-002', carrier: 'FedEx Freight', origin: 'Main Warehouse', destination: 'BuildRight LLC, Detroit MI', unitCount: 4, totalWeight: 48000, scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), status: 'LOADING' },
    { id: 3, shipmentNumber: 'SHP-2024-003', carrier: 'Old Dominion', origin: 'Processing Center', destination: 'Metal Works Inc, Cleveland OH', unitCount: 12, totalWeight: 142000, scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), status: 'DELIVERED' },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Shipments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage outbound shipments
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/logistics/shipments/new')}
          >
            New Shipment
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search shipments..."
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
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="LOADING">Loading</MenuItem>
            <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
            <MenuItem value="DELIVERED">Delivered</MenuItem>
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
          data={mockShipments}
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
        <MenuItem onClick={() => { navigate(`/logistics/shipments/${anchorEl?.row?.id}`); handleMenuClose(); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>Track Shipment</MenuItem>
        <MenuItem onClick={handleMenuClose}>Print BOL</MenuItem>
        <MenuItem onClick={handleMenuClose}>Update Status</MenuItem>
      </Menu>
    </Box>
  )
}
