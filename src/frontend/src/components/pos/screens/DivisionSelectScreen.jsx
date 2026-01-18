/**
 * Division Select Screen
 * 
 * Select division and ship-to for multi-division customers.
 * Implements the division selection logic from design document 42-AI-ORDER-INTAKE-POS.md
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Avatar,
  Alert,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Check as CheckIcon,
  LocalShipping as ShippingIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Work as JobIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// ============================================
// DIVISION CARD
// ============================================

function DivisionCard({ division, selected, onSelect, disabled }) {
  return (
    <Card 
      variant="outlined"
      sx={{ 
        height: '100%',
        borderColor: selected ? 'primary.main' : 'divider',
        borderWidth: selected ? 2 : 1,
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1
      }}
    >
      <CardActionArea 
        onClick={() => !disabled && onSelect(division)}
        disabled={disabled}
        sx={{ height: '100%', p: 2 }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: selected ? 'primary.main' : 'grey.300', width: 40, height: 40 }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {division.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {division.code}
                </Typography>
              </Box>
            </Box>
            
            {selected && (
              <Chip 
                icon={<CheckIcon />}
                label="Selected"
                color="primary"
                size="small"
              />
            )}
          </Box>
          
          {/* Address */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
            <LocationIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
            <Box>
              <Typography variant="body2">
                {division.address?.street1 || division.address?.line1}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {division.address?.city}, {division.address?.state} {division.address?.postalCode || division.address?.zipCode}
              </Typography>
            </Box>
          </Box>
          
          {/* Phone */}
          {division.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {division.phone}
              </Typography>
            </Box>
          )}
          
          {/* Tags */}
          <Box sx={{ display: 'flex', gap: 0.5, mt: 2, flexWrap: 'wrap' }}>
            {division.isPrimary && (
              <Chip label="Primary" size="small" color="success" variant="outlined" />
            )}
            {division.paymentTerms && (
              <Chip label={division.paymentTerms} size="small" variant="outlined" />
            )}
            {division.taxExempt && (
              <Chip label="Tax Exempt" size="small" variant="outlined" />
            )}
            {!division.isActive && (
              <Chip label="Inactive" size="small" color="error" variant="outlined" />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ============================================
// SHIP-TO CARD
// ============================================

function ShipToCard({ shipTo, selected, onSelect }) {
  const address = shipTo.address || shipTo;
  
  return (
    <Card 
      variant="outlined"
      sx={{ 
        borderColor: selected ? 'primary.main' : 'divider',
        borderWidth: selected ? 2 : 1,
        transition: 'all 0.2s ease'
      }}
    >
      <CardActionArea onClick={() => onSelect(shipTo)} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ bgcolor: selected ? 'primary.main' : 'grey.200' }}>
            <ShippingIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {shipTo.name || 'Shipping Address'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {address.line1 || address.street1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {address.city}, {address.state} {address.postalCode || address.zipCode}
            </Typography>
          </Box>
          {selected && <CheckIcon color="primary" />}
          {shipTo.isDefault && (
            <Chip label="Default" size="small" variant="outlined" />
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}

// ============================================
// JOB SELECT LIST
// ============================================

function JobSelectList({ jobs, selectedJob, onSelect }) {
  return (
    <List>
      {jobs.map((job, index) => (
        <React.Fragment key={job.id}>
          {index > 0 && <Divider />}
          <ListItem disablePadding>
            <ListItemButton 
              selected={selectedJob?.id === job.id}
              onClick={() => onSelect(job)}
            >
              <ListItemIcon>
                <JobIcon color={selectedJob?.id === job.id ? 'primary' : 'action'} />
              </ListItemIcon>
              <ListItemText
                primary={job.name}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      Job #: {job.number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.siteAddress?.line1}, {job.siteAddress?.city}, {job.siteAddress?.state}
                    </Typography>
                  </Box>
                }
              />
              {selectedJob?.id === job.id && <CheckIcon color="primary" />}
            </ListItemButton>
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
}

// ============================================
// DIVISION SELECT SCREEN
// ============================================

export function DivisionSelectScreen({ screen, onNext, onBack }) {
  const { 
    customer, 
    division: selectedDivision,
    shipping,
    transition,
    isLoading 
  } = usePOS();
  
  // Local state
  const [step, setStep] = useState(0); // 0 = division, 1 = ship-to
  const [localDivision, setLocalDivision] = useState(selectedDivision);
  const [localShipTo, setLocalShipTo] = useState(shipping?.shipTo || null);
  const [shipTos, setShipTos] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [localJob, setLocalJob] = useState(null);
  const [flowResult, setFlowResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get divisions from customer
  const divisions = customer?.divisions || [];
  
  // Determine flow type on mount
  useEffect(() => {
    const determineFlow = async () => {
      if (!customer) {
        setLoading(false);
        return;
      }
      
      try {
        // Call API to determine division flow
        const response = await fetch(`/api/pos/division-flow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customer.id,
            orderSource: 'POS'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          setFlowResult(result);
          
          // Handle auto-select
          if (result.skipSelection && result.division) {
            setLocalDivision(result.division);
            setLocalShipTo(result.shipTo);
            
            // Auto-proceed if everything is set
            if (result.shipTo) {
              await handleConfirmSelection(result.division, result.shipTo);
              return;
            }
          }
          
          // Set defaults
          if (result.defaultDivision) {
            setLocalDivision(result.defaultDivision);
          }
          if (result.shipToOptions) {
            setShipTos(result.shipToOptions);
          }
          if (result.jobOptions) {
            setJobs(result.jobOptions);
          }
        }
      } catch (err) {
        console.error('Failed to determine division flow:', err);
        // Fallback to local logic
        if (divisions.length === 1) {
          setLocalDivision(divisions[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    determineFlow();
  }, [customer]);
  
  // Fetch ship-tos when division changes
  useEffect(() => {
    const fetchShipTos = async () => {
      if (!localDivision?.id) return;
      
      try {
        const response = await fetch(`/api/pos/divisions/${localDivision.id}/ship-tos?customerId=${customer?.id}`);
        if (response.ok) {
          const data = await response.json();
          setShipTos(data.shipTos || []);
          
          // Auto-select if only one
          if (data.shipTos?.length === 1) {
            setLocalShipTo(data.shipTos[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch ship-tos:', err);
      }
    };
    
    fetchShipTos();
  }, [localDivision?.id, customer?.id]);
  
  // Determine current step based on flow
  const steps = useMemo(() => {
    const result = [];
    
    if (flowResult?.flowType === 'PROMPT_JOB') {
      result.push('Select Job');
    } else if (divisions.length > 1) {
      result.push('Select Division');
    }
    
    if (shipTos.length > 1 || flowResult?.prompt === 'SHIP_TO_ONLY') {
      result.push('Select Ship-To');
    }
    
    return result;
  }, [flowResult, divisions.length, shipTos.length]);
  
  // Handle division selection
  const handleSelectDivision = useCallback((division) => {
    setLocalDivision(division);
    setLocalShipTo(null); // Reset ship-to when division changes
    
    // Move to next step if needed
    if (steps.length > 1) {
      setStep(1);
    }
  }, [steps.length]);
  
  // Handle ship-to selection
  const handleSelectShipTo = useCallback((shipTo) => {
    setLocalShipTo(shipTo);
  }, []);
  
  // Handle job selection
  const handleSelectJob = useCallback((job) => {
    setLocalJob(job);
    setLocalShipTo({
      id: job.id,
      name: job.name,
      address: job.siteAddress
    });
  }, []);
  
  // Confirm selection and proceed
  const handleConfirmSelection = useCallback(async (division = localDivision, shipTo = localShipTo) => {
    if (!division) {
      setError('Please select a division');
      return;
    }
    
    try {
      await transition('SELECT_DIVISION', { 
        divisionId: division.id,
        division,
        shipToId: shipTo?.id,
        shipTo,
        jobId: localJob?.id
      });
      onNext?.();
    } catch (err) {
      console.error('Failed to select division:', err);
      setError(err.message || 'Failed to select division');
    }
  }, [localDivision, localShipTo, localJob, transition, onNext]);
  
  // Handle back in multi-step flow
  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onBack?.();
    }
  }, [step, onBack]);
  
  // Can proceed check
  const canProceed = useMemo(() => {
    if (!localDivision) return false;
    if (steps.length > 1 && step < steps.length - 1) return true; // Can go to next step
    if (shipTos.length > 1 && !localShipTo) return false;
    return true;
  }, [localDivision, localShipTo, steps.length, step, shipTos.length]);
  
  // Show loading
  if (loading || isLoading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading division options...
        </Typography>
      </Box>
    );
  }
  
  // Show message if no customer
  if (!customer) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Alert severity="warning">
          No customer selected. Please go back and select a customer.
        </Alert>
        <Button onClick={onBack} startIcon={<BackIcon />} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }
  
  // Auto-selected and proceeding
  if (flowResult?.skipSelection && localDivision && localShipTo) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Processing...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {screen?.title || 'Select Division & Ship-To'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {screen?.description || `Configure billing and shipping for ${customer.name}`}
        </Typography>
      </Box>
      
      {/* Stepper for multi-step */}
      {steps.length > 1 && (
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Job Selection (for job accounts) */}
      {flowResult?.flowType === 'PROMPT_JOB' && step === 0 && (
        <Paper variant="outlined" sx={{ mb: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Select Job Site
            </Typography>
          </Box>
          <Divider />
          <JobSelectList
            jobs={jobs}
            selectedJob={localJob}
            onSelect={handleSelectJob}
          />
        </Paper>
      )}
      
      {/* Division Selection */}
      {(flowResult?.flowType !== 'PROMPT_JOB' || step > 0) && 
       (divisions.length > 1 && (step === 0 || steps.length === 1)) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Select Division
          </Typography>
          <Grid container spacing={2}>
            {divisions.map(division => (
              <Grid item xs={12} md={6} lg={4} key={division.id}>
                <DivisionCard
                  division={division}
                  selected={localDivision?.id === division.id}
                  onSelect={handleSelectDivision}
                  disabled={division.isActive === false}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {/* Single Division Display */}
      {divisions.length === 1 && localDivision && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <BusinessIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {localDivision.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {localDivision.address?.city}, {localDivision.address?.state}
              </Typography>
            </Box>
            <Chip label="Selected" color="primary" size="small" sx={{ ml: 'auto' }} />
          </Box>
        </Paper>
      )}
      
      {/* Ship-To Selection */}
      {((step === 1 && steps.includes('Select Ship-To')) || 
        (shipTos.length > 1 && steps.length === 1) ||
        flowResult?.prompt === 'SHIP_TO_ONLY') && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Select Shipping Address
          </Typography>
          <Grid container spacing={2}>
            {shipTos.map(shipTo => (
              <Grid item xs={12} md={6} key={shipTo.id}>
                <ShipToCard
                  shipTo={shipTo}
                  selected={localShipTo?.id === shipTo.id}
                  onSelect={handleSelectShipTo}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {/* Selected Summary */}
      {localDivision && (localShipTo || shipTos.length <= 1) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'success.light' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Selection Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Division</Typography>
              <Typography variant="body2">{localDivision.name}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Ship-To</Typography>
              <Typography variant="body2">
                {localShipTo?.name || localShipTo?.address?.city || 'Default Address'}
              </Typography>
            </Grid>
            {localDivision.paymentTerms && (
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                <Typography variant="body2">{localDivision.paymentTerms}</Typography>
              </Grid>
            )}
            {localDivision.taxExempt && (
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Tax Status</Typography>
                <Typography variant="body2">Tax Exempt</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleBack}
        >
          {step > 0 ? 'Back' : 'Cancel'}
        </Button>
        
        {step < steps.length - 1 && steps.length > 1 ? (
          <Button
            variant="contained"
            endIcon={<NextIcon />}
            onClick={() => setStep(step + 1)}
            disabled={!localDivision}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={<NextIcon />}
            onClick={() => handleConfirmSelection()}
            disabled={!canProceed}
          >
            Continue to Line Entry
          </Button>
        )}
      </Box>
      
      {/* Info */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          The selected division determines billing address, payment terms, and tax settings. 
          The ship-to address determines shipping destination and tax jurisdiction.
        </Typography>
      </Box>
    </Box>
  );
}

export default DivisionSelectScreen;
