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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Avatar,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import {
  LocalShipping,
  Star,
  CheckCircle,
  Warning,
  Schedule,
  AttachMoney,
  Speed,
  VerifiedUser,
  TrendingUp,
  TrendingDown,
  ArrowBack,
  ThumbUp,
  Info,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Mock shipment data
const shipmentData = {
  id: 'SHIP-2026-000425',
  destination: 'AutoMax Manufacturing',
  address: '4500 Industrial Blvd, Chicago, IL 60632',
  packages: [
    { id: 'PKG-2026-000052', weight: 1500, pieces: 24, material: '1018 Steel Bar' },
    { id: 'PKG-2026-000053', weight: 2800, pieces: 15, material: 'Aluminum 6061' },
  ],
  totalWeight: 4300,
  totalPieces: 39,
  promiseDate: '2026-02-06',
  requiresFlatbed: false,
  requiresLiftgate: false,
  origin: 'Detroit Branch',
};

// Mock carrier quotes
const carrierQuotes = [
  {
    id: 'QUOTE-001',
    carrierId: 'FAST',
    carrierName: 'FastFreight Trucking',
    logo: 'FF',
    mode: 'LTL',
    serviceLevel: 'STANDARD',
    transitDays: 2,
    estimatedDelivery: '2026-02-05',
    baseRate: 385.00,
    fuelSurcharge: 58.00,
    accessorials: [],
    totalQuote: 443.00,
    ratePerLb: 0.103,
    // Scoring
    costScore: 92,
    transitScore: 88,
    reliabilityScore: 96,
    overallScore: 92,
    isRecommended: true,
    recommendationReason: 'Lowest cost meeting delivery window with excellent reliability on this lane.',
    // Performance
    onTimeRate: 96,
    damageRate: 0.2,
    avgTransitVariance: 0.1,
  },
  {
    id: 'QUOTE-002',
    carrierId: 'RGNL',
    carrierName: 'Regional Express',
    logo: 'RE',
    mode: 'LTL',
    serviceLevel: 'ECONOMY',
    transitDays: 3,
    estimatedDelivery: '2026-02-06',
    baseRate: 368.00,
    fuelSurcharge: 44.00,
    accessorials: [],
    totalQuote: 412.00,
    ratePerLb: 0.096,
    // Scoring
    costScore: 95,
    transitScore: 70,
    reliabilityScore: 85,
    overallScore: 78,
    isRecommended: false,
    recommendationReason: null,
    // Performance
    onTimeRate: 89,
    damageRate: 0.5,
    avgTransitVariance: 0.4,
    warnings: ['Cuts close to promise date'],
  },
  {
    id: 'QUOTE-003',
    carrierId: 'EXPD',
    carrierName: 'Expedited Logistics',
    logo: 'EL',
    mode: 'DEDICATED',
    serviceLevel: 'EXPEDITED',
    transitDays: 1,
    estimatedDelivery: '2026-02-04',
    baseRate: 625.00,
    fuelSurcharge: 100.00,
    accessorials: [],
    totalQuote: 725.00,
    ratePerLb: 0.169,
    // Scoring
    costScore: 45,
    transitScore: 100,
    reliabilityScore: 92,
    overallScore: 65,
    isRecommended: false,
    recommendationReason: null,
    // Performance
    onTimeRate: 98,
    damageRate: 0.1,
    avgTransitVariance: 0.0,
    warnings: ['63% more expensive than recommended option'],
  },
  {
    id: 'QUOTE-004',
    carrierId: 'STEEL',
    carrierName: 'Steel Haulers Inc',
    logo: 'SH',
    mode: 'LTL',
    serviceLevel: 'STANDARD',
    transitDays: 2,
    estimatedDelivery: '2026-02-05',
    baseRate: 410.00,
    fuelSurcharge: 62.00,
    accessorials: [],
    totalQuote: 472.00,
    ratePerLb: 0.110,
    // Scoring
    costScore: 85,
    transitScore: 88,
    reliabilityScore: 78,
    overallScore: 82,
    isRecommended: false,
    recommendationReason: null,
    // Performance
    onTimeRate: 84,
    damageRate: 0.8,
    avgTransitVariance: 0.3,
  },
];

const FreightComparison = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [sortBy, setSortBy] = useState('best');
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const sortedQuotes = [...carrierQuotes].sort((a, b) => {
    switch (sortBy) {
      case 'best':
        return b.overallScore - a.overallScore;
      case 'price':
        return a.totalQuote - b.totalQuote;
      case 'speed':
        return a.transitDays - b.transitDays;
      case 'reliability':
        return b.reliabilityScore - a.reliabilityScore;
      default:
        return 0;
    }
  });

  const recommendedQuote = carrierQuotes.find(q => q.isRecommended);

  const handleSelectQuote = (quote) => {
    setSelectedQuote(quote);
    if (!quote.isRecommended) {
      setShowOverrideDialog(true);
    } else {
      setShowBookDialog(true);
    }
  };

  const handleBook = () => {
    setShowBookDialog(false);
    setShowOverrideDialog(false);
    alert(`Shipment booked with ${selectedQuote.carrierName}!`);
    navigate('/freight/tracking');
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/freight/planner')}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Freight Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {shipmentData.id} • {shipmentData.destination}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Shipment Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <LocalShipping />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {shipmentData.destination}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {shipmentData.address}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip label={`${shipmentData.packages.length} packages`} size="small" />
                  <Chip label={`${shipmentData.totalWeight.toLocaleString()} lbs`} size="small" />
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Origin</Typography>
                <Typography variant="body2" fontWeight={500}>{shipmentData.origin}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Promise Date</Typography>
                <Typography variant="body2" fontWeight={500}>{shipmentData.promiseDate}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Requirements</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {shipmentData.requiresFlatbed ? 'Flatbed' : 'Standard'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Sort Options */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {carrierQuotes.length} Carrier Quotes
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="best">Best Overall</MenuItem>
            <MenuItem value="price">Lowest Price</MenuItem>
            <MenuItem value="speed">Fastest Delivery</MenuItem>
            <MenuItem value="reliability">Highest Reliability</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Quotes List */}
      <Grid container spacing={2}>
        {sortedQuotes.map((quote, index) => (
          <Grid item xs={12} key={quote.id}>
            <Card 
              sx={{ 
                border: quote.isRecommended ? '2px solid' : '1px solid',
                borderColor: quote.isRecommended ? 'success.main' : 'divider',
              }}
            >
              <CardContent>
                {quote.isRecommended && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Star color="success" />
                    <Typography variant="subtitle2" color="success.main" fontWeight={600}>
                      RECOMMENDED
                    </Typography>
                  </Box>
                )}

                <Grid container spacing={3}>
                  {/* Carrier Info */}
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                        {quote.logo}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {quote.carrierName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip label={quote.mode} size="small" variant="outlined" />
                          <Chip label={quote.serviceLevel} size="small" variant="outlined" />
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Transit & Delivery */}
                  <Grid item xs={12} md={2}>
                    <Typography variant="caption" color="text.secondary">Transit</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {quote.transitDays} day{quote.transitDays > 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Delivers {quote.estimatedDelivery}
                    </Typography>
                  </Grid>

                  {/* Pricing */}
                  <Grid item xs={12} md={2}>
                    <Typography variant="caption" color="text.secondary">Total Cost</Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      ${quote.totalQuote.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ${quote.ratePerLb.toFixed(3)}/lb
                    </Typography>
                  </Grid>

                  {/* Scores */}
                  <Grid item xs={12} md={3}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Performance Scores
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Tooltip title="Cost Score">
                          <Box sx={{ textAlign: 'center' }}>
                            <AttachMoney fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={500}>{quote.costScore}</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={4}>
                        <Tooltip title="Speed Score">
                          <Box sx={{ textAlign: 'center' }}>
                            <Speed fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={500}>{quote.transitScore}</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={4}>
                        <Tooltip title="Reliability Score">
                          <Box sx={{ textAlign: 'center' }}>
                            <VerifiedUser fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={500}>{quote.reliabilityScore}</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption">Overall</Typography>
                        <Typography variant="caption" fontWeight={600}>{quote.overallScore}/100</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={quote.overallScore}
                        color={quote.overallScore >= 80 ? 'success' : quote.overallScore >= 60 ? 'warning' : 'error'}
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                    </Box>
                  </Grid>

                  {/* Action */}
                  <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                      variant={quote.isRecommended ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => handleSelectQuote(quote)}
                    >
                      {quote.isRecommended ? 'Select' : 'Choose'}
                    </Button>
                  </Grid>
                </Grid>

                {/* Warnings */}
                {quote.warnings && quote.warnings.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    {quote.warnings.map((warning, i) => (
                      <Alert key={i} severity="warning" sx={{ py: 0 }}>
                        <Typography variant="caption">{warning}</Typography>
                      </Alert>
                    ))}
                  </Box>
                )}

                {/* Recommendation Reason */}
                {quote.isRecommended && quote.recommendationReason && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>WHY:</strong> {quote.recommendationReason}
                    </Typography>
                  </Alert>
                )}

                {/* Performance Details */}
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">On-Time Delivery</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight={500}>{quote.onTimeRate}%</Typography>
                        {quote.onTimeRate >= 95 ? (
                          <TrendingUp fontSize="small" color="success" />
                        ) : quote.onTimeRate < 90 ? (
                          <TrendingDown fontSize="small" color="error" />
                        ) : null}
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Damage Rate</Typography>
                      <Typography variant="body2" fontWeight={500}>{quote.damageRate}%</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Transit Variance</Typography>
                      <Typography variant="body2" fontWeight={500}>±{quote.avgTransitVariance} days</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Book Confirmation Dialog */}
      <Dialog open={showBookDialog} onClose={() => setShowBookDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Carrier Selection</DialogTitle>
        <DialogContent>
          {selectedQuote && (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={500}>
                  Booking with {selectedQuote.carrierName}
                </Typography>
              </Alert>

              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Service Level</TableCell>
                      <TableCell align="right">{selectedQuote.mode} - {selectedQuote.serviceLevel}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Transit Time</TableCell>
                      <TableCell align="right">{selectedQuote.transitDays} day(s)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Estimated Delivery</TableCell>
                      <TableCell align="right">{selectedQuote.estimatedDelivery}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Base Rate</TableCell>
                      <TableCell align="right">${selectedQuote.baseRate.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fuel Surcharge</TableCell>
                      <TableCell align="right">${selectedQuote.fuelSurcharge.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Total</strong></TableCell>
                      <TableCell align="right"><strong>${selectedQuote.totalQuote.toFixed(2)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBookDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<CheckCircle />}
            onClick={handleBook}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onClose={() => setShowOverrideDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Override Recommended Carrier</DialogTitle>
        <DialogContent>
          {selectedQuote && recommendedQuote && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  You are selecting <strong>{selectedQuote.carrierName}</strong> instead of the 
                  recommended <strong>{recommendedQuote.carrierName}</strong>.
                </Typography>
              </Alert>

              <Typography variant="subtitle2" gutterBottom>Comparison</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Selected</TableCell>
                      <TableCell>Recommended</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Cost</TableCell>
                      <TableCell>${selectedQuote.totalQuote.toFixed(2)}</TableCell>
                      <TableCell>${recommendedQuote.totalQuote.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Transit</TableCell>
                      <TableCell>{selectedQuote.transitDays} day(s)</TableCell>
                      <TableCell>{recommendedQuote.transitDays} day(s)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Score</TableCell>
                      <TableCell>{selectedQuote.overallScore}/100</TableCell>
                      <TableCell>{recommendedQuote.overallScore}/100</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              <TextField
                fullWidth
                label="Reason for Override"
                multiline
                rows={3}
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Please explain why you are selecting a different carrier..."
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  This override will be logged for audit purposes and may require manager approval.
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOverrideDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="warning"
            disabled={!overrideReason}
            onClick={handleBook}
          >
            Confirm Override
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FreightComparison;
