import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
} from '@mui/material'
import {
  Search as SearchIcon,
  School as CourseIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as ExpiringIcon,
  Cancel as ExpiredIcon,
  PlayCircle as StartIcon,
  Visibility as ViewIcon,
  Group as GroupIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material'

// Mock Training Dashboard Data
const mockStats = {
  totalOperators: 48,
  fullyCompliant: 42,
  expiringCerts: 8,
  overdueTraining: 3,
  completedThisMonth: 24,
  complianceRate: 87.5,
}

const mockUpcomingExpirations = [
  {
    id: '1',
    operatorName: 'John Smith',
    operatorId: 'OP-001',
    competency: 'Forklift Operation',
    expiresAt: '2026-02-18',
    daysRemaining: 14,
    status: 'EXPIRING_SOON',
  },
  {
    id: '2',
    operatorName: 'Maria Garcia',
    operatorId: 'OP-002',
    competency: 'LOTO Authorized',
    expiresAt: '2026-02-10',
    daysRemaining: 6,
    status: 'EXPIRING_SOON',
  },
  {
    id: '3',
    operatorName: 'Robert Williams',
    operatorId: 'OP-005',
    competency: 'Crane Operation',
    expiresAt: '2026-02-20',
    daysRemaining: 16,
    status: 'EXPIRING_SOON',
  },
  {
    id: '4',
    operatorName: 'Jennifer Lee',
    operatorId: 'OP-008',
    competency: 'Hot Work Permit',
    expiresAt: '2026-02-08',
    daysRemaining: 4,
    status: 'EXPIRING_SOON',
  },
]

const mockOverdueTraining = [
  {
    id: '1',
    operatorName: 'David Chen',
    operatorId: 'OP-012',
    competency: 'General Safety Orientation',
    expiredAt: '2026-01-15',
    daysPastDue: 20,
    status: 'EXPIRED',
    workBlocked: true,
  },
  {
    id: '2',
    operatorName: 'Sarah Johnson',
    operatorId: 'OP-015',
    competency: 'Saw Operation',
    expiredAt: '2026-01-28',
    daysPastDue: 7,
    status: 'EXPIRED',
    workBlocked: true,
  },
  {
    id: '3',
    operatorName: 'Mike Brown',
    operatorId: 'OP-018',
    competency: 'First Aid/CPR',
    expiredAt: '2026-01-20',
    daysPastDue: 15,
    status: 'EXPIRED',
    workBlocked: false,
  },
]

const mockRecentCompletions = [
  {
    id: '1',
    operatorName: 'Tom Anderson',
    course: 'Forklift Recertification',
    completedAt: '2026-02-04T10:30:00',
    score: 92,
    validUntil: '2029-02-04',
  },
  {
    id: '2',
    operatorName: 'Lisa Chen',
    course: 'LOTO Annual Refresher',
    completedAt: '2026-02-03T14:00:00',
    score: 100,
    validUntil: '2027-02-03',
  },
  {
    id: '3',
    operatorName: 'James Wilson',
    course: 'New Employee Safety Orientation',
    completedAt: '2026-02-02T09:00:00',
    score: 88,
    validUntil: '2027-02-02',
  },
]

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'success' },
  EXPIRING_SOON: { label: 'Expiring Soon', color: 'warning' },
  EXPIRED: { label: 'Expired', color: 'error' },
  SUSPENDED: { label: 'Suspended', color: 'default' },
}

export default function TrainingDashboard() {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Safety Training Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Workforce competency and training compliance overview
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<GroupIcon />}>
            View All Operators
          </Button>
          <Button
            variant="contained"
            startIcon={<AssignmentIcon />}
            onClick={() => setAssignDialogOpen(true)}
          >
            Assign Training
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Total Operators
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {mockStats.totalOperators}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Fully Compliant
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {mockStats.fullyCompliant}
              </Typography>
              <CompletedIcon sx={{ color: 'success.main' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: mockStats.expiringCerts > 0 ? 'warning.lighter' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Expiring (30 days)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {mockStats.expiringCerts}
              </Typography>
              <ExpiringIcon sx={{ color: 'warning.main' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: mockStats.overdueTraining > 0 ? 'error.lighter' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Overdue/Blocked
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {mockStats.overdueTraining}
              </Typography>
              <ExpiredIcon sx={{ color: 'error.main' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Compliance Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {mockStats.complianceRate}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={mockStats.complianceRate}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
                color="success"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Expiring Soon */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ExpiringIcon color="warning" /> Expiring Soon
              </Typography>
              <Button size="small">View All</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Operator</TableCell>
                    <TableCell>Competency</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockUpcomingExpirations.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.operatorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.operatorId}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.competency}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${item.daysRemaining} days`}
                          color={item.daysRemaining <= 7 ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="outlined" startIcon={<AssignmentIcon />}>
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Overdue/Blocked */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ExpiredIcon color="error" /> Overdue / Work Blocked
              </Typography>
              <Button size="small">View All</Button>
            </Box>
            {mockOverdueTraining.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Operator</TableCell>
                      <TableCell>Competency</TableCell>
                      <TableCell>Days Overdue</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockOverdueTraining.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.operatorName}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.competency}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                            +{item.daysPastDue} days
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {item.workBlocked ? (
                            <Chip label="WORK BLOCKED" color="error" size="small" />
                          ) : (
                            <Chip label="Grace Period" color="warning" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CompletedIcon sx={{ fontSize: 48, color: 'success.main' }} />
                <Typography variant="body2" color="text.secondary">
                  All operators are compliant!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Completions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompletedIcon color="success" /> Recent Completions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mockStats.completedThisMonth} completed this month
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Operator</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Valid Until</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockRecentCompletions.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.operatorName}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.course}</TableCell>
                      <TableCell>
                        {new Date(item.completedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${item.score}%`}
                          color={item.score >= 90 ? 'success' : item.score >= 80 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(item.validUntil).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Assign Training Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Training</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Select Operator(s)" placeholder="Search operators..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Select Course" placeholder="Search courses..." />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAssignDialogOpen(false)}>
            Assign Training
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
