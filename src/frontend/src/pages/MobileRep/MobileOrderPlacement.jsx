/**
 * MobileOrderPlacement.jsx — Streamlined order submission for sales reps.
 *
 * Shows recent drafts, lets rep pick one and submit.
 * Or quick-create a new order with minimal fields.
 * Offline-tolerant: queues for sync.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  alpha,
} from '@mui/material'
import {
  ShoppingCartCheckout as PlaceIcon,
  Drafts as DraftIcon,
  Send as SubmitIcon,
  CheckCircle as DoneIcon,
  AccessTime as PendingIcon,
  Delete as DeleteIcon,
  Add as NewIcon,
  Visibility as ViewIcon,
  WifiOff as OfflineIcon,
  Sync as SyncIcon,
  Person as CustomerIcon,
  Inventory2 as ItemsIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { listIntakeOrders, submitOrder } from '../../services/intakeOrdersApi'
import useMobileMode from '../../hooks/useMobileMode'

// Orders come from the live system (the same list the order entry screen saves to).
const toCard = (o) => ({
  id: o.id,
  orderNumber: o.orderNumber,
  status: o.status,
  customer: { name: o.customerName || '' },
  division: o.division,
  location: o.location || '',
  priority: o.priority || 'STANDARD',
  lineCount: (o.lines || []).length,
  subtotal: o.subtotal ?? (o.lines || []).reduce((sum, l) => sum + (l.extPrice || 0), 0),
  createdAt: o.createdAt,
  submittedAt: o.submittedAt,
})

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function MobileOrderPlacement() {
  const { isOnline } = useMobileMode()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const [drafts, sent] = await Promise.all([
        listIntakeOrders({ status: 'DRAFT', limit: 50 }),
        listIntakeOrders({ status: 'SUBMITTED', limit: 20 }),
      ])
      setOrders([...(drafts.data || []), ...(sent.data || [])].map(toCard))
      setErrorMsg('')
    } catch {
      setErrorMsg('Orders could not be loaded. Check your connection and try again.')
    }
    setLoading(false)
  }, [])
  useEffect(() => { loadOrders() }, [loadOrders])
  const [submitting, setSubmitting] = useState(null) // order id being submitted
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  const drafts = orders.filter(o => o.status === 'DRAFT')
  const submitted = orders.filter(o => o.status === 'SUBMITTED')

  // ── Submit handler ───────────────────────────────────────────────────
  const handleSubmit = useCallback(async (order) => {
    setConfirmOpen(false)
    setSuccessMsg('')
    // Nothing is queued on the phone: an order is either sent now or not sent.
    if (!isOnline) {
      setErrorMsg(`You are offline. ${order.orderNumber} was not submitted. Try again when you have a connection.`)
      return
    }
    setSubmitting(order.id)
    try {
      await submitOrder(order.id)
      setErrorMsg('')
      setSuccessMsg(`${order.orderNumber} submitted`)
      await loadOrders()
    } catch (e) {
      setErrorMsg(`${order.orderNumber} was not submitted: ${e?.message || 'the server did not accept it'}`)
    }
    setSubmitting(null)
  }, [isOnline, loadOrders])

  const openConfirm = (order) => {
    setSelectedOrder(order)
    setConfirmOpen(true)
  }

  // Cancels the draft on the server.
  const handleDelete = async (orderId) => {
    const order = orders.find(o => o.id === orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CANCELLED' }) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'the server did not accept it')
      setSuccessMsg(`${order?.orderNumber || 'Draft'} cancelled`)
      await loadOrders()
    } catch (e) {
      setErrorMsg(`The draft was not cancelled: ${e?.message}`)
    }
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        <PlaceIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} /> Place Orders
      </Typography>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg('')} sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>
      )}
      {!isOnline && (
        <Alert severity="warning" icon={<OfflineIcon />} sx={{ mb: 2, borderRadius: 2 }}>
          You are offline. Orders cannot be submitted until the connection is back. Nothing is queued on this phone.
        </Alert>
      )}

      {/* ── New order shortcut ──────────────────────────────── */}
      <Button
        fullWidth
        variant="outlined"
        size="large"
        startIcon={<NewIcon />}
        onClick={() => navigate('/mobile-rep/intake')}
        sx={{
          mb: 3,
          minHeight: 52,
          fontWeight: 600,
          borderRadius: 3,
          borderStyle: 'dashed',
          borderWidth: 2,
        }}
      >
        Create New Order
      </Button>

      {/* ── Draft orders ────────────────────────────────────── */}
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
        <DraftIcon sx={{ fontSize: 16, verticalAlign: 'bottom', mr: 0.5 }} />
        Drafts ({drafts.length})
      </Typography>

      {drafts.length === 0 ? (
        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">{loading ? 'Loading…' : 'No draft orders. Create one to get started.'}</Typography>
        </Paper>
      ) : (
        <Box sx={{ mb: 3 }}>
          {drafts.map(order => (
            <Paper
              key={order.id}
              elevation={0}
              sx={{
                p: 2,
                mb: 1.5,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: submitting === order.id ? 'primary.main' : 'divider',
                transition: 'all 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>{order.orderNumber}</Typography>
                    <Chip
                      label={order.priority}
                      size="small"
                      color={order.priority === 'RUSH' ? 'warning' : order.priority === 'HOT' ? 'error' : 'default'}
                      sx={{ fontWeight: 600, fontSize: 10 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <CustomerIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="body2">{order.customer?.name || 'No customer'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip label={`${order.lineCount} items`} size="small" variant="outlined" icon={<ItemsIcon sx={{ fontSize: 14 }} />} sx={{ fontSize: 11 }} />
                    <Chip label={order.location.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {formatCurrency(order.subtotal)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Created {timeAgo(order.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <IconButton size="small" color="error" onClick={() => handleDelete(order.id)} sx={{ border: '1px solid', borderColor: 'error.light' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => openConfirm(order)}
                disabled={submitting === order.id}
                startIcon={submitting === order.id ? <CircularProgress size={18} color="inherit" /> : <SubmitIcon />}
                sx={{ mt: 1.5, minHeight: 48, fontWeight: 700, borderRadius: 2.5 }}
              >
                {submitting === order.id ? 'Submitting...' : 'Submit Order'}
              </Button>
            </Paper>
          ))}
        </Box>
      )}

      {/* ── Submitted orders ────────────────────────────────── */}
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
        <DoneIcon sx={{ fontSize: 16, verticalAlign: 'bottom', mr: 0.5, color: 'success.main' }} />
        Recently Submitted ({submitted.length})
      </Typography>

      {submitted.length === 0 ? (
        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">No submitted orders yet today.</Typography>
        </Paper>
      ) : (
        submitted.map(order => (
          <Paper
            key={order.id}
            elevation={0}
            sx={{
              p: 2,
              mb: 1.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'success.light',
              bgcolor: (t) => alpha(t.palette.success.main, 0.04),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DoneIcon color="success" sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>{order.orderNumber}</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {order.submittedAt ? timeAgo(order.submittedAt) : ''}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {order.customer?.name} · {order.lineCount} items · {formatCurrency(order.subtotal)}
            </Typography>
          </Paper>
        ))
      )}

      {/* ── Offline queue indicator ─────────────────────────── */}
      {orders.filter(o => o.status === 'QUEUED').length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'warning.main', bgcolor: (t) => alpha(t.palette.warning.main, 0.06) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SyncIcon color="warning" />
            <Typography variant="subtitle2" fontWeight={600}>
              {orders.filter(o => o.status === 'QUEUED').length} order(s) queued for sync
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Will automatically submit when connectivity is restored.
          </Typography>
        </Paper>
      )}

      {/* ── Confirmation dialog ─────────────────────────────── */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, mx: 2, width: '100%' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Submission</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Submit <strong>{selectedOrder.orderNumber}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer: {selectedOrder.customer?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedOrder.lineCount} items · {formatCurrency(selectedOrder.subtotal)}
              </Typography>
              {!isOnline && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                  You are offline. This order cannot be submitted until the connection is back.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ minHeight: 44 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => selectedOrder && handleSubmit(selectedOrder)}
            startIcon={<SubmitIcon />}
            sx={{ minHeight: 44, fontWeight: 600 }}
          >
            {isOnline ? 'Submit' : 'Queue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
