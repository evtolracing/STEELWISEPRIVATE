/**
 * MyOrderDetailPage — Order detail with status timeline, line items, documents.
 *
 * Route: /shop/orders/:id
 */
import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Container, Paper, Grid, Button, Chip, Divider,
  Breadcrumbs, Link as MuiLink, Table, TableHead, TableBody, TableRow,
  TableCell, CircularProgress, Alert, IconButton, Tooltip, Skeleton,
} from '@mui/material'
import {
  ArrowBack, Download, Print, ContentCopy, LocalShipping,
  Receipt, Description, Inventory,
} from '@mui/icons-material'
import { useParams, useNavigate, Link } from 'react-router-dom'

import OrderStatusTimeline from '../../components/ecommerce/OrderStatusTimeline'
import { getMyOrderById, getMyOrderDocuments } from '../../services/customerOrdersApi'

const SOURCE_COLOR = { CONTRACT: 'success', RETAIL: 'primary', REMNANT: 'warning', REVIEW_REQUIRED: 'error' }
const DOC_ICON = { PACKING_LIST: Receipt, MTR: Description, INVOICE: Receipt, BOL: LocalShipping }

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MyOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getMyOrderById(id),
      getMyOrderDocuments(id),
    ]).then(([oRes, dRes]) => {
      setOrder(oRes.data || null)
      setDocuments(dRes.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton height={40} width={300} />
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={8}><Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} /></Grid>
          <Grid item xs={12} md={4}><Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} /></Grid>
        </Grid>
      </Container>
    )
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">Order not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/shop/orders')} sx={{ mt: 2 }}>Back to Orders</Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/shop" underline="hover" color="inherit">Shop</MuiLink>
        <MuiLink component={Link} to="/shop/orders" underline="hover" color="inherit">My Orders</MuiLink>
        <Typography color="text.primary">{order.orderNumber}</Typography>
      </Breadcrumbs>

      <Button startIcon={<ArrowBack />} size="small" onClick={() => navigate('/shop/orders')} sx={{ mb: 2 }}>
        Back to Orders
      </Button>

      {/* Header */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{order.orderNumber}</Typography>
            <Typography variant="body2" color="text.secondary">Placed {fmtDate(order.createdAt)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip label={order.status?.replace(/_/g, ' ')} color={order.status === 'SHIPPED' || order.status === 'COMPLETED' ? 'success' : 'info'} />
            <Chip label={order.source || 'ONLINE'} variant="outlined" size="small" />
            {order.quoteRequested && <Chip label="Quote Request" color="warning" size="small" />}
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
            <Tooltip title="Print"><IconButton size="small"><Print /></IconButton></Tooltip>
            <Tooltip title="Copy Order #"><IconButton size="small" onClick={() => navigator.clipboard?.writeText(order.orderNumber)}><ContentCopy /></IconButton></Tooltip>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">PO Number</Typography>
            <Typography variant="body2" fontWeight={500}>{order.poNumber || '—'}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Location</Typography>
            <Typography variant="body2" fontWeight={500}>{order.locationName || order.locationId || '—'}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Delivery</Typography>
            <Typography variant="body2" fontWeight={500}>{order.deliveryMethod || 'DELIVERY'}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Payment</Typography>
            <Typography variant="body2" fontWeight={500}>{order.paymentMethod || 'ACCOUNT_TERMS'}</Typography>
          </Grid>
        </Grid>

        {order.trackingNumber && (
          <Alert severity="info" icon={<LocalShipping />} sx={{ mt: 1.5 }}>
            Tracking: <b>{order.trackingNumber}</b> via {order.carrier || 'carrier'}
          </Alert>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Left — Lines + Docs */}
        <Grid item xs={12} md={8}>
          {/* Line items */}
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Inventory fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>Line Items ({order.lines?.length || 0})</Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Unit Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.lines?.map((line, idx) => (
                  <TableRow key={line.id || idx} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{line.productName || line.name}</Typography>
                      {line.priceSource && (
                        <Chip label={line.priceSource} size="small" color={SOURCE_COLOR[line.priceSource] || 'default'}
                          sx={{ height: 16, fontSize: '0.6rem', mt: 0.3 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {line.form && <Typography variant="caption" display="block">{line.form} {line.grade || ''}</Typography>}
                      {line.dimensions && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {line.dimensions.thickness}" × {line.dimensions.width || '—'}" × {line.dimensions.length || '—'}"
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">{line.quantity}</TableCell>
                    <TableCell align="right">${line.unitPrice?.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        ${(line.extended || (line.unitPrice * line.quantity)).toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <Divider />
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.3 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">${order.subtotal?.toFixed(2)}</Typography>
              </Box>
              {order.taxAmount > 0 && (
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Typography variant="body2" color="text.secondary">Tax</Typography>
                  <Typography variant="body2">${order.taxAmount?.toFixed(2)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 4, pt: 0.5, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main">${order.total?.toFixed(2)}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Documents */}
          {documents.length > 0 && (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>Documents ({documents.length})</Typography>
              </Box>
              <Table size="small">
                <TableBody>
                  {documents.map(doc => {
                    const Icon = DOC_ICON[doc.type] || Description
                    return (
                      <TableRow key={doc.id} hover>
                        <TableCell><Icon fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />{doc.name}</TableCell>
                        <TableCell><Chip label={doc.type} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /></TableCell>
                        <TableCell align="right">
                          <Tooltip title="Download">
                            <IconButton size="small" color="primary"><Download fontSize="small" /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Grid>

        {/* Right — Timeline */}
        <Grid item xs={12} md={4}>
          <OrderStatusTimeline
            currentStatus={order.status}
            statusHistory={order.statusHistory || []}
          />

          {order.notes && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Order Notes</Typography>
              <Typography variant="body2" color="text.secondary">{order.notes}</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  )
}
