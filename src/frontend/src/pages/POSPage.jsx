/**
 * POS Page
 * 
 * Point of Sale main page with flow selection.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Button,
  Container,
  Avatar,
  Stack,
  alpha,
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  FlashOn as QuickSaleIcon,
  DirectionsCar as WillCallIcon,
  Description as QuoteIcon,
  ArrowBack as BackIcon,
  PointOfSale as POSIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { POSShell } from '../components/pos';

// Available POS flows
const POS_FLOWS = [
  {
    id: 'standard_order',
    title: 'Standard Order',
    description: 'Full order entry with customer, products, shipping, and payment',
    icon: OrderIcon,
    color: '#1976d2'
  },
  {
    id: 'quick_sale',
    title: 'Quick Sale',
    description: 'Fast checkout for walk-in customers with simple items',
    icon: QuickSaleIcon,
    color: '#2e7d32'
  },
  {
    id: 'will_call_pickup',
    title: 'Will Call Pickup',
    description: 'Process customer pickup of pre-staged orders',
    icon: WillCallIcon,
    color: '#ed6c02'
  },
  {
    id: 'quote_conversion',
    title: 'Convert Quote',
    description: 'Convert an existing quote to an order',
    icon: QuoteIcon,
    color: '#9c27b0'
  }
];

// ============================================
// FLOW SELECTION CARD
// ============================================

function FlowCard({ flow, onSelect }) {
  const Icon = flow.icon;
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(flow.color, 0.05)} 0%, ${alpha(flow.color, 0.02)} 100%)`,
        border: `1px solid ${alpha(flow.color, 0.15)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: `0 12px 30px ${alpha(flow.color, 0.25)}`,
          borderColor: alpha(flow.color, 0.4),
        }
      }}
    >
      <CardActionArea 
        onClick={() => onSelect(flow.id)}
        sx={{ height: '100%', p: 2.5 }}
      >
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar 
            sx={{ 
              width: 72, 
              height: 72, 
              background: `linear-gradient(135deg, ${flow.color} 0%, ${alpha(flow.color, 0.7)} 100%)`,
              boxShadow: `0 8px 20px ${alpha(flow.color, 0.4)}`,
              mx: 'auto',
              mb: 2.5
            }}
          >
            <Icon sx={{ fontSize: 36 }} />
          </Avatar>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {flow.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {flow.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ============================================
// POS PAGE
// ============================================

export function POSPage() {
  const [selectedFlow, setSelectedFlow] = useState(null);
  
  // Mock user ID - in production would come from auth context
  const userId = 'user-123';
  
  // Handle flow selection
  const handleSelectFlow = (flowId) => {
    setSelectedFlow(flowId);
  };
  
  // Handle close POS
  const handleClose = () => {
    setSelectedFlow(null);
  };
  
  // If flow is selected, show POS Shell
  if (selectedFlow) {
    return (
      <POSShell 
        flowId={selectedFlow} 
        userId={userId}
        onClose={handleClose}
      />
    );
  }
  
  // Flow selection screen
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)',
      mx: -3,
      mt: -3,
    }}>
      {/* Modern Header */}
      <Box sx={{ 
        px: 3, 
        py: 3, 
        mb: 4,
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
      }}>
        <Container maxWidth="lg" disableGutters>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button 
              startIcon={<BackIcon />} 
              href="/"
              sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Back
            </Button>
            <Avatar sx={{ 
              width: 56, 
              height: 56, 
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}>
              <POSIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                Point of Sale
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Select a workflow to begin processing an order
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
      
      <Container maxWidth="lg">
        {/* Flow Selection Grid */}
        <Grid container spacing={3}>
          {POS_FLOWS.map(flow => (
            <Grid item xs={12} sm={6} md={3} key={flow.id}>
              <FlowCard flow={flow} onSelect={handleSelectFlow} />
            </Grid>
          ))}
        </Grid>
        
        {/* Quick Stats */}
        <Paper sx={{ 
          p: 3, 
          mt: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
          border: '1px solid',
          borderColor: 'divider',
        }}>
          <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 700 }}>
            Today's Activity
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                borderRadius: 3,
                bgcolor: alpha('#1976d2', 0.08),
                border: `1px solid ${alpha('#1976d2', 0.15)}`,
              }}>
                <Typography variant="h4" color="primary.main" fontWeight={700}>12</Typography>
                <Typography variant="body2" color="text.secondary">Orders Today</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                borderRadius: 3,
                bgcolor: alpha('#2e7d32', 0.08),
                border: `1px solid ${alpha('#2e7d32', 0.15)}`,
              }}>
                <Typography variant="h4" color="success.main" fontWeight={700}>$24,580</Typography>
                <Typography variant="body2" color="text.secondary">Sales Total</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                borderRadius: 3,
                bgcolor: alpha('#ed6c02', 0.08),
                border: `1px solid ${alpha('#ed6c02', 0.15)}`,
              }}>
                <Typography variant="h4" color="warning.main" fontWeight={700}>5</Typography>
                <Typography variant="body2" color="text.secondary">Will Call Pending</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                borderRadius: 3,
                bgcolor: alpha('#0288d1', 0.08),
                border: `1px solid ${alpha('#0288d1', 0.15)}`,
              }}>
                <Typography variant="h4" color="info.main" fontWeight={700}>3</Typography>
                <Typography variant="body2" color="text.secondary">Quotes Pending</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Keyboard Shortcuts */}
        <Paper sx={{ 
          p: 3, 
          mt: 2, 
          borderRadius: 3,
          bgcolor: alpha('#1976d2', 0.04),
          border: '1px solid',
          borderColor: 'divider',
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Keyboard Shortcuts
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                <kbd style={{ padding: '2px 6px', borderRadius: 4, background: '#e0e0e0' }}>F2</kbd> - Standard Order
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                <kbd style={{ padding: '2px 6px', borderRadius: 4, background: '#e0e0e0' }}>F3</kbd> - Quick Sale
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                <kbd style={{ padding: '2px 6px', borderRadius: 4, background: '#e0e0e0' }}>F4</kbd> - Will Call Pickup
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                <kbd style={{ padding: '2px 6px', borderRadius: 4, background: '#e0e0e0' }}>F5</kbd> - Convert Quote
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}

export default POSPage;
