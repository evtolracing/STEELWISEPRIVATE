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
  School as CourseIcon,
  Verified as CertifiedIcon,
  CheckCircle as ActiveIcon,
  Warning as ExpiringIcon,
  Cancel as ExpiredIcon,
  PlayCircle as StartIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RenewIcon,
} from '@mui/icons-material'

// Mock My Certifications Data
const mockMyCertifications = [
  {
    id: '1',
    competency: 'General Safety Awareness',
    courseCode: 'GSO-101',
    courseName: 'General Safety Orientation',
    level: 'QUALIFIED',
    issuedAt: '2025-03-15',
    expiresAt: '2026-03-15',
    issuedBy: 'Sarah Williams',
    status: 'ACTIVE',
    certificateNumber: 'CERT-2025-00412',
  },
  {
    id: '2',
    competency: 'Forklift Operation - Qualified',
    courseCode: 'FORK-101',
    courseName: 'Forklift Operation Fundamentals',
    level: 'QUALIFIED',
    issuedAt: '2024-06-20',
    expiresAt: '2027-06-20',
    issuedBy: 'Mike Johnson',
    status: 'ACTIVE',
    certificateNumber: 'CERT-2024-00847',
  },
  {
    id: '3',
    competency: 'LOTO Authorized',
    courseCode: 'LOTO-201',
    courseName: 'LOTO Authorized Person Training',
    level: 'AUTHORIZED',
    issuedAt: '2025-02-10',
    expiresAt: '2026-02-10',
    issuedBy: 'EHS Manager',
    status: 'EXPIRING_SOON',
    daysRemaining: 6,
    certificateNumber: 'CERT-2025-00156',
  },
  {
    id: '4',
    competency: 'Horizontal Bandsaw - Qualified',
    courseCode: 'SAW-101',
    courseName: 'Horizontal Bandsaw Operation',
    level: 'QUALIFIED',
    issuedAt: '2024-08-15',
    expiresAt: '2026-08-15',
    issuedBy: 'Training Coordinator',
    status: 'ACTIVE',
    certificateNumber: 'CERT-2024-01124',
  },
  {
    id: '5',
    competency: 'First Aid/CPR/AED Certified',
    courseCode: 'FIRSTAID-101',
    courseName: 'First Aid / CPR / AED',
    level: 'QUALIFIED',
    issuedAt: '2025-01-10',
    expiresAt: '2027-01-10',
    issuedBy: 'American Red Cross',
    status: 'ACTIVE',
    certificateNumber: 'ARC-2025-48721',
  },
  {
    id: '6',
    competency: 'Overhead Crane - Qualified',
    courseCode: 'CRANE-101',
    courseName: 'Overhead Crane Operation',
    level: 'QUALIFIED',
    issuedAt: '2025-01-01',
    expiresAt: '2026-01-01',
    issuedBy: 'EHS Manager',
    status: 'EXPIRED',
    expiredDays: 34,
    certificateNumber: 'CERT-2025-00001',
  },
]

const mockPendingTraining = [
  {
    id: '1',
    courseCode: 'CRANE-101',
    courseName: 'Overhead Crane Operation',
    assignedAt: '2026-01-05',
    dueDate: '2026-02-15',
    progress: 0,
    status: 'NOT_STARTED',
  },
  {
    id: '2',
    courseCode: 'LOTO-201',
    courseName: 'LOTO Authorized Person Training (Recert)',
    assignedAt: '2026-01-28',
    dueDate: '2026-02-10',
    progress: 60,
    status: 'IN_PROGRESS',
  },
]

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'success', icon: ActiveIcon },
  EXPIRING_SOON: { label: 'Expiring Soon', color: 'warning', icon: ExpiringIcon },
  EXPIRED: { label: 'Expired', color: 'error', icon: ExpiredIcon },
  SUSPENDED: { label: 'Suspended', color: 'default', icon: ExpiredIcon },
}

const levelConfig = {
  AWARE: { label: 'Aware', color: 'default' },
  AUTHORIZED: { label: 'Authorized', color: 'info' },
  QUALIFIED: { label: 'Qualified', color: 'success' },
  TRAINER: { label: 'Trainer', color: 'primary' },
}

const trainingStatusConfig = {
  NOT_STARTED: { label: 'Not Started', color: 'default' },
  IN_PROGRESS: { label: 'In Progress', color: 'info' },
  COMPLETED: { label: 'Completed', color: 'success' },
  OVERDUE: { label: 'Overdue', color: 'error' },
}

export default function MyCertificationsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [selectedCert, setSelectedCert] = useState(null)

  const activeCerts = mockMyCertifications.filter((c) => c.status === 'ACTIVE')
  const expiringCerts = mockMyCertifications.filter((c) => c.status === 'EXPIRING_SOON')
  const expiredCerts = mockMyCertifications.filter((c) => c.status === 'EXPIRED')

  const filteredCerts =
    tabValue === 0
      ? mockMyCertifications
      : tabValue === 1
      ? activeCerts
      : tabValue === 2
      ? expiringCerts
      : expiredCerts

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            My Certifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your training history and active competency certifications
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />}>
          Export All
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Total Certifications
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {mockMyCertifications.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Active
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {activeCerts.length}
              </Typography>
              <ActiveIcon sx={{ color: 'success.main' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: expiringCerts.length > 0 ? 'warning.lighter' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Expiring Soon
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: expiringCerts.length > 0 ? 'warning.main' : 'text.secondary' }}
              >
                {expiringCerts.length}
              </Typography>
              <ExpiringIcon sx={{ color: expiringCerts.length > 0 ? 'warning.main' : 'text.secondary' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: expiredCerts.length > 0 ? 'error.lighter' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Expired
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: expiredCerts.length > 0 ? 'error.main' : 'success.main' }}
              >
                {expiredCerts.length}
              </Typography>
              {expiredCerts.length > 0 ? (
                <ExpiredIcon sx={{ color: 'error.main' }} />
              ) : (
                <ActiveIcon sx={{ color: 'success.main' }} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Training */}
      {mockPendingTraining.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CourseIcon color="primary" /> Pending Training
          </Typography>
          {mockPendingTraining.map((training) => {
            const status = trainingStatusConfig[training.status]
            return (
              <Card key={training.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {training.courseName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {training.courseCode} | Due: {new Date(training.dueDate).toLocaleDateString()}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1, maxWidth: 300 }}>
                          <LinearProgress
                            variant="determinate"
                            value={training.progress}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2">{training.progress}% complete</Typography>
                        <Chip label={status.label} color={status.color} size="small" />
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<StartIcon />}
                      sx={{ ml: 2 }}
                    >
                      {training.progress > 0 ? 'Continue' : 'Start'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Paper>
      )}

      {/* Certifications Table */}
      <Paper sx={{ p: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label={`All (${mockMyCertifications.length})`} />
          <Tab label={`Active (${activeCerts.length})`} />
          <Tab label={`Expiring (${expiringCerts.length})`} />
          <Tab label={`Expired (${expiredCerts.length})`} />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Competency</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Issued</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCerts.map((cert) => {
                const status = statusConfig[cert.status]
                const level = levelConfig[cert.level]
                const StatusIcon = status.icon

                return (
                  <TableRow key={cert.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: `${status.color}.main`, width: 36, height: 36 }}>
                          <CertifiedIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {cert.competency}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={level.label} color={level.color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{cert.courseName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cert.courseCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            cert.status === 'EXPIRED'
                              ? 'error.main'
                              : cert.status === 'EXPIRING_SOON'
                              ? 'warning.main'
                              : 'text.primary',
                          fontWeight: cert.status !== 'ACTIVE' ? 600 : 400,
                        }}
                      >
                        {new Date(cert.expiresAt).toLocaleDateString()}
                      </Typography>
                      {cert.daysRemaining && (
                        <Typography variant="caption" color="warning.main">
                          {cert.daysRemaining} days left
                        </Typography>
                      )}
                      {cert.expiredDays && (
                        <Typography variant="caption" color="error.main">
                          {cert.expiredDays} days ago
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<StatusIcon />}
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => setSelectedCert(cert)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <PrintIcon fontSize="small" />
                      </IconButton>
                      {(cert.status === 'EXPIRING_SOON' || cert.status === 'EXPIRED') && (
                        <IconButton size="small" color="primary">
                          <RenewIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Certificate Detail Dialog */}
      <Dialog open={!!selectedCert} onClose={() => setSelectedCert(null)} maxWidth="sm" fullWidth>
        {selectedCert && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${statusConfig[selectedCert.status].color}.main`, width: 56, height: 56 }}>
                  <CertifiedIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedCert.competency}</Typography>
                  <Chip
                    label={statusConfig[selectedCert.status].label}
                    color={statusConfig[selectedCert.status].color}
                    size="small"
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="info">
                    Certificate #: <strong>{selectedCert.certificateNumber}</strong>
                  </Alert>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Level</Typography>
                  <Box>
                    <Chip
                      label={levelConfig[selectedCert.level].label}
                      color={levelConfig[selectedCert.level].color}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Course</Typography>
                  <Typography variant="body1">{selectedCert.courseCode}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Issued Date</Typography>
                  <Typography variant="body1">
                    {new Date(selectedCert.issuedAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Expiry Date</Typography>
                  <Typography variant="body1">
                    {new Date(selectedCert.expiresAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Issued By</Typography>
                  <Typography variant="body1">{selectedCert.issuedBy}</Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedCert(null)}>Close</Button>
              <Button startIcon={<DownloadIcon />} variant="outlined">
                Download PDF
              </Button>
              {(selectedCert.status === 'EXPIRING_SOON' || selectedCert.status === 'EXPIRED') && (
                <Button variant="contained" startIcon={<RenewIcon />}>
                  Renew Certification
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
