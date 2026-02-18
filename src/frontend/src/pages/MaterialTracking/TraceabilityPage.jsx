import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  TextField, InputAdornment, Alert, Snackbar, CircularProgress,
  Stepper, Step, StepLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from '@mui/material';
import {
  Search, Timeline, Refresh, Schedule, CheckCircle,
  LocalShipping, Inventory2, QrCode2, Warning,
} from '@mui/icons-material';
import { getCustodyLog, getJobTimeline, createCustodyEntry } from '../../api/materialTracking';
import { getJobs } from '../../api/jobs';

const eventIcons = {
  JOB_CREATED: <Schedule color="info" />,
  JOB_STATUS_PACKAGING: <Inventory2 color="info" />,
  JOB_STATUS_READY_TO_SHIP: <CheckCircle color="success" />,
  JOB_STATUS_SHIPPED: <LocalShipping color="primary" />,
  JOB_SHIPPED: <LocalShipping color="primary" />,
  QC_PASS: <CheckCircle color="success" />,
  QC_FAIL: <Warning color="error" />,
  DROP_TAG_GENERATED: <QrCode2 color="secondary" />,
  DROP_TAG_PRINTED: <QrCode2 color="info" />,
  DROP_TAG_APPLIED: <QrCode2 color="success" />,
};

const TraceabilityPage = () => {
  const [events, setEvents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobTimeline, setJobTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ eventType: '', resourceType: 'Job', resourceId: '', metadata: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [logData, jobsData] = await Promise.all([
        getCustodyLog({ limit: 100 }).catch(() => ({ events: [], total: 0 })),
        getJobs({ status: 'WAITING_QC,PACKAGING,READY_TO_SHIP,SHIPPED,COMPLETED' }).catch(() => []),
      ]);
      setEvents(logData.events || []);
      setJobs(jobsData);
    } catch (err) {
      console.error('Failed to load traceability data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Load timeline when a job is selected
  useEffect(() => {
    if (!selectedJobId) {
      setJobTimeline(null);
      return;
    }
    const loadTimeline = async () => {
      try {
        const data = await getJobTimeline(selectedJobId);
        setJobTimeline(data);
      } catch (err) {
        console.error('Failed to load job timeline:', err);
        setJobTimeline(null);
      }
    };
    loadTimeline();
  }, [selectedJobId]);

  const handleAddEntry = async () => {
    try {
      const data = {
        eventType: newEntry.eventType,
        resourceType: newEntry.resourceType,
        resourceId: newEntry.resourceId || selectedJobId,
        metadata: newEntry.metadata ? { note: newEntry.metadata } : undefined,
      };
      await createCustodyEntry(data);
      setSnackbar({ open: true, message: 'Custody entry added', severity: 'success' });
      setAddEntryOpen(false);
      setNewEntry({ eventType: '', resourceType: 'Job', resourceId: '', metadata: '' });
      loadData();
      if (selectedJobId) {
        const tl = await getJobTimeline(selectedJobId);
        setJobTimeline(tl);
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to add entry', severity: 'error' });
    }
  };

  const filteredEvents = events.filter(evt => {
    if (eventTypeFilter && evt.eventType !== eventTypeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (evt.eventType || '').toLowerCase().includes(q) ||
           (evt.actorName || '').toLowerCase().includes(q) ||
           (evt.resourceId || '').toLowerCase().includes(q);
  });

  // Get unique event types for filter
  const eventTypes = [...new Set(events.map(e => e.eventType))].sort();

  // Pipeline steps
  const pipelineSteps = ['SCHEDULED', 'IN_PROGRESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'SHIPPED'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Traceability</Typography>
          <Typography variant="body2" color="text.secondary">
            Chain of custody, audit trail, and material lifecycle tracking
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => setAddEntryOpen(true)}>Add Entry</Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>Refresh</Button>
        </Box>
      </Box>

      {/* Job Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Track a specific job through the pipeline
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Select Job</InputLabel>
          <Select label="Select Job" value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}>
            <MenuItem value="">All Events (Global Log)</MenuItem>
            {jobs.map((job) => (
              <MenuItem key={job.id} value={job.id}>
                {job.jobNumber} - {job.customerName || 'Unknown'} ({job.status})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Job Timeline (when a specific job is selected) */}
      {jobTimeline && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Job Timeline: {jobTimeline.job.jobNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {jobTimeline.job.customerName || 'Unknown Customer'} &bull; Status: {jobTimeline.job.status}
          </Typography>

          {/* Pipeline Progress */}
          <Stepper
            activeStep={pipelineSteps.indexOf(jobTimeline.job.status)}
            alternativeLabel
            sx={{ mb: 3 }}
          >
            {pipelineSteps.map((step) => (
              <Step key={step} completed={pipelineSteps.indexOf(step) <= pipelineSteps.indexOf(jobTimeline.job.status)}>
                <StepLabel>{step.replace(/_/g, ' ')}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Timeline Events */}
          {jobTimeline.timeline.length === 0 ? (
            <Alert severity="info">No events recorded for this job yet</Alert>
          ) : (
            <Box>
              {jobTimeline.timeline.map((evt, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ mt: 0.5 }}>
                    {eventIcons[evt.event] || <Timeline color="action" />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body2" fontWeight={600}>
                        {evt.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(evt.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    {evt.previousState && evt.newState && (
                      <Typography variant="caption" color="text.secondary">
                        {evt.previousState} &rarr; {evt.newState}
                      </Typography>
                    )}
                    {evt.details && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {evt.details}
                      </Typography>
                    )}
                    {evt.actor && (
                      <Typography variant="caption" color="text.secondary">
                        By: {evt.actor}
                      </Typography>
                    )}
                    {idx < jobTimeline.timeline.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Global Custody Log */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        {selectedJobId ? 'Related Custody Log' : 'Global Custody Log'}
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small"
              placeholder="Search events..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select label="Event Type" value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}>
                <MenuItem value="">All Types</MenuItem>
                {eventTypes.map((t) => (
                  <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Events Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Resource</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>State Change</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actor</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tag</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {events.length === 0
                      ? 'No custody events recorded yet. Events are auto-logged when jobs move through the pipeline.'
                      : 'No matching events'
                    }
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((evt) => (
                <TableRow key={evt.id} hover>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(evt.occurredAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={evt.eventType.replace(/_/g, ' ')}
                      size="small"
                      color={
                        evt.eventType.includes('SHIPPED') ? 'success'
                          : evt.eventType.includes('VOID') ? 'error'
                          : evt.eventType.includes('PRINT') ? 'info'
                          : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{evt.resourceType}: {evt.resourceId.slice(0, 8)}...</Typography>
                  </TableCell>
                  <TableCell>
                    {evt.previousState && evt.newState ? (
                      <Typography variant="caption">
                        {evt.previousState} &rarr; {evt.newState}
                      </Typography>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{evt.actorName || evt.actorUserId}</Typography>
                  </TableCell>
                  <TableCell>
                    {evt.dropTag ? (
                      <Typography variant="caption" color="primary.main" fontWeight={600}>
                        {evt.dropTag.dropTagId}
                      </Typography>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Entry Dialog */}
      <Dialog open={addEntryOpen} onClose={() => setAddEntryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Custody Log Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select label="Event Type" value={newEntry.eventType}
                  onChange={(e) => setNewEntry({ ...newEntry, eventType: e.target.value })}>
                  <MenuItem value="LOCATION_TRANSFER">Location Transfer</MenuItem>
                  <MenuItem value="CUSTODY_HANDOFF">Custody Handoff</MenuItem>
                  <MenuItem value="DAMAGE_REPORT">Damage Report</MenuItem>
                  <MenuItem value="HOLD_PLACED">Hold Placed</MenuItem>
                  <MenuItem value="HOLD_RELEASED">Hold Released</MenuItem>
                  <MenuItem value="NOTE">General Note</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes / Details" multiline rows={3}
                value={newEntry.metadata}
                onChange={(e) => setNewEntry({ ...newEntry, metadata: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddEntryOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddEntry}
            disabled={!newEntry.eventType || !selectedJobId}>
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TraceabilityPage;
