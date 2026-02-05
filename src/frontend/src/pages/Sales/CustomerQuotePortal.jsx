import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  AccessTime,
  Description,
  Print,
  Download,
  Email,
  Phone,
  Business,
  AttachMoney,
  LocalShipping,
  Info,
  ThumbUp,
  ThumbDown,
  Chat,
  ArrowBack,
} from '@mui/icons-material';

// Mock quote data (would be fetched based on token/ID in real implementation)
const quoteData = {
  id: 'QUO-2026-002156',
  status: 'SENT',
  createdDate: '2026-02-04',
  validUntil: '2026-02-18',
  expiresIn: 14,
  
  // Seller info
  seller: {
    company: 'ALRO Steel Supply',
    address: '1234 Industrial Blvd, Detroit, MI 48226',
    phone: '(800) 555-2567',
    email: 'quotes@alrosteel.com',
    salesRep: 'Sarah Wilson',
    salesRepEmail: 'swilson@alrosteel.com',
  },
  
  // Customer info
  customer: {
    company: 'AutoMax Manufacturing Inc.',
    contact: 'Robert Chen',
    address: '5678 Assembly Lane, Toledo, OH 43601',
    email: 'rchen@automax.com',
    phone: '(419) 555-9876',
    tier: 'A',
  },
  
  // Reference
  rfqReference: 'RFQ via Email - 2/3/2026',
  poNumber: '',
  
  // Line items
  lineItems: [
    {
      lineNumber: 1,
      product: '4140 Alloy Steel Round Bar',
      specs: '2.5" diameter x 12ft',
      quantity: 50,
      unit: 'bars',
      unitPrice: 89.50,
      totalPrice: 4475,
      leadTime: '3 days',
      notes: 'Heat-treated, certified',
    },
    {
      lineNumber: 2,
      product: 'A36 Steel Plate',
      specs: '0.5" x 48" x 96"',
      quantity: 20,
      unit: 'sheets',
      unitPrice: 142.00,
      totalPrice: 2840,
      leadTime: '2 days',
      notes: 'Mill cert included',
    },
    {
      lineNumber: 3,
      product: 'Cut-to-Length Service',
      specs: 'Precision cutting per drawing',
      quantity: 50,
      unit: 'cuts',
      unitPrice: 8.50,
      totalPrice: 425,
      leadTime: 'Included',
      notes: '±0.005" tolerance',
    },
  ],
  
  // Totals
  subtotal: 7740,
  freight: 285,
  tax: 0, // Tax exempt
  total: 8025,
  
  // Delivery
  delivery: {
    method: 'Common Carrier - LTL',
    estimatedDate: '2026-02-10',
    address: '5678 Assembly Lane, Toledo, OH 43601',
    instructions: 'Dock delivery, call ahead required',
  },
  
  // Terms
  terms: {
    payment: 'Net 30',
    warranty: 'Standard material certification',
    validity: '14 days from quote date',
  },
  
  // Documents
  documents: [
    { name: 'Quote PDF', type: 'pdf' },
    { name: 'Material Specifications', type: 'pdf' },
  ],
};

const CustomerQuotePortal = () => {
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [question, setQuestion] = useState('');
  const [acceptanceComplete, setAcceptanceComplete] = useState(false);

  const daysUntilExpiry = quoteData.expiresIn;
  const isExpiringSoon = daysUntilExpiry <= 3;

  const handleAcceptQuote = () => {
    // In real implementation, this would submit to API
    setAcceptDialogOpen(false);
    setAcceptanceComplete(true);
  };

  const handleDeclineQuote = () => {
    // In real implementation, this would submit to API
    setDeclineDialogOpen(false);
    // Show confirmation
  };

  const handleSubmitQuestion = () => {
    // In real implementation, this would submit to API
    setQuestionDialogOpen(false);
    setQuestion('');
    // Show confirmation
  };

  if (acceptanceComplete) {
    return (
      <Box sx={{ 
        p: 4, 
        maxWidth: 600, 
        mx: 'auto', 
        mt: 8,
        textAlign: 'center',
      }}>
        <Paper sx={{ p: 4 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Quote Accepted!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Thank you for your order. Your PO #{poNumber} has been received.
          </Typography>
          <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Order Confirmation:</strong> {quoteData.id}<br/>
              <strong>Estimated Delivery:</strong> {quoteData.delivery.estimatedDate}<br/>
              <strong>Total:</strong> ${quoteData.total.toLocaleString()}
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary" paragraph>
            A confirmation email has been sent to {quoteData.customer.email}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Print Confirmation
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {quoteData.seller.company}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {quoteData.seller.address}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                Quote #{quoteData.id}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, mt: 1 }}>
                <Chip 
                  label={`Valid until ${quoteData.validUntil}`}
                  color={isExpiringSoon ? 'error' : 'success'}
                  icon={<AccessTime />}
                />
                {isExpiringSoon && (
                  <Chip label={`Expires in ${daysUntilExpiry} days`} color="error" variant="outlined" />
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Alert for expiring quote */}
      {isExpiringSoon && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This quote expires in {daysUntilExpiry} days. Please accept or contact us with questions before {quoteData.validUntil}.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Customer & Reference Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  PREPARED FOR
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {quoteData.customer.company}
                </Typography>
                <Typography variant="body2">
                  Attn: {quoteData.customer.contact}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {quoteData.customer.address}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  YOUR SALES REPRESENTATIVE
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {quoteData.seller.salesRep}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{quoteData.seller.salesRepEmail}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">{quoteData.seller.phone}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Line Items */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quoted Items
            </Typography>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Product / Service</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Lead Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quoteData.lineItems.map((item) => (
                  <TableRow key={item.lineNumber} hover>
                    <TableCell>{item.lineNumber}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {item.product}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.specs}
                      </Typography>
                      {item.notes && (
                        <Typography variant="caption" display="block" color="info.main">
                          {item.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell align="right">
                      ${item.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={500}>
                        ${item.totalPrice.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.leadTime} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Divider sx={{ my: 2 }} />

            {/* Totals */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ minWidth: 250 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">${quoteData.subtotal.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Freight:</Typography>
                  <Typography variant="body2">${quoteData.freight.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tax:</Typography>
                  <Typography variant="body2">$0.00 (Tax Exempt)</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={700}>Total:</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    ${quoteData.total.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Delivery Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Delivery Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Method</Typography>
                <Typography variant="body1">{quoteData.delivery.method}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Estimated Delivery</Typography>
                <Typography variant="body1" fontWeight={500} color="success.main">
                  {quoteData.delivery.estimatedDate}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Ship To</Typography>
                <Typography variant="body2">{quoteData.delivery.address}</Typography>
              </Grid>
            </Grid>
            {quoteData.delivery.instructions && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Delivery Instructions:</strong> {quoteData.delivery.instructions}
                </Typography>
              </Alert>
            )}
          </Paper>

          {/* Terms */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Terms & Conditions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                <Typography variant="body1">{quoteData.terms.payment}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Quote Validity</Typography>
                <Typography variant="body1">{quoteData.terms.validity}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Warranty</Typography>
                <Typography variant="body1">{quoteData.terms.warranty}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Action Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Accept This Quote
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ready to proceed? Accept this quote to convert it to an order.
            </Typography>
            
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              startIcon={<ThumbUp />}
              onClick={() => setAcceptDialogOpen(true)}
              sx={{ mb: 2 }}
            >
              Accept Quote
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">or</Typography>
            </Divider>

            <Button
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<Chat />}
              onClick={() => setQuestionDialogOpen(true)}
              sx={{ mb: 1 }}
            >
              Ask a Question
            </Button>
            
            <Button
              variant="text"
              color="error"
              fullWidth
              startIcon={<ThumbDown />}
              onClick={() => setDeclineDialogOpen(true)}
            >
              Decline Quote
            </Button>
          </Paper>

          {/* Documents */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Documents
            </Typography>
            {quoteData.documents.map((doc, idx) => (
              <Box 
                key={idx}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 1.5,
                  mb: 1,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description color="error" />
                  <Typography variant="body2">{doc.name}</Typography>
                </Box>
                <IconButton size="small">
                  <Download fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Paper>

          {/* Contact */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Need Help?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Contact your sales representative for any questions.
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Phone />}
              sx={{ mb: 1 }}
              href={`tel:${quoteData.seller.phone}`}
            >
              {quoteData.seller.phone}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Email />}
              href={`mailto:${quoteData.seller.salesRepEmail}`}
            >
              Email Sales Rep
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Accept Dialog */}
      <Dialog open={acceptDialogOpen} onClose={() => setAcceptDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Accept Quote & Place Order</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            By accepting this quote, you are placing an order for the items listed above totaling <strong>${quoteData.total.toLocaleString()}</strong>.
          </Alert>
          
          <TextField
            label="Your PO Number"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            fullWidth
            required
            helperText="Enter your purchase order number for this order"
            sx={{ mb: 3 }}
          />

          <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Order Summary</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Quote:</Typography>
              <Typography variant="body2">{quoteData.id}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Items:</Typography>
              <Typography variant="body2">{quoteData.lineItems.length} line items</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Delivery:</Typography>
              <Typography variant="body2">{quoteData.delivery.estimatedDate}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" fontWeight={600}>Total:</Typography>
              <Typography variant="body1" fontWeight={600}>${quoteData.total.toLocaleString()}</Typography>
            </Box>
          </Paper>

          <FormControlLabel
            control={
              <Checkbox 
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                I accept the terms and conditions outlined in this quote including payment terms of {quoteData.terms.payment}
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleAcceptQuote}
            disabled={!poNumber || !termsAccepted}
          >
            Confirm Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onClose={() => setDeclineDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Decline Quote</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            We're sorry to hear that. Please let us know why so we can improve our future quotes.
          </Typography>
          <TextField
            label="Reason for declining"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Price too high, found alternative supplier, project cancelled, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeclineDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeclineQuote}
          >
            Decline Quote
          </Button>
        </DialogActions>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onClose={() => setQuestionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ask a Question</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your question will be sent to {quoteData.seller.salesRep} who will respond via email.
          </Typography>
          <TextField
            label="Your Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="Ask about pricing, delivery, specifications, alternatives..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={handleSubmitQuestion}
            disabled={!question}
          >
            Send Question
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerQuotePortal;
