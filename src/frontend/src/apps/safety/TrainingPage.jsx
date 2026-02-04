/**
 * Training Page
 * Manage safety training assignments, compliance, and records
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  School as TrainingIcon,
  Person as PersonIcon,
  CheckCircle as CompletedIcon,
  Warning as OverdueIcon,
  Schedule as ScheduledIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  Assignment as CourseIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  PlayCircle as StartIcon,
  WorkspacePremium as CertificateIcon,
} from '@mui/icons-material';

// Mock data
const mockTrainingRecords = [
  { id: 'TR-001', employeeId: 'EMP-001', employeeName: 'Mike Johnson', department: 'Warehouse', course: 'Forklift Operator Certification', courseType: 'CERTIFICATION', status: 'CURRENT', completedDate: '2025-08-15', expirationDate: '2026-08-15', score: 95, provider: 'Internal' },
  { id: 'TR-002', employeeId: 'EMP-001', employeeName: 'Mike Johnson', department: 'Warehouse', course: 'LOTO Authorized Person', courseType: 'CERTIFICATION', status: 'CURRENT', completedDate: '2025-06-10', expirationDate: '2026-06-10', score: 100, provider: 'Internal' },
  { id: 'TR-003', employeeId: 'EMP-002', employeeName: 'Sarah Williams', department: 'Safety', course: 'OSHA 30-Hour General Industry', courseType: 'REGULATORY', status: 'CURRENT', completedDate: '2024-03-20', expirationDate: '2029-03-20', score: null, provider: 'OSHA' },
  { id: 'TR-004', employeeId: 'EMP-003', employeeName: 'Tom Brown', department: 'Maintenance', course: 'Crane Operator Certification', courseType: 'CERTIFICATION', status: 'CURRENT', completedDate: '2025-11-05', expirationDate: '2026-11-05', score: 92, provider: 'External - ABC Training' },
  { id: 'TR-005', employeeId: 'EMP-004', employeeName: 'Lisa Davis', department: 'Production', course: 'Hazard Communication (HazCom)', courseType: 'REGULATORY', status: 'DUE_SOON', completedDate: '2025-02-28', expirationDate: '2026-02-28', score: 88, provider: 'Internal' },
  { id: 'TR-006', employeeId: 'EMP-005', employeeName: 'Chris Wilson', department: 'Maintenance', course: 'LOTO Authorized Person', courseType: 'CERTIFICATION', status: 'OVERDUE', completedDate: '2025-01-15', expirationDate: '2026-01-15', score: 85, provider: 'Internal' },
  { id: 'TR-007', employeeId: 'EMP-006', employeeName: 'Amy Chen', department: 'Production', course: 'Fire Extinguisher Use', courseType: 'GENERAL', status: 'CURRENT', completedDate: '2025-12-01', expirationDate: '2026-12-01', score: 100, provider: 'Internal' },
  { id: 'TR-008', employeeId: 'EMP-007', employeeName: 'David Lee', department: 'Warehouse', course: 'Forklift Operator Certification', courseType: 'CERTIFICATION', status: 'OVERDUE', completedDate: '2025-01-10', expirationDate: '2026-01-10', score: 90, provider: 'Internal' },
  { id: 'TR-009', employeeId: 'EMP-008', employeeName: 'Mark Taylor', department: 'Maintenance', course: 'Confined Space Entry', courseType: 'CERTIFICATION', status: 'ASSIGNED', completedDate: null, expirationDate: null, score: null, provider: 'Internal', dueDate: '2026-02-15' },
  { id: 'TR-010', employeeId: 'EMP-009', employeeName: 'Jennifer White', department: 'Quality', course: 'PPE Selection & Use', courseType: 'GENERAL', status: 'IN_PROGRESS', completedDate: null, expirationDate: null, score: null, provider: 'Internal', progress: 60 },
];

const mockCourses = [
  { id: 'CRS-001', name: 'Forklift Operator Certification', type: 'CERTIFICATION', duration: '8 hours', validityPeriod: '1 year', requiredFor: ['Warehouse', 'Shipping'], assignedCount: 25, completedCount: 23 },
  { id: 'CRS-002', name: 'LOTO Authorized Person', type: 'CERTIFICATION', duration: '4 hours', validityPeriod: '1 year', requiredFor: ['Maintenance', 'Production'], assignedCount: 45, completedCount: 42 },
  { id: 'CRS-003', name: 'Crane Operator Certification', type: 'CERTIFICATION', duration: '16 hours', validityPeriod: '1 year', requiredFor: ['Production'], assignedCount: 12, completedCount: 12 },
  { id: 'CRS-004', name: 'Hazard Communication (HazCom)', type: 'REGULATORY', duration: '2 hours', validityPeriod: '1 year', requiredFor: ['All'], assignedCount: 165, completedCount: 158 },
  { id: 'CRS-005', name: 'Fire Extinguisher Use', type: 'GENERAL', duration: '1 hour', validityPeriod: '1 year', requiredFor: ['All'], assignedCount: 165, completedCount: 162 },
  { id: 'CRS-006', name: 'Confined Space Entry', type: 'CERTIFICATION', duration: '8 hours', validityPeriod: '1 year', requiredFor: ['Maintenance'], assignedCount: 15, completedCount: 12 },
];

const courseTypes = [
  { value: 'CERTIFICATION', label: 'Certification', color: 'primary' },
  { value: 'REGULATORY', label: 'Regulatory', color: 'error' },
  { value: 'GENERAL', label: 'General Safety', color: 'info' },
  { value: 'ONBOARDING', label: 'New Hire', color: 'secondary' },
];

const statusOptions = [
  { value: 'CURRENT', label: 'Current', color: 'success' },
  { value: 'DUE_SOON', label: 'Due Soon', color: 'warning' },
  { value: 'OVERDUE', label: 'Overdue', color: 'error' },
  { value: 'ASSIGNED', label: 'Assigned', color: 'info' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'primary' },
];

function getStatusColor(status) {
  const statusObj = statusOptions.find(s => s.value === status);
  return statusObj?.color || 'default';
}

function getCourseTypeColor(type) {
  const typeObj = courseTypes.find(t => t.value === type);
  return typeObj?.color || 'default';
}

export default function TrainingPage() {
  const navigate = useNavigate();
  
  const [records, setRecords] = useState(mockTrainingRecords);
  const [courses, setCourses] = useState(mockCourses);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    courseType: 'all',
    department: 'all',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState('records'); // 'records' or 'courses'
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(query) ||
          r.course.toLowerCase().includes(query) ||
          r.department.toLowerCase().includes(query)
      );
    }

    if (filters.status !== 'all') {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters.courseType !== 'all') {
      result = result.filter((r) => r.courseType === filters.courseType);
    }
    if (filters.department !== 'all') {
      result = result.filter((r) => r.department === filters.department);
    }

    // Apply tab filter
    if (tabValue === 1) { // Overdue
      result = result.filter((r) => r.status === 'OVERDUE');
    } else if (tabValue === 2) { // Due Soon
      result = result.filter((r) => r.status === 'DUE_SOON');
    } else if (tabValue === 3) { // In Progress
      result = result.filter((r) => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status));
    }

    return result;
  }, [records, searchQuery, filters, tabValue]);

  // Stats
  const stats = useMemo(() => ({
    total: records.length,
    current: records.filter(r => r.status === 'CURRENT').length,
    dueSoon: records.filter(r => r.status === 'DUE_SOON').length,
    overdue: records.filter(r => r.status === 'OVERDUE').length,
    inProgress: records.filter(r => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length,
    complianceRate: Math.round((records.filter(r => r.status === 'CURRENT').length / records.length) * 100),
  }), [records]);

  const departments = useMemo(() => 
    [...new Set(records.map(r => r.department))],
  [records]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setRecords(mockTrainingRecords);
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
              Safety Training
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
            Manage training assignments and compliance
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Export Report
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
            startIcon={<AddIcon />}
            onClick={() => setAssignDialogOpen(true)}
          >
            Assign Training
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">{stats.complianceRate}%</Typography>
            <Typography variant="body2" color="text.secondary">Compliance</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">{stats.current}</Typography>
            <Typography variant="body2" color="text.secondary">Current</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">{stats.dueSoon}</Typography>
            <Typography variant="body2" color="text.secondary">Due Soon</Typography>
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
            <Typography variant="h4" color="info.main">{stats.inProgress}</Typography>
            <Typography variant="body2" color="text.secondary">In Progress</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="text.primary">{courses.length}</Typography>
            <Typography variant="body2" color="text.secondary">Courses</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>{stats.overdue} training record(s) are overdue!</strong> Employees with overdue training may not be authorized to perform certain tasks.
        </Alert>
      )}

      {/* View Toggle */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant={viewMode === 'records' ? 'contained' : 'outlined'}
          startIcon={<PersonIcon />}
          onClick={() => setViewMode('records')}
        >
          Employee Records
        </Button>
        <Button
          variant={viewMode === 'courses' ? 'contained' : 'outlined'}
          startIcon={<CourseIcon />}
          onClick={() => setViewMode('courses')}
        >
          Courses
        </Button>
      </Stack>

      {viewMode === 'records' ? (
        /* Employee Records View */
        <Paper>
          {/* Tabs */}
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tab label={`All (${records.length})`} />
            <Tab label={`Overdue (${stats.overdue})`} />
            <Tab label={`Due Soon (${stats.dueSoon})`} />
            <Tab label={`In Progress (${stats.inProgress})`} />
          </Tabs>

          {/* Search & Filters */}
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by employee, course..."
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
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filters.courseType}
                      label="Type"
                      onChange={(e) => setFilters({ ...filters, courseType: e.target.value })}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      {courseTypes.map(t => (
                        <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={filters.department}
                      label="Department"
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    >
                      <MenuItem value="all">All Departments</MenuItem>
                      {departments.map(d => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
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
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            {record.employeeName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{record.employeeName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{record.department}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {record.course}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.courseType}
                          size="small"
                          color={getCourseTypeColor(record.courseType)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(record.status)}
                        />
                      </TableCell>
                      <TableCell>{record.completedDate || '-'}</TableCell>
                      <TableCell>
                        {record.expirationDate ? (
                          <Typography 
                            variant="body2" 
                            color={record.status === 'OVERDUE' ? 'error' : record.status === 'DUE_SOON' ? 'warning.main' : 'text.primary'}
                          >
                            {record.expirationDate}
                          </Typography>
                        ) : record.dueDate ? (
                          <Typography variant="body2" color="info.main">
                            Due: {record.dueDate}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {record.score !== null ? (
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            color={record.score >= 90 ? 'success.main' : record.score >= 70 ? 'warning.main' : 'error.main'}
                          >
                            {record.score}%
                          </Typography>
                        ) : record.progress !== undefined ? (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <LinearProgress 
                              variant="determinate" 
                              value={record.progress} 
                              sx={{ width: 50, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption">{record.progress}%</Typography>
                          </Stack>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No training records found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredRecords.length}
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
      ) : (
        /* Courses View */
        <Grid container spacing={2}>
          {courses.map((course) => {
            const completionRate = Math.round((course.completedCount / course.assignedCount) * 100);
            return (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {course.name}
                        </Typography>
                        <Chip
                          label={course.type}
                          size="small"
                          color={getCourseTypeColor(course.type)}
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <TrainingIcon />
                      </Avatar>
                    </Stack>

                    <Grid container spacing={1} sx={{ mt: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Duration</Typography>
                        <Typography variant="body2">{course.duration}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Valid For</Typography>
                        <Typography variant="body2">{course.validityPeriod}</Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2">Completion Rate</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {course.completedCount}/{course.assignedCount}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={completionRate}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={completionRate === 100 ? 'success' : completionRate >= 80 ? 'primary' : 'warning'}
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Required for: {course.requiredFor.join(', ')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Assign Training Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Assign Training</Typography>
            <IconButton onClick={() => setAssignDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Select Course</InputLabel>
              <Select label="Select Course" defaultValue="">
                {courses.map(course => (
                  <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select label="Assign To" defaultValue="">
                <MenuItem value="individual">Individual Employee</MenuItem>
                <MenuItem value="department">Department</MenuItem>
                <MenuItem value="role">Job Role</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              placeholder="Optional notes for assignees..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAssignDialogOpen(false)}>
            Assign Training
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
