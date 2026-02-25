/**
 * Ops Cockpit Dashboard — Production-Ready
 * Real-time operations command center powered by Supabase data
 * Queries live Job, Order, WorkCenter, Coil, Shipment data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  Tooltip,
  Badge,
  Alert,
  Collapse,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  Skeleton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Fade,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Psychology as AIIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  AutoAwesome as AutoIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  ThumbDown as DismissIcon,
  Info as InfoIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import {
  getOpsCockpitData,
  acceptRecommendation,
  dismissRecommendation,
  explainRecommendation,
} from '../../services/opsCockpitApi';

// ============================================
// FLOW STATE VISUALIZATION COMPONENT
// ============================================
function FlowStatePanel({ data, changes }) {
  const columns = [
    { key: 'ordered', label: 'Ordered', color: '#9e9e9e' },
    { key: 'scheduled', label: 'Scheduled', color: '#2196f3' },
    { key: 'inProcess', label: 'In Process', color: '#ff9800' },
    { key: 'packaging', label: 'Packaging / QC', color: '#9c27b0' },
    { key: 'readyToShip', label: 'Ready to Ship', color: '#4caf50' },
    { key: 'shipped', label: 'Shipped', color: '#00bcd4' },
  ];

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Flow State
        </Typography>
        <Chip icon={<CloudDoneIcon />} label="Live" size="small" color="success" variant="outlined" />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
        {columns.map((col) => {
          const count = data?.[col.key] ?? 0;
          const change = changes?.[col.key] ?? 0;
          const flowLabel = change > 0 ? `+${change}` : `${change}`;
          return (
            <Box
              key={col.key}
              sx={{
                flex: 1,
                minWidth: 100,
                textAlign: 'center',
                p: 1.5,
                borderRadius: 2,
                bgcolor: `${col.color}15`,
                border: `2px solid ${col.color}`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)' },
              }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ color: col.color }}>
                {count}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {col.label}
              </Typography>
              {change !== 0 && (
                <Chip
                  label={`${flowLabel} today`}
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: change > 0 ? 'success.light' : 'warning.light',
                    color: change > 0 ? 'success.dark' : 'warning.dark',
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

// ============================================
// PROMISE RISK PANEL
// ============================================
function PromiseRiskPanel({ hotJobs = [], atRiskJobs = [], safeCount = 0 }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Promise Risk
        </Typography>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip icon={<ErrorIcon />} label={`HOT: ${hotJobs.length}`} color="error" variant="filled" />
        <Chip icon={<WarningIcon />} label={`At Risk: ${atRiskJobs.length}`} color="warning" variant="filled" />
        <Chip icon={<CheckIcon />} label={`Safe: ${safeCount}`} color="success" variant="outlined" />
      </Box>

      <Collapse in={expanded}>
        {hotJobs.length > 0 && (
          <>
            <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
              🔴 HOT - Immediate Attention
            </Typography>
            <Stack spacing={1} sx={{ mb: 2 }}>
              {hotJobs.map((job) => (
                <Box key={job.id} sx={{ p: 1.5, borderRadius: 1, bgcolor: 'error.light', border: '1px solid', borderColor: 'error.main' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={600}>{job.id} - {job.customer}</Typography>
                    <Chip label={job.due} size="small" color="error" />
                  </Box>
                  <Typography variant="caption" color="error.dark" display="block">
                    {job.status} | Risk: {job.risk}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}

        {atRiskJobs.length > 0 && (
          <>
            <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
              🟠 At Risk - Monitor Closely
            </Typography>
            <Stack spacing={1}>
              {atRiskJobs.slice(0, 5).map((job) => (
                <Box key={job.id} sx={{ p: 1, borderRadius: 1, bgcolor: 'warning.light', border: '1px solid', borderColor: 'warning.main' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight={500}>{job.id} - {job.customer}</Typography>
                    <Chip label={job.due} size="small" color="warning" />
                  </Box>
                  <Typography variant="caption" color="warning.dark">{job.risk}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}

        {hotJobs.length === 0 && atRiskJobs.length === 0 && (
          <Alert severity="success" sx={{ mt: 1 }}>All jobs on track — no immediate risks.</Alert>
        )}
      </Collapse>
    </Paper>
  );
}

// ============================================
// WORK CENTER UTILIZATION STRIP
// ============================================
function UtilizationStrip({ workCenters = [] }) {
  const getUtilizationColor = (util, status) => {
    if (status === 'bottleneck') return 'error';
    if (util >= 90) return 'error';
    if (util >= 80) return 'warning';
    if (util < 40 && util > 0) return 'info';
    return 'success';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'bottleneck': return '🔴 BOTTLENECK';
      case 'filling': return '⚠️ Filling';
      case 'under': return '⬇️ Under';
      default: return '';
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Work Center Utilization
      </Typography>
      {workCenters.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No work centers found.</Typography>
      ) : (
        <Stack spacing={1}>
          {workCenters.map((wc) => (
            <Box
              key={wc.id}
              sx={{
                display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 1,
                bgcolor: wc.status === 'bottleneck' ? 'error.light' : 'grey.50',
              }}
            >
              <Tooltip title={`${wc.type} — ${(wc.capabilities || []).join(', ')}`}>
                <Typography variant="body2" fontWeight={500} sx={{ minWidth: 90 }}>{wc.name}</Typography>
              </Tooltip>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={wc.utilization}
                  color={getUtilizationColor(wc.utilization, wc.status)}
                  sx={{ height: 12, borderRadius: 6 }}
                />
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ minWidth: 45 }}>{wc.utilization}%</Typography>
              <Tooltip title="Queue depth • Active jobs">
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>
                  Queue: {wc.queue}h • {wc.activeJobs} jobs
                </Typography>
              </Tooltip>
              {wc.hotJobs > 0 && <Chip label={`⚠️ Hot: ${wc.hotJobs}`} size="small" color="warning" />}
              {wc.status !== 'normal' && (
                <Typography variant="caption" fontWeight={600} color={wc.status === 'bottleneck' ? 'error.main' : 'text.secondary'}>
                  {getStatusLabel(wc.status)}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

// ============================================
// EXCEPTION FEED
// ============================================
function ExceptionFeed({ exceptions = [] }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'error.light';
      case 'warning': return 'warning.light';
      default: return 'info.light';
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>Exception Feed</Typography>
        <Badge badgeContent={exceptions.length} color={exceptions.length > 0 ? 'error' : 'default'}>
          <WarningIcon color="action" />
        </Badge>
      </Box>
      {exceptions.length === 0 ? (
        <Alert severity="success">No active exceptions — all systems normal.</Alert>
      ) : (
        <Stack spacing={1} sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {exceptions.map((exc) => (
            <Box key={exc.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, bgcolor: getSeverityColor(exc.severity) }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 55 }}>{exc.time}</Typography>
              <Typography>{exc.icon}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={500}>{exc.title}</Typography>
              </Box>
              <Chip label={exc.eta} size="small" variant="outlined" />
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

// ============================================
// DAY COMPLETION FORECAST
// ============================================
function DayCompletionForecast({ forecast = {} }) {
  const probability = forecast.probability ?? 0;
  const totalJobs = forecast.totalJobs ?? 0;
  const completedToday = forecast.completedToday ?? 0;
  const scenarios = forecast.scenarios || {
    best: { jobs: 0, percent: 0, label: '-' },
    expected: { jobs: 0, percent: 0, label: '-' },
    worst: { jobs: 0, percent: 0, label: '-' },
  };
  const risks = forecast.risks || [];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Day Completion Forecast</Typography>

      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          TODAY'S TARGET: {totalJobs} jobs • {completedToday} completed so far
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
          <Box sx={{ flex: 1, maxWidth: 400 }}>
            <LinearProgress
              variant="determinate"
              value={probability}
              sx={{ height: 24, borderRadius: 12 }}
              color={probability >= 80 ? 'success' : probability >= 60 ? 'warning' : 'error'}
            />
          </Box>
          <Typography variant="h4" fontWeight={700} color={probability >= 80 ? 'success.main' : probability >= 60 ? 'warning.main' : 'error.main'}>
            {probability}%
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Confidence: {probability}% likely to complete all {totalJobs} jobs by EOD
        </Typography>
      </Box>

      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Scenario Breakdown</Typography>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        {[
          { key: 'best', label: 'Best case:', chipColor: 'success' },
          { key: 'expected', label: 'Expected:', chipColor: 'warning' },
          { key: 'worst', label: 'Worst case:', chipColor: 'error' },
        ].map(({ key, label, chipColor }) => (
          <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">{label}</Typography>
            <Chip label={`${scenarios[key].jobs}/${totalJobs} — ${scenarios[key].percent}%`} size="small" color={chipColor} />
            <Typography variant="caption" color="text.secondary">[{scenarios[key].label}]</Typography>
          </Box>
        ))}
      </Stack>

      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Risk Factors</Typography>
      <Stack spacing={0.5}>
        {risks.map((risk, idx) => (
          <Typography key={idx} variant="body2" color="text.secondary">• {risk}</Typography>
        ))}
      </Stack>
    </Paper>
  );
}

// ============================================
// AI RECOMMENDATIONS PANEL (FULLY INTERACTIVE)
// ============================================
function AIRecommendationsPanel({ recommendations = [], onRecommendationAction }) {
  const [actionLoading, setActionLoading] = useState({});
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [explanations, setExplanations] = useState({});
  const [modifyDialog, setModifyDialog] = useState({ open: false, rec: null });
  const [modifyValues, setModifyValues] = useState({ action: '', why: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, rec: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ── Accept Handler ──
  const handleAccept = async (rec) => {
    setConfirmDialog({ open: true, rec });
  };

  const confirmAccept = async () => {
    const rec = confirmDialog.rec;
    setConfirmDialog({ open: false, rec: null });
    setActionLoading((prev) => ({ ...prev, [`accept-${rec.id}`]: true }));
    try {
      const result = await acceptRecommendation(rec);
      setDismissedIds((prev) => new Set(prev).add(rec.id));
      showSnackbar(
        `✅ "${rec.title}" accepted${result.results?.length ? ` — ${result.results.length} action(s) executed` : ''}`,
        'success'
      );
      if (onRecommendationAction) onRecommendationAction('accept', rec, result);
    } catch (err) {
      showSnackbar(`Failed to accept: ${err.message}`, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`accept-${rec.id}`]: false }));
    }
  };

  // ── Dismiss Handler ──
  const handleDismiss = async (rec) => {
    setActionLoading((prev) => ({ ...prev, [`dismiss-${rec.id}`]: true }));
    try {
      await dismissRecommendation(rec, 'Operator dismissed');
      setDismissedIds((prev) => new Set(prev).add(rec.id));
      showSnackbar(`Dismissed "${rec.title}"`, 'info');
      if (onRecommendationAction) onRecommendationAction('dismiss', rec);
    } catch (err) {
      showSnackbar(`Failed to dismiss: ${err.message}`, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`dismiss-${rec.id}`]: false }));
    }
  };

  // ── Explain Handler ──
  const handleExplain = async (rec) => {
    // Toggle: if already showing, collapse it
    if (explanations[rec.id]) {
      setExplanations((prev) => {
        const updated = { ...prev };
        delete updated[rec.id];
        return updated;
      });
      return;
    }

    setActionLoading((prev) => ({ ...prev, [`explain-${rec.id}`]: true }));
    try {
      const result = await explainRecommendation(rec);
      setExplanations((prev) => ({ ...prev, [rec.id]: result.explanation }));
    } catch (err) {
      showSnackbar(`Failed to get explanation: ${err.message}`, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`explain-${rec.id}`]: false }));
    }
  };

  // ── Modify Handler ──
  const handleModifyOpen = (rec) => {
    setModifyValues({ action: rec.action, why: rec.why });
    setModifyDialog({ open: true, rec });
  };

  const handleModifySubmit = async () => {
    const rec = modifyDialog.rec;
    setModifyDialog({ open: false, rec: null });
    setActionLoading((prev) => ({ ...prev, [`modify-${rec.id}`]: true }));
    try {
      const result = await acceptRecommendation(rec, {
        action: modifyValues.action,
        why: modifyValues.why,
      });
      setDismissedIds((prev) => new Set(prev).add(rec.id));
      showSnackbar(
        `✅ "${rec.title}" accepted with modifications${result.results?.length ? ` — ${result.results.length} action(s) executed` : ''}`,
        'success'
      );
      if (onRecommendationAction) onRecommendationAction('modify', rec, result);
    } catch (err) {
      showSnackbar(`Failed to modify & accept: ${err.message}`, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`modify-${rec.id}`]: false }));
    }
  };

  const visibleRecs = recommendations.filter((r) => !dismissedIds.has(r.id));

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>AI Interventions</Typography>
        </Box>
        <Chip
          label={`${visibleRecs.length} recommendation${visibleRecs.length !== 1 ? 's' : ''}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {visibleRecs.length === 0 ? (
        <Alert severity="info">
          {dismissedIds.size > 0
            ? `All ${dismissedIds.size} recommendation(s) handled — no pending items.`
            : 'No AI recommendations at this time.'}
        </Alert>
      ) : (
        <Stack spacing={2}>
          {visibleRecs.map((rec) => {
            const isAccepting = actionLoading[`accept-${rec.id}`];
            const isDismissing = actionLoading[`dismiss-${rec.id}`];
            const isExplaining = actionLoading[`explain-${rec.id}`];
            const isModifying = actionLoading[`modify-${rec.id}`];
            const isAnyLoading = isAccepting || isDismissing || isExplaining || isModifying;
            const explanation = explanations[rec.id];

            return (
              <Fade in key={rec.id}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'primary.light',
                    bgcolor: 'primary.50',
                    opacity: isAnyLoading ? 0.7 : 1,
                    transition: 'opacity 0.3s, transform 0.3s',
                    position: 'relative',
                  }}
                >
                  {/* Loading overlay */}
                  {isAnyLoading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.5)',
                        borderRadius: 2,
                        zIndex: 1,
                      }}
                    >
                      <CircularProgress size={32} />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={`#${rec.priority}`} size="small" color="primary" />
                      <Typography variant="subtitle1" fontWeight={600}>{rec.title}</Typography>
                    </Box>
                    <Chip label={`${rec.confidence}% confident`} size="small" variant="outlined" />
                  </Box>

                  <Typography variant="body2" fontWeight={500} color="primary.dark" sx={{ mb: 1 }}>
                    Action: {rec.action}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Why: {rec.why}
                  </Typography>
                  <Typography variant="body2" color="success.main" fontWeight={500} sx={{ mb: 2 }}>
                    Impact: {rec.impact}
                  </Typography>

                  {/* AI Explanation (collapsible) */}
                  <Collapse in={!!explanation}>
                    {explanation && (
                      <Box
                        sx={{
                          mb: 2,
                          p: 2,
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'info.light',
                          maxHeight: 300,
                          overflowY: 'auto',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <InfoIcon color="info" fontSize="small" />
                          <Typography variant="subtitle2" fontWeight={600} color="info.main">
                            AI Deep Analysis
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                        >
                          {explanation}
                        </Typography>
                      </Box>
                    )}
                  </Collapse>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleAccept(rec)}
                      disabled={isAnyLoading}
                      startIcon={isAccepting ? <CircularProgress size={14} /> : <CheckIcon />}
                    >
                      Accept
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleModifyOpen(rec)}
                      disabled={isAnyLoading}
                      startIcon={isModifying ? <CircularProgress size={14} /> : <EditIcon />}
                    >
                      Modify
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => handleExplain(rec)}
                      disabled={isAnyLoading}
                      startIcon={isExplaining ? <CircularProgress size={14} /> : <AIIcon />}
                    >
                      {explanation ? 'Hide Analysis' : 'Explain More'}
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      color="inherit"
                      onClick={() => handleDismiss(rec)}
                      disabled={isAnyLoading}
                      startIcon={isDismissing ? <CircularProgress size={14} /> : <DismissIcon />}
                      sx={{ ml: 'auto', color: 'text.secondary' }}
                    >
                      Dismiss
                    </Button>
                  </Box>
                </Box>
              </Fade>
            );
          })}
        </Stack>
      )}

      {/* ── Accept Confirmation Dialog ── */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, rec: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckIcon color="primary" />
          Confirm AI Recommendation
        </DialogTitle>
        <DialogContent>
          {confirmDialog.rec && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                This will execute the recommended action on your production data.
              </Alert>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Recommendation:</Typography>
                <Typography variant="body2">{confirmDialog.rec.title}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Action to Execute:</Typography>
                <Typography variant="body2">{confirmDialog.rec.action}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Expected Impact:</Typography>
                <Typography variant="body2" color="success.main">{confirmDialog.rec.impact}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Confidence:</Typography>
                <Chip label={`${confirmDialog.rec.confidence}%`} size="small" color="primary" />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, rec: null })}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={confirmAccept} startIcon={<CheckIcon />}>
            Confirm & Execute
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modify Dialog ── */}
      <Dialog
        open={modifyDialog.open}
        onClose={() => setModifyDialog({ open: false, rec: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          Modify Recommendation
        </DialogTitle>
        <DialogContent>
          {modifyDialog.rec && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                Edit the recommended action before accepting. Your modifications will be logged.
              </Alert>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Original: {modifyDialog.rec.title}
                </Typography>
              </Box>
              <TextField
                label="Action"
                multiline
                rows={3}
                fullWidth
                value={modifyValues.action}
                onChange={(e) => setModifyValues((v) => ({ ...v, action: e.target.value }))}
                helperText="Modify the action to be taken"
              />
              <TextField
                label="Rationale"
                multiline
                rows={2}
                fullWidth
                value={modifyValues.why}
                onChange={(e) => setModifyValues((v) => ({ ...v, why: e.target.value }))}
                helperText="Update the reasoning if needed"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModifyDialog({ open: false, rec: null })}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleModifySubmit}
            startIcon={<CheckIcon />}
            disabled={!modifyValues.action.trim()}
          >
            Accept with Modifications
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar Notifications ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

// ============================================
// STAGING & SHIPPING PANEL
// ============================================
function StagingShippingPanel({ data = {} }) {
  const staging = data.staging || {};
  const dispatched = data.dispatched || {};
  const noCarrierCount = data.noCarrierCount || 0;
  const carrierEntries = dispatched.byCarrier ? Object.entries(dispatched.byCarrier) : [];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Staging & Shipping</Typography>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>Staging ({staging.total || 0} jobs)</Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Ready to Ship:</Typography>
              <Typography variant="body2" fontWeight={500}>{staging.readyToShip || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">In Packaging/QC:</Typography>
              <Typography variant="body2" fontWeight={500}>{staging.packaging || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Pending Shipments:</Typography>
              <Typography variant="body2" fontWeight={500}>{staging.pendingShipments || 0}</Typography>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>Shipments by Carrier</Typography>
          {carrierEntries.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No shipments recorded</Typography>
          ) : (
            <Stack spacing={0.5}>
              {carrierEntries.map(([carrier, info]) => (
                <Box key={carrier} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 80 }}>{carrier}</Typography>
                  <Typography variant="caption" color="text.secondary">{info.shipped}/{info.total} shipped</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Grid>
        <Grid item xs={3}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>Today's Activity</Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Shipped:</Typography>
              <Typography variant="body2" fontWeight={700}>{dispatched.total || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Pending:</Typography>
              <Typography variant="body2" fontWeight={500}>{dispatched.pendingPickup || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Total Today:</Typography>
              <Typography variant="body2" fontWeight={500}>{data.totalShipmentsToday || 0}</Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
      {noCarrierCount > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          ⚠️ {noCarrierCount} confirmed order{noCarrierCount !== 1 ? 's' : ''} without carrier/shipment assignment
        </Alert>
      )}
    </Paper>
  );
}

// ============================================
// MATERIAL AVAILABILITY PANEL
// ============================================
function MaterialAvailabilityPanel({ data = {} }) {
  const stockouts = data.stockouts || [];
  const lowStock = data.lowStock || [];
  const inbound = data.inbound || [];
  const summary = data.summary || {};

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>Material Availability</Typography>
        <Chip label={`${summary.totalCoils || 0} coils • ${((summary.totalWeightLb || 0) / 1000).toFixed(0)}k lbs`} size="small" variant="outlined" />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label={`Available: ${summary.available || 0}`} size="small" color="success" variant="filled" />
        <Chip label={`Allocated: ${summary.allocated || 0}`} size="small" color="info" variant="filled" />
        {(summary.held || 0) > 0 && <Chip label={`On Hold: ${summary.held}`} size="small" color="warning" variant="filled" />}
      </Box>

      {stockouts.length > 0 && (
        <>
          <Typography variant="subtitle2" color="error.main" fontWeight={600} sx={{ mb: 1 }}>🔴 Stock Outs (blocking work)</Typography>
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            {stockouts.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="body2">{item.material}</Typography>
                <Typography variant="caption">Need: {item.need} | Have: {item.have}</Typography>
                <Chip label={item.eta} size="small" />
              </Box>
            ))}
          </Stack>
        </>
      )}

      {lowStock.length > 0 && (
        <>
          <Typography variant="subtitle2" color="warning.main" fontWeight={600} sx={{ mb: 1 }}>🟡 Low Stock</Typography>
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            {lowStock.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="body2">{item.material}</Typography>
                <Typography variant="caption">Stock: {item.stock}%</Typography>
                <Chip label={item.status} size="small" variant="outlined" />
              </Box>
            ))}
          </Stack>
        </>
      )}

      {inbound.length > 0 && (
        <>
          <Typography variant="subtitle2" color="success.main" fontWeight={600} sx={{ mb: 1 }}>🟢 Recent Inbound</Typography>
          <Stack spacing={0.5}>
            {inbound.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">{item.source}</Typography>
                <Typography variant="caption">{item.desc}</Typography>
                <Chip label={item.eta} size="small" color="success" variant="outlined" />
              </Box>
            ))}
          </Stack>
        </>
      )}

      {stockouts.length === 0 && lowStock.length === 0 && inbound.length === 0 && (
        <Alert severity="success">All materials in stock — no shortages detected.</Alert>
      )}
    </Paper>
  );
}

// ============================================
// LOADING SKELETON
// ============================================
function CockpitSkeleton() {
  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Skeleton variant="rectangular" height={120} sx={{ mb: 3, borderRadius: 2 }} />
      <Grid container spacing={3}>
        {[1, 2, 3].map(i => (
          <Grid item xs={12} md={4} key={i}>
            <Stack spacing={3}>
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Stack>
          </Grid>
        ))}
        <Grid item xs={12} md={6}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Grid>
      </Grid>
    </Box>
  );
}

// ============================================
// MAIN OPS COCKPIT COMPONENT
// ============================================
export default function OpsCockpitPage() {
  const [cockpitData, setCockpitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const data = await getOpsCockpitData();
      setCockpitData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Ops Cockpit fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleRefresh = useCallback(() => { fetchData(true); }, [fetchData]);

  // Callback when any recommendation action is taken — refresh data to reflect changes
  const handleRecommendationAction = useCallback((action, rec, result) => {
    // Re-fetch after a brief delay so the backend has time to commit changes
    setTimeout(() => fetchData(), 1500);
  }, [fetchData]);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)' }}>
      {/* Header */}
      <Box sx={{
        px: 3, py: 2.5,
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
        mb: 3,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <SpeedIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>Ops Cockpit</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Live Production Data • {cockpitData?.summary?.totalJobs || 0} Jobs • {cockpitData?.summary?.totalOrders || 0} Orders • {cockpitData?.summary?.totalCoils || 0} Coils
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {error && <Chip icon={<CloudOffIcon sx={{ color: 'inherit !important' }} />} label="Connection Error" size="small" sx={{ bgcolor: 'error.dark', color: 'white' }} />}
            <Chip
              icon={<ScheduleIcon sx={{ color: 'inherit !important' }} />}
              label={lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}
            />
            <ToggleButtonGroup
              value={autoRefresh ? 'auto' : 'manual'}
              exclusive
              size="small"
              onChange={(e, val) => val && setAutoRefresh(val === 'auto')}
              sx={{
                '& .MuiToggleButton-root': {
                  color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.3)',
                  '&.Mui-selected': { color: 'white', bgcolor: 'rgba(255,255,255,0.2)' },
                },
              }}
            >
              <ToggleButton value="auto">Auto</ToggleButton>
              <ToggleButton value="manual">Manual</ToggleButton>
            </ToggleButtonGroup>
            <IconButton onClick={handleRefresh} sx={{ color: 'white' }} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <RefreshIcon />}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {error && (
        <Box sx={{ px: 3, mb: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            Failed to load cockpit data: {error}. Showing last known state.
          </Alert>
        </Box>
      )}

      {loading && !cockpitData ? (
        <CockpitSkeleton />
      ) : cockpitData ? (
        <Box sx={{ px: 3, pb: 3 }}>
          <Box sx={{ mb: 3 }}>
            <FlowStatePanel data={cockpitData.flowState} changes={cockpitData.flowChanges} />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <PromiseRiskPanel
                  hotJobs={cockpitData.promiseRisk?.hotJobs || []}
                  atRiskJobs={cockpitData.promiseRisk?.atRiskJobs || []}
                  safeCount={cockpitData.promiseRisk?.safeCount || 0}
                />
                <ExceptionFeed exceptions={cockpitData.exceptions || []} />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <UtilizationStrip workCenters={cockpitData.workCenterUtilization || []} />
                <DayCompletionForecast forecast={cockpitData.forecast || {}} />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <AIRecommendationsPanel
                  recommendations={cockpitData.recommendations || []}
                  onRecommendationAction={handleRecommendationAction}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <StagingShippingPanel data={cockpitData.shipping || {}} />
            </Grid>
            <Grid item xs={12} md={6}>
              <MaterialAvailabilityPanel data={cockpitData.material || {}} />
            </Grid>
          </Grid>
        </Box>
      ) : null}
    </Box>
  );
}
