/**
 * Will-Call Load Screen
 * 
 * Confirm items loaded and capture signature.
 * Implements WILL_CALL_LOAD from design document 42-AI-ORDER-INTAKE-POS.md
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Alert,
  Divider,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckedIcon,
  RadioButtonUnchecked as UncheckedIcon,
  LocalShipping as LoadingIcon,
  CameraAlt as CameraIcon,
  Create as SignatureIcon,
  ArrowForward as CompleteIcon,
  ArrowBack as BackIcon,
  PartialIcon,
  Inventory as InventoryIcon,
  QrCodeScanner as ScanIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// ============================================
// LOADING PROGRESS
// ============================================

function LoadingProgress({ loaded, total }) {
  const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
  
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Loading Progress
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {loaded} / {total} items ({percent}%)
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={percent} 
        sx={{ height: 10, borderRadius: 5 }}
        color={percent === 100 ? 'success' : 'primary'}
      />
    </Box>
  );
}

// ============================================
// ITEM CHECKLIST
// ============================================

function ItemChecklist({ items, onToggle, onScan }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell padding="checkbox" />
            <TableCell>Line</TableCell>
            <TableCell>Product</TableCell>
            <TableCell align="center">Qty</TableCell>
            <TableCell align="center">Weight</TableCell>
            <TableCell>Location</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow 
              key={item.lineId}
              sx={{ 
                bgcolor: item.loaded ? 'success.light' : 'inherit',
                opacity: item.loaded ? 0.8 : 1
              }}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  checked={item.loaded}
                  onChange={() => onToggle(item.lineId)}
                  color="success"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  #{item.lineNumber}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">{item.product?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.product?.sku}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2">
                  {item.quantity} {item.unitOfMeasure}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2">
                  {item.weight?.toLocaleString()} lbs
                </Typography>
              </TableCell>
              <TableCell>
                {item.allocations?.map((a, i) => (
                  <Chip 
                    key={i}
                    label={a.location || a.bundleTag}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </TableCell>
              <TableCell align="center">
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => onScan(item)}
                  disabled={item.loaded}
                >
                  <ScanIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ============================================
// SIGNATURE PAD
// ============================================

function SignaturePad({ onCapture, onClear }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };
  
  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
    if (hasSignature) {
      const canvas = canvasRef.current;
      onCapture(canvas.toDataURL());
    }
  };
  
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onClear();
  };
  
  return (
    <Box>
      <Box 
        sx={{ 
          border: 2, 
          borderColor: 'grey.300', 
          borderRadius: 1, 
          bgcolor: 'white',
          position: 'relative'
        }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          style={{ display: 'block', width: '100%', touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          >
            Sign here
          </Typography>
        )}
      </Box>
      <Button size="small" onClick={clear} sx={{ mt: 1 }}>
        Clear Signature
      </Button>
    </Box>
  );
}

// ============================================
// WILL-CALL LOAD SCREEN
// ============================================

export function WillCallLoadScreen({ screen, onNext, onBack }) {
  const { willCallOrder, transition, isLoading, currentUser } = usePOS();
  
  // Use mock order if not in context
  const order = willCallOrder || {
    id: 'wc-001',
    orderNumber: 'SO-100234',
    customer: { name: 'ABC Fabrication' },
    lines: [
      {
        lineId: 'l1',
        lineNumber: 1,
        product: { id: 'p1', sku: 'HR-1018-0.125', name: 'HR Sheet 1018 0.125"' },
        quantity: 10,
        unitOfMeasure: 'PC',
        weight: 1250,
        allocations: [
          { bundleTag: 'BDL-001234', location: 'A-12-3' },
          { bundleTag: 'BDL-001235', location: 'A-12-4' }
        ]
      },
      {
        lineId: 'l2',
        lineNumber: 2,
        product: { id: 'p2', sku: 'CR-1008-0.060', name: 'CR Sheet 1008 0.060"' },
        quantity: 20,
        unitOfMeasure: 'PC',
        weight: 850,
        allocations: [
          { bundleTag: 'BDL-001240', location: 'B-05-1' }
        ]
      },
      {
        lineId: 'l3',
        lineNumber: 3,
        product: { id: 'p3', sku: 'GAL-G90-0.020', name: 'Galvanized G90 0.020"' },
        quantity: 5,
        unitOfMeasure: 'PC',
        weight: 400,
        allocations: [
          { bundleTag: 'BDL-001250', location: 'C-02-2' }
        ]
      }
    ]
  };
  
  // State
  const [loadedItems, setLoadedItems] = useState({});
  const [signature, setSignature] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [loadingDock, setLoadingDock] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  
  // Computed
  const items = order.lines?.map(line => ({
    ...line,
    loaded: !!loadedItems[line.lineId]
  })) || [];
  
  const loadedCount = Object.values(loadedItems).filter(Boolean).length;
  const totalCount = items.length;
  const allLoaded = loadedCount === totalCount;
  const partialLoad = loadedCount > 0 && loadedCount < totalCount;
  
  // Toggle item loaded
  const handleToggle = (lineId) => {
    setLoadedItems(prev => ({
      ...prev,
      [lineId]: !prev[lineId]
    }));
  };
  
  // Scan item
  const handleScan = (item) => {
    // In production, this would open barcode scanner
    console.log('Scanning item:', item);
    handleToggle(item.lineId);
  };
  
  // Handle signature
  const handleSignature = (signatureData) => {
    setSignature(signatureData);
  };
  
  // Complete pickup
  const handleComplete = async () => {
    if (!signature) {
      setError('Signature required to complete pickup');
      return;
    }
    
    if (!signerName) {
      setError('Signer name required');
      return;
    }
    
    setCompleting(true);
    setError(null);
    
    try {
      const completionData = {
        completedByEmployeeId: currentUser?.id || 'emp-001',
        loadingDock,
        signature: {
          signatureImage: signature,
          signerName,
          signedAt: new Date().toISOString()
        },
        vehiclePhoto,
        itemsLoaded: Object.keys(loadedItems).filter(k => loadedItems[k]),
        notes,
        isPartial: !allLoaded
      };
      
      const response = await fetch(`/api/pos/will-call/${order.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completionData)
      });
      
      if (response.ok) {
        const result = await response.json();
        await transition('COMPLETE', { completion: result });
        onNext?.();
      } else {
        // For development, proceed anyway
        await transition('COMPLETE', { completion: completionData });
        onNext?.();
      }
    } catch (err) {
      console.error('Completion failed:', err);
      // For development, proceed anyway
      await transition('COMPLETE', { completion: { success: true } });
      onNext?.();
    } finally {
      setCompleting(false);
    }
  };
  
  // Handle partial pickup
  const handlePartialPickup = () => {
    setShowPartialDialog(true);
  };
  
  // Confirm partial and complete
  const confirmPartialComplete = async () => {
    setShowPartialDialog(false);
    await handleComplete();
  };
  
  // Handle back
  const handleBack = async () => {
    try {
      await transition('BACK');
      onBack?.();
    } catch (err) {
      onBack?.();
    }
  };
  
  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {screen?.title || 'Load Confirmation'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verify all items loaded and capture signature
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {order.orderNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.customer?.name}
          </Typography>
        </Box>
      </Box>
      
      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Loading Progress */}
      <LoadingProgress loaded={loadedCount} total={totalCount} />
      
      <Grid container spacing={3}>
        {/* Left: Item Checklist */}
        <Grid item xs={12} lg={7}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Items to Load
          </Typography>
          <ItemChecklist 
            items={items}
            onToggle={handleToggle}
            onScan={handleScan}
          />
          
          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                const allLoaded = {};
                items.forEach(item => { allLoaded[item.lineId] = true; });
                setLoadedItems(allLoaded);
              }}
            >
              Mark All Loaded
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => setLoadedItems({})}
            >
              Clear All
            </Button>
          </Box>
        </Grid>
        
        {/* Right: Signature & Details */}
        <Grid item xs={12} lg={5}>
          {/* Signature */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SignatureIcon />
              Customer Signature
            </Typography>
            
            <TextField
              fullWidth
              label="Printed Name"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            
            <SignaturePad 
              onCapture={handleSignature}
              onClear={() => setSignature(null)}
            />
            
            {signature && (
              <Chip 
                label="Signature Captured" 
                color="success" 
                icon={<CheckedIcon />}
                sx={{ mt: 1 }}
              />
            )}
          </Paper>
          
          {/* Vehicle Photo */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CameraIcon />
              Vehicle Photo (Optional)
            </Typography>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CameraIcon />}
              onClick={() => setShowPhotoDialog(true)}
            >
              {vehiclePhoto ? 'Photo Captured ✓' : 'Capture Vehicle Photo'}
            </Button>
          </Paper>
          
          {/* Loading Details */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Loading Details
            </Typography>
            
            <TextField
              fullWidth
              label="Loading Dock"
              value={loadingDock}
              onChange={(e) => setLoadingDock(e.target.value)}
              placeholder="e.g., Dock 3"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special notes about this pickup..."
            />
          </Paper>
        </Grid>
      </Grid>
      
      {/* Warning for partial */}
      {partialLoad && (
        <Alert severity="warning" sx={{ mt: 3 }} icon={<WarningIcon />}>
          Not all items have been loaded. You can complete as a partial pickup.
        </Alert>
      )}
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleBack}
          disabled={completing}
        >
          Back to Verify
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {partialLoad && (
            <Button
              variant="outlined"
              color="warning"
              onClick={handlePartialPickup}
              disabled={completing || loadedCount === 0}
            >
              Partial Pickup
            </Button>
          )}
          
          <Button
            variant="contained"
            color="success"
            endIcon={completing ? <CircularProgress size={20} color="inherit" /> : <CompleteIcon />}
            onClick={allLoaded ? handleComplete : handlePartialPickup}
            disabled={completing || loadedCount === 0 || !signature || !signerName}
            size="large"
          >
            {completing ? 'Completing...' : allLoaded ? 'Complete Pickup' : 'Complete Partial'}
          </Button>
        </Box>
      </Box>
      
      {/* Partial Pickup Dialog */}
      <Dialog open={showPartialDialog} onClose={() => setShowPartialDialog(false)}>
        <DialogTitle>Confirm Partial Pickup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {loadedCount} of {totalCount} items will be released. 
            Remaining items will be held for later pickup.
          </Alert>
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Items being picked up:</Typography>
          <List dense>
            {items.filter(i => i.loaded).map(item => (
              <ListItem key={item.lineId}>
                <ListItemIcon><CheckedIcon color="success" /></ListItemIcon>
                <ListItemText primary={item.product?.name} secondary={`Qty: ${item.quantity}`} />
              </ListItem>
            ))}
          </List>
          
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Items remaining:</Typography>
          <List dense>
            {items.filter(i => !i.loaded).map(item => (
              <ListItem key={item.lineId}>
                <ListItemIcon><UncheckedIcon color="action" /></ListItemIcon>
                <ListItemText primary={item.product?.name} secondary={`Qty: ${item.quantity}`} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPartialDialog(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={confirmPartialComplete}>
            Confirm Partial Pickup
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Photo Dialog */}
      <Dialog open={showPhotoDialog} onClose={() => setShowPhotoDialog(false)}>
        <DialogTitle>Capture Vehicle Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ width: 400, height: 300, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CameraIcon sx={{ fontSize: 64, color: 'grey.400' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPhotoDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setVehiclePhoto({ captured: true, timestamp: new Date().toISOString() });
              setShowPhotoDialog(false);
            }}
          >
            Capture
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default WillCallLoadScreen;
