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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Send,
  Delete,
  Add,
  QrCodeScanner,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Scale,
  Straighten,
  Inventory2,
  Print,
  Visibility,
  LocalShipping,
} from '@mui/icons-material';

// Mock Package Data
const packageData = {
  id: 'PKG-2026-000042',
  orderId: 'ORD-2026-1234',
  jobId: 'JOB-2026-0042',
  customer: 'Aerospace Dynamics Inc.',
  customerPO: 'AD-2026-0892',
  shipDate: '2026-02-05',
  priority: 'EXPEDITE',
  status: 'PACKING',
  packageType: 'PALLET',
  packageNumber: 1,
  totalPackages: 3,
  grossWeight: 2512,
  netWeight: 2450,
  tareWeight: 62,
};

const orderItems = [
  {
    id: 'ITEM-001',
    material: '304 Stainless Steel',
    spec: 'ASTM A240',
    heat: 'H2026-4521',
    dimensions: '48" x 96" x 0.250"',
    quantity: 12,
    unitWeight: 204.2,
    totalWeight: 2450.4,
    inventoryUnit: 'INV-2026-4521-A',
    inspectionStatus: 'PASSED',
    qualityHold: false,
    inPackage: true,
  },
  {
    id: 'ITEM-002',
    material: '304 Stainless Steel',
    spec: 'ASTM A240',
    heat: 'H2026-4521',
    dimensions: '48" x 96" x 0.250"',
    quantity: 8,
    unitWeight: 204.2,
    totalWeight: 1633.6,
    inventoryUnit: 'INV-2026-4521-B',
    inspectionStatus: 'PASSED',
    qualityHold: false,
    inPackage: false,
  },
  {
    id: 'ITEM-003',
    material: '304 Stainless Steel',
    spec: 'ASTM A240',
    heat: 'H2026-4522',
    dimensions: '48" x 96" x 0.250"',
    quantity: 4,
    unitWeight: 204.2,
    totalWeight: 816.8,
    inventoryUnit: 'INV-2026-4522-A',
    inspectionStatus: 'PASSED',
    qualityHold: false,
    inPackage: false,
  },
];

const packageItems = [
  {
    id: 'PKG-ITEM-001',
    position: 1,
    inventoryUnit: 'INV-2026-4521-A',
    material: '304 Stainless Steel',
    spec: 'ASTM A240',
    heat: 'H2026-4521',
    dimensions: '48" x 96" x 0.250"',
    quantity: 12,
    weight: 2450.4,
    verified: true,
    verifiedAt: '2026-02-04 08:22 AM',
    verifiedBy: 'Mike Rodriguez',
  },
];

const PackageBuilder = () => {
  const [scanInput, setScanInput] = useState('');
  const [items, setItems] = useState(packageItems);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showMixedHeatWarning, setShowMixedHeatWarning] = useState(false);

  const totalItems = items.length;
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  const allVerified = items.every(item => item.verified);

  const uniqueHeats = [...new Set(items.map(item => item.heat))];
  const hasMixedHeats = uniqueHeats.length > 1;

  const validationChecks = [
    { label: 'All items same heat', passed: !hasMixedHeats, warning: hasMixedHeats },
    { label: 'All items verified', passed: allVerified },
    { label: 'Weight within tolerance (±2%)', passed: true, details: 'Variance: +0.8%' },
    { label: 'All inspections passed', passed: true },
    { label: 'No active quality holds', passed: true },
  ];

  const handleScan = () => {
    if (scanInput.trim()) {
      // Simulate adding an item by scan
      const newItem = {
        id: `PKG-ITEM-${Date.now()}`,
        position: items.length + 1,
        inventoryUnit: scanInput,
        material: '304 Stainless Steel',
        spec: 'ASTM A240',
        heat: 'H2026-4521',
        dimensions: '48" x 96" x 0.250"',
        quantity: 1,
        weight: 204.2,
        verified: true,
        verifiedAt: new Date().toLocaleString(),
        verifiedBy: 'Mike Rodriguez',
      };
      setItems([...items, newItem]);
      setScanInput('');
    }
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Package Builder - {packageData.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {packageData.customer} • PO: {packageData.customerPO}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Save />}>
            Save Draft
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Send />}
            disabled={!allVerified}
            onClick={() => setShowSubmitDialog(true)}
          >
            Submit for QC
          </Button>
        </Box>
      </Box>

      {/* Priority Alert */}
      {packageData.priority === 'EXPEDITE' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>EXPEDITE ORDER</strong> - Ship Date: {packageData.shipDate}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Order & Package Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ORDER INFORMATION
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Order</Typography>
                  <Typography variant="body2" fontWeight={500}>{packageData.orderId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Job</Typography>
                  <Typography variant="body2" fontWeight={500}>{packageData.jobId}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Customer</Typography>
                  <Typography variant="body2" fontWeight={500}>{packageData.customer}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Customer PO</Typography>
                  <Typography variant="body2" fontWeight={500}>{packageData.customerPO}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Ship Date</Typography>
                  <Typography variant="body2" fontWeight={500} color="error.main">
                    {packageData.shipDate}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                PACKAGE DETAILS
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select label="Type" defaultValue={packageData.packageType}>
                      <MenuItem value="PALLET">Pallet</MenuItem>
                      <MenuItem value="BUNDLE">Bundle</MenuItem>
                      <MenuItem value="SKID">Skid</MenuItem>
                      <MenuItem value="CRATE">Crate</MenuItem>
                      <MenuItem value="BOX">Box</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Package
                  </Typography>
                  <Typography variant="h6">
                    {packageData.packageNumber} of {packageData.totalPackages}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Gross</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {packageData.grossWeight.toLocaleString()} LBS
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Tare</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {packageData.tareWeight} LBS
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Net</Typography>
                  <Typography variant="body1" fontWeight={600} color="primary.main">
                    {packageData.netWeight.toLocaleString()} LBS
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                VALIDATION
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                {validationChecks.map((check, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {check.passed ? (
                        <CheckCircle color={check.warning ? 'warning' : 'success'} fontSize="small" />
                      ) : (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={check.label}
                      secondary={check.details}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              {hasMixedHeats && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Mixed heats detected: {uniqueHeats.join(', ')}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Items */}
        <Grid item xs={12} md={8}>
          {/* Scan Input */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              SCAN TO ADD ITEM
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                placeholder="Scan barcode or enter inventory unit ID..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeScanner />
                    </InputAdornment>
                  ),
                }}
              />
              <Button variant="contained" onClick={handleScan}>
                Add
              </Button>
              <Button variant="outlined">
                Select from List
              </Button>
            </Box>
          </Paper>

          {/* Items in Package */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                ITEMS IN PACKAGE ({totalItems})
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip label={`${totalQuantity} pcs`} size="small" />
                <Chip label={`${totalWeight.toLocaleString()} lbs`} size="small" color="primary" />
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Material / Spec</TableCell>
                    <TableCell>Heat</TableCell>
                    <TableCell>Dimensions</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Weight</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.position}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{item.material}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.spec}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.heat} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.dimensions}</Typography>
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.weight.toLocaleString()}</TableCell>
                      <TableCell>
                        {item.verified ? (
                          <Tooltip title={`${item.verifiedBy} - ${item.verifiedAt}`}>
                            <CheckCircle color="success" fontSize="small" />
                          </Tooltip>
                        ) : (
                          <Warning color="warning" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Remove">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Scan items to add them to this package
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Available Items from Order */}
          <Paper>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                AVAILABLE FROM ORDER
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Items from this order not yet assigned to a package
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Inventory Unit</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell>Heat</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Weight</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderItems.filter(item => !item.inPackage).map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{item.inventoryUnit}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.material}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.spec}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.heat} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.totalWeight.toLocaleString()}</TableCell>
                      <TableCell>
                        {item.qualityHold ? (
                          <Chip label="ON HOLD" size="small" color="error" />
                        ) : (
                          <Chip label="Available" size="small" color="success" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          startIcon={<Add />}
                          disabled={item.qualityHold}
                        >
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Submit for QC Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Package for QC Review</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Package will be locked for editing after submission
          </Alert>
          <Typography variant="body2" paragraph>
            Please confirm the following before submitting:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="All items verified by barcode scan" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="Package weight recorded" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="No quality holds on included materials" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => { setShowSubmitDialog(false); alert('Submitted for QC!'); }}
          >
            Confirm & Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackageBuilder;
