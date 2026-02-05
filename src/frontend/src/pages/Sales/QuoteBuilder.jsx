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
  TextField,
  IconButton,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack,
  Send,
  Save,
  Print,
  Edit,
  Delete,
  Add,
  ExpandMore,
  ExpandLess,
  Lightbulb,
  Warning,
  CheckCircle,
  Info,
  LocalShipping,
  Schedule,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Speed,
  Inventory,
  Calculate,
  Approval,
  History,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

// Mock quote data
const mockQuote = {
  id: 'QUO-2026-002156',
  rfqId: 'RFQ-2026-001234',
  version: 1,
  status: 'DRAFT',
  customer: {
    id: 'CUST-001',
    name: 'AutoMax Manufacturing',
    tier: 'A',
    contact: 'John Smith',
    email: 'john.smith@automax.com',
    phone: '+1 (555) 234-5678',
    address: '123 Industrial Blvd, Chicago, IL 60632',
  },
  validUntil: '2026-02-11',
  terms: 'Net 30',
  shipVia: 'Best Way',
  lineItems: [
    {
      id: 1,
      material: '304L Stainless Sheet',
      materialCode: 'SS-304L-SHT',
      dimensions: '0.250" x 48" x 96"',
      quantity: 12,
      unit: 'pcs',
      weight: 1224,
      weightUnit: 'lbs',
      // Costs
      costs: {
        material: 2876,
        processing: 420,
        packaging: 85,
        freight: 285,
        total: 3666,
      },
      // Pricing
      pricing: {
        listPrice: 4580,
        customerPrice: 4351, // A-tier discount
        quotedPrice: 4180,
        pricePerUnit: 3.42,
        priceUnit: 'lb',
      },
      // Margin
      margin: {
        dollars: 514,
        percent: 14,
        category: 'YELLOW', // Below target but above floor
        target: 22,
        floor: 12,
      },
      // Availability
      availability: {
        inStock: true,
        location: 'Detroit',
        qty: 25,
        promiseDate: '2026-02-06',
      },
      // Alternatives
      alternatives: [
        {
          type: 'LOWER_PRICE',
          description: 'Ship from Toledo branch',
          price: 4000,
          margin: 10,
          leadTime: 3,
          savings: 180,
        },
        {
          type: 'FASTER',
          description: 'Air freight available',
          price: 4520,
          margin: 12,
          leadTime: 1,
          premium: 340,
        },
        {
          type: 'SUBSTITUTE',
          description: '316L available (+8% cost)',
          price: 4510,
          margin: 15,
          leadTime: 2,
        },
      ],
      // AI insights
      insights: {
        confidence: 92,
        basedOn: '47 similar quotes',
        winRate: 78,
        pricePosition: 'Competitive',
      },
    },
    {
      id: 2,
      material: 'A36 Plate',
      materialCode: 'CS-A36-PLT',
      dimensions: '0.500" x 48" x 96"',
      quantity: 8,
      unit: 'pcs',
      weight: 1306,
      weightUnit: 'lbs',
      costs: {
        material: 1567,
        processing: 280,
        packaging: 65,
        freight: 195,
        total: 2107,
      },
      pricing: {
        listPrice: 2850,
        customerPrice: 2708,
        quotedPrice: 2650,
        pricePerUnit: 2.03,
        priceUnit: 'lb',
      },
      margin: {
        dollars: 543,
        percent: 21,
        category: 'GREEN',
        target: 22,
        floor: 15,
      },
      availability: {
        inStock: true,
        location: 'Detroit',
        qty: 50,
        promiseDate: '2026-02-05',
      },
      alternatives: [],
      insights: {
        confidence: 95,
        basedOn: '124 similar quotes',
        winRate: 82,
        pricePosition: 'Competitive',
      },
    },
  ],
  totals: {
    subtotal: 6830,
    freight: 480,
    tax: 584,
    total: 7894,
  },
  margin: {
    totalDollars: 1057,
    totalPercent: 17,
    vsTarget: -5,
    category: 'YELLOW',
  },
};

const QuoteBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quote, setQuote] = useState(mockQuote);
  const [expandedItems, setExpandedItems] = useState([1]);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  const getMarginColor = (category) => {
    const colors = {
      'RED': 'error',
      'YELLOW': 'warning',
      'GREEN': 'success',
      'BLUE': 'info',
    };
    return colors[category] || 'default';
  };

  const toggleItemExpand = (itemId) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handlePricingClick = (item) => {
    setSelectedItem(item);
    setPricingDialogOpen(true);
  };

  const needsApproval = quote.margin.totalPercent < 15;

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/sales/rfq-inbox')}>
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Quote Builder
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {quote.id} • Version {quote.version} • From {quote.rfqId}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Save />}>
            Save Draft
          </Button>
          <Button variant="outlined" startIcon={<Print />}>
            Preview PDF
          </Button>
          {needsApproval ? (
            <Button 
              variant="contained" 
              color="warning"
              startIcon={<Approval />}
              onClick={() => setApprovalDialogOpen(true)}
            >
              Request Approval
            </Button>
          ) : (
            <Button 
              variant="contained" 
              startIcon={<Send />}
              onClick={() => setSendDialogOpen(true)}
            >
              Send Quote
            </Button>
          )}
        </Box>
      </Box>

      {/* Approval Alert */}
      {needsApproval && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={500}>
            ⚠️ Margin below target (17% vs 22% target). Manager approval required before sending.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Customer Info */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Customer
              </Typography>
              <Chip 
                label={`Tier ${quote.customer.tier}`}
                size="small"
                color="success"
              />
            </Box>
            <Typography variant="h6">{quote.customer.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {quote.customer.contact} • {quote.customer.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {quote.customer.address}
            </Typography>
          </Paper>

          {/* Line Items */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Line Items
          </Typography>

          {quote.lineItems.map((item) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent>
                {/* Item Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {item.id}. {item.material}
                      </Typography>
                      <Chip 
                        label={item.availability.inStock ? 'In Stock' : 'To Order'}
                        size="small"
                        color={item.availability.inStock ? 'success' : 'warning'}
                        sx={{ height: 20 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {item.dimensions} • Qty: {item.quantity} {item.unit} • {item.weight.toLocaleString()} {item.weightUnit}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => toggleItemExpand(item.id)}>
                      {expandedItems.includes(item.id) ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <IconButton size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Pricing Summary */}
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Total Cost</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      ${item.costs.total.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Quoted Price</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight={600} color="primary.main">
                        ${item.pricing.quotedPrice.toLocaleString()}
                      </Typography>
                      <IconButton size="small" onClick={() => handlePricingClick(item)}>
                        <Calculate fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      ${item.pricing.pricePerUnit}/{item.pricing.priceUnit}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Margin</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip 
                        label={`${item.margin.percent}%`}
                        size="small"
                        color={getMarginColor(item.margin.category)}
                      />
                      <Typography variant="body2">
                        ${item.margin.dollars}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Target: {item.margin.target}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Promise Date</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      📅 {item.availability.promiseDate}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      from {item.availability.location}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Expanded Details */}
                <Collapse in={expandedItems.includes(item.id)}>
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    
                    {/* Cost Breakdown */}
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Cost Breakdown
                        </Typography>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell>Material ({item.materialCode})</TableCell>
                              <TableCell align="right">${item.costs.material.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Processing</TableCell>
                              <TableCell align="right">${item.costs.processing.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Packaging & Handling</TableCell>
                              <TableCell align="right">${item.costs.packaging.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Freight</TableCell>
                              <TableCell align="right">${item.costs.freight.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                              <TableCell><strong>Total Cost</strong></TableCell>
                              <TableCell align="right"><strong>${item.costs.total.toLocaleString()}</strong></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          AI Insights
                        </Typography>
                        <Alert severity="info" icon={<Lightbulb />} sx={{ mb: 1 }}>
                          <Typography variant="caption">
                            <strong>Confidence: {item.insights.confidence}%</strong><br />
                            Based on {item.insights.basedOn} with {item.insights.winRate}% win rate at this price.
                          </Typography>
                        </Alert>

                        {/* Alternatives */}
                        {item.alternatives.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                              ALTERNATIVES:
                            </Typography>
                            {item.alternatives.map((alt, idx) => (
                              <Box 
                                key={idx}
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  p: 1,
                                  mb: 0.5,
                                  bgcolor: 'grey.50',
                                  borderRadius: 1,
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'grey.100' },
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {alt.type === 'LOWER_PRICE' && <TrendingDown color="success" fontSize="small" />}
                                  {alt.type === 'FASTER' && <Speed color="primary" fontSize="small" />}
                                  {alt.type === 'SUBSTITUTE' && <SwapHoriz color="info" fontSize="small" />}
                                  <Typography variant="caption">
                                    {alt.description}
                                  </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                  <Typography variant="caption" fontWeight={500}>
                                    ${alt.price.toLocaleString()}
                                  </Typography>
                                  {alt.savings && (
                                    <Typography variant="caption" color="success.main" display="block">
                                      Save ${alt.savings}
                                    </Typography>
                                  )}
                                  {alt.premium && (
                                    <Typography variant="caption" color="warning.main" display="block">
                                      +${alt.premium}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}

          {/* Add Item Button */}
          <Button 
            variant="outlined" 
            startIcon={<Add />}
            fullWidth
            sx={{ mb: 2 }}
          >
            Add Line Item
          </Button>
        </Grid>

        {/* Sidebar - Quote Summary */}
        <Grid item xs={12} md={4}>
          {/* Quote Summary */}
          <Paper sx={{ p: 2, mb: 2, position: 'sticky', top: 16 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Quote Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Totals */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">${quote.totals.subtotal.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Freight</Typography>
                <Typography variant="body2">${quote.totals.freight.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Tax (est)</Typography>
                <Typography variant="body2">${quote.totals.tax.toLocaleString()}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" fontWeight={600}>Total</Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  ${quote.totals.total.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Margin Summary */}
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" color="text.secondary">MARGIN</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip 
                  label={`${quote.margin.totalPercent}%`}
                  color={getMarginColor(quote.margin.category)}
                />
                <Typography variant="body1" fontWeight={500}>
                  ${quote.margin.totalDollars.toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="caption" color={quote.margin.vsTarget < 0 ? 'warning.main' : 'success.main'}>
                {quote.margin.vsTarget > 0 ? '+' : ''}{quote.margin.vsTarget}% vs target
              </Typography>
            </Box>

            {/* Validity & Terms */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Valid Until</Typography>
                <Typography variant="body2">{quote.validUntil}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Terms</Typography>
                <Typography variant="body2">{quote.terms}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Ship Via</Typography>
                <Typography variant="body2">{quote.shipVia}</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={quote.status} color="default" />
              <Typography variant="caption" color="text.secondary">
                Version {quote.version}
              </Typography>
            </Box>

            {/* All Items Available */}
            <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircle />}>
              <Typography variant="caption">
                ✓ All items available<br />
                📅 Ships: Feb 5, 2026
              </Typography>
            </Alert>
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="text" size="small" startIcon={<History />}>
                View Quote History
              </Button>
              <Button variant="text" size="small" startIcon={<Inventory />}>
                Check Inventory
              </Button>
              <Button variant="text" size="small" startIcon={<LocalShipping />}>
                Calculate Freight
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Pricing Explanation Dialog */}
      <Dialog open={pricingDialogOpen} onClose={() => setPricingDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedItem && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lightbulb color="primary" />
                Price Explanation
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="h6" gutterBottom>
                {selectedItem.material}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedItem.dimensions} • {selectedItem.quantity} {selectedItem.unit}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Cost Breakdown</Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Material (304L @ $2.35/lb)</TableCell>
                        <TableCell align="right">${selectedItem.costs.material.toLocaleString()}</TableCell>
                        <TableCell align="right">78%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Processing (Shear cut)</TableCell>
                        <TableCell align="right">${selectedItem.costs.processing.toLocaleString()}</TableCell>
                        <TableCell align="right">11%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Packaging & Handling</TableCell>
                        <TableCell align="right">${selectedItem.costs.packaging.toLocaleString()}</TableCell>
                        <TableCell align="right">2%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Freight (Detroit → Chicago)</TableCell>
                        <TableCell align="right">${selectedItem.costs.freight.toLocaleString()}</TableCell>
                        <TableCell align="right">8%</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell><strong>Total Cost</strong></TableCell>
                        <TableCell align="right"><strong>${selectedItem.costs.total.toLocaleString()}</strong></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Margin Analysis</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Target Margin (A-tier)</Typography>
                      <Typography variant="body2" fontWeight={500}>{selectedItem.margin.target}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Recommended Margin</Typography>
                      <Typography variant="body2" fontWeight={500}>{selectedItem.margin.percent}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Margin Dollars</Typography>
                      <Typography variant="body2" fontWeight={500}>${selectedItem.margin.dollars}</Typography>
                    </Box>
                  </Box>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="caption">
                      <strong>Why this price?</strong><br />
                      ✓ Customer tier A pricing applied (-5% from list)<br />
                      ✓ Standard 304L market competitive<br />
                      ✓ Current inventory cost (lower than replacement)<br />
                      ⚠ Below target margin - high volume customer justifies
                    </Typography>
                  </Alert>

                  <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">CONFIDENCE</Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {selectedItem.insights.confidence}%
                    </Typography>
                    <Typography variant="caption">
                      Based on {selectedItem.insights.basedOn}, {selectedItem.insights.winRate}% win rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>Adjust Price</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Quoted Price"
                  defaultValue={selectedItem.pricing.quotedPrice}
                  size="small"
                  type="number"
                  sx={{ width: 150 }}
                />
                <Typography variant="body2" color="text.secondary">
                  New Margin: <strong>14%</strong> ($514)
                </Typography>
                {selectedItem.margin.percent < selectedItem.margin.floor && (
                  <Chip label="Below Floor - Approval Required" color="error" size="small" />
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPricingDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={() => setPricingDialogOpen(false)}>
                Apply Price
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Send Quote Dialog */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Quote</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Quote {quote.id} will be sent to:
          </Typography>
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="body1" fontWeight={500}>{quote.customer.name}</Typography>
            <Typography variant="body2">{quote.customer.contact}</Typography>
            <Typography variant="body2" color="primary.main">{quote.customer.email}</Typography>
          </Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Delivery Method</InputLabel>
            <Select defaultValue="email" label="Delivery Method">
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="portal">Customer Portal</MenuItem>
              <MenuItem value="both">Email + Portal</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Message (optional)"
            multiline
            rows={3}
            fullWidth
            placeholder="Add a personal message..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Send />} onClick={() => setSendDialogOpen(false)}>
            Send Quote
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Request Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Approval color="warning" />
            Request Margin Approval
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Quote margin ({quote.margin.totalPercent}%) is below target ({22}%).
              Manager approval is required before sending.
            </Typography>
          </Alert>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Approver</InputLabel>
            <Select defaultValue="" label="Approver">
              <MenuItem value="manager1">Sarah Wilson (Sales Manager)</MenuItem>
              <MenuItem value="manager2">John Davis (Branch Manager)</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Justification"
            multiline
            rows={3}
            fullWidth
            required
            placeholder="Explain why this margin is acceptable..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => setApprovalDialogOpen(false)}>
            Request Approval
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuoteBuilder;
