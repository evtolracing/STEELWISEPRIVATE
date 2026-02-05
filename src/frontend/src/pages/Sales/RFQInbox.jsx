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
  Tabs,
  Tab,
  Badge,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  Email,
  Phone,
  Language,
  MoreVert,
  AccessTime,
  AttachMoney,
  LocalShipping,
  Visibility,
  Edit,
  PersonAdd,
  Star,
  StarBorder,
  Warning,
  CheckCircle,
  Schedule,
  TrendingUp,
  Business,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock RFQ data
const mockRFQs = [
  {
    id: 'RFQ-2026-001234',
    status: 'NEW',
    source: 'EMAIL',
    customer: {
      id: 'CUST-001',
      name: 'AutoMax Manufacturing',
      tier: 'A',
      contact: 'John Smith',
      email: 'john.smith@automax.com',
    },
    items: [
      { material: '304L Stainless Sheet', dimensions: '0.250" x 48" x 96"', qty: 12, unit: 'pcs' },
    ],
    estimatedValue: 4200,
    requestedDate: '2026-02-07',
    receivedAt: '2026-02-04 09:45 AM',
    ageMinutes: 135,
    priority: 'HOT',
    assignedTo: null,
    confidence: 94,
    notes: 'COA required. Reference PO pending.',
  },
  {
    id: 'RFQ-2026-001232',
    status: 'NEW',
    source: 'PORTAL',
    customer: {
      id: 'CUST-002',
      name: 'Steel Solutions LLC',
      tier: 'B',
      contact: 'Sarah Johnson',
      email: 'sarah@steelsolutions.com',
    },
    items: [
      { material: 'A36 Plate', dimensions: '1.000" x 48" x 120"', qty: 5, unit: 'pcs' },
      { material: 'A36 Plate', dimensions: '0.500" x 60" x 120"', qty: 8, unit: 'pcs' },
      { material: '1018 CRS Bar', dimensions: '2.000" dia x 12ft', qty: 20, unit: 'pcs' },
      { material: '4140 HT Bar', dimensions: '3.000" dia x 6ft', qty: 10, unit: 'pcs' },
    ],
    estimatedValue: 12500,
    requestedDate: '2026-02-10',
    receivedAt: '2026-02-04 07:30 AM',
    ageMinutes: 270,
    priority: 'HOT',
    assignedTo: 'Mike Thompson',
    confidence: 98,
    notes: 'Multiple items - processing required on bars.',
  },
  {
    id: 'RFQ-2026-001230',
    status: 'PARSED',
    source: 'EMAIL',
    customer: {
      id: 'CUST-003',
      name: 'Industrial Parts Inc',
      tier: 'A',
      contact: 'Bob Williams',
      email: 'bob@industrialparts.com',
    },
    items: [
      { material: '6061-T6 Aluminum Plate', dimensions: '0.500" x 36" x 48"', qty: 25, unit: 'pcs' },
    ],
    estimatedValue: 3800,
    requestedDate: '2026-02-08',
    receivedAt: '2026-02-04 06:15 AM',
    ageMinutes: 345,
    priority: 'RUSH',
    assignedTo: null,
    confidence: 78,
    notes: 'Parsed from email - needs dimension verification.',
  },
  {
    id: 'RFQ-2026-001228',
    status: 'NEEDS_REVIEW',
    source: 'EMAIL',
    customer: {
      id: 'CUST-004',
      name: 'Precision Machine Works',
      tier: 'C',
      contact: 'Tom Davis',
      email: 'tom@precisionmachine.com',
    },
    items: [
      { material: 'Unknown - See Notes', dimensions: 'Per drawing attached', qty: 1, unit: 'lot' },
    ],
    estimatedValue: null,
    requestedDate: '2026-02-12',
    receivedAt: '2026-02-03 04:30 PM',
    ageMinutes: 1125,
    priority: 'STANDARD',
    assignedTo: null,
    confidence: 42,
    notes: 'Complex drawing attached. Cannot auto-parse material specs.',
  },
  {
    id: 'RFQ-2026-001225',
    status: 'REVIEWED',
    source: 'PHONE',
    customer: {
      id: 'CUST-005',
      name: 'Midwest Fabricators',
      tier: 'A',
      contact: 'Lisa Chen',
      email: 'lisa@midwestfab.com',
    },
    items: [
      { material: '316L SS Sheet', dimensions: '0.125" x 48" x 120"', qty: 50, unit: 'pcs' },
      { material: '316L SS Sheet', dimensions: '0.188" x 48" x 120"', qty: 30, unit: 'pcs' },
    ],
    estimatedValue: 28500,
    requestedDate: '2026-02-14',
    receivedAt: '2026-02-03 02:00 PM',
    ageMinutes: 1275,
    priority: 'STANDARD',
    assignedTo: 'Sarah Wilson',
    confidence: 100,
    notes: 'Ready for pricing. Volume discount may apply.',
  },
  {
    id: 'RFQ-2026-001220',
    status: 'QUOTED',
    source: 'PORTAL',
    customer: {
      id: 'CUST-006',
      name: 'Pacific Industries',
      tier: 'B',
      contact: 'David Park',
      email: 'dpark@pacific-ind.com',
    },
    items: [
      { material: '7075-T6 Aluminum Bar', dimensions: '4.000" x 4.000" x 24"', qty: 15, unit: 'pcs' },
    ],
    estimatedValue: 5200,
    requestedDate: '2026-02-09',
    receivedAt: '2026-02-02 10:00 AM',
    ageMinutes: 2865,
    priority: 'RUSH',
    assignedTo: 'Mike Thompson',
    confidence: 100,
    quoteId: 'QUO-2026-002150',
    quoteSentAt: '2026-02-03 11:00 AM',
  },
];

const RFQInbox = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [newRFQDialogOpen, setNewRFQDialogOpen] = useState(false);

  const statusTabs = [
    { key: 'ALL', label: 'All', count: mockRFQs.length },
    { key: 'NEW', label: 'New', count: mockRFQs.filter(r => r.status === 'NEW').length },
    { key: 'NEEDS_REVIEW', label: 'Needs Review', count: mockRFQs.filter(r => r.status === 'NEEDS_REVIEW').length },
    { key: 'REVIEWED', label: 'Reviewed', count: mockRFQs.filter(r => r.status === 'REVIEWED').length },
    { key: 'QUOTED', label: 'Quoted', count: mockRFQs.filter(r => r.status === 'QUOTED').length },
  ];

  const getSourceIcon = (source) => {
    switch (source) {
      case 'EMAIL': return <Email fontSize="small" />;
      case 'PHONE': return <Phone fontSize="small" />;
      case 'PORTAL': return <Language fontSize="small" />;
      default: return <Email fontSize="small" />;
    }
  };

  const getPriorityColor = (priority) => {
    const colors = { 'HOT': 'error', 'RUSH': 'warning', 'STANDARD': 'default' };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      'NEW': 'info',
      'PARSED': 'info',
      'NEEDS_REVIEW': 'warning',
      'REVIEWED': 'success',
      'QUOTED': 'primary',
    };
    return colors[status] || 'default';
  };

  const formatAge = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  };

  const getTierColor = (tier) => {
    const colors = { 'A': 'success', 'B': 'info', 'C': 'warning', 'NEW': 'default' };
    return colors[tier] || 'default';
  };

  const filterRFQs = () => {
    let filtered = mockRFQs;
    
    if (activeTab > 0) {
      const statusKey = statusTabs[activeTab].key;
      filtered = filtered.filter(r => r.status === statusKey);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.items.some(i => i.material.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const handleMenuOpen = (event, rfq) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRFQ(rfq);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Stats
  const hotCount = mockRFQs.filter(r => r.priority === 'HOT' && r.status !== 'QUOTED').length;
  const avgAge = Math.round(mockRFQs.filter(r => r.status !== 'QUOTED').reduce((sum, r) => sum + r.ageMinutes, 0) / mockRFQs.length);
  const totalValue = mockRFQs.filter(r => r.estimatedValue).reduce((sum, r) => sum + r.estimatedValue, 0);

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            RFQ Inbox
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage incoming quote requests
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setNewRFQDialogOpen(true)}
          >
            New RFQ
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  {hotCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">HOT Priority</Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'error.light' }}>
                <Star />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {formatAge(avgAge)}
                </Typography>
                <Typography variant="caption" color="text.secondary">Avg Response Time</Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <AccessTime />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  ${(totalValue / 1000).toFixed(0)}k
                </Typography>
                <Typography variant="caption" color="text.secondary">Pipeline Value</Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <AttachMoney />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {mockRFQs.filter(r => r.status === 'QUOTED').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">Awaiting Response</Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <Schedule />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs & Search */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            {statusTabs.map((tab, index) => (
              <Tab 
                key={tab.key}
                label={
                  <Badge 
                    badgeContent={tab.count} 
                    color={index === 0 ? 'primary' : index === 2 ? 'warning' : 'default'}
                    max={99}
                  >
                    {tab.label}
                  </Badge>
                }
              />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search RFQs, customers, materials..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" startIcon={<FilterList />}>
            Filter
          </Button>
        </Box>
      </Paper>

      {/* RFQ List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Priority Section - HOT */}
        {filterRFQs().filter(r => r.priority === 'HOT' && r.status !== 'QUOTED').length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="error.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star fontSize="small" /> HOT PRIORITY ({filterRFQs().filter(r => r.priority === 'HOT' && r.status !== 'QUOTED').length})
            </Typography>
            {filterRFQs().filter(r => r.priority === 'HOT' && r.status !== 'QUOTED').map((rfq) => (
              <RFQCard key={rfq.id} rfq={rfq} onMenuOpen={handleMenuOpen} navigate={navigate} formatAge={formatAge} getSourceIcon={getSourceIcon} getPriorityColor={getPriorityColor} getStatusColor={getStatusColor} getTierColor={getTierColor} />
            ))}
          </Box>
        )}

        {/* Other RFQs */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            ALL REQUESTS ({filterRFQs().filter(r => r.priority !== 'HOT' || r.status === 'QUOTED').length})
          </Typography>
          {filterRFQs().filter(r => r.priority !== 'HOT' || r.status === 'QUOTED').map((rfq) => (
            <RFQCard key={rfq.id} rfq={rfq} onMenuOpen={handleMenuOpen} navigate={navigate} formatAge={formatAge} getSourceIcon={getSourceIcon} getPriorityColor={getPriorityColor} getStatusColor={getStatusColor} getTierColor={getTierColor} />
          ))}
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/sales/quote/${selectedRFQ?.id}`); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Create Quote
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); setAssignDialogOpen(true); }}>
          <PersonAdd fontSize="small" sx={{ mr: 1 }} /> Assign
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Visibility fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
      </Menu>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign RFQ</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign {selectedRFQ?.id} to a sales rep.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Sales Rep</InputLabel>
            <Select defaultValue="" label="Sales Rep">
              <MenuItem value="sarah">Sarah Wilson</MenuItem>
              <MenuItem value="mike">Mike Thompson</MenuItem>
              <MenuItem value="john">John Davis</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAssignDialogOpen(false)}>Assign</Button>
        </DialogActions>
      </Dialog>

      {/* New RFQ Dialog */}
      <Dialog open={newRFQDialogOpen} onClose={() => setNewRFQDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New RFQ</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select how to create the new RFQ.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Card 
                variant="outlined" 
                sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
                onClick={() => { setNewRFQDialogOpen(false); navigate('/sales/quote/new'); }}
              >
                <Phone sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>Phone Entry</Typography>
                <Typography variant="caption" color="text.secondary">Manual entry</Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card 
                variant="outlined" 
                sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
              >
                <Email sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>Email Import</Typography>
                <Typography variant="caption" color="text.secondary">AI parsing</Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card 
                variant="outlined" 
                sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
              >
                <Business sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" fontWeight={500}>Quick Quote</Typography>
                <Typography variant="caption" color="text.secondary">Walk-in</Typography>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewRFQDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// RFQ Card Component
const RFQCard = ({ rfq, onMenuOpen, navigate, formatAge, getSourceIcon, getPriorityColor, getStatusColor, getTierColor }) => (
  <Card 
    sx={{ 
      mb: 1.5, 
      cursor: 'pointer',
      '&:hover': { boxShadow: 3 },
      borderLeft: 4,
      borderColor: getPriorityColor(rfq.priority) + '.main',
    }}
    onClick={() => navigate(`/sales/quote/${rfq.id}`)}
  >
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Grid container spacing={2} alignItems="center">
        {/* Left - RFQ Info */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'grey.200' }}>
              {getSourceIcon(rfq.source)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body1" fontWeight={600} color="primary.main">
                  {rfq.id}
                </Typography>
                <Chip 
                  label={rfq.status.replace('_', ' ')}
                  size="small"
                  color={getStatusColor(rfq.status)}
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
                {rfq.confidence < 80 && (
                  <Tooltip title={`AI confidence: ${rfq.confidence}%`}>
                    <Warning fontSize="small" color="warning" />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2" fontWeight={500}>
                {rfq.customer.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`Tier ${rfq.customer.tier}`}
                  size="small"
                  color={getTierColor(rfq.customer.tier)}
                  sx={{ height: 18, fontSize: '0.6rem' }}
                />
                <Typography variant="caption" color="text.secondary">
                  {rfq.customer.contact}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Middle - Items */}
        <Grid item xs={12} md={4}>
          <Box>
            {rfq.items.slice(0, 2).map((item, idx) => (
              <Typography key={idx} variant="body2" color="text.secondary" noWrap>
                {item.qty} {item.unit} × {item.material}
              </Typography>
            ))}
            {rfq.items.length > 2 && (
              <Typography variant="caption" color="primary.main">
                +{rfq.items.length - 2} more items
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Right - Value & Actions */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ textAlign: 'right' }}>
              {rfq.estimatedValue && (
                <Typography variant="body1" fontWeight={600}>
                  ${rfq.estimatedValue.toLocaleString()}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                <Chip 
                  label={rfq.priority}
                  size="small"
                  color={getPriorityColor(rfq.priority)}
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
                <Typography variant="caption" color="text.secondary">
                  ⏱️ {formatAge(rfq.ageMinutes)}
                </Typography>
              </Box>
              {rfq.assignedTo && (
                <Typography variant="caption" color="primary.main">
                  → {rfq.assignedTo}
                </Typography>
              )}
            </Box>
            <IconButton 
              size="small" 
              onClick={(e) => onMenuOpen(e, rfq)}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Grid>
      </Grid>

      {/* Confidence bar for low confidence items */}
      {rfq.confidence < 80 && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="warning.main">
              AI Parse Confidence
            </Typography>
            <Typography variant="caption" fontWeight={500}>
              {rfq.confidence}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={rfq.confidence} 
            color="warning"
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

export default RFQInbox;
