/**
 * Customer Lookup Screen
 * 
 * First screen in POS flow - search and select customer.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// ============================================
// RECENT CUSTOMERS
// ============================================

function RecentCustomers({ onSelect }) {
  // In production, this would come from local storage or API
  const recentCustomers = [
    { id: 'rec-1', name: 'ABC Manufacturing', accountNumber: 'ACC-001', type: 'COMMERCIAL' },
    { id: 'rec-2', name: 'Steel Pro Inc', accountNumber: 'ACC-002', type: 'INDUSTRIAL' },
    { id: 'rec-3', name: 'Quick Fab Shop', accountNumber: 'ACC-003', type: 'COMMERCIAL' }
  ];
  
  if (recentCustomers.length === 0) return null;
  
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HistoryIcon color="action" fontSize="small" />
          <Typography variant="subtitle2" color="text.secondary">
            Recent Customers
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {recentCustomers.map(customer => (
            <Chip
              key={customer.id}
              label={customer.name}
              onClick={() => onSelect(customer)}
              variant="outlined"
              icon={<BusinessIcon />}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

// ============================================
// CUSTOMER SEARCH RESULT
// ============================================

function CustomerSearchResult({ customer, onSelect }) {
  const statusColors = {
    ACTIVE: 'success',
    CREDIT_HOLD: 'warning',
    CASH_ONLY: 'error',
    INACTIVE: 'default'
  };
  
  return (
    <ListItem disablePadding>
      <ListItemButton onClick={() => onSelect(customer)}>
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: 'primary.light' }}>
            <BusinessIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {customer.name}
              {customer.preferred && (
                <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              )}
            </Box>
          }
          secondary={
            <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" component="span">
                Account: {customer.accountNumber} • {customer.type}
              </Typography>
              {customer.address && (
                <Typography variant="caption" component="span" color="text.secondary">
                  {customer.address.city}, {customer.address.state}
                </Typography>
              )}
            </Box>
          }
        />
        <Chip 
          label={customer.status || 'ACTIVE'} 
          size="small"
          color={statusColors[customer.status] || 'default'}
        />
      </ListItemButton>
    </ListItem>
  );
}

// ============================================
// CUSTOMER LOOKUP SCREEN
// ============================================

export function CustomerLookupScreen({ screen, onNext, onBack }) {
  const { 
    searchCustomers, 
    selectCustomer, 
    transition,
    isLoading 
  } = usePOS();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  
  // Search debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setSearching(true);
      setError(null);
      
      try {
        const response = await searchCustomers(query);
        setResults(response.customers || []);
      } catch (err) {
        setError('Failed to search customers');
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, searchCustomers]);
  
  // Handle customer selection
  const handleSelectCustomer = useCallback(async (customer) => {
    try {
      await selectCustomer(customer.id);
      onNext?.();
    } catch (err) {
      setError(err.message || 'Failed to select customer');
    }
  }, [selectCustomer, onNext]);
  
  // Handle new customer
  const handleNewCustomer = useCallback(async () => {
    try {
      await transition('CUSTOMER_NOT_FOUND');
    } catch (err) {
      setError(err.message);
    }
  }, [transition]);
  
  // Handle walk-in (cash sale)
  const handleWalkIn = useCallback(async () => {
    try {
      // Create walk-in customer context
      await selectCustomer('WALK_IN');
      onNext?.();
    } catch (err) {
      setError(err.message || 'Failed to start walk-in sale');
    }
  }, [selectCustomer, onNext]);
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {screen?.title || 'Customer Lookup'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {screen?.description || 'Search for an existing customer or create a new one.'}
        </Typography>
      </Box>
      
      {/* Search Box */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, account number, phone, or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                {searching ? (
                  <CircularProgress size={20} />
                ) : (
                  <IconButton size="small" onClick={() => setQuery('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </InputAdornment>
            )
          }}
        />
        
        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={handleNewCustomer}
          >
            New Customer
          </Button>
          <Button
            variant="text"
            startIcon={<PersonIcon />}
            onClick={handleWalkIn}
          >
            Walk-in Sale
          </Button>
        </Box>
      </Paper>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Recent Customers (when no search) */}
      {!query && (
        <RecentCustomers onSelect={handleSelectCustomer} />
      )}
      
      {/* Search Results */}
      {query && results.length > 0 && (
        <Paper>
          <List>
            {results.map((customer, index) => (
              <React.Fragment key={customer.id}>
                {index > 0 && <Divider />}
                <CustomerSearchResult 
                  customer={customer} 
                  onSelect={handleSelectCustomer} 
                />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      {/* No Results */}
      {query && !searching && results.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No customers found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No results for "{query}"
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleNewCustomer}
          >
            Create New Customer
          </Button>
        </Paper>
      )}
      
      {/* Instructions */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Keyboard Shortcuts:</strong> Press <kbd>Enter</kbd> to search, 
          <kbd>↑</kbd>/<kbd>↓</kbd> to navigate results, 
          <kbd>F2</kbd> for new customer
        </Typography>
      </Box>
    </Box>
  );
}

export default CustomerLookupScreen;
