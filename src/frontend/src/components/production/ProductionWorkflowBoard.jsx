/**
 * Production Workflow Board
 * Kanban-style board showing jobs grouped by status
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
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  LocalShipping as ShipIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { fetchJobs, updateJobStatus } from '../services/jobsService';

const STATUS_COLUMNS = [
  { key: 'ORDERED', label: 'Ordered', color: '#9e9e9e' },
  { key: 'SCHEDULED', label: 'Scheduled', color: '#2196f3' },
  { key: 'IN_PROCESS', label: 'In Process', color: '#ff9800' },
  { key: 'WAITING_QC', label: 'Waiting QC', color: '#f44336' },
  { key: 'PACKAGING', label: 'Packaging', color: '#9c27b0' },
  { key: 'READY_TO_SHIP', label: 'Ready to Ship', color: '#4caf50' },
  { key: 'SHIPPED', label: 'Shipped', color: '#00bcd4' },
  { key: 'COMPLETED', label: 'Completed', color: '#8bc34a' }
];

export default function ProductionWorkflowBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');
  const [workCenterFilter, setWorkCenterFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');

  const loadJobs = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (locationFilter) filters.locationId = locationFilter;
      if (workCenterFilter) filters.workCenterId = workCenterFilter;
      if (divisionFilter) filters.divisionId = divisionFilter;

      const data = await fetchJobs(filters);
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [locationFilter, workCenterFilter, divisionFilter]);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateJobStatus(jobId, newStatus);
      await loadJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const getJobsByStatus = (status) => {
    return jobs.filter(job => job.status === status);
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = STATUS_COLUMNS.findIndex(col => col.key === currentStatus);
    if (currentIndex < STATUS_COLUMNS.length - 1) {
      return STATUS_COLUMNS[currentIndex + 1].key;
    }
    return null;
  };

  const JobCard = ({ job }) => {
    const nextStatus = getNextStatus(job.status);

    return (
      <Card 
        sx={{ 
          mb: 2, 
          '&:hover': { 
            boxShadow: 4 
          } 
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {job.jobNumber || job.id.slice(0, 8)}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {job.workOrder?.order?.customer?.name || 'No customer'}
          </Typography>

          <Box sx={{ mt: 1 }}>
            <Chip 
              label={job.workCenter?.name || 'No work center'} 
              size="small" 
              sx={{ mr: 1 }}
            />
            {job.priority === 'HIGH' && (
              <Chip 
                label="High Priority" 
                size="small" 
                color="error"
              />
            )}
          </Box>

          {job.scheduledStart && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Scheduled: {new Date(job.scheduledStart).toLocaleDateString()}
            </Typography>
          )}
        </CardContent>

        {nextStatus && (
          <CardActions>
            <Button 
              size="small" 
              onClick={() => handleStatusChange(job.id, nextStatus)}
              startIcon={
                nextStatus === 'IN_PROCESS' ? <StartIcon /> :
                nextStatus === 'COMPLETED' ? <CompleteIcon /> :
                nextStatus === 'SHIPPED' ? <ShipIcon /> :
                null
              }
            >
              Move to {STATUS_COLUMNS.find(col => col.key === nextStatus)?.label}
            </Button>
          </CardActions>
        )}
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Production Workflow</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Location</InputLabel>
            <Select
              value={locationFilter}
              label="Location"
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <MenuItem value="">All Locations</MenuItem>
              <MenuItem value="loc1">Location 1</MenuItem>
              <MenuItem value="loc2">Location 2</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
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
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Division</InputLabel>
            <Select
              value={divisionFilter}
              label="Division"
              onChange={(e) => setDivisionFilter(e.target.value)}
            >
              <MenuItem value="">All Divisions</MenuItem>
              <MenuItem value="div1">Division A</MenuItem>
              <MenuItem value="div2">Division B</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh">
            <IconButton onClick={loadJobs}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {STATUS_COLUMNS.map(column => {
            const columnJobs = getJobsByStatus(column.key);
            
            return (
              <Paper
                key={column.key}
                sx={{
                  minWidth: 300,
                  maxWidth: 300,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderTop: 3,
                  borderColor: column.color
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {column.label}
                  </Typography>
                  <Chip 
                    label={columnJobs.length} 
                    size="small"
                    sx={{ bgcolor: column.color, color: 'white' }}
                  />
                </Box>

                <Box sx={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                  {columnJobs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                      No jobs
                    </Typography>
                  ) : (
                    columnJobs.map(job => (
                      <JobCard key={job.id} job={job} />
                    ))
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
