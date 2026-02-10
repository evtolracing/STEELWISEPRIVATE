// Orders Page - Master-Detail Split View
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { mockOrders } from '../../mocks/ordersData';
import { listIntakeOrders } from '../../services/intakeOrdersApi';

const statusColors = {
  DRAFT: 'default',
  SUBMITTED: 'primary',
  PENDING: 'primary',
  QUOTED: 'default',
  CONFIRMED: 'info',
  IN_PROGRESS: 'warning',
  SHIPPED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const priorityColors = {
  LOW: 'default',
  NORMAL: 'info',
  HIGH: 'error',
};

function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      setError(null);

      // Fetch real orders from the intake API (backed by Supabase)
      const intakeRes = await listIntakeOrders();
      const intakeOrders = (intakeRes.data || []).map(io => ({
        id: io.id,
        orderNumber: io.orderNumber || 'NEW',
        status: io.status || 'DRAFT',
        priority: io.priority || 'NORMAL',
        customerName: io.customerName || io.customer?.name || 'Walk-In',
        customerContact: io.customerName || '',
        customerPhone: io.customer?.phone || '',
        customerEmail: io.customer?.email || '',
        orderDate: io.createdAt || new Date().toISOString(),
        dueDate: io.requestedDate || new Date().toISOString(),
        poNumber: io.poNumber || '',
        lineItems: (io.lines || []).map((l, i) => ({
          id: l.id || `li-${i}`,
          material: l.description || l.productId || 'Material',
          grade: l.grade || '',
          processingType: (l.processes || []).map(p => p.name || p).join(', ') || 'None',
          thickness: l.thicknessIn || '',
          width: l.widthIn || '',
          length: l.lengthIn || '',
          quantity: l.qty || 1,
          unit: l.uom || 'EA',
          weightLbs: l.weight || 0,
          pricePerLb: l.unitPrice || 0,
          totalPrice: l.extPrice || 0,
        })),
        subtotal: (io.lines || []).reduce((s, l) => s + (l.extPrice || 0), 0),
        processingFees: 0,
        shippingCost: 0,
        tax: 0,
        total: (io.lines || []).reduce((s, l) => s + (l.extPrice || 0), 0),
        notes: io.notes || '',
        source: io.source || 'PHONE',
        location: io.location || '',
        division: io.division || 'METALS',
      }));

      // Fall back to static mocks only if no real orders exist yet
      const allOrders = intakeOrders.length > 0 ? intakeOrders : [...mockOrders];

      setOrders(allOrders);
      if (allOrders.length > 0) {
        setSelectedOrder(allOrders[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Orders</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/orders/intake')}>
            New Order
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadOrders}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* Left: Order List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', overflow: 'auto' }}>
            <List>
              {orders.map((order, index) => (
                <React.Fragment key={order.id}>
                  {index > 0 && <Divider />}
                  <ListItemButton
                    selected={selectedOrder?.id === order.id}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">{order.orderNumber}</Typography>
                          <Chip label={order.status} size="small" color={statusColors[order.status]} />
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                          <Typography variant="body2">{order.customerName}</Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip label={order.priority} size="small" color={priorityColors[order.priority]} variant="outlined" />
                            <Typography variant="caption" color="text.secondary">
                              Due: {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}
                            </Typography>
                          </Stack>
                          <Typography variant="subtitle2" color="primary">
                            ${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Stack>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Right: Order Detail */}
        <Grid item xs={12} md={8}>
          {selectedOrder ? (
            <Paper sx={{ height: '100%', overflow: 'auto', p: 3 }}>
              <Stack spacing={3}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="h6">{selectedOrder.orderNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Order Date: {new Date(selectedOrder.orderDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Chip label={selectedOrder.status} color={statusColors[selectedOrder.status]} />
                    <Chip label={selectedOrder.priority} color={priorityColors[selectedOrder.priority]} variant="outlined" />
                  </Stack>
                </Stack>

                <Divider />

                {/* Customer Info */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Customer Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Company:</Typography>
                      <Typography variant="body1">{selectedOrder.customerName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Contact:</Typography>
                      <Typography variant="body1">{selectedOrder.customerContact}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedOrder.customerPhone}</Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedOrder.customerEmail}</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Line Items */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Line Items</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Material</TableCell>
                          <TableCell>Dimensions</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Weight</TableCell>
                          <TableCell align="right">Price/lb</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.lineItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Typography variant="body2">{item.material}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.grade} • {item.processingType}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {item.thickness}" × {item.width}"{item.length ? ` × ${item.length}"` : ' × Coil'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{item.quantity} {item.unit}</TableCell>
                            <TableCell align="right">{item.weightLbs.toLocaleString()} lbs</TableCell>
                            <TableCell align="right">${item.pricePerLb.toFixed(2)}</TableCell>
                            <TableCell align="right">${item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Divider />

                {/* Totals */}
                <Box>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Subtotal:</Typography>
                      <Typography variant="body2">${selectedOrder.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Processing Fees:</Typography>
                      <Typography variant="body2">${selectedOrder.processingFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Shipping:</Typography>
                      <Typography variant="body2">${selectedOrder.shippingCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Tax:</Typography>
                      <Typography variant="body2">${selectedOrder.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6" color="primary">
                        ${selectedOrder.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>

                {selectedOrder.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                        <Typography variant="body2">{selectedOrder.notes}</Typography>
                      </Paper>
                    </Box>
                  </>
                )}

                <Divider />

                {/* Actions */}
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" startIcon={<PrintIcon />}>
                    Print Order
                  </Button>
                  <Button variant="outlined" startIcon={<EmailIcon />}>
                    Email Customer
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Select an order to view details
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default OrdersPage;
