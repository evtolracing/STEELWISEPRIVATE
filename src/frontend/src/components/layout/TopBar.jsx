import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemText,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Help as HelpIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import ChangePasswordDialog from './ChangePasswordDialog'
import HeaderAIAssistant from './HeaderAIAssistant'
import CutoffClockChip from './CutoffClockChip'
import GlobalSearch from './GlobalSearch'
import ViewControls from './ViewControls'

export default function TopBar({ drawerWidth, onMenuClick }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const { user, realRole, previewRole, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.email || ''
  const initials = (displayName.match(/\b\w/g) || ['?']).slice(0, 2).join('').toUpperCase()

  const handleLogout = () => {
    setAnchorEl(null)
    logout()
    navigate('/login', { replace: true })
  }

  const handleChangePassword = () => {
    setAnchorEl(null)
    setPasswordOpen(true)
  }

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileClose = () => {
    setAnchorEl(null)
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          aria-label="Open the menu"
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Search: pages and records. */}
        <GlobalSearch />

        <Box sx={{ flex: 1 }} />

        {/* Branch, and for an administrator the role to preview */}
        <ViewControls />

        {/* Cutoff Clock */}
        <Box sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
          <CutoffClockChip />
        </Box>

        {/* AI Assistant */}
        <HeaderAIAssistant />

        {/* Help */}
        <Tooltip title="Instruction manual">
          <IconButton color="inherit" sx={{ mr: 1 }} component={RouterLink} to="/help/manual" aria-label="Instruction manual">
            <HelpIcon />
          </IconButton>
        </Tooltip>

        {/* Profile */}
        <IconButton onClick={handleProfileClick} sx={{ p: 0 }} aria-label={`Account menu for ${displayName || 'this user'}`} aria-haspopup="menu" aria-expanded={Boolean(anchorEl)}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <Typography variant="caption">{initials}</Typography>
          </Avatar>
        </IconButton>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem disabled sx={{ opacity: '1 !important' }}>
            <ListItemText primary={displayName} secondary={`${(realRole || '').replace(/_/g, ' ')}${previewRole ? ` (viewing as ${previewRole.replace(/_/g, ' ')})` : ''}`} />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleChangePassword}>Change password</MenuItem>
          <MenuItem onClick={handleLogout}>Log out</MenuItem>
        </Menu>

        <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      </Toolbar>
    </AppBar>
  )
}
