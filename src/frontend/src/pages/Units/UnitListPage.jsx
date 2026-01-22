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
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  Inventory as UnitIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getUnits } from '../../api'
import { DataTable, StatusChip } from '../../components/common'
import { UnitCard } from '../../components/traceability'

export default function UnitListPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('list')
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    grade: '',
  })
  const [anchorEl, setAnchorEl] = useState(null)

  const { data, isLoading, refetch } = useApiQuery(
    ['units', filters],
    () => getUnits(filters)
  )

  const columns = [
    { 
      id: 'unitNumber', 
      label: 'Unit Number', 
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          {row.unitNumber}
        </Typography>
      ),
    },
    { id: 'heatNumber', label: 'Heat', minWidth: 120 },
    { id: 'grade', label: 'Grade', minWidth: 100 },
    { 
      id: 'dimensions', 
      label: 'Dimensions', 
      minWidth: 120,
      render: (row) => row.dimensions 
        ? `${row.dimensions.width}" x ${row.dimensions.gauge}"`
        : '-',
    },
    { 
      id: 'weight', 
      label: 'Weight', 
      minWidth: 100,
      render: (row) => `${row.weight?.toLocaleString() || 0} lbs`,
    },
    { id: 'location', label: 'Location', minWidth: 120 },
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
    navigate(`/units/${row.id}`)
  }

  // Mock data for demo
  const mockUnits = [
    { id: 1, unitNumber: 'U-2024-0001', heatNumber: 'HT-2024-001', grade: 'A36', dimensions: { width: 48, gauge: 0.075 }, weight: 12500, location: 'Bay A-01', status: 'AVAILABLE' },
    { id: 2, unitNumber: 'U-2024-0002', heatNumber: 'HT-2024-001', grade: 'A36', dimensions: { width: 48, gauge: 0.075 }, weight: 11800, location: 'Bay A-02', status: 'ALLOCATED' },
    { id: 3, unitNumber: 'U-2024-0003', heatNumber: 'HT-2024-002', grade: 'A572-50', dimensions: { width: 60, gauge: 0.105 }, weight: 15200, location: 'Bay B-01', status: 'ON_HOLD' },
    { id: 4, unitNumber: 'U-2024-0004', heatNumber: 'HT-2024-002', grade: 'A572-50', dimensions: { width: 60, gauge: 0.105 }, weight: 14800, location: 'Bay B-02', status: 'AVAILABLE' },
    { id: 5, unitNumber: 'U-2024-0005', heatNumber: 'HT-2024-003', grade: '304 SS', dimensions: { width: 36, gauge: 0.048 }, weight: 8500, location: 'Bay C-01', status: 'SHIPPED' },
  ]

  const displayData = data?.units || mockUnits

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
              <UnitIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                Units / Coils
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Manage individual steel units and coils • Full traceability
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, v) => v && setViewMode(v)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: 'rgba(255,255,255,0.7)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&.Mui-selected': {
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.2)',
                  },
                },
              }}
            >
              <ToggleButton value="list">
                <ListIcon />
              </ToggleButton>
              <ToggleButton value="grid">
                <GridIcon />
              </ToggleButton>
            </ToggleButtonGroup>
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
              onClick={() => navigate('/units/new')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              Add Unit
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search units..."
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
            <MenuItem value="ALLOCATED">Allocated</MenuItem>
            <MenuItem value="ON_HOLD">On Hold</MenuItem>
            <MenuItem value="SHIPPED">Shipped</MenuItem>
            <MenuItem value="CONSUMED">Consumed</MenuItem>
          </TextField>

          <TextField
            select
            label="Grade"
            size="small"
            value={filters.grade}
            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Grades</MenuItem>
            <MenuItem value="A36">A36</MenuItem>
            <MenuItem value="A572-50">A572-50</MenuItem>
            <MenuItem value="304 SS">304 SS</MenuItem>
            <MenuItem value="316 SS">316 SS</MenuItem>
          </TextField>

          <Box sx={{ flex: 1 }} />
          
          <Button startIcon={<FilterIcon />} size="small">
            More Filters
          </Button>
        </Stack>
      </Paper>

      {/* Data View */}
      {viewMode === 'list' ? (
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
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: 2 
        }}>
          {displayData.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onView={() => navigate(`/units/${unit.id}`)}
              onTrace={() => navigate(`/units/${unit.id}/trace`)}
              onQrCode={() => console.log('QR Code for', unit.unitNumber)}
            />
          ))}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl?.element}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/units/${anchorEl?.row?.id}`); handleMenuClose(); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/units/${anchorEl?.row?.id}/edit`); handleMenuClose(); }}>
          Edit Unit
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/units/${anchorEl?.row?.id}/trace`); handleMenuClose(); }}>
          View Trace
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>Print Label</MenuItem>
        <MenuItem onClick={handleMenuClose}>Allocate to Order</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'warning.main' }}>
          Place on Hold
        </MenuItem>
      </Menu>
      </Box>
    </Box>
  )
}
