/**
 * Ops Cockpit Dashboard
 * 10× operations command center for Alro plant leadership
 * Predictive, flow-centric facility management with AI interventions
 */

import { useState, useEffect, useCallback } from 'react';
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
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  Build as BuildIcon,
  Inventory as InventoryIcon,
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  LocationOn as LocationIcon,
  Timer as TimerIcon,
  PlayArrow as PlayIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Lightbulb as InsightIcon,
  AutoAwesome as AutoIcon,
  Assessment as AssessmentIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';

// ============================================
// FLOW STATE VISUALIZATION COMPONENT
// ============================================
function FlowStatePanel({ data }) {
  const theme = useTheme();
  const columns = [
    { key: 'ORDERED', label: 'Ordered', color: '#9e9e9e', count: data?.ordered || 47, flow: '+8' },
    { key: 'SCHEDULED', label: 'Scheduled', color: '#2196f3', count: data?.scheduled || 89, flow: '-12' },
    { key: 'IN_PROCESS', label: 'In Process', color: '#ff9800', count: data?.inProcess || 34, flow: '+6' },
    { key: 'PACKAGING', label: 'Packaging', color: '#9c27b0', count: data?.packaging || 18, flow: '+4' },
    { key: 'READY_SHIP', label: 'Ready to Ship', color: '#4caf50', count: data?.readyToShip || 23, flow: '-2' },
    { key: 'SHIPPED', label: 'Shipped', color: '#00bcd4', count: data?.shipped || 156, flow: '+18' },
  ];

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Flow State
        </Typography>
        <Chip label="Live" size="small" color="success" variant="outlined" />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
        {columns.map((col, idx) => (
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
              {col.count}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {col.label}
            </Typography>
            <Chip
              label={`${col.flow} today`}
              size="small"
              sx={{
                mt: 1,
                bgcolor: col.flow.startsWith('+') ? 'success.light' : 'warning.light',
                color: col.flow.startsWith('+') ? 'success.dark' : 'warning.dark',
                fontWeight: 600,
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

// ============================================
// PROMISE RISK PANEL
// ============================================
function PromiseRiskPanel({ hotJobs = [], atRiskJobs = [], safeCount = 127 }) {
  const [expanded, setExpanded] = useState(true);

  const mockHotJobs = [
    { id: 'JOB-2341', customer: 'Metro Mfg', due: '2h 15m', status: 'IN_PROCESS', risk: 'Machine queue at SHEAR-1' },
    { id: 'JOB-2356', customer: 'Steel Solutions', due: '45m 🔥', status: 'PACKAGING', risk: 'Dock backup' },
    { id: 'JOB-2348', customer: 'ABC Steel', due: '1h 30m', status: 'IN_PROCESS', risk: 'Material hold' },
  ];

  const mockAtRiskJobs = [
    { id: 'JOB-2298', customer: 'ABC Steel', due: '6h (1 shift)', status: 'SCHEDULED', risk: 'Material hold' },
    { id: 'JOB-2301', customer: 'Precision Parts', due: '8h', status: 'SCHEDULED', risk: 'Capacity constraint' },
    { id: 'JOB-2315', customer: 'Industrial Corp', due: '5h', status: 'IN_PROCESS', risk: 'QC review pending' },
  ];

  const displayHot = hotJobs.length > 0 ? hotJobs : mockHotJobs;
  const displayAtRisk = atRiskJobs.length > 0 ? atRiskJobs : mockAtRiskJobs;

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

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip
          icon={<ErrorIcon />}
          label={`HOT: ${displayHot.length}`}
          color="error"
          variant="filled"
        />
        <Chip
          icon={<WarningIcon />}
          label={`At Risk: ${displayAtRisk.length}`}
          color="warning"
          variant="filled"
        />
        <Chip
          icon={<CheckIcon />}
          label={`Safe: ${safeCount}`}
          color="success"
          variant="outlined"
        />
      </Box>

      <Collapse in={expanded}>
        {/* Hot Jobs */}
        <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
          🔴 HOT - Immediate Attention
        </Typography>
        <Stack spacing={1} sx={{ mb: 2 }}>
          {displayHot.map((job) => (
            <Box
              key={job.id}
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'error.light',
                border: '1px solid',
                borderColor: 'error.main',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {job.id} - {job.customer}
                </Typography>
                <Chip label={job.due} size="small" color="error" />
              </Box>
              <Typography variant="caption" color="error.dark" display="block">
                {job.status} | Risk: {job.risk}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* At Risk Jobs */}
        <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
          🟠 At Risk - Monitor Closely
        </Typography>
        <Stack spacing={1}>
          {displayAtRisk.slice(0, 3).map((job) => (
            <Box
              key={job.id}
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: 'warning.light',
                border: '1px solid',
                borderColor: 'warning.main',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={500}>
                  {job.id} - {job.customer}
                </Typography>
                <Chip label={job.due} size="small" color="warning" />
              </Box>
              <Typography variant="caption" color="warning.dark">
                {job.risk}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Collapse>
    </Paper>
  );
}

// ============================================
// WORK CENTER UTILIZATION STRIP
// ============================================
function UtilizationStrip({ workCenters = [] }) {
  const mockWorkCenters = [
    { id: 'SAW-1', name: 'Saw #1', utilization: 82, queue: 3.2, hotJobs: 2, status: 'normal' },
    { id: 'SAW-2', name: 'Saw #2', utilization: 58, queue: 1.1, hotJobs: 0, status: 'under' },
    { id: 'SHEAR-1', name: 'Shear #1', utilization: 92, queue: 4.8, hotJobs: 1, status: 'bottleneck' },
    { id: 'WATERJET', name: 'Waterjet', utilization: 68, queue: 2.4, hotJobs: 0, status: 'normal' },
    { id: 'ROUTER', name: 'Router', utilization: 28, queue: 0.3, hotJobs: 0, status: 'under' },
    { id: 'DEBURR', name: 'Deburr', utilization: 72, queue: 1.8, hotJobs: 0, status: 'normal' },
    { id: 'PACKOUT', name: 'Packout', utilization: 98, queue: 5.1, hotJobs: 3, status: 'bottleneck' },
    { id: 'STAGING', name: 'Staging', utilization: 84, queue: 47, hotJobs: 0, status: 'filling' },
  ];

  const displayWorkCenters = workCenters.length > 0 ? workCenters : mockWorkCenters;

  const getUtilizationColor = (util, status) => {
    if (status === 'bottleneck') return 'error';
    if (util >= 90) return 'error';
    if (util >= 80) return 'warning';
    if (util < 40) return 'info';
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
      <Stack spacing={1}>
        {displayWorkCenters.map((wc) => (
          <Box
            key={wc.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1,
              borderRadius: 1,
              bgcolor: wc.status === 'bottleneck' ? 'error.light' : 'grey.50',
            }}
          >
            <Typography variant="body2" fontWeight={500} sx={{ minWidth: 80 }}>
              {wc.name}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={wc.utilization}
                color={getUtilizationColor(wc.utilization, wc.status)}
                sx={{ height: 12, borderRadius: 6 }}
              />
            </Box>
            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 45 }}>
              {wc.utilization}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
              Queue: {wc.queue} {wc.id === 'STAGING' ? 'units' : 'hrs'}
            </Typography>
            {wc.hotJobs > 0 && (
              <Chip label={`⚠️ Hot: ${wc.hotJobs}`} size="small" color="warning" />
            )}
            {wc.status !== 'normal' && (
              <Typography variant="caption" fontWeight={600} color={wc.status === 'bottleneck' ? 'error.main' : 'text.secondary'}>
                {getStatusLabel(wc.status)}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

// ============================================
// EXCEPTION FEED
// ============================================
function ExceptionFeed({ exceptions = [] }) {
  const mockExceptions = [
    { id: 1, time: '2m ago', type: 'MACHINE_DOWN', icon: '🔧', title: 'SAW-1 blade change', eta: 'ETA: 25 min', severity: 'warning' },
    { id: 2, time: '8m ago', type: 'SCRAP', icon: '🔴', title: 'JOB-2341 3 pcs scrapped', eta: '$847 impact', severity: 'error' },
    { id: 3, time: '15m ago', type: 'QC_HOLD', icon: '🟡', title: 'JOB-2298 tolerance review', eta: 'Pending', severity: 'warning' },
    { id: 4, time: '22m ago', type: 'REWORK', icon: '↩️', title: 'JOB-2356 deburr rework', eta: '+45 min', severity: 'warning' },
    { id: 5, time: '1h ago', type: 'STAFFING', icon: '👤', title: 'Packout -1 operator', eta: 'Shift 2', severity: 'info' },
    { id: 6, time: '2h ago', type: 'TRANSFER', icon: '🚚', title: 'Branch 14→07 delayed', eta: '+4 hrs', severity: 'warning' },
  ];

  const displayExceptions = exceptions.length > 0 ? exceptions : mockExceptions;

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
        <Typography variant="h6" fontWeight={600}>
          Exception Feed
        </Typography>
        <Badge badgeContent={displayExceptions.length} color="error">
          <WarningIcon color="action" />
        </Badge>
      </Box>
      <Stack spacing={1} sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {displayExceptions.map((exc) => (
          <Box
            key={exc.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: 1,
              bgcolor: getSeverityColor(exc.severity),
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50 }}>
              {exc.time}
            </Typography>
            <Typography>{exc.icon}</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                {exc.title}
              </Typography>
            </Box>
            <Chip label={exc.eta} size="small" variant="outlined" />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

// ============================================
// DAY COMPLETION FORECAST
// ============================================
function DayCompletionForecast({ forecast = {} }) {
  const probability = forecast.probability || 76;
  const totalJobs = forecast.totalJobs || 34;
  const scenarios = forecast.scenarios || {
    best: { jobs: 34, percent: 100, label: 'Unlikely' },
    expected: { jobs: 30, percent: 88, label: 'Most Likely' },
    worst: { jobs: 24, percent: 71, label: 'Possible' },
  };
  const risks = forecast.risks || [
    'SHEAR-1 queue depth adds 2.1 hours to 6 jobs',
    'Transfer from Branch 14 delayed, affects 3 jobs',
    'Packout capacity at 98%, creates 1.5 hour buffer',
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Day Completion Forecast
      </Typography>
      
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          TODAY'S PROMISES: {totalJobs} jobs
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
          <Typography variant="h4" fontWeight={700} color={probability >= 80 ? 'success.main' : 'warning.main'}>
            {probability}%
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Confidence: {probability}% likely to complete all {totalJobs} jobs by EOD
        </Typography>
      </Box>

      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Scenario Breakdown
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">Best case (no exceptions):</Typography>
          <Chip label={`${scenarios.best.jobs}/${totalJobs} - ${scenarios.best.percent}%`} size="small" color="success" />
          <Typography variant="caption" color="text.secondary">[{scenarios.best.label}]</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">Expected (normal exceptions):</Typography>
          <Chip label={`${scenarios.expected.jobs}/${totalJobs} - ${scenarios.expected.percent}%`} size="small" color="warning" />
          <Typography variant="caption" color="text.secondary">[{scenarios.expected.label}]</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">Worst case (major disruption):</Typography>
          <Chip label={`${scenarios.worst.jobs}/${totalJobs} - ${scenarios.worst.percent}%`} size="small" color="error" />
          <Typography variant="caption" color="text.secondary">[{scenarios.worst.label}]</Typography>
        </Box>
      </Stack>

      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Risk Factors
      </Typography>
      <Stack spacing={0.5}>
        {risks.map((risk, idx) => (
          <Typography key={idx} variant="body2" color="text.secondary">
            • {risk}
          </Typography>
        ))}
      </Stack>
    </Paper>
  );
}

// ============================================
// AI RECOMMENDATIONS PANEL
// ============================================
function AIRecommendationsPanel({ recommendations = [] }) {
  const mockRecommendations = [
    {
      id: 1,
      priority: 1,
      title: 'Unblock SHEAR-1 bottleneck',
      action: 'Move JOB-2312, JOB-2318 to SAW-2 (compatible operation)',
      why: 'SHEAR-1 at 92% with 4.8hr queue. SAW-2 at 58% with capacity. Saves 1.8 hours for 4 downstream jobs with tight promises.',
      impact: '+3 jobs meet promise, -$0 cost, -2.1hr queue time',
      confidence: 87,
    },
    {
      id: 2,
      priority: 2,
      title: 'Accelerate JOB-2341 (Metro Mfg - HOT)',
      action: 'Assign dedicated operator, skip queue at DEBURR',
      why: 'Customer is strategic (top 5 by revenue). Promise in 2h 15m. Current path completes in 2h 45m.',
      impact: '+1 job meets promise, +$45 expedite cost',
      confidence: 92,
    },
    {
      id: 3,
      priority: 3,
      title: 'Proactive transfer to Branch 22',
      action: 'Ship 12 units of 304SS to Branch 22 for customer pickup',
      why: 'Customer location closer to Branch 22. We have excess stock. Saves customer 45 min drive.',
      impact: '+1 customer experience, +$85 transfer cost',
      confidence: 78,
    },
  ];

  const displayRecommendations = recommendations.length > 0 ? recommendations : mockRecommendations;

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            AI Interventions
          </Typography>
        </Box>
        <Chip label="3 recommendations" size="small" color="primary" variant="outlined" />
      </Box>

      <Stack spacing={2}>
        {displayRecommendations.map((rec) => (
          <Box
            key={rec.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'primary.light',
              bgcolor: 'primary.50',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={`#${rec.priority}`} size="small" color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  {rec.title}
                </Typography>
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

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" color="primary">
                Accept
              </Button>
              <Button size="small" variant="outlined">
                Modify
              </Button>
              <Button size="small" variant="text">
                Explain More
              </Button>
              <Button size="small" variant="text" color="inherit">
                Dismiss
              </Button>
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

// ============================================
// STAGING & SHIPPING PANEL
// ============================================
function StagingShippingPanel({ data = {} }) {
  const staging = data.staging || { zoneA: 18, zoneB: 15, zoneC: 14, overflow: 8 };
  const carriers = data.carriers || [
    { name: 'FedEx', cutoff: '14:30', remaining: '2h 15m', packages: 8 },
    { name: 'UPS', cutoff: '15:00', remaining: '2h 45m', packages: 5 },
    { name: 'Local', cutoff: '16:00', remaining: '3h 45m', packages: 10 },
    { name: 'Pickup', cutoff: '--:--', remaining: 'On demand', packages: 12 },
  ];
  const dispatched = data.dispatched || { fedex: 12, ups: 8, local: 14, pickup: 22, total: 56 };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Staging & Shipping
      </Typography>
      
      <Grid container spacing={2}>
        {/* Staging */}
        <Grid item xs={4}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Staging ({staging.zoneA + staging.zoneB + staging.zoneC})
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Zone A:</Typography>
              <Typography variant="body2" fontWeight={500}>{staging.zoneA}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Zone B:</Typography>
              <Typography variant="body2" fontWeight={500}>{staging.zoneB}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Zone C:</Typography>
              <Typography variant="body2" fontWeight={500}>{staging.zoneC}</Typography>
            </Box>
            {staging.overflow > 0 && (
              <Chip
                label={`🔴 Overflow: +${staging.overflow}`}
                size="small"
                color="error"
                sx={{ mt: 1 }}
              />
            )}
          </Stack>
        </Grid>

        {/* Carrier Windows */}
        <Grid item xs={5}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Carrier Windows
          </Typography>
          <Stack spacing={0.5}>
            {carriers.map((carrier) => (
              <Box key={carrier.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 50 }}>{carrier.name}</Typography>
                <Typography variant="caption" color="text.secondary">{carrier.cutoff}</Typography>
                <Chip label={carrier.remaining} size="small" />
                <Typography variant="caption">{carrier.packages} pkgs</Typography>
              </Box>
            ))}
          </Stack>
        </Grid>

        {/* Dispatched Today */}
        <Grid item xs={3}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Dispatched Today
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">FedEx:</Typography>
              <Typography variant="body2" fontWeight={500}>{dispatched.fedex}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">UPS:</Typography>
              <Typography variant="body2" fontWeight={500}>{dispatched.ups}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Local:</Typography>
              <Typography variant="body2" fontWeight={500}>{dispatched.local}</Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight={600}>Total:</Typography>
              <Typography variant="body2" fontWeight={700}>{dispatched.total}</Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      <Alert severity="warning" sx={{ mt: 2 }}>
        ⚠️ 3 orders missing carrier assignment
      </Alert>
    </Paper>
  );
}

// ============================================
// MATERIAL AVAILABILITY PANEL
// ============================================
function MaterialAvailabilityPanel({ data = {} }) {
  const stockouts = data.stockouts || [
    { material: '304SS 0.125"×48"', need: 12, have: 0, eta: '14:30 (transfer)' },
    { material: 'Aluminum 6061 1"', need: 8, have: 2, eta: 'Tomorrow (PO)' },
  ];
  const lowStock = data.lowStock || [
    { material: 'HR 0.250"×60"', stock: 15, status: 'Reorder triggered' },
    { material: 'Galv 0.060"×48"', stock: 22, status: 'PO in transit' },
    { material: 'CR 0.125"×36"', stock: 18, status: 'Recommend reorder' },
  ];
  const inbound = data.inbound || [
    { po: 'PO-4521', source: 'Mill', desc: 'HR Coil 40,000 lbs', eta: 'Tomorrow' },
    { po: 'PO-4518', source: 'Dist', desc: '304SS sheet 200 pcs', eta: 'Today 16:00' },
    { po: 'Transfer', source: 'Branch 14', desc: '304SS 0.125"×48" 12pc', eta: 'Today 14:30' },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Material Availability
      </Typography>

      {/* Stock Outs */}
      <Typography variant="subtitle2" color="error.main" fontWeight={600} sx={{ mb: 1 }}>
        🔴 Stock Outs (blocking work)
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        {stockouts.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2">{item.material}</Typography>
            <Typography variant="caption">Need: {item.need} | Have: {item.have}</Typography>
            <Chip label={item.eta} size="small" />
          </Box>
        ))}
      </Stack>

      {/* Low Stock */}
      <Typography variant="subtitle2" color="warning.main" fontWeight={600} sx={{ mb: 1 }}>
        🟡 Low Stock (will block within 48h)
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        {lowStock.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2">{item.material}</Typography>
            <Typography variant="caption">Stock: {item.stock}%</Typography>
            <Chip label={item.status} size="small" variant="outlined" />
          </Box>
        ))}
      </Stack>

      {/* Inbound */}
      <Typography variant="subtitle2" color="success.main" fontWeight={600} sx={{ mb: 1 }}>
        🟢 Inbound
      </Typography>
      <Stack spacing={0.5}>
        {inbound.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">{item.po} ({item.source})</Typography>
            <Typography variant="caption">{item.desc}</Typography>
            <Chip label={item.eta} size="small" color="success" variant="outlined" />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

// ============================================
// MAIN OPS COCKPIT COMPONENT
// ============================================
export default function OpsCockpitPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = useCallback(() => {
    setLastUpdated(new Date());
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)' }}>
      {/* Modern Header */}
      <Box sx={{ 
        px: 3, 
        py: 2.5, 
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
        mb: 3,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              width: 56, 
              height: 56, 
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}>
              <SpeedIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                Ops Cockpit
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Alro Service Center Command Center • AI-Powered Operations
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<ScheduleIcon sx={{ color: 'inherit !important' }} />}
              label={`Updated: ${lastUpdated.toLocaleTimeString()}`}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            />
            <ToggleButtonGroup
              value={autoRefresh ? 'auto' : 'manual'}
              exclusive
              size="small"
              onChange={(e, val) => setAutoRefresh(val === 'auto')}
              sx={{
                '& .MuiToggleButton-root': {
                  color: 'rgba(255,255,255,0.7)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&.Mui-selected': {
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.2)',
                  },
                },
              }}
            >
              <ToggleButton value="auto">Auto</ToggleButton>
              <ToggleButton value="manual">Manual</ToggleButton>
            </ToggleButtonGroup>
            <IconButton onClick={handleRefresh} sx={{ color: 'white' }}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>

      {/* Flow State - Full Width */}
      <Box sx={{ mb: 3 }}>
        <FlowStatePanel />
      </Box>

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Risk & Exceptions */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <PromiseRiskPanel />
            <ExceptionFeed />
          </Stack>
        </Grid>

        {/* Center Column - Utilization & Forecast */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <UtilizationStrip />
            <DayCompletionForecast />
          </Stack>
        </Grid>

        {/* Right Column - AI & Shipping */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <AIRecommendationsPanel />
          </Stack>
        </Grid>

        {/* Bottom Row - Full Width Panels */}
        <Grid item xs={12} md={6}>
          <StagingShippingPanel />
        </Grid>
        <Grid item xs={12} md={6}>
          <MaterialAvailabilityPanel />
        </Grid>
      </Grid>
      </Box>
    </Box>
  );
}
