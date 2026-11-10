import { useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useAuth } from '../../hooks/useAuth'

const EMPTY = { current: '', next: '', confirm: '' }

export default function ChangePasswordDialog({ open, onClose }) {
  const { changePassword } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const close = () => {
    setForm(EMPTY)
    setError(null)
    setDone(false)
    onClose()
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.next.length < 8) return setError('The new password must be at least 8 characters.')
    if (form.next !== form.confirm) return setError('The new passwords do not match.')

    setSaving(true)
    const result = await changePassword(form.current, form.next)
    setSaving(false)
    if (result.success) {
      setDone(true)
      setForm(EMPTY)
    } else {
      setError(result.error)
    }
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
      <form onSubmit={submit}>
        <DialogTitle>Change password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {done && <Alert severity="success">Your password has been changed.</Alert>}
            <TextField
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={form.current}
              onChange={update('current')}
              required
              fullWidth
            />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              helperText="At least 8 characters"
              value={form.next}
              onChange={update('next')}
              required
              fullWidth
            />
            <TextField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={update('confirm')}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{done ? 'Close' : 'Cancel'}</Button>
          {!done && (
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : 'Change password'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  )
}
