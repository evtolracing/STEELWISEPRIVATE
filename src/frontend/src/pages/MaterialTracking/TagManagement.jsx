import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  TextField, InputAdornment, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, CircularProgress, Tabs, Tab, Tooltip,
} from '@mui/material';
import {
  Search, QrCode2, Print, CheckCircle, Cancel, Refresh,
  Visibility, PlayArrow, Warning,
} from '@mui/icons-material';
import { getDropTags, printDropTag, applyDropTag, voidDropTag, getTagsReadyToPrint } from '../../api/materialTracking';

const statusColors = {
  DRAFT: 'default',
  READY_TO_PRINT: 'info',
  PRINTED: 'warning',
  APPLIED: 'success',
  SEALED: 'primary',
  STAGED: 'secondary',
  LOADED: 'info',
  SHIPPED: 'success',
  DELIVERED: 'success',
  VOID: 'error',
};

const TagManagement = () => {
  const [tags, setTags] = useState([]);
  const [readyToPrint, setReadyToPrint] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allTags, printReady] = await Promise.all([
        getDropTags({ limit: 100 }).catch(() => ({ tags: [], total: 0 })),
        getTagsReadyToPrint().catch(() => []),
      ]);
      setTags(allTags.tags || allTags || []);
      setReadyToPrint(Array.isArray(printReady) ? printReady : []);
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePrint = async (tagId) => {
    try {
      await printDropTag(tagId, { copies: 1 });
      setSnackbar({ open: true, message: 'Tag sent to printer', severity: 'success' });
      loadData();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Print failed', severity: 'error' });
    }
  };

  const handleApply = async (tagId) => {
    try {
      await applyDropTag(tagId, {});
      setSnackbar({ open: true, message: 'Tag applied successfully', severity: 'success' });
      loadData();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Apply failed', severity: 'error' });
    }
  };

  const handleVoid = async () => {
    if (!selectedTag || !voidReason) return;
    try {
      await voidDropTag(selectedTag.id, { reason: voidReason });
      setSnackbar({ open: true, message: 'Tag voided', severity: 'warning' });
      setVoidOpen(false);
      setVoidReason('');
      setSelectedTag(null);
      loadData();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Void failed', severity: 'error' });
    }
  };

  const filteredTags = (Array.isArray(tags) ? tags : []).filter(tag => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (tag.dropTagId || '').toLowerCase().includes(q) ||
           (tag.grade || '').toLowerCase().includes(q) ||
           (tag.heatNumber || '').toLowerCase().includes(q) ||
           (tag.customer?.name || '').toLowerCase().includes(q);
  });

  const tabTags = tab === 0 ? filteredTags
    : tab === 1 ? filteredTags.filter(t => t.status === 'READY_TO_PRINT')
    : tab === 2 ? filteredTags.filter(t => t.status === 'PRINTED')
    : tab === 3 ? filteredTags.filter(t => ['APPLIED', 'SEALED'].includes(t.status))
    : tab === 4 ? filteredTags.filter(t => t.status === 'VOID')
    : filteredTags;

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
          <Typography variant="h4" fontWeight={700}>Tag Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Generate, print, apply, and track material identity tags
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>Refresh</Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Tags', value: tags.length, color: 'primary' },
          { label: 'Ready to Print', value: readyToPrint.length, color: 'info' },
          { label: 'Printed', value: tags.filter(t => t.status === 'PRINTED').length, color: 'warning' },
          { label: 'Applied', value: tags.filter(t => ['APPLIED', 'SEALED'].includes(t.status)).length, color: 'success' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" fontWeight={700} color={`${s.color}.main`}>{s.value}</Typography>
                <Typography variant="caption">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label={`All (${filteredTags.length})`} />
          <Tab label={`Ready to Print (${filteredTags.filter(t => t.status === 'READY_TO_PRINT').length})`} />
          <Tab label={`Printed (${filteredTags.filter(t => t.status === 'PRINTED').length})`} />
          <Tab label={`Applied (${filteredTags.filter(t => ['APPLIED', 'SEALED'].includes(t.status)).length})`} />
          <Tab label={`Voided (${filteredTags.filter(t => t.status === 'VOID').length})`} />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField fullWidth size="small"
          placeholder="Search by tag ID, grade, heat number, customer..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
      </Paper>

      {/* Tags Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 600 }}>Tag ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Heat #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Pieces</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Weight (lbs)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tabTags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {tags.length === 0 ? 'No tags found. Tags are generated when packages are created.' : 'No matching tags'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tabTags.map((tag) => (
                <TableRow key={tag.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {tag.dropTagId}
                    </Typography>
                  </TableCell>
                  <TableCell>{tag.grade || '-'}</TableCell>
                  <TableCell>{tag.heatNumber || '-'}</TableCell>
                  <TableCell>{tag.pieces || '-'}</TableCell>
                  <TableCell>{tag.weightLbs ? Number(tag.weightLbs).toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={tag.status.replace(/_/g, ' ')}
                      size="small"
                      color={statusColors[tag.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(tag.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => { setSelectedTag(tag); setDetailOpen(true); }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {tag.status === 'READY_TO_PRINT' && (
                        <Tooltip title="Print Tag">
                          <IconButton size="small" color="info" onClick={() => handlePrint(tag.id)}>
                            <Print fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {tag.status === 'PRINTED' && (
                        <Tooltip title="Apply Tag">
                          <IconButton size="small" color="success" onClick={() => handleApply(tag.id)}>
                            <PlayArrow fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!['VOID', 'SHIPPED', 'DELIVERED'].includes(tag.status) && (
                        <Tooltip title="Void Tag">
                          <IconButton size="small" color="error"
                            onClick={() => { setSelectedTag(tag); setVoidOpen(true); }}>
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tag Details: {selectedTag?.dropTagId}</DialogTitle>
        <DialogContent>
          {selectedTag && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {[
                { label: 'Status', value: selectedTag.status?.replace(/_/g, ' ') },
                { label: 'Grade', value: selectedTag.grade },
                { label: 'Form', value: selectedTag.form },
                { label: 'Heat Number', value: selectedTag.heatNumber },
                { label: 'Specification', value: selectedTag.specification },
                { label: 'Pieces', value: selectedTag.pieces },
                { label: 'Weight', value: `${Number(selectedTag.weightLbs || 0).toLocaleString()} lbs` },
                { label: 'Bundle Type', value: selectedTag.bundleType },
                { label: 'Created', value: new Date(selectedTag.createdAt).toLocaleString() },
                { label: 'Printed', value: selectedTag.printedAt ? new Date(selectedTag.printedAt).toLocaleString() : 'Not printed' },
                { label: 'Applied', value: selectedTag.appliedAt ? new Date(selectedTag.appliedAt).toLocaleString() : 'Not applied' },
              ].map((item) => (
                <Grid item xs={6} key={item.label}>
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{item.value || '-'}</Typography>
                </Grid>
              ))}
              {selectedTag.packagingNotes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Packaging Notes</Typography>
                  <Typography variant="body2">{selectedTag.packagingNotes}</Typography>
                </Grid>
              )}
              {selectedTag.specialInstructions && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Special Instructions</Typography>
                  <Alert severity="warning" sx={{ mt: 0.5 }}>{selectedTag.specialInstructions}</Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Void Dialog */}
      <Dialog open={voidOpen} onClose={() => setVoidOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Void Tag: {selectedTag?.dropTagId}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Voiding a tag is permanent. The tag cannot be used after voiding.
          </Alert>
          <TextField
            fullWidth label="Void Reason" multiline rows={3}
            value={voidReason} onChange={(e) => setVoidReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setVoidOpen(false); setVoidReason(''); }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleVoid}
            disabled={!voidReason.trim()}>
            Void Tag
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

export default TagManagement;
