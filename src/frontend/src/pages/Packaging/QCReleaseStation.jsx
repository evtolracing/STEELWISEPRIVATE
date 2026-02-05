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
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Lock,
  Block,
  Visibility,
  ThumbUp,
  ThumbDown,
  PauseCircle,
  Person,
  Scale,
  Straighten,
  Inventory2,
  VerifiedUser,
} from '@mui/icons-material';

// Mock Data
const pendingPackages = [
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
    priority: 'NORMAL',
    submittedAt: '2026-02-04 09:30 AM',
    submittedBy: 'Mike Rodriguez',
    items: 3,
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
    priority: 'HIGH',
    submittedAt: '2026-02-04 09:15 AM',
    submittedBy: 'Tom Davis',
    items: 2,
  },
];

const selectedPackageDetails = {
  id: 'PKG-2026-000040',
  orderId: 'ORD-2026-1230',
  customer: 'Fabrication Inc.',
  customerPO: 'FAB-2026-112',
  material: 'CS 1018',
  spec: 'ASTM A36',
  heat: 'H2026-3301',
  quantity: 24,
  weight: 4800,
  expectedWeight: 4780,
  weightVariance: 0.4,
  packageType: 'SKID',
  priority: 'NORMAL',
  items: [
    {
      id: 'ITEM-001',
      material: 'CS 1018',
      spec: 'ASTM A36',
      heat: 'H2026-3301',
      dimensions: '48" x 120" x 0.500"',
      quantity: 10,
      weight: 2000,
      inspectionId: 'INS-2026-0892',
      inspectionResult: 'PASSED',
      mtrRef: 'MTR-H2026-3301',
    },
    {
      id: 'ITEM-002',
      material: 'CS 1018',
      spec: 'ASTM A36',
      heat: 'H2026-3301',
      dimensions: '48" x 96" x 0.500"',
      quantity: 8,
      weight: 1600,
      inspectionId: 'INS-2026-0893',
      inspectionResult: 'PASSED',
      mtrRef: 'MTR-H2026-3301',
    },
    {
      id: 'ITEM-003',
      material: 'CS 1018',
      spec: 'ASTM A36',
      heat: 'H2026-3301',
      dimensions: '48" x 72" x 0.500"',
      quantity: 6,
      weight: 1200,
      inspectionId: 'INS-2026-0894',
      inspectionResult: 'PASSED',
      mtrRef: 'MTR-H2026-3301',
    },
  ],
};

const QCReleaseStation = () => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  const [checklist, setChecklist] = useState({
    materialGrade: false,
    heatNumber: false,
    quantity: false,
    weight: false,
    dimensions: false,
    qualityHolds: false,
    inspectionRecords: false,
    visualInspection: false,
  });

  const allChecked = Object.values(checklist).every(v => v);

  const handleCheckChange = (key) => {
    setChecklist({ ...checklist, [key]: !checklist[key] });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'EXPEDITE': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            QC Release Station
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and release packages for sealing
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>Janet Smith</Typography>
            <Typography variant="caption" color="text.secondary">QC Inspector</Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Pending List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Pending Release ({pendingPackages.length})
            </Typography>
          </Paper>
          
          {pendingPackages.map((pkg) => (
            <Card 
              key={pkg.id}
              sx={{ 
                mb: 2, 
                cursor: 'pointer',
                border: selectedPackage?.id === pkg.id ? '2px solid' : '1px solid',
                borderColor: selectedPackage?.id === pkg.id ? 'primary.main' : 'divider',
                '&:hover': { boxShadow: 2 }
              }}
              onClick={() => setSelectedPackage(selectedPackageDetails)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                    {pkg.id}
                  </Typography>
                  {pkg.priority !== 'NORMAL' && (
                    <Chip 
                      label={pkg.priority} 
                      size="small" 
                      color={getPriorityColor(pkg.priority)}
                    />
                  )}
                </Box>
                <Typography variant="body2" fontWeight={500}>{pkg.customer}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {pkg.material} • {pkg.quantity} pcs • {pkg.weight.toLocaleString()} lbs
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Submitted: {pkg.submittedAt} by {pkg.submittedBy}
                </Typography>
              </CardContent>
            </Card>
          ))}

          {pendingPackages.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                All packages released!
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Selected Package Details */}
        <Grid item xs={12} md={8}>
          {selectedPackage ? (
            <>
              {/* Package Summary */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{selectedPackage.id}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPackage.customer} • PO: {selectedPackage.customerPO}
                    </Typography>
                  </Box>
                  <Chip label={selectedPackage.packageType} />
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Material</Typography>
                    <Typography variant="body1" fontWeight={500}>{selectedPackage.material}</Typography>
                    <Typography variant="caption">{selectedPackage.spec}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Heat</Typography>
                    <Typography variant="body1" fontWeight={500}>{selectedPackage.heat}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Quantity</Typography>
                    <Typography variant="body1" fontWeight={500}>{selectedPackage.quantity} pcs</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Weight</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedPackage.weight.toLocaleString()} lbs
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      Variance: +{selectedPackage.weightVariance}%
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Items Table */}
              <Paper sx={{ mb: 3 }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Package Contents ({selectedPackage.items.length} items)
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Material</TableCell>
                        <TableCell>Heat</TableCell>
                        <TableCell>Dimensions</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Weight</TableCell>
                        <TableCell>Inspection</TableCell>
                        <TableCell>MTR</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPackage.items.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="body2">{item.material}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.spec}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.heat} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{item.dimensions}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{item.weight.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={item.inspectionResult} 
                              size="small" 
                              color="success"
                              icon={<CheckCircle />}
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="small" startIcon={<Visibility />}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Verification Checklist */}
              <Paper sx={{ mb: 3, p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Verification Checklist
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={checklist.materialGrade}
                          onChange={() => handleCheckChange('materialGrade')}
                        />
                      }
                      label="Material grade matches order"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={checklist.heatNumber}
                          onChange={() => handleCheckChange('heatNumber')}
                        />
                      }
                      label="Heat number verified"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={checklist.quantity}
                          onChange={() => handleCheckChange('quantity')}
                        />
                      }
                      label="Quantity correct"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={checklist.weight}
                          onChange={() => handleCheckChange('weight')}
                        />
                      }
                      label={`Weight within tolerance (±2%) — Variance: +${selectedPackage.weightVariance}%`}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={checklist.dimensions}
                          onChange={() => handleCheckChange('dimensions')}
                        />
                      }
                      label="Dimensions verified"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={checklist.qualityHolds}
                          onChange={() => handleCheckChange('qualityHolds')}
                        />
                      }
                      label="No active quality holds"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={checklist.inspectionRecords}
                          onChange={() => handleCheckChange('inspectionRecords')}
                        />
                      }
                      label="Inspection records complete"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={checklist.visualInspection}
                          onChange={() => handleCheckChange('visualInspection')}
                        />
                      }
                      label="Visual inspection acceptable"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Actions */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      size="large"
                      startIcon={<ThumbDown />}
                      onClick={() => setShowRejectDialog(true)}
                    >
                      Reject
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button
                      variant="contained"
                      color="warning"
                      fullWidth
                      size="large"
                      startIcon={<PauseCircle />}
                      onClick={() => setShowHoldDialog(true)}
                    >
                      Place on Hold
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      size="large"
                      startIcon={<ThumbUp />}
                      disabled={!allChecked}
                      onClick={() => setShowReleaseDialog(true)}
                    >
                      Release to Seal
                    </Button>
                  </Grid>
                </Grid>

                {!allChecked && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Complete all checklist items to enable release
                  </Alert>
                )}
              </Paper>
            </>
          ) : (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <VerifiedUser sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Select a package to review
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click on a package from the pending list to begin QC review
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Release Dialog */}
      <Dialog open={showReleaseDialog} onClose={() => setShowReleaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThumbUp color="success" />
            Release Package for Sealing
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            All verification checks passed
          </Alert>
          <Typography variant="body2" paragraph>
            By releasing this package, you confirm that:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Material identity has been verified" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="All quality requirements are met" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Package is ready for sealing and shipment" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReleaseDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={() => { setShowReleaseDialog(false); alert('Package released!'); }}
          >
            Confirm Release
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hold Dialog */}
      <Dialog open={showHoldDialog} onClose={() => setShowHoldDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PauseCircle color="warning" />
            Place Package on Hold
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Package will be blocked until hold is resolved
          </Alert>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Hold Reason</InputLabel>
            <Select label="Hold Reason" defaultValue="">
              <MenuItem value="inspection">Additional Inspection Required</MenuItem>
              <MenuItem value="documentation">Missing Documentation</MenuItem>
              <MenuItem value="verification">Heat Verification Needed</MenuItem>
              <MenuItem value="weight">Weight Discrepancy</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Details"
            placeholder="Describe the issue and what is needed to resolve..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHoldDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="warning"
            onClick={() => { setShowHoldDialog(false); alert('Package placed on hold!'); }}
          >
            Confirm Hold
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThumbDown color="error" />
            Reject Package
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Package will be returned for rework
          </Alert>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Rejection Reason</InputLabel>
            <Select label="Rejection Reason" defaultValue="">
              <MenuItem value="material">Material Mismatch</MenuItem>
              <MenuItem value="heat">Wrong Heat Number</MenuItem>
              <MenuItem value="quantity">Quantity Error</MenuItem>
              <MenuItem value="damage">Material Damage</MenuItem>
              <MenuItem value="contamination">Contamination</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Details"
            placeholder="Describe the issue in detail..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => { setShowRejectDialog(false); alert('Package rejected!'); }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QCReleaseStation;
