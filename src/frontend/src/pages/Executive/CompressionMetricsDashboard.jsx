/**
 * CompressionMetricsDashboard.jsx
 * ─────────────────────────────────
 * Quote → Order speed dashboard — shows management how fast the
 * operation converts quotes through to shipped product.
 *
 * Four key intervals:
 *   1. Quote → Order           (conversion speed)
 *   2. Online Order → CSR      (response time)
 *   3. Order → Scheduled       (planning lag)
 *   4. Scheduled → Shipped     (execution speed)
 *
 * Filters: branch · division · CSR · time range
 * Widgets: KPI cards, funnel bar, branch comparison, CSR leaderboard,
 *          weekly trend table, SLA risk list, CSV export.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Stack,
  Badge,
  Collapse,
  Fade,
} from '@mui/material';
import {
  Speed,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  ArrowUpward,
  ArrowDownward,
  Schedule,
  LocalShipping,
  Assignment,
  FilterList,
  FileDownload,
  Refresh,
  ExpandMore,
  ExpandLess,
  Person,
  LocationOn,
  Timeline,
  Compress,
} from '@mui/icons-material';

import {
  getCompressionOverview,
  getCompressionTrend,
  getBranchComparison,
  getCsrPerformance,
  getSlaRiskOrders,
  exportCompressionReport,
  METRIC_STAGE,
  METRIC_STAGE_LABELS,
  METRIC_STAGE_COLORS,
  SLA_TARGETS,
  BRANCHES,
  DIVISIONS,
  MOCK_CSRS,
  TIME_RANGE,
  formatHours,
  slaColor,
} from '../../services/compressionMetricsApi';

// ─── STAGE ICONS ─────────────────────────────────────────────────────────────

const STAGE_ICONS = {
  [METRIC_STAGE.QUOTE_TO_ORDER]:     <Assignment fontSize="small" />,
  [METRIC_STAGE.ONLINE_TO_CSR]:      <Person fontSize="small" />,
  [METRIC_STAGE.ORDER_TO_SCHEDULED]: <Schedule fontSize="small" />,
  [METRIC_STAGE.SCHEDULED_TO_SHIP]:  <LocalShipping fontSize="small" />,
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const CompressionMetricsDashboard = () => {
  // Filters
  const [branchId, setBranchId] = useState('');
  const [division, setDivision] = useState('');
  const [csrId, setCsrId] = useState('');
  const [timeRange, setTimeRange] = useState(TIME_RANGE.LAST_30);

  // Data
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState(null);
  const [branchData, setBranchData] = useState(null);
  const [csrData, setCsrData] = useState(null);
  const [slaRisk, setSlaRisk] = useState(null);

  // UI
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showSlaDetails, setShowSlaDetails] = useState(false);

  const filters = { branchId, division, csrId, timeRange };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, trRes, brRes, csRes, slRes] = await Promise.all([
        getCompressionOverview(filters),
        getCompressionTrend(filters),
        getBranchComparison(filters),
        getCsrPerformance(filters),
        getSlaRiskOrders(filters),
      ]);
      setOverview(ovRes.data);
      setTrend(trRes.data);
      setBranchData(brRes.data);
      setCsrData(csRes.data);
      setSlaRisk(slRes);
    } catch (err) {
      console.error('Failed to load compression metrics', err);
    } finally {
      setLoading(false);
    }
  }, [branchId, division, csrId, timeRange]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Export handler ──
  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await exportCompressionReport(filters);
      if (!data || data.length === 0) return;
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
          const v = row[h];
          return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? '';
        }).join(',')),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compression-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  // ── Helper renderers ──
  const slaChip = (status) => {
    if (!status) return null;
    const map = { GREEN: { label: 'On Track', color: 'success' }, YELLOW: { label: 'Warning', color: 'warning' }, RED: { label: 'Breach', color: 'error' } };
    const cfg = map[status] || map.GREEN;
    return <Chip size="small" label={cfg.label} color={cfg.color} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />;
  };

  const trendArrow = (current, previous) => {
    if (previous == null || current == null) return <TrendingFlat fontSize="small" color="action" />;
    if (current < previous) return <TrendingDown fontSize="small" color="success" />;
    if (current > previous) return <TrendingUp fontSize="small" color="error" />;
    return <TrendingFlat fontSize="small" color="action" />;
  };

  const pctBar = (value, max, color) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
      <Box sx={{ flexGrow: 1 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min((value / max) * 100, 100)}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 },
          }}
        />
      </Box>
      <Typography variant="caption" fontWeight={600} sx={{ minWidth: 48, textAlign: 'right' }}>
        {formatHours(value)}
      </Typography>
    </Box>
  );

  if (loading && !overview) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={56} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* ─── HEADER ───────────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <Speed />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Quote-to-Order Speed Metrics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tracking compression across the order lifecycle • {overview?.totalOrders ?? '—'} orders analysed
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadAll} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={16} /> : <FileDownload />}
              onClick={handleExport}
              disabled={exporting}
              size="small"
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* ─── FILTER BAR ───────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterList color="action" />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Branch</InputLabel>
            <Select value={branchId} label="Branch" onChange={e => setBranchId(e.target.value)}>
              <MenuItem value="">All Branches</MenuItem>
              {BRANCHES.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Division</InputLabel>
            <Select value={division} label="Division" onChange={e => setDivision(e.target.value)}>
              <MenuItem value="">All Divisions</MenuItem>
              {DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>CSR</InputLabel>
            <Select value={csrId} label="CSR" onChange={e => setCsrId(e.target.value)}>
              <MenuItem value="">All CSRs</MenuItem>
              {MOCK_CSRS.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Time Range</InputLabel>
            <Select value={timeRange} label="Time Range" onChange={e => setTimeRange(e.target.value)}>
              <MenuItem value={TIME_RANGE.TODAY}>Today</MenuItem>
              <MenuItem value={TIME_RANGE.THIS_WEEK}>This Week</MenuItem>
              <MenuItem value={TIME_RANGE.THIS_MONTH}>This Month</MenuItem>
              <MenuItem value={TIME_RANGE.LAST_30}>Last 30 Days</MenuItem>
              <MenuItem value={TIME_RANGE.LAST_90}>Last 90 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* ─── KPI CARDS ────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {overview && Object.values(METRIC_STAGE).map(stage => {
          const s = overview.stages[stage];
          if (!s) return null;
          return (
            <Grid item xs={12} sm={6} md={3} key={stage}>
              <Card
                sx={{
                  borderTop: 4,
                  borderColor: s.slaStatus === 'GREEN' ? 'success.main' : s.slaStatus === 'YELLOW' ? 'warning.main' : 'error.main',
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: METRIC_STAGE_COLORS[stage] + '22', color: METRIC_STAGE_COLORS[stage], width: 32, height: 32 }}>
                        {STAGE_ICONS[stage]}
                      </Avatar>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ lineHeight: 1.2 }}>
                        {METRIC_STAGE_LABELS[stage]}
                      </Typography>
                    </Box>
                    {slaChip(s.slaStatus)}
                  </Box>

                  <Typography variant="h4" fontWeight={700} sx={{ my: 1 }}>
                    {formatHours(s.avg)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    avg • median {formatHours(s.median)} • P90 {formatHours(s.p90)}
                  </Typography>

                  <Box sx={{ mt: 1.5 }}>
                    {pctBar(s.avg, SLA_TARGETS[stage].target * 1.5, METRIC_STAGE_COLORS[stage])}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        SLA target: {formatHours(SLA_TARGETS[stage].target)}
                      </Typography>
                      <Typography variant="caption" color={s.breachPct > 10 ? 'error.main' : 'text.secondary'} fontWeight={600}>
                        {s.breachPct}% breach
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ─── END-TO-END BANNER ────────────────────────────────────────── */}
      {overview && (
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timeline color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>End-to-End</Typography>
          </Box>
          <Chip label={`Avg ${formatHours(overview.endToEnd.avg)}`} color={slaColor(overview.endToEnd.slaStatus)} sx={{ fontWeight: 700 }} />
          <Typography variant="body2">
            Median {formatHours(overview.endToEnd.median)} • P90 {formatHours(overview.endToEnd.p90)}
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Chip size="small" label={`${overview.completedOrders} completed`} color="success" variant="outlined" />
          <Chip size="small" label={`${overview.inProgressOrders} in progress`} color="info" variant="outlined" />
          <Chip size="small" label={`${overview.endToEnd.breachPct}% breach rate`} color={overview.endToEnd.breachPct > 15 ? 'error' : 'default'} variant="outlined" />
        </Paper>
      )}

      {/* ─── FUNNEL BAR VISUALIZATION ─────────────────────────────────── */}
      {overview && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Stage Duration Funnel (avg hours)
          </Typography>
          <Stack spacing={1.5}>
            {Object.values(METRIC_STAGE).map(stage => {
              const s = overview.stages[stage];
              if (!s) return null;
              const maxVal = Math.max(...Object.values(overview.stages).map(st => st.avg || 0));
              const pct = maxVal > 0 ? (s.avg / maxVal) * 100 : 0;
              return (
                <Box key={stage} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 160, fontWeight: 500 }}>
                    {METRIC_STAGE_LABELS[stage]}
                  </Typography>
                  <Box sx={{ flexGrow: 1, position: 'relative' }}>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 26,
                        borderRadius: 2,
                        bgcolor: 'grey.100',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: METRIC_STAGE_COLORS[stage],
                          borderRadius: 2,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: pct > 20 ? '#fff' : 'text.primary',
                      }}
                    >
                      {formatHours(s.avg)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'text.secondary',
                      }}
                    >
                      SLA: {formatHours(SLA_TARGETS[stage].target)}
                    </Typography>
                  </Box>
                  {slaChip(s.slaStatus)}
                </Box>
              );
            })}
          </Stack>
        </Paper>
      )}

      {/* ─── WEEKLY TREND TABLE ───────────────────────────────────────── */}
      {trend && trend.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Weekly Trend (avg hours per stage)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Orders</TableCell>
                  {Object.values(METRIC_STAGE).map(stage => (
                    <TableCell key={stage} align="center" sx={{ fontWeight: 700, color: METRIC_STAGE_COLORS[stage] }}>
                      {METRIC_STAGE_LABELS[stage]}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700 }}>End-to-End</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trend.map((row, idx) => {
                  const prevRow = idx > 0 ? trend[idx - 1] : null;
                  return (
                    <TableRow key={row.week} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{row.week}</TableCell>
                      <TableCell align="center">{row.orderCount}</TableCell>
                      {Object.values(METRIC_STAGE).map(stage => {
                        const val = row[stage];
                        const prevVal = prevRow?.[stage];
                        return (
                          <TableCell key={stage} align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              {val != null ? formatHours(val) : '—'}
                              {val != null && trendArrow(val, prevVal)}
                            </Box>
                          </TableCell>
                        );
                      })}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {row.endToEnd != null ? formatHours(row.endToEnd) : '—'}
                          </Typography>
                          {row.endToEnd != null && trendArrow(row.endToEnd, prevRow?.endToEnd)}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ─── BRANCH COMPARISON & CSR LEADERBOARD — side by side ──────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Branch Comparison */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocationOn color="action" />
              <Typography variant="subtitle1" fontWeight={700}>Branch Comparison</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>#</TableCell>
                    {Object.values(METRIC_STAGE).map(stage => (
                      <TableCell key={stage} align="center" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                        {METRIC_STAGE_LABELS[stage].split(' ')[0]}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 700 }}>E2E</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branchData && branchData.map(row => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                      <TableCell align="center">{row.orderCount}</TableCell>
                      {Object.values(METRIC_STAGE).map(stage => (
                        <TableCell key={stage} align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontSize="0.8rem">
                              {row[stage] != null ? formatHours(row[stage]) : '—'}
                            </Typography>
                            {row[`${stage}_sla`] && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: row[`${stage}_sla`] === 'GREEN' ? 'success.main'
                                    : row[`${stage}_sla`] === 'YELLOW' ? 'warning.main' : 'error.main',
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={row.endToEnd != null ? formatHours(row.endToEnd) : '—'}
                          color={slaColor(row.endToEnd_sla)}
                          sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* CSR Leaderboard */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Person color="action" />
              <Typography variant="subtitle1" fontWeight={700}>CSR Speed Leaderboard</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>CSR</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Orders</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Q→O</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>On→CSR</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>E2E Avg</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {csrData && csrData.map((row, idx) => (
                    <TableRow key={row.id} hover sx={idx === 0 ? { bgcolor: 'success.50' } : {}}>
                      <TableCell>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: '0.7rem', bgcolor: 'primary.light' }}>
                            {row.initials}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{row.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{row.orderCount}</TableCell>
                      <TableCell align="center">{row[METRIC_STAGE.QUOTE_TO_ORDER] != null ? formatHours(row[METRIC_STAGE.QUOTE_TO_ORDER]) : '—'}</TableCell>
                      <TableCell align="center">{row[METRIC_STAGE.ONLINE_TO_CSR] != null ? formatHours(row[METRIC_STAGE.ONLINE_TO_CSR]) : '—'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={row.endToEnd != null ? formatHours(row.endToEnd) : '—'}
                          color={row.endToEnd != null && row.endToEnd <= 120 ? 'success' : row.endToEnd != null && row.endToEnd <= 150 ? 'warning' : 'default'}
                          sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        ${row.revenue ? (row.revenue / 1000).toFixed(0) + 'K' : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* ─── SLA RISK ORDERS ──────────────────────────────────────────── */}
      {slaRisk && slaRisk.data?.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowSlaDetails(!showSlaDetails)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="warning" />
              <Typography variant="subtitle1" fontWeight={700}>
                SLA Risk Orders
              </Typography>
              <Chip
                size="small"
                label={`${slaRisk.total} issues`}
                color={slaRisk.data.some(r => r.slaStatus === 'BREACH') ? 'error' : 'warning'}
                sx={{ fontWeight: 600, height: 22 }}
              />
            </Box>
            <IconButton size="small">
              {showSlaDetails ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          <Collapse in={showSlaDetails}>
            <TableContainer sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Stage</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actual</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>SLA</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>CSR</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slaRisk.data.slice(0, 25).map((row, idx) => (
                    <TableRow key={`${row.orderId}-${row.stage}-${idx}`} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.slaStatus}
                          color={row.slaStatus === 'BREACH' ? 'error' : 'warning'}
                          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{row.orderId}</TableCell>
                      <TableCell>{row.stageLabel}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: row.slaStatus === 'BREACH' ? 'error.main' : 'warning.main' }}>
                        {formatHours(row.hours)}
                      </TableCell>
                      <TableCell align="center">{formatHours(row.slaTarget)}</TableCell>
                      <TableCell>{row.branchName}</TableCell>
                      <TableCell>{row.csrName}</TableCell>
                      <TableCell>{new Date(row.orderDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {slaRisk.total > 25 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing 25 of {slaRisk.total} risk items
              </Typography>
            )}
          </Collapse>
        </Paper>
      )}

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <Box sx={{ textAlign: 'center', pt: 2, pb: 4 }}>
        <Typography variant="caption" color="text.secondary">
          Compression Metrics Dashboard • Data refreshed {new Date().toLocaleTimeString()} • Using mock data
        </Typography>
      </Box>
    </Box>
  );
};

export default CompressionMetricsDashboard;
