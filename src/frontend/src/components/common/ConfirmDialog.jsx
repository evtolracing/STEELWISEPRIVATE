import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material'
import { Warning as WarningIcon, Error as ErrorIcon, Info as InfoIcon } from '@mui/icons-material'

const iconMap = {
  warning: { icon: WarningIcon, color: 'warning.main' },
  error: { icon: ErrorIcon, color: 'error.main' },
  danger: { icon: ErrorIcon, color: 'error.main' },
  info: { icon: InfoIcon, color: 'info.main' },
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  variant = 'warning',
  loading = false,
  maxWidth = 'xs',
}) {
  const iconConfig = iconMap[variant] || iconMap.warning
  const IconComponent = iconConfig.icon

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconComponent sx={{ color: iconConfig.color }} />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={handleConfirm} 
          color={confirmColor}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
