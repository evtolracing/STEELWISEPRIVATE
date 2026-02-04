import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Autocomplete,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  ListSubheader,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { createUser, updateUser, getUserLocations, getUserDivisions, getRoleCategory } from '../../api/users';

export default function UserFormDialog({ open, onClose, user, roleEnums = [] }) {
  const isEdit = Boolean(user);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'VIEWER',
    title: '',
    phone: '',
    homeLocationId: '',
    locationIds: [],
    divisionIds: [],
    isActive: true,
  });
  
  const [locations, setLocations] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (open) {
      loadOptions();
      if (user) {
        setFormData({
          email: user.email || '',
          password: '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role || 'VIEWER',
          title: user.title || '',
          phone: user.phone || '',
          homeLocationId: user.homeLocationId || '',
          locationIds: user.userLocations?.map(ul => ul.locationId) || [],
          divisionIds: user.userDivisions?.map(ud => ud.divisionId) || [],
          isActive: user.isActive !== false,
        });
      } else {
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'VIEWER',
          title: '',
          phone: '',
          homeLocationId: '',
          locationIds: [],
          divisionIds: [],
          isActive: true,
        });
      }
      setError(null);
    }
  }, [open, user]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [locs, divs] = await Promise.all([
        getUserLocations(),
        getUserDivisions()
      ]);
      setLocations(locs || []);
      setDivisions(divs || []);
    } catch (err) {
      console.error('Failed to load options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }
    if (!isEdit && !formData.password) {
      setError('Password is required for new users');
      return;
    }
    if (!isEdit && formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
      };
      
      // Don't send empty password on edit
      if (isEdit && !payload.password) {
        delete payload.password;
      }

      if (isEdit) {
        await updateUser(user.id, payload);
      } else {
        await createUser(payload);
      }
      
      onClose(true); // Refresh list
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  // Group roles by category
  const groupedRoles = roleEnums.reduce((acc, role) => {
    const category = role.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(role);
    return acc;
  }, {});

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isEdit ? <EditIcon color="primary" /> : <PersonAddIcon color="primary" />}
        {isEdit ? 'Edit User' : 'Add New User'}
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Basic Info */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Basic Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              required
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              required
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              disabled={isEdit}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={isEdit ? 'New Password (leave blank to keep)' : 'Password'}
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              required={!isEdit}
              size="small"
              helperText={!isEdit ? 'Minimum 8 characters' : ''}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={handleChange('title')}
              size="small"
              placeholder="e.g., Operations Manager"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              size="small"
            />
          </Grid>

          {/* Role & Status */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Role & Status
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={handleChange('role')}
                label="Role"
              >
                {Object.entries(groupedRoles).map(([category, roles]) => [
                  <ListSubheader key={category}>{category}</ListSubheader>,
                  ...roles.map(role => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))
                ])}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Category: {getRoleCategory(formData.role)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label={formData.isActive ? 'Active' : 'Inactive'}
            />
          </Grid>

          {/* Location & Division Assignments */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Location & Division Assignments
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Home Location</InputLabel>
              <Select
                value={formData.homeLocationId}
                onChange={handleChange('homeLocationId')}
                label="Home Location"
              >
                <MenuItem value="">None</MenuItem>
                {locations.map(loc => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Autocomplete
              multiple
              size="small"
              options={locations}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={locations.filter(l => formData.locationIds.includes(l.id))}
              onChange={(e, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  locationIds: newValue.map(v => v.id)
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Assigned Locations" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.code}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Autocomplete
              multiple
              size="small"
              options={divisions}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={divisions.filter(d => formData.divisionIds.includes(d.id))}
              onChange={(e, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  divisionIds: newValue.map(v => v.id)
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Assigned Divisions" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.code}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => onClose(false)} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {isEdit ? 'Save Changes' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
