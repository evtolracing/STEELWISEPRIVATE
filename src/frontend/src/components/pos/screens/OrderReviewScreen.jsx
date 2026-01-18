/**
 * Order Review Screen
 * 
 * Review order details before shipping/payment.
 * Includes pricing review, discount management, and approval workflow.
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  Discount as DiscountIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  ContentCut as CutIcon,
  Warning as WarningIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Delete as DeleteIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// ============================================
// CUSTOMER SUMMARY CARD
// ============================================

function CustomerSummaryCard({ customer, division, onEdit }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Customer
            </Typography>
          </Box>
          <IconButton size="small" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {customer?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Account: {customer?.accountNumber}
        </Typography>
        
        {division && (
          <Box sx={{ mt: 1 }}>
            <Chip label={division.name} size="small" variant="outlined" />
          </Box>
        )}
        
        {customer?.contact && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Contact: {customer.contact.name}
            </Typography>
            {customer.contact.phone && (
              <Typography variant="caption" color="text.secondary" display="block">
                {customer.contact.phone}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// PRICING SUMMARY CARD WITH DISCOUNT MANAGEMENT
// ============================================

function PricingSummaryCard({ pricing, pendingApprovals, onApplyDiscount, onRemoveDiscount, onApproveDiscount, onRejectDiscount, isLocked }) {
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState('PERCENT');
  const [discountReason, setDiscountReason] = useState('');
  
  const handleApplyDiscount = () => {
    onApplyDiscount({
      type: discountType,
      value: parseFloat(discountValue) || 0,
      reason: discountReason || 'Manual discount'
    });
    setDiscountOpen(false);
    setDiscountValue('');
    setDiscountReason('');
  };
  
  const hasDiscountPendingApproval = pendingApprovals?.some(a => a.type === 'DISCOUNT');
  
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Order Total
            </Typography>
            {isLocked && (
              <Tooltip title="Pricing locked">
                <LockIcon color="action" fontSize="small" />
              </Tooltip>
            )}
          </Box>
          <Button 
            size="small" 
            startIcon={<DiscountIcon />}
            onClick={() => setDiscountOpen(true)}
            disabled={isLocked}
          >
            Discount
          </Button>
        </Box>
        
        {/* Line Items */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">Subtotal</Typography>
          <Typography variant="body2">${(pricing.subtotal || 0).toFixed(2)}</Typography>
        </Box>
        
        {/* Processing Charges */}
        {pricing.processingTotal > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Processing</Typography>
            <Typography variant="body2">${pricing.processingTotal.toFixed(2)}</Typography>
          </Box>
        )}
        
        {/* Discounts */}
        {pricing.discounts?.length > 0 && (
          <Box sx={{ mb: 1 }}>
            {pricing.discounts.map((discount, index) => (
              <Box key={discount.id || index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" color="success.main">
                    {discount.description || discount.reason || 'Discount'}
                  </Typography>
                  {discount.pendingApproval && (
                    <Chip label="Pending" size="small" color="warning" />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" color="success.main">
                    -${discount.amount?.toFixed(2)}
                  </Typography>
                  {!isLocked && onRemoveDiscount && (
                    <IconButton size="small" onClick={() => onRemoveDiscount(discount.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Pending Discount Approvals */}
        {hasDiscountPendingApproval && (
          <Alert severity="warning" sx={{ mb: 1, py: 0 }}>
            <Typography variant="caption">
              Discounts require manager approval
            </Typography>
          </Alert>
        )}
        
        {/* Tax */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Tax ({((pricing.taxRate || 0) * 100).toFixed(1)}%)
          </Typography>
          <Typography variant="body2">${(pricing.taxAmount || 0).toFixed(2)}</Typography>
        </Box>
        
        {/* Freight */}
        {pricing.freightAmount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Freight</Typography>
            <Typography variant="body2">${(pricing.freightAmount || 0).toFixed(2)}</Typography>
          </Box>
        )}
        
        <Divider sx={{ my: 1.5 }} />
        
        {/* Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total</Typography>
          <Typography variant="h5" color="primary.main" sx={{ fontWeight: 600 }}>
            ${(pricing.grandTotal || pricing.totalAmount || 0).toFixed(2)}
          </Typography>
        </Box>
        
        {/* Discount Dialog */}
        <Dialog open={discountOpen} onClose={() => setDiscountOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button 
                variant={discountType === 'PERCENT' ? 'contained' : 'outlined'}
                onClick={() => setDiscountType('PERCENT')}
              >
                %
              </Button>
              <Button 
                variant={discountType === 'AMOUNT' ? 'contained' : 'outlined'}
                onClick={() => setDiscountType('AMOUNT')}
              >
                $
              </Button>
            </Box>
            <TextField
              fullWidth
              label={discountType === 'PERCENT' ? 'Discount %' : 'Discount Amount'}
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              sx={{ mt: 2 }}
              inputProps={{ min: 0 }}
              helperText={discountType === 'PERCENT' && parseFloat(discountValue) > 15 ? 
                'Discounts over 15% require approval' : ''}
            />
            <TextField
              fullWidth
              label="Reason (optional)"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="e.g., Loyal customer, Price match"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiscountOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleApplyDiscount}
              disabled={!discountValue || parseFloat(discountValue) <= 0}
            >
              Apply
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ============================================
// ORDER LINES TABLE WITH PRICING DETAILS
// ============================================

function OrderLinesTable({ lines, pricingWarnings, onEditLine }) {
  const [expanded, setExpanded] = useState(true);
  
  // Get warnings by line ID
  const warningsByLine = {};
  pricingWarnings?.forEach(w => {
    if (w.lineId) warningsByLine[w.lineId] = w;
  });
  
  const hasWarnings = pricingWarnings?.length > 0;
  
  return (
    <Paper variant="outlined">
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShippingIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Order Lines ({lines.length} items)
          </Typography>
          {hasWarnings && (
            <Chip 
              icon={<WarningIcon />}
              label={`${pricingWarnings.length} warning${pricingWarnings.length > 1 ? 's' : ''}`}
              size="small"
              color="warning"
            />
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="center">UOM</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Extended</TableCell>
                <TableCell align="right">Margin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map(line => {
                const warning = warningsByLine[line.id];
                const margin = line.pricing?.margin;
                
                return (
                  <TableRow key={line.id} hover sx={{ bgcolor: warning ? 'warning.light' : undefined }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {line.sku}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.description}
                          </Typography>
                        </Box>
                        {warning && (
                          <Tooltip title={warning.message}>
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                        {line.processing && (
                          <Chip 
                            icon={<CutIcon />}
                            label={`Cut: ${line.processing.cutLength}"`}
                            size="small"
                          />
                        )}
                        {line.pricing?.priceSource && (
                          <Chip 
                            label={line.pricing.priceSource === 'CONTRACT' ? 'Contract' : 
                                   line.pricing.priceSource === 'TIER' ? 'Tier' : 'List'}
                            size="small"
                            variant="outlined"
                            color={line.pricing.priceSource === 'CONTRACT' ? 'success' : 'default'}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{line.quantity}</TableCell>
                    <TableCell align="center">{line.uom}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        ${line.unitPrice?.toFixed(2)}
                      </Typography>
                      {line.pricing?.basePrice && line.pricing.basePrice !== line.unitPrice && (
                        <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          ${line.pricing.basePrice.toFixed(2)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 500 }}>
                        ${line.extendedPrice?.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {margin != null && (
                        <Typography 
                          variant="body2" 
                          color={warning ? 'warning.main' : margin >= 0.20 ? 'success.main' : 'text.secondary'}
                        >
                          {(margin * 100).toFixed(1)}%
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Paper>
  );
}

// ============================================
// ORDER REVIEW SCREEN
// ============================================

export function OrderReviewScreen({ screen, onNext, onBack }) {
  const {
    customer,
    division,
    lines,
    pricing,
    pricingWarnings,
    pendingApprovals,
    pricingSummary,
    addOrderDiscount,
    removeOrderDiscount,
    approveDiscount,
    rejectDiscount,
    transition,
    isLoading
  } = usePOS();
  
  const [error, setError] = useState(null);
  
  // Handle apply discount
  const handleApplyDiscount = useCallback(async (discountData) => {
    try {
      await addOrderDiscount(discountData);
    } catch (err) {
      setError(err.message);
    }
  }, [addOrderDiscount]);
  
  // Handle remove discount
  const handleRemoveDiscount = useCallback(async (discountId) => {
    try {
      await removeOrderDiscount(discountId);
    } catch (err) {
      setError(err.message);
    }
  }, [removeOrderDiscount]);
  
  // Handle approve discount
  const handleApproveDiscount = useCallback(async (approvalId, credentials) => {
    try {
      await approveDiscount(approvalId, credentials);
    } catch (err) {
      setError(err.message);
    }
  }, [approveDiscount]);
  
  // Handle reject discount
  const handleRejectDiscount = useCallback(async (approvalId) => {
    try {
      await rejectDiscount(approvalId);
    } catch (err) {
      setError(err.message);
    }
  }, [rejectDiscount]);
  
  // Handle edit customer
  const handleEditCustomer = useCallback(() => {
    // Go back to customer screen
    transition('BACK_TO_CUSTOMER');
  }, [transition]);
  
  // Handle edit lines
  const handleEditLines = useCallback(() => {
    // Go back to line entry
    transition('ADD_MORE_ITEMS');
  }, [transition]);
  
  // Continue to shipping
  const handleContinue = useCallback(async () => {
    // Check for pending approvals
    if (pricingSummary?.hasPendingApprovals) {
      setError('Please resolve pending approvals before continuing');
      return;
    }
    
    try {
      await transition('CONFIRM_REVIEW');
      onNext?.();
    } catch (err) {
      setError(err.message);
    }
  }, [transition, onNext, pricingSummary?.hasPendingApprovals]);
  
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {screen?.title || 'Review Order'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {screen?.description || 'Review order details before continuing to shipping and payment.'}
        </Typography>
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Pricing Warnings */}
      {pricingSummary?.hasWarnings && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {pricingWarnings?.length} line(s) have low margins. Review before proceeding.
          </Typography>
        </Alert>
      )}
      
      {/* Pending Approvals */}
      {pricingSummary?.hasPendingApprovals && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {pendingApprovals?.length} item(s) require manager approval.
          </Typography>
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Left Column - Customer & Pricing */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <CustomerSummaryCard 
              customer={customer} 
              division={division}
              onEdit={handleEditCustomer}
            />
            <PricingSummaryCard 
              pricing={pricing}
              pendingApprovals={pendingApprovals}
              onApplyDiscount={handleApplyDiscount}
              onRemoveDiscount={handleRemoveDiscount}
              onApproveDiscount={handleApproveDiscount}
              onRejectDiscount={handleRejectDiscount}
              isLocked={pricingSummary?.isLocked}
            />
          </Box>
        </Grid>
        
        {/* Right Column - Order Lines */}
        <Grid item xs={12} md={8}>
          <OrderLinesTable 
            lines={lines}
            pricingWarnings={pricingWarnings}
            onEditLine={handleEditLines}
          />
          
          {/* Add More Items */}
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined"
              onClick={handleEditLines}
            >
              Add More Items
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={onBack}
          disabled={isLoading}
        >
          Back to Items
        </Button>
        <Button
          variant="contained"
          endIcon={<NextIcon />}
          onClick={handleContinue}
          disabled={isLoading || lines.length === 0 || pricingSummary?.hasPendingApprovals}
          size="large"
        >
          {pricingSummary?.hasPendingApprovals ? 'Approval Required' : 'Continue to Shipping'}
        </Button>
      </Box>
    </Box>
  );
}

export default OrderReviewScreen;
