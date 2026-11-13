/**
 * Sales Dashboard: the quoting pipeline and results, counted from the RFQs,
 * quotes and orders in the system (/api/sales-dashboard). A figure that cannot
 * be measured yet is shown as "Not available", never as an estimate.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Button, Avatar, Table, TableBody, TableCell,
  TableHead, TableRow, Select, MenuItem, FormControl, InputLabel, Alert, LinearProgress,
} from '@mui/material';
import { AccessTime, EmojiEvents, AttachMoney, TrendingUp, Refresh, Warning } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const RANGE_LABEL = { today: 'today', week: 'this week', month: 'this month', quarter: 'this quarter' };
const STATUS_COLOR = { DRAFT: 'default', PENDING_APPROVAL: 'warning', SENT: 'info', COUNTERED: 'warning', ACCEPTED: 'success', REJECTED: 'error', EXPIRED: 'default' };
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n) || 0);
const label = (s) => String(s || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const Count = ({ value, caption, color }) => (
  <Grid item xs={6} md={2}>
    <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
      <Typography variant="h3" fontWeight={700} color={color}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{caption}</Typography>
    </Paper>
  </Grid>
);

const Metric = ({ title, value, unit, note, icon, color = 'primary' }) => (
  <Grid item xs={6} md={3}>
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">{title}</Typography>
        <Avatar sx={{ bgcolor: `${color}.light`, width: 32, height: 32 }}>{icon}</Avatar>
      </Box>
      {value == null ? (
        <Typography variant="h6" color="text.secondary">Not available</Typography>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography variant="h4" fontWeight={700} color={`${color}.main`}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{unit}</Typography>
        </Box>
      )}
      <Typography variant="caption" color="text.secondary">{note}</Typography>
    </Paper>
  </Grid>
);

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales-dashboard?range=${range}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'The sales dashboard could not be loaded');
      setData(body);
      setError('');
    } catch (e) {
      setError(e.message || 'The sales dashboard could not be loaded');
    }
    setLoading(false);
  }, [range]);
  useEffect(() => { load(); }, [load]);

  const p = data?.pipeline || {};
  const perf = data?.performance || {};
  const period = RANGE_LABEL[range];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Sales Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">RFQs and quotes, counted from the live system</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Period</InputLabel>
            <Select value={range} label="Period" onChange={(e) => setRange(e.target.value)}>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load} disabled={loading}>Refresh</Button>
          <Button variant="contained" onClick={() => navigate('/sales/rfq-inbox')}>RFQs &amp; Quotes</Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {data?.alerts?.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderLeft: 4, borderColor: 'warning.main' }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {data.alerts.map((a) => (
              <Box key={a.type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" fontSize="small" />
                <Typography variant="body2">{a.message}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Count value={p.newRfqs} caption={`New RFQs ${period}`} color="info.main" />
            <Count value={p.drafting} caption="Quotes being written" color="warning.main" />
            <Count value={p.awaitingCustomer} caption="Waiting on the customer" color="primary.main" />
            <Count value={p.won} caption={`Won ${period}`} color="success.main" />
            <Count value={p.lost} caption={`Lost or expired ${period}`} color="error.main" />
            <Count value={money(p.openValue)} caption="Value of open quotes" />
          </Grid>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Results {period}</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Metric title="Win rate" value={perf.winRate} unit="%" note="Won, out of quotes decided" icon={<EmojiEvents fontSize="small" />} color="success" />
            <Metric title="Time to first quote" value={perf.avgResponseHours} unit="hrs" note="From RFQ entered to first quote" icon={<AccessTime fontSize="small" />} color="info" />
            <Metric title="RFQs turned into orders" value={perf.conversionRate} unit="%" note="RFQs received that already have an accepted quote" icon={<TrendingUp fontSize="small" />} />
            <Metric title="Average margin" value={perf.avgMargin} unit="%" note="Needs product costs, which are not recorded yet" icon={<AttachMoney fontSize="small" />} color="warning" />
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Latest quotes</Typography>
                {data.recentQuotes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No quotes yet.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Quote</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recentQuotes.map((q) => (
                        <TableRow key={q.id} hover>
                          <TableCell>{q.quoteNumber}</TableCell>
                          <TableCell>{q.customer}</TableCell>
                          <TableCell align="right">{money(q.value)}</TableCell>
                          <TableCell><Chip size="small" label={label(q.status)} color={STATUS_COLOR[q.status] || 'default'} /></TableCell>
                          <TableCell>{q.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Quotes won by person, {period}</Typography>
                {data.leaderboard.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No quotes were decided {period}.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Won</TableCell>
                        <TableCell align="right">Value won</TableCell>
                        <TableCell align="right">Win rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.leaderboard.map((r) => (
                        <TableRow key={r.name}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell align="right">{r.quotesWon}</TableCell>
                          <TableCell align="right">{money(r.revenue)}</TableCell>
                          <TableCell align="right">{r.winRate == null ? '—' : `${r.winRate}%`}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default SalesDashboard;
