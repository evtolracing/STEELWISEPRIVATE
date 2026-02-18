import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Paper, Chip, Button,
  CircularProgress, Alert, Divider,
} from '@mui/material';
import {
  Inventory2, LocalShipping, QrCode2, Timeline, TrendingUp,
  CheckCircle, Schedule, Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getTrackingStats } from '../../api/materialTracking';
import { getJobs } from '../../api/jobs';

const StatCard = ({ title, value, icon, color, subtitle, onClick }) => (
  <Card
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.2s',
      '&:hover': onClick ? { boxShadow: 6 } : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight={700} color={`${color}.main`}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main` }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const MaterialTrackingDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statsData, jobsData] = await Promise.all([
          getTrackingStats().catch(() => null),
          getJobs({ status: 'WAITING_QC,PACKAGING,READY_TO_SHIP,SHIPPED' }).catch(() => []),
        ]);

        setStats(statsData);
        setRecentJobs(jobsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const waitingQC = recentJobs.filter(j => j.status === 'WAITING_QC').length;
  const packaging = recentJobs.filter(j => j.status === 'PACKAGING').length;
  const readyToShip = recentJobs.filter(j => j.status === 'READY_TO_SHIP').length;
  const shipped = recentJobs.filter(j => j.status === 'SHIPPED').length;

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Material Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unified packaging, tagging, staging, and traceability dashboard
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Pipeline Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Waiting QC"
            value={waitingQC}
            icon={<Schedule />}
            color="warning"
            subtitle="Jobs awaiting inspection"
            onClick={() => navigate('/material-tracking/packaging')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Packaging"
            value={packaging}
            icon={<Inventory2 />}
            color="info"
            subtitle="Being packaged & tagged"
            onClick={() => navigate('/material-tracking/packaging')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Ready to Ship"
            value={readyToShip}
            icon={<CheckCircle />}
            color="success"
            subtitle="Staged at docks"
            onClick={() => navigate('/material-tracking/staging')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Shipped"
            value={shipped}
            icon={<LocalShipping />}
            color="primary"
            subtitle="In transit"
            onClick={() => navigate('/material-tracking/staging')}
          />
        </Grid>
      </Grid>

      {/* Quick Access Cards */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Quick Access
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => navigate('/material-tracking/packaging')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Inventory2 sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>Packaging Queue</Typography>
              <Typography variant="caption" color="text.secondary">
                Bundle, band, and prepare for shipping
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => navigate('/material-tracking/tags')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <QrCode2 sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>Tag Management</Typography>
              <Typography variant="caption" color="text.secondary">
                Generate, print, apply, and scan tags
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => navigate('/material-tracking/staging')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <LocalShipping sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>Staging & Loading</Typography>
              <Typography variant="caption" color="text.secondary">
                Stage at docks and load onto trucks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => navigate('/material-tracking/traceability')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Timeline sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>Traceability</Typography>
              <Typography variant="caption" color="text.secondary">
                Chain of custody and audit trail
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Active Jobs Table */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Active Jobs in Pipeline
      </Typography>
      <Paper sx={{ overflow: 'hidden' }}>
        {recentJobs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No active jobs in the packaging pipeline</Typography>
          </Box>
        ) : (
          recentJobs.slice(0, 10).map((job, idx) => (
            <Box key={job.id}>
              {idx > 0 && <Divider />}
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 3, py: 2, '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                    {job.jobNumber}
                  </Typography>
                  <Typography variant="body2">
                    {job.customerName || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.material || ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {job.dueDate && (
                    <Typography variant="caption" color="text.secondary">
                      Due: {new Date(job.dueDate).toLocaleDateString()}
                    </Typography>
                  )}
                  <Chip
                    label={job.status.replace(/_/g, ' ')}
                    size="small"
                    color={
                      job.status === 'WAITING_QC' ? 'warning'
                        : job.status === 'PACKAGING' ? 'info'
                        : job.status === 'READY_TO_SHIP' ? 'success'
                        : 'primary'
                    }
                  />
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Paper>

      {/* System Stats */}
      {stats && (
        <>
          <Typography variant="h6" fontWeight={600} sx={{ mt: 4, mb: 2 }}>
            System Stats
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700}>{stats.totals?.activePackages || 0}</Typography>
                <Typography variant="caption" color="text.secondary">Active Packages</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700}>{stats.totals?.activeTags || 0}</Typography>
                <Typography variant="caption" color="text.secondary">Active Tags</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700}>{stats.recentEventsCount || 0}</Typography>
                <Typography variant="caption" color="text.secondary">Events (24h)</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700}>{stats.totals?.activeJobs || 0}</Typography>
                <Typography variant="caption" color="text.secondary">Jobs in Pipeline</Typography>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default MaterialTrackingDashboard;
