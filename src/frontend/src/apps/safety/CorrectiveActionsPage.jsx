/**
 * Corrective Actions (CAPA) Page
 * Track corrective and preventive actions from incidents, inspections, and audits
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Build as CAPAIcon,
  Warning as IncidentIcon,
  Assignment as InspectionIcon,
  VerifiedUser as AuditIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Error as OverdueIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  Flag as PriorityIcon,
  Person as PersonIcon,
  Link as LinkIcon,
  PlayArrow as StartIcon,
  Done as VerifyIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Mock data
const mockCAPAs = [
  { id: 'CAPA-2026-0021', title: 'Implement dual verification for load calculations', type: 'CORRECTIVE', source: 'INCIDENT', sourceId: 'INC-2026-0043', priority: 'HIGH', status: 'IN_PROGRESS', assignee: 'Operations Manager', dueDate: '2026-02-15', createdDate: '2026-01-28', progress: 60, description: 'Implement mandatory two-person verification for crane load center of gravity calculations before any lift operation.' },
  { id: 'CAPA-2026-0022', title: 'Update pre-lift inspection checklist', type: 'CORRECTIVE', source: 'INCIDENT', sourceId: 'INC-2026-0043', priority: 'MEDIUM', status: 'COMPLETED', assignee: 'Safety Team', dueDate: '2026-02-01', createdDate: '2026-01-28', completedDate: '2026-01-30', progress: 100, description: 'Add explicit balance verification step to pre-lift checklist.' },
  { id: 'CAPA-2026-0023', title: 'Post-maintenance verification procedure', type: 'PREVENTIVE', source: 'INCIDENT', sourceId: 'INC-2026-0043', priority: 'MEDIUM', status: 'NOT_STARTED', assignee: 'Maintenance Manager', dueDate: '2026-02-20', createdDate: '2026-01-28', progress: 0, description: 'Create procedure requiring verification lift after any rigging equipment maintenance.' },
  { id: 'CAPA-2026-0020', title: 'Install additional aisle mirrors in warehouse', type: 'PREVENTIVE', source: 'INCIDENT', sourceId: 'INC-2026-0045', priority: 'MEDIUM', status: 'IN_PROGRESS', assignee: 'Warehouse Supervisor', dueDate: '2026-02-10', createdDate: '2026-02-02', progress: 30, description: 'Install convex mirrors at blind corners in aisles 3, 4, and 5 to improve forklift visibility.' },
  { id: 'CAPA-2026-0019', title: 'Replace worn floor markings in production area', type: 'CORRECTIVE', source: 'INSPECTION', sourceId: 'INS-2026-0115', priority: 'LOW', status: 'IN_PROGRESS', assignee: 'Facilities', dueDate: '2026-02-28', createdDate: '2026-01-20', progress: 75, description: 'Repaint pedestrian walkway markings and equipment zones in production floor.' },
  { id: 'CAPA-2026-0018', title: 'Install machine guarding on lathe #4', type: 'CORRECTIVE', source: 'INSPECTION', sourceId: 'INS-2026-0110', priority: 'HIGH', status: 'OVERDUE', assignee: 'Maintenance Team', dueDate: '2026-01-28', createdDate: '2026-01-15', progress: 40, description: 'Install splash guard and chip guard on lathe #4. Equipment currently tagged out until completion.' },
  { id: 'CAPA-2026-0017', title: 'Update emergency evacuation map', type: 'CORRECTIVE', source: 'AUDIT', sourceId: 'AUD-2026-0005', priority: 'LOW', status: 'COMPLETED', assignee: 'Safety Team', dueDate: '2026-01-25', createdDate: '2026-01-10', completedDate: '2026-01-24', progress: 100, description: 'Update evacuation maps to reflect recent layout changes in warehouse B.' },
  { id: 'CAPA-2026-0016', title: 'Conduct forklift refresher training', type: 'PREVENTIVE', source: 'OBSERVATION', sourceId: 'OBS-2026-0095', priority: 'MEDIUM', status: 'COMPLETED', assignee: 'Training Coordinator', dueDate: '2026-01-31', createdDate: '2026-01-05', completedDate: '2026-01-29', progress: 100, description: 'Schedule and complete forklift safety refresher training for all warehouse operators.' },
];

const capaTypes = [
  { value: 'CORRECTIVE', label: 'Corrective', color: 'error' },
  { value: 'PREVENTIVE', label: 'Preventive', color: 'info' },
];

const sourceTypes = [
  { value: 'INCIDENT', label: 'Incident', icon: IncidentIcon, color: 'warning' },
  { value: 'INSPECTION', label: 'Inspection', icon: InspectionIcon, color: 'info' },
  { value: 'AUDIT', label: 'Audit', icon: AuditIcon, color: 'primary' },
  { value: 'OBSERVATION', label: 'Observation', icon: ViewIcon, color: 'success' },
  { value: 'OTHER', label: 'Other', icon: CAPAIcon, color: 'default' },
];

const priorityLevels = [
  { value: 'CRITICAL', label: 'Critical', color: 'error' },
  { value: 'HIGH', label: 'High', color: 'error' },
  { value: 'MEDIUM', label: 'Medium', color: 'warning' },
  { value: 'LOW', label: 'Low', color: 'info' },
];

const statusOptions = [
  { value: 'NOT_STARTED', label: 'Not Started', color: 'default' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'primary' },
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification', color: 'warning' },
  { value: 'COMPLETED', label: 'Completed', color: 'success' },
  { value: 'OVERDUE', label: 'Overdue', color: 'error' },
];

function getTypeColor(type) {
  const typeObj = capaTypes.find(t => t.value === type);
  return typeObj?.color || 'default';
}

function getSourceIcon(source) {
  const sourceObj = sourceTypes.find(s => s.value === source);
  const IconComponent = sourceObj?.icon || CAPAIcon;
  return <IconComponent fontSize="small" />;
}

function getSourceColor(source) {
  const sourceObj = sourceTypes.find(s => s.value === source);
  return sourceObj?.color || 'default';
}

function getPriorityColor(priority) {
  const priorityObj = priorityLevels.find(p => p.value === priority);
  return priorityObj?.color || 'default';
}

function getStatusColor(status) {
  const statusObj = statusOptions.find(s => s.value === status);
  return statusObj?.color || 'default';
}

// Create CAPA Dialog
function CreateCAPADialog({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: 'CORRECTIVE',
    source: 'INCIDENT',
    sourceId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignee: '',
    dueDate: dayjs().add(14, 'day'),
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
    setFormData({
      type: 'CORRECTIVE',
      source: 'INCIDENT',
      sourceId: '',
      title: '',
      description: '',
      priority: 'MEDIUM',
      assignee: '',
      dueDate: dayjs().add(14, 'day'),
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Create CAPA</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={handleChange('type')}
                >
                  {capaTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label} Action</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={handleChange('priority')}
                >
                  {priorityLevels.map(p => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Source</InputLabel>
                <Select
                  value={formData.source}
                  label="Source"
                  onChange={handleChange('source')}
                >
                  {sourceTypes.map(s => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Source Reference ID"
                value={formData.sourceId}
                onChange={handleChange('sourceId')}
                placeholder="e.g., INC-2026-0045"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Title"
                value={formData.title}
                onChange={handleChange('title')}
                placeholder="Brief description of the corrective/preventive action"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Detailed description of what needs to be done..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Assignee"
                value={formData.assignee}
                onChange={handleChange('assignee')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={(newValue) => setFormData({ ...formData, dueDate: newValue })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.title || !formData.description || !formData.assignee}
          >
            Create CAPA
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default function CorrectiveActionsPage() {
  const navigate = useNavigate();
  
  const [capas, setCAPAs] = useState(mockCAPAs);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    source: 'all',
    priority: 'all',
    status: 'all',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('dueDate');
  const [order, setOrder] = useState('asc');
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCAPA, setSelectedCAPA] = useState(null);

  // Filter and sort data
  const filteredCAPAs = useMemo(() => {
    let result = [...capas];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.id.toLowerCase().includes(query) ||
          c.title.toLowerCase().includes(query) ||
          c.assignee.toLowerCase().includes(query) ||
          c.sourceId.toLowerCase().includes(query)
      );
    }

    if (filters.type !== 'all') {
      result = result.filter((c) => c.type === filters.type);
    }
    if (filters.source !== 'all') {
      result = result.filter((c) => c.source === filters.source);
    }
    if (filters.priority !== 'all') {
      result = result.filter((c) => c.priority === filters.priority);
    }
    if (filters.status !== 'all') {
      result = result.filter((c) => c.status === filters.status);
    }

    // Tab filter
    if (tabValue === 1) { // Open
      result = result.filter((c) => !['COMPLETED'].includes(c.status));
    } else if (tabValue === 2) { // Overdue
      result = result.filter((c) => c.status === 'OVERDUE');
    } else if (tabValue === 3) { // Completed
      result = result.filter((c) => c.status === 'COMPLETED');
    }

    // Sort
    result.sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (order === 'asc') {
        return aValue < bValue ? -1 : 1;
      }
      return aValue > bValue ? -1 : 1;
    });

    return result;
  }, [capas, searchQuery, filters, orderBy, order, tabValue]);

  // Stats
  const stats = useMemo(() => ({
    total: capas.length,
    open: capas.filter(c => !['COMPLETED'].includes(c.status)).length,
    overdue: capas.filter(c => c.status === 'OVERDUE').length,
    completed: capas.filter(c => c.status === 'COMPLETED').length,
    corrective: capas.filter(c => c.type === 'CORRECTIVE').length,
    preventive: capas.filter(c => c.type === 'PREVENTIVE').length,
  }), [capas]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleMenuClick = (event, capa) => {
    setAnchorEl(event.currentTarget);
    setSelectedCAPA(capa);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCAPA(null);
  };

  const handleCreateCAPA = (formData) => {
    const newCAPA = {
      id: `CAPA-2026-${String(capas.length + 24).padStart(4, '0')}`,
      ...formData,
      dueDate: formData.dueDate.format('YYYY-MM-DD'),
      createdDate: dayjs().format('YYYY-MM-DD'),
      status: 'NOT_STARTED',
      progress: 0,
    };
    setCAPAs([newCAPA, ...capas]);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setCAPAs(mockCAPAs);
      setLoading(false);
    }, 500);
  };

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
              Corrective Actions (CAPA)
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
            Track corrective and preventive actions
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
            onClick={() => setCreateDialogOpen(true)}
          >
            Create CAPA
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="text.primary">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">Total</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">{stats.open}</Typography>
            <Typography variant="body2" color="text.secondary">Open</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">{stats.overdue}</Typography>
            <Typography variant="body2" color="text.secondary">Overdue</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">{stats.completed}</Typography>
            <Typography variant="body2" color="text.secondary">Completed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">{stats.corrective}</Typography>
            <Typography variant="body2" color="text.secondary">Corrective</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">{stats.preventive}</Typography>
            <Typography variant="body2" color="text.secondary">Preventive</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>{stats.overdue} CAPA(s) are overdue!</strong> These require immediate attention.
        </Alert>
      )}

      {/* Filters & Table */}
      <Paper>
        {/* Tabs */}
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`All (${capas.length})`} />
          <Tab label={`Open (${stats.open})`} />
          <Tab label={`Overdue (${stats.overdue})`} />
          <Tab label={`Completed (${stats.completed})`} />
        </Tabs>

        {/* Search & Filters */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search CAPAs..."
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
            <Grid item xs={12} md={9}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {capaTypes.map(t => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Source</InputLabel>
                  <Select
                    value={filters.source}
                    label="Source"
                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                  >
                    <MenuItem value="all">All Sources</MenuItem>
                    {sourceTypes.map(s => (
                      <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    label="Priority"
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    {priorityLevels.map(p => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    {statusOptions.map(s => (
                      <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
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
                    CAPA ID
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
                <TableCell>Source</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'dueDate'}
                    direction={orderBy === 'dueDate' ? order : 'asc'}
                    onClick={() => handleSort('dueDate')}
                  >
                    Due Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCAPAs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((capa) => (
                  <TableRow key={capa.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {capa.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={capa.type}
                        size="small"
                        color={getTypeColor(capa.type)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {capa.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getSourceIcon(capa.source)}
                        label={capa.sourceId}
                        size="small"
                        variant="outlined"
                        color={getSourceColor(capa.source)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={capa.priority}
                        size="small"
                        color={getPriorityColor(capa.priority)}
                      />
                    </TableCell>
                    <TableCell>{capa.assignee}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={capa.status === 'OVERDUE' ? 'error' : 'text.primary'}
                        fontWeight={capa.status === 'OVERDUE' ? 600 : 400}
                      >
                        {capa.dueDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={capa.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(capa.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={capa.progress}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                          color={capa.progress === 100 ? 'success' : 'primary'}
                        />
                        <Typography variant="caption">{capa.progress}%</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, capa)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredCAPAs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No CAPAs found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredCAPAs.length}
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
        <MenuItem onClick={handleMenuClose}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        {selectedCAPA?.status === 'NOT_STARTED' && (
          <MenuItem onClick={handleMenuClose}>
            <StartIcon fontSize="small" sx={{ mr: 1 }} /> Start Work
          </MenuItem>
        )}
        {selectedCAPA?.status === 'IN_PROGRESS' && (
          <MenuItem onClick={handleMenuClose}>
            <VerifyIcon fontSize="small" sx={{ mr: 1 }} /> Mark Complete
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <LinkIcon fontSize="small" sx={{ mr: 1 }} /> View Source
        </MenuItem>
      </Menu>

      {/* Create CAPA Dialog */}
      <CreateCAPADialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateCAPA}
      />
    </Box>
  );
}
