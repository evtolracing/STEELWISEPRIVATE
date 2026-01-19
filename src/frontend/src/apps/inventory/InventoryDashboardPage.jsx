/**
 * Inventory Dashboard Page
 * Main inventory view with table, filters, and AI assistant panel
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  LocalShipping as TransferIcon,
  Warning as WarningIcon,
  CheckCircle as AvailableIcon,
  Block as HoldIcon,
  Assignment as AllocatedIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { getInventory, getInventorySummary, getLocations } from '../../services/inventoryApi';
import InventoryAiAssistantPanel from '../../components/InventoryAiAssistantPanel';

export default function InventoryDashboardPage() {
  const navigate = useNavigate();
  
  // Data state
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [materialSearch, setMaterialSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [remnantFilter, setRemnantFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {};
      if (materialSearch) params.materialCode = materialSearch;
      if (locationFilter) params.locationId = locationFilter;
      if (divisionFilter) params.division = divisionFilter;
      if (statusFilter) params.status = statusFilter;
      if (remnantFilter !== 'all') params.isRemnant = remnantFilter === 'remnants';
      
      const [inventoryData, summaryData, locationsData] = await Promise.all([
        getInventory(params),
        getInventorySummary(),
        getLocations(),
      ]);
      
      setInventory(inventoryData);
      setSummary(summaryData);
      setLocations(locationsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [materialSearch, locationFilter, divisionFilter, statusFilter, remnantFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleViewDetail = (id) => {
    navigate(`/inventory/${id}`);
  };

  const handleClearFilters = () => {
    setMaterialSearch('');
    setLocationFilter('');
    setDivisionFilter('');
    setStatusFilter('');
    setRemnantFilter('all');
  };

  const handleAiAction = (action) => {
    // Handle AI-suggested actions
    switch (action.type) {
      case 'VIEW_REMNANTS':
        setRemnantFilter('remnants');
        break;
      case 'SEARCH_TRANSFERS':
        navigate('/inventory/transfers');
        break;
      default:
        console.log('AI Action:', action);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <Chip icon={<AvailableIcon />} label="Available" size="small" color="success" variant="outlined" />;
      case 'ALLOCATED':
        return <Chip icon={<AllocatedIcon />} label="Allocated" size="small" color="warning" variant="outlined" />;
      case 'ON_HOLD':
        return <Chip icon={<HoldIcon />} label="On Hold" size="small" color="error" variant="outlined" />;
      default:
        return <Chip label={status} size="small" variant="outlined" />;
    }
  };

  const hasActiveFilters = materialSearch || locationFilter || divisionFilter || statusFilter || remnantFilter !== 'all';

  // Paginated data
  const paginatedInventory = inventory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 2 }}>
      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Inventory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage inventory across all locations
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<TransferIcon />}
              onClick={() => navigate('/inventory/transfers')}
            >
              Transfers
            </Button>
            <IconButton onClick={loadData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Total Units</Typography>
                  <Typography variant="h5" fontWeight={600}>{summary.totalUnits}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Total Quantity</Typography>
                  <Typography variant="h5" fontWeight={600}>{summary.totalQuantity?.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Remnants</Typography>
                  <Typography variant="h5" fontWeight={600}>{summary.remnantCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Pending Transfers</Typography>
                  <Typography variant="h5" fontWeight={600}>{summary.pendingTransfers}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search material..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  label="Location"
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {locations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Division</InputLabel>
                <Select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  label="Division"
                >
                  <MenuItem value="">All Divisions</MenuItem>
                  <MenuItem value="METALS">Metals</MenuItem>
                  <MenuItem value="PLASTICS">Plastics</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  <MenuItem value="ALLOCATED">Allocated</MenuItem>
                  <MenuItem value="ON_HOLD">On Hold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <ToggleButtonGroup
                size="small"
                value={remnantFilter}
                exclusive
                onChange={(e, val) => val && setRemnantFilter(val)}
                fullWidth
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="primary">Primary</ToggleButton>
                <ToggleButton value="remnants">Remnants</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} md={1}>
              {hasActiveFilters && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Table */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ flex: 1 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material Code</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>RFID Tag</TableCell>
                      <TableCell>Etched ID</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Last Scan</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Remnant</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No inventory found matching filters
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedInventory.map((inv) => (
                        <TableRow
                          key={inv.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleViewDetail(inv.id)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {inv.materialCode}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                              {inv.catalogItem?.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                              {inv.rfidTagId || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {inv.etchedId || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {inv.location?.name || inv.locationId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {inv.lastScanLocation ? (
                              <Tooltip title={inv.lastScanAt ? new Date(inv.lastScanAt).toLocaleString() : ''}>
                                <Typography variant="caption" color="text.secondary">
                                  {inv.lastScanLocation.name}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.disabled">-</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500}>
                              {inv.quantity.toLocaleString()} {inv.unit}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(inv.status)}
                          </TableCell>
                          <TableCell>
                            {inv.isRemnant && (
                              <Chip label="Remnant" size="small" color="info" variant="filled" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetail(inv.id);
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={inventory.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          )}
        </Paper>
      </Box>

      {/* AI Assistant Panel */}
      <Box sx={{ width: 350, flexShrink: 0 }}>
        <InventoryAiAssistantPanel
          context={{
            currentFilters: { locationFilter, divisionFilter, statusFilter, remnantFilter },
            inventoryCount: inventory.length,
          }}
          onActionClick={handleAiAction}
        />
      </Box>
    </Box>
  );
}
