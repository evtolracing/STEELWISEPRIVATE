/**
 * Production workflow board: every open job in a column for how far it has got. Branch and division are picked
 * from the records on file; the job's machine is the machine of its current step. Counted on the server the same
 * way as the shop floor and the planning page (GET /api/jobs/overview). Moving a job is done where the work
 * happens (the machine queue, QC, packaging, shipping), so this board only shows and opens jobs.
 */
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import ProductionFilterBar from '../../components/production/ProductionFilterBar';
import { useProductionOverview } from '../../components/production/useProductionOverview';
import { byStage, stepText } from '../../components/production/productionView';
import { calendarDate } from '../../utils/calendarDate';

function ProductionWorkflowBoardPage() {
  const { data, loading, error, filters, setFilters, reload } = useProductionOverview();
  const stages = data?.stages || [];
  const columns = byStage(data?.jobs || [], stages);

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={2}>
        <Box>
          <Typography component="h1" variant="h5">Production Workflow</Typography>
          <Typography variant="caption" color="text.secondary">
            Open jobs by how far they have got. Shipped and cancelled jobs are not shown.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <ProductionFilterBar locationId={filters.locationId} division={filters.division} onChange={setFilters} />
          <Tooltip title="Refresh">
            <IconButton onClick={reload} aria-label="Refresh"><RefreshIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>The jobs could not be loaded, so none are shown. {error}</Alert>}
      {data?.limited && <Alert severity="info" sx={{ mb: 2 }}>Only the first 5,000 open jobs are shown. Pick a branch to see all of one branch.</Alert>}
      {loading && !data && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>
      )}

      {data && (
        <Grid container spacing={2}>
          {stages.map((stage) => {
            const jobs = columns[stage.key] || [];
            return (
              <Grid item xs={12} sm={6} md={3} key={stage.key}>
                <Paper sx={{ p: 1.5, height: '70vh', display: 'flex', flexDirection: 'column' }} data-testid={`stage-${stage.key}`}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="subtitle2" component="h2">{stage.label}</Typography>
                    <Chip size="small" label={jobs.length} data-testid="stage-count" />
                  </Stack>
                  {stage.hint && <Typography variant="caption" color="text.secondary" mb={0.5}>{stage.hint}</Typography>}
                  <Divider />
                  <Box sx={{ mt: 1, overflowY: 'auto' }}>
                    {jobs.map((job) => (
                      <Paper key={job.id} variant="outlined" sx={{ p: 1, mb: 1, borderLeft: '4px solid #1976d2' }} data-testid="workflow-job">
                        <Typography component={RouterLink} to={`/jobs/${job.id}`} variant="body2" fontWeight={600} sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                          {job.jobNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {[job.orderNumber || 'No order', job.customerName].filter(Boolean).join(' · ')}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {stepText(job)}{job.workCenterName ? ` · ${job.workCenterName}` : ''}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {[job.locationName || 'No branch on file', job.division, job.dueDate ? `Due ${calendarDate(job.dueDate)}` : null].filter(Boolean).join(' · ')}
                        </Typography>
                      </Paper>
                    ))}
                    {jobs.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No jobs in this stage.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

export default ProductionWorkflowBoardPage;
