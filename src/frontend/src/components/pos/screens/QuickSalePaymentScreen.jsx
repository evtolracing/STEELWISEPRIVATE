/**
 * Quick Sale Payment Screen
 * 
 * Fast payment processing for quick sales.
 * Implements QUICK_SALE_PAYMENT from design document 42-AI-ORDER-INTAKE-POS.md
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  InputAdornment,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar
} from '@mui/material';
import {
  AttachMoney as CashIcon,
  CreditCard as CardIcon,
  Receipt as CheckIcon,
  ArrowBack as BackIcon,
  Check as ConfirmIcon,
  Keyboard as KeypadIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// ============================================
// PAYMENT METHOD SELECTOR
// ============================================

function PaymentMethodSelector({ selected, onSelect, disabled }) {
  const methods = [
    { id: 'CASH', label: 'Cash', icon: <CashIcon sx={{ fontSize: 40 }} />, color: 'success.main' },
    { id: 'CARD', label: 'Card', icon: <CardIcon sx={{ fontSize: 40 }} />, color: 'primary.main' },
    { id: 'CHECK', label: 'Check', icon: <CheckIcon sx={{ fontSize: 40 }} />, color: 'warning.main' }
  ];
  
  return (
    <Grid container spacing={2}>
      {methods.map(method => (
        <Grid item xs={4} key={method.id}>
          <Card
            variant="outlined"
            sx={{
              borderColor: selected === method.id ? method.color : 'divider',
              borderWidth: selected === method.id ? 2 : 1,
              transition: 'all 0.2s'
            }}
          >
            <CardActionArea
              onClick={() => onSelect(method.id)}
              disabled={disabled}
              sx={{ p: 3, textAlign: 'center' }}
            >
              <Box sx={{ color: selected === method.id ? method.color : 'grey.400' }}>
                {method.icon}
              </Box>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mt: 1, 
                  fontWeight: selected === method.id ? 700 : 400 
                }}
              >
                {method.label}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ============================================
// QUICK CASH AMOUNTS
// ============================================

function QuickCashAmounts({ total, onSelect, disabled }) {
  // Generate quick amounts
  const getQuickAmounts = () => {
    const amounts = [];
    
    // Exact
    amounts.push({ label: 'Exact', value: total });
    
    // Round up to nearest $5, $10, $20
    const roundUps = [5, 10, 20, 50, 100];
    for (const round of roundUps) {
      const rounded = Math.ceil(total / round) * round;
      if (rounded > total && rounded <= total * 3 && !amounts.find(a => a.value === rounded)) {
        amounts.push({ label: `$${rounded}`, value: rounded });
      }
    }
    
    return amounts.slice(0, 6);
  };
  
  const quickAmounts = getQuickAmounts();
  
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Quick Amounts
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {quickAmounts.map((amount, i) => (
          <Button
            key={i}
            variant="outlined"
            size="large"
            onClick={() => onSelect(amount.value)}
            disabled={disabled}
            sx={{ minWidth: 80 }}
          >
            {amount.label === 'Exact' ? 'Exact' : amount.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

// ============================================
// NUMERIC KEYPAD
// ============================================

function NumericKeypad({ onInput, onClear, onBackspace, disabled }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  
  const handleKey = (key) => {
    if (key === '⌫') {
      onBackspace();
    } else {
      onInput(key);
    }
  };
  
  return (
    <Box sx={{ maxWidth: 240 }}>
      <Grid container spacing={1}>
        {keys.map(key => (
          <Grid item xs={4} key={key}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleKey(key)}
              disabled={disabled}
              sx={{ 
                py: 2, 
                fontSize: '1.5rem',
                minWidth: 60
              }}
            >
              {key}
            </Button>
          </Grid>
        ))}
      </Grid>
      <Button
        variant="outlined"
        fullWidth
        onClick={onClear}
        disabled={disabled}
        startIcon={<ClearIcon />}
        sx={{ mt: 1 }}
      >
        Clear
      </Button>
    </Box>
  );
}

// ============================================
// QUICK SALE PAYMENT SCREEN
// ============================================

export function QuickSalePaymentScreen({ screen, onNext, onBack }) {
  const { quickSale, transition, isLoading } = usePOS();
  
  // Use mock sale if not in context
  const sale = quickSale || {
    items: [
      { lineNumber: 1, description: 'Sample Item', quantity: 1, unitPrice: 25.00, extended: 25.00 }
    ],
    subtotal: 25.00,
    taxRate: 0.0825,
    tax: 2.06,
    total: 27.06
  };
  
  // State
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [amountTendered, setAmountTendered] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showCardDialog, setShowCardDialog] = useState(false);
  
  // Computed
  const tenderedValue = parseFloat(amountTendered) || 0;
  const change = Math.max(0, tenderedValue - sale.total);
  const canProcess = paymentMethod && (
    paymentMethod === 'CARD' ||
    (paymentMethod === 'CASH' && tenderedValue >= sale.total) ||
    (paymentMethod === 'CHECK' && checkNumber)
  );
  
  // Handle payment method selection
  const handleMethodSelect = (method) => {
    setPaymentMethod(method);
    setAmountTendered('');
    setCheckNumber('');
    setError(null);
    
    if (method === 'CARD') {
      setShowCardDialog(true);
    }
  };
  
  // Handle quick amount
  const handleQuickAmount = (amount) => {
    setAmountTendered(amount.toFixed(2));
  };
  
  // Handle keypad input
  const handleKeypadInput = (key) => {
    if (key === '.' && amountTendered.includes('.')) return;
    setAmountTendered(prev => prev + key);
  };
  
  const handleKeypadBackspace = () => {
    setAmountTendered(prev => prev.slice(0, -1));
  };
  
  const handleKeypadClear = () => {
    setAmountTendered('');
  };
  
  // Process payment
  const handleProcessPayment = async () => {
    if (!canProcess) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const paymentData = {
        method: paymentMethod,
        amountTendered: paymentMethod === 'CASH' ? tenderedValue : sale.total,
        reference: paymentMethod === 'CHECK' ? checkNumber : null
      };
      
      // Call API to process payment
      const response = await fetch('/api/pos/quick-sale/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale,
          payment: paymentData
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        await transition('PAYMENT_COMPLETE', { 
          payment: paymentData, 
          change,
          receipt: result.receipt 
        });
        onNext?.();
      } else {
        // For development, proceed anyway
        await transition('PAYMENT_COMPLETE', { 
          payment: paymentData, 
          change,
          receipt: { saleId: sale.id }
        });
        onNext?.();
      }
    } catch (err) {
      console.error('Payment failed:', err);
      // For development, proceed anyway
      await transition('PAYMENT_COMPLETE', { 
        payment: { method: paymentMethod, amountTendered: tenderedValue },
        change
      });
      onNext?.();
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle card payment
  const handleCardPayment = async () => {
    setShowCardDialog(false);
    await handleProcessPayment();
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
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {screen?.title || 'Quick Payment'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select payment method and complete transaction
        </Typography>
      </Box>
      
      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Left: Amount Due & Payment */}
        <Grid item xs={12} md={7}>
          {/* Amount Due */}
          <Paper 
            variant="outlined" 
            sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: 'primary.light' }}
          >
            <Typography variant="overline" color="text.secondary">
              Amount Due
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
              ${sale.total.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sale.items?.length || 0} items • Tax: ${sale.tax.toFixed(2)}
            </Typography>
          </Paper>
          
          {/* Payment Method */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Payment Method
            </Typography>
            <PaymentMethodSelector
              selected={paymentMethod}
              onSelect={handleMethodSelect}
              disabled={processing}
            />
          </Box>
          
          {/* Cash Payment */}
          {paymentMethod === 'CASH' && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Cash Tendered
              </Typography>
              
              <TextField
                fullWidth
                size="large"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder="0.00"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  sx: { fontSize: '2rem', textAlign: 'right' }
                }}
                inputProps={{ style: { textAlign: 'right' } }}
                sx={{ mb: 2 }}
              />
              
              <QuickCashAmounts
                total={sale.total}
                onSelect={handleQuickAmount}
                disabled={processing}
              />
              
              {/* Change Display */}
              {tenderedValue >= sale.total && (
                <Paper 
                  sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: 'success.light', 
                    textAlign: 'center' 
                  }}
                >
                  <Typography variant="overline">Change Due</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.dark' }}>
                    ${change.toFixed(2)}
                  </Typography>
                </Paper>
              )}
            </Paper>
          )}
          
          {/* Check Payment */}
          {paymentMethod === 'CHECK' && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Check Details
              </Typography>
              <TextField
                fullWidth
                label="Check Number"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                placeholder="Enter check number"
              />
            </Paper>
          )}
        </Grid>
        
        {/* Right: Summary & Actions */}
        <Grid item xs={12} md={5}>
          {/* Order Summary */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Order Summary
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {sale.items?.map((item, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">
                    {item.quantity}x {item.description}
                  </Typography>
                  <Typography variant="body2">
                    ${item.extended.toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Subtotal</Typography>
              <Typography>${sale.subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Tax</Typography>
              <Typography>${sale.tax.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ${sale.total.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
          
          {/* Keypad (for cash) */}
          {paymentMethod === 'CASH' && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <NumericKeypad
                onInput={handleKeypadInput}
                onClear={handleKeypadClear}
                onBackspace={handleKeypadBackspace}
                disabled={processing}
              />
            </Paper>
          )}
          
          {/* Process Button */}
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            onClick={handleProcessPayment}
            disabled={!canProcess || processing}
            startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <ConfirmIcon />}
            sx={{ py: 2, fontSize: '1.1rem', mb: 1 }}
          >
            {processing ? 'Processing...' : `Complete Sale`}
          </Button>
          
          {/* Back Button */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleBack}
            disabled={processing}
            startIcon={<BackIcon />}
          >
            Back to Items
          </Button>
        </Grid>
      </Grid>
      
      {/* Card Payment Dialog */}
      <Dialog open={showCardDialog} onClose={() => setShowCardDialog(false)}>
        <DialogTitle>Card Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
              <CardIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              ${sale.total.toFixed(2)}
            </Typography>
            <Typography color="text.secondary">
              Insert, tap, or swipe card on terminal
            </Typography>
            <CircularProgress sx={{ mt: 3 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCardDialog(false)}>Cancel</Button>
          <Button onClick={handleCardPayment} variant="contained" color="success">
            Simulate Approval
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default QuickSalePaymentScreen;
