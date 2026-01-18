/**
 * Confirmation Screen
 * 
 * Order confirmation with print options.
 */

import React, { useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Add as NewOrderIcon,
  Home as HomeIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  ContentCut as CutIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// ============================================
// CONFIRMATION SCREEN
// ============================================

export function ConfirmationScreen({ screen, onNext, onBack }) {
  const {
    customer,
    division,
    lines,
    pricing,
    shipping,
    payment,
    orderId,
    orderNumber,
    reset
  } = usePOS();
  
  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);
  
  // Handle email
  const handleEmail = useCallback(() => {
    // In production, call API to send email
    alert('Email confirmation sent to ' + (customer?.contact?.email || customer?.email));
  }, [customer]);
  
  // Start new order
  const handleNewOrder = useCallback(() => {
    reset();
    window.location.reload(); // Or navigate to POS start
  }, [reset]);
  
  // Go to dashboard
  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);
  
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Success Header */}
      <Paper sx={{ p: 4, mb: 3, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
        <SuccessIcon sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Order Confirmed!
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Order #{orderNumber || 'POS-' + Date.now()}
        </Typography>
      </Paper>
      
      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button 
              variant="contained" 
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print Receipt
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              startIcon={<EmailIcon />}
              onClick={handleEmail}
            >
              Email Confirmation
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              startIcon={<NewOrderIcon />}
              onClick={handleNewOrder}
              color="primary"
            >
              New Order
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="text" 
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
            >
              Go to Dashboard
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Order Summary */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={4}>
          {/* Customer Info */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Customer
                </Typography>
              </Box>
              <Typography variant="body1">{customer?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Account: {customer?.accountNumber}
              </Typography>
              {division && (
                <Chip label={division.name} size="small" sx={{ mt: 1 }} />
              )}
            </CardContent>
          </Card>
          
          {/* Shipping Info */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShippingIcon color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Shipping
                </Typography>
              </Box>
              <Chip 
                label={shipping.method || 'Delivery'} 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ mb: 1 }}
              />
              {shipping.address && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    {shipping.address.street1}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {shipping.address.city}, {shipping.address.state} {shipping.address.zipCode}
                  </Typography>
                </Box>
              )}
              {shipping.requestedDate && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Requested: {new Date(shipping.requestedDate).toLocaleDateString()}
                </Typography>
              )}
            </CardContent>
          </Card>
          
          {/* Payment Info */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ReceiptIcon color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Payment
                </Typography>
              </Box>
              <Chip 
                label={payment.method || 'Terms'} 
                size="small" 
                color="success" 
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right Column - Order Lines */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Order Details
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map(line => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {line.sku}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.description}
                          </Typography>
                          {line.processing && (
                            <Chip 
                              icon={<CutIcon />}
                              label={`Cut: ${line.processing.cutLength}"`}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {line.quantity} {line.uom}
                        </TableCell>
                        <TableCell align="right">
                          ${line.unitPrice?.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          ${line.extendedPrice?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Totals */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: 200, mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2">${(pricing.subtotal || 0).toFixed(2)}</Typography>
                </Box>
                
                {pricing.discounts?.length > 0 && pricing.discounts.map((discount, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', width: 200, mb: 0.5 }}>
                    <Typography variant="body2" color="success.main">Discount</Typography>
                    <Typography variant="body2" color="success.main">-${discount.amount.toFixed(2)}</Typography>
                  </Box>
                ))}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: 200, mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Tax</Typography>
                  <Typography variant="body2">${(pricing.taxAmount || 0).toFixed(2)}</Typography>
                </Box>
                
                {pricing.freightAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: 200, mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Freight</Typography>
                    <Typography variant="body2">${(pricing.freightAmount || 0).toFixed(2)}</Typography>
                  </Box>
                )}
                
                <Divider sx={{ width: 200, my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: 200 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total</Typography>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                    ${(pricing.totalAmount || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          {/* Instructions */}
          {shipping.instructions && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Special Instructions:</Typography>
              <Typography variant="body2">{shipping.instructions}</Typography>
            </Alert>
          )}
        </Grid>
      </Grid>
      
      {/* Footer Notice */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          A confirmation email has been sent to {customer?.contact?.email || customer?.email || 'the customer'}.
          <br />
          For questions about this order, please reference order #{orderNumber || 'POS-' + orderId}.
        </Typography>
      </Paper>
    </Box>
  );
}

export default ConfirmationScreen;
