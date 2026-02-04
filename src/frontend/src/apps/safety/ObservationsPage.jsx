/**
 * Observations Page
 * Log and track safety observations (positive and at-risk behaviors)
 */

import { useState, useMemo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ObservationIcon,
  ThumbUp as PositiveIcon,
  Warning as AtRiskIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Mock data
const mockObservations = [
  { id: 'OBS-2026-0125', type: 'POSITIVE', category: 'PPE', description: 'Employee consistently wearing all required PPE while operating grinding equipment', location: 'Fabrication Shop', observedEmployee: 'Mike Johnson', observedBy: 'Sarah Williams', date: '2026-02-03', feedback: 'RECOGNIZED', notes: 'Great job setting a positive example!' },
  { id: 'OBS-2026-0124', type: 'AT_RISK', category: 'HOUSEKEEPING', description: 'Tools left on floor creating trip hazard in walkway', location: 'Maintenance Shop', observedEmployee: null, observedBy: 'Tom Brown', date: '2026-02-02', feedback: 'COACHING_GIVEN', notes: 'Discussed importance of 5S with team' },
  { id: 'OBS-2026-0123', type: 'POSITIVE', category: 'LOTO', description: 'Proper lockout/tagout procedure followed for conveyor maintenance', location: 'Production Line 2', observedEmployee: 'Chris Wilson', observedBy: 'Safety Team', date: '2026-02-02', feedback: 'RECOGNIZED', notes: '' },
  { id: 'OBS-2026-0122', type: 'AT_RISK', category: 'ERGONOMICS', description: 'Employee lifting heavy box without using proper technique', location: 'Shipping Dock', observedEmployee: 'David Lee', observedBy: 'Lisa Davis', date: '2026-02-01', feedback: 'COACHING_GIVEN', notes: 'Demonstrated proper lifting technique' },
  { id: 'OBS-2026-0121', type: 'POSITIVE', category: 'MATERIAL_HANDLING', description: 'Forklift operator using horn at intersections and maintaining safe speed', location: 'Warehouse A', observedEmployee: 'Amy Chen', observedBy: 'Warehouse Supervisor', date: '2026-02-01', feedback: 'RECOGNIZED', notes: 'Exemplary safe driving behavior' },
  { id: 'OBS-2026-0120', type: 'AT_RISK', category: 'PPE', description: 'Safety glasses not worn while using bench grinder', location: 'Tool Room', observedEmployee: null, observedBy: 'Mark Taylor', date: '2026-01-31', feedback: 'COACHING_GIVEN', notes: 'Reminded employee of eye protection requirements' },
  { id: 'OBS-2026-0119', type: 'POSITIVE', category: 'COMMUNICATION', description: 'Pre-shift safety briefing conducted before starting hot work', location: 'Maintenance Shop', observedEmployee: 'Welding Team', observedBy: 'Safety Manager', date: '2026-01-31', feedback: 'RECOGNIZED', notes: '' },
  { id: 'OBS-2026-0118', type: 'AT_RISK', category: 'MACHINE_GUARDING', description: 'Operator bypassing light curtain on press brake', location: 'Fabrication', observedEmployee: null, observedBy: 'Quality Inspector', date: '2026-01-30', feedback: 'INVESTIGATION_NEEDED', notes: 'Escalated to supervision - potential serious hazard' },
];

const observationCategories = [
  { value: 'PPE', label: 'PPE Usage' },
  { value: 'HOUSEKEEPING', label: 'Housekeeping/5S' },
  { value: 'LOTO', label: 'Lockout/Tagout' },
  { value: 'ERGONOMICS', label: 'Ergonomics/Body Mechanics' },
  { value: 'MATERIAL_HANDLING', label: 'Material Handling' },
  { value: 'MACHINE_GUARDING', label: 'Machine Guarding' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'HAZARD_RECOGNITION', label: 'Hazard Recognition' },
  { value: 'FALL_PROTECTION', label: 'Fall Protection' },
  { value: 'OTHER', label: 'Other' },
];

const feedbackOptions = [
  { value: 'RECOGNIZED', label: 'Recognized', color: 'success' },
  { value: 'COACHING_GIVEN', label: 'Coaching Given', color: 'info' },
  { value: 'INVESTIGATION_NEEDED', label: 'Investigation Needed', color: 'warning' },
  { value: 'PENDING', label: 'Pending', color: 'default' },
];

function getTypeColor(type) {
  return type === 'POSITIVE' ? 'success' : 'warning';
}

function getFeedbackColor(feedback) {
  const option = feedbackOptions.find(f => f.value === feedback);
  return option?.color || 'default';
}

// New Observation Dialog
function NewObservationDialog({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: 'POSITIVE',
    category: '',
    description: '',
    location: '',
    observedEmployee: '',
    date: dayjs(),
    immediateAction: '',
    notes: '',
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
    setFormData({
      type: 'POSITIVE',
      category: '',
      description: '',
      location: '',
      observedEmployee: '',
      date: dayjs(),
      immediateAction: '',
      notes: '',
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Log Safety Observation</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Observation Type</FormLabel>
                <RadioGroup
                  row
                  value={formData.type}
                  onChange={handleChange('type')}
                >
                  <FormControlLabel
                    value="POSITIVE"
                    control={<Radio color="success" />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <PositiveIcon color="success" fontSize="small" />
                        <span>Positive / Safe Behavior</span>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="AT_RISK"
                    control={<Radio color="warning" />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <AtRiskIcon color="warning" fontSize="small" />
                        <span>At-Risk Behavior</span>
                      </Stack>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={handleChange('category')}
                >
                  {observationCategories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date Observed"
                value={formData.date}
                onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
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
                placeholder="Describe what you observed..."
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee Observed (if known)"
                value={formData.observedEmployee}
                onChange={handleChange('observedEmployee')}
                placeholder="Leave blank for anonymous"
              />
            </Grid>
            {formData.type === 'AT_RISK' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Immediate Action Taken"
                  value={formData.immediateAction}
                  onChange={handleChange('immediateAction')}
                  placeholder="What did you do to address the at-risk behavior?"
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Additional Notes"
                value={formData.notes}
                onChange={handleChange('notes')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            color={formData.type === 'POSITIVE' ? 'success' : 'warning'}
            onClick={handleSubmit}
            disabled={!formData.category || !formData.description || !formData.location}
          >
            Submit Observation
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default function ObservationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [observations, setObservations] = useState(mockObservations);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    feedback: 'all',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  // Check for ?new=true
  useState(() => {
    if (searchParams.get('new') === 'true') {
      setNewDialogOpen(true);
      setSearchParams({});
    }
  });

  // Filter data
  const filteredObservations = useMemo(() => {
    let result = [...observations];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(query) ||
          o.description.toLowerCase().includes(query) ||
          o.location.toLowerCase().includes(query) ||
          (o.observedEmployee && o.observedEmployee.toLowerCase().includes(query))
      );
    }

    if (filters.type !== 'all') {
      result = result.filter((o) => o.type === filters.type);
    }
    if (filters.category !== 'all') {
      result = result.filter((o) => o.category === filters.category);
    }
    if (filters.feedback !== 'all') {
      result = result.filter((o) => o.feedback === filters.feedback);
    }

    // Tab filter
    if (tabValue === 1) { // Positive
      result = result.filter((o) => o.type === 'POSITIVE');
    } else if (tabValue === 2) { // At-Risk
      result = result.filter((o) => o.type === 'AT_RISK');
    }

    return result;
  }, [observations, searchQuery, filters, tabValue]);

  // Stats
  const stats = useMemo(() => {
    const positive = observations.filter(o => o.type === 'POSITIVE').length;
    const atRisk = observations.filter(o => o.type === 'AT_RISK').length;
    return {
      total: observations.length,
      positive,
      atRisk,
      ratio: positive > 0 ? (positive / (positive + atRisk) * 100).toFixed(0) : 0,
      coachingGiven: observations.filter(o => o.feedback === 'COACHING_GIVEN').length,
    };
  }, [observations]);

  const handleNewObservation = (formData) => {
    const newObs = {
      id: `OBS-2026-${String(observations.length + 126).padStart(4, '0')}`,
      type: formData.type,
      category: formData.category,
      description: formData.description,
      location: formData.location,
      observedEmployee: formData.observedEmployee || null,
      observedBy: 'Current User',
      date: formData.date.format('YYYY-MM-DD'),
      feedback: formData.type === 'POSITIVE' ? 'RECOGNIZED' : 'COACHING_GIVEN',
      notes: formData.notes,
    };
    setObservations([newObs, ...observations]);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setObservations(mockObservations);
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
              Safety Observations
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
            Log positive behaviors and at-risk observations
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
            onClick={() => setNewDialogOpen(true)}
          >
            Log Observation
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="text.primary">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">Total Observations</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">{stats.positive}</Typography>
            <Typography variant="body2" color="text.secondary">Positive</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">{stats.atRisk}</Typography>
            <Typography variant="body2" color="text.secondary">At-Risk</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">{stats.ratio}%</Typography>
            <Typography variant="body2" color="text.secondary">Positive Ratio</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters & Table */}
      <Paper>
        {/* Tabs */}
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`All (${observations.length})`} />
          <Tab 
            label={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <PositiveIcon fontSize="small" color="success" />
                <span>Positive ({stats.positive})</span>
              </Stack>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <AtRiskIcon fontSize="small" color="warning" />
                <span>At-Risk ({stats.atRisk})</span>
              </Stack>
            } 
          />
        </Tabs>

        {/* Search & Filters */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search observations..."
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
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {observationCategories.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Feedback</InputLabel>
                  <Select
                    value={filters.feedback}
                    label="Feedback"
                    onChange={(e) => setFilters({ ...filters, feedback: e.target.value })}
                  >
                    <MenuItem value="all">All Feedback</MenuItem>
                    {feedbackOptions.map(f => (
                      <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
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
                <TableCell>ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Feedback</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredObservations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((obs) => (
                  <TableRow key={obs.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {obs.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={obs.type === 'POSITIVE' ? <PositiveIcon /> : <AtRiskIcon />}
                        label={obs.type === 'POSITIVE' ? 'Positive' : 'At-Risk'}
                        size="small"
                        color={getTypeColor(obs.type)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={obs.category.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                        {obs.description}
                      </Typography>
                      {obs.observedEmployee && (
                        <Typography variant="caption" color="text.secondary">
                          Employee: {obs.observedEmployee}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{obs.location}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{obs.date}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {obs.observedBy}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={obs.feedback.replace('_', ' ')}
                        size="small"
                        color={getFeedbackColor(obs.feedback)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              {filteredObservations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No observations found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredObservations.length}
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

      {/* New Observation Dialog */}
      <NewObservationDialog
        open={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
        onSubmit={handleNewObservation}
      />
    </Box>
  );
}
