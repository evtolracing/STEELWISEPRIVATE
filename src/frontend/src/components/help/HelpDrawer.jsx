import React from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import HelpAccordion from './HelpAccordion'

/**
 * HelpDrawer — a right-side slide-out panel that shows contextual help
 * for a specific module.
 *
 * Usage in any page:
 *
 *   import HelpDrawer from '../../components/help/HelpDrawer'
 *   import { getModuleById } from '../../help/helpAccess'
 *
 *   const [helpOpen, setHelpOpen] = useState(false)
 *   const helpModule = getModuleById('order-intake')
 *
 *   <Button onClick={() => setHelpOpen(true)}>How-To</Button>
 *   <HelpDrawer
 *     open={helpOpen}
 *     onClose={() => setHelpOpen(false)}
 *     module={helpModule}
 *   />
 *
 * Props:
 *   open     — boolean, controls visibility
 *   onClose  — function, called when drawer should close
 *   module   — a module object from manualContent.js (or null)
 *   defaultExpandedSections — optional array of section ids to auto-expand
 */
export default function HelpDrawer({
  open = false,
  onClose,
  module,
  defaultExpandedSections = [],
}) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  if (!module) return null

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 520,
          maxWidth: '100vw',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookIcon />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
            {module.title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Content */}
      <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
        <HelpAccordion
          module={module}
          defaultExpanded={defaultExpandedSections}
        />
      </Box>
    </Drawer>
  )
}
