/**
 * SplitShipmentDialog.jsx — "Split for Shipment" action dialog.
 *
 * Lets the user select which order lines (and how many pieces) to include in
 * a new split shipment.  Shows live validation, remaining quantities, and a
 * summary before confirming.
 */
import React, { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  TextField,
  Slider,
  Divider,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Collapse,
  MenuItem,
  alpha,
} from '@mui/material'
import {
  Close as CloseIcon,
  CallSplit as SplitIcon,
  LocalShipping as ShipIcon,
  Inventory as PkgIcon,
  Warning as WarnIcon,
  CheckCircle as OkIcon,
  Scale as WeightIcon,
  Numbers as QtyIcon,
} from '@mui/icons-material'
import { validateSplit, lineShippedPct } from '../../services/splitShipmentApi'

const CARRIERS = [
  'ABC Trucking',
  'Fast Freight',
  'Local Delivery',
  'Customer Pickup',
  'LTL Carrier',
  'FedEx Freight',
  'UPS Freight',
]

const formatWeight = (lbs) => {
  if (!lbs) return '0 lbs'
  return lbs >= 1000 ? `${(lbs / 1000).toFixed(1)}k lbs` : `${lbs} lbs`
}

/**
 * @param {object}   props
 * @param {boolean}  props.open
 * @param {Function} props.onClose
 * @param {object}   props.order          — Order with .lines[]
 * @param {Function} props.onConfirm      — (splitLines[], meta) => void
 * @param {boolean}  [props.creating]     — show spinner
 */
export default function SplitShipmentDialog({ open, onClose, order, onConfirm, creating }) {
  // Per-line qty selections
  const [selections, setSelections] = useState({})
  const [carrier, setCarrier] = useState('')
  const [notes, setNotes] = useState('')
  const [validationResult, setValidationResult] = useState(null)

  // Reset when dialog opens
  useEffect(() => {
    if (open && order?.lines) {
      const init = {}
      order.lines.forEach((l) => {
        init[l.id] = { checked: l.qtyRemaining > 0, qty: l.qtyRemaining > 0 ? l.qtyRemaining : 0 }
      })
      setSelections(init)
      setCarrier('')
      setNotes('')
      setValidationResult(null)
    }
  }, [open, order])

  // Eligible lines (those with remaining qty)
  const eligibleLines = useMemo(
    () => (order?.lines || []).filter((l) => l.qtyRemaining > 0),
    [order]
  )

  // Build splitLines from selections
  const splitLines = useMemo(() => {
    return Object.entries(selections)
      .filter(([, v]) => v.checked && v.qty > 0)
      .map(([lineId, v]) => ({ lineId, qtyToShip: v.qty }))
  }, [selections])

  // Summary stats
  const summary = useMemo(() => {
    let totalPcs = 0
    let totalWeight = 0
    for (const sl of splitLines) {
      const line = order?.lines?.find((l) => l.id === sl.lineId)
      if (line) {
        totalPcs += sl.qtyToShip
        totalWeight += sl.qtyToShip * (line.weightPerUnit || 0)
      }
    }
    return { totalPcs, totalWeight, lineCount: splitLines.length }
  }, [splitLines, order])

  // Live validation
  useEffect(() => {
    if (!order || splitLines.length === 0) {
      setValidationResult(null)
      return
    }
    setValidationResult(validateSplit(order, splitLines))
  }, [order, splitLines])

  const handleToggle = (lineId) => {
    setSelections((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], checked: !prev[lineId]?.checked },
    }))
  }

  const handleQtyChange = (lineId, val) => {
    const line = order?.lines?.find((l) => l.id === lineId)
    const max = line?.qtyRemaining || 0
    const clamped = Math.max(0, Math.min(parseInt(val) || 0, max))
    setSelections((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], qty: clamped },
    }))
  }

  const handleSlider = (lineId, val) => {
    setSelections((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], qty: val },
    }))
  }

  const handleConfirm = () => {
    if (validationResult?.valid && onConfirm) {
      onConfirm(splitLines, { carrier: carrier || undefined, notes: notes || undefined })
    }
  }

  const canConfirm = validationResult?.valid && splitLines.length > 0 && !creating

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SplitIcon color="primary" />
        Split for Shipment
        {order && (
          <Chip label={order.orderNumber} size="small" variant="outlined" sx={{ ml: 1 }} />
        )}
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {creating && <LinearProgress sx={{ mb: 2 }} />}

        {/* Info banner */}
        <Alert severity="info" sx={{ mb: 2 }} icon={<SplitIcon />}>
          Select lines and quantities to ship now. Remaining balance will stay on the order for a
          future shipment.
        </Alert>

        {eligibleLines.length === 0 ? (
          <Alert severity="success" icon={<OkIcon />}>
            All lines on this order are fully shipped — nothing left to split.
          </Alert>
        ) : (
          <>
            {/* Line selection table */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell padding="checkbox" />
                    <TableCell sx={{ fontWeight: 700 }}>Line</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Material</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Ordered</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Shipped</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Remaining</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 200 }}>
                      Qty to Ship
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order?.lines?.map((line) => {
                    const sel = selections[line.id] || { checked: false, qty: 0 }
                    const pct = lineShippedPct(line)
                    const disabled = line.qtyRemaining <= 0

                    return (
                      <TableRow
                        key={line.id}
                        sx={{
                          opacity: disabled ? 0.5 : 1,
                          bgcolor: sel.checked && !disabled ? alpha('#1976d2', 0.04) : 'inherit',
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={sel.checked && !disabled}
                            onChange={() => handleToggle(line.id)}
                            disabled={disabled}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            #{line.lineNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{line.material}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{line.qtyOrdered} {line.uom}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack alignItems="flex-end" spacing={0.25}>
                            <Typography variant="body2">{line.qtyShipped} {line.uom}</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{
                                width: 60,
                                height: 4,
                                borderRadius: 2,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: pct >= 100 ? 'success.main' : pct > 0 ? 'warning.main' : 'grey.400',
                                },
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${line.qtyRemaining} ${line.uom}`}
                            size="small"
                            color={line.qtyRemaining > 0 ? 'warning' : 'success'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {!disabled && sel.checked ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Slider
                                value={sel.qty}
                                onChange={(_, v) => handleSlider(line.id, v)}
                                min={0}
                                max={line.qtyRemaining}
                                step={1}
                                size="small"
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                value={sel.qty}
                                onChange={(e) => handleQtyChange(line.id, e.target.value)}
                                type="number"
                                size="small"
                                inputProps={{ min: 0, max: line.qtyRemaining, style: { textAlign: 'center' } }}
                                sx={{ width: 70 }}
                              />
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              {disabled ? 'Fully shipped' : '—'}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Carrier + notes */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <TextField
                select
                label="Carrier (optional)"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">— Select later —</MenuItem>
                {CARRIERS.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g. Ship remaining after QC release"
              />
            </Stack>

            {/* Validation feedback */}
            <Collapse in={!!validationResult && !validationResult.valid}>
              <Alert severity="error" sx={{ mb: 2 }} icon={<WarnIcon />}>
                {validationResult?.errors?.map((e, i) => (
                  <Typography key={i} variant="body2">• {e}</Typography>
                ))}
              </Alert>
            </Collapse>

            {/* Summary */}
            {splitLines.length > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderColor: validationResult?.valid ? 'success.main' : 'divider',
                  bgcolor: validationResult?.valid ? alpha('#4caf50', 0.04) : 'inherit',
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Split Shipment Summary
                </Typography>
                <Stack direction="row" spacing={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QtyIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Lines</Typography>
                      <Typography variant="body1" fontWeight={600}>{summary.lineCount}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PkgIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Pieces</Typography>
                      <Typography variant="body1" fontWeight={600}>{summary.totalPcs}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WeightIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Weight</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {formatWeight(summary.totalWeight)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShipIcon fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Generates</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {summary.lineCount} pkg + {summary.lineCount} drop tag
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={creating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SplitIcon />}
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          {creating ? 'Creating Split…' : 'Create Split Shipment'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
