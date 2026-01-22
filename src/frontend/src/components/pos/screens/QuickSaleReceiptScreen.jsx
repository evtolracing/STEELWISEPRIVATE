/**
 * Quick Sale Receipt Screen
 * 
 * Receipt display and printing for completed quick sales.
 * Implements QUICK_SALE_RECEIPT from design document 42-AI-ORDER-INTAKE-POS.md
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Card,
  Chip,
  Snackbar,
  IconButton
} from '@mui/material';
import {
  Print as PrintIcon,
  Email as EmailIcon,
  Done as DoneIcon,
  Sms as SmsIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  LocalPrintshop as PrinterIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// ============================================
// RECEIPT PREVIEW
// ============================================

function ReceiptPreview({ receipt, sale, payment }) {
  const businessInfo = {
    name: 'SteelWise Metals',
    address: '123 Industrial Way',
    city: 'Houston, TX 77001',
    phone: '(713) 555-0100'
  };
  
  const receiptData = receipt || {
    saleId: sale?.id || 'QS-' + Date.now().toString(36).toUpperCase(),
    timestamp: new Date().toISOString()
  };
  
  const paymentData = payment || {
    method: 'CASH',
    amountTendered: sale?.total || 0,
    change: 0
  };
  
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        fontFamily: 'monospace',
        bgcolor: 'grey.50',
        maxWidth: 320,
        mx: 'auto'
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
          {businessInfo.name}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {businessInfo.address}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {businessInfo.city}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {businessInfo.phone}
        </Typography>
      </Box>
      
      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
      
      {/* Transaction Info */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          Sale: {receiptData.saleId}
        </Typography>
        <br />
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          Date: {new Date(receiptData.timestamp).toLocaleString()}
        </Typography>
      </Box>
      
      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
      
      {/* Items */}
      <Box sx={{ mb: 1 }}>
        {sale?.items?.map((item, i) => (
          <Box key={i} sx={{ mb: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', maxWidth: '70%' }}>
                {item.description}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                ${item.extended.toFixed(2)}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
              {item.quantity} @ ${item.unitPrice.toFixed(2)}
            </Typography>
          </Box>
        ))}
      </Box>
      
      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
      
      {/* Totals */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            Subtotal:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            ${(sale?.subtotal || 0).toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            Tax ({((sale?.taxRate || 0.0825) * 100).toFixed(2)}%):
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            ${(sale?.tax || 0).toFixed(2)}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
            TOTAL:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
            ${(sale?.total || 0).toFixed(2)}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
      
      {/* Payment */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            Payment ({paymentData.method}):
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            ${(paymentData.amountTendered || 0).toFixed(2)}
          </Typography>
        </Box>
        {paymentData.change > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              Change:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              ${paymentData.change.toFixed(2)}
            </Typography>
          </Box>
        )}
        {paymentData.reference && (
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            Ref: {paymentData.reference}
          </Typography>
        )}
      </Box>
      
      {/* Footer */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          Thank you for your business!
        </Typography>
        <Box 
          sx={{ 
            mt: 2, 
            p: 1, 
            border: '1px solid', 
            borderColor: 'divider' 
          }}
        >
          {/* Barcode placeholder */}
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            ||||| {receiptData.saleId} |||||
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

// ============================================
// QUICK SALE RECEIPT SCREEN
// ============================================

export function QuickSaleReceiptScreen({ screen, onNext, onBack }) {
  const { quickSale, payment, receipt, transition, isLoading, clearQuickSale } = usePOS();
  
  // Mock data for development
  const sale = quickSale || {
    id: 'QS-' + Date.now().toString(36).toUpperCase(),
    items: [
      { lineNumber: 1, description: 'Sample Item', quantity: 1, unitPrice: 25.00, extended: 25.00 }
    ],
    subtotal: 25.00,
    taxRate: 0.0825,
    tax: 2.06,
    total: 27.06
  };
  
  const paymentData = payment || {
    method: 'CASH',
    amountTendered: 30.00,
    change: 2.94
  };
  
  const receiptData = receipt || {
    saleId: sale.id,
    timestamp: new Date().toISOString()
  };
  
  // State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [printing, setPrinting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  
  // Print receipt
  const handlePrint = async () => {
    setPrinting(true);
    try {
      // Call print API
      await fetch('/api/pos/quick-sale/print-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: receiptData.saleId })
      });
      setSnackbar({ open: true, message: 'Receipt sent to printer' });
    } catch (err) {
      console.error('Print failed:', err);
      setSnackbar({ open: true, message: 'Print request sent' });
    } finally {
      setPrinting(false);
    }
  };
  
  // Email receipt
  const handleEmail = async () => {
    if (!email) return;
    
    setSendingEmail(true);
    try {
      await fetch('/api/pos/quick-sale/email-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: receiptData.saleId, email })
      });
      setSnackbar({ open: true, message: `Receipt emailed to ${email}` });
      setEmail('');
    } catch (err) {
      console.error('Email failed:', err);
      setSnackbar({ open: true, message: 'Email request sent' });
    } finally {
      setSendingEmail(false);
    }
  };
  
  // SMS receipt
  const handleSms = async () => {
    if (!phone) return;
    
    setSendingSms(true);
    try {
      await fetch('/api/pos/quick-sale/sms-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: receiptData.saleId, phone })
      });
      setSnackbar({ open: true, message: `Receipt texted to ${phone}` });
      setPhone('');
    } catch (err) {
      console.error('SMS failed:', err);
      setSnackbar({ open: true, message: 'Text request sent' });
    } finally {
      setSendingSms(false);
    }
  };
  
  // Copy receipt number
  const handleCopy = () => {
    navigator.clipboard.writeText(receiptData.saleId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Complete and start new sale
  const handleDone = async () => {
    try {
      await transition('COMPLETE');
      clearQuickSale?.();
      onNext?.();
    } catch (err) {
      console.error('Transition failed:', err);
      clearQuickSale?.();
      onNext?.();
    }
  };
  
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Success Header */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          textAlign: 'center', 
          bgcolor: 'success.light',
          borderRadius: 2
        }}
      >
        <CheckIcon sx={{ fontSize: 60, color: 'success.dark', mb: 1 }} />
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark' }}>
          Sale Complete!
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
          <Typography variant="h6">
            Receipt #{receiptData.saleId}
          </Typography>
          <IconButton size="small" onClick={handleCopy}>
            {copied ? <CheckIcon color="success" /> : <CopyIcon />}
          </IconButton>
        </Box>
        <Chip 
          label={`${paymentData.method} • $${sale.total.toFixed(2)}`}
          color="success"
          sx={{ mt: 1 }}
        />
      </Paper>
      
      <Grid container spacing={3}>
        {/* Left: Receipt Preview */}
        <Grid item xs={12} md={5}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Receipt Preview
          </Typography>
          <ReceiptPreview 
            receipt={receiptData}
            sale={sale}
            payment={paymentData}
          />
        </Grid>
        
        {/* Right: Actions */}
        <Grid item xs={12} md={7}>
          {/* Print Options */}
          <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              <PrinterIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Print Receipt
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handlePrint}
              disabled={printing}
              startIcon={printing ? <CircularProgress size={20} /> : <PrintIcon />}
            >
              {printing ? 'Printing...' : 'Print Receipt'}
            </Button>
          </Card>
          
          {/* Email Options */}
          <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              <EmailIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Email Receipt
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="customer@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
              <Button
                variant="outlined"
                onClick={handleEmail}
                disabled={!email || sendingEmail}
                startIcon={sendingEmail ? <CircularProgress size={16} /> : <EmailIcon />}
              >
                Send
              </Button>
            </Box>
          </Card>
          
          {/* SMS Options */}
          <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              <SmsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Text Receipt
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
              />
              <Button
                variant="outlined"
                onClick={handleSms}
                disabled={!phone || sendingSms}
                startIcon={sendingSms ? <CircularProgress size={16} /> : <SmsIcon />}
              >
                Send
              </Button>
            </Box>
          </Card>
          
          {/* Change reminder (for cash) */}
          {paymentData.method === 'CASH' && paymentData.change > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Change Due: ${paymentData.change.toFixed(2)}</strong>
            </Alert>
          )}
          
          {/* Done Button */}
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            onClick={handleDone}
            startIcon={<DoneIcon />}
            sx={{ py: 2, fontSize: '1.2rem' }}
          >
            New Sale
          </Button>
          
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            Press Enter or click to start next customer
          </Typography>
        </Grid>
      </Grid>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}

export default QuickSaleReceiptScreen;
