/**
 * Loading Screen
 * Scan-to-load station for verifying packages onto trucks
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
} from '@mui/material';
import {
  QrCodeScanner as ScannerIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  LocalShipping as TruckIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Lock as LockIcon,
  DoneAll as CompleteIcon,
  Inventory2 as PackageIcon,
} from '@mui/icons-material';

// Mock shipments ready for loading
const mockShipments = [
  {
    id: 'SHP-2024-0512',
    listingId: 'DTL-20240115-0001',
    customer: 'ABC Steel Corp',
    destination: 'Chicago, IL',
    carrier: 'Standard Freight',
    lane: 'Lane A',
    expectedTags: [
      { id: 'DT-20240115-0001', product: '1/2" HR Plate', weight: '3,200 lbs', scanned: false },
      { id: 'DT-20240115-0002', product: '3/8" CR Sheet', weight: '2,100 lbs', scanned: false },
      { id: 'DT-20240115-0003', product: '1" Round Bar', weight: '1,500 lbs', scanned: false },
    ],
    status: 'LOADING',
  },
  {
    id: 'SHP-2024-0508',
    listingId: 'DTL-20240115-0002',
    customer: 'XYZ Manufacturing',
    destination: 'Detroit, MI',
    carrier: 'Express Trucking',
    lane: 'Lane B',
    expectedTags: [
      { id: 'DT-20240115-0010', product: '2" Angle Iron', weight: '4,100 lbs', scanned: true },
      { id: 'DT-20240115-0011', product: '1/4" HR Plate', weight: '2,800 lbs', scanned: true },
    ],
    status: 'COMPLETE',
  },
];

export default function LoadingScreen() {
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [scanValue, setScanValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loadedTags, setLoadedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    loadShipments();
  }, []);

  useEffect(() => {
    if (selectedShipment && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedShipment]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setShipments(mockShipments);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading shipments:', error);
      setLoading(false);
    }
  };

  const handleSelectShipment = (shipmentId) => {
    const shipment = shipments.find((s) => s.id === shipmentId);
    setSelectedShipment(shipment);
    setLoadedTags(shipment?.expectedTags.filter((t) => t.scanned).map((t) => t.id) || []);
    setScanResult(null);
  };

  const handleScan = async (value) => {
    if (!value.trim() || !selectedShipment) return;

    setScanning(true);
    setScanResult(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const expectedTag = selectedShipment.expectedTags.find((t) => t.id === value);

      if (!expectedTag) {
        setScanResult({
          success: false,
          message: 'Tag not on this shipment!',
          error: 'This tag is not part of the current shipment manifest',
          tagId: value,
        });
        playSound('error');
      } else if (loadedTags.includes(value)) {
        setScanResult({
          success: false,
          message: 'Already scanned!',
          error: 'This tag has already been loaded',
          tagId: value,
        });
        playSound('warning');
      } else {
        setLoadedTags((prev) => [...prev, value]);
        setScanResult({
          success: true,
          message: 'Tag loaded successfully!',
          tag: expectedTag,
        });
        playSound('success');
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
    console.log(`Playing ${type} sound`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleScan(scanValue);
    }
  };

  const handleCompleteLoading = async () => {
    if (!selectedShipment) return;

    if (loadedTags.length !== selectedShipment.expectedTags.length) {
      setScanResult({
        success: false,
        message: 'Cannot complete - missing tags',
        error: `${selectedShipment.expectedTags.length - loadedTags.length} tags not yet scanned`,
      });
      return;
    }

    // Call API to lock and depart
    console.log('Completing loading for', selectedShipment.id);
    alert('Loading complete! Shipment locked and ready for departure.');
  };

  const getProgressPercent = () => {
    if (!selectedShipment) return 0;
    return (loadedTags.length / selectedShipment.expectedTags.length) * 100;
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <TruckIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Loading Screen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scan-to-load verification station
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadShipments}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {/* Left Panel - Shipment Selection */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Shipment
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Shipment</InputLabel>
                  <Select
                    value={selectedShipment?.id || ''}
                    label="Shipment"
                    onChange={(e) => handleSelectShipment(e.target.value)}
                  >
                    {shipments.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.id} - {s.customer} ({s.lane})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>

            {selectedShipment && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Shipment Details
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Shipment ID</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedShipment.id}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Customer</Typography>
                    <Typography variant="body1">{selectedShipment.customer}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Destination</Typography>
                    <Typography variant="body1">{selectedShipment.destination}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Carrier</Typography>
                    <Typography variant="body1">{selectedShipment.carrier}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Lane</Typography>
                    <Chip label={selectedShipment.lane} size="small" color="primary" />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Loading Progress */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Progress: {loadedTags.length} / {selectedShipment.expectedTags.length}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round(getProgressPercent())}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressPercent()}
                      sx={{ height: 10, borderRadius: 1 }}
                      color={getProgressPercent() === 100 ? 'success' : 'primary'}
                    />
                  </Box>

                  {getProgressPercent() === 100 && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      All tags loaded! Ready to complete.
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<CompleteIcon />}
                    color="success"
                    disabled={getProgressPercent() !== 100}
                    onClick={handleCompleteLoading}
                  >
                    Complete Loading & Lock
                  </Button>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Center Panel - Scan Area */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom align="center">
                  Scan Tag to Load
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <ScannerIcon
                    sx={{
                      fontSize: 80,
                      color: scanning ? 'primary.main' : selectedShipment ? 'grey.600' : 'grey.300',
                    }}
                  />
                </Box>
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  variant="outlined"
                  placeholder={selectedShipment ? 'Scan tag barcode...' : 'Select a shipment first'}
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!selectedShipment || scanning}
                  autoFocus
                  inputProps={{
                    style: {
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                    },
                  }}
                />
                {scanning && <LinearProgress sx={{ mt: 1 }} />}
              </CardContent>
            </Card>

            {/* Scan Result */}
            {scanResult && (
              <Card
                sx={{
                  backgroundColor: scanResult.success ? 'success.light' : 'error.light',
                  border: '3px solid',
                  borderColor: scanResult.success ? 'success.main' : 'error.main',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {scanResult.success ? (
                      <CheckCircleIcon sx={{ fontSize: 48, color: 'success.dark' }} />
                    ) : (
                      <ErrorIcon sx={{ fontSize: 48, color: 'error.dark' }} />
                    )}
                    <Box>
                      <Typography variant="h5" fontWeight="bold" color={scanResult.success ? 'success.dark' : 'error.dark'}>
                        {scanResult.success ? 'LOADED' : 'ERROR'}
                      </Typography>
                      <Typography variant="body1">
                        {scanResult.message}
                      </Typography>
                    </Box>
                  </Box>
                  {scanResult.tag && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="bold">{scanResult.tag.id}</Typography>
                      <Typography variant="caption">{scanResult.tag.product} • {scanResult.tag.weight}</Typography>
                    </Box>
                  )}
                  {scanResult.error && !scanResult.success && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {scanResult.error}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right Panel - Expected Tags */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PackageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Expected Tags
                </Typography>
                {!selectedShipment ? (
                  <Alert severity="info">
                    Select a shipment to see expected tags
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tag ID</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedShipment.expectedTags.map((tag) => (
                          <TableRow
                            key={tag.id}
                            sx={{
                              backgroundColor: loadedTags.includes(tag.id) ? 'success.light' : 'inherit',
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {tag.id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {tag.product}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {loadedTags.includes(tag.id) ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <Chip label="PENDING" size="small" variant="outlined" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {selectedShipment && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                          {loadedTags.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Loaded
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="warning.main">
                          {selectedShipment.expectedTags.length - loadedTags.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Remaining
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
