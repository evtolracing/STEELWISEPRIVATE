/**
 * PrintQueueDrawer
 * Floating badge + slide-out drawer showing pending auto-queued print jobs.
 * Polls every 15 seconds for new items.
 * Lets operators: Print (opens browser dialog) | Skip | View history
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  Fade,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Snackbar,
  Alert,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Paper,
} from '@mui/material';
import {
  Print as PrintIcon,
  Close as CloseIcon,
  SkipNext as SkipIcon,
  CheckCircle as DoneIcon,
  Schedule as PendingIcon,
  History as HistoryIcon,
  Label as TagIcon,
  LocalShipping as ShipIcon,
  Description as DocIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenIcon,
  Add as AddIcon,
  Replay as ReprintIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  getPrintQueue,
  confirmPrinted,
  skipPrintJob,
  openPrintWindow,
  triggerPrintJob,
  reprintJob,
  getPrintQueueHistory,
} from '../../services/printQueueApi';

// ── Tag type metadata ──────────────────────────────────────────────────────────
const TAG_META = {
  DTL_TAG:        { label: 'DTL Tag',       icon: <TagIcon />,   color: 'primary' },
  BUNDLE_TAG:     { label: 'Bundle Tag',    icon: <TagIcon />,   color: 'secondary' },
  SHIPPING_LABEL: { label: 'Shipping Label',icon: <ShipIcon />,  color: 'warning' },
  BOL:            { label: 'Bill of Lading',icon: <DocIcon />,   color: 'error' },
  PACKING_LIST:   { label: 'Packing List',  icon: <DocIcon />,   color: 'default' },
};

const STATUS_COLOR = {
  PENDING: 'warning',
  PRINTED: 'success',
  SKIPPED: 'default',
};

// ── Individual queue item row ──────────────────────────────────────────────────
function QueueItem({ item, onPrint, onSkip, loading }) {
  const meta = TAG_META[item.type] || { label: item.type, icon: <PrintIcon />, color: 'default' };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 1,
        border: '1px solid',
        borderColor: item.priority === 'HIGH' ? 'error.light' : 'divider',
        borderRadius: 2,
        bgcolor: item.priority === 'HIGH' ? 'error.50' : 'background.paper',
        opacity: loading ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, flex: 1 }}>
          <Chip
            icon={meta.icon}
            label={meta.label}
            size="small"
            color={meta.color}
            sx={{ maxWidth: 130 }}
          />
          {item.priority === 'HIGH' && (
            <Chip label="HIGH" size="small" color="error" variant="filled" sx={{ fontSize: '0.65rem', height: 18 }} />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>

      <Typography variant="body2" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
        {item.label}
      </Typography>

      {item.payload?.customerName && item.payload.customerName !== 'N/A' && (
        <Typography variant="caption" color="text.secondary" display="block">
          {item.payload.customerName}
          {item.payload.orderNumber && item.payload.orderNumber !== 'N/A'
            ? ` · ${item.payload.orderNumber}`
            : ''}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={14} /> : <OpenIcon />}
          disabled={loading}
          onClick={() => onPrint(item)}
          sx={{ flex: 1 }}
        >
          Print
        </Button>
        <Tooltip title="Skip — won't reprint automatically">
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<SkipIcon />}
            disabled={loading}
            onClick={() => onSkip(item)}
            sx={{ color: 'text.secondary' }}
          >
            Skip
          </Button>
        </Tooltip>
      </Box>
    </Paper>
  );
}

// ── History item row ───────────────────────────────────────────────────────────
function HistoryItem({ item, onReprint, reprintLoading }) {
  const meta = TAG_META[item.type] || { label: item.type, icon: <PrintIcon />, color: 'default' };
  return (
    <ListItem
      dense
      disablePadding
      sx={{ py: 0.5 }}
      secondaryAction={
        <Tooltip title="Reprint this tag">
          <IconButton
            edge="end"
            size="small"
            onClick={() => onReprint(item)}
            disabled={reprintLoading}
            sx={{ color: 'primary.main' }}
          >
            <ReprintIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={meta.label} size="small" color={meta.color} sx={{ fontSize: '0.65rem', height: 18 }} />
            <Typography variant="caption" fontWeight={600} noWrap>{item.label}</Typography>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', gap: 1, mt: 0.25, alignItems: 'center' }}>
            <Chip
              label={item.status}
              size="small"
              color={STATUS_COLOR[item.status] || 'default'}
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 16 }}
            />
            <Typography variant="caption" color="text.secondary">
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
}

// ── Main Drawer component ──────────────────────────────────────────────────────
export default function PrintQueueDrawer() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef(null);

  // Manual print form state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualJobNumber, setManualJobNumber] = useState('');
  const [manualTagType, setManualTagType] = useState('DTL_TAG');
  const [manualLoading, setManualLoading] = useState(false);
  const [reprintLoading, setReprintLoading] = useState(false);

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── Fetch queue ──────────────────────────────────────────────────────────────
  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setPolling(true);
    try {
      const data = await getPrintQueue();
      setQueue(data.queue || []);
    } catch (_) {
      // Silent fail — don't disrupt the user
    } finally {
      if (!silent) setPolling(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getPrintQueueHistory(30);
      setHistory(data.history || []);
    } catch (_) {}
  }, []);

  // Initial load + interval polling (every 15s)
  useEffect(() => {
    fetchQueue();
    intervalRef.current = setInterval(() => fetchQueue(true), 15000);
    return () => clearInterval(intervalRef.current);
  }, [fetchQueue]);

  // Load history when tab switches to history
  useEffect(() => {
    if (tab === 1) fetchHistory();
  }, [tab, fetchHistory]);

  // ── Print handler ────────────────────────────────────────────────────────────
  const handlePrint = useCallback(async (item) => {
    const win = openPrintWindow(item.id);
    if (!win) {
      showSnackbar('Pop-up blocked. Allow pop-ups for this site.', 'warning');
      return;
    }

    setLoadingId(item.id);
    try {
      await confirmPrinted(item.id);
      setQueue((prev) => prev.filter((j) => j.id !== item.id));
      showSnackbar(`✅ "${item.label}" marked as printed`);
    } catch (err) {
      showSnackbar(`Failed to confirm print: ${err.message}`, 'error');
    } finally {
      setLoadingId(null);
    }
  }, []);

  // ── Skip handler ─────────────────────────────────────────────────────────────
  const handleSkip = useCallback(async (item) => {
    setLoadingId(item.id);
    try {
      await skipPrintJob(item.id, 'Operator skipped');
      setQueue((prev) => prev.filter((j) => j.id !== item.id));
      showSnackbar(`Skipped "${item.label}"`, 'info');
    } catch (err) {
      showSnackbar(`Failed to skip: ${err.message}`, 'error');
    } finally {
      setLoadingId(null);
    }
  }, []);

  // ── Manual print handler ────────────────────────────────────────────────────
  const handleManualPrint = useCallback(async () => {
    if (!manualJobNumber.trim()) {
      showSnackbar('Enter a job number', 'warning');
      return;
    }
    setManualLoading(true);
    try {
      const result = await triggerPrintJob({
        jobNumber: manualJobNumber.trim().toUpperCase(),
        type: manualTagType,
        force: true,
      });
      showSnackbar(`✅ ${result.message}`, 'success');
      setManualJobNumber('');
      fetchQueue();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setManualLoading(false);
    }
  }, [manualJobNumber, manualTagType, fetchQueue]);

  // ── Reprint handler (from history) ──────────────────────────────────────────
  const handleReprint = useCallback(async (item) => {
    setReprintLoading(true);
    try {
      const result = await reprintJob(item.id);
      showSnackbar(`✅ ${result.message}`, 'success');
      fetchQueue();
      fetchHistory();
    } catch (err) {
      showSnackbar(`Reprint failed: ${err.message}`, 'error');
    } finally {
      setReprintLoading(false);
    }
  }, [fetchQueue, fetchHistory]);

  const pendingCount = queue.filter((j) => j.status === 'PENDING').length;

  return (
    <>
      {/* ── Floating Print Queue Button ──────────────────────────────────────── */}
      <Fade in>
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300,
          }}
        >
          <Tooltip
            title={
              pendingCount > 0
                ? `${pendingCount} print job${pendingCount !== 1 ? 's' : ''} pending`
                : 'Print Queue'
            }
            placement="left"
          >
            <Badge
              badgeContent={pendingCount}
              color="error"
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  minWidth: 20,
                  height: 20,
                  animation: pendingCount > 0 ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                  },
                },
              }}
            >
              <Box
                onClick={() => setOpen(true)}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: pendingCount > 0
                    ? 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)'
                    : 'linear-gradient(135deg, #455a64 0%, #607d8b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: pendingCount > 0
                    ? '0 4px 20px rgba(30, 58, 95, 0.5)'
                    : '0 2px 10px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'scale(1.08)',
                    boxShadow: '0 6px 24px rgba(30, 58, 95, 0.5)',
                  },
                }}
              >
                <PrintIcon sx={{ color: 'white', fontSize: 26 }} />
              </Box>
            </Badge>
          </Tooltip>
        </Box>
      </Fade>

      {/* ── Side Drawer ─────────────────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100vw', sm: 380 }, display: 'flex', flexDirection: 'column' },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PrintIcon />
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Print Queue
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Auto-queued tag & document jobs
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={() => fetchQueue()}
                sx={{ color: 'white' }}
                disabled={polling}
              >
                {polling ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ minHeight: 42 }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PendingIcon sx={{ fontSize: 16 }} />
                  Pending
                  {pendingCount > 0 && (
                    <Chip
                      label={pendingCount}
                      size="small"
                      color="error"
                      sx={{ fontSize: '0.65rem', height: 18, ml: 0.25 }}
                    />
                  )}
                </Box>
              }
              sx={{ minHeight: 42, fontSize: '0.8rem' }}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <HistoryIcon sx={{ fontSize: 16 }} />
                  History
                </Box>
              }
              sx={{ minHeight: 42, fontSize: '0.8rem' }}
            />
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {/* ── Manual Print Card (always visible at top of Pending tab) ── */}
          {tab === 0 && (
            <Paper
              elevation={0}
              sx={{
                mb: 2,
                border: '1px solid',
                borderColor: manualOpen ? 'primary.main' : 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              <Box
                onClick={() => setManualOpen(!manualOpen)}
                sx={{
                  px: 1.5,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  bgcolor: manualOpen ? 'primary.50' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background 0.2s',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddIcon fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    Manual Print / Reprint
                  </Typography>
                </Box>
                {manualOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Box>
              <Collapse in={manualOpen}>
                <Box sx={{ px: 1.5, pb: 1.5, pt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Print any tag for any job at any time.
                  </Typography>
                  <TextField
                    size="small"
                    label="Job Number"
                    placeholder="e.g. JOB-00001"
                    value={manualJobNumber}
                    onChange={(e) => setManualJobNumber(e.target.value)}
                    fullWidth
                    sx={{ mb: 1 }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleManualPrint(); }}
                  />
                  <TextField
                    select
                    size="small"
                    label="Tag Type"
                    value={manualTagType}
                    onChange={(e) => setManualTagType(e.target.value)}
                    fullWidth
                    sx={{ mb: 1.5 }}
                  >
                    <MenuItem value="DTL_TAG">DTL Tag (Work Order)</MenuItem>
                    <MenuItem value="BUNDLE_TAG">Bundle Tag</MenuItem>
                    <MenuItem value="SHIPPING_LABEL">Shipping Label</MenuItem>
                  </TextField>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={manualLoading ? <CircularProgress size={16} /> : <PrintIcon />}
                    disabled={manualLoading || !manualJobNumber.trim()}
                    onClick={handleManualPrint}
                  >
                    {manualLoading ? 'Queuing...' : 'Queue for Print'}
                  </Button>
                </Box>
              </Collapse>
            </Paper>
          )}

          {/* ── Pending ── */}
          {tab === 0 && (
            <>
              {queue.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <DoneIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                  <Typography variant="body2">
                    No pending print jobs.
                  </Typography>
                  <Typography variant="caption">
                    Tags auto-queue when jobs change status, or use Manual Print above.
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {queue.length} job{queue.length !== 1 ? 's' : ''} waiting to print
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<PrintIcon />}
                      onClick={() => {
                        // Print all pending in sequence
                        queue.forEach((item, idx) => {
                          setTimeout(() => handlePrint(item), idx * 500);
                        });
                      }}
                    >
                      Print All
                    </Button>
                  </Box>

                  {/* High priority first */}
                  {queue
                    .slice()
                    .sort((a, b) => (a.priority === 'HIGH' ? -1 : 1))
                    .map((item) => (
                      <QueueItem
                        key={item.id}
                        item={item}
                        onPrint={handlePrint}
                        onSkip={handleSkip}
                        loading={loadingId === item.id}
                      />
                    ))}
                </>
              )}

              {/* Automation info box */}
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: 'info.50',
                  border: '1px solid',
                  borderColor: 'info.light',
                  borderRadius: 2,
                }}
              >
                <Typography variant="caption" color="info.dark" fontWeight={600}>
                  Auto-Print Triggers
                </Typography>
                <Stack spacing={0.25} sx={{ mt: 0.75 }}>
                  {[
                    '📋 Job → Scheduled: DTL Tag',
                    '📦 Job → Packaging: Bundle Tag',
                    '🚚 Job → Ready to Ship: Shipping Label',
                    '📄 Shipment Created: BOL + Packing List',
                  ].map((t) => (
                    <Typography key={t} variant="caption" color="text.secondary">
                      {t}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            </>
          )}

          {/* ── History ── */}
          {tab === 1 && (
            <>
              {history.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <HistoryIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                  <Typography variant="body2">No print history yet.</Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {history.map((item, idx) => (
                    <Box key={item.id || idx}>
                      <HistoryItem item={item} onReprint={handleReprint} reprintLoading={reprintLoading} />
                      {idx < history.length - 1 && <Divider component="li" />}
                    </Box>
                  ))}
                </List>
              )}
            </>
          )}
        </Box>
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
