// Shop Floor App - Simplified view for shop floor operators
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getJobs, updateJobStatus } from '../../services/jobsApi';
import { mockJobs, mockWorkCenters } from '../../mocks/planningData';

const ACTIVE_STATUSES = ['SCHEDULED', 'IN_PROCESS'];

function ShopFloorApp() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workCenterId, setWorkCenterId] = useState('SHEAR-01');

  async function load() {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getJobs({ workCenterId });
      setJobs(data.filter(j => ACTIVE_STATUSES.includes(j.status)));
      console.log('Loaded shop floor jobs from database:', data.length);
    } catch (err) {
      console.error('Failed to load shop floor jobs:', err);
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [workCenterId]);

  async function handleStart(job) {
    try {
      await updateJobStatus(job.id, { status: 'IN_PROCESS' });
      await load();
    } catch (err) {
      console.error('Failed to start job:', err);
      setError(err.message);
    }
  }

  async function handleComplete(job) {
    try {
      // Next stage depends on workflow - could be PACKAGING or WAITING_QC
      await updateJobStatus(job.id, { status: 'PACKAGING' });
      await load();
    } catch (err) {
      console.error('Failed to complete job:', err);
      setError(err.message);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'info';
      case 'IN_PROCESS': return 'warning';
      default: return 'default';
    }
  };

  const currentWorkCenter = mockWorkCenters.find(wc => wc.id === workCenterId);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Shop Floor – {currentWorkCenter?.name || workCenterId}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Work Center</InputLabel>
            <Select
              value={workCenterId}
              label="Work Center"
              onChange={(e) => setWorkCenterId(e.target.value)}
            >
              {mockWorkCenters.map(wc => (
                <MenuItem key={wc.id} value={wc.id}>{wc.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={load}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {jobs.map((job) => (
            <Paper key={job.id} sx={{ p: 2 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {job.jobNumber} – {job.order?.customerName || 'Unknown Customer'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Order: {job.order?.orderNumber} · {job.operationType}
                  </Typography>
                  {job.assignedTo && (
                    <Typography variant="caption" color="text.secondary">
                      Assigned to: {job.assignedTo.name}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip 
                    label={job.status.replace('_', ' ')} 
                    size="small" 
                    color={getStatusColor(job.status)}
                  />
                  {job.status === 'SCHEDULED' && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<StartIcon />}
                      onClick={() => handleStart(job)}
                    >
                      Start
                    </Button>
                  )}
                  {job.status === 'IN_PROCESS' && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CompleteIcon />}
                      onClick={() => handleComplete(job)}
                    >
                      Complete
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
          {jobs.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No active jobs assigned to this work center.
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Jobs with status SCHEDULED or IN_PROCESS will appear here.
              </Typography>
            </Paper>
          )}
        </Stack>
      )}
    </Box>
  );
}

export default ShopFloorApp;
