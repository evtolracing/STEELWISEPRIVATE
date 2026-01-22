// src/dashboard/widgets/index.js
/**
 * Dashboard Widget Library
 * Reusable widgets for role-based dashboards with loading/error states
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Stack,
  Divider,
  Avatar,
  IconButton,
  Paper,
  Grid,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Send as SendIcon,
  SmartToy as AiIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Pending as PendingIcon,
  Done as DoneIcon,
  ContentCut as ProcessIcon,
  ArrowForward as ArrowIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  getMockJobs,
  getMockWorkCenters,
  getMockInventory,
  getMockTransfers,
  getMockExceptions,
  getMockShipments,
  getMockBomQuality,
  getMockForecast,
  getMockRfqFunnel,
  getMockMarginInsights,
  getMockSlaRiskJobs,
} from '../../services/mockDashboardData';
import { askOpsAssistant } from '../../services/aiConsoleApi';

// ============================================
// Loading & Error Wrapper Component
// ============================================
function WidgetWrapper({ title, loading, error, onRetry, children, minHeight = 150 }) {
  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight }}>
        <CardHeader 
          title={<Skeleton width="60%" />} 
          titleTypographyProps={{ variant: 'h6' }} 
        />
        <CardContent sx={{ pt: 0 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%', minHeight }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <Alert 
            severity="error" 
            sx={{ fontSize: '0.75rem' }}
            action={
              onRetry && (
                <IconButton size="small" onClick={onRetry}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              )
            }
          >
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return children;
}

// ============================================
// W1: FlowBoardWidget
// ============================================
export function FlowBoardWidget({ title = 'Job Flow', data, loading, error, onRetry, onJobClick }) {
  const jobs = Array.isArray(data) ? data : (data?.jobs || getMockJobs());
  
  const statusGroups = {
    ORDERED: { label: 'Ordered', color: 'info' },
    SCHEDULED: { label: 'Scheduled', color: 'warning' },
    IN_PROCESS: { label: 'In Process', color: 'primary' },
    PACKAGING: { label: 'Packaging', color: 'secondary' },
    READY_TO_SHIP: { label: 'Ready to Ship', color: 'success' },
    SHIPPED: { label: 'Shipped', color: 'default' },
  };

  const groupedJobs = Object.keys(statusGroups).reduce((acc, status) => {
    acc[status] = jobs.filter((j) => j.status === status);
    return acc;
  }, {});

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {Object.entries(statusGroups).map(([status, config]) => (
              <Paper
                key={status}
                elevation={0}
                sx={{
                  minWidth: 140,
                  flex: '1 1 140px',
                  p: 1,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="caption" fontWeight={600}>
                    {config.label}
                  </Typography>
                  <Chip label={groupedJobs[status].length} size="small" color={config.color} />
                </Stack>
                <Stack spacing={0.5}>
                  {groupedJobs[status].slice(0, 3).map((job) => (
                    <Box
                      key={job.id}
                      onClick={() => onJobClick?.(job)}
                      sx={{
                        p: 0.75,
                        bgcolor: 'background.paper',
                        borderRadius: 0.5,
                        border: '1px solid',
                        borderColor: job.priority === 'HOT' ? 'error.main' : 'divider',
                        cursor: onJobClick ? 'pointer' : 'default',
                        '&:hover': onJobClick ? { bgcolor: 'action.hover' } : {},
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} noWrap>
                        {job.jobNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {job.customerName}
                      </Typography>
                    </Box>
                  ))}
                  {groupedJobs[status].length > 3 && (
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                      +{groupedJobs[status].length - 3} more
                    </Typography>
                  )}
                </Stack>
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W2: SlaRiskWidget
// ============================================
export function SlaRiskWidget({ title = 'SLA Risk', data, loading, error, onRetry }) {
  const riskData = data || { jobs: getMockSlaRiskJobs() };
  const jobs = riskData.jobs || riskData;

  const hotJobs = Array.isArray(jobs) ? jobs.filter((j) => j.risk === 'HOT') : [];
  const atRiskJobs = Array.isArray(jobs) ? jobs.filter((j) => j.risk === 'AT_RISK') : [];
  const safeJobs = Array.isArray(jobs) ? jobs.filter((j) => j.risk === 'SAFE') : [];

  // Use summary if provided, else calculate
  const summary = riskData.summary || {
    hot: hotJobs.length,
    atRisk: atRiskJobs.length,
    safe: safeJobs.length,
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'HOT': return <ErrorIcon color="error" fontSize="small" />;
      case 'AT_RISK': return <WarningIcon color="warning" fontSize="small" />;
      default: return <CheckIcon color="success" fontSize="small" />;
    }
  };

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Chip icon={<ErrorIcon />} label={`${summary.hot} HOT`} color="error" size="small" />
            <Chip icon={<WarningIcon />} label={`${summary.atRisk} At Risk`} color="warning" size="small" />
            <Chip icon={<CheckIcon />} label={`${summary.safe} Safe`} color="success" size="small" />
          </Stack>
          <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
            {[...hotJobs, ...atRiskJobs].slice(0, 6).map((job) => (
              <ListItem key={job.id} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {getRiskIcon(job.risk)}
                </ListItemIcon>
                <ListItemText
                  primary={`${job.jobNumber} - ${job.customerName}`}
                  secondary={`Due in ${job.hoursUntilDue}h • ${job.priority}`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W3: WorkCenterUtilizationWidget
// ============================================
export function WorkCenterUtilizationWidget({ title = 'Work Center Utilization', data, loading, error, onRetry }) {
  const workCenters = Array.isArray(data) ? data : (data?.workCenters || getMockWorkCenters());

  const getColor = (percent) => {
    if (percent >= 90) return 'error';
    if (percent >= 75) return 'warning';
    return 'success';
  };

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={1.5}>
            {workCenters.map((wc) => (
              <Box key={wc.id}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {wc.name}
                  </Typography>
                  <Typography variant="caption" color={`${getColor(wc.utilizationPercent)}.main`} fontWeight={600}>
                    {wc.utilizationPercent}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={wc.utilizationPercent}
                  color={getColor(wc.utilizationPercent)}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W4: BottleneckStripWidget
// ============================================
export function BottleneckStripWidget({ title = 'Bottlenecks', data, loading, error, onRetry }) {
  const allWorkCenters = Array.isArray(data) ? data : (data?.workCenters || getMockWorkCenters());
  const workCenters = allWorkCenters.filter((wc) => wc.status !== 'NORMAL');

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'error';
      case 'WARNING': return 'warning';
      default: return 'success';
    }
  };

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          {workCenters.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CheckIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No bottlenecks detected
              </Typography>
            </Box>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {workCenters.map((wc) => (
                <Chip
                  key={wc.id}
                  label={`${wc.name} (${wc.utilizationPercent}%)`}
                  color={getStatusColor(wc.status)}
                  size="small"
                  icon={wc.status === 'CRITICAL' ? <ErrorIcon /> : <WarningIcon />}
                />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W5: InventoryHeatmapWidget
// ============================================
export function InventoryHeatmapWidget({ title = 'Inventory Status', data, loading, error, onRetry }) {
  const inventory = Array.isArray(data) ? data : (data?.items || getMockInventory());

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'error';
      case 'LOW': return 'warning';
      default: return 'success';
    }
  };

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <TableContainer sx={{ maxHeight: 200 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell align="center">Loc</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="caption" fontWeight={500}>
                        {item.materialCode}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption">{item.locationId}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption">{item.availableQty}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W6: TransfersWidget
// ============================================
export function TransfersWidget({ title = 'Transfers', data, loading, error, onRetry }) {
  const transfers = Array.isArray(data) ? data : (data?.transfers || getMockTransfers());

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED': return <DoneIcon color="success" fontSize="small" />;
      case 'IN_TRANSIT': return <ShippingIcon color="primary" fontSize="small" />;
      default: return <PendingIcon color="warning" fontSize="small" />;
    }
  };

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <List dense>
            {transfers.map((transfer) => (
              <ListItem key={transfer.id} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {getStatusIcon(transfer.status)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="caption">{transfer.fromLocationId}</Typography>
                      <ArrowIcon fontSize="small" color="action" />
                      <Typography variant="caption">{transfer.toLocationId}</Typography>
                    </Stack>
                  }
                  secondary={`${transfer.items} items • ${transfer.status}${transfer.eta ? ` • ETA: ${new Date(transfer.eta).toLocaleDateString()}` : ''}`}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W7: RfqQuoteFunnelWidget
// ============================================
export function RfqQuoteFunnelWidget({ title = 'RFQ Funnel', data, loading, error, onRetry }) {
  const funnel = data || getMockRfqFunnel();

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {[
                { label: 'RFQs', value: funnel.rfqCount, color: 'info.main' },
                { label: 'Quoted', value: funnel.quotedCount, color: 'warning.main' },
                { label: 'Ordered', value: funnel.orderedCount, color: 'success.main' },
              ].map((stage) => (
                <Box key={stage.label} sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: stage.color, fontWeight: 600 }}>
                    {stage.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stage.label}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                RFQ→Quote: <strong>{funnel.rfqToQuoteRate}%</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Quote→Order: <strong>{funnel.quoteToOrderRate}%</strong>
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Pipeline Value: <strong>${(funnel.totalPipelineValue || 0).toLocaleString()}</strong>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W8: MarginInsightsWidget
// ============================================
export function MarginInsightsWidget({ title = 'Margin Insights', data, loading, error, onRetry }) {
  const insights = data || getMockMarginInsights();

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h3" fontWeight={600} color="success.main">
                {insights.avgMargin}%
              </Typography>
              {insights.marginTrend === 'UP' ? (
                <TrendingUpIcon color="success" />
              ) : (
                <TrendingDownIcon color="error" />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Average Margin
            </Typography>
            <Divider />
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Discounted Orders</Typography>
                <Typography variant="body2" fontWeight={500}>{insights.discountedOrdersPercent}%</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Avg Discount</Typography>
              <Typography variant="body2" fontWeight={500}>{insights.avgDiscount}%</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Top Margin Customer</Typography>
              <Typography variant="body2" fontWeight={500}>{insights.topMarginCustomer}</Typography>
            </Grid>
          </Grid>
          {insights.lowMarginAlert > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${insights.lowMarginAlert} low-margin orders`}
              color="warning"
              size="small"
            />
          )}
        </Stack>
      </CardContent>
    </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W9: BomQualityWidget
// ============================================
export function BomQualityWidget({ title = 'BOM Quality', data, loading, error, onRetry }) {
  const boms = Array.isArray(data) ? data : (data?.boms || getMockBomQuality());

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <List dense>
            {boms.map((bom) => (
              <ListItem key={bom.id} sx={{ px: 0 }}>
                <ListItemText
                  primary={bom.recipeName}
                  secondary={
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      {bom.warningsCount > 0 && (
                        <Chip
                          icon={<WarningIcon />}
                          label={`${bom.warningsCount} warnings`}
                          color="warning"
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                      {bom.overridesCount > 0 && (
                        <Chip
                          label={`${bom.overridesCount} overrides`}
                          color="info"
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                      <Chip
                        label={bom.status}
                        color={bom.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </Stack>
                  }
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W10: ExceptionsFeedWidget
// ============================================
export function ExceptionsFeedWidget({ title = 'Exceptions', data, loading, error, onRetry }) {
  const exceptions = Array.isArray(data) ? data : (data?.exceptions || getMockExceptions());

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'WARNING': return 'warning';
      default: return 'info';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SCRAP': return <InventoryIcon fontSize="small" />;
      case 'QC_HOLD': return <PauseIcon fontSize="small" />;
      case 'DOWNTIME': return <ScheduleIcon fontSize="small" />;
      case 'REWORK': return <ProcessIcon fontSize="small" />;
      default: return <WarningIcon fontSize="small" />;
    }
  };

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
            {exceptions.map((exc) => (
              <ListItem key={exc.id} sx={{ px: 0, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: `${getSeverityColor(exc.severity)}.light`,
                      color: `${getSeverityColor(exc.severity)}.main`,
                    }}
                  >
                    {getTypeIcon(exc.type)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={exc.message}
                  secondary={new Date(exc.timestamp).toLocaleTimeString()}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W11: ShippingPanelWidget
// ============================================
export function ShippingPanelWidget({ title = 'Shipping Today', data, loading, error, onRetry }) {
  const shipping = data || getMockShipments();

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h4" color="warning.main" fontWeight={600}>
                {shipping.staged || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">Staged</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h4" color="success.main" fontWeight={600}>
                {shipping.readyToShip || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">Ready</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h4" color="primary.main" fontWeight={600}>
                {shipping.dispatched || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">Dispatched</Typography>
            </Box>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <List dense>
            {(shipping.shipments || []).slice(0, 4).map((s) => (
              <ListItem key={s.id} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ShippingIcon fontSize="small" color={s.status === 'DISPATCHED' ? 'success' : 'action'} />
                </ListItemIcon>
              <ListItemText
                primary={s.customerName}
                secondary={`${s.carrier} • ${s.scheduledTime}`}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <Chip
                label={s.status}
                size="small"
                color={s.status === 'READY' ? 'success' : s.status === 'DISPATCHED' ? 'primary' : 'warning'}
                sx={{ fontSize: '0.65rem', height: 20 }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W12: ForecastWidget
// ============================================
export function ForecastWidget({ title = 'Today vs Tomorrow', data, loading, error, onRetry }) {
  const forecast = data || getMockForecast();
  const today = forecast.today || { utilizationPercent: 0, jobsPlanned: 0, load: 0, capacity: 480 };
  const tomorrow = forecast.tomorrow || { utilizationPercent: 0, jobsPlanned: 0, load: 0, capacity: 480 };

  return (
    <WidgetWrapper title={title} loading={loading} error={error} onRetry={onRetry}>
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="overline" color="text.secondary">Today</Typography>
                <Typography variant="h5" fontWeight={600} color="primary.main">
                  {today.utilizationPercent}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {today.jobsPlanned} jobs • {today.load}/{today.capacity} min
                </Typography>
                {(forecast.hotJobsToday || 0) > 0 && (
                  <Chip
                    icon={<ErrorIcon />}
                    label={`${forecast.hotJobsToday} HOT`}
                    color="error"
                    size="small"
                    sx={{ mt: 1, fontSize: '0.65rem', height: 20 }}
                  />
                )}
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="overline" color="text.secondary">Tomorrow</Typography>
                <Typography variant="h5" fontWeight={600} color="secondary.main">
                  {tomorrow.utilizationPercent}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tomorrow.jobsPlanned} jobs • {tomorrow.load}/{tomorrow.capacity} min
                </Typography>
                {(forecast.hotJobsTomorrow || 0) > 0 && (
                  <Chip
                    icon={<WarningIcon />}
                    label={`${forecast.hotJobsTomorrow} HOT`}
                    color="warning"
                    size="small"
                    sx={{ mt: 1, fontSize: '0.65rem', height: 20 }}
                  />
                )}
              </Paper>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
              <Typography variant="body2" color="text.secondary">Trend:</Typography>
              {forecast.trend === 'DECREASING' ? (
                <Chip icon={<TrendingDownIcon />} label="Decreasing" color="success" size="small" />
            ) : (
              <Chip icon={<TrendingUpIcon />} label="Increasing" color="warning" size="small" />
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
    </WidgetWrapper>
  );
}

// ============================================
// W13: AiAssistantPanel
// ============================================
export function AiAssistantPanel({ title = 'Ops Assistant', role, context, onAsk }) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setAnswer('');
    try {
      if (onAsk) {
        const result = await onAsk(query);
        setAnswer(result);
      } else {
        // Use real API service
        const response = await askOpsAssistant({ role, query, context });
        setAnswer(response.answer || response.message || 'No response received.');
      }
    } catch (err) {
      setAnswer('Error getting response. Please try again.');
    } finally {
      setIsLoading(false);
    }
    setQuery('');
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={<AiIcon color="primary" />}
        title={title}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: 0 }}>
        <Box sx={{ flex: 1, mb: 2, overflow: 'auto', maxHeight: 200 }}>
          {answer ? (
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="body2">{answer}</Typography>
            </Paper>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
              <AiIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
              <Typography variant="body2">
                Ask me about scheduling, bottlenecks, SLA risks, or any operations question.
              </Typography>
            </Box>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask a question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={handleAsk}
            disabled={isLoading || !query.trim()}
            sx={{ minWidth: 48 }}
          >
            <SendIcon />
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ============================================
// WIDGET REGISTRY
// ============================================
export const WIDGET_REGISTRY = {
  FLOW_BOARD: FlowBoardWidget,
  SLA_RISK: SlaRiskWidget,
  WORKCENTER_UTIL: WorkCenterUtilizationWidget,
  BOTTLENECK_STRIP: BottleneckStripWidget,
  INVENTORY_HEATMAP: InventoryHeatmapWidget,
  TRANSFERS: TransfersWidget,
  RFQ_FUNNEL: RfqQuoteFunnelWidget,
  MARGIN_INSIGHTS: MarginInsightsWidget,
  BOM_QUALITY: BomQualityWidget,
  EXCEPTIONS_FEED: ExceptionsFeedWidget,
  SHIPPING_PANEL: ShippingPanelWidget,
  FORECAST: ForecastWidget,
  AI_ASSISTANT: AiAssistantPanel,
};

export default WIDGET_REGISTRY;