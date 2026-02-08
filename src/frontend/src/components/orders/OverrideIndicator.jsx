/**
 * OverrideIndicator.jsx — Shows active overrides on an order.
 *
 * Two modes:
 *   compact  — single badge with count
 *   expanded — coloured chips per override type with tooltips
 */
import React, { useState } from 'react'
import {
  Box, Chip, Tooltip, Badge, IconButton, Popover, Typography,
  List, ListItem, ListItemIcon, ListItemText, Divider, Button,
} from '@mui/material'
import {
  Warning        as WarningIcon,
  Schedule       as ScheduleIcon,
  Memory         as CapacityIcon,
  TrendingDown   as PricingIcon,
  GppMaybe       as OverrideIcon,
  OpenInNew      as OpenIcon,
  CheckCircle    as ActiveIcon,
  Cancel         as RevokedIcon,
} from '@mui/icons-material'
import {
  OVERRIDE_TYPE, OVERRIDE_STATUS, OVERRIDE_TYPE_LABELS,
} from '../../services/overrideApi'

const TYPE_ICONS = {
  [OVERRIDE_TYPE.CUTOFF_VIOLATION]: <ScheduleIcon fontSize="small" />,
  [OVERRIDE_TYPE.CAPACITY_WARNING]: <CapacityIcon fontSize="small" />,
  [OVERRIDE_TYPE.PRICING_OVERRIDE]: <PricingIcon fontSize="small" />,
}

const TYPE_CHIP_COLORS = {
  [OVERRIDE_TYPE.CUTOFF_VIOLATION]: { bgcolor: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80' },
  [OVERRIDE_TYPE.CAPACITY_WARNING]: { bgcolor: '#fffde7', color: '#f57f17', border: '1px solid #fff176' },
  [OVERRIDE_TYPE.PRICING_OVERRIDE]: { bgcolor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9' },
}

const STATUS_ICON = {
  [OVERRIDE_STATUS.ACTIVE]:  <ActiveIcon fontSize="inherit" sx={{ color: 'success.main' }} />,
  [OVERRIDE_STATUS.REVOKED]: <RevokedIcon fontSize="inherit" sx={{ color: 'error.main' }} />,
  [OVERRIDE_STATUS.EXPIRED]: <WarningIcon fontSize="inherit" sx={{ color: 'text.disabled' }} />,
}

/**
 * @param {{ overrides: Array, compact?: boolean, onViewAudit?: Function }} props
 */
export default function OverrideIndicator({ overrides = [], compact = false, onViewAudit }) {
  const [anchorEl, setAnchorEl] = useState(null)

  const active = overrides.filter(o => o.status === OVERRIDE_STATUS.ACTIVE)
  const total  = overrides.length

  if (total === 0) return null

  // ─── Compact mode: badge icon ──────────────────────────────────────

  if (compact) {
    return (
      <>
        <Tooltip title={`${active.length} active override${active.length !== 1 ? 's' : ''}`}>
          <IconButton
            size="small"
            onClick={e => setAnchorEl(e.currentTarget)}
            sx={{ color: active.length > 0 ? '#e65100' : 'text.secondary' }}
          >
            <Badge badgeContent={active.length} color="warning" max={9}>
              <OverrideIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
        <OverridePopover
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          overrides={overrides}
          onViewAudit={onViewAudit}
        />
      </>
    )
  }

  // ─── Expanded mode: chips per type ─────────────────────────────────

  // Group by type
  const grouped = {}
  active.forEach(o => {
    if (!grouped[o.type]) grouped[o.type] = []
    grouped[o.type].push(o)
  })

  return (
    <>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(grouped).map(([type, items]) => {
          const styles = TYPE_CHIP_COLORS[type] || {}
          return (
            <Tooltip
              key={type}
              title={
                <Box>
                  <Typography variant="caption" fontWeight={600}>
                    {OVERRIDE_TYPE_LABELS[type]} ({items.length})
                  </Typography>
                  {items.map(o => (
                    <Typography key={o.id} variant="caption" display="block" sx={{ mt: 0.3 }}>
                      • {o.reasonLabel} — {o.userName}
                    </Typography>
                  ))}
                </Box>
              }
            >
              <Chip
                icon={TYPE_ICONS[type]}
                label={`${OVERRIDE_TYPE_LABELS[type]?.split(' ')[0]} (${items.length})`}
                size="small"
                onClick={e => setAnchorEl(e.currentTarget)}
                sx={{
                  ...styles,
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
          )
        })}
      </Box>
      <OverridePopover
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        overrides={overrides}
        onViewAudit={onViewAudit}
      />
    </>
  )
}

// ─── Popover detail ──────────────────────────────────────────────────────────

function OverridePopover({ anchorEl, onClose, overrides, onViewAudit }) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { maxWidth: 420, maxHeight: 400, p: 0 } }}
    >
      <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <OverrideIcon fontSize="small" color="warning" />
          Override History ({overrides.length})
        </Typography>
      </Box>
      <List dense sx={{ py: 0.5 }}>
        {overrides.map((o, idx) => (
          <React.Fragment key={o.id}>
            <ListItem sx={{ alignItems: 'flex-start', py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                {TYPE_ICONS[o.type] || <WarningIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="body2" fontWeight={600}>{o.reasonLabel}</Typography>
                    {STATUS_ICON[o.status]}
                  </Box>
                }
                secondary={
                  <Box component="span">
                    <Typography variant="caption" display="block" color="text.secondary">
                      {o.userName} · {new Date(o.timestamp).toLocaleString()}
                    </Typography>
                    {o.notes && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.3, fontStyle: 'italic' }}>
                        "{o.notes.length > 80 ? o.notes.slice(0, 80) + '…' : o.notes}"
                      </Typography>
                    )}
                    {o.status === OVERRIDE_STATUS.REVOKED && (
                      <Typography variant="caption" display="block" color="error.main" sx={{ mt: 0.3 }}>
                        Revoked: {o.revokeReason}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
            {idx < overrides.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
      {onViewAudit && (
        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Button
            size="small"
            startIcon={<OpenIcon fontSize="small" />}
            onClick={() => { onViewAudit(); onClose() }}
          >
            View Full Audit Log
          </Button>
        </Box>
      )}
    </Popover>
  )
}
