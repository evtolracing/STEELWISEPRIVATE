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
  Avatar
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  FlashOn as QuickSaleIcon,
  DirectionsCar as WillCallIcon,
  Description as QuoteIcon,
  ArrowBack as BackIcon
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
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardActionArea 
        onClick={() => onSelect(flow.id)}
        sx={{ height: '100%', p: 2 }}
      >
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64, 
              bgcolor: flow.color,
              mx: 'auto',
              mb: 2
            }}
          >
            <Icon sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" gutterBottom>
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button 
            startIcon={<BackIcon />} 
            href="/"
            sx={{ mb: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" gutterBottom>
            Point of Sale
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a workflow to begin processing an order.
          </Typography>
        </Box>
        
        {/* Flow Selection Grid */}
        <Grid container spacing={3}>
          {POS_FLOWS.map(flow => (
            <Grid item xs={12} sm={6} md={3} key={flow.id}>
              <FlowCard flow={flow} onSelect={handleSelectFlow} />
            </Grid>
          ))}
        </Grid>
        
        {/* Quick Stats (placeholder) */}
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Today's Activity
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">12</Typography>
                <Typography variant="body2" color="text.secondary">Orders Today</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">$24,580</Typography>
                <Typography variant="body2" color="text.secondary">Sales Total</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">5</Typography>
                <Typography variant="body2" color="text.secondary">Will Call Pending</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">3</Typography>
                <Typography variant="body2" color="text.secondary">Quotes Pending</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Keyboard Shortcuts */}
        <Paper sx={{ p: 3, mt: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Keyboard Shortcuts
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                <kbd>F2</kbd> - Standard Order
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                <kbd>F3</kbd> - Quick Sale
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                <kbd>F4</kbd> - Will Call Pickup
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                <kbd>F5</kbd> - Convert Quote
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}

export default POSPage;
