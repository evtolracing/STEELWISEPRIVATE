import React, { useState, useMemo, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link as MuiLink,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PrintIcon from '@mui/icons-material/Print'
import LinkIcon from '@mui/icons-material/Link'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { Link as RouterLink } from 'react-router-dom'

import HelpSearchBar from '../../components/help/HelpSearchBar'
import HelpAccordion from '../../components/help/HelpAccordion'
import manualModules from '../../help/manualContent'
import { searchModules } from '../../help/helpAccess'

// Icon mapping — keeps the content file from importing MUI icons directly
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk'
import StorefrontIcon from '@mui/icons-material/Storefront'
import InboxIcon from '@mui/icons-material/Inbox'
import ScheduleIcon from '@mui/icons-material/Schedule'
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import GavelIcon from '@mui/icons-material/Gavel'
import SettingsIcon from '@mui/icons-material/Settings'
import DashboardIcon from '@mui/icons-material/Dashboard'
import InsightsIcon from '@mui/icons-material/Insights'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import CallReceivedIcon from '@mui/icons-material/CallReceived'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ScienceIcon from '@mui/icons-material/Science'
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter'
import PeopleIcon from '@mui/icons-material/People'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import BadgeIcon from '@mui/icons-material/Badge'
import SchoolIcon from '@mui/icons-material/School'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import BuildIcon from '@mui/icons-material/Build'
import LabelIcon from '@mui/icons-material/Label'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import EventNoteIcon from '@mui/icons-material/EventNote'

const ICON_MAP = {
  PhoneInTalk: PhoneInTalkIcon,
  Storefront: StorefrontIcon,
  Inbox: InboxIcon,
  Schedule: ScheduleIcon,
  PrecisionManufacturing: PrecisionManufacturingIcon,
  Inventory2: Inventory2Icon,
  LocalShipping: LocalShippingIcon,
  AttachMoney: AttachMoneyIcon,
  Gavel: GavelIcon,
  Settings: SettingsIcon,
  Dashboard: DashboardIcon,
  Insights: InsightsIcon,
  ViewKanban: ViewKanbanIcon,
  CallReceived: CallReceivedIcon,
  AccessTime: AccessTimeIcon,
  Science: ScienceIcon,
  BusinessCenter: BusinessCenterIcon,
  People: PeopleIcon,
  RequestQuote: RequestQuoteIcon,
  PhoneAndroid: PhoneAndroidIcon,
  VerifiedUser: VerifiedUserIcon,
  Assessment: AssessmentIcon,
  SupportAgent: SupportAgentIcon,
  Badge: BadgeIcon,
  School: SchoolIcon,
  FactCheck: FactCheckIcon,
  Build: BuildIcon,
  Label: LabelIcon,
  HealthAndSafety: HealthAndSafetyIcon,
  AccountBalance: AccountBalanceIcon,
  AdminPanelSettings: AdminPanelSettingsIcon,
  EventNote: EventNoteIcon,
}

function getIcon(iconName) {
  const Icon = ICON_MAP[iconName]
  return Icon ? <Icon sx={{ fontSize: 22 }} /> : <MenuBookIcon sx={{ fontSize: 22 }} />
}

/**
 * ManualPage — the full /help/manual page.
 *
 * Features:
 *   - Search across all modules
 *   - Quick-filter chips to jump to a module
 *   - All modules as top-level accordions
 *   - Each module expands into section-level sub-accordions
 *   - Copy link, print, and back-to-top buttons
 */
export default function ManualPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [expandedModule, setExpandedModule] = useState(null)
  const topRef = useRef(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Determine which modules to show
  const displayModules = useMemo(() => {
    // If there's a search query, use search
    if (searchQuery.trim().length >= 2) {
      return searchModules(searchQuery)
    }
    // If there's an active filter, show just that module
    if (activeFilter) {
      return manualModules.filter((m) => m.moduleId === activeFilter)
    }
    // Otherwise show all
    return manualModules
  }, [searchQuery, activeFilter])

  const handleModuleAccordionChange = (moduleId) => (_event, isExpanded) => {
    setExpandedModule(isExpanded ? moduleId : null)
  }

  const handleCopyLink = (moduleId) => {
    const url = `${window.location.origin}/help/manual#${moduleId}`
    navigator.clipboard.writeText(url).catch(() => {})
  }

  const handlePrint = () => {
    window.print()
  }

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Auto-expand when filter is active
  const effectiveExpanded = activeFilter || expandedModule

  return (
    <Box ref={topRef} sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/" underline="hover" color="inherit">
          Home
        </MuiLink>
        <Typography color="text.primary">Help Manual</Typography>
      </Breadcrumbs>

      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <MenuBookIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          SteelWise Help Manual
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Step-by-step instructions for every module. Search below or expand a section.
      </Typography>

      {/* Print button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Tooltip title="Print this manual">
          <IconButton onClick={handlePrint} size="small">
            <PrintIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search bar + filter chips */}
      <HelpSearchBar
        query={searchQuery}
        onQueryChange={(q) => {
          setSearchQuery(q)
          if (q.length >= 2) setActiveFilter(null)
        }}
        activeFilter={activeFilter}
        onFilterChange={(f) => {
          setActiveFilter(f)
          setSearchQuery('')
          setExpandedModule(f)
        }}
        resultCount={searchQuery.trim().length >= 2 ? displayModules.length : undefined}
      />

      <Divider sx={{ mb: 3 }} />

      {/* Module accordions */}
      {displayModules.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No matching modules found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try a different search term or clear your filters.
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => {
              setSearchQuery('')
              setActiveFilter(null)
            }}
          >
            Clear Search
          </Button>
        </Paper>
      )}

      {displayModules.map((mod) => (
        <Accordion
          key={mod.moduleId}
          expanded={effectiveExpanded === mod.moduleId}
          onChange={handleModuleAccordionChange(mod.moduleId)}
          disableGutters
          sx={{
            mb: 1.5,
            border: '1px solid',
            borderColor: effectiveExpanded === mod.moduleId ? 'primary.main' : 'divider',
            borderRadius: '12px !important',
            overflow: 'hidden',
            '&:before': { display: 'none' },
            boxShadow: effectiveExpanded === mod.moduleId ? 2 : 0,
            transition: 'all 0.2s',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              px: 2.5,
              py: 0.5,
              '&:hover': { bgcolor: 'action.hover' },
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 1.5,
                my: 1.5,
              },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getIcon(mod.icon)}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {mod.title}
              </Typography>
              {!isMobile && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25, lineHeight: 1.3 }}
                  noWrap
                >
                  {mod.shortDescription}
                </Typography>
              )}
            </Box>
            {/* Badges */}
            {mod.matchingSectionIds && mod.matchingSectionIds.length > 0 && (
              <Chip
                label={`${mod.matchingSectionIds.length} match${mod.matchingSectionIds.length > 1 ? 'es' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: 11, flexShrink: 0 }}
              />
            )}
          </AccordionSummary>

          <AccordionDetails sx={{ px: 2.5, pb: 2 }}>
            {/* Copy link button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Tooltip title="Copy link to this module">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyLink(mod.moduleId)
                  }}
                >
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <HelpAccordion
              module={mod}
              defaultExpanded={mod.matchingSectionIds || []}
            />
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Back to top */}
      {displayModules.length > 3 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="text"
            startIcon={<ArrowUpwardIcon />}
            onClick={scrollToTop}
            size="small"
          >
            Back to Top
          </Button>
        </Box>
      )}
    </Box>
  )
}
