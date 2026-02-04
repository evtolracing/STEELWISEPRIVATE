/**
 * Permits Page
 * Manage safety permits (LOTO, Hot Work, Confined Space, etc.)
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
  Alert,
  Menu,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  VerifiedUser as PermitIcon,
  Lock as LotoIcon,
  Whatshot as HotWorkIcon,
  Air as ConfinedSpaceIcon,
  Height as HeightIcon,
  Construction as ExcavationIcon,
  ElectricalServices as ElectricalIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Check as ApproveIcon,
  Cancel as RejectIcon,
  ArrowBack as BackIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Mock data
const mockPermits = [
  { id: 'LOTO-2026-0089', type: 'LOTO', title: 'Shear Line #2 Maintenance', equipment: 'Shear Line #2', equipmentId: 'EQ-SL-002', location: 'Production Floor', requestedBy: 'Tom Brown', requestedDate: '2026-02-03 08:00', issuedTo: 'Maintenance Team', validFrom: '2026-02-03 09:00', validUntil: '2026-02-03 17:00', status: 'ACTIVE', approvedBy: 'Sarah Williams', approvedDate: '2026-02-03 08:30' },
  { id: 'HW-2026-0034', type: 'HOT_WORK', title: 'Welding repair on conveyor frame', equipment: 'Conveyor C-12', equipmentId: 'EQ-CV-012', location: 'Maintenance Shop', requestedBy: 'Mike Johnson', requestedDate: '2026-02-03 07:00', issuedTo: 'Welding Team', validFrom: '2026-02-03 10:00', validUntil: '2026-02-03 14:00', status: 'ACTIVE', approvedBy: 'Safety Manager', approvedDate: '2026-02-03 09:00' },
  { id: 'LOTO-2026-0088', type: 'LOTO', title: 'Press brake hydraulic repair', equipment: 'Press Brake #3', equipmentId: 'EQ-PB-003', location: 'Fabrication', requestedBy: 'Chris Wilson', requestedDate: '2026-02-02 14:00', issuedTo: 'Chris Wilson', validFrom: '2026-02-02 15:00', validUntil: '2026-02-02 18:00', status: 'CLOSED', approvedBy: 'Operations Manager', approvedDate: '2026-02-02 14:30', closedDate: '2026-02-02 17:45' },
  { id: 'CS-2026-0012', type: 'CONFINED_SPACE', title: 'Tank inspection and cleaning', equipment: 'Storage Tank T-5', equipmentId: 'EQ-TK-005', location: 'Tank Farm', requestedBy: 'Lisa Davis', requestedDate: '2026-02-04 06:00', issuedTo: 'Inspection Team', validFrom: '2026-02-04 08:00', validUntil: '2026-02-04 12:00', status: 'PENDING', approvedBy: null, approvedDate: null },
  { id: 'HW-2026-0033', type: 'HOT_WORK', title: 'Cutting operations for rack modification', equipment: 'Storage Rack R-15', equipmentId: 'EQ-RK-015', location: 'Warehouse B', requestedBy: 'David Lee', requestedDate: '2026-02-01 10:00', issuedTo: 'Fabrication Team', validFrom: '2026-02-01 13:00', validUntil: '2026-02-01 17:00', status: 'CLOSED', approvedBy: 'Safety Manager', approvedDate: '2026-02-01 12:00', closedDate: '2026-02-01 16:30' },
  { id: 'ELEC-2026-0008', type: 'ELECTRICAL', title: 'Panel upgrade MCC-4', equipment: 'MCC Panel 4', equipmentId: 'EQ-MC-004', location: 'Electrical Room A', requestedBy: 'Amy Chen', requestedDate: '2026-02-05 07:00', issuedTo: 'Electrical Contractors', validFrom: '2026-02-05 08:00', validUntil: '2026-02-05 18:00', status: 'PENDING', approvedBy: null, approvedDate: null },
  { id: 'HGT-2026-0005', type: 'HEIGHT', title: 'Roof HVAC unit inspection', equipment: 'HVAC Unit 3', equipmentId: 'EQ-HV-003', location: 'Building A Roof', requestedBy: 'Mark Taylor', requestedDate: '2026-02-03 11:00', issuedTo: 'HVAC Team', validFrom: '2026-02-03 13:00', validUntil: '2026-02-03 16:00', status: 'PENDING', approvedBy: null, approvedDate: null },
];

const permitTypes = [
  { value: 'LOTO', label: 'LOTO (Lockout/Tagout)', icon: LotoIcon, color: 'warning' },
  { value: 'HOT_WORK', label: 'Hot Work', icon: HotWorkIcon, color: 'error' },
  { value: 'CONFINED_SPACE', label: 'Confined Space', icon: ConfinedSpaceIcon, color: 'info' },
  { value: 'HEIGHT', label: 'Work at Height', icon: HeightIcon, color: 'primary' },
  { value: 'EXCAVATION', label: 'Excavation', icon: ExcavationIcon, color: 'secondary' },
  { value: 'ELECTRICAL', label: 'Electrical Work', icon: ElectricalIcon, color: 'warning' },
];

const statusOptions = [
  { value: 'PENDING', label: 'Pending Approval', color: 'warning' },
  { value: 'APPROVED', label: 'Approved', color: 'info' },
  { value: 'ACTIVE', label: 'Active', color: 'success' },
  { value: 'EXPIRED', label: 'Expired', color: 'error' },
  { value: 'CLOSED', label: 'Closed', color: 'default' },
  { value: 'REJECTED', label: 'Rejected', color: 'error' },
];

function getTypeIcon(type) {
  const typeObj = permitTypes.find(t => t.value === type);
  const IconComponent = typeObj?.icon || PermitIcon;
  return <IconComponent fontSize="small" />;
}

function getTypeColor(type) {
  const typeObj = permitTypes.find(t => t.value === type);
  return typeObj?.color || 'default';
}

function getStatusColor(status) {
  const statusObj = statusOptions.find(s => s.value === status);
  return statusObj?.color || 'default';
}

// Request Permit Dialog
function RequestPermitDialog({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    equipment: '',
    location: '',
    description: '',
    validFrom: dayjs().add(1, 'hour'),
    validUntil: dayjs().add(9, 'hour'),
    workers: '',
    hazards: '',
    precautions: '',
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
    setFormData({
      type: '',
      title: '',
      equipment: '',
      location: '',
      description: '',
      validFrom: dayjs().add(1, 'hour'),
      validUntil: dayjs().add(9, 'hour'),
      workers: '',
      hazards: '',
      precautions: '',
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Request Permit</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Permit Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Permit Type"
                  onChange={handleChange('type')}
                >
                  {permitTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Title"
                value={formData.title}
                onChange={handleChange('title')}
                placeholder="Brief description of work"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Equipment / Asset"
                value={formData.equipment}
                onChange={handleChange('equipment')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Location"
                value={formData.location}
                onChange={handleChange('location')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Work Description"
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Detailed description of work to be performed..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Valid From"
                value={formData.validFrom}
                onChange={(newValue) => setFormData({ ...formData, validFrom: newValue })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Valid Until"
                value={formData.validUntil}
                onChange={(newValue) => setFormData({ ...formData, validUntil: newValue })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Workers Involved"
                value={formData.workers}
                onChange={handleChange('workers')}
                placeholder="Names of all personnel who will be working under this permit"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Identified Hazards"
                value={formData.hazards}
                onChange={handleChange('hazards')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Safety Precautions"
                value={formData.precautions}
                onChange={handleChange('precautions')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.type || !formData.title || !formData.equipment || !formData.location}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default function PermitsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [permits, setPermits] = useState(mockPermits);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('validFrom');
  const [order, setOrder] = useState('asc');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Check for ?new=true to open dialog
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setRequestDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Filter and sort data
  const filteredPermits = useMemo(() => {
    let result = [...permits];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(query) ||
          p.title.toLowerCase().includes(query) ||
          p.equipment.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query) ||
          p.requestedBy.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.type !== 'all') {
      result = result.filter((p) => p.type === filters.type);
    }
    if (filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status);
    }

    // Apply tab filter
    if (tabValue === 1) { // Active
      result = result.filter((p) => p.status === 'ACTIVE');
    } else if (tabValue === 2) { // Pending
      result = result.filter((p) => p.status === 'PENDING');
    } else if (tabValue === 3) { // Closed
      result = result.filter((p) => ['CLOSED', 'EXPIRED', 'REJECTED'].includes(p.status));
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
  }, [permits, searchQuery, filters, orderBy, order, tabValue]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleMenuClick = (event, permit) => {
    setAnchorEl(event.currentTarget);
    setSelectedPermit(permit);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPermit(null);
  };

  const handleRequestPermit = (formData) => {
    const typePrefix = formData.type === 'LOTO' ? 'LOTO' : 
                       formData.type === 'HOT_WORK' ? 'HW' :
                       formData.type === 'CONFINED_SPACE' ? 'CS' :
                       formData.type === 'ELECTRICAL' ? 'ELEC' :
                       formData.type === 'HEIGHT' ? 'HGT' : 'PRM';
    const newPermit = {
      id: `${typePrefix}-2026-${String(permits.length + 90).padStart(4, '0')}`,
      type: formData.type,
      title: formData.title,
      equipment: formData.equipment,
      equipmentId: 'EQ-NEW-001',
      location: formData.location,
      requestedBy: 'Current User',
      requestedDate: dayjs().format('YYYY-MM-DD HH:mm'),
      issuedTo: formData.workers,
      validFrom: formData.validFrom.format('YYYY-MM-DD HH:mm'),
      validUntil: formData.validUntil.format('YYYY-MM-DD HH:mm'),
      status: 'PENDING',
      approvedBy: null,
      approvedDate: null,
    };
    setPermits([newPermit, ...permits]);
  };

  const handleApprove = (permit) => {
    const updated = permits.map(p => 
      p.id === permit.id 
        ? { ...p, status: 'APPROVED', approvedBy: 'Current User', approvedDate: dayjs().format('YYYY-MM-DD HH:mm') }
        : p
    );
    setPermits(updated);
    handleMenuClose();
  };

  const handleClosePermit = (permit) => {
    const updated = permits.map(p => 
      p.id === permit.id 
        ? { ...p, status: 'CLOSED', closedDate: dayjs().format('YYYY-MM-DD HH:mm') }
        : p
    );
    setPermits(updated);
    handleMenuClose();
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setPermits(mockPermits);
      setLoading(false);
    }, 500);
  };

  // Stats
  const stats = useMemo(() => ({
    total: permits.length,
    active: permits.filter(p => p.status === 'ACTIVE').length,
    pending: permits.filter(p => p.status === 'PENDING').length,
    closed: permits.filter(p => ['CLOSED', 'EXPIRED', 'REJECTED'].includes(p.status)).length,
  }), [permits]);

  // Active permits for cards
  const activePermits = useMemo(() => 
    permits.filter(p => p.status === 'ACTIVE'),
  [permits]);

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
              Permits
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
            Manage safety work permits (LOTO, Hot Work, Confined Space, etc.)
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
            onClick={() => setRequestDialogOpen(true)}
          >
            Request Permit
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="text.primary">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">Total</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">{stats.active}</Typography>
            <Typography variant="body2" color="text.secondary">Active</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
            <Typography variant="body2" color="text.secondary">Pending Approval</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="text.secondary">{stats.closed}</Typography>
            <Typography variant="body2" color="text.secondary">Closed</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Active Permits Alert */}
      {activePermits.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" icon={<WarningIcon />}>
            <strong>{activePermits.length} Active Permit(s)</strong> - Ensure all safety precautions are in place and permits are closed when work is complete.
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {activePermits.map((permit) => (
              <Grid item xs={12} sm={6} md={4} key={permit.id}>
                <Card variant="outlined" sx={{ borderColor: 'success.main', borderWidth: 2 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ bgcolor: `${getTypeColor(permit.type)}.light`, width: 40, height: 40 }}>
                          {getTypeIcon(permit.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{permit.id}</Typography>
                          <Chip label="ACTIVE" size="small" color="success" />
                        </Box>
                      </Stack>
                    </Stack>
                    
                    <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 500 }}>
                      {permit.title}
                    </Typography>
                    
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Equipment:</strong> {permit.equipment}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Location:</strong> {permit.location}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Issued To:</strong> {permit.issuedTo}
                      </Typography>
                      <Typography variant="caption" color="warning.main">
                        <TimeIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} /> Valid until {permit.validUntil}
                      </Typography>
                    </Stack>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/safety/permits/${permit.id}`)}>
                      View
                    </Button>
                    <Button size="small" color="error" onClick={() => handleClosePermit(permit)}>
                      Close Permit
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
          <Tab label={`All (${permits.length})`} />
          <Tab label={`Active (${stats.active})`} />
          <Tab label={`Pending (${stats.pending})`} />
          <Tab label={`Closed (${stats.closed})`} />
        </Tabs>

        {/* Search & Filters */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search permits..."
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
                    {permitTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
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
                    Permit ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>Type</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'title'}
                    direction={orderBy === 'title' ? order : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>Equipment / Location</TableCell>
                <TableCell>Issued To</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'validFrom'}
                    direction={orderBy === 'validFrom' ? order : 'asc'}
                    onClick={() => handleSort('validFrom')}
                  >
                    Valid Period
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPermits
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((permit) => (
                  <TableRow
                    key={permit.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/safety/permits/${permit.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {permit.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(permit.type)}
                        label={permit.type.replace('_', ' ')}
                        size="small"
                        color={getTypeColor(permit.type)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {permit.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{permit.equipment}</Typography>
                      <Typography variant="caption" color="text.secondary">{permit.location}</Typography>
                    </TableCell>
                    <TableCell>{permit.issuedTo}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{permit.validFrom}</Typography>
                      <Typography variant="caption" color="text.secondary">to {permit.validUntil}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={permit.status}
                        size="small"
                        color={getStatusColor(permit.status)}
                      />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, permit)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredPermits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No permits found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredPermits.length}
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
        <MenuItem onClick={() => { navigate(`/safety/permits/${selectedPermit?.id}`); handleMenuClose(); }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        {selectedPermit?.status === 'PENDING' && (
          <>
            <MenuItem onClick={() => handleApprove(selectedPermit)}>
              <ApproveIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} /> Approve
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
              <RejectIcon fontSize="small" sx={{ mr: 1 }} /> Reject
            </MenuItem>
          </>
        )}
        {selectedPermit?.status === 'ACTIVE' && (
          <MenuItem onClick={() => handleClosePermit(selectedPermit)}>
            <CloseIcon fontSize="small" sx={{ mr: 1 }} /> Close Permit
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          <PrintIcon fontSize="small" sx={{ mr: 1 }} /> Print
        </MenuItem>
      </Menu>

      {/* Request Permit Dialog */}
      <RequestPermitDialog
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
        onSubmit={handleRequestPermit}
      />
    </Box>
  );
}
