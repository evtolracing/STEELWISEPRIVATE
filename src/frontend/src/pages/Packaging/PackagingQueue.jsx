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
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  Badge,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add,
  Search,
  Inventory2,
  CheckCircle,
  Warning,
  Schedule,
  LocalShipping,
  Lock,
  PlayArrow,
  Visibility,
  QrCode2,
  Refresh,
  FilterList,
  PriorityHigh,
} from '@mui/icons-material';

// Mock Data
const packages = [
  {
    id: 'PKG-2026-000042',
    orderId: 'ORD-2026-1234',
    customer: 'Aerospace Dynamics Inc.',
    customerPO: 'AD-2026-0892',
    material: '304 Stainless Steel',
    spec: 'ASTM A240',
    heat: 'H2026-4521',
    quantity: 12,
    weight: 2450,
    packageType: 'PALLET',
    status: 'OPEN',
    priority: 'EXPEDITE',
    packageNum: '1 of 3',
    createdAt: '2026-02-04 08:15 AM',
  },
  {
    id: 'PKG-2026-000041',
    orderId: 'ORD-2026-1233',
    customer: 'Metal Works LLC',
    customerPO: 'MW-8821',
    material: '6061-T6 Aluminum',
    spec: 'ASTM B209',
    heat: 'L2026-1122',
    quantity: 8,
    weight: 890,
    packageType: 'BUNDLE',
    status: 'PACKING',
    priority: 'NORMAL',
    packageNum: '1 of 1',
    createdAt: '2026-02-04 07:30 AM',
  },
  {
    id: 'PKG-2026-000040',
    orderId: 'ORD-2026-1230',
    customer: 'Fabrication Inc.',
    customerPO: 'FAB-2026-112',
    material: 'CS 1018',
    spec: 'ASTM A36',
    heat: 'H2026-3301',
    quantity: 24,
    weight: 4800,
    packageType: 'SKID',
    status: 'READY_FOR_QC',
    priority: 'NORMAL',
    packageNum: '1 of 2',
    createdAt: '2026-02-03 03:45 PM',
  },
  {
    id: 'PKG-2026-000039',
    orderId: 'ORD-2026-1228',
    customer: 'Steel Corp America',
    customerPO: 'SCA-99012',
    material: 'A36 Carbon Steel',
    spec: 'ASTM A36',
    heat: 'H2026-2890',
    quantity: 16,
    weight: 3200,
    packageType: 'PALLET',
    status: 'READY_FOR_QC',
    priority: 'HIGH',
    packageNum: '2 of 2',
    createdAt: '2026-02-03 02:00 PM',
  },
  {
    id: 'PKG-2026-000038',
    orderId: 'ORD-2026-1225',
    customer: 'Tube & Pipe Co.',
    customerPO: 'TPC-2026-045',
    material: '316L Stainless Steel',
    spec: 'ASTM A312',
    heat: 'H2026-4412',
    quantity: 20,
    weight: 1650,
    packageType: 'BUNDLE',
    status: 'QC_RELEASED',
    priority: 'NORMAL',
    packageNum: '1 of 1',
    createdAt: '2026-02-03 11:00 AM',
  },
  {
    id: 'PKG-2026-000037',
    orderId: 'ORD-2026-1220',
    customer: 'Precision Machining',
    customerPO: 'PM-88421',
    material: '4140 Alloy Steel',
    spec: 'ASTM A829',
    heat: 'H2026-3890',
    quantity: 6,
    weight: 2100,
    packageType: 'CRATE',
    status: 'SEALED',
    priority: 'NORMAL',
    packageNum: '1 of 1',
    createdAt: '2026-02-02 04:30 PM',
  },
  {
    id: 'PKG-2026-000036',
    orderId: 'ORD-2026-1218',
    customer: 'Industrial Supply Co.',
    customerPO: 'ISC-2026-789',
    material: 'A36 Carbon Steel',
    spec: 'ASTM A36',
    heat: 'H2026-2756',
    quantity: 30,
    weight: 5400,
    packageType: 'PALLET',
    status: 'SEALED',
    priority: 'NORMAL',
    packageNum: '1 of 3',
    createdAt: '2026-02-02 02:00 PM',
  },
  {
    id: 'PKG-2026-000035',
    orderId: 'ORD-2026-1215',
    customer: 'Aerospace Dynamics Inc.',
    customerPO: 'AD-2026-0880',
    material: '304 Stainless Steel',
    spec: 'ASTM A240',
    heat: 'H2026-4380',
    quantity: 10,
    weight: 1980,
    packageType: 'PALLET',
    status: 'STAGED',
    priority: 'NORMAL',
    packageNum: '1 of 1',
    stagingLocation: 'Dock 2',
    createdAt: '2026-02-02 10:00 AM',
  },
  {
    id: 'PKG-2026-000034',
    orderId: 'ORD-2026-1210',
    customer: 'Metal Works LLC',
    customerPO: 'MW-8805',
    material: '6061-T6 Aluminum',
    spec: 'ASTM B209',
    heat: 'L2026-1098',
    quantity: 15,
    weight: 1200,
    packageType: 'BUNDLE',
    status: 'STAGED',
    priority: 'EXPEDITE',
    packageNum: '1 of 1',
    stagingLocation: 'Dock 1',
    createdAt: '2026-02-01 03:00 PM',
  },
  {
    id: 'PKG-2026-000033',
    orderId: 'ORD-2026-1205',
    customer: 'Fabrication Inc.',
    customerPO: 'FAB-2026-098',
    material: 'CS 1018',
    spec: 'ASTM A36',
    heat: 'H2026-3102',
    quantity: 18,
    weight: 3600,
    packageType: 'SKID',
    status: 'LOADED',
    priority: 'NORMAL',
    packageNum: '1 of 1',
    carrier: 'FastFreight Inc.',
    createdAt: '2026-02-01 11:00 AM',
  },
];

const PackagingQueue = () => {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'default';
      case 'PACKING': return 'info';
      case 'READY_FOR_QC': return 'warning';
      case 'QC_RELEASED': return 'success';
      case 'SEALED': return 'primary';
      case 'STAGED': return 'secondary';
      case 'LOADED': return 'success';
      case 'SHIPPED': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'OPEN': return 'Open';
      case 'PACKING': return 'Packing';
      case 'READY_FOR_QC': return 'Ready for QC';
      case 'QC_RELEASED': return 'QC Released';
      case 'SEALED': return 'Sealed';
      case 'STAGED': return 'Staged';
      case 'LOADED': return 'Loaded';
      case 'SHIPPED': return 'Shipped';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN': return <Add />;
      case 'PACKING': return <Inventory2 />;
      case 'READY_FOR_QC': return <Schedule />;
      case 'QC_RELEASED': return <CheckCircle />;
      case 'SEALED': return <Lock />;
      case 'STAGED': return <QrCode2 />;
      case 'LOADED': return <LocalShipping />;
      default: return <Inventory2 />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'EXPEDITE': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'default';
      default: return 'default';
    }
  };

  const getPackagesByStatus = (status) => {
    return packages.filter(pkg => {
      if (pkg.status !== status) return false;
      if (priorityFilter && pkg.priority !== priorityFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return pkg.id.toLowerCase().includes(query) ||
               pkg.customer.toLowerCase().includes(query) ||
               pkg.material.toLowerCase().includes(query);
      }
      return true;
    });
  };

  const countByStatus = (status) => packages.filter(p => p.status === status).length;

  const openCount = countByStatus('OPEN');
  const packingCount = countByStatus('PACKING');
  const qcPendingCount = countByStatus('READY_FOR_QC');
  const qcReleasedCount = countByStatus('QC_RELEASED');
  const sealedCount = countByStatus('SEALED');
  const stagedCount = countByStatus('STAGED');

  const expediteCount = packages.filter(p => 
    p.priority === 'EXPEDITE' && !['LOADED', 'SHIPPED', 'DELIVERED'].includes(p.status)
  ).length;

  const renderPackageCard = (pkg) => (
    <Card 
      key={pkg.id} 
      sx={{ 
        mb: 1.5, 
        cursor: 'pointer',
        border: pkg.priority === 'EXPEDITE' ? '2px solid' : '1px solid',
        borderColor: pkg.priority === 'EXPEDITE' ? 'error.main' : 'divider',
        '&:hover': { boxShadow: 3 }
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
            {pkg.id}
          </Typography>
          {pkg.priority !== 'NORMAL' && (
            <Chip 
              label={pkg.priority} 
              size="small" 
              color={getPriorityColor(pkg.priority)}
              icon={pkg.priority === 'EXPEDITE' ? <PriorityHigh /> : undefined}
            />
          )}
        </Box>
        
        <Typography variant="body2" fontWeight={500} noWrap>
          {pkg.customer}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          PO: {pkg.customerPO}
        </Typography>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="body2" color="text.secondary">
          {pkg.material}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Heat: {pkg.heat} • {pkg.quantity} pcs • {pkg.weight.toLocaleString()} lbs
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
          <Chip label={pkg.packageType} size="small" variant="outlined" />
          <Typography variant="caption" color="text.secondary">{pkg.packageNum}</Typography>
        </Box>

        {pkg.stagingLocation && (
          <Alert severity="info" sx={{ mt: 1, py: 0 }}>
            <Typography variant="caption">{pkg.stagingLocation}</Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          {pkg.status === 'OPEN' && (
            <Button size="small" variant="contained" startIcon={<PlayArrow />} fullWidth>
              Start
            </Button>
          )}
          {pkg.status === 'PACKING' && (
            <Button size="small" variant="contained" color="info" startIcon={<Inventory2 />} fullWidth>
              Continue
            </Button>
          )}
          {pkg.status === 'READY_FOR_QC' && (
            <Button size="small" variant="contained" color="warning" startIcon={<Visibility />} fullWidth>
              Review
            </Button>
          )}
          {pkg.status === 'QC_RELEASED' && (
            <Button size="small" variant="contained" color="success" startIcon={<Lock />} fullWidth>
              Seal
            </Button>
          )}
          {pkg.status === 'SEALED' && (
            <Button size="small" variant="contained" startIcon={<QrCode2 />} fullWidth>
              Stage
            </Button>
          )}
          {pkg.status === 'STAGED' && (
            <Button size="small" variant="outlined" startIcon={<Visibility />} fullWidth>
              View
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderColumn = (title, status, count, color) => (
    <Box sx={{ flex: 1, minWidth: 280, maxWidth: 320 }}>
      <Paper 
        sx={{ 
          p: 1.5, 
          mb: 1, 
          bgcolor: `${color}.light`,
          borderLeft: 4,
          borderColor: `${color}.main`
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(status)}
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
          </Box>
          <Badge badgeContent={count} color={color} />
        </Box>
      </Paper>
      <Box sx={{ maxHeight: 'calc(100vh - 340px)', overflow: 'auto', pr: 0.5 }}>
        {getPackagesByStatus(status).map(renderPackageCard)}
        {getPackagesByStatus(status).length === 0 && (
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              No packages
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Packaging Queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Package, label, and prepare materials for shipment
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            New Package
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {expediteCount > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<PriorityHigh />}>
          <strong>{expediteCount} EXPEDITE package(s)</strong> require immediate attention
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="grey.600">{openCount}</Typography>
              <Typography variant="caption">Open</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="info.main">{packingCount}</Typography>
              <Typography variant="caption">Packing</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">{qcPendingCount}</Typography>
              <Typography variant="caption">QC Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="success.main">{qcReleasedCount}</Typography>
              <Typography variant="caption">Released</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="primary.main">{sealedCount}</Typography>
              <Typography variant="caption">Sealed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="secondary.main">{stagedCount}</Typography>
              <Typography variant="caption">Staged</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select 
                label="Priority" 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="EXPEDITE">Expedite</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Customer</InputLabel>
              <Select label="Customer" defaultValue="">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="aerospace">Aerospace Dynamics</MenuItem>
                <MenuItem value="metal">Metal Works LLC</MenuItem>
                <MenuItem value="fab">Fabrication Inc.</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Package Type</InputLabel>
              <Select label="Package Type" defaultValue="">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="PALLET">Pallet</MenuItem>
                <MenuItem value="BUNDLE">Bundle</MenuItem>
                <MenuItem value="SKID">Skid</MenuItem>
                <MenuItem value="CRATE">Crate</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Kanban Board */}
      <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 2 }}>
        {renderColumn('Open', 'OPEN', openCount, 'grey')}
        {renderColumn('Packing', 'PACKING', packingCount, 'info')}
        {renderColumn('Ready for QC', 'READY_FOR_QC', qcPendingCount, 'warning')}
        {renderColumn('QC Released', 'QC_RELEASED', qcReleasedCount, 'success')}
        {renderColumn('Sealed', 'SEALED', sealedCount, 'primary')}
        {renderColumn('Staged', 'STAGED', stagedCount, 'secondary')}
      </Box>
    </Box>
  );
};

export default PackagingQueue;
