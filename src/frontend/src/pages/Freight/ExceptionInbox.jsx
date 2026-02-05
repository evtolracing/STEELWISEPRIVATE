import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Avatar,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Divider,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Warning,
  Error as ErrorIcon,
  Info,
  CheckCircle,
  Schedule,
  LocalShipping,
  Search,
  FilterList,
  Assignment,
  Person,
  Phone,
  Chat,
  Visibility,
  ArrowForward,
  Flag,
  Timer,
  AttachFile,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock exception data
const mockExceptions = [
  {
    id: 'EXC-2026-000045',
    shipmentId: 'SHIP-2026-000420',
    type: 'DELAY',
    severity: 'HIGH',
    status: 'OPEN',
    title: 'Traffic delay on I-90',
    description: 'Heavy traffic reported due to accident. Estimated 45 minute delay.',
    carrier: 'National Carriers',
    customer: 'Steel Solutions LLC',
    destination: 'Cleveland, OH',
    eta: 'Delayed 45 min',
    createdAt: '2026-02-04 09:30 AM',
    assignedTo: null,
    impact: 'Delivery will be late. Customer promised by 10 AM.',
    suggestedActions: [
      'Notify customer of delay',
      'Update ETA in system',
      'Monitor for further delays',
    ],
  },
  {
    id: 'EXC-2026-000044',
    shipmentId: 'SHIP-2026-000418',
    type: 'DAMAGE',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    title: 'Package damage reported during transit',
    description: 'Carrier reported minor damage to outer packaging. Contents appear secure.',
    carrier: 'Express Freight',
    customer: 'Pacific Industries',
    destination: 'Los Angeles, CA',
    createdAt: '2026-02-04 08:15 AM',
    assignedTo: 'Maria Garcia',
    impact: 'Customer may refuse delivery if damage is significant.',
    suggestedActions: [
      'Request photos from carrier',
      'Assess damage severity',
      'Prepare replacement if needed',
      'Document for carrier claim',
    ],
    notes: [
      { user: 'Maria Garcia', time: '08:45 AM', text: 'Requested photos from carrier' },
      { user: 'System', time: '09:00 AM', text: 'Photos received - minor dent on corner' },
    ],
  },
  {
    id: 'EXC-2026-000043',
    shipmentId: 'SHIP-2026-000412',
    type: 'ADDRESS',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'Delivery address incomplete',
    description: 'Driver reports suite number missing from delivery address.',
    carrier: 'Local Express',
    customer: 'Tech Innovations Inc',
    destination: 'Detroit, MI',
    createdAt: '2026-02-04 07:45 AM',
    assignedTo: null,
    impact: 'Cannot complete delivery without correct address.',
    suggestedActions: [
      'Contact customer for suite number',
      'Update delivery address',
      'Relay info to driver',
    ],
  },
  {
    id: 'EXC-2026-000042',
    shipmentId: 'SHIP-2026-000410',
    type: 'REFUSED',
    severity: 'HIGH',
    status: 'RESOLVED',
    title: 'Delivery refused - wrong material',
    description: 'Customer claims material does not match order specifications.',
    carrier: 'Regional Logistics',
    customer: 'Industrial Parts LLC',
    destination: 'Toledo, OH',
    createdAt: '2026-02-03 02:30 PM',
    resolvedAt: '2026-02-03 04:00 PM',
    assignedTo: 'John Smith',
    resolution: 'Verified order was correct. Customer confirmed receipt after review.',
    impact: 'Resolved - no impact.',
  },
  {
    id: 'EXC-2026-000041',
    shipmentId: 'SHIP-2026-000408',
    type: 'DOCUMENTATION',
    severity: 'LOW',
    status: 'RESOLVED',
    title: 'Missing COA document',
    description: 'Certificate of Analysis not included in shipment documentation.',
    carrier: 'FastFreight Trucking',
    customer: 'Midwest Manufacturing',
    destination: 'Indianapolis, IN',
    createdAt: '2026-02-03 10:00 AM',
    resolvedAt: '2026-02-03 11:30 AM',
    assignedTo: 'Sarah Wilson',
    resolution: 'COA emailed to customer. Physical copy mailed separately.',
    impact: 'Resolved - minor delay in customer acceptance.',
  },
];

const ExceptionInbox = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedExc, setSelectedExc] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const getSeverityColor = (severity) => {
    const colors = {
      'CRITICAL': 'error',
      'HIGH': 'warning',
      'MEDIUM': 'info',
      'LOW': 'default',
    };
    return colors[severity] || 'default';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <ErrorIcon color="error" />;
      case 'HIGH': return <Warning color="warning" />;
      case 'MEDIUM': return <Info color="info" />;
      default: return <Info color="action" />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'DELAY': 'Transit Delay',
      'DAMAGE': 'Damage Report',
      'ADDRESS': 'Address Issue',
      'REFUSED': 'Delivery Refused',
      'DOCUMENTATION': 'Documentation',
      'WEATHER': 'Weather Delay',
      'CARRIER': 'Carrier Issue',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'error',
      'IN_PROGRESS': 'warning',
      'RESOLVED': 'success',
    };
    return colors[status] || 'default';
  };

  const filterExceptions = (exceptions) => {
    let filtered = exceptions;
    
    if (activeTab === 1) {
      filtered = exceptions.filter(e => e.status === 'OPEN');
    } else if (activeTab === 2) {
      filtered = exceptions.filter(e => e.status === 'IN_PROGRESS');
    } else if (activeTab === 3) {
      filtered = exceptions.filter(e => e.status === 'RESOLVED');
    }

    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.customer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const openCount = mockExceptions.filter(e => e.status === 'OPEN').length;
  const inProgressCount = mockExceptions.filter(e => e.status === 'IN_PROGRESS').length;
  const criticalCount = mockExceptions.filter(e => e.severity === 'CRITICAL' && e.status !== 'RESOLVED').length;

  const handleViewDetails = (exc) => {
    setSelectedExc(exc);
    setDetailsDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Exception Inbox
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage freight exceptions and delivery issues
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/freight/tracking')}
          >
            View Tracking Board
          </Button>
        </Box>
      </Box>

      {/* Alert Banner */}
      {criticalCount > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={500}>
            ⚠️ {criticalCount} critical exception(s) require immediate attention
          </Typography>
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="error.main">
              {openCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">Open</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="warning.main">
              {inProgressCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">In Progress</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="error.dark">
              {criticalCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">Critical</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {mockExceptions.filter(e => e.status === 'RESOLVED').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Resolved Today</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs & Search */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label={<Badge badgeContent={mockExceptions.length} color="primary">All</Badge>} />
            <Tab label={<Badge badgeContent={openCount} color="error">Open</Badge>} />
            <Tab label={<Badge badgeContent={inProgressCount} color="warning">In Progress</Badge>} />
            <Tab label="Resolved" />
          </Tabs>
        </Box>
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search exceptions..."
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

      {/* Exception List */}
      <Paper>
        <List>
          {filterExceptions(mockExceptions).map((exc, index) => (
            <React.Fragment key={exc.id}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{ 
                  py: 2,
                  bgcolor: exc.severity === 'CRITICAL' && exc.status !== 'RESOLVED' 
                    ? 'error.50' 
                    : 'transparent',
                }}
              >
                <ListItemIcon>
                  {getSeverityIcon(exc.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {exc.title}
                      </Typography>
                      <Chip 
                        label={getTypeLabel(exc.type)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20 }}
                      />
                      <Chip 
                        label={exc.severity}
                        size="small"
                        color={getSeverityColor(exc.severity)}
                        sx={{ height: 20 }}
                      />
                      <Chip 
                        label={exc.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(exc.status)}
                        sx={{ height: 20 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {exc.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          <LocalShipping fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                          {exc.shipmentId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {exc.carrier} → {exc.destination}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <Schedule fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                          {exc.createdAt}
                        </Typography>
                        {exc.assignedTo && (
                          <Typography variant="caption" color="primary.main">
                            <Person fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {exc.assignedTo}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {exc.status !== 'RESOLVED' && !exc.assignedTo && (
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => { setSelectedExc(exc); setAssignDialogOpen(true); }}
                      >
                        Assign
                      </Button>
                    )}
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => handleViewDetails(exc)}
                    >
                      View
                    </Button>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}

          {filterExceptions(mockExceptions).length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography color="text.secondary">
                No exceptions found
              </Typography>
            </Box>
          )}
        </List>
      </Paper>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedExc && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getSeverityIcon(selectedExc.severity)}
                <Box>
                  <Typography variant="h6">{selectedExc.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedExc.id} • {selectedExc.shipmentId}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Description</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedExc.description}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>Impact</Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {selectedExc.impact}
                  </Alert>

                  <Typography variant="subtitle2" gutterBottom>Suggested Actions</Typography>
                  <List dense>
                    {selectedExc.suggestedActions?.map((action, i) => (
                      <ListItem key={i} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <ArrowForward fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={action} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Details</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Carrier</Typography>
                      <Typography variant="body2">{selectedExc.carrier}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Customer</Typography>
                      <Typography variant="body2">{selectedExc.customer}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Destination</Typography>
                      <Typography variant="body2">{selectedExc.destination}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Created</Typography>
                      <Typography variant="body2">{selectedExc.createdAt}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Assigned To</Typography>
                      <Typography variant="body2">{selectedExc.assignedTo || 'Unassigned'}</Typography>
                    </Box>
                  </Box>

                  {selectedExc.notes && selectedExc.notes.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>Activity Log</Typography>
                      {selectedExc.notes.map((note, i) => (
                        <Box key={i} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="caption" fontWeight={500}>
                            {note.user} • {note.time}
                          </Typography>
                          <Typography variant="body2">{note.text}</Typography>
                        </Box>
                      ))}
                    </>
                  )}

                  {selectedExc.resolution && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>Resolution</Typography>
                      <Alert severity="success">
                        {selectedExc.resolution}
                      </Alert>
                    </>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              {selectedExc.status !== 'RESOLVED' && (
                <>
                  <Button variant="outlined" startIcon={<Chat />}>
                    Add Note
                  </Button>
                  <Button variant="contained" color="success" startIcon={<CheckCircle />}>
                    Mark Resolved
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Exception</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign this exception to a team member for resolution.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Assign To</InputLabel>
            <Select defaultValue="" label="Assign To">
              <MenuItem value="maria">Maria Garcia</MenuItem>
              <MenuItem value="john">John Smith</MenuItem>
              <MenuItem value="sarah">Sarah Wilson</MenuItem>
              <MenuItem value="mike">Mike Thompson</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAssignDialogOpen(false)}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExceptionInbox;
