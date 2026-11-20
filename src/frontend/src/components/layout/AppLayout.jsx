import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, Navigate, Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Paper, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useAuth } from '../../hooks/useAuth'
import { canAccessPath, homeFor, roleLabel, workspaceFor } from '../../config/roleAccess'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import PrintQueueDrawer from './PrintQueueDrawer'
import { DemoProvider } from '../../contexts/DemoContext'
import DemoOverlay from '../demo/DemoOverlay'
import { navItemFor } from '../../config/navigation'
import { tokens } from '../../theme'

const DRAWER_WIDTH = tokens.layout.drawerWidth
const PRODUCT = 'SteelWise'

/**
 * Names the page: the browser tab and history say which screen this is (WCAG 2.4.2), and a person
 * using a screen reader hears the new page when the menu takes them to it. The name is the page's own
 * main heading when it has one, and the menu's name for it otherwise.
 */
function usePageName(mainRef) {
  const { pathname } = useLocation()
  const [name, setName] = useState('')
  const last = useRef(null)
  useEffect(() => {
    let stop = false
    const fromMenu = navItemFor(pathname)?.label || ''
    const read = () => {
      if (stop) return
      const h1 = mainRef.current?.querySelector('h1')
      const text = (h1?.textContent || '').trim() || fromMenu
      const title = text ? `${text} · ${PRODUCT}` : PRODUCT
      if (document.title !== title) document.title = title
      setName(text)
    }
    read()
    // The page's heading arrives with its code and sometimes with its data, however long that takes:
    // watch the content and read the heading again whenever it changes.
    let queued = 0
    const watcher = typeof MutationObserver === 'undefined' || !mainRef.current ? null : new MutationObserver(() => { clearTimeout(queued); queued = setTimeout(read, 60) })
    watcher?.observe(mainRef.current, { childList: true, subtree: true, characterData: true })
    // On a move to another page the content, not the menu, is where the keyboard continues from.
    // Only on a move: the first page keeps the browser's own starting point, so the skip link is the first stop.
    const moved = last.current !== null && last.current !== pathname
    last.current = pathname
    if (moved && (!mainRef.current?.contains(document.activeElement) || document.activeElement === document.body)) mainRef.current?.focus({ preventScroll: true })
    mainRef.current?.scrollTo?.({ top: 0 })
    return () => { stop = true; clearTimeout(queued); watcher?.disconnect() }
  }, [pathname, mainRef])
  return name
}

// Shows the page only if the user's role can open it.
// While an administrator previews another role, every page says so and offers the way back.
function PreviewBanner() {
  const { previewRole, previewLabel, realRole, setViewAsRole } = useAuth()
  if (!previewRole) return null
  return (
    <Alert severity="info" variant="filled" sx={{ mb: 2 }} data-testid="preview-banner"
      action={<Button color="inherit" size="small" onClick={() => setViewAsRole('')}>End preview</Button>}>
      Previewing as {previewLabel || roleLabel(previewRole)}: this is the menu, pages and records that role sees. Nothing can be changed while previewing. Your own role is {roleLabel(realRole)}.
    </Alert>
  )
}

function RoleGate() {
  const location = useLocation()
  const { user, viewVersion } = useAuth()
  const role = user?.role
  // Straight after signing in, a person starts at the screen their job uses most.
  const start = workspaceFor(role)
  if (location.pathname === '/' && location.state?.justSignedIn && start !== '/') return <Navigate to={start} replace />
  // A new branch or a role preview loads the page again with the new view.
  if (canAccessPath(role, location.pathname)) return <Outlet key={viewVersion} />
  const home = homeFor(role)
  if (location.pathname === '/' && home !== '/') return <Navigate to={home} replace />
  return (
    <Paper sx={{ p: 4, maxWidth: 520, mx: 'auto', mt: 6, textAlign: 'center' }}>
      <Typography variant="h5" component="h1" gutterBottom>No access</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Your role doesn't include this page. Ask an administrator if you need it.
      </Typography>
      <Button variant="contained" component={RouterLink} to={home}>Go to my home page</Button>
    </Paper>
  )
}

export default function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const mainRef = useRef(null)
  const pageName = usePageName(mainRef)
  // The phone menu never stays open behind a wide screen.
  useEffect(() => { if (!isMobile) setMobileOpen(false) }, [isMobile])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <DemoProvider>
      <a className="skip-link" href="#main-content" onClick={(e) => { e.preventDefault(); mainRef.current?.focus() }}>Skip to the page</a>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Box role="status" aria-live="polite" className="visually-hidden" data-testid="route-announcer">{pageName}</Box>
        <TopBar 
          drawerWidth={DRAWER_WIDTH} 
          onMenuClick={handleDrawerToggle} 
        />
        
        <Sidebar 
          drawerWidth={DRAWER_WIDTH}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <Box
          component="main"
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          sx={{
            flexGrow: 1,
            minWidth: 0,
            outline: 'none',
            p: { xs: 2, md: 3 },
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            mt: 8,
            bgcolor: 'background.default',
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          <PreviewBanner />
          <RoleGate />
        </Box>

        <DemoOverlay />
        <PrintQueueDrawer />
      </Box>
    </DemoProvider>
  )
}
