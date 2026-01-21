import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  IconButton,
  Collapse,
  Stack,
} from '@mui/material';
import {
  AutoAwesome,
  PlayArrow,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { getOptimizationPreview, applyOptimization, getOptimizationAnalysis } from '../../services/optimizationApi';

export default function WorkOrderOptimizationPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showJobs, setShowJobs] = useState(false);
  const [showBottlenecks, setShowBottlenecks] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, []);

  async function loadAnalysis() {
    try {
      setLoading(true);
      const data = await getOptimizationAnalysis();
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generatePreview() {
    try {
      setLoading(true);
      const data = await getOptimizationPreview({
        horizonHours: 72,
      });
      setPreview(data.preview);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!preview || !preview.optimizedJobs) return;
    
    try {
      setApplying(true);
      await applyOptimization(preview.optimizedJobs);
      alert(`Successfully applied schedule to ${preview.optimizedJobs.length} jobs`);
      setPreview(null);
      loadAnalysis();
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      alert('Failed to apply optimization');
    } finally {
      setApplying(false);
    }
  }

  function getSeverityColor(severity) {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'WARNING': return 'warning';
      default: return 'info';
    }
  }

  function getUtilizationColor(percent) {
    if (percent > 100) return 'error';
    if (percent > 90) return 'warning';
    if (percent > 70) return 'success';
    return 'info';
  }

  if (loading && !analysis && !preview) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesome color="primary" />
          <Typography variant="h5" fontWeight="bold">
            Work Order Optimization AI
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadAnalysis}
            disabled={loading}
          >
            Refresh Analysis
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={generatePreview}
            disabled={loading}
          >
            Generate Optimized Schedule
          </Button>
        </Stack>
      </Box>

      {/* Metrics Overview */}
      {analysis && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Jobs
                </Typography>
                <Typography variant="h3">
                  {analysis.metrics.totalJobs}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {analysis.metrics.assignedJobs} assigned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Overall Utilization
                </Typography>
                <Typography variant="h3" color={getUtilizationColor(analysis.metrics.overallUtilization)}>
                  {analysis.metrics.overallUtilization}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Across all work centers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Jobs At Risk
                </Typography>
                <Typography variant="h3" color={analysis.metrics.jobsAtRisk > 0 ? 'error' : 'success'}>
                  {analysis.metrics.jobsAtRisk}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  May miss due dates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Bottlenecks
                </Typography>
                <Typography variant="h3" color={analysis.metrics.bottleneckCount > 0 ? 'warning' : 'success'}>
                  {analysis.metrics.bottleneckCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overloaded work centers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recommendations */}
      {analysis && analysis.recommendations && analysis.recommendations.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              AI Recommendations
            </Typography>
          </Box>
          <Stack spacing={2}>
            {analysis.recommendations.map((rec, idx) => (
              <Alert
                key={idx}
                severity={getSeverityColor(rec.severity)}
                icon={
                  rec.severity === 'CRITICAL' ? <Error /> :
                  rec.severity === 'WARNING' ? <Warning /> :
                  <CheckCircle />
                }
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {rec.title}
                </Typography>
                <Typography variant="body2">
                  {rec.description}
                </Typography>
              </Alert>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Bottlenecks */}
      {analysis && analysis.bottlenecks && analysis.bottlenecks.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Bottlenecks Detected
            </Typography>
            <IconButton onClick={() => setShowBottlenecks(!showBottlenecks)} size="small">
              {showBottlenecks ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          <Collapse in={showBottlenecks}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Work Center</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Utilization</TableCell>
                    <TableCell>Jobs</TableCell>
                    <TableCell>Severity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analysis.bottlenecks.map((bn, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{bn.workCenterName}</TableCell>
                      <TableCell>
                        <Chip label={bn.workCenterType} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${Math.round(bn.utilizationPercent)}%`}
                          color={getUtilizationColor(bn.utilizationPercent)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{bn.jobCount}</TableCell>
                      <TableCell>
                        <Chip
                          label={bn.severity}
                          color={getSeverityColor(bn.severity)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Paper>
      )}

      {/* Work Center Utilization */}
      {analysis && analysis.workCenterUtilization && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Work Center Utilization
          </Typography>
          <Grid container spacing={2}>
            {analysis.workCenterUtilization.map((wc, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {wc.workCenterName}
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                      <Typography variant="h4" color={getUtilizationColor(wc.utilizationPercent)}>
                        {wc.utilizationPercent}%
                      </Typography>
                      <Chip label={wc.workCenterType} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {wc.jobCount} jobs • {wc.totalMinutes} min
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Optimization Preview */}
      {preview && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Optimized Schedule Preview
              </Typography>
              <Typography variant="body2">
                {preview.optimizedJobs.length} jobs optimized • {preview.bottlenecks.length} bottlenecks • {preview.metrics.jobsAtRisk} at risk
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => setPreview(null)}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleApply}
                disabled={applying}
                sx={{ bgcolor: 'white', color: 'primary.main' }}
              >
                {applying ? 'Applying...' : 'Apply Schedule'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />

          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Optimized Jobs ({preview.optimizedJobs.length})
            </Typography>
            <IconButton onClick={() => setShowJobs(!showJobs)} sx={{ color: 'white' }}>
              {showJobs ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          <Collapse in={showJobs}>
            <TableContainer sx={{ bgcolor: 'white', borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Job Number</TableCell>
                    <TableCell>Work Center</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Start</TableCell>
                    <TableCell>End</TableCell>
                    <TableCell>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.optimizedJobs.slice(0, 20).map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>{job.jobNumber}</TableCell>
                      <TableCell>{job.workCenterName}</TableCell>
                      <TableCell>
                        <Chip
                          label={job.priority}
                          size="small"
                          color={job.priority === 'HOT' ? 'error' : job.priority === 'RUSH' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(job.scheduledStart).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        {new Date(job.scheduledEnd).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{job.estimatedMinutes} min</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {preview.optimizedJobs.length > 20 && (
              <Typography variant="body2" sx={{ mt: 1, color: 'white', opacity: 0.8 }}>
                Showing first 20 of {preview.optimizedJobs.length} jobs
              </Typography>
            )}
          </Collapse>
        </Paper>
      )}
    </Box>
  );
}
