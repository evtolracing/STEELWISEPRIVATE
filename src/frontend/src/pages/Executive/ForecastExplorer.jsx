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
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
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
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Timeline,
  ShowChart,
  ExpandMore,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  CheckCircle,
  Info,
  Speed,
  Inventory2,
  AttachMoney,
  LocalShipping,
  Assessment,
  DateRange,
  Refresh,
  Download,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Forecast categories
const forecastCategories = [
  { id: 'DEMAND', label: 'Demand Forecast', icon: <TrendingUp /> },
  { id: 'CAPACITY', label: 'Capacity Forecast', icon: <Speed /> },
  { id: 'INVENTORY', label: 'Inventory Forecast', icon: <Inventory2 /> },
  { id: 'MARGIN', label: 'Margin Forecast', icon: <AttachMoney /> },
  { id: 'CASH', label: 'Cash Flow Forecast', icon: <Assessment /> },
];

// Time horizons
const horizons = [
  { id: '1W', label: '1 Week', days: 7 },
  { id: '1M', label: '1 Month', days: 30 },
  { id: '3M', label: '3 Months', days: 90 },
  { id: '12M', label: '12 Months', days: 365 },
];

// Mock forecast data
const mockForecasts = {
  DEMAND: {
    title: 'Demand Forecast',
    unit: 'lbs',
    current: 185000,
    periods: [
      { period: 'Week 6', p10: 165000, p50: 185000, p90: 215000 },
      { period: 'Week 7', p10: 170000, p50: 192000, p90: 225000 },
      { period: 'Week 8', p10: 175000, p50: 198000, p90: 235000 },
      { period: 'Week 9', p10: 168000, p50: 188000, p90: 220000 },
      { period: 'Week 10', p10: 172000, p50: 195000, p90: 230000 },
      { period: 'Week 11', p10: 178000, p50: 200000, p90: 240000 },
      { period: 'Week 12', p10: 182000, p50: 205000, p90: 245000 },
      { period: 'Week 13', p10: 175000, p50: 197000, p90: 235000 },
    ],
    drivers: [
      { factor: 'Seasonal pattern', contribution: '+12%', direction: 'up' },
      { factor: 'Pipeline conversion', contribution: '+8%', direction: 'up' },
      { factor: 'Customer churn', contribution: '-3%', direction: 'down' },
    ],
    accuracy: {
      mape: 8.2,
      trend: 'improving',
      lastUpdated: '2026-02-04T06:00:00Z',
    },
  },
  CAPACITY: {
    title: 'Capacity Utilization Forecast',
    unit: '%',
    current: 78,
    periods: [
      { period: 'Week 6', p10: 72, p50: 78, p90: 86 },
      { period: 'Week 7', p10: 75, p50: 82, p90: 91 },
      { period: 'Week 8', p10: 78, p50: 85, p90: 94 },
      { period: 'Week 9', p10: 73, p50: 80, p90: 89 },
      { period: 'Week 10', p10: 70, p50: 77, p90: 85 },
      { period: 'Week 11', p10: 74, p50: 81, p90: 90 },
      { period: 'Week 12', p10: 76, p50: 83, p90: 92 },
      { period: 'Week 13', p10: 71, p50: 78, p90: 87 },
    ],
    drivers: [
      { factor: 'Demand increase', contribution: '+7%', direction: 'up' },
      { factor: 'Planned maintenance', contribution: '-4%', direction: 'down' },
      { factor: 'New hire ramp-up', contribution: '+2%', direction: 'up' },
    ],
    accuracy: {
      mape: 5.4,
      trend: 'stable',
      lastUpdated: '2026-02-04T06:00:00Z',
    },
  },
  MARGIN: {
    title: 'Gross Margin Forecast',
    unit: '%',
    current: 22.1,
    periods: [
      { period: 'Feb', p10: 20.5, p50: 22.3, p90: 24.2 },
      { period: 'Mar', p10: 21.0, p50: 22.8, p90: 24.8 },
      { period: 'Apr', p10: 21.5, p50: 23.2, p90: 25.1 },
      { period: 'May', p10: 22.0, p50: 23.8, p90: 25.8 },
      { period: 'Jun', p10: 22.2, p50: 24.0, p90: 26.0 },
      { period: 'Q3', p10: 22.5, p50: 24.3, p90: 26.3 },
      { period: 'Q4', p10: 22.8, p50: 24.6, p90: 26.6 },
    ],
    drivers: [
      { factor: 'Price increases', contribution: '+1.2%', direction: 'up' },
      { factor: 'Raw material costs', contribution: '-0.5%', direction: 'down' },
      { factor: 'Efficiency gains', contribution: '+0.4%', direction: 'up' },
    ],
    accuracy: {
      mape: 6.1,
      trend: 'improving',
      lastUpdated: '2026-02-04T06:00:00Z',
    },
  },
};

const mockAssumptions = [
  { category: 'Economic', assumption: 'No recession in forecast period', impact: 'HIGH' },
  { category: 'Commodity', assumption: 'Steel prices +/- 5% from current', impact: 'MEDIUM' },
  { category: 'Customer', assumption: 'Top 10 customers maintain volumes', impact: 'HIGH' },
  { category: 'Operations', assumption: 'No major equipment failures', impact: 'MEDIUM' },
  { category: 'Competition', assumption: 'Market share stable', impact: 'LOW' },
];

const ForecastExplorer = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('DEMAND');
  const [selectedHorizon, setSelectedHorizon] = useState('1M');
  const [activeTab, setActiveTab] = useState(0);

  const forecast = mockForecasts[selectedCategory] || mockForecasts.DEMAND;

  // Simple bar chart visualization (inline SVG)
  const renderForecastChart = () => {
    const data = forecast.periods;
    const maxVal = Math.max(...data.map(d => d.p90));
    const minVal = Math.min(...data.map(d => d.p10)) * 0.9;
    const range = maxVal - minVal;
    const chartHeight = 200;
    const chartWidth = 600;
    const barWidth = chartWidth / data.length - 10;

    return (
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <svg width={chartWidth + 100} height={chartHeight + 60} style={{ display: 'block', margin: '0 auto' }}>
          {/* Y-axis labels */}
          <text x="0" y="20" fontSize="10" fill="#666">{maxVal.toLocaleString()}</text>
          <text x="0" y={chartHeight / 2 + 10} fontSize="10" fill="#666">
            {((maxVal + minVal) / 2).toLocaleString()}
          </text>
          <text x="0" y={chartHeight} fontSize="10" fill="#666">{Math.round(minVal).toLocaleString()}</text>

          {/* Bars */}
          {data.map((d, idx) => {
            const x = 60 + idx * (barWidth + 10);
            const p90Height = ((d.p90 - minVal) / range) * chartHeight;
            const p50Height = ((d.p50 - minVal) / range) * chartHeight;
            const p10Height = ((d.p10 - minVal) / range) * chartHeight;

            return (
              <g key={idx}>
                {/* P90 bar (light) */}
                <rect
                  x={x}
                  y={chartHeight - p90Height}
                  width={barWidth}
                  height={p90Height - p10Height}
                  fill="#e3f2fd"
                  rx={2}
                />
                {/* P50 line */}
                <line
                  x1={x}
                  x2={x + barWidth}
                  y1={chartHeight - p50Height}
                  y2={chartHeight - p50Height}
                  stroke="#1976d2"
                  strokeWidth={3}
                />
                {/* P10 marker */}
                <circle
                  cx={x + barWidth / 2}
                  cy={chartHeight - p10Height}
                  r={4}
                  fill="#90caf9"
                />
                {/* P90 marker */}
                <circle
                  cx={x + barWidth / 2}
                  cy={chartHeight - p90Height}
                  r={4}
                  fill="#90caf9"
                />
                {/* Period label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  fontSize="10"
                  textAnchor="middle"
                  fill="#666"
                >
                  {d.period}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(${chartWidth - 100}, 10)`}>
            <rect x="0" y="0" width="12" height="12" fill="#e3f2fd" />
            <text x="16" y="10" fontSize="10" fill="#666">P10-P90 Range</text>
            <line x1="0" x2="12" y1="24" y2="24" stroke="#1976d2" strokeWidth={3} />
            <text x="16" y="28" fontSize="10" fill="#666">P50 (Expected)</text>
          </g>
        </svg>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Forecast Explorer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View projections with confidence ranges across key metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/executive/cockpit')}>
            Back to Cockpit
          </Button>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
          <Button variant="contained" startIcon={<Refresh />}>
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Forecast Category
            </Typography>
            <ToggleButtonGroup
              value={selectedCategory}
              exclusive
              onChange={(e, val) => val && setSelectedCategory(val)}
              size="small"
            >
              {forecastCategories.map((cat) => (
                <ToggleButton key={cat.id} value={cat.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {cat.icon}
                    <Typography variant="caption">{cat.label}</Typography>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Time Horizon
            </Typography>
            <ToggleButtonGroup
              value={selectedHorizon}
              exclusive
              onChange={(e, val) => val && setSelectedHorizon(val)}
              size="small"
            >
              {horizons.map((h) => (
                <ToggleButton key={h.id} value={h.id}>
                  {h.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={2}>
            <Paper sx={{ p: 1.5, bgcolor: 'grey.50', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Forecast Accuracy
              </Typography>
              <Typography variant="h6" fontWeight={600} color="primary.main">
                {forecast.accuracy.mape}% MAPE
              </Typography>
              <Chip 
                label={forecast.accuracy.trend} 
                size="small" 
                color={forecast.accuracy.trend === 'improving' ? 'success' : 'default'}
                sx={{ height: 18, fontSize: '0.6rem' }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Main Chart Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                {forecast.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small"><ZoomIn /></IconButton>
                <IconButton size="small"><ZoomOut /></IconButton>
              </Box>
            </Box>
            
            {/* Chart */}
            {renderForecastChart()}

            {/* Legend */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={600}>Understanding Confidence Bands:</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: '#90caf9', borderRadius: '50%' }} />
                    <Typography variant="caption">P10 (Pessimistic)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 4, bgcolor: '#1976d2' }} />
                    <Typography variant="caption">P50 (Expected)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: '#e3f2fd', borderRadius: 1 }} />
                    <Typography variant="caption">P90 (Optimistic)</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Side Panel */}
        <Grid item xs={12} md={4}>
          {/* Current Value */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Current {forecast.title}
            </Typography>
            <Typography variant="h3" fontWeight={700} color="primary.main">
              {forecast.current.toLocaleString()}{forecast.unit === '%' ? '%' : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {forecast.unit !== '%' && forecast.unit}
            </Typography>
          </Paper>

          {/* Drivers */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Key Drivers
            </Typography>
            <List dense>
              {forecast.drivers.map((driver, idx) => (
                <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {driver.direction === 'up' ? 
                      <TrendingUp color="success" fontSize="small" /> : 
                      <TrendingDown color="error" fontSize="small" />
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary={driver.factor}
                    secondary={driver.contribution}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ 
                      variant: 'body2', 
                      fontWeight: 600,
                      color: driver.direction === 'up' ? 'success.main' : 'error.main'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Period Details */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Period Details
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">P10</TableCell>
                    <TableCell align="right">P50</TableCell>
                    <TableCell align="right">P90</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {forecast.periods.slice(0, 5).map((period, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{period.period}</TableCell>
                      <TableCell align="right">{period.p10.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{period.p50.toLocaleString()}</TableCell>
                      <TableCell align="right">{period.p90.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Assumptions Section */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info color="action" />
              <Typography fontWeight={600}>Forecast Assumptions & Sensitivities</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              These forecasts are based on the following assumptions. Changes to these factors may significantly impact projections.
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Assumption</TableCell>
                    <TableCell>Sensitivity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockAssumptions.map((assumption, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Chip label={assumption.category} size="small" sx={{ height: 22 }} />
                      </TableCell>
                      <TableCell>{assumption.assumption}</TableCell>
                      <TableCell>
                        <Chip 
                          label={assumption.impact}
                          size="small"
                          color={
                            assumption.impact === 'HIGH' ? 'error' :
                            assumption.impact === 'MEDIUM' ? 'warning' : 'success'
                          }
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" startIcon={<Timeline />}>
                Run Sensitivity Analysis
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => navigate('/executive/simulation')}>
          Open in Simulation
        </Button>
        <Button variant="contained" startIcon={<Assessment />}>
          Generate Report
        </Button>
      </Box>
    </Box>
  );
};

export default ForecastExplorer;
