import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Avatar,
  TextField,
  LinearProgress,
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  RequestQuote as QuoteIcon,
  ShoppingCart as OrderIcon,
  AutoAwesome as AiIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as CompanyIcon,
} from '@mui/icons-material';
import { getRfq } from '../../services/rfqApi';
import { createQuote, acceptQuote } from '../../services/quoteApi';
import { createOrder } from '../../services/orderApi';
import { quoteAssistant } from '../../services/aiOrderHubApi';

const statusColors = {
  NEW: 'info',
  IN_REVIEW: 'warning',
  QUOTED: 'primary',
  ACCEPTED: 'success',
  REJECTED: 'error',
};

export default function RfqDetailPage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Quote creation state
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quotePrices, setQuotePrices] = useState({});

  // AI Assistant state
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  useEffect(() => {
    fetchRfq();
  }, [rfqId]);

  const fetchRfq = async () => {
    setLoading(true);
    try {
      const data = await getRfq(rfqId);
      setRfq(data);
      // Initialize quote prices
      const prices = {};
      data.lines?.forEach((line) => {
        prices[line.id] = { unitPrice: '', quantity: line.quantity };
      });
      setQuotePrices(prices);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAiAssist = async () => {
    setAiLoading(true);
    try {
      const result = await quoteAssistant({ rfqId });
      setAiSuggestions(result);

      // Auto-fill recommended prices
      if (result.recommendedUnitPrices) {
        const newPrices = { ...quotePrices };
        result.recommendedUnitPrices.forEach((rec) => {
          if (rec.rfqLineId && newPrices[rec.rfqLineId]) {
            newPrices[rec.rfqLineId].unitPrice = rec.recommendedPrice;
          }
        });
        setQuotePrices(newPrices);
      }
    } catch (err) {
      console.error('AI assist failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateQuote = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const lines = rfq.lines.map((line) => ({
        rfqLineId: line.id,
        materialCode: line.materialCode,
        description: `${line.grade || ''} ${line.form || ''} ${line.thickness || ''}x${line.width || ''}x${line.length || ''}`,
        quantity: quotePrices[line.id]?.quantity || line.quantity,
        unitPrice: parseFloat(quotePrices[line.id]?.unitPrice) || 0,
      }));

      const quote = await createQuote({
        rfqId: rfq.id,
        contactId: rfq.contactId,
        currency: 'USD',
        lines,
      });

      // Accept quote and create order
      const result = await acceptQuote(quote.id, { locationId: 'LOC-001' });
      navigate(`/orderhub/orders/${result.order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectOrder = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const order = await createOrder({
        contactId: rfq.contactId,
        channel: rfq.channel,
        locationId: 'LOC-001',
        lines: rfq.lines.map((line) => ({
          rfqLineId: line.id,
          materialCode: line.materialCode,
          commodity: line.commodity,
          form: line.form,
          grade: line.grade,
          thickness: line.thickness,
          width: line.width,
          length: line.length,
          quantity: line.quantity,
        })),
      });
      navigate(`/orderhub/orders/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading RFQ...</Typography>
      </Box>
    );
  }

  if (!rfq) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">RFQ not found</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/orderhub')}>
          Back to List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/orderhub')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              RFQ Detail
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {rfq.id}
            </Typography>
          </Box>
          <Chip
            label={rfq.status}
            color={statusColors[rfq.status] || 'default'}
            sx={{ ml: 2 }}
          />
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<QuoteIcon />}
            onClick={() => setShowQuoteForm(!showQuoteForm)}
          >
            {showQuoteForm ? 'Hide Quote Form' : 'Create Quote'}
          </Button>
          <Button
            variant="contained"
            startIcon={<OrderIcon />}
            onClick={handleDirectOrder}
            disabled={actionLoading}
          >
            Create Order
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Contact Info */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title="Contact Information"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CompanyIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Company
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {rfq.contact?.companyName || '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Contact
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {rfq.contact?.contactName || rfq.requestedByName || '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body2">
                        {rfq.contact?.email || rfq.requestedByEmail || '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body2">
                        {rfq.contact?.phone || '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* RFQ Details */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title="RFQ Details"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    Channel
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {rfq.channel}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">{formatDate(rfq.createdAt)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    Requested Due Date
                  </Typography>
                  <Typography variant="body2">{formatDate(rfq.requestedDueDate)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader
              title={`Line Items (${rfq.lines?.length || 0})`}
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Commodity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Form</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Dimensions</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                      {showQuoteForm && (
                        <TableCell sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rfq.lines?.map((line, idx) => (
                      <TableRow key={line.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Chip label={line.commodity} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{line.form || '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {line.grade || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {line.thickness && line.width && line.length
                            ? `${line.thickness}" x ${line.width}" x ${line.length}"`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip label={line.quantity} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{line.notes || '-'}</Typography>
                        </TableCell>
                        {showQuoteForm && (
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={quotePrices[line.id]?.unitPrice || ''}
                              onChange={(e) =>
                                setQuotePrices({
                                  ...quotePrices,
                                  [line.id]: {
                                    ...quotePrices[line.id],
                                    unitPrice: e.target.value,
                                  },
                                })
                              }
                              placeholder="0.00"
                              sx={{ width: 100 }}
                              InputProps={{
                                startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                              }}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {showQuoteForm && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="flex-end" spacing={2}>
                    <Button variant="outlined" onClick={() => setShowQuoteForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleCreateQuote}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Creating...' : 'Create Quote & Order'}
                    </Button>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* AI Assistant Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <AiIcon />
                </Avatar>
              }
              title="AI Quote Assistant"
              subheader="Get pricing suggestions"
              action={
                <IconButton onClick={() => setAiPanelOpen(!aiPanelOpen)}>
                  {aiPanelOpen ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
              }
              sx={{ cursor: 'pointer' }}
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
            />
            <Collapse in={aiPanelOpen}>
              <Divider />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Let AI analyze this RFQ and suggest optimal pricing based on material costs,
                  margins, and market conditions.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  startIcon={<AiIcon />}
                  onClick={handleAiAssist}
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Analyzing...' : 'Get Pricing Suggestions'}
                </Button>

                {aiLoading && <LinearProgress sx={{ mt: 2 }} />}

                {aiSuggestions && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                      Recommendations:
                    </Typography>
                    {aiSuggestions.suggestions?.map((sug, idx) => (
                      <Alert key={idx} severity="info" sx={{ mb: 1, py: 0 }}>
                        <Typography variant="caption">{sug.message}</Typography>
                      </Alert>
                    ))}

                    {aiSuggestions.recommendedUnitPrices?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          Suggested Prices:
                        </Typography>
                        {aiSuggestions.recommendedUnitPrices.map((rec, idx) => (
                          <Paper key={idx} variant="outlined" sx={{ p: 1, mb: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              ${rec.recommendedPrice?.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {rec.reason}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Collapse>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
