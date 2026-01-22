/**
 * Payment Screen
 * 
 * Select payment method and process payment.
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Divider,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  CreditCard as CardIcon,
  Receipt as InvoiceIcon,
  AttachMoney as CashIcon,
  AccountBalance as CheckIcon,
  Paid as PaidIcon,
  ArrowBack as BackIcon,
  Check as CheckMarkIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// Payment methods
const PAYMENT_METHODS = [
  { 
    id: 'TERMS', 
    label: 'Account Terms', 
    description: 'Bill to account',
    icon: InvoiceIcon,
    requiresPayment: false
  },
  { 
    id: 'CREDIT_CARD', 
    label: 'Credit Card', 
    description: 'Pay with card',
    icon: CardIcon,
    requiresPayment: true
  },
  { 
    id: 'CASH', 
    label: 'Cash', 
    description: 'Pay with cash',
    icon: CashIcon,
    requiresPayment: true
  },
  { 
    id: 'CHECK', 
    label: 'Check', 
    description: 'Pay with check',
    icon: CheckIcon,
    requiresPayment: true
  }
];

// ============================================
// PAYMENT METHOD CARD
// ============================================

function PaymentMethodCard({ method, selected, onSelect, disabled }) {
  const Icon = method.icon;
  
  return (
    <Card 
      variant="outlined"
      sx={{ 
        height: '100%',
        borderColor: selected ? 'primary.main' : 'divider',
        borderWidth: selected ? 2 : 1,
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease'
      }}
    >
      <CardActionArea 
        onClick={() => !disabled && onSelect(method.id)}
        disabled={disabled}
        sx={{ height: '100%', p: 2 }}
      >
        <CardContent sx={{ p: 0, textAlign: 'center' }}>
          <Icon 
            sx={{ 
              fontSize: 40, 
              color: selected ? 'primary.main' : 'grey.400',
              mb: 1
            }} 
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {method.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {method.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ============================================
// CREDIT CARD FORM
// ============================================

function CreditCardForm({ onSubmit, amount, isProcessing }) {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  
  const handleChange = (field) => (e) => {
    setCardData(prev => ({ ...prev, [field]: e.target.value }));
  };
  
  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Card Details
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Card Number"
            placeholder="1234 5678 9012 3456"
            value={cardData.cardNumber}
            onChange={handleChange('cardNumber')}
            inputProps={{ maxLength: 19 }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Expiry"
            placeholder="MM/YY"
            value={cardData.expiry}
            onChange={handleChange('expiry')}
            inputProps={{ maxLength: 5 }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="CVV"
            placeholder="123"
            value={cardData.cvv}
            onChange={handleChange('cvv')}
            inputProps={{ maxLength: 4 }}
            type="password"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Name on Card"
            value={cardData.name}
            onChange={handleChange('name')}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => onSubmit(cardData)}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
        {isProcessing && <LinearProgress sx={{ mt: 1 }} />}
      </Box>
    </Paper>
  );
}

// ============================================
// CASH/CHECK FORM
// ============================================

function CashCheckForm({ method, onSubmit, amount, isProcessing }) {
  const [receivedAmount, setReceivedAmount] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  
  const received = parseFloat(receivedAmount) || 0;
  const change = received - amount;
  
  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        {method === 'CASH' ? 'Cash Payment' : 'Check Payment'}
      </Typography>
      
      <Grid container spacing={2}>
        {method === 'CHECK' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Check Number"
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
            />
          </Grid>
        )}
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Amount Received"
            type="number"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>
            }}
          />
        </Grid>
        
        {method === 'CASH' && received >= amount && (
          <Grid item xs={12}>
            <Alert severity="info">
              Change Due: <strong>${change.toFixed(2)}</strong>
            </Alert>
          </Grid>
        )}
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => onSubmit({ 
            amount: received, 
            checkNumber: method === 'CHECK' ? checkNumber : null,
            change: method === 'CASH' ? change : 0
          })}
          disabled={isProcessing || received < amount}
        >
          {isProcessing ? 'Processing...' : 'Complete Payment'}
        </Button>
        {isProcessing && <LinearProgress sx={{ mt: 1 }} />}
      </Box>
    </Paper>
  );
}

// ============================================
// PAYMENT SCREEN
// ============================================

export function PaymentScreen({ screen, onNext, onBack }) {
  const {
    customer,
    pricing,
    payment,
    transition,
    submitOrder,
    isLoading
  } = usePOS();
  
  const [method, setMethod] = useState(payment.method || 'TERMS');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successDialog, setSuccessDialog] = useState(false);
  
  // Check if customer is cash-only
  const isCashOnly = payment.cashOnly || customer?.cashOnly;
  
  // Get available payment methods
  const availableMethods = isCashOnly 
    ? PAYMENT_METHODS.filter(m => m.id !== 'TERMS')
    : PAYMENT_METHODS;
  
  // Check if customer has terms enabled
  const hasTerms = customer?.paymentTerms && customer.paymentTerms !== 'COD';
  
  // Get method config
  const methodConfig = PAYMENT_METHODS.find(m => m.id === method);
  
  // Process payment
  const handleProcessPayment = useCallback(async (paymentData) => {
    setProcessing(true);
    setError(null);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Submit order with payment
      await transition('PROCESS_PAYMENT', {
        paymentMethod: method,
        paymentData
      });
      
      // Show success and continue
      setSuccessDialog(true);
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  }, [method, transition]);
  
  // Process terms payment (no payment needed)
  const handleTermsPayment = useCallback(async () => {
    setProcessing(true);
    setError(null);
    
    try {
      await transition('SELECT_TERMS');
      await submitOrder();
      setSuccessDialog(true);
    } catch (err) {
      setError(err.message || 'Failed to process order');
    } finally {
      setProcessing(false);
    }
  }, [transition, submitOrder]);
  
  // Continue to confirmation
  const handleContinue = useCallback(() => {
    setSuccessDialog(false);
    onNext?.();
  }, [onNext]);
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {screen?.title || 'Payment'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {screen?.description || 'Select payment method and complete the order.'}
        </Typography>
      </Box>
      
      {/* Cash Only Warning */}
      {isCashOnly && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          This customer is marked as <strong>Cash Only</strong>. Account terms are not available.
        </Alert>
      )}
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Order Total */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Order Total
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 600 }}>
          ${(pricing.totalAmount || 0).toFixed(2)}
        </Typography>
      </Paper>
      
      {/* Payment Method Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaidIcon />
          Payment Method
        </Typography>
        
        <Grid container spacing={2}>
          {availableMethods.map(paymentMethod => (
            <Grid item xs={6} md={3} key={paymentMethod.id}>
              <PaymentMethodCard
                method={paymentMethod}
                selected={method === paymentMethod.id}
                onSelect={setMethod}
                disabled={paymentMethod.id === 'TERMS' && !hasTerms}
              />
            </Grid>
          ))}
        </Grid>
        
        {/* Terms info */}
        {method === 'TERMS' && hasTerms && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              Payment Terms: <strong>{customer?.paymentTerms}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Invoice will be sent to customer's billing address.
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Payment Form based on method */}
      {method === 'CREDIT_CARD' && (
        <CreditCardForm
          amount={pricing.totalAmount || 0}
          onSubmit={handleProcessPayment}
          isProcessing={processing}
        />
      )}
      
      {(method === 'CASH' || method === 'CHECK') && (
        <CashCheckForm
          method={method}
          amount={pricing.totalAmount || 0}
          onSubmit={handleProcessPayment}
          isProcessing={processing}
        />
      )}
      
      {method === 'TERMS' && (
        <Box sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleTermsPayment}
            disabled={processing || !hasTerms}
          >
            {processing ? 'Processing...' : 'Place Order on Account'}
          </Button>
          {processing && <LinearProgress sx={{ mt: 1 }} />}
        </Box>
      )}
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={onBack}
          disabled={isLoading || processing}
        >
          Back
        </Button>
      </Box>
      
      {/* Success Dialog */}
      <Dialog open={successDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <CheckMarkIcon sx={{ fontSize: 64, color: 'success.main' }} />
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Order Complete!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your order has been successfully processed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" onClick={handleContinue} size="large">
            View Confirmation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PaymentScreen;
