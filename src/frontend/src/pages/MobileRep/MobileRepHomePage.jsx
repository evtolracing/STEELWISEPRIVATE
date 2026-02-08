/**
 * MobileRepHomePage.jsx — Sales Rep landing page.
 *
 * Large tap-friendly tiles for each workflow.
 * Quick stats banner. Offline-tolerant.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  Alert,
  alpha,
} from '@mui/material'
import {
  AddCircle as IntakeIcon,
  Search as SearchIcon,
  LocalShipping as PromiseIcon,
  ShoppingCartCheckout as OrderIcon,
  TrendingUp as TrendIcon,
  AccessTime as ClockIcon,
  Inventory2 as InvIcon,
  CheckCircle as DoneIcon,
} from '@mui/icons-material'
import useMobileMode from '../../hooks/useMobileMode'

// ── Quick-stats mock data ──────────────────────────────────────────────────
const MOCK_STATS = {
  ordersToday: 7,
  quotesOpen: 3,
  revenueMTD: 284500,
  avgOrderValue: 6420,
  topProduct: 'HR A36 Plate',
  pendingPromise: 2,
}

const TILES = [
  {
    label: 'New Intake',
    sub: 'Start a new order',
    icon: IntakeIcon,
    color: '#1E3A5F',
    path: '/mobile-rep/intake',
  },
  {
    label: 'Inventory',
    sub: 'Search stock & remnants',
    icon: SearchIcon,
    color: '#2E7D32',
    path: '/mobile-rep/inventory',
  },
  {
    label: 'Promise Check',
    sub: 'Delivery dates & cutoffs',
    icon: PromiseIcon,
    color: '#0288D1',
    path: '/mobile-rep/promise',
  },
  {
    label: 'Place Order',
    sub: 'Submit for processing',
    icon: OrderIcon,
    color: '#FF6B35',
    path: '/mobile-rep/place-order',
  },
]

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function MobileRepHomePage() {
  const navigate = useNavigate()
  const { isOnline, orientation } = useMobileMode()
  const [stats] = useState(MOCK_STATS)

  return (
    <Box>
      {/* ── Greeting ────────────────────────────────────────── */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* ── Quick stats bar ─────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 3,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                <DoneIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.1}>{stats.ordersToday}</Typography>
                <Typography variant="caption" color="text.secondary">Orders Today</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 36, height: 36 }}>
                <TrendIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.1}>{formatCurrency(stats.revenueMTD)}</Typography>
                <Typography variant="caption" color="text.secondary">Revenue MTD</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'info.main', width: 36, height: 36 }}>
                <ClockIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.1}>{stats.quotesOpen}</Typography>
                <Typography variant="caption" color="text.secondary">Open Quotes</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 36, height: 36 }}>
                <InvIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.1}>{formatCurrency(stats.avgOrderValue)}</Typography>
                <Typography variant="caption" color="text.secondary">Avg Order</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Action tiles ────────────────────────────────────── */}
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
        Quick Actions
      </Typography>

      <Grid container spacing={2}>
        {TILES.map(tile => (
          <Grid item xs={6} key={tile.path}>
            <Paper
              elevation={0}
              onClick={() => navigate(tile.path)}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                minHeight: 130,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                '&:active': {
                  transform: 'scale(0.97)',
                  bgcolor: (t) => alpha(tile.color, 0.08),
                },
                '&:hover': {
                  borderColor: tile.color,
                  bgcolor: (t) => alpha(tile.color, 0.04),
                },
              }}
            >
              <Avatar sx={{ bgcolor: tile.color, width: 48, height: 48, mb: 0.5 }}>
                <tile.icon sx={{ fontSize: 26 }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                {tile.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tile.sub}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Offline hint ────────────────────────────────────── */}
      {!isOnline && (
        <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
          You are offline. Recent data is cached. Orders placed now will queue and sync automatically when connectivity returns.
        </Alert>
      )}

      {/* ── Pending promise badge ───────────────────────────── */}
      {stats.pendingPromise > 0 && (
        <Paper
          elevation={0}
          onClick={() => navigate('/mobile-rep/promise')}
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'info.main',
            bgcolor: (t) => alpha(t.palette.info.main, 0.06),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            '&:active': { transform: 'scale(0.98)' },
          }}
        >
          <PromiseIcon color="info" />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {stats.pendingPromise} promise checks pending
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tap to review delivery commitments
            </Typography>
          </Box>
          <Chip label="Review" size="small" color="info" />
        </Paper>
      )}
    </Box>
  )
}
