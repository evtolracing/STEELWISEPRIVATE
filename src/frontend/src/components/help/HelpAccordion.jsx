import React from 'react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import BuildIcon from '@mui/icons-material/Build'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

/**
 * Renders a single content block based on its type.
 */
function ContentBlock({ block }) {
  switch (block.type) {
    case 'text':
      return (
        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
          {block.value}
        </Typography>
      )

    case 'heading':
      return (
        <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
          {block.value}
        </Typography>
      )

    case 'steps':
      return (
        <Stepper orientation="vertical" sx={{ mb: 2 }} activeStep={-1}>
          {block.items.map((step, i) => (
            <Step key={i} active expanded>
              <StepLabel
                StepIconProps={{
                  sx: { color: 'primary.main', '&.Mui-active': { color: 'primary.main' } },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {step}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      )

    case 'bullets':
      return (
        <List dense sx={{ mb: 2, pl: 1 }}>
          {block.items.map((item, i) => (
            <ListItem key={i} sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <FiberManualRecordIcon sx={{ fontSize: 8, color: 'text.secondary' }} />
              </ListItemIcon>
              <ListItemText
                primary={item}
                primaryTypographyProps={{ variant: 'body2', lineHeight: 1.6 }}
              />
            </ListItem>
          ))}
        </List>
      )

    case 'tip':
      return (
        <Alert
          severity="info"
          icon={<TipsAndUpdatesIcon />}
          sx={{ mb: 2, '& .MuiAlert-message': { width: '100%' } }}
        >
          <Typography variant="body2">{block.value}</Typography>
        </Alert>
      )

    case 'warning':
      return (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 2, '& .MuiAlert-message': { width: '100%' } }}
        >
          <Typography variant="body2">{block.value}</Typography>
        </Alert>
      )

    case 'table':
      return (
        <Paper variant="outlined" sx={{ mb: 2, overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {block.headers.map((h, i) => (
                  <TableCell key={i} sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {block.rows.map((row, ri) => (
                <TableRow key={ri}>
                  {row.map((cell, ci) => (
                    <TableCell key={ci}>
                      <Typography variant="body2">{cell}</Typography>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )

    case 'do-dont':
      return (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {/* DO column */}
          <Paper
            variant="outlined"
            sx={{ flex: 1, p: 2, borderColor: 'success.light', minWidth: 240 }}
          >
            <Typography variant="subtitle2" sx={{ color: 'success.main', mb: 1, fontWeight: 700 }}>
              ✅ DO
            </Typography>
            <List dense disablePadding>
              {block.dos.map((item, i) => (
                <ListItem key={i} sx={{ py: 0.25, pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
          {/* DON'T column */}
          <Paper
            variant="outlined"
            sx={{ flex: 1, p: 2, borderColor: 'error.light', minWidth: 240 }}
          >
            <Typography variant="subtitle2" sx={{ color: 'error.main', mb: 1, fontWeight: 700 }}>
              ❌ DON'T
            </Typography>
            <List dense disablePadding>
              {block.donts.map((item, i) => (
                <ListItem key={i} sx={{ py: 0.25, pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CancelOutlinedIcon sx={{ fontSize: 18, color: 'error.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )

    case 'troubleshoot':
      return (
        <Box sx={{ mb: 2 }}>
          {block.items.map((item, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{ p: 2, mb: 1.5, borderLeft: '4px solid', borderLeftColor: 'warning.main' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                <ErrorOutlineIcon sx={{ fontSize: 20, color: 'warning.main', mt: 0.2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {item.problem}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pl: 0.5 }}>
                <BuildIcon sx={{ fontSize: 18, color: 'success.main', mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {item.solution}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )

    case 'fields':
      return (
        <Paper variant="outlined" sx={{ mb: 2, overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Field</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100', width: 90 }}>Required</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {block.items.map((f, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.name}</Typography>
                  </TableCell>
                  <TableCell>
                    {f.required ? (
                      <Chip label="Required" size="small" color="error" variant="outlined" />
                    ) : (
                      <Chip label="Optional" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{f.description}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )

    default:
      return null
  }
}

/**
 * HelpAccordion — renders a single module's help content as
 * nested MUI Accordions (one per section).
 *
 * Props:
 *   module          — a module object from manualContent.js
 *   defaultExpanded — section ids to expand by default (array)
 *   highlightQuery  — optional search string to bold-highlight matches
 */
export default function HelpAccordion({
  module,
  defaultExpanded = [],
  highlightQuery = '',
}) {
  if (!module) return null

  return (
    <Box>
      {/* Module header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {module.shortDescription}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
          {module.roles.map((role) => (
            <Chip key={role} label={role} size="small" variant="outlined" sx={{ fontSize: 11 }} />
          ))}
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Section accordions */}
      {module.sections.map((section) => (
        <Accordion
          key={section.id}
          defaultExpanded={defaultExpanded.includes(section.id)}
          disableGutters
          sx={{
            '&:before': { display: 'none' },
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider',
            mb: 1,
            borderRadius: '8px !important',
            overflow: 'hidden',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: 'grey.50',
              '&:hover': { bgcolor: 'grey.100' },
              minHeight: 48,
              '& .MuiAccordionSummary-content': { my: 1 },
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {section.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2, pb: 1 }}>
            {section.blocks.map((block, idx) => (
              <ContentBlock key={idx} block={block} />
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}
