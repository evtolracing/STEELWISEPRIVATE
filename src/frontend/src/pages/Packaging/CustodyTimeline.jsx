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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Lock,
  LockOpen,
  Person,
  LocationOn,
  AccessTime,
  Verified,
  QrCode2,
  Print,
  LocalShipping,
  Inventory2,
  Build,
  AssignmentTurnedIn,
  ContentCopy,
  Info,
} from '@mui/icons-material';

// Mock Chain of Custody Events
const custodyEvents = [
  {
    id: 'COC-001',
    timestamp: '2026-02-04 06:30:00 AM',
    eventType: 'PACKAGE_CREATED',
    description: 'Package created from Order ORD-2026-1234',
    actor: 'Mike Rodriguez',
    actorRole: 'Packaging Operator',
    location: 'Packaging Station 1',
    packageStatus: 'OPEN',
    details: {
      orderId: 'ORD-2026-1234',
      customer: 'Aerospace Dynamics Inc.',
      packageType: 'SKID',
    },
    previousHash: null,
    currentHash: 'a7f3b2c1d4e5f6...',
    verified: true,
  },
  {
    id: 'COC-002',
    timestamp: '2026-02-04 06:45:00 AM',
    eventType: 'ITEM_ADDED',
    description: 'Added 6 pieces of 304SS Sheet to package',
    actor: 'Mike Rodriguez',
    actorRole: 'Packaging Operator',
    location: 'Packaging Station 1',
    packageStatus: 'PACKING',
    details: {
      itemId: 'ITEM-001',
      productId: 'PROD-304SS-SHT-048',
      quantity: 6,
      weight: 1225,
      heat: 'H2026-4521',
    },
    previousHash: 'a7f3b2c1d4e5f6...',
    currentHash: 'b8g4c3d2e6f7g8...',
    verified: true,
  },
  {
    id: 'COC-003',
    timestamp: '2026-02-04 07:15:00 AM',
    eventType: 'ITEM_ADDED',
    description: 'Added 6 pieces of 304SS Sheet to package',
    actor: 'Mike Rodriguez',
    actorRole: 'Packaging Operator',
    location: 'Packaging Station 1',
    packageStatus: 'PACKING',
    details: {
      itemId: 'ITEM-002',
      productId: 'PROD-304SS-SHT-048',
      quantity: 6,
      weight: 1225,
      heat: 'H2026-4521',
    },
    previousHash: 'b8g4c3d2e6f7g8...',
    currentHash: 'c9h5d4e3f7g8h9...',
    verified: true,
  },
  {
    id: 'COC-004',
    timestamp: '2026-02-04 07:30:00 AM',
    eventType: 'SUBMITTED_FOR_QC',
    description: 'Package submitted for QC review',
    actor: 'Mike Rodriguez',
    actorRole: 'Packaging Operator',
    location: 'Packaging Station 1',
    packageStatus: 'READY_FOR_QC',
    details: {
      totalPieces: 12,
      totalWeight: 2450,
      validationPassed: true,
    },
    previousHash: 'c9h5d4e3f7g8h9...',
    currentHash: 'd0i6e5f4g8h9i0...',
    verified: true,
  },
  {
    id: 'COC-005',
    timestamp: '2026-02-04 08:00:00 AM',
    eventType: 'QC_RELEASED',
    description: 'Package released by QC inspector',
    actor: 'Sarah Chen',
    actorRole: 'QC Inspector',
    location: 'QC Station',
    packageStatus: 'QC_RELEASED',
    details: {
      inspectorCertifications: ['AWS CWI', 'NACE Level 2'],
      checklistCompleted: true,
      allVerificationsPassed: true,
    },
    previousHash: 'd0i6e5f4g8h9i0...',
    currentHash: 'e1j7f6g5h9i0j1...',
    verified: true,
  },
  {
    id: 'COC-006',
    timestamp: '2026-02-04 08:15:00 AM',
    eventType: 'LABELS_PRINTED',
    description: 'Package labels printed (1 main + 12 piece tags)',
    actor: 'Mike Rodriguez',
    actorRole: 'Packaging Operator',
    location: 'Packaging Station 1',
    packageStatus: 'QC_RELEASED',
    details: {
      labelCount: 13,
      printer: 'Zebra ZT410',
      templateIds: ['TPL-001', 'TPL-003'],
    },
    previousHash: 'e1j7f6g5h9i0j1...',
    currentHash: 'f2k8g7h6i0j1k2...',
    verified: true,
  },
  {
    id: 'COC-007',
    timestamp: '2026-02-04 09:00:00 AM',
    eventType: 'PACKAGE_SEALED',
    description: 'Package sealed with tamper-evident seal',
    actor: 'Mike Rodriguez',
    actorRole: 'Packaging Operator',
    location: 'Packaging Station 1',
    packageStatus: 'SEALED',
    details: {
      sealId: 'SEAL-2026-00421',
      sealType: 'TAMPER_EVIDENT',
      sealPhotoUrl: '/evidence/seals/SEAL-2026-00421.jpg',
    },
    previousHash: 'f2k8g7h6i0j1k2...',
    currentHash: 'g3l9h8i7j1k2l3...',
    verified: true,
  },
  {
    id: 'COC-008',
    timestamp: '2026-02-04 10:00:00 AM',
    eventType: 'STAGED',
    description: 'Package moved to staging area for Dock 1',
    actor: 'Carlos Mendez',
    actorRole: 'Forklift Operator',
    location: 'Staging Area A',
    packageStatus: 'STAGED',
    details: {
      dockAssignment: 'DOCK-01',
      stagingZone: 'A-12',
    },
    previousHash: 'g3l9h8i7j1k2l3...',
    currentHash: 'h4m0i9j8k2l3m4...',
    verified: true,
  },
  {
    id: 'COC-009',
    timestamp: '2026-02-04 02:30:00 PM',
    eventType: 'LOADED',
    description: 'Package loaded onto truck (FastFreight FFT-4521)',
    actor: 'Carlos Mendez',
    actorRole: 'Forklift Operator',
    location: 'Dock 1',
    packageStatus: 'LOADED',
    details: {
      carrierId: 'CARR-FASTFREIGHT',
      truckId: 'FFT-4521',
      driverId: 'DRV-JOHNDAVIS',
      loadPosition: 'Front Left',
    },
    previousHash: 'h4m0i9j8k2l3m4...',
    currentHash: 'i5n1j0k9l3m4n5...',
    verified: true,
  },
];

const CustodyTimeline = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const getEventIcon = (eventType) => {
    const icons = {
      'PACKAGE_CREATED': <Inventory2 />,
      'ITEM_ADDED': <Build />,
      'SUBMITTED_FOR_QC': <AssignmentTurnedIn />,
      'QC_RELEASED': <CheckCircle />,
      'LABELS_PRINTED': <Print />,
      'PACKAGE_SEALED': <Lock />,
      'STAGED': <LocationOn />,
      'LOADED': <LocalShipping />,
      'SHIPPED': <LocalShipping />,
      'DELIVERED': <CheckCircle />,
    };
    return icons[eventType] || <Info />;
  };

  const getEventColor = (eventType) => {
    const colors = {
      'PACKAGE_CREATED': 'primary',
      'ITEM_ADDED': 'info',
      'SUBMITTED_FOR_QC': 'warning',
      'QC_RELEASED': 'success',
      'LABELS_PRINTED': 'info',
      'PACKAGE_SEALED': 'secondary',
      'STAGED': 'warning',
      'LOADED': 'success',
      'SHIPPED': 'success',
      'DELIVERED': 'success',
    };
    return colors[eventType] || 'default';
  };

  const verifyChain = () => {
    // Simulate chain verification
    let isValid = true;
    for (let i = 1; i < custodyEvents.length; i++) {
      if (custodyEvents[i].previousHash !== custodyEvents[i - 1].currentHash) {
        isValid = false;
        break;
      }
    }
    setVerificationResult({
      valid: isValid,
      checkedAt: new Date().toLocaleString(),
      eventsVerified: custodyEvents.length,
    });
    setShowVerifyDialog(true);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Chain of Custody
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Immutable audit trail for package PKG-2026-000042
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Print />}>
            Export Report
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Verified />}
            onClick={verifyChain}
          >
            Verify Chain Integrity
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Package Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Package Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <QrCode2 />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  PKG-2026-000042
                </Typography>
                <Chip label="LOADED" color="success" size="small" />
              </Box>
            </Box>

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Customer</Typography>
                <Typography variant="body2" fontWeight={500}>Aerospace Dynamics Inc.</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Order</Typography>
                <Typography variant="body2" fontWeight={500}>ORD-2026-1234</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Material</Typography>
                <Typography variant="body2" fontWeight={500}>304 Stainless Steel</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Heat</Typography>
                <Typography variant="body2" fontWeight={500}>H2026-4521</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Quantity</Typography>
                <Typography variant="body2" fontWeight={500}>12 pieces</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Weight</Typography>
                <Typography variant="body2" fontWeight={500}>2,450 lbs</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Chain Integrity
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={500}>
                Chain Verified
              </Typography>
              <Typography variant="caption">
                All {custodyEvents.length} events have valid hash links
              </Typography>
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">First Event Hash</Typography>
              <Box sx={{ 
                bgcolor: 'grey.100', 
                p: 1, 
                borderRadius: 1, 
                fontFamily: 'monospace',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{custodyEvents[0].currentHash}</span>
                <IconButton size="small">
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Latest Event Hash</Typography>
              <Box sx={{ 
                bgcolor: 'grey.100', 
                p: 1, 
                borderRadius: 1, 
                fontFamily: 'monospace',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{custodyEvents[custodyEvents.length - 1].currentHash}</span>
                <IconButton size="small">
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Timeline */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Event Timeline
              </Typography>
              <Chip 
                icon={<TimelineIcon />}
                label={`${custodyEvents.length} events`}
                variant="outlined"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Stepper orientation="vertical">
              {custodyEvents.map((event, index) => (
                <Step key={event.id} active expanded>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar 
                        sx={{ 
                          bgcolor: getEventColor(event.eventType) + '.main',
                          width: 32,
                          height: 32,
                        }}
                      >
                        {getEventIcon(event.eventType)}
                      </Avatar>
                    )}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight={500}>
                        {event.eventType.replace(/_/g, ' ')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {event.verified && (
                          <Tooltip title="Hash verified">
                            <Verified color="success" fontSize="small" />
                          </Tooltip>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {event.timestamp}
                        </Typography>
                      </Box>
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'grey.50' }
                      }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <Typography variant="body2" gutterBottom>
                        {event.description}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Person fontSize="small" color="action" />
                            <Typography variant="caption">
                              {event.actor} ({event.actorRole})
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="caption">
                              {event.location}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Hash Chain Visualization */}
                      {index > 0 && (
                        <Box sx={{ 
                          mt: 1, 
                          pt: 1, 
                          borderTop: '1px dashed',
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          <Lock fontSize="small" color="action" />
                          <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                            prev: {event.previousHash?.substring(0, 12)}...
                          </Typography>
                          <Typography variant="caption">→</Typography>
                          <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                            curr: {event.currentHash?.substring(0, 12)}...
                          </Typography>
                        </Box>
                      )}
                    </Card>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>
      </Grid>

      {/* Event Details Dialog */}
      <Dialog 
        open={selectedEvent !== null} 
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: getEventColor(selectedEvent.eventType) + '.main' }}>
                  {getEventIcon(selectedEvent.eventType)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedEvent.eventType.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Event ID: {selectedEvent.id}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1" paragraph>
                    {selectedEvent.description}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedEvent.timestamp}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Package Status</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedEvent.packageStatus}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Actor</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {selectedEvent.actor} ({selectedEvent.actorRole})
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Location</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedEvent.location}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Event Details</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {Object.entries(selectedEvent.details).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell sx={{ fontWeight: 500 }}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </TableCell>
                            <TableCell>
                              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Hash Chain</Typography>
                  <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: 12 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <span>Previous Hash:</span>
                      <span>{selectedEvent.previousHash || 'null (genesis)'}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Current Hash:</span>
                      <span>{selectedEvent.currentHash}</span>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Verification Result Dialog */}
      <Dialog open={showVerifyDialog} onClose={() => setShowVerifyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chain Integrity Verification</DialogTitle>
        <DialogContent>
          {verificationResult && (
            <>
              <Alert 
                severity={verificationResult.valid ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                <Typography variant="body1" fontWeight={600}>
                  {verificationResult.valid 
                    ? 'Chain Integrity Verified ✓' 
                    : 'Chain Integrity Compromised ✗'
                  }
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Verification Time</Typography>
                  <Typography variant="body2" fontWeight={500}>{verificationResult.checkedAt}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Events Verified</Typography>
                  <Typography variant="body2" fontWeight={500}>{verificationResult.eventsVerified}</Typography>
                </Grid>
              </Grid>

              {verificationResult.valid && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2">
                    All hash links in the chain are valid. No tampering detected.
                    Each event's previous hash correctly references the prior event's current hash.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVerifyDialog(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Print />}>Download Report</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustodyTimeline;
