import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { VpnKey as VpnKeyIcon } from '@mui/icons-material';
import { resetUserPassword } from '../../api/users';

export default function ResetPasswordDialog({ open, onClose, user }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetUserPassword(user.id, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      console.error('Failed to reset password:', err);
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VpnKeyIcon color="warning" />
        Reset Password
      </DialogTitle>
      
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ my: 2 }}>
            Password has been reset successfully!
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Reset password for <strong>{user.firstName} {user.lastName}</strong> ({user.email})
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                helperText="Minimum 8 characters"
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                error={confirmPassword && newPassword !== confirmPassword}
                helperText={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
              />
            </Box>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && (
          <Button
            variant="contained"
            color="warning"
            onClick={handleReset}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <VpnKeyIcon />}
          >
            Reset Password
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
