/**
 * Apply Scan Screen
 * Station for scanning and applying drop tags to packages
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  QrCodeScanner as ScannerIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Inventory2 as PackageIcon,
  LocalShipping as ShippingIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  VolumeUp as SoundIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

// Mock scan history
const mockScanHistory = [
  { id: 'DT-20240115-0001', time: '14:35:22', status: 'SUCCESS', packageId: 'PKG-001', customer: 'ABC Steel' },
  { id: 'DT-20240115-0002', time: '14:33:15', status: 'SUCCESS', packageId: 'PKG-002', customer: 'XYZ Mfg' },
  { id: 'DT-20240114-0025', time: '16:30:45', status: 'FAILED', packageId: 'PKG-025', error: 'Tag not found' },
];

export default function ApplyScanScreen() {
  const [scanValue, setScanValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState(mockScanHistory);
  const [showDetails, setShowDetails] = useState(false);
  const [currentTag, setCurrentTag] = useState(null);
  const inputRef = useRef(null);

  // Auto-focus scan input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle scan input
  const handleScan = async (value) => {
    if (!value.trim()) return;
    
    setScanning(true);
    setScanResult(null);
    
    try {
      // Simulate API call
      // const response = await fetch('/api/drop-tags/scans', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     identifierValue: value,
      //     stationType: 'APPLY',
      //     identifierType: 'BARCODE',
      //   }),
      // });
      // const result = await response.json();
      
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Mock result based on scan value
      const isSuccess = value.startsWith('DT-') && !value.includes('999');
      
      if (isSuccess) {
        const mockTag = {
          id: value,
          status: 'PRINTED',
          packageId: 'PKG-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
          customer: 'ABC Steel Corp',
          product: '1/2" HR Plate 48x96',
          quantity: 25,
          weight: '5,250 lbs',
          heatNumber: 'H-23456',
          jobNumber: 'JOB-2024-0512',
          orderNumber: 'ORD-2024-0834',
        };
        
        setScanResult({
          success: true,
          message: 'Tag applied successfully',
          tag: mockTag,
        });
        setCurrentTag(mockTag);
        
        // Play success sound
        playSound('success');
        
        // Add to history
        setScanHistory((prev) => [
          {
            id: value,
            time: new Date().toLocaleTimeString(),
            status: 'SUCCESS',
            packageId: mockTag.packageId,
            customer: mockTag.customer,
          },
          ...prev.slice(0, 19),
        ]);
      } else {
        setScanResult({
          success: false,
          message: 'Tag not found or invalid',
          error: 'The scanned tag ID was not found in the system',
        });
        
        // Play error sound
        playSound('error');
        
        // Add to history
        setScanHistory((prev) => [
          {
            id: value,
            time: new Date().toLocaleTimeString(),
            status: 'FAILED',
            error: 'Tag not found',
          },
          ...prev.slice(0, 19),
        ]);
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: 'Scan failed',
        error: error.message,
      });
      playSound('error');
    } finally {
      setScanning(false);
      setScanValue('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const playSound = (type) => {
    // In real implementation, play audio feedback
    console.log(`Playing ${type} sound`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleScan(scanValue);
    }
  };

  const handleClearResult = () => {
    setScanResult(null);
    setCurrentTag(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Stats
  const stats = {
    todayApplied: scanHistory.filter((s) => s.status === 'SUCCESS').length,
    todayFailed: scanHistory.filter((s) => s.status === 'FAILED').length,
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <ScannerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Apply Scan Station
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scan drop tags to apply them to packages
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PackageIcon />}
            onClick={() => window.location.href = '/drop-tags/staging'}
          >
            Staging Board
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Scan Area */}
        <Grid item xs={12} md={8}>
          {/* Scan Input Card */}
          <Card sx={{ mb: 3, overflow: 'visible' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom align="center">
                Scan Drop Tag Barcode
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ScannerIcon sx={{ fontSize: 80, color: scanning ? 'primary.main' : 'grey.400' }} />
              </Box>
              <TextField
                ref={inputRef}
                fullWidth
                variant="outlined"
                placeholder="Scan or enter tag ID..."
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={scanning}
                autoFocus
                inputProps={{
                  style: {
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                  },
                }}
                sx={{ mb: 2 }}
              />
              {scanning && <LinearProgress />}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => handleScan(scanValue)}
                  disabled={!scanValue.trim() || scanning}
                >
                  Apply Tag
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setScanValue('')}
                  disabled={scanning}
                >
                  Clear
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Scan Result */}
          {scanResult && (
            <Card
              sx={{
                mb: 3,
                backgroundColor: scanResult.success ? 'success.light' : 'error.light',
                border: '3px solid',
                borderColor: scanResult.success ? 'success.main' : 'error.main',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {scanResult.success ? (
                      <CheckCircleIcon sx={{ fontSize: 60, color: 'success.dark' }} />
                    ) : (
                      <ErrorIcon sx={{ fontSize: 60, color: 'error.dark' }} />
                    )}
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color={scanResult.success ? 'success.dark' : 'error.dark'}>
                        {scanResult.success ? 'SUCCESS' : 'FAILED'}
                      </Typography>
                      <Typography variant="body1">
                        {scanResult.message}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={handleClearResult}>
                    <CancelIcon />
                  </IconButton>
                </Box>

                {scanResult.success && currentTag && (
                  <Box sx={{ mt: 3, backgroundColor: 'white', p: 2, borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Tag ID</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                          {currentTag.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Package ID</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {currentTag.packageId}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Customer</Typography>
                        <Typography variant="body1">{currentTag.customer}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Heat #</Typography>
                        <Typography variant="body1">{currentTag.heatNumber}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Product</Typography>
                        <Typography variant="body1">{currentTag.product}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Quantity</Typography>
                        <Typography variant="body1">{currentTag.quantity} pcs</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Weight</Typography>
                        <Typography variant="body1">{currentTag.weight}</Typography>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowDetails(true)}
                      >
                        View Full Details
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => window.location.href = '/drop-tags/traceability/' + currentTag.id}
                      >
                        View Trace History
                      </Button>
                    </Box>
                  </Box>
                )}

                {!scanResult.success && scanResult.error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <AlertTitle>Error Details</AlertTitle>
                    {scanResult.error}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" color="success.main">
                    {stats.todayApplied}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Applied Today
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" color="error.main">
                    {stats.todayFailed}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Failed Scans
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PackageIcon />}
                  onClick={() => window.location.href = '/drop-tags/queue'}
                >
                  Packaging Queue
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ScannerIcon />}
                  onClick={() => window.location.href = '/drop-tags/print-center'}
                >
                  Print Center
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ShippingIcon />}
                  onClick={() => window.location.href = '/drop-tags/listings'}
                >
                  Shipping Listings
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Scan History */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent Scans
                </Typography>
                <IconButton size="small" onClick={() => setScanHistory([])}>
                  <RefreshIcon />
                </IconButton>
              </Box>
              <List dense>
                {scanHistory.slice(0, 10).map((scan, index) => (
                  <ListItem key={`${scan.id}-${index}`} divider>
                    <ListItemIcon>
                      {scan.status === 'SUCCESS' ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {scan.id}
                        </Typography>
                      }
                      secondary={
                        scan.status === 'SUCCESS'
                          ? `${scan.customer} • ${scan.time}`
                          : `${scan.error} • ${scan.time}`
                      }
                    />
                  </ListItem>
                ))}
                {scanHistory.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" align="center">
                          No scans yet
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tag Details</DialogTitle>
        <DialogContent>
          {currentTag && (
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12}>
                <Alert severity="success">
                  This tag has been successfully applied to the package.
                </Alert>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Tag ID</Typography>
                <Typography variant="body1" fontWeight="bold">{currentTag.id}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Package ID</Typography>
                <Typography variant="body1" fontWeight="bold">{currentTag.packageId}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Chip label="APPLIED" color="success" size="small" />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Job Number</Typography>
                <Typography variant="body1">{currentTag.jobNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Order Number</Typography>
                <Typography variant="body1">{currentTag.orderNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Customer</Typography>
                <Typography variant="body1">{currentTag.customer}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Heat Number</Typography>
                <Typography variant="body1">{currentTag.heatNumber}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Product</Typography>
                <Typography variant="body1">{currentTag.product}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Quantity</Typography>
                <Typography variant="body1">{currentTag.quantity} pcs</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Weight</Typography>
                <Typography variant="body1">{currentTag.weight}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
