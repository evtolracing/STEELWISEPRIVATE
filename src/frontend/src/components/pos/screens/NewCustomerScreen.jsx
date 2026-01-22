/**
 * New Customer Screen
 * 
 * Quick customer creation during POS flow.
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// US States for dropdown
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Customer types
const CUSTOMER_TYPES = [
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'GOVERNMENT', label: 'Government' }
];

// ============================================
// NEW CUSTOMER SCREEN
// ============================================

export function NewCustomerScreen({ screen, onNext, onBack }) {
  const { createCustomer, transition, isLoading } = usePOS();
  
  const [formData, setFormData] = useState({
    // Company Info
    companyName: '',
    accountNumber: '',
    customerType: 'COMMERCIAL',
    taxExempt: false,
    taxExemptNumber: '',
    
    // Contact
    contactName: '',
    phone: '',
    email: '',
    
    // Address
    street1: '',
    street2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    
    // Settings
    paymentTerms: 'NET30',
    creditLimit: '',
    salesRep: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  
  // Update form field
  const handleChange = useCallback((field) => (event) => {
    const value = event.target?.type === 'checkbox' 
      ? event.target.checked 
      : event.target?.value ?? event;
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);
  
  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\-\(\)\s+]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }
    
    if (formData.taxExempt && !formData.taxExemptNumber.trim()) {
      newErrors.taxExemptNumber = 'Tax exempt number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  // Submit form
  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const customerData = {
        name: formData.companyName,
        type: formData.customerType,
        contact: {
          name: formData.contactName,
          phone: formData.phone,
          email: formData.email
        },
        address: {
          street1: formData.street1,
          street2: formData.street2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        billing: {
          paymentTerms: formData.paymentTerms,
          creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
          taxExempt: formData.taxExempt,
          taxExemptNumber: formData.taxExemptNumber
        }
      };
      
      await createCustomer(customerData);
      onNext?.();
    } catch (err) {
      setSubmitError(err.message || 'Failed to create customer');
    }
  }, [formData, validateForm, createCustomer, onNext]);
  
  // Cancel - go back
  const handleCancel = useCallback(async () => {
    try {
      await transition('CANCEL_NEW_CUSTOMER');
      onBack?.();
    } catch (err) {
      console.error(err);
    }
  }, [transition, onBack]);
  
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {screen?.title || 'New Customer'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {screen?.description || 'Enter customer information to create a new account.'}
        </Typography>
      </Box>
      
      {/* Error Alert */}
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}
      
      {/* Form */}
      <Paper sx={{ p: 3 }}>
        {/* Company Information */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon fontSize="small" />
          Company Information
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company Name"
              required
              value={formData.companyName}
              onChange={handleChange('companyName')}
              error={!!errors.companyName}
              helperText={errors.companyName}
              autoFocus
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Account Number"
              value={formData.accountNumber}
              onChange={handleChange('accountNumber')}
              placeholder="Auto-generated"
              disabled
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Customer Type</InputLabel>
              <Select
                value={formData.customerType}
                label="Customer Type"
                onChange={handleChange('customerType')}
              >
                {CUSTOMER_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Contact Information */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon fontSize="small" />
          Contact Information
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Contact Name"
              required
              value={formData.contactName}
              onChange={handleChange('contactName')}
              error={!!errors.contactName}
              helperText={errors.contactName}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Phone"
              required
              value={formData.phone}
              onChange={handleChange('phone')}
              error={!!errors.phone}
              helperText={errors.phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon fontSize="small" color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Address */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationIcon fontSize="small" />
          Address
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={formData.street1}
              onChange={handleChange('street1')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address 2"
              value={formData.street2}
              onChange={handleChange('street2')}
              placeholder="Suite, Building, etc."
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="City"
              required
              value={formData.city}
              onChange={handleChange('city')}
              error={!!errors.city}
              helperText={errors.city}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={US_STATES}
              value={formData.state}
              onChange={(_, value) => handleChange('state')({ target: { value } })}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="State" 
                  required
                  error={!!errors.state}
                  helperText={errors.state}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="ZIP Code"
              required
              value={formData.zipCode}
              onChange={handleChange('zipCode')}
              error={!!errors.zipCode}
              helperText={errors.zipCode}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Tax & Payment */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Tax & Payment Settings
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Payment Terms</InputLabel>
              <Select
                value={formData.paymentTerms}
                label="Payment Terms"
                onChange={handleChange('paymentTerms')}
              >
                <MenuItem value="COD">COD (Cash on Delivery)</MenuItem>
                <MenuItem value="NET15">Net 15</MenuItem>
                <MenuItem value="NET30">Net 30</MenuItem>
                <MenuItem value="NET45">Net 45</MenuItem>
                <MenuItem value="NET60">Net 60</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Credit Limit"
              type="number"
              value={formData.creditLimit}
              onChange={handleChange('creditLimit')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.taxExempt}
                    onChange={handleChange('taxExempt')}
                  />
                }
                label="Tax Exempt"
              />
              {formData.taxExempt && (
                <TextField
                  fullWidth
                  size="small"
                  label="Tax Exempt Number"
                  required
                  value={formData.taxExemptNumber}
                  onChange={handleChange('taxExemptNumber')}
                  error={!!errors.taxExemptNumber}
                  helperText={errors.taxExemptNumber}
                />
              )}
            </Box>
          </Grid>
        </Grid>
        
        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Create Customer & Continue
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default NewCustomerScreen;
