/**
 * MobileRepLayout.jsx — Standalone shell for Sales Rep Mobile Mode.
 *
 * No sidebar, no desktop chrome.
 * Bottom navigation bar with large tap targets.
 * Offline indicator banner.
 * Swipe-friendly, 100 vh fullscreen.
 */
import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Chip,
  Badge,
  Slide,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Home as HomeIcon,
  AddCircle as IntakeIcon,
  Search as SearchIcon,
  LocalShipping as PromiseIcon,
  ShoppingCartCheckout as OrderIcon,
  WifiOff as OfflineIcon,
  ArrowBack as BackIcon,
  Person as RepIcon,
} from '@mui/icons-material'

const NAV_ITEMS = [
  { label: 'Home',      path: '/mobile-rep',            icon: <HomeIcon /> },
  { label: 'Intake',    path: '/mobile-rep/intake',     icon: <IntakeIcon /> },
  { label: 'Inventory', path: '/mobile-rep/inventory',  icon: <SearchIcon /> },
  { label: 'Promise',   path: '/mobile-rep/promise',    icon: <PromiseIcon /> },
  { label: 'Place',     path: '/mobile-rep/place-order', icon: <OrderIcon /> },
]

export default function MobileRepLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isTiny = useMediaQuery(theme.breakpoints.down('sm'))

  // ── Online / offline ─────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // ── Active tab ───────────────────────────────────────────────────────
  const activeIdx = NAV_ITEMS.findIndex(n =>
    location.pathname === n.path || (n.path !== '/mobile-rep' && location.pathname.startsWith(n.path)),
  )

  const handleNav = (_e, idx) => {
    navigate(NAV_ITEMS[idx].path)
  }

  const isHome = location.pathname === '/mobile-rep'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ── Top AppBar ─────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          bgcolor: 'primary.main',
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {!isHome && (
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <BackIcon />
            </IconButton>
          )}

          <RepIcon sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant={isTiny ? 'subtitle1' : 'h6'} fontWeight={700} noWrap sx={{ flexGrow: 1 }}>
            Sales Rep&nbsp;
            <Typography component="span" variant="caption" sx={{ opacity: 0.8 }}>
              Mobile
            </Typography>
          </Typography>

          {!isOnline && (
            <Chip
              icon={<OfflineIcon />}
              label="Offline"
              size="small"
              sx={{ bgcolor: 'warning.main', color: '#fff', fontWeight: 600 }}
            />
          )}
        </Toolbar>
      </AppBar>

      {/* ── Offline banner ─────────────────────────────────── */}
      <Slide direction="down" in={!isOnline} mountOnEnter unmountOnExit>
        <Box sx={{
          position: 'fixed',
          top: { xs: 56, sm: 64 },
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar - 1,
          bgcolor: 'warning.dark',
          color: '#fff',
          textAlign: 'center',
          py: 0.5,
          fontSize: 13,
          fontWeight: 600,
        }}>
          You are offline — data may be stale. Orders will queue for sync.
        </Box>
      </Slide>

      {/* ── Main content area ──────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: { xs: '56px', sm: '64px' },
          mb: '72px',  // space for bottom nav
          px: { xs: 1.5, sm: 2 },
          py: 2,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Outlet />
      </Box>

      {/* ── Bottom Navigation ──────────────────────────────── */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <BottomNavigation
          value={activeIdx >= 0 ? activeIdx : 0}
          onChange={handleNav}
          showLabels
          sx={{
            height: 72,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              py: 1,
              '& .MuiSvgIcon-root': { fontSize: 28 },
              '& .MuiBottomNavigationAction-label': {
                fontSize: isTiny ? 10 : 12,
                fontWeight: 600,
                mt: 0.25,
              },
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
          }}
        >
          {NAV_ITEMS.map(n => (
            <BottomNavigationAction
              key={n.path}
              label={n.label}
              icon={n.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
