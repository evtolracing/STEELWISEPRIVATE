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
  Tabs,
  Tab,
  Alert,
  Divider,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Search,
  ArrowForward,
  ArrowBack,
  Download,
  LocalShipping,
  Build,
  Inventory,
  CheckCircle,
  Print,
  Timeline,
  QrCode,
  Assignment,
  Thermostat,
  FactCheck,
} from '@mui/icons-material';

// Mock trace result
const mockTraceResult = {
  searchValue: 'HT-2026-1234',
  searchType: 'forward',
  material: {
    heatNumber: 'HT-2026-1234',
    lotNumber: 'LOT-2026-0456',
    supplier: 'Premier Steel Suppliers Inc.',
    receivedDate: '2026-01-15',
    materialType: '4140 Alloy Steel',
    quantity: '500 lbs',
    mtcNumber: 'MTC-2026-0892',
    incomingInspection: 'PASS',
    inspectedBy: 'QC-Williams',
  },
  operations: [
    { 
      sequence: 10, 
      name: 'Saw Cut', 
      operator: 'J. Smith', 
      workCenter: 'SAW-01', 
      startedAt: '2026-01-20 08:00', 
      completedAt: '2026-01-20 09:30',
      inspection: 'PASS',
      inspector: 'QC-Smith',
    },
    { 
      sequence: 20, 
      name: 'CNC Lathe', 
      operator: 'M. Johnson', 
      workCenter: 'LATHE-02', 
      startedAt: '2026-01-20 10:00', 
      completedAt: '2026-01-20 14:00',
      inspection: 'PASS',
      inspector: 'QC-Smith',
    },
    { 
      sequence: 30, 
      name: 'Heat Treatment', 
      operator: 'R. Williams', 
      workCenter: 'HT-01', 
      startedAt: '2026-01-21 07:00', 
      completedAt: '2026-01-21 15:00',
      inspection: 'PASS',
      inspector: 'QC-Johnson',
      parameters: 'Hardening: 1550°F, Tempering: 900°F',
    },
    { 
      sequence: 40, 
      name: 'Grinding', 
      operator: 'T. Davis', 
      workCenter: 'GRIND-01', 
      startedAt: '2026-01-22 08:00', 
      completedAt: '2026-01-22 12:00',
      inspection: 'PASS',
      inspector: 'QC-Smith',
    },
  ],
  finalInspection: {
    result: 'PASS',
    inspector: 'QC-Smith',
    date: '2026-01-22 14:00',
    characteristics: 12,
    passedCount: 12,
    failedCount: 0,
    cocNumber: 'COC-2026-0345',
  },
  shipment: {
    customer: 'ABC Manufacturing Co.',
    shipDate: '2026-01-23',
    bolNumber: 'BOL-2026-0567',
    packageId: 'PKG-2026-0234',
    carrier: 'XYZ Trucking',
    trackingNumber: 'TRK123456789',
    quantity: '25 pcs',
    weight: '125 lbs',
  },
  affectedShipments: [
    { customer: 'ABC Manufacturing Co.', bolNumber: 'BOL-2026-0567', quantity: '25 pcs', shipDate: '2026-01-23' },
    { customer: 'XYZ Industries', bolNumber: 'BOL-2026-0589', quantity: '15 pcs', shipDate: '2026-01-24' },
    { customer: 'DEF Corporation', bolNumber: 'BOL-2026-0601', quantity: '10 pcs', shipDate: '2026-01-25' },
  ],
};

const recentSearches = [
  { type: 'Heat Number', value: 'HT-2026-1234', timestamp: '10:30 AM' },
  { type: 'Package ID', value: 'PKG-2026-0234', timestamp: 'Yesterday' },
  { type: 'BOL', value: 'BOL-2026-0456', timestamp: '2 days ago' },
];

const TraceabilitySearch = () => {
  const [searchType, setSearchType] = useState('forward');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeStep, setActiveStep] = useState(-1);

  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResult({ ...mockTraceResult, searchValue, searchType });
      setLoading(false);
      setActiveStep(0);
    }, 1500);
  };

  const handleQuickSearch = (value) => {
    setSearchValue(value);
    setSearchType('forward');
    handleSearch();
  };

  const clearResults = () => {
    setResult(null);
    setSearchValue('');
    setActiveStep(-1);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Traceability Search
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track materials from receipt through shipment
          </Typography>
        </Box>
        {result && (
          <Button variant="outlined" onClick={clearResults}>
            New Search
          </Button>
        )}
      </Box>

      {/* Search Panel */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Tabs 
          value={searchType} 
          onChange={(e, v) => setSearchType(v)} 
          sx={{ mb: 3 }}
        >
          <Tab 
            value="forward" 
            label="Forward Trace" 
            icon={<ArrowForward />}
            iconPosition="start"
          />
          <Tab 
            value="backward" 
            label="Backward Trace" 
            icon={<ArrowBack />}
            iconPosition="start"
          />
        </Tabs>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {searchType === 'forward' 
            ? 'Start from raw material (Heat/Lot number) and trace forward to shipments'
            : 'Start from shipment (Package/BOL) and trace backward to raw material'
          }
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={searchType === 'forward' ? 'Heat Number / Lot Number' : 'Package ID / BOL Number'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === 'forward' ? 'HT-2026-1234 or LOT-2026-0456' : 'PKG-2026-0001 or BOL-2026-0123'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <QrCode />
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <LoadingButton
              variant="contained"
              loading={loading}
              startIcon={<Search />}
              onClick={handleSearch}
              fullWidth
              size="large"
            >
              Search
            </LoadingButton>
          </Grid>
        </Grid>

        {/* Recent Searches */}
        {!result && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Recent Searches
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {recentSearches.map((search, index) => (
                <Chip
                  key={index}
                  label={`${search.value} (${search.type})`}
                  onClick={() => handleQuickSearch(search.value)}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Results */}
      {result && (
        <Box>
          {/* Summary Alert */}
          <Alert severity="success" sx={{ mb: 3 }}>
            <strong>Trace Complete:</strong> Found complete traceability chain for {result.searchValue}
            <br />
            <Typography variant="caption">
              Material received {result.material.receivedDate} → 
              {result.operations.length} operations → 
              Final inspection {result.finalInspection.date} → 
              Shipped to {result.affectedShipments.length} customer(s)
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Left Column - Timeline */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Traceability Chain
                </Typography>

                <Stepper activeStep={activeStep} orientation="vertical">
                  {/* Material Receipt */}
                  <Step>
                    <StepLabel 
                      StepIconComponent={() => (
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <Inventory sx={{ fontSize: 18 }} />
                        </Avatar>
                      )}
                      onClick={() => setActiveStep(0)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Typography variant="subtitle1" fontWeight={600}>Material Received</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.material.receivedDate}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Heat Number</Typography>
                            <Typography variant="body2" fontWeight={500}>{result.material.heatNumber}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Material</Typography>
                            <Typography variant="body2">{result.material.materialType}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Supplier</Typography>
                            <Typography variant="body2">{result.material.supplier}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Quantity</Typography>
                            <Typography variant="body2">{result.material.quantity}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Chip 
                              label={`Incoming Inspection: ${result.material.incomingInspection}`} 
                              color="success" 
                              size="small"
                              icon={<CheckCircle />}
                            />
                          </Grid>
                        </Grid>
                      </Card>
                      <Button size="small" onClick={() => setActiveStep(1)}>Continue</Button>
                    </StepContent>
                  </Step>

                  {/* Operations */}
                  {result.operations.map((op, index) => (
                    <Step key={op.sequence}>
                      <StepLabel 
                        StepIconComponent={() => (
                          <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                            {op.name.includes('Heat') ? (
                              <Thermostat sx={{ fontSize: 18 }} />
                            ) : (
                              <Build sx={{ fontSize: 18 }} />
                            )}
                          </Avatar>
                        )}
                        onClick={() => setActiveStep(index + 1)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <Typography variant="subtitle1" fontWeight={600}>
                          OP{op.sequence}: {op.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {op.completedAt}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" color="text.secondary">Operator</Typography>
                              <Typography variant="body2">{op.operator}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" color="text.secondary">Work Center</Typography>
                              <Typography variant="body2">{op.workCenter}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" color="text.secondary">Start Time</Typography>
                              <Typography variant="body2">{op.startedAt}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" color="text.secondary">End Time</Typography>
                              <Typography variant="body2">{op.completedAt}</Typography>
                            </Grid>
                            {op.parameters && (
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Parameters</Typography>
                                <Typography variant="body2">{op.parameters}</Typography>
                              </Grid>
                            )}
                            <Grid item xs={12}>
                              <Chip 
                                label={`Inspection: ${op.inspection} by ${op.inspector}`} 
                                color="success" 
                                size="small"
                                icon={<FactCheck />}
                              />
                            </Grid>
                          </Grid>
                        </Card>
                        <Button size="small" onClick={() => setActiveStep(index + 2)}>Continue</Button>
                      </StepContent>
                    </Step>
                  ))}

                  {/* Final Inspection */}
                  <Step>
                    <StepLabel 
                      StepIconComponent={() => (
                        <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                          <CheckCircle sx={{ fontSize: 18 }} />
                        </Avatar>
                      )}
                      onClick={() => setActiveStep(result.operations.length + 1)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Typography variant="subtitle1" fontWeight={600}>Final Inspection</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.finalInspection.date}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Result</Typography>
                            <Chip label={result.finalInspection.result} color="success" size="small" />
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Inspector</Typography>
                            <Typography variant="body2">{result.finalInspection.inspector}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Characteristics</Typography>
                            <Typography variant="body2">{result.finalInspection.passedCount} / {result.finalInspection.characteristics} passed</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">CoC Number</Typography>
                            <Typography variant="body2" color="primary.main">{result.finalInspection.cocNumber}</Typography>
                          </Grid>
                        </Grid>
                      </Card>
                      <Button size="small" onClick={() => setActiveStep(result.operations.length + 2)}>Continue</Button>
                    </StepContent>
                  </Step>

                  {/* Shipment */}
                  <Step>
                    <StepLabel 
                      StepIconComponent={() => (
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                          <LocalShipping sx={{ fontSize: 18 }} />
                        </Avatar>
                      )}
                      onClick={() => setActiveStep(result.operations.length + 2)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Typography variant="subtitle1" fontWeight={600}>Shipped</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.shipment.shipDate}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Customer</Typography>
                            <Typography variant="body2">{result.shipment.customer}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">BOL Number</Typography>
                            <Typography variant="body2" color="primary.main">{result.shipment.bolNumber}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Package ID</Typography>
                            <Typography variant="body2">{result.shipment.packageId}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Quantity</Typography>
                            <Typography variant="body2">{result.shipment.quantity}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Carrier</Typography>
                            <Typography variant="body2">{result.shipment.carrier}</Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Tracking</Typography>
                            <Typography variant="body2">{result.shipment.trackingNumber}</Typography>
                          </Grid>
                        </Grid>
                      </Card>
                    </StepContent>
                  </Step>
                </Stepper>
              </Paper>
            </Grid>

            {/* Right Column - Actions & Summary */}
            <Grid item xs={12} md={4}>
              {/* Export Actions */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Export & Reports
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button variant="outlined" startIcon={<Download />} fullWidth>
                    Export Trace Report
                  </Button>
                  <Button variant="outlined" startIcon={<Assignment />} fullWidth>
                    Generate CoC
                  </Button>
                  <Button variant="outlined" startIcon={<Print />} fullWidth>
                    Print Audit Package
                  </Button>
                </Box>
              </Paper>

              {/* Affected Shipments */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Affected Shipments
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {result.affectedShipments.length} shipments contain material from this heat
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer</TableCell>
                        <TableCell>BOL</TableCell>
                        <TableCell>Qty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.affectedShipments.map((shipment, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">{shipment.customer}</Typography>
                            <Typography variant="caption" color="text.secondary">{shipment.shipDate}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="primary.main">{shipment.bolNumber}</Typography>
                          </TableCell>
                          <TableCell>{shipment.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* No Results State */}
      {!result && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Enter a search value to trace materials
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search by heat number, lot number, package ID, or BOL number
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TraceabilitySearch;
