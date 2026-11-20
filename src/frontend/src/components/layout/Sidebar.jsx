import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Collapse,
  Button,
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
  PlayCircle as DemoPlayIcon,
} from '@mui/icons-material'

import { useDemo } from '../../contexts/DemoContext'
import { useAuth } from '../../hooks/useAuth'
import { canAccessPath } from '../../config/roleAccess'
import { navSections, navItemFor } from '../../config/navigation'

export default function Sidebar({ drawerWidth, mobileOpen, onMobileClose }) {
  const location = useLocation()
  const { isActive, startDemo, stopDemo } = useDemo()
  const { user } = useAuth()
  const role = user?.role

  // Only show the pages this user's role can open.
  const visibleSections = useMemo(
    () => navSections
      .map((section) => ({ ...section, items: section.items.filter((item) => canAccessPath(role, item.path)) }))
      .filter((section) => section.items.length > 0),
    // The permissions too: two custom roles can stand on the same built-in role and open different pages.
    [role, user?.permissions],
  )
  const activePath = navItemFor(location.pathname)?.path
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.email || 'Signed in'
  const initials = displayName.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
  // A previewed custom role goes by its own name.
  const roleLabel = user?.previewLabel || String(role || '').toLowerCase().split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  
  // Initialize all sections as expanded
  const [openSections, setOpenSections] = useState(() => {
    const initial = {}
    navSections.forEach((section) => {
      initial[section.title] = true
    })
    return initial
  })

  const handleToggleSection = (title) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography component="span" variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
            SW
          </Typography>
        </Box>
        <Box>
          <Typography component="span" variant="h6" sx={{ display: 'block', fontWeight: 700, color: 'primary.main' }}>
            SteelWise
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Steel ERP Platform
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Demo Launcher */}
      <Box sx={{ px: 2, py: 1.5 }}>
        {!isActive ? (
          <Button
            fullWidth
            variant="contained"
            startIcon={<DemoPlayIcon />}
            onClick={startDemo}
            sx={{
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%)',
              color: 'white',
              fontWeight: 700,
              py: 1.2,
              borderRadius: 2,
              fontSize: '0.85rem',
              textTransform: 'none',
              letterSpacing: 0.5,
              boxShadow: '0 4px 12px rgba(13, 71, 161, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 50%, #006064 100%)',
                boxShadow: '0 6px 16px rgba(13, 71, 161, 0.6)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            ▶ Start Alro Demo
          </Button>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={stopDemo}
            size="small"
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
          >
            ■ End Demo Mode
          </Button>
        )}
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {visibleSections.map((section) => (
          <Box key={section.title} sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleToggleSection(section.title)}
              aria-expanded={Boolean(openSections[section.title])}
              sx={{
                py: 0.5,
                px: 2,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemText
                primary={section.title}
                primaryTypographyProps={{
                  variant: 'overline',
                  sx: { color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 },
                }}
              />
              {openSections[section.title] ? (
                <ExpandLess sx={{ fontSize: 18, color: 'text.secondary' }} />
              ) : (
                <ExpandMore sx={{ fontSize: 18, color: 'text.secondary' }} />
              )}
            </ListItemButton>
            <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
              <List dense sx={{ px: 1 }}>
                {section.items.map((item) => {
                  const Icon = item.icon
                  // The page whose path is the longest match is the one that is open: "/orders" is not
                  // active on "/orders/invoices", and "/" is active only on the home page.
                  const isActive = activePath === item.path
                  const isHighlight = item.highlight
                  return (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                      <ListItemButton
                        component={NavLink}
                        to={item.path}
                        onClick={mobileOpen ? onMobileClose : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        sx={{
                          borderRadius: 1,
                          bgcolor: isActive 
                            ? 'primary.main' 
                            : isHighlight 
                              ? 'warning.light' 
                              : 'transparent',
                          color: isActive ? 'white' : 'text.primary',
                          border: isHighlight && !isActive ? '2px solid' : 'none',
                          borderColor: isHighlight && !isActive ? 'warning.main' : 'transparent',
                          '&:hover': {
                            bgcolor: isActive ? 'primary.dark' : 'action.hover',
                          },
                          py: 0.75,
                        }}
                      >
                        <ListItemIcon
                          sx={{ color: isActive ? 'white' : isHighlight ? 'warning.dark' : 'text.secondary', minWidth: 36 }}
                        >
                          <Icon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.label} 
                          primaryTypographyProps={{ 
                            fontSize: '0.875rem',
                            fontWeight: isHighlight ? 600 : 400,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            </Collapse>
          </Box>
        ))}
      </Box>

      <Divider />

      {/* User */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar aria-hidden sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', width: 36, height: 36, fontSize: '0.875rem', fontWeight: 600 }}>{initials}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {roleLabel}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Phone and tablet: the menu is a drawer. It exists only while open, holds the keyboard while it is,
          and gives focus back to the menu button when it closes. */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        PaperProps={{ component: 'nav', 'aria-label': 'Main menu' }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        PaperProps={{ component: 'nav', 'aria-label': 'Main menu' }}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}
