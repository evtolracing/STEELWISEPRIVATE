import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  InputBase,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import HeaderAIAssistant from './HeaderAIAssistant'
import CutoffClockChip from './CutoffClockChip'

export default function TopBar({ drawerWidth, onMenuClick }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [notificationAnchor, setNotificationAnchor] = useState(null)

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchor(null)
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
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Search */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.default',
            borderRadius: 1,
            px: 2,
            py: 0.5,
            flex: 1,
            maxWidth: 400,
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            placeholder="Search heats, units, orders..."
            sx={{ flex: 1, fontSize: '0.875rem' }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              bgcolor: 'background.paper',
              px: 1,
              py: 0.25,
              borderRadius: 0.5,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            ⌘K
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Cutoff Clock */}
        <Box sx={{ mr: 1 }}>
          <CutoffClockChip />
        </Box>

        {/* AI Assistant */}
        <HeaderAIAssistant />

        {/* Help */}
        <IconButton color="inherit" sx={{ mr: 1 }}>
          <HelpIcon />
        </IconButton>

        {/* Notifications */}
        <IconButton color="inherit" onClick={handleNotificationClick} sx={{ mr: 1 }}>
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* Profile */}
        <IconButton onClick={handleProfileClick} sx={{ p: 0 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <Typography variant="caption">JD</Typography>
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
          <MenuItem onClick={handleProfileClose}>Profile</MenuItem>
          <MenuItem onClick={handleProfileClose}>Settings</MenuItem>
          <Divider />
          <MenuItem onClick={handleProfileClose}>Logout</MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Notifications
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleNotificationClose}>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                QC Hold: Coil #C-2024-0012
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Surface defect detected - 5 min ago
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleNotificationClose}>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Shipment Dispatched
              </Typography>
              <Typography variant="caption" color="text.secondary">
                SH-2024-0045 en route - 1 hour ago
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleNotificationClose}>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Work Order Complete
              </Typography>
              <Typography variant="caption" color="text.secondary">
                WO-2024-0089 finished - 2 hours ago
              </Typography>
            </Box>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
