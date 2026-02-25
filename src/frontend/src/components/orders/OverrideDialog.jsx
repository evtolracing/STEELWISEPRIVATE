/**
 * OverrideDialog.jsx — CSR Override confirmation dialog.
 *
 * Shows warning context, requires a reason code + notes, and calls
 * overrideApi.createOverride() on confirm.
 */
import React, { useState, useMemo } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Typography, Box, Chip, Alert, CircularProgress, Divider,
  FormHelperText,
} from '@mui/material'
import {
  Warning   as WarningIcon,
  Gavel     as GavelIcon,
  Schedule  as ScheduleIcon,
  TrendingDown as PricingIcon,
  Memory    as CapacityIcon,
} from '@mui/icons-material'
import {
  OVERRIDE_TYPE, REASON_CODES, OVERRIDE_TYPE_LABELS,
  createOverride, validateOverride,
} from '../../services/overrideApi'

const TYPE_ICONS = {
  [OVERRIDE_TYPE.CUTOFF_VIOLATION]: <ScheduleIcon />,
  [OVERRIDE_TYPE.CAPACITY_WARNING]: <CapacityIcon />,
  [OVERRIDE_TYPE.PRICING_OVERRIDE]: <PricingIcon />,
}

const TYPE_COLORS = {
  [OVERRIDE_TYPE.CUTOFF_VIOLATION]: '#e65100',
  [OVERRIDE_TYPE.CAPACITY_WARNING]: '#f9a825',
  [OVERRIDE_TYPE.PRICING_OVERRIDE]: '#1565c0',
}

export default function OverrideDialog({
  open,
  onClose,
  overrideType,
  orderId,
  orderNumber,
  warningMessage,
  originalValue,
  overrideValue,
  location,
  division,
  customerName,
  onConfirm,
}) {
  const [reasonCode, setReasonCode] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Filtered reasons for the current type
  const reasons = useMemo(() => REASON_CODES[overrideType] || [], [overrideType])

  const resetForm = () => {
    setReasonCode('')
    setNotes('')
    setError(null)
    setSaving(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleConfirm = async () => {
    setError(null)

    const payload = {
      type: overrideType,
      reasonCode,
      notes: notes.trim(),
      orderId,
      orderNumber,
      originalValue,
      overrideValue,
      location,
      division,
      customerName,
    }

    // Local validation first
    const { valid, errors } = validateOverride(payload)
    if (!valid) {
      setError(errors.join(' '))
      return
    }

    setSaving(true)
    try {
      const { data } = await createOverride(payload)
      resetForm()
      if (onConfirm) onConfirm(data)
    } catch (err) {
      setError(err.message || 'Failed to create override')
    } finally {
      setSaving(false)
    }
  }

  const typeLabel = OVERRIDE_TYPE_LABELS[overrideType] || 'Override'
  const typeColor = TYPE_COLORS[overrideType] || '#e65100'

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderTop: `4px solid ${typeColor}` } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: typeColor }}>
          {TYPE_ICONS[overrideType] || <WarningIcon />}
        </Box>
        {typeLabel}
      </DialogTitle>

      <DialogContent dividers>
        {/* Warning context */}
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          {warningMessage || 'A system warning requires your attention before proceeding.'}
        </Alert>

        {/* Context values */}
        {(originalValue || overrideValue) && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            {originalValue && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Current:</strong> {originalValue}
              </Typography>
            )}
            {overrideValue && (
              <Typography variant="body2" color="primary">
                <strong>Override:</strong> {overrideValue}
              </Typography>
            )}
          </Box>
        )}

        {/* Order context chips */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2.5 }}>
          {orderId && <Chip size="small" label={orderNumber || orderId} color="primary" variant="outlined" />}
          {customerName && <Chip size="small" label={customerName} variant="outlined" />}
          {location && <Chip size="small" label={location} variant="outlined" />}
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* Reason Code */}
        <FormControl fullWidth sx={{ mb: 2 }} required error={!!error && !reasonCode}>
          <InputLabel>Reason Code</InputLabel>
          <Select
            value={reasonCode}
            label="Reason Code"
            onChange={e => setReasonCode(e.target.value)}
          >
            {reasons.map(r => (
              <MenuItem key={r.code} value={r.code}>
                {r.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Select the most applicable reason for this override</FormHelperText>
        </FormControl>

        {/* Notes */}
        <TextField
          label="Notes (optional)"
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add context if needed: customer name, urgency, approvals…"
          helperText={notes.length > 0 ? `${notes.length} characters` : 'Optional — add context for audit trail'}
          sx={{ mb: 1 }}
        />

        {/* Error display */}
        {error && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        )}

        {/* Accountability notice */}
        <Alert severity="info" icon={<GavelIcon fontSize="small" />} sx={{ mt: 2 }}>
          <Typography variant="caption">
            This override will be logged with your user ID, timestamp, and reason.
            Managers can review all overrides in the audit trail.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={saving || !reasonCode}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : TYPE_ICONS[overrideType]}
          color="warning"
        >
          {saving ? 'Saving…' : 'Confirm Override'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
