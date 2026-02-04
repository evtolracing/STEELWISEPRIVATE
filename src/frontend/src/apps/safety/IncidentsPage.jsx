/**
 * Incidents Page
 * List and management of safety incidents
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
  Alert,
  Tooltip,
  Menu,
  Avatar,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  LocalHospital as MedicalIcon,
  ReportProblem as NearMissIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Assignment as InvestigateIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Mock data
const mockIncidents = [
  { id: 'INC-2026-0045', type: 'NEAR_MISS', severity: 'LOW', title: 'Forklift near-miss in aisle 4', description: 'Forklift operator nearly collided with pedestrian in aisle 4', location: 'Warehouse A', reportedBy: 'John Smith', reportedDate: '2026-02-02', status: 'INVESTIGATING', assignee: 'Safety Team' },
  { id: 'INC-2026-0044', type: 'FIRST_AID', severity: 'LOW', title: 'Minor laceration - sheet metal handling', description: 'Employee received minor cut on finger while handling sheet metal', location: 'Production Floor', reportedBy: 'Mike Johnson', reportedDate: '2026-01-28', status: 'CLOSED', assignee: 'Sarah Williams' },
  { id: 'INC-2026-0043', type: 'NEAR_MISS', severity: 'MEDIUM', title: 'Crane load shift during lift', description: 'Load shifted unexpectedly during crane lift operation', location: 'Bay 3', reportedBy: 'Tom Brown', reportedDate: '2026-01-25', status: 'CAPA_ASSIGNED', assignee: 'Operations Manager' },
  { id: 'INC-2026-0042', type: 'RECORDABLE', severity: 'HIGH', title: 'Employee injury - caught between', description: 'Employee hand caught between conveyor rollers', location: 'Production Line 2', reportedBy: 'Lisa Davis', reportedDate: '2026-01-20', status: 'CLOSED', assignee: 'Safety Manager' },
  { id: 'INC-2026-0041', type: 'NEAR_MISS', severity: 'LOW', title: 'Slip hazard identified', description: 'Oil spill in maintenance area created slip hazard', location: 'Maintenance Shop', reportedBy: 'Chris Wilson', reportedDate: '2026-01-18', status: 'CLOSED', assignee: 'Maintenance Team' },
  { id: 'INC-2026-0040', type: 'PROPERTY_DAMAGE', severity: 'MEDIUM', title: 'Forklift struck rack', description: 'Forklift backed into storage rack causing damage', location: 'Warehouse B', reportedBy: 'David Lee', reportedDate: '2026-01-15', status: 'CAPA_ASSIGNED', assignee: 'Warehouse Supervisor' },
  { id: 'INC-2026-0039', type: 'FIRST_AID', severity: 'LOW', title: 'Foreign object in eye', description: 'Metal shaving entered eye during grinding operation', location: 'Finishing Area', reportedBy: 'Amy Chen', reportedDate: '2026-01-12', status: 'CLOSED', assignee: 'Safety Team' },
  { id: 'INC-2026-0038', type: 'ENVIRONMENTAL', severity: 'MEDIUM', title: 'Minor chemical spill', description: 'Small hydraulic fluid leak from equipment', location: 'Production Floor', reportedBy: 'Mark Taylor', reportedDate: '2026-01-10', status: 'CLOSED', assignee: 'Environmental Team' },
];

const incidentTypes = [
  { value: 'NEAR_MISS', label: 'Near Miss', color: 'warning' },
  { value: 'FIRST_AID', label: 'First Aid', color: 'info' },
  { value: 'RECORDABLE', label: 'Recordable', color: 'error' },
  { value: 'LOST_TIME', label: 'Lost Time', color: 'error' },
  { value: 'PROPERTY_DAMAGE', label: 'Property Damage', color: 'secondary' },
  { value: 'ENVIRONMENTAL', label: 'Environmental', color: 'success' },
];

const severityLevels = [
  { value: 'LOW', label: 'Low', color: 'success' },
  { value: 'MEDIUM', label: 'Medium', color: 'warning' },
  { value: 'HIGH', label: 'High', color: 'error' },
  { value: 'CRITICAL', label: 'Critical', color: 'error' },
];

const statusOptions = [
  { value: 'DRAFT', label: 'Draft', color: 'default' },
  { value: 'REPORTED', label: 'Reported', color: 'info' },
  { value: 'INVESTIGATING', label: 'Investigating', color: 'warning' },
  { value: 'CAPA_ASSIGNED', label: 'CAPA Assigned', color: 'primary' },
  { value: 'CLOSED', label: 'Closed', color: 'success' },
];

function getTypeIcon(type) {
  switch (type) {
    case 'NEAR_MISS': return <NearMissIcon fontSize="small" />;
    case 'FIRST_AID': 
    case 'RECORDABLE': 
    case 'LOST_TIME': return <MedicalIcon fontSize="small" />;
    default: return <WarningIcon fontSize="small" />;
  }
}

function getTypeColor(type) {
  const typeObj = incidentTypes.find(t => t.value === type);
  return typeObj?.color || 'default';
}

function getSeverityColor(severity) {
  const severityObj = severityLevels.find(s => s.value === severity);
  return severityObj?.color || 'default';
}

function getStatusColor(status) {
  const statusObj = statusOptions.find(s => s.value === status);
  return statusObj?.color || 'default';
}

// New Incident Dialog
function NewIncidentDialog({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: '',
    severity: '',
    title: '',
    description: '',
    location: '',
    incidentDate: dayjs(),
    immediateActions: '',
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
    setFormData({
      type: '',
      severity: '',
      title: '',
      description: '',
      location: '',
      incidentDate: dayjs(),
      immediateActions: '',
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Report New Incident</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Incident Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Incident Type"
                  onChange={handleChange('type')}
                >
                  {incidentTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  label="Severity"
                  onChange={handleChange('severity')}
                >
                  {severityLevels.map(level => (
                    <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Title"
                value={formData.title}
                onChange={handleChange('title')}
                placeholder="Brief description of the incident"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Location"
                value={formData.location}
                onChange={handleChange('location')}
                placeholder="Where did this occur?"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Incident Date"
                value={formData.incidentDate}
                onChange={(newValue) => setFormData({ ...formData, incidentDate: newValue })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Detailed description of what happened..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Immediate Actions Taken"
                value={formData.immediateActions}
                onChange={handleChange('immediateActions')}
                placeholder="What actions were taken immediately after the incident?"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmit}
            disabled={!formData.type || !formData.severity || !formData.title || !formData.location || !formData.description}
          >
            Report Incident
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default function IncidentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [incidents, setIncidents] = useState(mockIncidents);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
    status: 'all',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('reportedDate');
  const [order, setOrder] = useState('desc');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Check for ?new=true to open dialog
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setNewDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Filter and sort data
  const filteredIncidents = useMemo(() => {
    let result = [...incidents];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (inc) =>
          inc.id.toLowerCase().includes(query) ||
          inc.title.toLowerCase().includes(query) ||
          inc.location.toLowerCase().includes(query) ||
          inc.reportedBy.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.type !== 'all') {
      result = result.filter((inc) => inc.type === filters.type);
    }
    if (filters.severity !== 'all') {
      result = result.filter((inc) => inc.severity === filters.severity);
    }
    if (filters.status !== 'all') {
      result = result.filter((inc) => inc.status === filters.status);
    }

    // Apply tab filter
    if (tabValue === 1) { // Open
      result = result.filter((inc) => !['CLOSED'].includes(inc.status));
    } else if (tabValue === 2) { // Closed
      result = result.filter((inc) => inc.status === 'CLOSED');
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
  }, [incidents, searchQuery, filters, orderBy, order, tabValue]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleMenuClick = (event, incident) => {
    setAnchorEl(event.currentTarget);
    setSelectedIncident(incident);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedIncident(null);
  };

  const handleNewIncident = (formData) => {
    const newIncident = {
      id: `INC-2026-${String(incidents.length + 46).padStart(4, '0')}`,
      ...formData,
      incidentDate: formData.incidentDate.format('YYYY-MM-DD'),
      reportedBy: 'Current User', // Would come from auth context
      reportedDate: dayjs().format('YYYY-MM-DD'),
      status: 'REPORTED',
      assignee: 'Unassigned',
    };
    setIncidents([newIncident, ...incidents]);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setIncidents(mockIncidents);
      setLoading(false);
    }, 500);
  };

  // Stats
  const stats = useMemo(() => ({
    total: incidents.length,
    open: incidents.filter(i => !['CLOSED'].includes(i.status)).length,
    nearMiss: incidents.filter(i => i.type === 'NEAR_MISS').length,
    recordable: incidents.filter(i => ['RECORDABLE', 'LOST_TIME'].includes(i.type)).length,
  }), [incidents]);

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
              Incidents
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
            Report, track, and investigate safety incidents
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
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<AddIcon />}
            onClick={() => setNewDialogOpen(true)}
          >
            Report Incident
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="text.primary">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">Total Incidents</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">{stats.open}</Typography>
            <Typography variant="body2" color="text.secondary">Open</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">{stats.nearMiss}</Typography>
            <Typography variant="body2" color="text.secondary">Near Misses</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">{stats.recordable}</Typography>
            <Typography variant="body2" color="text.secondary">Recordable</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters & Table */}
      <Paper>
        {/* Tabs */}
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`All (${incidents.length})`} />
          <Tab label={`Open (${stats.open})`} />
          <Tab label={`Closed (${incidents.length - stats.open})`} />
        </Tabs>

        {/* Search & Filters */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search incidents..."
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
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {incidentTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filters.severity}
                    label="Severity"
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  >
                    <MenuItem value="all">All Severities</MenuItem>
                    {severityLevels.map(level => (
                      <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
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
                    Incident ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'title'}
                    direction={orderBy === 'title' ? order : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>Location</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'reportedDate'}
                    direction={orderBy === 'reportedDate' ? order : 'asc'}
                    onClick={() => handleSort('reportedDate')}
                  >
                    Reported
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIncidents
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((incident) => (
                  <TableRow
                    key={incident.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/safety/incidents/${incident.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {incident.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(incident.type)}
                        label={incident.type.replace('_', ' ')}
                        size="small"
                        color={getTypeColor(incident.type)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={incident.severity}
                        size="small"
                        color={getSeverityColor(incident.severity)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {incident.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{incident.location}</TableCell>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2">{incident.reportedDate}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {incident.reportedBy}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={incident.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(incident.status)}
                      />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, incident)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredIncidents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No incidents found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredIncidents.length}
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
        <MenuItem onClick={() => { navigate(`/safety/incidents/${selectedIncident?.id}`); handleMenuClose(); }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <InvestigateIcon fontSize="small" sx={{ mr: 1 }} /> Start Investigation
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* New Incident Dialog */}
      <NewIncidentDialog
        open={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
        onSubmit={handleNewIncident}
      />
    </Box>
  );
}
