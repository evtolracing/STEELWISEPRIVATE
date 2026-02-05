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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Error,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  LocalShipping,
  Speed,
  Inventory2,
  HealthAndSafety,
  AttachMoney,
  Approval,
  SmartToy,
  Refresh,
  ArrowUpward,
  ArrowDownward,
  PlayArrow,
  PriorityHigh,
  Schedule,
  Factory,
  Build,
  Report,
  CreditCard,
  Gavel,
  Send,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock cockpit data
const cockpitData = {
  timestamp: '2026-02-04T14:34:00Z',
  overallRisk: {
    score: 62,
    level: 'MEDIUM',
    trend: 7, // vs yesterday
  },
  
  tiles: {
    risk: {
      score: 62,
      level: 'MEDIUM',
      topRisks: [
        { category: 'CAPACITY', description: 'Detroit at 97% utilization', impact: 'HIGH' },
        { category: 'INVENTORY', description: '4140 stock below reorder point', impact: 'MEDIUM' },
        { category: 'QUALITY', description: 'NCR blocking 3 shipments', impact: 'MEDIUM' },
      ],
    },
    service: {
      ordersShippingToday: 47,
      onTrackPct: 96,
      atRiskCount: 4,
      lateCount: 0,
      valueAtRisk: 45000,
      trend: 2,
    },
    capacity: {
      overallUtilization: 78,
      constrainedCount: 2,
      idleHours: 24,
      overtimeScheduled: 8,
      trend: -3,
      byLocation: [
        { code: 'DET', utilization: 97, status: 'CRITICAL' },
        { code: 'CLE', utilization: 58, status: 'LOW' },
        { code: 'CHI', utilization: 82, status: 'OPTIMAL' },
      ],
    },
    inventory: {
      totalValue: 4200000,
      excessValue: 336000,
      excessPct: 8,
      shortageRiskItems: 4,
      daysOfCoverage: 38,
      trend: -2,
    },
    safetyQuality: {
      stopWorkOrders: 0,
      openIncidents: 0,
      openNCRs: 2,
      customerClaims: 1,
      qualityHolds: 3,
      daysSinceIncident: 142,
    },
    margin: {
      mtdMarginPct: 22.1,
      vsTarget: 0.3,
      mtdRevenue: 1850000,
      marginAtRisk: 28000,
      arOverdue: 125000,
      trend: 1.2,
    },
    approvals: {
      pricingOverrides: 2,
      creditExceptions: 1,
      maintenanceDefers: 0,
      qualityWaivers: 1,
      largeOrderApprovals: 1,
      total: 5,
      oldestHours: 4,
    },
  },
  
  suggestedActions: [
    { priority: 1, action: 'Transfer 2 jobs to Cleveland', impact: 'Reduce Detroit to 82%', category: 'CAPACITY' },
    { priority: 2, action: 'Expedite PO-2026-1234', impact: 'Restore 4140 coverage to 7 days', category: 'INVENTORY' },
    { priority: 3, action: 'Review NCR-2026-089 by 2pm', impact: 'Unblock 3 pending shipments', category: 'QUALITY' },
  ],
};

const ExecutiveCockpit = () => {
  const navigate = useNavigate();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const getRiskColor = (level) => {
    const colors = {
      LOW: 'success',
      MEDIUM: 'warning',
      HIGH: 'error',
      CRITICAL: 'error',
    };
    return colors[level] || 'default';
  };

  const getStatusIcon = (level) => {
    switch (level) {
      case 'LOW': return <CheckCircle color="success" />;
      case 'MEDIUM': return <Warning color="warning" />;
      case 'HIGH': return <Error color="error" />;
      case 'CRITICAL': return <Error color="error" />;
      default: return <CheckCircle color="success" />;
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <ArrowUpward fontSize="small" color="error" />;
    if (trend < 0) return <ArrowDownward fontSize="small" color="success" />;
    return <TrendingFlat fontSize="small" color="action" />;
  };

  const handleAiQuery = async () => {
    setIsAiLoading(true);
    // Simulate AI response
    setTimeout(() => {
      setAiResponse({
        answer: `Detroit is at 97% utilization, above the 90% threshold.
        
**Root cause:** 3 large orders added yesterday totaling 18,000 lbs

**Contributing factors:**
- SAW-01 running 12% slower than rated (maintenance flag)
- 2 rush orders expedited from Chicago

**Impact:** 2 orders at risk of missing ship date ($45K value)

**Suggested action:** Transfer ORD-2026-4521 to Cleveland (saves 6 hours, Cleveland at 58% utilization)`,
        confidence: 92,
        sources: ['Production Schedule', 'Work Center Status', 'Order Pipeline'],
      });
      setIsAiLoading(false);
    }, 2000);
  };

  // Tile Component
  const CockpitTile = ({ title, icon, children, status, trend, onClick }) => (
    <Paper 
      sx={{ 
        p: 2, 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 4 } : {},
        borderTop: 4,
        borderColor: status === 'success' ? 'success.main' : 
                     status === 'warning' ? 'warning.main' : 
                     status === 'error' ? 'error.main' : 'grey.300',
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
            {icon}
          </Avatar>
          <Typography variant="subtitle2" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        {trend !== undefined && (
          <Chip 
            size="small"
            icon={getTrendIcon(trend)}
            label={`${trend > 0 ? '+' : ''}${trend}%`}
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        )}
      </Box>
      {children}
    </Paper>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Executive Ops Cockpit
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • Updated {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Overall Risk Score */}
          <Paper 
            sx={{ 
              px: 3, 
              py: 1.5, 
              bgcolor: cockpitData.overallRisk.level === 'MEDIUM' ? 'warning.light' : 
                       cockpitData.overallRisk.level === 'LOW' ? 'success.light' : 'error.light',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {getStatusIcon(cockpitData.overallRisk.level)}
            <Box>
              <Typography variant="caption" color="text.secondary">Overall Status</Typography>
              <Typography variant="h5" fontWeight={700}>
                {cockpitData.overallRisk.level} RISK ({cockpitData.overallRisk.score})
              </Typography>
            </Box>
            <Chip 
              size="small"
              icon={<ArrowUpward fontSize="small" />}
              label={`+${cockpitData.overallRisk.trend} vs yesterday`}
              color="error"
              sx={{ ml: 1 }}
            />
          </Paper>
          <IconButton onClick={() => window.location.reload()}>
            <Refresh />
          </IconButton>
        </Box>
      </Paper>

      {/* Main Tiles Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Risk Summary Tile */}
        <Grid item xs={12} md={3}>
          <CockpitTile 
            title="Today's Risk" 
            icon={<Warning fontSize="small" />}
            status="warning"
          >
            <Box sx={{ textAlign: 'center', my: 2 }}>
              <Typography variant="h2" fontWeight={700} color="warning.main">
                {cockpitData.tiles.risk.score}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Risk Score (0-100)
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" fontWeight={600}>Top Risks:</Typography>
            {cockpitData.tiles.risk.topRisks.slice(0, 2).map((risk, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Box sx={{ 
                  width: 6, height: 6, borderRadius: '50%', 
                  bgcolor: risk.impact === 'HIGH' ? 'error.main' : 'warning.main' 
                }} />
                <Typography variant="caption" noWrap>{risk.description}</Typography>
              </Box>
            ))}
          </CockpitTile>
        </Grid>

        {/* Service Commitments Tile */}
        <Grid item xs={12} md={3}>
          <CockpitTile 
            title="Service Commitments" 
            icon={<LocalShipping fontSize="small" />}
            status={cockpitData.tiles.service.onTrackPct >= 95 ? 'success' : 'warning'}
            trend={cockpitData.tiles.service.trend}
            onClick={() => navigate('/freight/tracking')}
          >
            <Box sx={{ textAlign: 'center', my: 1 }}>
              <Typography variant="h3" fontWeight={700} color={cockpitData.tiles.service.onTrackPct >= 95 ? 'success.main' : 'warning.main'}>
                {cockpitData.tiles.service.onTrackPct}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On-Time Delivery
              </Typography>
            </Box>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="h6" fontWeight={600}>{cockpitData.tiles.service.ordersShippingToday}</Typography>
                  <Typography variant="caption">Shipping Today</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.50' }}>
                  <Typography variant="h6" fontWeight={600} color="warning.main">{cockpitData.tiles.service.atRiskCount}</Typography>
                  <Typography variant="caption">At Risk</Typography>
                </Paper>
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              ${(cockpitData.tiles.service.valueAtRisk / 1000).toFixed(0)}K value at risk
            </Typography>
          </CockpitTile>
        </Grid>

        {/* Capacity Utilization Tile */}
        <Grid item xs={12} md={3}>
          <CockpitTile 
            title="Capacity Utilization" 
            icon={<Speed fontSize="small" />}
            status={cockpitData.tiles.capacity.overallUtilization > 90 ? 'error' : 
                    cockpitData.tiles.capacity.overallUtilization > 85 ? 'warning' : 'success'}
            trend={cockpitData.tiles.capacity.trend}
            onClick={() => navigate('/executive/simulation')}
          >
            <Box sx={{ textAlign: 'center', my: 1 }}>
              <Typography variant="h3" fontWeight={700}>
                {cockpitData.tiles.capacity.overallUtilization}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall Utilization
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              {cockpitData.tiles.capacity.byLocation.map((loc) => (
                <Box key={loc.code} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={600}>{loc.code}</Typography>
                    <Typography 
                      variant="caption" 
                      color={loc.status === 'CRITICAL' ? 'error.main' : 
                             loc.status === 'LOW' ? 'info.main' : 'success.main'}
                    >
                      {loc.utilization}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={loc.utilization} 
                    color={loc.status === 'CRITICAL' ? 'error' : 
                           loc.status === 'LOW' ? 'info' : 'success'}
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </Box>
              ))}
            </Box>
          </CockpitTile>
        </Grid>

        {/* Inventory Exposure Tile */}
        <Grid item xs={12} md={3}>
          <CockpitTile 
            title="Inventory Exposure" 
            icon={<Inventory2 fontSize="small" />}
            status={cockpitData.tiles.inventory.excessPct > 10 ? 'warning' : 'success'}
            trend={cockpitData.tiles.inventory.trend}
          >
            <Box sx={{ textAlign: 'center', my: 1 }}>
              <Typography variant="h3" fontWeight={700}>
                ${(cockpitData.tiles.inventory.totalValue / 1000000).toFixed(1)}M
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Inventory
              </Typography>
            </Box>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.50' }}>
                  <Typography variant="body2" fontWeight={600} color="warning.main">
                    {cockpitData.tiles.inventory.excessPct}%
                  </Typography>
                  <Typography variant="caption">Excess</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'error.50' }}>
                  <Typography variant="body2" fontWeight={600} color="error.main">
                    {cockpitData.tiles.inventory.shortageRiskItems}
                  </Typography>
                  <Typography variant="caption">Shortage Risk</Typography>
                </Paper>
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {cockpitData.tiles.inventory.daysOfCoverage} days avg coverage
            </Typography>
          </CockpitTile>
        </Grid>
      </Grid>

      {/* Second Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Safety & Quality Tile */}
        <Grid item xs={12} md={4}>
          <CockpitTile 
            title="Safety & Quality" 
            icon={<HealthAndSafety fontSize="small" />}
            status={cockpitData.tiles.safetyQuality.stopWorkOrders > 0 ? 'error' : 
                    cockpitData.tiles.safetyQuality.openNCRs > 0 ? 'warning' : 'success'}
          >
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: cockpitData.tiles.safetyQuality.stopWorkOrders > 0 ? 'error.50' : 'success.50' }}>
                  <Typography variant="h5" fontWeight={700} color={cockpitData.tiles.safetyQuality.stopWorkOrders > 0 ? 'error.main' : 'success.main'}>
                    {cockpitData.tiles.safetyQuality.stopWorkOrders}
                  </Typography>
                  <Typography variant="caption">Stop Work</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: cockpitData.tiles.safetyQuality.openNCRs > 0 ? 'warning.50' : 'success.50' }}>
                  <Typography variant="h5" fontWeight={700} color={cockpitData.tiles.safetyQuality.openNCRs > 0 ? 'warning.main' : 'success.main'}>
                    {cockpitData.tiles.safetyQuality.openNCRs}
                  </Typography>
                  <Typography variant="caption">Open NCRs</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {cockpitData.tiles.safetyQuality.qualityHolds}
                  </Typography>
                  <Typography variant="caption">Q Holds</Typography>
                </Paper>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" fontSize="small" />
              <Typography variant="body2" color="success.main" fontWeight={500}>
                {cockpitData.tiles.safetyQuality.daysSinceIncident} days since last incident
              </Typography>
            </Box>
          </CockpitTile>
        </Grid>

        {/* Margin & Cash Tile */}
        <Grid item xs={12} md={4}>
          <CockpitTile 
            title="Margin & Cash" 
            icon={<AttachMoney fontSize="small" />}
            status={cockpitData.tiles.margin.vsTarget >= 0 ? 'success' : 'warning'}
            trend={cockpitData.tiles.margin.trend}
          >
            <Box sx={{ textAlign: 'center', my: 1 }}>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {cockpitData.tiles.margin.mtdMarginPct}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                MTD Margin
              </Typography>
              <Chip 
                size="small" 
                label={`+${cockpitData.tiles.margin.vsTarget}% vs target`} 
                color="success" 
                sx={{ ml: 1, height: 18 }}
              />
            </Box>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="body2" fontWeight={600}>
                    ${(cockpitData.tiles.margin.mtdRevenue / 1000000).toFixed(2)}M
                  </Typography>
                  <Typography variant="caption">MTD Revenue</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.50' }}>
                  <Typography variant="body2" fontWeight={600} color="warning.main">
                    ${(cockpitData.tiles.margin.marginAtRisk / 1000).toFixed(0)}K
                  </Typography>
                  <Typography variant="caption">Margin at Risk</Typography>
                </Paper>
              </Grid>
            </Grid>
          </CockpitTile>
        </Grid>

        {/* Approvals Tile */}
        <Grid item xs={12} md={4}>
          <CockpitTile 
            title="Pending Approvals" 
            icon={<Approval fontSize="small" />}
            status={cockpitData.tiles.approvals.oldestHours > 24 ? 'error' : 
                    cockpitData.tiles.approvals.total > 5 ? 'warning' : 'success'}
          >
            <Box sx={{ textAlign: 'center', my: 1 }}>
              <Badge badgeContent={cockpitData.tiles.approvals.total} color="warning">
                <Typography variant="h3" fontWeight={700}>
                  {cockpitData.tiles.approvals.total}
                </Typography>
              </Badge>
              <Typography variant="caption" color="text.secondary" display="block">
                Pending Approvals
              </Typography>
            </Box>
            <List dense sx={{ mt: 1 }}>
              {cockpitData.tiles.approvals.pricingOverrides > 0 && (
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}><AttachMoney fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary={`${cockpitData.tiles.approvals.pricingOverrides} Pricing Overrides`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              )}
              {cockpitData.tiles.approvals.largeOrderApprovals > 0 && (
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}><Gavel fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary={`${cockpitData.tiles.approvals.largeOrderApprovals} Large Order`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              )}
              {cockpitData.tiles.approvals.qualityWaivers > 0 && (
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}><Report fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary={`${cockpitData.tiles.approvals.qualityWaivers} Quality Waiver`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              )}
            </List>
            <Typography variant="caption" color={cockpitData.tiles.approvals.oldestHours > 12 ? 'error.main' : 'text.secondary'}>
              Oldest: {cockpitData.tiles.approvals.oldestHours} hours
            </Typography>
          </CockpitTile>
        </Grid>
      </Grid>

      {/* Bottom Section: Suggested Actions + AI Assistant */}
      <Grid container spacing={2}>
        {/* Suggested Actions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Suggested Actions
              </Typography>
              <Button variant="outlined" size="small" startIcon={<PlayArrow />} onClick={() => navigate('/executive/simulation')}>
                Run Simulation
              </Button>
            </Box>
            <Grid container spacing={2}>
              {cockpitData.suggestedActions.map((action, idx) => (
                <Grid item xs={12} md={4} key={idx}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'grey.50',
                      borderLeft: 4,
                      borderColor: action.priority === 1 ? 'error.main' : 
                                   action.priority === 2 ? 'warning.main' : 'info.main',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip 
                        label={action.category} 
                        size="small" 
                        color={action.priority === 1 ? 'error' : 'default'}
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Priority {action.priority}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={500} gutterBottom>
                      {action.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Impact: {action.impact}
                    </Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <Button size="small" variant="contained" fullWidth>
                        Take Action
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* AI Assistant Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', bgcolor: 'primary.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <SmartToy fontSize="small" />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                AI Executive Assistant
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ask questions about operations, run simulations, or get explanations for any metric.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip 
                label="Why is Detroit capacity high?" 
                size="small" 
                onClick={() => { setAiQuery("Why is Detroit capacity showing red?"); setAiDialogOpen(true); }}
                sx={{ cursor: 'pointer' }}
              />
              <Chip 
                label="Today's risk summary" 
                size="small" 
                onClick={() => { setAiQuery("Give me today's risk summary"); setAiDialogOpen(true); }}
                sx={{ cursor: 'pointer' }}
              />
              <Chip 
                label="Margin forecast" 
                size="small" 
                onClick={() => { setAiQuery("What's the margin forecast for this month?"); setAiDialogOpen(true); }}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
            <Button 
              variant="contained" 
              fullWidth 
              startIcon={<SmartToy />}
              onClick={() => setAiDialogOpen(true)}
            >
              Ask AI Assistant
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Dialog */}
      <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy color="primary" />
            AI Executive Assistant
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Ask about operations, risks, or run a simulation..."
            sx={{ mb: 2 }}
          />
          {isAiLoading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Analyzing operational data...
              </Typography>
            </Box>
          )}
          {aiResponse && !isAiLoading && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {aiResponse.answer}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Confidence: {aiResponse.confidence}% • Sources: {aiResponse.sources.join(', ')}
                </Typography>
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={handleAiQuery}
            disabled={!aiQuery || isAiLoading}
            startIcon={<Send />}
          >
            Ask
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExecutiveCockpit;
