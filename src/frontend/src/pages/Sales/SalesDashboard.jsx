import React, { useState } from 'react';
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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  AccessTime,
  CheckCircle,
  Cancel,
  Schedule,
  Speed,
  People,
  Star,
  Refresh,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  EmojiEvents,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock dashboard data
const dashboardData = {
  // Pipeline summary
  pipeline: {
    newRfqs: 12,
    inProgress: 24,
    awaitingResponse: 18,
    wonThisWeek: 8,
    lostThisWeek: 3,
    totalValue: 425000,
    avgDealSize: 8500,
  },
  
  // Performance metrics
  performance: {
    avgResponseTime: { value: 1.8, unit: 'hours', target: 2, trend: -15 },
    winRate: { value: 38, unit: '%', target: 35, trend: 8 },
    avgMargin: { value: 21.5, unit: '%', target: 22, trend: -2 },
    promiseAccuracy: { value: 94, unit: '%', target: 95, trend: 3 },
    rfqToCash: { value: 18, unit: 'days', target: 21, trend: -12 },
    conversionRate: { value: 42, unit: '%', target: 40, trend: 5 },
  },
  
  // Team leaderboard
  leaderboard: [
    { name: 'Sarah Wilson', avatar: 'SW', quotesWon: 12, revenue: 145000, margin: 23.5, winRate: 45 },
    { name: 'Mike Thompson', avatar: 'MT', quotesWon: 10, revenue: 128000, margin: 22.1, winRate: 42 },
    { name: 'John Davis', avatar: 'JD', quotesWon: 8, revenue: 95000, margin: 21.8, winRate: 38 },
    { name: 'Lisa Chen', avatar: 'LC', quotesWon: 6, revenue: 72000, margin: 24.2, winRate: 35 },
  ],
  
  // Recent quotes
  recentQuotes: [
    { id: 'QUO-2026-002156', customer: 'AutoMax Mfg', value: 7894, margin: 17, status: 'DRAFT', date: '2026-02-04' },
    { id: 'QUO-2026-002150', customer: 'Pacific Industries', value: 5200, margin: 22, status: 'SENT', date: '2026-02-03' },
    { id: 'QUO-2026-002148', customer: 'Steel Solutions', value: 12500, margin: 19, status: 'NEGOTIATION', date: '2026-02-03' },
    { id: 'QUO-2026-002145', customer: 'Midwest Fab', value: 28500, margin: 24, status: 'ACCEPTED', date: '2026-02-02' },
    { id: 'QUO-2026-002140', customer: 'Industrial Parts', value: 3800, margin: 21, status: 'CONVERTED', date: '2026-02-01' },
  ],
  
  // Alerts
  alerts: [
    { type: 'EXPIRING', count: 3, message: '3 quotes expiring today' },
    { type: 'APPROVAL', count: 2, message: '2 quotes awaiting approval' },
    { type: 'OVERDUE', count: 1, message: '1 RFQ overdue for response' },
  ],
  
  // Margin distribution
  marginDistribution: {
    red: 5,    // Below floor
    yellow: 18, // Below target
    green: 45,  // At target
    blue: 12,   // Above target
  },
};

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('week');
  const [activeTab, setActiveTab] = useState(0);

  const getStatusColor = (status) => {
    const colors = {
      'DRAFT': 'default',
      'SENT': 'info',
      'NEGOTIATION': 'warning',
      'ACCEPTED': 'success',
      'CONVERTED': 'primary',
      'REJECTED': 'error',
    };
    return colors[status] || 'default';
  };

  const MetricCard = ({ title, value, unit, target, trend, icon, color = 'primary' }) => (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
        <Avatar sx={{ bgcolor: `${color}.light`, width: 32, height: 32 }}>
          {icon}
        </Avatar>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography variant="h4" fontWeight={700} color={`${color}.main`}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {unit}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Target: {target}{unit}
        </Typography>
        <Chip 
          size="small"
          icon={trend > 0 ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
          label={`${Math.abs(trend)}%`}
          color={trend > 0 ? 'success' : 'error'}
          sx={{ height: 20, fontSize: '0.65rem' }}
        />
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Sales Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pipeline visibility and performance metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select value={timeRange} label="Period" onChange={(e) => setTimeRange(e.target.value)}>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {dashboardData.alerts.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.50', borderLeft: 4, borderColor: 'warning.main' }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {dashboardData.alerts.map((alert, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" fontSize="small" />
                <Typography variant="body2">
                  {alert.message}
                </Typography>
                <Button size="small" variant="text">View</Button>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Pipeline Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="info.main">
              {dashboardData.pipeline.newRfqs}
            </Typography>
            <Typography variant="caption" color="text.secondary">New RFQs</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="warning.main">
              {dashboardData.pipeline.inProgress}
            </Typography>
            <Typography variant="caption" color="text.secondary">In Progress</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="primary.main">
              {dashboardData.pipeline.awaitingResponse}
            </Typography>
            <Typography variant="caption" color="text.secondary">Awaiting Response</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="success.main">
              {dashboardData.pipeline.wonThisWeek}
            </Typography>
            <Typography variant="caption" color="text.secondary">Won This Week</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} color="error.main">
              {dashboardData.pipeline.lostThisWeek}
            </Typography>
            <Typography variant="caption" color="text.secondary">Lost This Week</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700}>
              ${(dashboardData.pipeline.totalValue / 1000).toFixed(0)}k
            </Typography>
            <Typography variant="caption" color="text.secondary">Pipeline Value</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Performance Metrics
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="Avg Response Time"
            value={dashboardData.performance.avgResponseTime.value}
            unit="hrs"
            target={dashboardData.performance.avgResponseTime.target}
            trend={dashboardData.performance.avgResponseTime.trend}
            icon={<AccessTime fontSize="small" />}
            color="info"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="Win Rate"
            value={dashboardData.performance.winRate.value}
            unit="%"
            target={dashboardData.performance.winRate.target}
            trend={dashboardData.performance.winRate.trend}
            icon={<EmojiEvents fontSize="small" />}
            color="success"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="Avg Margin"
            value={dashboardData.performance.avgMargin.value}
            unit="%"
            target={dashboardData.performance.avgMargin.target}
            trend={dashboardData.performance.avgMargin.trend}
            icon={<AttachMoney fontSize="small" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="Promise Accuracy"
            value={dashboardData.performance.promiseAccuracy.value}
            unit="%"
            target={dashboardData.performance.promiseAccuracy.target}
            trend={dashboardData.performance.promiseAccuracy.trend}
            icon={<CheckCircle fontSize="small" />}
            color="success"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="RFQ-to-Cash"
            value={dashboardData.performance.rfqToCash.value}
            unit="days"
            target={dashboardData.performance.rfqToCash.target}
            trend={dashboardData.performance.rfqToCash.trend}
            icon={<Speed fontSize="small" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard 
            title="Conversion Rate"
            value={dashboardData.performance.conversionRate.value}
            unit="%"
            target={dashboardData.performance.conversionRate.target}
            trend={dashboardData.performance.conversionRate.trend}
            icon={<TrendingUp fontSize="small" />}
            color="primary"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Quotes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Recent Quotes
              </Typography>
              <Button size="small" onClick={() => navigate('/sales/rfq-inbox')}>
                View All
              </Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Quote #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Margin</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.recentQuotes.map((quote) => (
                  <TableRow 
                    key={quote.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/sales/quote/${quote.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} color="primary.main">
                        {quote.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{quote.customer}</TableCell>
                    <TableCell align="right">${quote.value.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${quote.margin}%`}
                        size="small"
                        color={quote.margin >= 22 ? 'success' : quote.margin >= 15 ? 'warning' : 'error'}
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={quote.status}
                        size="small"
                        color={getStatusColor(quote.status)}
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell>{quote.date}</TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Team Leaderboard & Margin Distribution */}
        <Grid item xs={12} md={4}>
          {/* Leaderboard */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Team Leaderboard
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {dashboardData.leaderboard.map((member, idx) => (
              <Box 
                key={member.name}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 1.5,
                  p: 1,
                  bgcolor: idx === 0 ? 'success.50' : 'transparent',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 30 }}>
                  {idx === 0 && <EmojiEvents color="warning" fontSize="small" />}
                  {idx > 0 && <Typography variant="body2" color="text.secondary">#{idx + 1}</Typography>}
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32, fontSize: '0.75rem' }}>
                  {member.avatar}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {member.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {member.quotesWon} won • ${(member.revenue / 1000).toFixed(0)}k
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight={500}>
                    {member.winRate}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    win rate
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>

          {/* Margin Distribution */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Margin Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', height: 24, borderRadius: 1, overflow: 'hidden', mb: 1 }}>
                <Box sx={{ width: `${dashboardData.marginDistribution.red * 1.25}%`, bgcolor: 'error.main' }} />
                <Box sx={{ width: `${dashboardData.marginDistribution.yellow * 1.25}%`, bgcolor: 'warning.main' }} />
                <Box sx={{ width: `${dashboardData.marginDistribution.green * 1.25}%`, bgcolor: 'success.main' }} />
                <Box sx={{ width: `${dashboardData.marginDistribution.blue * 1.25}%`, bgcolor: 'info.main' }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Below Floor</Typography>
                <Typography variant="caption">Above Target</Typography>
              </Box>
            </Box>

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: 'error.main', borderRadius: '50%' }} />
                  <Typography variant="caption">
                    Below Floor: {dashboardData.marginDistribution.red}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: 'warning.main', borderRadius: '50%' }} />
                  <Typography variant="caption">
                    Below Target: {dashboardData.marginDistribution.yellow}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: 'success.main', borderRadius: '50%' }} />
                  <Typography variant="caption">
                    At Target: {dashboardData.marginDistribution.green}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: 'info.main', borderRadius: '50%' }} />
                  <Typography variant="caption">
                    Above Target: {dashboardData.marginDistribution.blue}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesDashboard;
