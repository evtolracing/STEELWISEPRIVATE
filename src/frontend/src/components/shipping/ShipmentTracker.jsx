/**
 * ShipmentTracker.jsx — Visual tracker showing all split shipments for an order.
 *
 * Shows each split as a card with:
 *   - Status chip + progress
 *   - Package list with pieces / weight
 *   - Lines included
 *   - Carrier + tracking + BOL
 *   - Drop tags generated
 */
import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  IconButton,
  Collapse,
  Tooltip,
  LinearProgress,
  alpha,
} from '@mui/material'
import {
  LocalShipping as ShipIcon,
  Inventory as PkgIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Label as TagIcon,
  Description as DocIcon,
  CheckCircle as DeliveredIcon,
  Schedule as PendingIcon,
  FlightTakeoff as InTransitIcon,
  CallSplit as SplitIcon,
  Warning as ExceptionIcon,
} from '@mui/icons-material'
import { SPLIT_SHIPMENT_STATUS } from '../../services/splitShipmentApi'

const STATUS_CONFIG = {
  [SPLIT_SHIPMENT_STATUS.DRAFT]:      { label: 'Draft',       color: 'default',  icon: PendingIcon },
  [SPLIT_SHIPMENT_STATUS.READY]:      { label: 'Ready',       color: 'warning',  icon: PkgIcon },
  [SPLIT_SHIPMENT_STATUS.PACKED]:     { label: 'Packed',      color: 'info',     icon: PkgIcon },
  [SPLIT_SHIPMENT_STATUS.SHIPPED]:    { label: 'Shipped',     color: 'primary',  icon: ShipIcon },
  [SPLIT_SHIPMENT_STATUS.IN_TRANSIT]: { label: 'In Transit',  color: 'info',     icon: InTransitIcon },
  [SPLIT_SHIPMENT_STATUS.DELIVERED]:  { label: 'Delivered',   color: 'success',  icon: DeliveredIcon },
  [SPLIT_SHIPMENT_STATUS.EXCEPTION]:  { label: 'Exception',   color: 'error',    icon: ExceptionIcon },
}

const formatWeight = (lbs) => {
  if (!lbs) return '0 lbs'
  return lbs >= 1000 ? `${(lbs / 1000).toFixed(1)}k lbs` : `${lbs} lbs`
}

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function SplitCard({ split, index }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[split.status] || STATUS_CONFIG.DRAFT
  const StatusIcon = cfg.icon

  const isTerminal = ['DELIVERED', 'EXCEPTION'].includes(split.status)
  const progressMap = { DRAFT: 10, READY: 25, PACKED: 40, SHIPPED: 60, IN_TRANSIT: 80, DELIVERED: 100, EXCEPTION: 80 }
  const progress = progressMap[split.status] || 0

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: isTerminal && split.status === 'DELIVERED' ? 'success.main' : 'divider',
        borderWidth: isTerminal ? 2 : 1,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: alpha(cfg.color === 'default' ? '#9e9e9e' : cfg.color === 'warning' ? '#ed6c02' : cfg.color === 'info' ? '#0288d1' : cfg.color === 'primary' ? '#1976d2' : cfg.color === 'success' ? '#2e7d32' : '#d32f2f', 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SplitIcon fontSize="small" sx={{ color: cfg.color === 'default' ? 'text.secondary' : `${cfg.color}.main` }} />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" fontWeight={700}>
              Split #{split.splitIndex || index + 1}
            </Typography>
            <Chip label={cfg.label} size="small" color={cfg.color} icon={<StatusIcon sx={{ fontSize: 14 }} />} />
            {split.bolNumber && (
              <Chip label={split.bolNumber} size="small" variant="outlined" />
            )}
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 0.25 }}>
            <Typography variant="caption" color="text.secondary">
              {split.totalPieces} pcs • {formatWeight(split.totalWeight)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {split.packages?.length || 0} pkg
            </Typography>
            {split.carrier && (
              <Typography variant="caption" color="text.secondary">
                via {split.carrier}
              </Typography>
            )}
          </Stack>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            width: 60,
            height: 6,
            borderRadius: 3,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: progress >= 100 ? 'success.main' : progress >= 50 ? 'primary.main' : 'warning.main',
            },
          }}
        />

        <IconButton size="small">
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      </Box>

      {/* Expanded details */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 2 }}>
          {/* Lines */}
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            LINES INCLUDED
          </Typography>
          {split.lines?.map((sl, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 0.5,
                borderBottom: i < split.lines.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2">
                Line #{sl.lineNumber} — {sl.material}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {sl.qtyInShipment} pcs / {formatWeight(sl.weightInShipment)}
              </Typography>
            </Box>
          ))}

          <Divider sx={{ my: 1.5 }} />

          {/* Packages */}
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            PACKAGES
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {split.packages?.map((pkg) => (
              <Chip
                key={pkg.id}
                icon={<PkgIcon />}
                label={`${pkg.skidNumber} — ${pkg.pieces} pcs / ${formatWeight(pkg.weight)}`}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>

          {/* Drop Tags */}
          {split.dropTags?.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                DROP TAGS
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {split.dropTags.map((dt) => (
                  <Chip key={dt} icon={<TagIcon />} label={dt} size="small" color="secondary" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}

          {/* Documents */}
          {split.documents?.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                DOCUMENTS
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {split.documents.map((doc) => (
                  <Chip key={doc} icon={<DocIcon />} label={doc.replace(/_/g, ' ')} size="small" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}

          {/* Dates */}
          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">Created</Typography>
              <Typography variant="body2">{formatDate(split.createdAt)}</Typography>
            </Box>
            {split.shippedAt && (
              <Box>
                <Typography variant="caption" color="text.secondary">Shipped</Typography>
                <Typography variant="body2">{formatDate(split.shippedAt)}</Typography>
              </Box>
            )}
            {split.deliveredAt && (
              <Box>
                <Typography variant="caption" color="text.secondary">Delivered</Typography>
                <Typography variant="body2">{formatDate(split.deliveredAt)}</Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  )
}

/**
 * @param {object}   props
 * @param {object[]} props.splits         — Array of split shipment objects
 * @param {boolean}  [props.loading]
 * @param {string}   [props.title]
 * @param {boolean}  [props.compact]      — Smaller variant
 */
export default function ShipmentTracker({ splits = [], loading, title, compact }) {
  if (loading) {
    return (
      <Box sx={{ py: 2 }}>
        <LinearProgress />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Loading shipments…
        </Typography>
      </Box>
    )
  }

  if (!splits.length) {
    return null
  }

  return (
    <Box>
      {title && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <ShipIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          <Chip label={`${splits.length} shipment${splits.length !== 1 ? 's' : ''}`} size="small" />
        </Stack>
      )}

      <Stack spacing={compact ? 1 : 1.5}>
        {splits.map((split, idx) => (
          <SplitCard key={split.id} split={split} index={idx} />
        ))}
      </Stack>
    </Box>
  )
}
