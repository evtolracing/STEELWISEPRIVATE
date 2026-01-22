/**
 * Will-Call Complete Screen
 * 
 * Pickup complete, documents printed.
 * Implements WILL_CALL_COMPLETE from design document 42-AI-ORDER-INTAKE-POS.md
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  Description as DocumentIcon,
  Assignment as MTRIcon,
  ArrowForward as NextIcon,
  Home as HomeIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// ============================================
// DOCUMENT ROW
// ============================================

function DocumentRow({ document, onPrint, onEmail, printing }) {
  const icons = {
    PACKING_LIST: <ReceiptIcon />,
    BOL: <DocumentIcon />,
    MTR: <MTRIcon />,
    PICKUP_RECEIPT: <ReceiptIcon />
  };
  
  return (
    <ListItem
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={printing === document.type ? <CircularProgress size={16} /> : <PrintIcon />}
            onClick={() => onPrint(document)}
            disabled={printing === document.type}
          >
            Print
          </Button>
          <Button
            size="small"
            startIcon={<EmailIcon />}
            onClick={() => onEmail(document)}
          >
            Email
          </Button>
        </Box>
      }
    >
      <ListItemIcon>
        {icons[document.type] || <DocumentIcon />}
      </ListItemIcon>
      <ListItemText 
        primary={document.name}
        secondary={document.generated ? 'Ready' : 'Generating...'}
      />
    </ListItem>
  );
}

// ============================================
// COMPLETION SUMMARY
// ============================================

function CompletionSummary({ completion }) {
  return (
    <Card variant="outlined" sx={{ bgcolor: 'success.light', borderColor: 'success.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
            <SuccessIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.dark' }}>
              Pickup Complete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completion?.orderNumber || 'Order'} has been released
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Completed At</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {new Date(completion?.completedAt || Date.now()).toLocaleTimeString()}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Items Released</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {completion?.itemsReleased?.length || 0} items
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Signed By</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {completion?.signature?.signerName || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Loading Dock</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {completion?.loadingDock || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ============================================
// PARTIAL PICKUP WARNING
// ============================================

function PartialPickupWarning({ itemsRemaining }) {
  if (!itemsRemaining || itemsRemaining.length === 0) return null;
  
  return (
    <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Partial Pickup - Items Remaining
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        The following items are held for a future pickup:
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        {itemsRemaining.map((item, i) => (
          <li key={i}>
            <Typography variant="body2">
              Line #{item.lineNumber}: {item.productSku} - Qty: {item.quantityRemaining}
            </Typography>
          </li>
        ))}
      </Box>
    </Alert>
  );
}

// ============================================
// WILL-CALL COMPLETE SCREEN
// ============================================

export function WillCallCompleteScreen({ screen, onNext, onBack }) {
  const { willCallOrder, willCallCompletion, transition, isLoading } = usePOS();
  
  // Use mock data if not in context
  const order = willCallOrder || {
    id: 'wc-001',
    orderNumber: 'SO-100234',
    customer: { name: 'ABC Fabrication', email: 'orders@abcfab.com' }
  };
  
  const completion = willCallCompletion || {
    orderNumber: order.orderNumber,
    completedAt: new Date().toISOString(),
    itemsReleased: [
      { lineNumber: 1, productSku: 'HR-1018-0.125', quantityReleased: 10 },
      { lineNumber: 2, productSku: 'CR-1008-0.060', quantityReleased: 20 },
      { lineNumber: 3, productSku: 'GAL-G90-0.020', quantityReleased: 5 }
    ],
    itemsRemaining: [],
    signature: { signerName: 'John Smith' },
    loadingDock: 'Dock 3',
    isPartialPickup: false
  };
  
  // State
  const [documents, setDocuments] = useState([
    { type: 'PICKUP_RECEIPT', name: 'Pickup Receipt', generated: true },
    { type: 'PACKING_LIST', name: 'Packing List', generated: true },
    { type: 'BOL', name: 'Bill of Lading', generated: true },
    { type: 'MTR', name: 'Mill Test Reports', generated: true }
  ]);
  const [printing, setPrinting] = useState(null);
  const [autoPrinted, setAutoPrinted] = useState(false);
  
  // Auto-print receipt on mount
  useEffect(() => {
    if (!autoPrinted) {
      // In production, would trigger print of pickup receipt
      console.log('Auto-printing pickup receipt');
      setAutoPrinted(true);
    }
  }, [autoPrinted]);
  
  // Handle print
  const handlePrint = async (document) => {
    setPrinting(document.type);
    
    try {
      // In production, would call print API
      console.log('Printing document:', document.name);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setPrinting(null);
    }
  };
  
  // Handle email
  const handleEmail = async (document) => {
    // In production, would call email API
    console.log('Emailing document:', document.name, 'to', order.customer?.email);
    alert(`Document "${document.name}" will be emailed to ${order.customer?.email || 'customer'}`);
  };
  
  // Handle next pickup
  const handleNextPickup = async () => {
    try {
      await transition('NEXT_PICKUP');
      onNext?.(); // This should go back to queue
    } catch (err) {
      onNext?.();
    }
  };
  
  // Handle done
  const handleDone = async () => {
    try {
      await transition('DONE');
      onBack?.(); // This should go to IDLE
    } catch (err) {
      onBack?.();
    }
  };
  
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Success Summary */}
      <CompletionSummary completion={completion} />
      
      {/* Partial Pickup Warning */}
      <PartialPickupWarning itemsRemaining={completion.itemsRemaining} />
      
      {/* Documents */}
      <Paper variant="outlined" sx={{ mt: 3 }}>
        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Documents
          </Typography>
        </Box>
        <Divider />
        <List>
          {documents.map((doc, index) => (
            <React.Fragment key={doc.type}>
              {index > 0 && <Divider />}
              <DocumentRow
                document={doc}
                onPrint={handlePrint}
                onEmail={handleEmail}
                printing={printing}
              />
            </React.Fragment>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => documents.forEach(handlePrint)}
          >
            Print All
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => documents.forEach(handleEmail)}
          >
            Email All to Customer
          </Button>
        </Box>
      </Paper>
      
      {/* Released Items Summary */}
      <Paper variant="outlined" sx={{ mt: 3 }}>
        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Items Released
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {completion.itemsReleased?.map((item, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Line #{item.lineNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.productSku}
                    </Typography>
                    <Typography variant="body2">
                      Qty: {item.quantityReleased}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
      
      {/* Customer Info */}
      <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {order.customer?.name}
            </Typography>
            {order.customer?.email && (
              <Typography variant="body2" color="text.secondary">
                {order.customer.email}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">Completed</Typography>
                <Typography variant="body2">
                  {new Date(completion.completedAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={handleDone}
          size="large"
        >
          Back to Main Menu
        </Button>
        
        <Button
          variant="contained"
          endIcon={<NextIcon />}
          onClick={handleNextPickup}
          size="large"
        >
          Next Pickup
        </Button>
      </Box>
      
      {/* Status Bar */}
      <Paper 
        variant="outlined" 
        sx={{ 
          mt: 3, 
          p: 2, 
          display: 'flex', 
          justifyContent: 'center',
          bgcolor: 'grey.50'
        }}
      >
        <Chip 
          icon={<SuccessIcon />}
          label={`Pickup ${order.orderNumber} completed successfully`}
          color="success"
          sx={{ px: 2 }}
        />
      </Paper>
    </Box>
  );
}

export default WillCallCompleteScreen;
