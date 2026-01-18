/**
 * POS Shell Component
 * 
 * Main container for POS workflow with screen flow navigation.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Typography, 
  Button,
  IconButton,
  Alert,
  Snackbar,
  LinearProgress,
  Divider,
  useTheme
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { POSProvider, usePOS } from './POSContext';

// Screen Components
import CustomerLookupScreen from './screens/CustomerLookupScreen';
import NewCustomerScreen from './screens/NewCustomerScreen';
import DivisionSelectScreen from './screens/DivisionSelectScreen';
import LineEntryScreen from './screens/LineEntryScreen';
import OrderReviewScreen from './screens/OrderReviewScreen';
import ShippingScreen from './screens/ShippingScreen';
import PaymentScreen from './screens/PaymentScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';

// ============================================
// SCREEN COMPONENT MAP
// ============================================

const SCREEN_COMPONENTS = {
  customer_lookup: CustomerLookupScreen,
  new_customer: NewCustomerScreen,
  division_select: DivisionSelectScreen,
  line_entry: LineEntryScreen,
  product_search: LineEntryScreen, // Same as line entry with modal open
  order_review: OrderReviewScreen,
  shipping_config: ShippingScreen,
  payment_select: PaymentScreen,
  order_confirmation: ConfirmationScreen,
  // Add more screen mappings as needed
};

// ============================================
// PROGRESS BAR
// ============================================

function POSProgressBar({ screens, currentScreen, progress }) {
  const theme = useTheme();
  
  // Find current step index
  const currentIndex = screens.findIndex(s => s.id === currentScreen?.id);
  
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {/* Progress percentage */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Step {currentIndex + 1} of {screens.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}% Complete
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          backgroundColor: theme.palette.grey[200],
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            backgroundColor: theme.palette.primary.main
          }
        }}
      />
      
      {/* Step indicators */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mt: 1,
        px: 1
      }}>
        {screens.map((screen, index) => (
          <Box 
            key={screen.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: index <= currentIndex ? 1 : 0.5
            }}
          >
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%',
                backgroundColor: index < currentIndex 
                  ? theme.palette.success.main 
                  : index === currentIndex 
                    ? theme.palette.primary.main 
                    : theme.palette.grey[400]
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                mt: 0.5, 
                fontSize: '0.65rem',
                color: index === currentIndex 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary
              }}
            >
              {screen.title}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ============================================
// POS HEADER
// ============================================

function POSHeader({ onClose }) {
  const { customer, division, lines, pricing, currentState } = usePOS();
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Left - Customer Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Point of Sale
          </Typography>
          
          {customer && (
            <>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Customer
                </Typography>
                <Typography variant="subtitle2">
                  {customer.name}
                </Typography>
              </Box>
            </>
          )}
          
          {division && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Division
              </Typography>
              <Typography variant="subtitle2">
                {division.name}
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Right - Cart Summary & Close */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Cart Summary */}
          <Paper 
            variant="outlined" 
            sx={{ 
              px: 2, 
              py: 1, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5 
            }}
          >
            <CartIcon color="primary" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Items
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {lines.length}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                ${(pricing.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Paper>
          
          <IconButton onClick={onClose} size="small" title="Cancel Order">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}

// ============================================
// POS NAVIGATION BAR
// ============================================

function POSNavigationBar({ onPrevious, onNext, canGoBack, canGoNext, isLoading }) {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      <Button
        variant="outlined"
        startIcon={<BackIcon />}
        onClick={onPrevious}
        disabled={!canGoBack || isLoading}
      >
        Back
      </Button>
      
      <Button
        variant="contained"
        endIcon={<NextIcon />}
        onClick={onNext}
        disabled={!canGoNext || isLoading}
      >
        Continue
      </Button>
    </Paper>
  );
}

// ============================================
// MAIN POS CONTENT
// ============================================

function POSContent({ flowId, userId, onClose }) {
  const {
    // State
    sessionId,
    currentState,
    currentScreen,
    screenProgress,
    progress,
    isLoading,
    error,
    
    // Actions
    createSession,
    endSession,
    navigateNext,
    navigatePrevious,
    refreshProgress,
    clearError
  } = usePOS();
  
  const [initialized, setInitialized] = useState(false);
  
  // Initialize session on mount
  useEffect(() => {
    if (!initialized) {
      createSession(userId, 'WALK_IN_CUSTOMER', flowId)
        .then(() => {
          setInitialized(true);
          refreshProgress();
        })
        .catch(console.error);
    }
    
    // Cleanup on unmount
    return () => {
      if (sessionId) {
        endSession();
      }
    };
  }, []);
  
  // Get current screen component
  const ScreenComponent = currentScreen 
    ? SCREEN_COMPONENTS[currentScreen.id] 
    : null;
  
  // Navigation handlers
  const handleNext = useCallback(async () => {
    try {
      await navigateNext();
      await refreshProgress();
    } catch (err) {
      console.error('Navigation error:', err);
    }
  }, [navigateNext, refreshProgress]);
  
  const handlePrevious = useCallback(async () => {
    try {
      await navigatePrevious();
      await refreshProgress();
    } catch (err) {
      console.error('Navigation error:', err);
    }
  }, [navigatePrevious, refreshProgress]);
  
  const handleClose = useCallback(() => {
    endSession();
    onClose?.();
  }, [endSession, onClose]);
  
  // Determine navigation state
  const currentIndex = screenProgress.findIndex(s => s.id === currentScreen?.id);
  const canGoBack = currentIndex > 0 && currentScreen?.backEnabled !== false;
  const canGoNext = currentScreen && !currentScreen.isTerminal;
  
  if (!initialized || !sessionId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>Initializing POS session...</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <POSHeader onClose={handleClose} />
      
      {/* Progress */}
      <Box sx={{ px: 3, pt: 2 }}>
        <POSProgressBar 
          screens={screenProgress} 
          currentScreen={currentScreen}
          progress={progress}
        />
      </Box>
      
      {/* Loading indicator */}
      {isLoading && <LinearProgress />}
      
      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={clearError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      {/* Screen Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {ScreenComponent ? (
          <ScreenComponent 
            screen={currentScreen}
            onNext={handleNext}
            onBack={handlePrevious}
          />
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Screen not found: {currentScreen?.id || 'unknown'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Current workflow state: {currentState}
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* Navigation Bar */}
      {currentScreen && !currentScreen.isTerminal && (
        <POSNavigationBar
          onPrevious={handlePrevious}
          onNext={handleNext}
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          isLoading={isLoading}
        />
      )}
    </Box>
  );
}

// ============================================
// POS SHELL (with Provider)
// ============================================

export function POSShell({ flowId = 'standard_order', userId, onClose }) {
  return (
    <POSProvider>
      <Box 
        sx={{ 
          height: '100vh', 
          width: '100%', 
          backgroundColor: 'grey.100'
        }}
      >
        <POSContent flowId={flowId} userId={userId} onClose={onClose} />
      </Box>
    </POSProvider>
  );
}

export default POSShell;
