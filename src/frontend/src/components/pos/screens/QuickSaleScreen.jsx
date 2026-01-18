/**
 * Quick Sale Screen
 * 
 * Simplified cash sale flow with rapid scanning.
 * Implements QUICK_SALE from design document 42-AI-ORDER-INTAKE-POS.md
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  QrCodeScanner as ScanIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Person as CustomerIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// ============================================
// SCAN INPUT
// ============================================

function ScanInput({ onScan, autoFocus }) {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode.trim());
      setBarcode('');
    }
  };
  
  const handleKeyDown = (e) => {
    // Handle barcode scanner input (usually ends with Enter)
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };
  
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          inputRef={inputRef}
          fullWidth
          size="large"
          placeholder="Scan barcode or enter SKU..."
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ScanIcon color="primary" />
              </InputAdornment>
            ),
            endAdornment: barcode && (
              <InputAdornment position="end">
                <IconButton onClick={() => setBarcode('')} edge="end" size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
            sx: { fontSize: '1.25rem' }
          }}
        />
      </form>
    </Paper>
  );
}

// ============================================
// ITEM LIST
// ============================================

function ItemList({ items, onUpdateQuantity, onRemove }) {
  if (items.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <CartIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
        <Typography color="text.secondary">
          No items yet. Scan a barcode to add items.
        </Typography>
      </Paper>
    );
  }
  
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell>Item</TableCell>
            <TableCell align="center" width={140}>Qty</TableCell>
            <TableCell align="right" width={100}>Price</TableCell>
            <TableCell align="right" width={100}>Ext</TableCell>
            <TableCell width={50}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.lineNumber} hover>
              <TableCell>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.sku}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => onUpdateQuantity(item.lineNumber, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    size="small"
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 0;
                      if (qty > 0) onUpdateQuantity(item.lineNumber, qty);
                    }}
                    inputProps={{ 
                      style: { textAlign: 'center', width: 40 },
                      min: 1
                    }}
                  />
                  <IconButton 
                    size="small"
                    onClick={() => onUpdateQuantity(item.lineNumber, item.quantity + 1)}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell align="right">
                ${item.unitPrice.toFixed(2)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 500 }}>
                ${item.extended.toFixed(2)}
              </TableCell>
              <TableCell>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => onRemove(item.lineNumber)}
                >
                  <DeleteIcon fontSize="small" />
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
// RUNNING TOTAL
// ============================================

function RunningTotal({ subtotal, tax, total, taxRate }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography color="text.secondary">Subtotal</Typography>
        <Typography>${subtotal.toFixed(2)}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography color="text.secondary">
          Tax ({(taxRate * 100).toFixed(2)}%)
        </Typography>
        <Typography>${tax.toFixed(2)}</Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
          ${total.toFixed(2)}
        </Typography>
      </Box>
    </Paper>
  );
}

// ============================================
// QUICK SALE SCREEN
// ============================================

export function QuickSaleScreen({ screen, onNext, onBack }) {
  const { transition, isLoading, currentUser } = usePOS();
  
  // Sale state
  const [sale, setSale] = useState({
    id: `qs-${Date.now()}`,
    items: [],
    subtotal: 0,
    taxRate: 0.0825,
    tax: 0,
    total: 0
  });
  
  const [error, setError] = useState(null);
  const [lastScanned, setLastScanned] = useState(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  
  // Recalculate totals
  const recalculateTotals = useCallback((items) => {
    const subtotal = items.reduce((sum, item) => sum + item.extended, 0);
    const taxableAmount = items.filter(i => i.taxable).reduce((sum, item) => sum + item.extended, 0);
    const tax = Math.round(taxableAmount * sale.taxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    
    setSale(prev => ({
      ...prev,
      items,
      subtotal,
      tax,
      total
    }));
  }, [sale.taxRate]);
  
  // Handle barcode scan
  const handleScan = useCallback(async (barcode) => {
    setError(null);
    
    try {
      // Look up product
      const response = await fetch(`/api/pos/quick-sale/lookup?barcode=${encodeURIComponent(barcode)}`);
      
      let product;
      if (response.ok) {
        product = await response.json();
      } else {
        // Use mock product for development
        product = {
          id: `mock-${barcode}`,
          sku: barcode,
          barcode,
          name: `Product ${barcode}`,
          unitPrice: Math.round(Math.random() * 50 + 10),
          taxable: true
        };
      }
      
      if (!product) {
        setError(`Product not found: ${barcode}`);
        return;
      }
      
      // Add to sale
      const newItems = [...sale.items];
      const existingIndex = newItems.findIndex(i => i.productId === product.id);
      
      if (existingIndex >= 0) {
        newItems[existingIndex].quantity += 1;
        newItems[existingIndex].extended = 
          newItems[existingIndex].quantity * newItems[existingIndex].unitPrice;
      } else {
        newItems.push({
          lineNumber: newItems.length + 1,
          barcode: product.barcode || product.sku,
          productId: product.id,
          sku: product.sku,
          description: product.name,
          quantity: 1,
          unitPrice: product.unitPrice,
          extended: product.unitPrice,
          taxable: product.taxable !== false
        });
      }
      
      recalculateTotals(newItems);
      setLastScanned(product);
      
    } catch (err) {
      console.error('Scan failed:', err);
      setError('Failed to look up product');
    }
  }, [sale.items, recalculateTotals]);
  
  // Update quantity
  const handleUpdateQuantity = useCallback((lineNumber, quantity) => {
    if (quantity <= 0) {
      handleRemove(lineNumber);
      return;
    }
    
    const newItems = sale.items.map(item => {
      if (item.lineNumber === lineNumber) {
        return {
          ...item,
          quantity,
          extended: quantity * item.unitPrice
        };
      }
      return item;
    });
    
    recalculateTotals(newItems);
  }, [sale.items, recalculateTotals]);
  
  // Remove item
  const handleRemove = useCallback((lineNumber) => {
    const newItems = sale.items
      .filter(i => i.lineNumber !== lineNumber)
      .map((item, idx) => ({ ...item, lineNumber: idx + 1 }));
    
    recalculateTotals(newItems);
  }, [sale.items, recalculateTotals]);
  
  // Clear all
  const handleClear = () => {
    setSale(prev => ({
      ...prev,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0
    }));
    setShowClearDialog(false);
    setLastScanned(null);
  };
  
  // Proceed to checkout
  const handleCheckout = async () => {
    if (sale.items.length === 0) {
      setError('No items to checkout');
      return;
    }
    
    try {
      await transition('CHECKOUT', { sale });
      onNext?.();
    } catch (err) {
      setError(err.message || 'Failed to proceed to checkout');
    }
  };
  
  // Cancel sale
  const handleCancel = async () => {
    try {
      await transition('CANCEL');
      onBack?.();
    } catch (err) {
      onBack?.();
    }
  };
  
  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5">
            {screen?.title || 'Quick Sale'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scan items or enter SKU for fast checkout
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`Items: ${sale.items.length}`} variant="outlined" />
          <Chip 
            label={`Terminal: ${currentUser?.terminalId || 'POS-1'}`} 
            variant="outlined" 
            size="small"
          />
        </Box>
      </Box>
      
      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Last Scanned */}
      {lastScanned && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setLastScanned(null)}>
          Added: {lastScanned.name} - ${lastScanned.unitPrice?.toFixed(2)}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Left: Items */}
        <Grid item xs={12} md={8}>
          {/* Scan Input */}
          <ScanInput onScan={handleScan} autoFocus />
          
          {/* Item List */}
          <ItemList 
            items={sale.items}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemove}
          />
          
          {/* Clear Button */}
          {sale.items.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<ClearIcon />}
                onClick={() => setShowClearDialog(true)}
              >
                Clear All
              </Button>
            </Box>
          )}
        </Grid>
        
        {/* Right: Total & Checkout */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 16 }}>
            {/* Running Total */}
            <RunningTotal
              subtotal={sale.subtotal}
              tax={sale.tax}
              total={sale.total}
              taxRate={sale.taxRate}
            />
            
            {/* Checkout Button */}
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              startIcon={<PaymentIcon />}
              onClick={handleCheckout}
              disabled={sale.items.length === 0}
              sx={{ mt: 2, py: 2, fontSize: '1.1rem' }}
            >
              Checkout ${sale.total.toFixed(2)}
            </Button>
            
            {/* Cancel Button */}
            <Button
              variant="outlined"
              fullWidth
              onClick={handleCancel}
              sx={{ mt: 1 }}
            >
              Cancel Sale
            </Button>
            
            {/* Quick Add */}
            <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Quick Add
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['HR-001', 'CR-002', 'RND-003', 'SQ-004', 'ANG-005'].map(sku => (
                  <Chip
                    key={sku}
                    label={sku}
                    onClick={() => handleScan(sku)}
                    clickable
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
      
      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
        <DialogTitle>Clear All Items?</DialogTitle>
        <DialogContent>
          <Typography>
            This will remove all {sale.items.length} items from the sale. 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDialog(false)}>Cancel</Button>
          <Button onClick={handleClear} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default QuickSaleScreen;
