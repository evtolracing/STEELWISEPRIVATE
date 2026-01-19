/**
 * Shop Floor Screen
 * Interface for shop floor operators to start and complete jobs
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { fetchJobs, startJob, completeJob } from '../../services/jobsService';

export default function ShopFloorScreen() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workCenterFilter, setWorkCenterFilter] = useState('');
  const [error, setError] = useState('');
  const [completeDialog, setCompleteDialog] = useState({ open: false, job: null });
  const [completionNotes, setCompletionNotes] = useState('');

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters = {};
      if (workCenterFilter) filters.workCenterId = workCenterFilter;

      const data = await fetchJobs(filters);
      
      // Filter to show only SCHEDULED and IN_PROCESS jobs
      const relevantJobs = data.filter(
        job => job.status === 'SCHEDULED' || job.status === 'IN_PROCESS'
      );
      
      setJobs(relevantJobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, [workCenterFilter]);

  const handleStartJob = async (jobId) => {
    try {
      setError('');
      await startJob(jobId);
      await loadJobs();
    } catch (err) {
      console.error('Error starting job:', err);
      setError('Failed to start job');
    }
  };

  const handleCompleteJob = async () => {
    try {
      setError('');
      await completeJob(completeDialog.job.id, completionNotes);
      setCompleteDialog({ open: false, job: null });
      setCompletionNotes('');
      await loadJobs();
    } catch (err) {
      console.error('Error completing job:', err);
      setError('Failed to complete job');
    }
  };

  const scheduledJobs = jobs.filter(job => job.status === 'SCHEDULED');
  const inProcessJobs = jobs.filter(job => job.status === 'IN_PROCESS');

  const JobCard = ({ job, variant }) => {
    const isScheduled = variant === 'scheduled';
    const isInProcess = variant === 'in-process';

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6">
              {job.jobNumber || job.id.slice(0, 8)}
            </Typography>
            {isInProcess && (
              <Chip 
                icon={<TimerIcon />}
                label="In Progress" 
                color="warning" 
                size="small"
              />
            )}
          </Box>

          <Typography variant="body1" gutterBottom>
            {job.workOrder?.order?.customer?.name || 'No customer'}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Work Center: {job.workCenter?.name || 'Not assigned'}
          </Typography>

          {job.scheduledStart && (
            <Typography variant="body2" color="text.secondary">
              Scheduled: {new Date(job.scheduledStart).toLocaleString()}
            </Typography>
          )}

          {job.actualStart && (
            <Typography variant="body2" color="text.secondary">
              Started: {new Date(job.actualStart).toLocaleString()}
            </Typography>
          )}

          {job.priority === 'HIGH' && (
            <Chip 
              label="High Priority" 
              color="error" 
              size="small" 
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          {isScheduled && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<StartIcon />}
              onClick={() => handleStartJob(job.id)}
            >
              Start Job
            </Button>
          )}
          {isInProcess && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CompleteIcon />}
              onClick={() => setCompleteDialog({ open: true, job })}
            >
              Complete Job
            </Button>
          )}
        </CardActions>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Shop Floor</Typography>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Work Center</InputLabel>
          <Select
            value={workCenterFilter}
            label="Work Center"
            onChange={(e) => setWorkCenterFilter(e.target.value)}
          >
            <MenuItem value="">All Work Centers</MenuItem>
            <MenuItem value="wc1">Cutting</MenuItem>
            <MenuItem value="wc2">Welding</MenuItem>
            <MenuItem value="wc3">Assembly</MenuItem>
            <MenuItem value="wc4">Finishing</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Scheduled Jobs ({scheduledJobs.length})
            </Typography>
            
            {scheduledJobs.length === 0 ? (
              <Alert severity="info">No scheduled jobs</Alert>
            ) : (
              <Grid container spacing={2}>
                {scheduledJobs.map(job => (
                  <Grid item xs={12} key={job.id}>
                    <JobCard job={job} variant="scheduled" />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              In Process ({inProcessJobs.length})
            </Typography>
            
            {inProcessJobs.length === 0 ? (
              <Alert severity="info">No jobs in process</Alert>
            ) : (
              <Grid container spacing={2}>
                {inProcessJobs.map(job => (
                  <Grid item xs={12} key={job.id}>
                    <JobCard job={job} variant="in-process" />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      {/* Complete Job Dialog */}
      <Dialog 
        open={completeDialog.open} 
        onClose={() => setCompleteDialog({ open: false, job: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Job</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Job: {completeDialog.job?.jobNumber || completeDialog.job?.id.slice(0, 8)}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Customer: {completeDialog.job?.workOrder?.order?.customer?.name}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Completion Notes (optional)"
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog({ open: false, job: null })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleCompleteJob}
            startIcon={<CompleteIcon />}
          >
            Complete Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
