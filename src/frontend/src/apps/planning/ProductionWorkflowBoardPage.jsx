import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { getJobs } from '../../api/planning';
import { mockJobs } from '../../mocks/planningData';

const STAGES = [
  { id: 'ORDERED', label: 'Ordered', color: '#9e9e9e' },
  { id: 'SCHEDULED', label: 'Scheduled', color: '#2196f3' },
  { id: 'IN_PROCESS', label: 'In Process', color: '#ff9800' },
  { id: 'WAITING_QC', label: 'Waiting QC', color: '#9c27b0' },
  { id: 'PACKAGING', label: 'Packaging', color: '#00bcd4' },
  { id: 'READY_TO_SHIP', label: 'Ready to Ship', color: '#4caf50' },
  { id: 'SHIPPED', label: 'Shipped', color: '#8bc34a' },
  { id: 'COMPLETED', label: 'Completed', color: '#388e3c' },
];

function ProductionWorkflowBoardPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      // Use mock data for development (no database required)
      const USE_MOCK_DATA = true;
      
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        setJobs(mockJobs);
      } else {
        const data = await getJobs();
        setJobs(data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

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
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" mb={2} fontWeight={600}>
        Production Workflow
      </Typography>
      <Grid container spacing={2}>
        {STAGES.map((stage) => (
          <Grid item xs={12} sm={6} md={3} lg={1.5} key={stage.id}>
            <Paper 
              sx={{ 
                p: 1.5, 
                height: '80vh', 
                display: 'flex', 
                flexDirection: 'column',
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {stage.label}
                </Typography>
                <Chip
                  size="small"
                  label={jobsByStage[stage.id]?.length || 0}
                  sx={{ 
                    bgcolor: stage.color,
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Stack>
              <Divider />
              <Box sx={{ mt: 1, overflowY: 'auto', flex: 1 }}>
                {jobsByStage[stage.id]?.map((job) => (
                  <Paper
                    key={job.id}
                    variant="outlined"
                    sx={{ 
                      p: 1, 
                      mb: 1, 
                      borderLeft: `4px solid ${stage.color}`,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {job.jobNumber || `Job #${job.id.slice(0, 8)}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {job.order?.buyer?.name || job.customerName || 'Unknown Customer'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.operationType || 'Processing'} · WC: {job.workCenter?.name || job.workCenterName || 'Unassigned'}
                    </Typography>
                  </Paper>
                ))}
                {(!jobsByStage[stage.id] || jobsByStage[stage.id].length === 0) && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic', display: 'block', textAlign: 'center', mt: 2 }}
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
