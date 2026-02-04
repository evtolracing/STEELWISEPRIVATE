/**
 * Inspections Page
 * Schedule, track, and manage safety inspections
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  Divider,
  Avatar,
  LinearProgress,
  Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Assignment as InspectionIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Warning as OverdueIcon,
  PlayArrow as StartIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  LocalShipping as ForkliftIcon,
  PrecisionManufacturing as CraneIcon,
  LocalFireDepartment as FireIcon,
  ElectricalServices as ElectricalIcon,
  Build as MaintenanceIcon,
  CleaningServices as HousekeepingIcon,
  HealthAndSafety as SafetyIcon,
  CalendarMonth as CalendarIcon,
  ViewList as ListIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Mock data
const mockInspections = [
  { id: 'INS-2026-0125', type: 'FORKLIFT_DAILY', name: 'Forklift Daily Inspection', equipment: 'Forklift #12', location: 'Warehouse A', assignee: 'Mike Johnson', scheduledDate: '2026-02-03', dueDate: '2026-02-03', status: 'SCHEDULED', completedDate: null, score: null },
  { id: 'INS-2026-0124', type: 'CRANE_MONTHLY', name: 'Monthly Crane Inspection', equipment: 'Overhead Crane Bay 3', location: 'Production Floor', assignee: 'Sarah Williams', scheduledDate: '2026-02-05', dueDate: '2026-02-05', status: 'SCHEDULED', completedDate: null, score: null },
  { id: 'INS-2026-0123', type: 'FIRE_EXTINGUISHER', name: 'Fire Extinguisher Monthly Check', equipment: 'Building A - All', location: 'Building A', assignee: 'Safety Team', scheduledDate: '2026-02-10', dueDate: '2026-02-10', status: 'SCHEDULED', completedDate: null, score: null },
  { id: 'INS-2026-0122', type: 'FORKLIFT_DAILY', name: 'Forklift Daily Inspection', equipment: 'Forklift #12', location: 'Warehouse A', assignee: 'Mike Johnson', scheduledDate: '2026-02-02', dueDate: '2026-02-02', status: 'COMPLETED', completedDate: '2026-02-02', score: 100 },
  { id: 'INS-2026-0121', type: 'HOUSEKEEPING', name: 'Weekly 5S Audit', equipment: 'Production Floor', location: 'Production Floor', assignee: 'Quality Team', scheduledDate: '2026-02-01', dueDate: '2026-02-01', status: 'COMPLETED', completedDate: '2026-02-01', score: 92 },
  { id: 'INS-2026-0120', type: 'ELECTRICAL', name: 'Monthly Electrical Panel Check', equipment: 'Main Electrical Room', location: 'Building A', assignee: 'Maintenance Team', scheduledDate: '2026-01-30', dueDate: '2026-01-30', status: 'COMPLETED', completedDate: '2026-01-30', score: 100 },
  { id: 'INS-2026-0119', type: 'CRANE_MONTHLY', name: 'Monthly Crane Inspection', equipment: 'Overhead Crane Bay 2', location: 'Production Floor', assignee: 'Sarah Williams', scheduledDate: '2026-01-25', dueDate: '2026-01-25', status: 'OVERDUE', completedDate: null, score: null },
  { id: 'INS-2026-0118', type: 'PPE_AUDIT', name: 'PPE Compliance Audit', equipment: 'All Areas', location: 'Facility Wide', assignee: 'Safety Team', scheduledDate: '2026-01-28', dueDate: '2026-01-28', status: 'COMPLETED', completedDate: '2026-01-28', score: 88 },
];

const inspectionTypes = [
  { value: 'FORKLIFT_DAILY', label: 'Forklift Daily', icon: ForkliftIcon, color: 'primary' },
  { value: 'CRANE_MONTHLY', label: 'Crane Monthly', icon: CraneIcon, color: 'warning' },
  { value: 'FIRE_EXTINGUISHER', label: 'Fire Extinguisher', icon: FireIcon, color: 'error' },
  { value: 'ELECTRICAL', label: 'Electrical', icon: ElectricalIcon, color: 'warning' },
  { value: 'HOUSEKEEPING', label: '5S / Housekeeping', icon: HousekeepingIcon, color: 'info' },
  { value: 'PPE_AUDIT', label: 'PPE Audit', icon: SafetyIcon, color: 'success' },
  { value: 'GENERAL_SAFETY', label: 'General Safety', icon: InspectionIcon, color: 'default' },
];

const statusOptions = [
  { value: 'SCHEDULED', label: 'Scheduled', color: 'info' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'warning' },
  { value: 'COMPLETED', label: 'Completed', color: 'success' },
  { value: 'OVERDUE', label: 'Overdue', color: 'error' },
];

function getTypeIcon(type) {
  const typeObj = inspectionTypes.find(t => t.value === type);
  const IconComponent = typeObj?.icon || InspectionIcon;
  return <IconComponent fontSize="small" />;
}

function getTypeColor(type) {
  const typeObj = inspectionTypes.find(t => t.value === type);
  return typeObj?.color || 'default';
}

function getStatusColor(status) {
  const statusObj = statusOptions.find(s => s.value === status);
  return statusObj?.color || 'default';
}

function getScoreColor(score) {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
}

// Schedule Inspection Dialog
function ScheduleInspectionDialog({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: '',
    equipment: '',
    location: '',
    assignee: '',
    scheduledDate: dayjs().add(1, 'day'),
    notes: '',
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
    setFormData({
      type: '',
      equipment: '',
      location: '',
      assignee: '',
      scheduledDate: dayjs().add(1, 'day'),
      notes: '',
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Schedule Inspection</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Inspection Type</InputLabel>
              <Select
                value={formData.type}
                label="Inspection Type"
                onChange={handleChange('type')}
              >
                {inspectionTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              required
              label="Equipment / Area"
              value={formData.equipment}
              onChange={handleChange('equipment')}
              placeholder="What is being inspected?"
            />
            <TextField
              fullWidth
              required
              label="Location"
              value={formData.location}
              onChange={handleChange('location')}
            />
            <TextField
              fullWidth
              required
              label="Assignee"
              value={formData.assignee}
              onChange={handleChange('assignee')}
            />
            <DatePicker
              label="Scheduled Date"
              value={formData.scheduledDate}
              onChange={(newValue) => setFormData({ ...formData, scheduledDate: newValue })}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={formData.notes}
              onChange={handleChange('notes')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.type || !formData.equipment || !formData.location || !formData.assignee}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default function InspectionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [inspections, setInspections] = useState(mockInspections);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('scheduledDate');
  const [order, setOrder] = useState('asc');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState('list');

  // Check for ?new=true to open dialog
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setScheduleDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Filter and sort data
  const filteredInspections = useMemo(() => {
    let result = [...inspections];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ins) =>
          ins.id.toLowerCase().includes(query) ||
          ins.name.toLowerCase().includes(query) ||
          ins.equipment.toLowerCase().includes(query) ||
          ins.location.toLowerCase().includes(query) ||
          ins.assignee.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.type !== 'all') {
      result = result.filter((ins) => ins.type === filters.type);
    }
    if (filters.status !== 'all') {
      result = result.filter((ins) => ins.status === filters.status);
    }

    // Apply tab filter
    if (tabValue === 1) { // Scheduled
      result = result.filter((ins) => ['SCHEDULED', 'IN_PROGRESS'].includes(ins.status));
    } else if (tabValue === 2) { // Completed
      result = result.filter((ins) => ins.status === 'COMPLETED');
    } else if (tabValue === 3) { // Overdue
      result = result.filter((ins) => ins.status === 'OVERDUE');
    }

    // Apply sort
    result.sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (order === 'asc') {
        return aValue < bValue ? -1 : 1;
      }
      return aValue > bValue ? -1 : 1;
    });

    return result;
  }, [inspections, searchQuery, filters, orderBy, order, tabValue]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleMenuClick = (event, inspection) => {
    setAnchorEl(event.currentTarget);
    setSelectedInspection(inspection);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInspection(null);
  };

  const handleScheduleInspection = (formData) => {
    const typeObj = inspectionTypes.find(t => t.value === formData.type);
    const newInspection = {
      id: `INS-2026-${String(inspections.length + 126).padStart(4, '0')}`,
      type: formData.type,
      name: typeObj?.label || formData.type,
      equipment: formData.equipment,
      location: formData.location,
      assignee: formData.assignee,
      scheduledDate: formData.scheduledDate.format('YYYY-MM-DD'),
      dueDate: formData.scheduledDate.format('YYYY-MM-DD'),
      status: 'SCHEDULED',
      completedDate: null,
      score: null,
    };
    setInspections([newInspection, ...inspections]);
  };

  const handleStartInspection = (inspection) => {
    navigate(`/safety/inspections/${inspection.id}?start=true`);
    handleMenuClose();
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setInspections(mockInspections);
      setLoading(false);
    }, 500);
  };

  // Stats
  const stats = useMemo(() => ({
    total: inspections.length,
    scheduled: inspections.filter(i => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status)).length,
    completed: inspections.filter(i => i.status === 'COMPLETED').length,
    overdue: inspections.filter(i => i.status === 'OVERDUE').length,
    avgScore: Math.round(inspections.filter(i => i.score !== null).reduce((sum, i) => sum + i.score, 0) / inspections.filter(i => i.score !== null).length) || 0,
  }), [inspections]);

  // Upcoming inspections for cards view
  const upcomingInspections = useMemo(() => 
    inspections.filter(i => ['SCHEDULED', 'OVERDUE'].includes(i.status)).slice(0, 6),
  [inspections]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={() => navigate('/safety')} size="small">
              <BackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700}>
              Inspections
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
            Schedule and track safety inspections
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setScheduleDialogOpen(true)}
          >
            Schedule Inspection
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="text.primary">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">Total</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">{stats.scheduled}</Typography>
            <Typography variant="body2" color="text.secondary">Scheduled</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">{stats.completed}</Typography>
            <Typography variant="body2" color="text.secondary">Completed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">{stats.overdue}</Typography>
            <Typography variant="body2" color="text.secondary">Overdue</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">{stats.avgScore}%</Typography>
            <Typography variant="body2" color="text.secondary">Avg Score</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Upcoming Inspections Cards */}
      {upcomingInspections.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Upcoming & Overdue</Typography>
          <Grid container spacing={2}>
            {upcomingInspections.map((inspection) => (
              <Grid item xs={12} sm={6} md={4} key={inspection.id}>
                <Card variant="outlined" sx={{ 
                  borderColor: inspection.status === 'OVERDUE' ? 'error.main' : 'divider',
                  bgcolor: inspection.status === 'OVERDUE' ? 'error.50' : 'background.paper',
                }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ bgcolor: `${getTypeColor(inspection.type)}.light`, width: 36, height: 36 }}>
                          {getTypeIcon(inspection.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{inspection.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{inspection.id}</Typography>
                        </Box>
                      </Stack>
                      <Chip 
                        label={inspection.status} 
                        size="small" 
                        color={getStatusColor(inspection.status)}
                      />
                    </Stack>
                    
                    <Stack spacing={0.5} sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Equipment:</strong> {inspection.equipment}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Location:</strong> {inspection.location}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Assignee:</strong> {inspection.assignee}
                      </Typography>
                      <Typography variant="body2" color={inspection.status === 'OVERDUE' ? 'error' : 'text.secondary'}>
                        <strong>Due:</strong> {inspection.dueDate}
                      </Typography>
                    </Stack>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<StartIcon />}
                      onClick={() => handleStartInspection(inspection)}
                      color={inspection.status === 'OVERDUE' ? 'error' : 'primary'}
                    >
                      Start Inspection
                    </Button>
                    <Button size="small" onClick={() => navigate(`/safety/inspections/${inspection.id}`)}>
                      View
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Filters & Table */}
      <Paper>
        {/* Tabs */}
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`All (${inspections.length})`} />
          <Tab label={`Scheduled (${stats.scheduled})`} />
          <Tab label={`Completed (${stats.completed})`} />
          <Tab label={`Overdue (${stats.overdue})`} />
        </Tabs>

        {/* Search & Filters */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search inspections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {inspectionTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    {statusOptions.map(status => (
                      <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'id'}
                    direction={orderBy === 'id' ? order : 'asc'}
                    onClick={() => handleSort('id')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>Type</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'equipment'}
                    direction={orderBy === 'equipment' ? order : 'asc'}
                    onClick={() => handleSort('equipment')}
                  >
                    Equipment / Area
                  </TableSortLabel>
                </TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'scheduledDate'}
                    direction={orderBy === 'scheduledDate' ? order : 'asc'}
                    onClick={() => handleSort('scheduledDate')}
                  >
                    Scheduled
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Score</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInspections
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((inspection) => (
                  <TableRow
                    key={inspection.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/safety/inspections/${inspection.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {inspection.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(inspection.type)}
                        label={inspection.type.replace(/_/g, ' ')}
                        size="small"
                        color={getTypeColor(inspection.type)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{inspection.equipment}</TableCell>
                    <TableCell>{inspection.location}</TableCell>
                    <TableCell>{inspection.assignee}</TableCell>
                    <TableCell>{inspection.scheduledDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={inspection.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(inspection.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {inspection.score !== null ? (
                        <Chip
                          label={`${inspection.score}%`}
                          size="small"
                          color={getScoreColor(inspection.score)}
                          variant="outlined"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, inspection)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredInspections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No inspections found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredInspections.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/safety/inspections/${selectedInspection?.id}`); handleMenuClose(); }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        {selectedInspection?.status !== 'COMPLETED' && (
          <MenuItem onClick={() => handleStartInspection(selectedInspection)}>
            <StartIcon fontSize="small" sx={{ mr: 1 }} /> Start Inspection
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        {selectedInspection?.status === 'COMPLETED' && (
          <MenuItem onClick={handleMenuClose}>
            <DownloadIcon fontSize="small" sx={{ mr: 1 }} /> Download Report
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Cancel
        </MenuItem>
      </Menu>

      {/* Schedule Inspection Dialog */}
      <ScheduleInspectionDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        onSubmit={handleScheduleInspection}
      />
    </Box>
  );
}
