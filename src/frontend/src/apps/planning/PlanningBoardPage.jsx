import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ViewKanban as KanbanIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getJobs, getWorkCenters } from '../../api/planning';
import { mockJobs, getWorkCenterStats } from '../../mocks/planningData';

function PlanningBoardPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [jobsData, wcData] = await Promise.all([
        getJobs(),
        getWorkCenters(),
      ]);
      setJobs(jobsData);
      setWorkCenters(wcData);
      console.log('Loaded planning data from database:', jobsData.length, 'jobs');
      
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load planning data');
      setJobs([]);
      setWorkCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      ORDERED: 0,
      SCHEDULED: 0,
      IN_PROCESS: 0,
      WAITING_QC: 0,
      PACKAGING: 0,
      READY_TO_SHIP: 0,
    };
    jobs.forEach((job) => {
      if (counts[job.status] !== undefined) {
        counts[job.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Planning & Scheduling
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<KanbanIcon />}
            onClick={() => navigate('/planning/workflow')}
          >
            Workflow Board
          </Button>
          <Button
            variant="outlined"
            startIcon={<CalendarIcon />}
            onClick={() => navigate('/schedule')}
          >
            Schedule View
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Ordered
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {statusCounts.ORDERED}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Scheduled
              </Typography>
              <Typography variant="h4" fontWeight={600} color="primary">
                {statusCounts.SCHEDULED}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                In Process
              </Typography>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {statusCounts.IN_PROCESS}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Waiting QC
              </Typography>
              <Typography variant="h4" fontWeight={600} color="secondary">
                {statusCounts.WAITING_QC}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Packaging
              </Typography>
              <Typography variant="h4" fontWeight={600} color="info.main">
                {statusCounts.PACKAGING}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Ready to Ship
              </Typography>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {statusCounts.READY_TO_SHIP}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Work Centers */}
      <Typography variant="h6" mb={2} fontWeight={600}>
        Work Centers
      </Typography>
      <Grid container spacing={2}>
        {workCenters.map((wc) => {
          const wcJobs = jobs.filter((j) => j.workCenterId === wc.id);
          const activeJobs = wcJobs.filter((j) => j.status === 'IN_PROCESS');
          const queuedJobs = wcJobs.filter((j) => j.status === 'SCHEDULED');
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={wc.id}>
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {wc.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={wc.isActive ? 'Active' : 'Inactive'}
                    color={wc.isActive ? 'success' : 'default'}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  {wc.code} · {wc.location?.name || 'No Location'}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    size="small"
                    label={`${activeJobs.length} Active`}
                    color="warning"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`${queuedJobs.length} Queued`}
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
              </Paper>
            </Grid>
          );
        })}
        {workCenters.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" textAlign="center" py={4}>
              No work centers configured.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default PlanningBoardPage;
