import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Chip,
  Divider,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { getJobs } from '../../api/planning';
import { mockJobs } from '../../mocks/planningData';

const STAGES = [
  { id: 'ORDERED', label: 'Ordered' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'IN_PROCESS', label: 'In Process' },
  { id: 'WAITING_QC', label: 'Waiting QC' },
  { id: 'PACKAGING', label: 'Packaging' },
  { id: 'READY_TO_SHIP', label: 'Ready to Ship' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'COMPLETED', label: 'Completed' },
];

function ProductionWorkflowBoardPage() {
  const [jobs, setJobs] = useState([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadJobs(filterLocation) {
    try {
      setLoading(true);
      
      const data = await getJobs(
        filterLocation ? { locationId: filterLocation } : {}
      );
      setJobs(data);
      console.log('Loaded jobs from database:', data.length);
      
      setError(null);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Failed to load jobs: ' + err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs(locationFilter);
  }, [locationFilter]);

  const jobsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = jobs.filter((j) => j.status === stage.id);
    return acc;
  }, {});

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Production Workflow</Typography>
        <Stack direction="row" spacing={2}>
          {/* Location filter */}
          <Select
            size="small"
            value={locationFilter}
            displayEmpty
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <MenuItem value="">All Locations</MenuItem>
            <MenuItem value="PHX">Phoenix</MenuItem>
            <MenuItem value="DEN">Denver</MenuItem>
            <MenuItem value="RIV">Riverside</MenuItem>
          </Select>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {STAGES.map((stage) => (
          <Grid item xs={12} sm={6} md={3} key={stage.id}>
            <Paper
              sx={{
                p: 1.5,
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="subtitle2">{stage.label}</Typography>
                <Chip
                  size="small"
                  label={jobsByStage[stage.id]?.length || 0}
                />
              </Stack>
              <Divider />
              <Box sx={{ mt: 1, overflowY: 'auto' }}>
                {jobsByStage[stage.id]?.map((job) => (
                  <Paper
                    key={job.id}
                    variant="outlined"
                    sx={{ p: 1, mb: 1, borderLeft: '4px solid #1976d2', cursor: 'pointer' }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {job.jobNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.order?.orderNumber || 'No Order'}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {job.operationType} · {job.workCenter?.name || 'No WC'}
                    </Typography>
                    {job.assignedTo && (
                      <Typography variant="caption" display="block" color="primary">
                        {job.assignedTo.firstName} {job.assignedTo.lastName}
                      </Typography>
                    )}
                  </Paper>
                ))}
                {(!jobsByStage[stage.id] ||
                  jobsByStage[stage.id].length === 0) && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic' }}
                  >
                    No jobs in this stage.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default ProductionWorkflowBoardPage;
