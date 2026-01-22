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
  LocalFireDepartment as HeatIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getHeats } from '../../api'
import { DataTable, StatusChip, DateRangePicker } from '../../components/common'

export default function HeatListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: { startDate: null, endDate: null },
  })
  const [anchorEl, setAnchorEl] = useState(null)

  const { data, isLoading, refetch } = useApiQuery(
    ['heats', filters],
    () => getHeats(filters)
  )

  const columns = [
    { 
      id: 'heatNumber', 
      label: 'Heat Number', 
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          {row.heatNumber}
        </Typography>
      ),
    },
    { id: 'millName', label: 'Mill', minWidth: 150 },
    { id: 'grade', label: 'Grade', minWidth: 100 },
    { 
      id: 'chemistry', 
      label: 'Key Chemistry', 
      minWidth: 150,
      render: (row) => {
        const chem = row.chemistry || {}
        return `C: ${chem.carbon || '-'} | Mn: ${chem.manganese || '-'}`
      },
    },
    { 
      id: 'unitCount', 
      label: 'Units', 
      minWidth: 80,
      render: (row) => (
        <Chip label={row.unitCount || 0} size="small" variant="outlined" />
      ),
    },
    { 
      id: 'totalWeight', 
      label: 'Total Weight', 
      minWidth: 120,
      render: (row) => `${row.totalWeight?.toLocaleString() || 0} lbs`,
    },
    { 
      id: 'receivedDate', 
      label: 'Received', 
      minWidth: 100,
      render: (row) => row.receivedDate 
        ? new Date(row.receivedDate).toLocaleDateString() 
        : '-',
    },
    { 
      id: 'status', 
      label: 'Status', 
      minWidth: 100,
      render: (row) => <StatusChip status={row.status || 'AVAILABLE'} />,
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
    navigate(`/heats/${row.id}`)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting heats...')
  }

  // Mock data for demo
  const mockHeats = [
    { id: 1, heatNumber: 'HT-2024-001', millName: 'US Steel Gary', grade: 'A36', chemistry: { carbon: 0.25, manganese: 0.85 }, unitCount: 12, totalWeight: 145000, receivedDate: new Date(), status: 'AVAILABLE' },
    { id: 2, heatNumber: 'HT-2024-002', millName: 'Nucor Berkeley', grade: 'A572-50', chemistry: { carbon: 0.23, manganese: 1.35 }, unitCount: 8, totalWeight: 98000, receivedDate: new Date(), status: 'PROCESSING' },
    { id: 3, heatNumber: 'HT-2024-003', millName: 'ArcelorMittal', grade: '304 SS', chemistry: { carbon: 0.08, manganese: 2.0 }, unitCount: 5, totalWeight: 45000, receivedDate: new Date(), status: 'ON_HOLD' },
  ]

  const displayData = data?.heats || mockHeats

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
              <HeatIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                Heats
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Manage mill heats and their associated units
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
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
              onClick={() => navigate('/heats/new')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              Add Heat
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search heats..."
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
            <MenuItem value="AVAILABLE">Available</MenuItem>
            <MenuItem value="PROCESSING">Processing</MenuItem>
            <MenuItem value="ON_HOLD">On Hold</MenuItem>
            <MenuItem value="DEPLETED">Depleted</MenuItem>
          </TextField>

          <DateRangePicker
            startDate={filters.dateRange.startDate}
            endDate={filters.dateRange.endDate}
            onChange={(range) => setFilters({ ...filters, dateRange: range })}
            label="Received Date"
          />

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
        <MenuItem onClick={() => { navigate(`/heats/${anchorEl?.row?.id}`); handleMenuClose(); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/heats/${anchorEl?.row?.id}/edit`); handleMenuClose(); }}>
          Edit Heat
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/heats/${anchorEl?.row?.id}/trace`); handleMenuClose(); }}>
          View Trace
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>View Mill Cert</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          Place on Hold
        </MenuItem>
      </Menu>
      </Box>
    </Box>
  )
}
